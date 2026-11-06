# Implementation Plan: 注音島（透過寶可夢學注音的 3D 遊戲）

**Branch**: `002-zhuyin-island-game` | **Date**: 2026-11-06（雲端化修訂） | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-zhuyin-island-game/spec.md`

## Summary

把現有的寶可夢語音圖鑑轉型成學注音的 3D 網頁遊戲。

**核心循環**：小朋友在一座 3D 浮島上探索、遭遇第一世代寶可夢，回答「學注音」「拼注音」「認字」三個階段的題目，答對就收服。

**架構重點**（2026-11-06 依使用者決定修訂）：
- **伺服器是唯一的資料來源**：
  - 所有遊戲規則都用 Go 寫在 `game-api/internal/game/`，包括出題、干擾項、熟練度、挑選寶可夢、星星、經驗值、進化、區域開放、道館。
  - 所有進度都存在 Postgres。
- **前端只負責呈現與互動**：
  - Next.js 15 靜態網站，包括 3D 場景（React Three Fiber）、2D 介面、作答流程的狀態機。
  - 伺服器送來的題目帶有答案，所以點選後立即有回饋；每題結果馬上送到伺服器。
- **不做離線**：網路中斷時暫停並顯示「連線中」，恢復後自動補送；作答用 `PUT` 加題號，重送只算一次。
- **訪客**：不註冊也能玩，進度存在伺服器的訪客帳號；註冊時直接升級為正式帳號。
- **沒有家長區**：起始階段在建立小朋友檔案時選擇。
- **部署**：全部用 Docker Compose，先在本機完成；之後由 Caddy 在使用者的 VPS 上以同一網域提供網頁和 API。

## Technical Context

**Language/Version**：
- 前端：TypeScript 5.9（strict）、Node.js 20 LTS
- 後端：Go 1.23

**Primary Dependencies**：
- 前端：
  - 框架：Next.js 15.5（`output: 'export'`）、React 19.2、Tailwind 4
  - 3D：three、@react-three/fiber 9、@react-three/drei
  - 狀態：zustand
  - 表單：zod
  - 建置工具：openapi-typescript、subset-font、sharp、pinyin-pro（只在建置腳本使用）
- 後端：
  - 資料庫：pgx v5、sqlc、goose v3
  - API：oapi-codegen v2（std `net/http`、strict server）
  - 密碼：golang.org/x/crypto/argon2

**Storage**：
- 伺服器：Postgres 17（`postgres:17-alpine`）
- 瀏覽器：不保存進度，只有 HttpOnly session cookie

**Testing**：
- 前端：Jest 29 加 Testing Library，涵蓋前端邏輯與元件
- 後端：Go `testing`，遊戲規則用單元測試；API 用 testcontainers-go 啟動真的 Postgres 做整合測試；依 openapi.yaml 做合約測試
- 端到端：Playwright 加上 compose 啟動的真實 API，透過測試掛勾觸發遭遇，見 research R8

**Target Platform**：
- 瀏覽器：iPad Safari 16 以上、Chrome / Edge / Safari 桌面版、Android Chrome、iPhone Safari
- 伺服器：Linux VPS（Docker）

**Project Type**：Web 應用，包含前端靜態網站、Go API、部署設定，放在同一個 repo。

**Performance Goals**：
- 遭遇時的畫面：平板每秒 30 格以上，手機降低品質後也維持每秒 30 格（SC-004）。
- 首屏 FCP 1.5 秒以下、LCP 2.5 秒以下（憲章五）。
- 首次載入 10 秒內可以開始玩（SC-003）。
- API p95 低於 200ms；建立遭遇在收服動畫期間預先完成，走進草叢時不必等網路（research R5）。

**Constraints**：
- 需要網路才能玩。
- 3D chunk gzip 後低於 250 KB。
- 字型子集化後低於 200 KB。
- game-api 常駐記憶體目標低於 50 MB。
- 部署在單一台 VPS。
- 所有讀音以已校對的注音資料為準。

**Scale/Scope**：
- 內容：151 隻寶可夢、4 個區域、9 種題型、約 20 個畫面與面板。
- 使用者：預估數十到數百個家庭。

所有未知事項已在 [research.md](./research.md) 解決，沒有剩下的 NEEDS CLARIFICATION。

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原則 | 狀態 | 說明 |
|---|---|---|
| 一、MVP 優先 | ✅ | User Story 有 P1、P2 優先順序。英文、家長區、離線、PWA 都明確排除 |
| 二、測試先行（不可妥協） | ✅ | Go 的每個規則套件都在 [contracts/game-logic.md](./contracts/game-logic.md) 列出測試重點。API 有整合測試（testcontainers）與合約測試。前端邏輯與元件有 Jest 測試。每個 User Story 都有 Playwright 測試。tasks 依「測試 → 實作」排序 |
| 三、TypeScript 型別安全 | ✅ | 前端維持 strict、禁用 `any`。API 型別由 OpenAPI 產生，前後端不手寫重複型別。後端使用 Go，見 Complexity Tracking |
| 四、元件化（≤200 行、props 傳資料、放在 `components/`） | ✅（附說明） | 2D 展示元件放在 `src/components/`，只透過 props 接收資料。zustand 與 API 只在 `src/containers/` 使用。3D 元件在 `src/scene/`，見 Complexity Tracking |
| 五、效能 | ⚠️ 附說明 | FCP / LCP 以純 HTML 的開始畫面計算，3D 在背景載入（R9）。圖片在建置時預先處理成 webp，不依賴 Next.js 的即時圖片最佳化，見 Complexity Tracking |
| 六、可存取性 | ✅ | 所有作答介面都是 2D DOM：按鈕至少 80px，對比符合 AA，可用鍵盤操作，有 ARIA 標籤。3D 是裝飾性的，所有操作在 DOM 或鍵盤上都有對應 |
| 七、正體中文優先 | ✅ | 文件、註解、commit、介面文字都用正體中文。API 錯誤的 `message` 是正體中文 |
| 安全性 | ✅ | 所有輸入由 OpenAPI schema 加伺服器驗證。密碼與救援碼用 argon2id 雜湊。Cookie 為 HttpOnly + Secure + SameSite。刪除需要再輸入密碼。不使用 `dangerouslySetInnerHTML`。祕密放在 `deploy/.env`，不提交 |
| Lint / 提交規範 | ✅ | ESLint 無警告；Go 用 `go vet` 加 `staticcheck`；commit 用語義化前綴 |

**Post-Design 重新檢查**：
- 雲端化讓規則集中在 Go 的純函式套件，交易層只負責讀取、呼叫、寫回，可測試性比原本更好（原則二）。
- 前端不再有 IndexedDB、Service Worker、事件合併，程式量下降（原則一）。
- **結論：通過。**

## Project Structure

### Documentation (this feature)

```text
specs/002-zhuyin-island-game/
├── spec.md                    # 功能規格
├── technical-constraints.md   # 已確認的技術決策
├── plan.md                    # 本文件
├── research.md                # Phase 0：研究與決策
├── data-model.md              # Phase 1：資料模型
├── quickstart.md              # Phase 1：本機開發與驗證
├── contracts/
│   ├── openapi.yaml           # API 合約（實作時複製到 game-api/openapi.yaml 作為單一來源）
│   └── game-logic.md          # Go 規則套件與前端邏輯的介面、測試重點
├── checklists/
│   └── requirements.md
└── tasks.md                   # Phase 2：/speckit.tasks
```

### Source Code (repository root)

```text
pokedex-for-kids-web/                 # 前端（沿用、改寫）
├── src/
│   ├── app/                          # / 開始畫面與遊戲；/account 帳號頁
│   ├── game/                         # 前端純邏輯：zhuyin.ts（上色、拆字）、challenge.ts（作答狀態機）
│   ├── scene/                        # R3F：Island、Player、Partner、Sticker、TallGrass、GymBuilding、CameraRig
│   ├── components/                   # 2D 展示元件：ChallengeSheet、OptionCard、SpellBoard、ZhuyinText、CatchOverlay、CollectionBook…
│   ├── containers/                   # 串接 store、API 與展示元件
│   ├── stores/                       # zustand：sessionStore（帳號、目前小朋友、ChildState）、gameStore（場景、遭遇）
│   ├── api/                          # client.ts（fetch 包裝與重送佇列）、types.ts（openapi-typescript 產生）
│   ├── audio/                        # Web Audio 播放器、片段佇列、iOS 解鎖
│   ├── lib/zhuyin/                   # 既有：拼音轉注音（建置腳本用）
│   └── e2e-hooks.ts                  # 只在 NEXT_PUBLIC_E2E=1 時載入
├── scripts/                          # generate-zhuyin（既有）、build-content、build-stickers、subset-font
├── data/                             # 人工維護：zhuyin-overrides、gen1-zones、confusables、audio/
├── public/                           # data/、audio/、pokemon/、fonts/、avatars/
├── __tests__/                        # Jest
└── e2e/                              # Playwright

