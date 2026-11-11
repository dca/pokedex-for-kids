package server

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"math/rand/v2"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"sync"
	"testing"
	"time"

	"github.com/getkin/kin-openapi/openapi3filter"
	"github.com/getkin/kin-openapi/routers"
	"github.com/getkin/kin-openapi/routers/gorillamux"

	"game-api/internal/api"
	"game-api/internal/auth"
	"game-api/internal/content"
	"game-api/internal/service"
	"game-api/internal/testutil"
)

var testContent = content.MustLoad()

type env struct {
	t   *testing.T
	srv *httptest.Server
	svc *service.Service
	now time.Time
}

func newEnv(t *testing.T) *env {
	t.Helper()
	pool := testutil.DB(t)
	svc := service.New(pool, testContent, auth.TestParams)
	e := &env{t: t, svc: svc, now: time.Date(2026, 11, 6, 9, 0, 0, 0, time.UTC)}
	svc.Now = func() time.Time { return e.now }
	seed := uint64(1)
	svc.NewRand = func() *rand.Rand { seed++; return rand.New(rand.NewPCG(seed, 7)) }
	h, err := New(svc, Options{CookieSecure: true, TestHooks: true})
	if err != nil {
		t.Fatal(err)
	}
	e.srv = httptest.NewTLSServer(h)
	t.Cleanup(e.srv.Close)
	return e
}

// client 模擬一台裝置（各自的 cookie）。
type client struct {
	e    *env
	http *http.Client
}

func (e *env) device() *client {
	jar, _ := cookiejar.New(nil)
	// srv.Client() 每次回傳同一個 *http.Client，必須建立新的才能有各自的 cookie
	hc := &http.Client{Transport: e.srv.Client().Transport, Jar: jar}
	return &client{e: e, http: hc}
}

type resp struct {
	Status int
	Header http.Header
	Body   []byte
}

func (r resp) decode(t *testing.T, v any) {
	t.Helper()
	if err := json.Unmarshal(r.Body, v); err != nil {
		t.Fatalf("解析回應失敗：%v\n%s", err, r.Body)
	}
}

func (r resp) errCode(t *testing.T) string {
	t.Helper()
	var e api.Error
	r.decode(t, &e)
	return string(e.Code)
}

func (c *client) do(method, path string, body any, headers ...string) resp {
	c.e.t.Helper()
	var rd io.Reader
	if body != nil {
		b, _ := json.Marshal(body)
		rd = bytes.NewReader(b)
	}
	req, _ := http.NewRequest(method, c.e.srv.URL+"/api/v1"+path, rd)
	if method != http.MethodGet {
		req.Header.Set("Content-Type", "application/json")
	}
	for i := 0; i+1 < len(headers); i += 2 {
		req.Header.Set(headers[i], headers[i+1])
	}
	res, err := c.http.Do(req)
	if err != nil {
		c.e.t.Fatal(err)
	}
	defer res.Body.Close()
	b, _ := io.ReadAll(res.Body)
	validateContract(c.e.t, req, res, b)
	return resp{Status: res.StatusCode, Header: res.Header, Body: b}
}

var (
	routerOnce sync.Once
	router     routers.Router
)

// validateContract 是合約測試：每個回應都必須符合 openapi.yaml（狀態碼、標頭、body 結構）。
func validateContract(t *testing.T, req *http.Request, res *http.Response, body []byte) {
	t.Helper()
	routerOnce.Do(func() {
		spec, err := api.GetSwagger()
		if err != nil {
			t.Fatal(err)
		}
		spec.Servers = nil
		for path, item := range spec.Paths.Map() {
			spec.Paths.Delete(path)
			spec.Paths.Set("/api/v1"+path, item)
		}
		if router, err = gorillamux.NewRouter(spec); err != nil {
			t.Fatal(err)
		}
	})
	r := req.Clone(context.Background())
	r.URL.Scheme, r.URL.Host = "", ""
	route, params, err := router.FindRoute(r)
	if err != nil {
		t.Fatalf("合約：找不到 %s %s 的定義：%v", req.Method, req.URL.Path, err)
	}
	if res.StatusCode == http.StatusUnsupportedMediaType {
		return // 中介層在路由前拒絕，不屬於各端點的合約
	}
	in := &openapi3filter.RequestValidationInput{Request: r, PathParams: params, Route: route,
		Options: &openapi3filter.Options{AuthenticationFunc: openapi3filter.NoopAuthenticationFunc}}
	out := &openapi3filter.ResponseValidationInput{
		RequestValidationInput: in, Status: res.StatusCode, Header: res.Header,
		Options: &openapi3filter.Options{IncludeResponseStatus: true},
	}
	out.SetBodyBytes(body)
	if err := openapi3filter.ValidateResponse(context.Background(), out); err != nil {
		t.Fatalf("合約：%s %s 回應 %d 不符合 openapi.yaml：%v\n%s", req.Method, req.URL.Path, res.StatusCode, err, body)
	}
}

func (c *client) expect(status int, method, path string, body any, headers ...string) resp {
	c.e.t.Helper()
	r := c.do(method, path, body, headers...)
	if r.Status != status {
		c.e.t.Fatalf("%s %s：狀態 %d，想要 %d\n%s", method, path, r.Status, status, r.Body)
	}
	return r
}

// guest 以訪客身分開始並回傳預設的小朋友 ID。
func (c *client) guest() api.Me {
	var me api.Me
	c.expect(201, "POST", "/auth/guest", nil).decode(c.e.t, &me)
	return me
}

func (c *client) choosePartner(childID string, id int) {
	c.expect(200, "POST", "/children/"+childID+"/partner", map[string]int{"pokemonId": id})
}

func (c *client) encounter(childID string, zone string, kind string, headers ...string) api.Encounter {
	var e api.Encounter
	c.expect(201, "POST", "/children/"+childID+"/encounters", map[string]string{"zone": zone, "kind": kind}, headers...).decode(c.e.t, &e)
	return e
}

func (c *client) answer(encID string, index, wrong int) {
	c.expect(204, "PUT", "/encounters/"+encID+"/answers/"+itoa(index), map[string]int{"wrongCount": wrong, "durationMs": 1200})
}

func (c *client) complete(encID string) api.EncounterResult {
	var r api.EncounterResult
	c.expect(200, "POST", "/encounters/"+encID+"/complete", nil).decode(c.e.t, &r)
	return r
}

// play 完成一次遭遇，每題答錯 wrong 次。
func (c *client) play(childID, zone string, wrong int, headers ...string) (api.Encounter, api.EncounterResult) {
	e := c.encounter(childID, zone, "wild", headers...)
	for i := range e.Questions {
		c.answer(e.Id.String(), i, wrong)
	}
	return e, c.complete(e.Id.String())
}

func (c *client) state(childID string) api.ChildState {
	var s api.ChildState
	c.expect(200, "GET", "/children/"+childID+"/state", nil).decode(c.e.t, &s)
	return s
}

func itoa(i int) string { return string(rune('0' + i)) }
