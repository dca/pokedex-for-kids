// game-api：注音島的後端。
//
//	game-api serve                                  啟動 HTTP 伺服器（預設）
//	game-api admin reset-password --username NAME   重設密碼（印出臨時密碼與新救援碼）
//
// 環境變數：DATABASE_URL（必填）、PORT（預設 8080）、COOKIE_SECURE（預設 true）、
// GAME_API_TEST_HOOKS（E2E 用，預設關閉）、ARGON2_MEMORY_KIB（預設 65536）
package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"game-api/internal/auth"
	"game-api/internal/content"
	"game-api/internal/migrations"
	"game-api/internal/server"
	"game-api/internal/service"
)

func main() {
	log := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	if err := run(context.Background(), os.Args[1:], log); err != nil {
		fmt.Fprintln(os.Stderr, "錯誤：", err)
		os.Exit(1)
	}
}

func run(ctx context.Context, args []string, log *slog.Logger) error {
	cmd := "serve"
	if len(args) > 0 {
		cmd, args = args[0], args[1:]
	}
	switch cmd {
	case "serve":
		return serve(ctx, log)
	case "admin":
		return admin(ctx, args, os.Stdout)
	default:
		return fmt.Errorf("未知的指令 %q（可用：serve、admin）", cmd)
	}
}

func setup(ctx context.Context) (*service.Service, *pgxpool.Pool, error) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		return nil, nil, errors.New("請設定 DATABASE_URL")
	}
	pool, err := connect(ctx, dsn)
	if err != nil {
		return nil, nil, err
	}
	if err := migrations.Up(ctx, pool); err != nil {
		pool.Close()
		return nil, nil, err
	}
	c, err := content.Load()
	if err != nil {
		pool.Close()
		return nil, nil, err
	}
	params := auth.DefaultParams
	if v, err := strconv.Atoi(os.Getenv("ARGON2_MEMORY_KIB")); err == nil && v > 0 {
		params.Memory = uint32(v)
	}
	return service.New(pool, c, params), pool, nil
}

// connect 等待資料庫就緒（compose 啟動時 Postgres 可能還沒準備好）。
func connect(ctx context.Context, dsn string) (*pgxpool.Pool, error) {
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return nil, err
	}
	for i := 0; i < 30; i++ {
		if err = pool.Ping(ctx); err == nil {
			return pool, nil
		}
		time.Sleep(time.Second)
	}
	pool.Close()
	return nil, fmt.Errorf("連不上資料庫：%w", err)
}

func serve(ctx context.Context, log *slog.Logger) error {
	ctx, stop := signal.NotifyContext(ctx, os.Interrupt, syscall.SIGTERM)
	defer stop()

	svc, pool, err := setup(ctx)
	if err != nil {
		return err
	}
	defer pool.Close()

	handler, err := server.New(svc, server.Options{
		CookieSecure: os.Getenv("COOKIE_SECURE") != "false",
		TestHooks:    os.Getenv("GAME_API_TEST_HOOKS") == "1",
		Logger:       log,
	})
	if err != nil {
		return err
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	srv := &http.Server{Addr: ":" + port, Handler: handler, ReadHeaderTimeout: 10 * time.Second}

	go cleanupLoop(ctx, svc, log)
	go func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		_ = srv.Shutdown(shutdownCtx)
	}()
	log.Info("game-api 啟動", "port", port)
	if err := srv.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	return nil
}

// cleanupLoop 每天清理過期的 session、未完成的遭遇與 180 天沒用的訪客。
func cleanupLoop(ctx context.Context, svc *service.Service, log *slog.Logger) {
	tick := time.NewTicker(24 * time.Hour)
	defer tick.Stop()
	for {
		if n, err := svc.Cleanup(ctx); err != nil {
			log.Error("清理失敗", "err", err)
		} else {
			log.Info("清理完成", "deleted", n)
		}
		select {
		case <-ctx.Done():
			return
		case <-tick.C:
		}
	}
}

func admin(ctx context.Context, args []string, out *os.File) error {
	if len(args) == 0 || args[0] != "reset-password" {
		return errors.New("用法：game-api admin reset-password --username NAME")
	}
	fs := flag.NewFlagSet("reset-password", flag.ContinueOnError)
	username := fs.String("username", "", "帳號名稱")
	if err := fs.Parse(args[1:]); err != nil {
		return err
	}
	if *username == "" {
		return errors.New("請指定 --username")
	}
	svc, pool, err := setup(ctx)
	if err != nil {
		return err
	}
	defer pool.Close()
	pw, rescue, err := svc.AdminResetPassword(ctx, *username)
	if err != nil {
		return err
	}
	fmt.Fprintf(out, "已重設 %s 的密碼，所有裝置都已登出。\n臨時密碼：%s\n新的救援碼：%s\n請家長登入後保存新的救援碼。\n", *username, pw, rescue)
	return nil
}
