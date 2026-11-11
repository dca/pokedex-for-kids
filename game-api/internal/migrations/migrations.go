// Package migrations 以 goose 執行嵌入的資料庫遷移檔。
package migrations

import (
	"context"
	"database/sql"
	"embed"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"
)

//go:embed *.sql
var files embed.FS

// Up 把資料庫遷移到最新版本。
func Up(ctx context.Context, pool *pgxpool.Pool) error {
	db := stdlib.OpenDBFromPool(pool)
	defer db.Close()
	return up(ctx, db)
}

func up(ctx context.Context, db *sql.DB) error {
	provider, err := goose.NewProvider(goose.DialectPostgres, db, files)
	if err != nil {
		return fmt.Errorf("建立 goose provider：%w", err)
	}
	if _, err := provider.Up(ctx); err != nil {
		return fmt.Errorf("執行遷移：%w", err)
	}
	return nil
}
