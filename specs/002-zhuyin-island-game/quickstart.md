# Quickstart：注音島本機開發

**Feature**: [spec.md](./spec.md) ・ **Plan**: [plan.md](./plan.md)

> 這份文件描述實作完成後的開發流程，指令會在對應的任務完成後才可以使用。

## 需要的工具

| 工具 | 版本 |
|---|---|
| Node.js | 20 LTS 以上 |
| Go | 1.23 以上 |
| Docker | 含 Docker Compose v2 |
| sqlc、goose、oapi-codegen | 由 `make tools` 安裝到 `game-api/bin/` |

## 第一次啟動

```bash
# 1. 啟動資料庫與 API（API 啟動時自動執行資料庫遷移）
docker compose -f deploy/compose.dev.yml up -d
curl http://localhost:8080/api/v1/healthz        # → {"ok":true}

# 2. 產生靜態內容與型別
cd pokedex-for-kids-web
npm ci
npm run content        # 產生 public/data/gen1.json、zones.json、audio.json，並驗證涵蓋率
npm run api-types      # 從 game-api/openapi.yaml 產生 src/sync/api-types.ts

# 3. 啟動前端（/api 會轉到 localhost:8080）
npm run dev            # → http://localhost:3000
```

音檔需要 Google Cloud TTS 憑證才能重新產生，平常不需要，產生好的音檔會提交到 repo：

```bash
cd crawlers
go run ./cmd/synthesize-zhuyin    # 產生 sym、tone、syl、prompt 音檔與 data/audio/review.md
```

## 測試

```bash
# 前端：遊戲邏輯與元件
cd pokedex-for-kids-web
npm run test:ci

# 後端：單元測試與使用 testcontainers 的整合測試（需要 Docker）
cd game-api
go test ./...

# 端到端：啟動完整環境後跑 Playwright
docker compose -f deploy/compose.dev.yml up -d
cd pokedex-for-kids-web
npm run build:e2e && npm run e2e
```

## 驗證主要情境

以下情境對應 spec 的 Independent Test，Playwright 會自動執行，也可以手動照著做：

1. **US1 試玩收服**
   - 打開 http://localhost:3000，按「開始」，選擇「先試玩」，選一隻夥伴。
   - 走進晃動的草叢，答題、收服。
   - 打開收集冊，確認多了一隻。
2. **US2 區域**
   - 進入家長區，答對門檻題，開放全部區域。
   - 分別走到四個區域遭遇寶可夢，確認題型不同。
3. **US3 自動調整**
   - 在新手草原刻意答錯 ㄆ 兩次。
   - 接下來 5 次遭遇中，至少一次練到 ㄆ。
4. **US5 跨裝置**
   - 註冊帳號，記下救援碼，建立兩個小朋友並各玩一次。
   - 開一個無痕視窗登入，確認進度一致。
   - 在開發者工具切成離線玩一次，再恢復網路，確認原視窗重新整理後也看得到。
5. **重設密碼**
   - 用救援碼重設密碼，確認舊救援碼失效。
   - 也可以由管理者重設：

     ```bash
     docker compose -f deploy/compose.dev.yml exec game-api game-api admin reset-password --username 帳號名稱
     ```

## 部署到 VPS（本機驗證通過後）

```bash
# VPS 上
git clone … && cd pokedex-for-kids
cp deploy/.env.example deploy/.env     # 設定網域、資料庫密碼
docker compose -f deploy/compose.yml up -d --build
```

`deploy/compose.yml` 包含以下服務：
- `caddy`：自動 HTTPS，提供 `out/` 靜態檔，`/api` 轉給 game-api
- `game-api`
- `postgres`
- `backup`：每天執行 `pg_dump`，保留 7 天
