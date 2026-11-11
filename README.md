# 注音島（pokedex-for-kids）

跟寶可夢一起學注音的網頁 3D 遊戲，給大班到國小三年級的小朋友玩。非營利的個人專案。

小朋友在一座浮在雲上的小島探索，走進晃動的草叢會遇到寶可夢，答對 1～3 題注音題目就能收服，收進 151 格的收集冊。

- **三個學習階段**：學注音（認識 37 個符號與聲調）、拼注音（補符號、補聲調、拼出名稱）、認字。
- **四個區域**：新手草原、泡泡海灘、拼音森林、文字山丘，學完一區開放下一區，每區有道館挑戰和徽章。
- **答錯不懲罰**：寶可夢不會逃走，答錯的項目之後會更常出現（間隔重複）。
- **全程有語音**：注音符號和音節使用教育部的真人錄音，不識字也能玩。
- **支援平板、電腦、手機**：介面和鏡頭會隨視窗大小調整。
- **家長帳號**：帳號名稱加密碼，不需要 email；底下可以有多個小朋友檔案，進度存在伺服器，換裝置也能繼續玩。不註冊也能先用訪客身分玩。

## 架構

| 目錄 | 內容 |
|---|---|
| `pokedex-for-kids-web/` | 前端：Next.js 15 靜態輸出、React 19、TypeScript、three.js（@react-three/fiber）、zustand |
| `game-api/` | 後端：Go、Postgres 17（pgx、sqlc、goose），API 由 `openapi.yaml` 產生型別 |
| `deploy/` | Docker Compose（目前只有開發用的設定） |
| `specs/002-zhuyin-island-game/` | 規格、計畫、任務清單 |
| `crawlers/` | 舊版圖鑑使用的爬蟲與語音產生工具 |

遊戲資料全部存在伺服器，出題、結算、熟練度都由伺服器計算，所以遊戲需要連線，沒有離線模式。

## 本機啟動

需要 Node.js 20 以上、Docker（含 Compose v2）。要改後端的話還需要 Go 1.26 以上。

```bash
# 1. 啟動資料庫與 API（API 啟動時會自動建立資料表）
docker compose -f deploy/compose.dev.yml up -d --build
curl http://localhost:18080/api/v1/healthz     # → {"ok":true}

# 2. 啟動前端
cd pokedex-for-kids-web
npm ci
npm run dev                                    # → http://localhost:3200
```

本機使用的連接埠：前端 3200、API 18080、Postgres 55432。

更完整的說明（重新產生內容、音檔、貼紙、API 型別）在 [`specs/002-zhuyin-island-game/quickstart.md`](specs/002-zhuyin-island-game/quickstart.md)。

## 測試

```bash
# 前端：單元測試、lint、型別檢查
cd pokedex-for-kids-web
npm run test:ci && npm run lint && npm run typecheck

# 後端：單元測試與整合測試（需要 Docker）
cd game-api
go vet ./... && go test ./...

# 端到端：桌面、iPad、iPhone 三種裝置（需要先啟動上面的 Docker Compose）
cd pokedex-for-kids-web
npm run build:e2e && npm run e2e
```

GitHub Actions 會在每個 PR 上跑前端和後端的測試；端到端測試目前只在本機跑。

## 目前狀態

遊戲功能已完成，還沒有正式部署。待辦事項記在 [`specs/002-zhuyin-island-game/tasks.md`](specs/002-zhuyin-island-game/tasks.md) 最後的「後續待辦」：

- 寶可夢名稱的發音目前是 Google TTS，之後要改用教育部的真人發音。
- 部署到自己的主機（Caddy、正式版 Compose、資料庫備份）。

## 素材來源與授權

完整的來源與授權條款在 [`CREDITS.md`](CREDITS.md)。

- **注音符號發音**：教育部《國語注音符號手冊》，創用 CC 姓名標示 4.0。
- **音節與聲調發音**：教育部《國語辭典簡編本》，創用 CC 姓名標示－禁止改作 3.0 臺灣。
- **提示語與寶可夢名稱發音**：Google Cloud Text-to-Speech。
- **寶可夢的名稱與圖片**：版權屬於 Nintendo、Creatures Inc.、GAME FREAK inc.。本專案是非官方、非營利的學習用途，與上述公司無關。
