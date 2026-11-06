BIN := $(CURDIR)/bin

.PHONY: tools generate test lint run

tools: ## 安裝程式碼產生工具到 bin/
	GOBIN=$(BIN) go install github.com/sqlc-dev/sqlc/cmd/sqlc@v1.29.0
	GOBIN=$(BIN) go install github.com/oapi-codegen/oapi-codegen/v2/cmd/oapi-codegen@v2.4.1

generate: ## 依 openapi.yaml 與 SQL 重新產生程式碼
	$(BIN)/sqlc generate
	$(BIN)/oapi-codegen -config oapi-codegen.yaml openapi.yaml

test: ## 單元測試與整合測試（需要 Docker）
	go test ./...

lint:
	go vet ./...

run: ## 連本機 compose 的資料庫啟動
	DATABASE_URL=postgres://zhuyin:zhuyin@localhost:55432/zhuyin?sslmode=disable COOKIE_SECURE=false go run ./cmd/game-api serve
