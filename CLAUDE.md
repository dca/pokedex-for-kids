# pokedex-for-kids Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-11-06

## Active Technologies

- TypeScript 5.x (最新穩定版), Node.js 20.x LTS (001-pokemon-audio-pokedex)
- TypeScript 5.9 + Next.js 15 靜態輸出 + React 19 + three / @react-three/fiber 9 / drei + zustand + idb；Go 1.23 + pgx v5 + sqlc + goose + oapi-codegen；Postgres 17；Docker Compose + Caddy (002-zhuyin-island-game)

## Project Structure

```text
pokedex-for-kids-web/   # 前端：src/game（純邏輯）、src/scene（3D）、src/components + containers（2D）、src/sync
game-api/               # Go 後端：帳號、小朋友檔案、事件同步（openapi.yaml 為 API 單一來源）
crawlers/               # Go 爬蟲與 TTS 音檔產生
deploy/                 # Docker Compose、Caddyfile
```

## Commands

cd pokedex-for-kids-web && npm run test:ci && npm run lint
cd game-api && go test ./...

## Code Style

TypeScript 5.x (最新穩定版), Node.js 20.x LTS: Follow standard conventions

## Recent Changes

- 002-zhuyin-island-game: 轉型為注音 3D 學習遊戲；新增 Go 後端 game-api、Postgres、事件溯源同步

- 001-pokemon-audio-pokedex: Added TypeScript 5.x (最新穩定版), Node.js 20.x LTS

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