game-api/                             # 新增：Go 後端，唯一的資料來源
├── cmd/game-api/main.go              # serve（預設）與 admin reset-password 子指令
├── openapi.yaml                      # API 單一來源
├── internal/
│   ├── content/                      # embed 的 data/*.json 與載入、驗證
│   ├── game/                         # 純規則：zhuyin、questions、mastery、encounter、progress
│   ├── api/                          # oapi-codegen 產生的介面 + handler
│   ├── auth/                         # 密碼、救援碼、session、登入鎖定、訪客
│   ├── play/                         # 交易層：建立遭遇、寫入作答、結算
│   ├── store/                        # sqlc：queries/*.sql 與產生的程式碼
│   ├── migrations/                   # goose 遷移檔（embed）
│   └── testutil/                     # testcontainers Postgres
├── sqlc.yaml
├── oapi-codegen.yaml
├── Makefile
└── Dockerfile

crawlers/                             # 既有 Go 爬蟲與 TTS
└── cmd/synthesize-zhuyin/            # 新增：符號、聲調、音節、提示語音

deploy/
├── compose.dev.yml                   # 本機：postgres + game-api
├── compose.yml                       # VPS：caddy + game-api + postgres + backup
├── Caddyfile
└── .env.example
```

**Structure Decision**：
- **前端**：沿用 `pokedex-for-kids-web/`，以 `scene/`（3D）、`components/` 加 `containers/`（2D）、`game/`（少量純邏輯）分層。
- **後端**：獨立的 Go module `game-api/`。規則（`internal/game/`）、交易（`internal/play/`）、HTTP（`internal/api/`）三層分離。
- **靜態內容**：建置腳本同時輸出到前端的 `public/data/` 與 `game-api/internal/content/data/`，伺服器用 embed 打包。

## 實作階段（給 /speckit.tasks）

使用者要求完成 Phase 1～7 後停下。原本的 Phase 8（家長區）已取消，Polish 與部署延後。

| 階段 | 內容 | 可展示的成果 |
|---|---|---|
| 1. Setup | 清理舊程式、安裝套件、Go module、compose.dev | 測試與 lint 通過；`healthz` 回 200 |
| 2. Foundational | 靜態內容、音檔、Go 注音解析與內容載入、資料庫遷移、訪客 session、前端 API 用戶端與重送佇列、音訊播放、開始畫面 | 按「開始」取得訪客 session |
| 3. US1 收服 | Go 學注音 3 題型、建立遭遇、作答、結算星星與收服；3D 小島；挑戰面板；收服畫面 | 訪客可以完整玩一次遭遇 |
| 4. US2 區域 | Go 其餘 6 題型、區域開放、道館；前端四區、拼字板、道館、徽章 | 四區題型、拿到徽章 |
| 5. US3 自動調整 | Go mastery、PickTargets、PickPokemon、選項數量、干擾項 | 答錯的項目會再出現 |
| 6. US4 收集冊與夥伴 | Go 夥伴、進化、稀有；前端夥伴選擇、跟隨、收集冊 | 151 格收集冊、夥伴進化 |
| 7. US5 帳號 | 註冊（含訪客升級）、登入（帶入訪客）、救援碼、鎖定、多檔案、刪除、管理指令；前端帳號頁、頭像選擇 | 換瀏覽器登入看到同樣的進度 |

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| 後端與遊戲規則使用 Go，不是 TypeScript（原則三） | 使用者選擇 Go，並要求規則由伺服器計算。型別安全靠 OpenAPI 產生 Go 與 TS 雙邊型別來維持 | Node.js 後端能共用型別，但常駐記憶體較高，而且不是使用者的選擇 |
| 不依賴 Next.js 的即時圖片最佳化（原則五「使用 Next.js Image 元件優化圖片」） | 靜態輸出沒有在瀏覽時處理圖片的伺服器，需設定 `images.unoptimized: true`。3D 場景中的寶可夢是貼圖，本來就不經過 `<Image>` | 改成 Next server 模式要多跑一個 Node 容器；建置時預先產生 webp 貼紙可以達到相同效果 |
| 3D 場景元件讀取 zustand 暫態（原則四「透過 props 接收資料」） | R3F 的 `useFrame` 每格更新位置，經由 props 傳遞會造成每格重新渲染 | 只限 `src/scene/` 用 `useStore.getState()` 讀取位置、動畫等暫態；其餘資料以 props 傳入；2D 元件完全遵守 props 規則 |
| 程式碼審查需要至少一位團隊成員（技術標準） | 個人專案，只有一位開發者 | 以 `/code-review` 自動審查加上使用者本人審查代替 |
