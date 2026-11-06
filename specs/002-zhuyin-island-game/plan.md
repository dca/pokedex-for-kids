# Implementation Plan: 注音島（透過寶可夢學注音的 3D 遊戲）

**Branch**: `002-zhuyin-island-game` | **Date**: 2026-11-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-zhuyin-island-game/spec.md`

## Summary

把現有的寶可夢語音圖鑑轉型成學注音的 3D 網頁遊戲。

**核心循環**：小朋友在一座 3D 浮島上探索、遭遇第一世代寶可夢，回答「學注音」「拼注音」「認字」三個階段的題目，答對就收服。

**架構重點**：
- **前端遊戲邏輯**：沿用 Next.js 15 靜態網站。出題、判斷、熟練度、遭遇挑選、狀態衍生都寫成純 TypeScript 模組，和 3D 場景（React Three Fiber）、2D 介面完全分離，以 TDD 開發。
- **進度記錄**：進度以「事件」記錄。熟練度、收服、夥伴、徽章都從事件計算，所以離線遊玩、多裝置合併、試玩併入用同一套機制處理。
- **後端**：新增小型 Go 服務 `game-api`，只負責四件事：
  - 帳號：帳號名稱加密碼、救援碼、session cookie
  - 小朋友檔案
  - 事件同步
  - 管理者重設密碼
- **資料庫與部署**：資料存在 Postgres。全部用 Docker Compose，先在本機完成，再由 Caddy 在使用者的 VPS 上以同一網域提供網頁和 API。

## Technical Context

**Language/Version**：
- 前端：TypeScript 5.9（strict）、Node.js 20 LTS
- 後端：Go 1.23

**Primary Dependencies**：
- 前端：
  - 框架：Next.js 15.5（`output: 'export'`）、React 19.2、Tailwind 4
  - 3D：three、@react-three/fiber 9、@react-three/drei
  - 狀態與儲存：zustand、idb
  - 資料：pinyin-pro（只在建置腳本使用）、zod（表單驗證）
  - 建置工具：openapi-typescript、subset-font、sharp（建置時處理貼紙）
- 後端：
  - 資料庫：pgx v5、sqlc、goose v3
  - API：oapi-codegen v2（std `net/http` server）
  - 密碼：golang.org/x/crypto/argon2

**Storage**：
- 伺服器：Postgres 17（`postgres:17-alpine`）
- 瀏覽器：IndexedDB 存事件佇列與快取，Service Worker 快取靜態資源

**Testing**：
- 前端：Jest 29 加 Testing Library，涵蓋遊戲邏輯與元件
- 後端：Go `testing` 加 testcontainers-go，啟動真的 Postgres
- 端到端：Playwright，透過 E2E 建置的測試掛勾觸發遭遇，見 research R8

**Target Platform**：
- 瀏覽器：iPad Safari 16 以上、Chrome / Edge / Safari 桌面版、Android Chrome、iPhone Safari
- 伺服器：Linux VPS（Docker）

**Project Type**：Web 應用，包含前端靜態網站、Go API、部署設定，放在同一個 repo。

**Performance Goals**：
- 遭遇時的畫面：平板每秒 30 格以上，手機降低品質後也維持每秒 30 格（SC-004）。
- 首屏 FCP 1.5 秒以下、LCP 2.5 秒以下（憲章五）。
- 首次載入 10 秒內可以開始玩，再次開啟 3 秒內（SC-003）。
- 同步：API p95 低於 200ms。

**Constraints**：
- 可以完全離線遊玩。
- 3D chunk gzip 後低於 250 KB。
- 字型子集化後低於 200 KB。
- game-api 常駐記憶體目標低於 50 MB。
- 部署在單一台 VPS。
- 所有讀音以已校對的注音資料為準。

**Scale/Scope**：
- 內容：151 隻寶可夢、4 個區域、9 種題型、約 25 個畫面與面板。
- 使用者：預估數十到數百個家庭。
- 資料量：每個小朋友每年 2 萬筆以內的事件。

所有未知事項已在 [research.md](./research.md) 解決，沒有剩下的 NEEDS CLARIFICATION。

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原則 | 狀態 | 說明 |
|---|---|---|
| 一、MVP 優先 | ✅ | User Story 有 P1～P3 優先順序。US1 在試玩模式下不需要後端就能獨立交付。英文、家長報告、PWA 安裝等都明確排除 |
| 二、測試先行（不可妥協） | ✅ | 每個遊戲邏輯模組都在 [contracts/game-logic.md](./contracts/game-logic.md) 列出測試重點。API 有合約測試（依 openapi.yaml）和整合測試（testcontainers）。每個 User Story 都有 Playwright 整合測試。tasks 會依「測試 → 實作」排序 |
| 三、TypeScript 型別安全 | ✅ | 前端維持 strict、禁用 `any`。API 型別由 OpenAPI 產生，不手寫重複的型別。後端使用 Go，見 Complexity Tracking |
| 四、元件化（≤200 行、props 傳資料、放在 `components/`） | ✅（附說明） | 2D 介面元件放在 `src/components/`，只透過 props 接收資料。zustand store 只在 `src/containers/` 的容器元件中讀取，再傳給展示元件。3D 場景元件放在 `src/scene/`，同樣遵守 200 行上限 |
| 五、效能 | ⚠️ 附說明 | FCP / LCP 以純 HTML 的開始畫面計算，3D 在背景載入（R9）。圖片改在建置時預先處理成 webp 貼紙，不依賴 Next.js 的即時圖片最佳化（靜態輸出沒有這項功能），見 Complexity Tracking |
| 六、可存取性 | ✅ | 所有作答介面都是 2D DOM：按鈕至少 80px，對比符合 AA，可用鍵盤操作，有 ARIA 標籤。3D 畫面是裝飾性的，所有操作在 DOM 中都有對應（例如方向鍵移動、遭遇面板可以 Tab 操作）。寶可夢圖片的 `alt` 使用中文名稱 |
| 七、正體中文優先 | ✅ | 文件、註解、commit、介面文字都用正體中文。API 錯誤訊息 `message` 是正體中文 |
| 安全性 | ✅ | 所有輸入由 OpenAPI schema 加伺服器驗證。密碼與救援碼用 argon2id 雜湊。Cookie 為 HttpOnly + Secure + SameSite。不使用 `dangerouslySetInnerHTML`（直排注音用 ruby / flex 排版）。祕密放在 `deploy/.env`，不提交 |
| Lint / 提交規範 | ✅ | ESLint 無警告，Go 用 `go vet` + `staticcheck`，commit 用語義化前綴 |

**Post-Design 重新檢查（Phase 1 後）**：
- data-model、contracts、quickstart 沒有引入新的違規。
- 事件溯源讓同步邏輯集中在純函式（`mergeEvents`、`deriveChildState`），可以完整單元測試，強化了原則二。
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
│   └── game-logic.md          # 前端遊戲邏輯模組的介面與測試重點
├── checklists/
│   └── requirements.md
└── tasks.md                   # Phase 2：由 /speckit.tasks 產生
```

