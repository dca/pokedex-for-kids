# Quickstart：注音島本機開發

**Feature**: [spec.md](./spec.md) ・ **Plan**: [plan.md](./plan.md)

> 這份文件描述實作完成後的開發流程，指令會在對應的任務完成後才可以使用。

## 需要的工具

| 工具 | 版本 |
|---|---|
| Node.js | 20 LTS 以上 |
| Go | 1.26 以上（套件要求；舊版 Go 會自動下載對應的 toolchain） |
| Docker | 含 Docker Compose v2 |
| sqlc、goose、oapi-codegen | 由 `make tools` 安裝到 `game-api/bin/` |

## 第一次啟動

```bash
# 1. 先產生靜態內容（API 會嵌入），再啟動資料庫與 API（API 啟動時自動執行資料庫遷移）
(cd pokedex-for-kids-web && npm ci && npm run content)
docker compose -f deploy/compose.dev.yml up -d
curl http://localhost:18080/api/v1/healthz       # → {"ok":true}（本機 8080、5432 常被占用，所以改用 18080、55432）

# npm run content 會產生 gen1.json、zones.json、confusables.json、audio.json，
# 同時輸出到 public/data/ 與 game-api/internal/content/data/

# 2. 產生 API 型別
cd pokedex-for-kids-web
npm run api-types      # 從 game-api/openapi.yaml 產生 src/api/types.ts

# 3. 啟動前端（/api 會轉到 localhost:18080）
npm run dev            # → http://localhost:3200（3000 常被其他服務占用）
```

音檔需要 Google Cloud TTS 憑證才能重新產生，平常不需要，產生好的音檔會提交到 repo：

```bash
cd pokedex-for-kids-web
npm run audio                     # 用 macOS 內建語音產生暫用音檔（目前提交的版本）
npm run audio -- --engine google --force   # 用 Google Cloud TTS 重新產生（需要 gcloud 登入，會產生費用）
npm run stickers                  # 下載 151 張官方圖片並做成貼紙
npm run font                      # 字型子集化
```

## 測試

```bash
# 前端：遊戲邏輯與元件
cd pokedex-for-kids-web
npm run test:ci

# 後端：遊戲規則單元測試與使用 testcontainers 的整合測試（需要 Docker）
cd game-api
go test ./...

# 端到端：啟動完整環境後跑 Playwright
docker compose -f deploy/compose.dev.yml up -d
cd pokedex-for-kids-web
npm run build:e2e && npm run e2e   # 三種裝置：desktop、ipad、iphone
```

## 驗證主要情境

以下情境對應 spec 的 Independent Test，Playwright 會自動執行，也可以手動照著做：

1. **US1 訪客收服**：打開 http://localhost:3200，按「開始」（自動成為訪客），選一隻夥伴；走進晃動的草叢，答題、收服；打開收集冊確認多了一隻。
2. **US2 區域**：在帳號頁建立起始階段為「認字」的小朋友檔案（四區都開放）；分別走到四個區域遭遇寶可夢，確認題型不同；完成一次道館挑戰拿到徽章。
3. **US3 自動調整**：在新手草原刻意答錯 ㄆ 兩次，接下來 5 次遭遇中至少一次練到 ㄆ。
4. **US4 收集冊與夥伴**：收服幾隻後打開收集冊，點已收服的寶可夢重聽中英文發音。
5. **US5 帳號**：以訪客玩幾次後註冊，記下救援碼，確認進度保留；建立第二個小朋友並玩一次；開一個無痕視窗登入，確認兩個檔案的進度一致；用開發者工具把網路切成離線再恢復，確認畫面顯示「連線中」並自動繼續。
6. **重設密碼**：用救援碼重設密碼，確認舊救援碼失效。管理者重設：

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
