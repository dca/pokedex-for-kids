// Package testutil 提供整合測試用的 Postgres（testcontainers）。
package testutil

import (
	"context"
	"fmt"
	"os"
	"sync"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"

	"game-api/internal/migrations"
)

var (
	once      sync.Once
	container *postgres.PostgresContainer
	baseDSN   string
	initErr error
	counter int
	mu      sync.Mutex
)

// DB 回傳一個已遷移的新資料庫。同一個 package 的測試共用一個容器，每次呼叫建立獨立的資料庫。
func DB(t *testing.T) *pgxpool.Pool {
	t.Helper()
	ctx := context.Background()
	once.Do(func() {
		// ryuk（testcontainers 的清理容器）在部分 Docker 環境會卡住；改由 Shutdown 自行關閉容器
		if os.Getenv("TESTCONTAINERS_RYUK_DISABLED") == "" {
			_ = os.Setenv("TESTCONTAINERS_RYUK_DISABLED", "true")
		}
		c, err := postgres.Run(ctx, "postgres:17-alpine",
			postgres.WithDatabase("postgres"), postgres.WithUsername("test"), postgres.WithPassword("test"),
			testcontainers.WithWaitStrategy(wait.ForLog("database system is ready to accept connections").WithOccurrence(2).WithStartupTimeout(60*time.Second)),
		)
		if err != nil {
			initErr = err
			return
		}
		container = c
		baseDSN, initErr = c.ConnectionString(ctx, "sslmode=disable")
	})
	if initErr != nil {
		t.Fatalf("啟動 Postgres 容器：%v（需要 Docker）", initErr)
	}
	mu.Lock()
	counter++
	name := fmt.Sprintf("t%d_%d", time.Now().UnixNano()%1e6, counter)
	mu.Unlock()

	admin, err := pgxpool.New(ctx, baseDSN)
	if err != nil {
		t.Fatal(err)
	}
	defer admin.Close()
	if _, err := admin.Exec(ctx, "CREATE DATABASE "+name); err != nil {
		t.Fatal(err)
	}
	cfg, err := pgxpool.ParseConfig(baseDSN)
	if err != nil {
		t.Fatal(err)
	}
	cfg.ConnConfig.Database = name
	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		t.Fatal(err)
	}
	if err := migrations.Up(ctx, pool); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(pool.Close)
	return pool
}

// Main 用於各 package 的 TestMain：跑完測試後關閉容器。
func Main(m interface{ Run() int }) {
	code := m.Run()
	if container != nil {
		_ = container.Terminate(context.Background())
	}
	os.Exit(code)
}