### Source Code (repository root)

```text
pokedex-for-kids-web/                 # 前端（沿用、改寫）
├── src/
│   ├── app/                          # Next App Router：/（開始畫面＋遊戲）、/parent（家長區）
│   ├── game/                         # 純邏輯，無 React / three / DOM
│   │   ├── types.ts
│   │   ├── zhuyin.ts                 # 音節解析、分類
│   │   ├── questions.ts              # 9 種題型的出題與 isAlsoCorrect
│   │   ├── challenge.ts              # 作答狀態機、星星
│   │   ├── mastery.ts                # Leitner 熟練度、pickTargets
│   │   ├── encounter.ts              # 遭遇寶可夢挑選、稀有權重
│   │   ├── derive.ts                 # 事件 → ChildState、mergeEvents
│   │   ├── playtime.ts
│   │   └── parentGate.ts
│   ├── scene/                        # React Three Fiber：Island、Player、Partner、Sticker、TallGrass、CameraRig、Joystick 輸入
│   ├── components/                   # 2D 展示元件：ChallengeSheet、OptionCard、ZhuyinText（直排）、CatchOverlay、CollectionBook、AvatarPicker…
│   ├── containers/                   # 連接 store 與展示元件
│   ├── stores/                       # zustand：gameStore（場景／遭遇）、profileStore（帳號／小朋友）
│   ├── audio/                        # Web Audio 播放器、片段佇列、iOS 解鎖
│   ├── sync/                         # IndexedDB 存取、同步迴圈、api-types.ts（產生）、apiClient
│   ├── lib/zhuyin/                   # 既有：pinyin → 注音（建置腳本用）
│   └── e2e-hooks.ts                  # 只在 NEXT_PUBLIC_E2E=1 時載入
├── scripts/
│   ├── generate-zhuyin.ts            # 既有
│   ├── build-content.ts              # 產生 gen1.json、zones.json、audio.json 並驗證涵蓋率
│   ├── build-stickers.ts             # 151 張貼紙 webp
│   ├── subset-font.ts
│   └── build-sw.ts                   # 產生 Service Worker 預先快取清單
├── data/                             # 人工維護的資料：zhuyin-overrides、gen1-zones、confusables、audio/
├── public/                           # data/、audio/、pokemon/、fonts/、sw.js
├── __tests__/                        # Jest：game/、components/、sync/
└── e2e/                              # Playwright：us1-catch.spec.ts … us6-parent.spec.ts

game-api/                             # 新增：Go 後端
├── cmd/game-api/main.go              # serve（預設）與 admin reset-password 子指令
├── openapi.yaml                      # API 單一來源
├── internal/
│   ├── api/                          # oapi-codegen 產生的介面 + handler 實作
│   ├── auth/                         # 密碼、救援碼、session、登入鎖定
│   ├── children/
│   ├── sync/                         # 事件驗證、寫入、游標查詢
│   ├── store/                        # sqlc 產生的查詢 + queries/*.sql
│   └── migrations/                   # goose 遷移檔（embed）
├── sqlc.yaml
├── Makefile                          # tools、generate、test
└── Dockerfile

crawlers/                             # 既有 Go 爬蟲與 TTS
└── cmd/synthesize-zhuyin/            # 新增：符號、聲調、音節、提示語音

deploy/
├── compose.dev.yml                   # 本機：postgres + game-api
├── compose.yml                       # VPS：caddy + game-api + postgres + backup
├── Caddyfile
└── .env.example

prototypes/visual-mockup/             # 既有：已確認的視覺樣稿（參考用，不參與建置）
```

