// Package server 組合 HTTP 路由、中介層與 handler。
package server

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/getkin/kin-openapi/openapi3filter"
	middleware "github.com/oapi-codegen/nethttp-middleware"

	"game-api/internal/api"
	"game-api/internal/apperr"
	"game-api/internal/service"
)

const (
	CookieName  = "zi_session"
	cookiePath  = "/api"
	maxBodySize = 1 << 20
)

type Options struct {
	// CookieSecure 在 HTTPS 下為 true；本機用 http 開發時設為 false
	CookieSecure bool
	// TestHooks 開啟時接受 X-Test-Pokemon 標頭（E2E 用，正式環境關閉）
	TestHooks bool
	Logger    *slog.Logger
}

type ctxKey int

const (
	keySession ctxKey = iota
	keyWriter
	keyForcePokemon
)

// New 回傳整個 API 的 http.Handler（路徑前綴 /api/v1）。
func New(svc *service.Service, opts Options) (http.Handler, error) {
	if opts.Logger == nil {
		opts.Logger = slog.Default()
	}
	spec, err := api.GetSwagger()
	if err != nil {
		return nil, err
	}
	// 驗證器用完整路徑比對，所以把相對的 server 網址改成以 /api/v1 為前綴
	spec.Servers = nil
	paths := spec.Paths.Map()
	for path, item := range paths {
		spec.Paths.Delete(path)
		spec.Paths.Set("/api/v1"+path, item)
	}
	validator := middleware.OapiRequestValidatorWithOptions(spec, &middleware.Options{
		Options: openapi3filter.Options{
			AuthenticationFunc: openapi3filter.NoopAuthenticationFunc,
			MultiError:         false,
		},
		ErrorHandlerWithOpts: func(ctx context.Context, err error, w http.ResponseWriter, r *http.Request, o middleware.ErrorHandlerOpts) {
			writeError(w, apperr.Validation("欄位格式不正確："+firstLine(err.Error())))
		},
	})

	h := &handlers{svc: svc, opts: opts}
	strict := api.NewStrictHandlerWithOptions(h, nil, api.StrictHTTPServerOptions{
		RequestErrorHandlerFunc: func(w http.ResponseWriter, r *http.Request, err error) {
			writeError(w, apperr.Validation("請求格式不正確"))
		},
		ResponseErrorHandlerFunc: func(w http.ResponseWriter, r *http.Request, err error) {
			e := apperr.As(err)
			if e.Status >= 500 {
				opts.Logger.Error("處理請求失敗", "method", r.Method, "path", r.URL.Path, "err", err)
			}
			writeError(w, e)
		},
	})
	mux := http.NewServeMux()
	routes := api.HandlerWithOptions(strict, api.StdHTTPServerOptions{BaseURL: "/api/v1", BaseRouter: mux})

	var handler http.Handler = routes
	handler = validator(handler)
	handler = h.sessionMiddleware(handler)
	handler = requireJSON(handler)
	handler = limitBody(handler)
	handler = logRequests(opts.Logger, handler)
	return handler, nil
}

func firstLine(s string) string {
	if i := strings.IndexByte(s, '\n'); i >= 0 {
		return s[:i]
	}
	return s
}

func writeError(w http.ResponseWriter, e *apperr.Error) {
	if e.RetryAfter > 0 {
		w.Header().Set("Retry-After", strconv.Itoa(e.RetryAfter))
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(e.Status)
	_ = json.NewEncoder(w).Encode(api.Error{Code: api.ErrorCode(e.Code), Message: e.Message})
}

// requireJSON：寫入請求必須宣告 application/json。跨站的表單無法送出這種請求，所以不需要另外的 CSRF token。
func requireJSON(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet && r.Method != http.MethodHead && r.Method != http.MethodOptions {
			if !strings.HasPrefix(r.Header.Get("Content-Type"), "application/json") {
				writeError(w, apperr.UnsupportedMedia)
				return
			}
		}
		next.ServeHTTP(w, r)
	})
}

func limitBody(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		r.Body = http.MaxBytesReader(w, r.Body, maxBodySize)
		next.ServeHTTP(w, r)
	})
}

type statusWriter struct {
	http.ResponseWriter
	status int
}

func (s *statusWriter) WriteHeader(code int) {
	s.status = code
	s.ResponseWriter.WriteHeader(code)
}

// logRequests 記錄方法、路徑、狀態與耗時；不記錄 body 與 cookie（避免記到密碼與 token）。
func logRequests(log *slog.Logger, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		sw := &statusWriter{ResponseWriter: w, status: 200}
		defer func() {
			if rec := recover(); rec != nil {
				log.Error("panic", "path", r.URL.Path, "panic", rec)
				writeError(sw, apperr.As(errors.New("panic")))
			}
			log.Info("request", "method", r.Method, "path", r.URL.Path, "status", sw.status, "ms", time.Since(start).Milliseconds())
		}()
		next.ServeHTTP(sw, r)
	})
}

// sessionMiddleware 從 cookie 載入 session，並把 ResponseWriter 放進 context 讓 handler 設定 cookie。
func (h *handlers) sessionMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(r.Context(), keyWriter, w)
		if c, err := r.Cookie(CookieName); err == nil && c.Value != "" {
			sess, extended, err := h.svc.LoadSession(ctx, c.Value)
			if err != nil {
				writeError(w, apperr.As(err))
				return
			}
			if sess != nil {
				ctx = context.WithValue(ctx, keySession, sess)
				if extended != nil {
					h.setCookie(w, c.Value, *extended)
				}
			}
		}
		if h.opts.TestHooks {
			if id, err := strconv.Atoi(r.Header.Get("X-Test-Pokemon")); err == nil {
				ctx = context.WithValue(ctx, keyForcePokemon, id)
			}
		}
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (h *handlers) cookie(token string, expires time.Time) *http.Cookie {
	return &http.Cookie{
		Name: CookieName, Value: token, Path: cookiePath, Expires: expires,
		MaxAge: int(time.Until(expires).Seconds()), HttpOnly: true, Secure: h.opts.CookieSecure, SameSite: http.SameSiteLaxMode,
	}
}

func (h *handlers) setCookie(w http.ResponseWriter, token string, expires time.Time) {
	http.SetCookie(w, h.cookie(token, expires))
}

// cookieString 給宣告了 Set-Cookie 標頭的回應使用（產生的程式碼會直接覆寫這個標頭）。
func (h *handlers) cookieString(issued *service.Issued) string {
	return h.cookie(issued.Token, issued.ExpiresAt).String()
}

func (h *handlers) clearCookie(ctx context.Context) {
	if w, ok := ctx.Value(keyWriter).(http.ResponseWriter); ok {
		http.SetCookie(w, &http.Cookie{Name: CookieName, Value: "", Path: cookiePath, MaxAge: -1, HttpOnly: true, Secure: h.opts.CookieSecure, SameSite: http.SameSiteLaxMode})
	}
}

func sessionFrom(ctx context.Context) *service.Session {
	s, _ := ctx.Value(keySession).(*service.Session)
	return s
}

func forcePokemon(ctx context.Context) int {
	id, _ := ctx.Value(keyForcePokemon).(int)
	return id
}
