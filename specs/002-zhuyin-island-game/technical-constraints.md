# 技術決策與限制：注音島

**Feature**: [spec.md](./spec.md)
**用途**：記錄需求討論時已經和使用者確認的技術決策，供 `/speckit.plan` 使用。規格（spec.md）只描述做什麼，技術選擇集中在這裡。

## 已確認的決策

| 項目 | 決策 | 理由 |
|---|---|---|
| 前端框架 | 沿用 Next.js 15 + React 19 + TypeScript + Tailwind 4，靜態輸出 | 現有專案已升級完成 |
| 3D | three.js + @react-three/fiber v9 + @react-three/drei | 用 React 元件寫場景；v9 支援 React 19 |
| 物理 | MVP 不用物理引擎，自己處理邊界與簡單碰撞 | 小島移動需求簡單 |
| 前端狀態 | zustand | 3D 場景與 2D 介面共用遊戲狀態 |
| 後端語言 | Go | 使用者偏好；資源佔用最少，部署只有單一執行檔 |
| HTTP | Go 標準庫 `net/http`（1.22 以上路由） | 不需要額外框架 |
| 資料庫 | Postgres（`postgres:17-alpine` 小型容器） | 使用者要求未來不必搬遷資料庫；不使用 SQLite |
| 資料存取 | `pgx` + `sqlc` | 寫 SQL、產生有型別的 Go 程式碼 |
| 資料庫遷移 | `goose`，遷移檔放在 repo，啟動時自動執行 | |
| API 型別 | 以 OpenAPI 規格為單一來源，Go 用 `oapi-codegen`、前端用 `openapi-typescript` 產生型別 | 解決前後端不同語言時型別重複的問題 |
| 後端測試 | Go 內建 `testing` + `testcontainers-go` 啟動真的 Postgres | 開發、測試、正式環境使用同一種資料庫 |
| 前端測試 | 遊戲邏輯用 Jest；完整流程用 Playwright | 符合專案憲章的測試先行 |
| 登入 | 帳號名稱 + 密碼，HttpOnly session cookie；不使用 Google 登入、不使用 email | 使用者要求 |
| 註冊 | 公開註冊，不需要邀請碼；MVP 不做機器人驗證或註冊頻率限制（登入失敗次數限制仍保留） | 使用者決定，之後視使用情況再加 |
| 部署 | Docker Compose：`caddy`（HTTPS、同網域提供網頁與 `/api`）、`game-api`、`postgres` | 同網域才能讓 iPad Safari 維持登入 cookie |
| 主機 | 使用者自有的雲端 VPS（有公開 IP），可用 Docker Compose | |
| 開發順序 | 先在本機用 Docker Compose 開發、測試，確認 OK 後才部署到 VPS 並把網頁從 GitHub Pages 移過去 | 使用者要求 |
| 備份 | 每天 `pg_dump`，保留 7 天 | |

## 架構原則

- 遊戲邏輯（出題、判斷對錯、熟練度、間隔重複、寶可夢挑選）寫成純 TypeScript 模組，與 3D 畫面完全分離，可以單獨測試。
- 建議的前端目錄：

  ```
  src/
  ├── game/        ← 純邏輯：出題、計分、熟練度、進度（Jest 測試）
  ├── scene/       ← R3F 3D 場景：小島、玩家、寶可夢貼紙
  ├── ui/          ← 2D 介面：挑戰面板、收集冊、家長區
  ├── stores/      ← zustand 狀態
  ├── sync/        ← 離線佇列與同步
  └── lib/zhuyin/  ← 已完成的注音轉換
  ```

- 進度以「作答紀錄」為事件來源，離線時先寫入本機佇列，連線後上傳；熟練度與收服紀錄可以從作答紀錄重新計算，讓多裝置合併變得簡單。

## 既有資產

| 資產 | 位置 | 狀態 |
|---|---|---|
| 寶可夢中文名稱注音（台灣讀音、已校對） | `pokedex-for-kids-web/public/data/pokemon-zhuyin.json` | 可直接使用 |
| 注音轉換程式與校正表 | `pokedex-for-kids-web/src/lib/zhuyin/`、`data/zhuyin-overrides.json` | 可直接使用 |
| 中英文名稱發音 | `crawlers/assets/mp3/zh-TW/`、`crawlers/assets/mp3/en/`（各 997 個） | 可直接使用 |
| TTS 產生流程 | `crawlers/internal/crawler/synthesize-text.go`（Google Cloud TTS） | 可擴充來產生注音符號與單字發音 |
| 視覺樣稿 | `prototypes/visual-mockup/index.html` | 風格已確認 |

## 視覺規格（取自已確認的樣稿）

- 配色：天空 `#9AD8FF`、草地 `#7BD389`、沙灘 `#FFE3A3`、水 `#4FC3E8`；介面墨線 `#2B3A67`；星星 `#FFC93C`
- 注音分類色：聲母 `#3D7BF7`、介音 `#2FB36B`、韻母 `#FF8A3D`、聲調 `#F2545B`
- 字型：jf open 粉圓（OFL）；課本式直排注音可評估字嗨注音字型（OFL）或自行排版
- 貼紙：寶可夢圖片加 16px 白邊與 4px 深藍墨線；介面元件為白底、4px 深藍描邊、偏移實色陰影
- 鏡頭：固定斜上方俯視、跟隨玩家；遭遇時拉近並把畫面上移，讓寶可夢位於挑戰面板上方

## 規劃階段要處理的風險

1. **注音符號單獨發音**：Google TTS 直接唸「ㄅ」效果不穩定。先嘗試以代表字或 SSML 產生，試聽不合格的話需要真人錄製（37 個符號、5 種聲調示範）。
2. **單字發音**：認字與拼注音的「聽『卡』」需要單字發音，第一世代名稱約 300 個不同的字，需要批次產生並抽查多音字。
3. **既有的相依套件問題**：`@sentry/nextjs@7` 與 Next 15 不相容（安裝需 `--legacy-peer-deps`），`naive-ui` 是 Vue 套件、在 React 專案中用不到，2 個舊測試失敗。開工前先清理。
4. **字型大小**：粉圓完整字型約 4.9 MB，需要依使用到的字做子集化，以達成首次載入 10 秒內的目標。
5. **寶可夢圖片**：目前從 PokeAPI 的 GitHub 載入；離線遊玩需要把第一世代的圖片一併快取或放進專案。