**Structure Decision**：
- **前端**：沿用既有的 `pokedex-for-kids-web/`，不另外建立專案。以 `game/`（純邏輯）、`scene/`（3D）、`components/` + `containers/`（2D）三層分離。
- **後端**：放在新的 `game-api/` Go module。它和 `crawlers/` 是不同用途的 Go 程式，分成獨立 module，避免相依互相影響。
- **部署**：集中在 `deploy/`。
- **舊圖鑑**：舊的圖鑑頁面與元件在清理任務中移除（research R11）。

## 實作階段建議（給 /speckit.tasks）

依 User Story 優先順序，每個階段都可以獨立展示：

| 階段 | 內容 | 可展示的成果 |
|---|---|---|
| 0. 清理與基礎 | 移除 Sentry、naive-ui 和舊頁面；Playwright 設定；靜態內容腳本；音檔產生與試聽 | `npm ci`、測試、lint 全部通過；`gen1.json` 涵蓋率報告 |
| 1. US1 核心循環（試玩） | `game/` 的 zhuyin、questions（學注音 3 題型）、challenge；3D 小島（由樣稿移植）、遭遇、挑戰面板、收服；IndexedDB 事件 | 不登入就能完整玩一次遭遇 |
| 2. US2 區域與題型 | 其餘 6 種題型、區域、開放條件、道館與徽章 | 四區題型都能玩，拿到徽章 |
| 3. US3 自動調整 | mastery、encounter 挑選、選項數量、干擾項 | 刻意答錯的項目會再出現 |
| 4. US4 收集冊與夥伴 | 夥伴選擇與跟隨、進化、收集冊、稀有寶可夢 | 收集冊 151 格、夥伴進化 |
| 5. US5 帳號與同步 | game-api 全部、compose.dev、同步迴圈、試玩併入、Service Worker | 兩個瀏覽器間同步、離線再上線 |
| 6. US6 家長區 | 門檻題、設定、遊戲時間提醒 | 10 分鐘休息提醒 |
| 7. 部署 | compose.yml、Caddy、備份、basePath 切換 | VPS 上可以玩 |

US1～US4 只依賴前端，可以在後端完成前就先玩、先測。

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| 後端使用 Go，不是 TypeScript（原則三） | 使用者明確選擇 Go：資源佔用低、單一執行檔，適合小型 VPS。型別安全以 OpenAPI 產生 Go 和 TS 雙邊型別來維持 | 用 Node.js 後端雖然能共用型別，但常駐記憶體較高，而且不是使用者的選擇 |
| 不依賴 Next.js 的即時圖片最佳化（原則五「使用 Next.js Image 元件優化圖片」） | 靜態輸出（`output: 'export'`）沒有在瀏覽時處理圖片的伺服器，需設定 `images.unoptimized: true`；2D 畫面仍可使用 `<Image>` 元件，但不會自動縮放與轉檔。3D 場景中的寶可夢是貼圖，本來就不經過 `<Image>` | 改成 Next server 模式需要多跑一個 Node 容器。建置時預先產生固定尺寸的 webp 貼紙可以達到相同效果 |
| 3D 場景元件讀取 zustand（原則四「透過 props 接收資料」） | R3F 的 `useFrame` 每格更新位置，若經由 props 傳遞會造成整棵樹每格重新渲染 | 只限 `src/scene/` 內的元件用 `useStore.getState()` 讀取暫態（位置、動畫），其餘資料仍以 props 傳入；2D 元件完全遵守 props 規則 |
| 程式碼審查需要至少一位團隊成員（技術標準） | 這是個人專案，只有一位開發者 | 以 `/code-review` 自動審查加上使用者本人審查代替，在 PR 描述中註明 |
