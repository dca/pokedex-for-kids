# pokedex-for-kids Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-11-11

## Active Technologies

- TypeScript 5.x (最新穩定版), Node.js 20.x LTS (001-pokemon-audio-pokedex)
- TypeScript 5.9 + Next.js 15 靜態輸出 + React 19 + three / @react-three/fiber 9 / drei + zustand；Go 1.26 + pgx v5 + sqlc + goose + oapi-codegen；Postgres 17；Docker Compose + Caddy (002-zhuyin-island-game)

## Project Structure

```text
pokedex-for-kids-web/   # 前端：src/api（API client，斷線自動重送）、src/game（題目判斷）、src/scene（3D）、
                        #       src/components + containers（2D 介面）、src/stores（zustand）、src/audio
                        #       scripts/（產生內容、音檔、貼紙）、data/（來源資料與真人錄音）、e2e/（Playwright）
game-api/               # Go 後端：帳號、小朋友檔案、出題、結算、熟練度（openapi.yaml 為 API 單一來源）
crawlers/               # 舊版圖鑑的 Go 爬蟲與 TTS 音檔產生
deploy/                 # Docker Compose（目前只有開發用的 compose.dev.yml）
specs/                  # 規格、計畫、任務（002-zhuyin-island-game）
```

遊戲資料全部存在伺服器，規則由伺服器計算；前端沒有離線模式，也不在瀏覽器存進度。
未登入時使用伺服器上的訪客帳號。

## Commands

cd pokedex-for-kids-web && npm run test:ci && npm run lint && npm run typecheck
cd game-api && go vet ./... && go test ./...          # 需要 Docker（testcontainers）
docker compose -f deploy/compose.dev.yml up -d --build && cd pokedex-for-kids-web && npm run build:e2e && npm run e2e
cd pokedex-for-kids-web && npm run dev                # http://localhost:3200，/api 轉到 localhost:18080

本機連接埠：前端 3200、API 18080、Postgres 55432（3000、8080、5432 被其他服務占用）。
改了 game-api/openapi.yaml 後：cd game-api && make generate，再 cd pokedex-for-kids-web && npm run api-types。
改了 data/ 下的內容後：npm run content（同時輸出到 public/data/ 與 game-api/internal/content/data/）。

## Code Style

TypeScript 5.x (最新穩定版), Node.js 20.x LTS: Follow standard conventions

## Recent Changes

- 002-zhuyin-island-game: 轉型為注音 3D 學習遊戲；新增 Go 後端 game-api（伺服器計算所有規則）、Postgres、訪客帳號

- 001-pokemon-audio-pokedex: Added TypeScript 5.x (最新穩定版), Node.js 20.x LTS

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
