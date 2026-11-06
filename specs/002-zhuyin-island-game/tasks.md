---
description: "注音島實作任務清單（雲端化修訂）"
---

# Tasks: 注音島（透過寶可夢學注音的 3D 遊戲）

**Input**：`/specs/002-zhuyin-island-game/` 中的設計文件
**Prerequisites**：plan.md、spec.md、research.md、data-model.md、contracts/、quickstart.md

**Tests**：專案憲章原則二要求測試先行，每個階段都包含測試任務。標示「先寫測試」的任務要先完成並確認失敗，才開始對應的實作。

**範圍**：使用者要求完成 Phase 1～7 後停下。家長區已取消；Polish 與部署延後，另外安排。


## 實作紀錄（2026-11-06，Phase 1～7 完成）

與原任務描述不同的地方：

| 任務 | 實際做法 | 原因 |
|---|---|---|
| T014、T015 音檔 | 改成前端的 `npm run audio`（TypeScript），支援 `say`（macOS Meijia，預設）與 `google` 兩種引擎；目前提交的是 Meijia 產生的暫用音檔 | 沿用前端的內容資料比較簡單；Google TTS 會用到使用者的 GCP 帳號並產生費用，等使用者決定再執行 |
| T024～T025、T039、T055、T068、T070、T077～T079 | 整合測試放在 `game-api/internal/server/*_test.go`；合約測試寫在測試工具中，每個回應都依 openapi.yaml 驗證 | handler 與中介層在同一個 package，測試完整的 HTTP 路徑 |
| T059 拼字板 | 不另外做 `SpellBoard`：拼音節題由 `QuestionView` 顯示已拼好的方塊、`OptionCard` 的 `picked` 狀態表示用過的方塊 | 少一個元件，行為相同 |
| T071、T085 等 E2E | `e2e/us3-us4.spec.ts` 合併 US3、US4；所有 E2E 在 desktop、ipad（WebKit）、iphone 三種裝置執行 | |
| Go 版本 | 1.26 | pgx、goose 新版要求 |
| 本機埠號 | API 18080、Postgres 55432 | 開發機的 8080、5432 已被其他服務占用 |

實作中修正的問題：
- 排程演算法：熟悉項目的到期複習會占滿每次遭遇，新項目永遠排不進來。新項目改排在「已熟悉的複習」之前（`mastery.PickTargets`，有測試）。
- 網路中斷時貼紙載入失敗會讓 3D 場景當掉：加上 `SafeSticker` 錯誤邊界並自動重試。

## Format: `[ID] [P?] [Story] Description`

- **[P]**：可以平行進行（不同檔案、不依賴尚未完成的任務）
- **[Story]**：所屬的 User Story（US1～US5）
- 路徑前綴：`web/` = `pokedex-for-kids-web/`、`api/` = `game-api/`；`crawlers/`、`deploy/` 照原樣

## 共用參考

| 內容 | 文件 |
|---|---|
| 規則套件與前端邏輯的介面、測試重點 | `contracts/game-logic.md` |
| API | `contracts/openapi.yaml` |
| 資料表、交易 | `data-model.md` |
| 演算法與數值 | `research.md` R1～R12 |
| 視覺與互動 | `prototypes/visual-mockup/index.html` |
| 視覺規格 | `technical-constraints.md` |

---

## Phase 1: Setup

- [x] T001 移除舊圖鑑與不相容的套件（research R11）：
  - 刪除 `web/sentry.*.config.ts`
  - 刪除 `web/src/components/{PokemonCard,PokemonList,SearchBar,LanguageSelector}.tsx`
  - 刪除 `web/src/hooks/`、`web/src/services/`、`web/src/utils/`、`web/src/constants/`、`web/src/types/`
  - 刪除 `web/src/app/settings/`、`web/src/app/data/`、`web/src/app/page.test.tsx`，以及對應的舊測試
  - 從 `web/package.json` 移除 `@sentry/nextjs`、`naive-ui`、`@tanstack/react-virtual`、`@radix-ui/react-select`
  - 把 `web/src/app/page.tsx` 改成暫時的空白頁
  - 確認 `npm install` 不需要 `--legacy-peer-deps`，`npm run test:ci` 與 `npm run lint` 全部通過
- [x] T002 安裝前端新依賴，更新 `web/package.json`：
  - 執行期：`three`、`@react-three/fiber@9`、`@react-three/drei`、`zustand`
  - 開發：`@types/three`、`@playwright/test`、`openapi-typescript`、`subset-font`、`sharp`
  - 新增 scripts：`content`、`api-types`、`stickers`、`font`、`build:e2e`、`e2e`、`test:ci`
- [x] T003 [P] 修改 `web/next.config.js`：
  - `basePath` 由 `NEXT_BASE_PATH` 決定，預設空字串
  - `images.unoptimized: true`
  - dev 模式下把 `/api/:path*` rewrite 到 `http://localhost:8080/api/:path*`
- [x] T004 [P] 確認 `web/tsconfig.json` 為 strict，並在 `web/.eslintrc.json` 加上 `@typescript-eslint/no-explicit-any: error`
- [x] T005 [P] 建立 `web/playwright.config.ts`：
  - 專案：iPad（WebKit）、Desktop Chrome、iPhone 13 直向
  - `webServer` 用 `npx serve out -l 3100`
  - 透過環境變數 `E2E_API` 指向 API
- [x] T006 [P] 初始化 `api/go.mod`（`module game-api`，`go 1.26`）：
  - 建立 `api/cmd/game-api/main.go`：`serve` 子指令，提供 `/api/v1/healthz`
  - 建立 `api/Makefile`：目標包括 `tools`、`generate`、`test`、`lint`
- [x] T007 [P] 把 `contracts/openapi.yaml` 複製到 `api/openapi.yaml`，建立 `api/oapi-codegen.yaml`：
  - 設定 `std-http-server`、`strict-server`、`models`
  - 輸出到 `api/internal/api/gen.go`
- [x] T008 [P] 建立以下檔案：
  - `deploy/compose.dev.yml`：`postgres:17-alpine` 與 `game-api`（port 8080）
  - `api/Dockerfile`：用 `golang:1.26-alpine` 建置，執行於 `gcr.io/distroless/static`
  - `deploy/.env.example`

**Checkpoint**：前端測試與 lint 通過；`docker compose -f deploy/compose.dev.yml up` 後 `healthz` 回 200。

---

## Phase 2: Foundational

**⚠️** 這個階段完成前，不能開始 User Story。

### 靜態內容

- [x] T009 建立 `web/data/gen1-zones.json`，內容是 151 隻的區域與稀有名單：
  - 依屬性產生初稿：草、蟲、一般 → meadow；水、冰 → beach；毒、超能力、妖精、幽靈 → forest；岩石、地面、格鬥、龍、火、電、飛行 → hill
  - 調整成每區數量平均
  - 稀有名單：#25、#133、#131、#143、#149、#150、#151
- [x] T010 [P] 建立 `web/data/confusables.json`，依 research R4
- [x] T011 [P] 建立 `web/data/audio/prompts.json`，列出固定語句的 key 與文字，不得含負面字眼（FR-032）
- [x] T012 [P] 先寫測試 `web/__tests__/scripts/build-content.test.ts`：
  - 151 隻都存在
  - 音節拼回等於已校對的注音
  - `isHan` 正確
  - `audio.json` 涵蓋所有需要的鍵
  - 兩個輸出目錄的內容相同
- [x] T013 實作 `web/scripts/build-content.ts`：
  - 輸出 `gen1.json`、`zones.json`、`confusables.json`、`audio.json` 到 `web/public/data/` 與 `api/internal/content/data/`
  - 複製 151 隻的名稱音檔到 `web/public/audio/name/{zh,en}/NNN.mp3`
  - 輸出涵蓋率報告

### 音檔（research R1）

- [x] T014 新增 `crawlers/cmd/synthesize-zhuyin/main.go`：
  - 產生 `web/public/audio/{sym,tone,syl,prompt}/` 的音檔
  - 代表字對照表：`web/data/audio/syllable-chars.json`
  - 人工錄音覆寫：`web/data/audio/overrides/`
  - 輸出試聽清單 `web/data/audio/review.md`
- [x] T015 執行 T014 並提交音檔。沒有 TTS 憑證時，先用 macOS `say -v Meijia` 產生暫用音檔，並在 review.md 標記為「暫用、待正式產生」；試聽交給使用者

### 後端基礎

- [x] T016 [P] 先寫測試 `api/internal/game/zhuyin/zhuyin_test.go`，涵蓋 contracts A 節「zhuyin」的測試重點；round-trip 測試讀取嵌入的 gen1.json
- [x] T017 實作 `api/internal/game/zhuyin/zhuyin.go`，讓 T016 通過
- [x] T018 [P] 先寫測試 `api/internal/content/content_test.go`：載入 151 隻與 4 區；`TestContent()` 可用
- [x] T019 實作 `api/internal/content/content.go`：embed `data/*.json`、載入與驗證
- [x] T020 建立以下項目：
  - goose 遷移檔 `api/internal/migrations/00001_init.sql`：依 data-model 第 2 節建立 8 張表
  - `embed` 與啟動時自動遷移
  - `api/internal/testutil/postgres.go`：testcontainers
- [x] T021 撰寫 `api/internal/store/queries/*.sql` 與 `api/sqlc.yaml`，執行 `make generate`
- [x] T022 [P] 先寫單元測試 `api/internal/auth/auth_test.go`：
  - argon2id 雜湊與驗證
  - 救援碼格式與比對：忽略大小寫與連字號
  - session token 只存 SHA-256
- [x] T023 實作 `api/internal/auth/`：`password.go`、`rescue.go`、`session.go`、`middleware.go`
  - middleware 從 cookie 載入帳號
  - 寫入請求必須是 JSON，否則回 415
- [x] T024 先寫整合測試 `api/internal/api/guest_test.go`：
  - `POST /auth/guest` 建立訪客與一個預設小朋友，設定 cookie
  - 再呼叫一次回 200 和同一個帳號
  - `GET /me` 回傳 `isGuest: true`
- [x] T025 實作 `api/internal/api/server.go`：
  - 路由、錯誤格式、結構化日誌、請求大小上限、graceful shutdown
  - `auth_guest.go`、`me.go`（GET）
  - 讓 T024 通過

### 前端基礎

- [x] T026 [P] 執行 `npm run api-types` 產生 `web/src/api/types.ts`
- [x] T027 [P] 先寫測試 `web/__tests__/api/client.test.ts`：
  - 帶 `credentials` 與 JSON content type
  - 錯誤 `code` 轉成正體中文訊息
  - 網路錯誤時依 1、2、4、8 秒（上限 15 秒）重試
  - 重試期間 `pending` 狀態為 true，成功後為 false
  - 4xx 不重試
- [x] T028 實作 `web/src/api/client.ts`，讓 T027 通過
- [x] T029 [P] 先寫測試 `web/__tests__/game/zhuyin.test.ts`，然後實作 `web/src/game/zhuyin.ts`（`categoryOf`、`splitZhuyin`）
- [x] T030 [P] 先寫測試 `web/__tests__/audio/player.test.ts`，然後實作 `web/src/audio/player.ts`：
  - 依序播放
  - 新的序列會中斷舊的序列
  - 載入失敗時跳過
  - `unlock()`
- [x] T031 [P] 實作 `web/scripts/subset-font.ts`，輸出 `web/public/fonts/jfopenhuninn-subset.woff2`
- [x] T032 [P] 在 `web/src/app/globals.css` 定義視覺 token、`@font-face`、`prefers-reduced-motion`
- [x] T033 [P] 先寫測試，然後實作 `web/src/components/ZhuyinText.tsx`：
  - 依分類上色
  - 支援橫排、直排、挖空「＿」
- [x] T034 [P] 實作 zustand store：
  - `web/src/stores/sessionStore.ts`：me、目前小朋友、ChildState
  - `web/src/stores/gameStore.ts`：mode、zone、遭遇
- [x] T035 先寫測試，然後實作以下元件：
  - `web/src/components/StartScreen.tsx`
  - `web/src/containers/BootContainer.tsx`：按「開始」後執行 `audio.unlock()`、`POST /auth/guest`、載入 ChildState，再動態載入遊戲主畫面
  - `web/src/components/ConnectionOverlay.tsx`：`pending` 時顯示「連線中」
- [x] T036 實作 `web/src/e2e-hooks.ts`（只在 `NEXT_PUBLIC_E2E=1` 時載入）。伺服器端在 `GAME_API_TEST_HOOKS=1` 時接受 `X-Test-Pokemon`

**Checkpoint**：內容腳本、音檔、Go 與 TS 的測試全部通過；按「開始」可以取得訪客 session。

---

## Phase 3: US1 — 遇到寶可夢、答題、收服（P1）🎯

**Independent Test**：以訪客打開遊戲、走進草叢、答題、收服。

### 測試（先寫）

- [x] T037 [P] [US1] 先寫測試 `api/internal/game/questions/learn_test.go`，涵蓋 `listen_symbol`、`first_sound`、`listen_tone`：
  - 不洩漏答案
  - 選項數量正確並包含答案
  - 不挖空非漢字
  - 同一個 seed 可以重現
  - 干擾項的 `IsAlsoCorrect` 都是 false
  - 聽聲調題包含輕聲
- [x] T038 [P] [US1] 先寫測試 `api/internal/game/progress/progress_test.go`，涵蓋 `Stars` 與 `StreakAfter`
- [x] T039 [P] [US1] 先寫整合測試 `api/internal/api/play_test.go`：
  - 建立遭遇（1～3 題）
  - PUT 作答，重送相同內容回 204，內容不同回 409
  - 有題目沒作答就 complete 回 409
  - complete 的星星由伺服器計算，重送回傳相同結果
  - 寫入 caught 並以 GREATEST 更新星星
  - 存取其他帳號的遭遇回 404
- [x] T040 [P] [US1] 先寫測試 `web/__tests__/game/challenge.test.ts`，涵蓋 contracts B 節的所有測試重點
- [x] T041 [P] [US1] 先寫 E2E 測試 `web/e2e/us1-catch.spec.ts`：
  1. 開始
  2. 選夥伴
  3. `enterGrass()` 觸發遭遇
  4. 確認題目不洩漏答案
  5. 答錯一次，確認選項 disabled
  6. 答對，確認收服畫面顯示 2 顆星
  7. 按「繼續探索」
  8. 重新整理後收集冊仍有這隻

### 實作

- [x] T042 [US1] 實作 `api/internal/game/questions/`：`questions.go`、`learn.go`、`distractors.go`（初版），讓 T037 通過
- [x] T043 [US1] 實作 `api/internal/game/progress/progress.go` 的 `Stars`、`StreakAfter`；實作 `api/internal/game/encounter/encounter.go` 初版：在區域內隨機挑寶可夢與目標項目；`QuestionsPerEncounter`
- [x] T044 [US1] 實作 `api/internal/play/`，依 data-model 第 3 節：`CreateEncounter`、`SubmitAnswer`、`Complete`。實作 `api/internal/api/play_handlers.go`、`state_handler.go`。讓 T038、T039 通過
- [x] T045 [US1] 實作 `web/src/game/challenge.ts`，讓 T040 通過
- [x] T046 [P] [US1] 實作 `web/scripts/build-stickers.ts`：產生 151 張 256px 貼紙 webp，加 16px 白邊與 4px `#2B3A67` 墨線，輸出到 `web/public/pokemon/`
- [x] T047 [P] [US1] 移植樣稿的 3D 場景：
  - `web/src/scene/Island.tsx`（必要時拆成 `island/*`）
  - `Sticker.tsx`
  - `TallGrass.tsx`
- [x] T048 [US1] 實作以下 3D 元件：
  - `web/src/scene/Player.tsx`、`controls/`：鍵盤、點擊地面、搖桿
  - `web/src/components/Joystick.tsx`
  - `CameraRig.tsx`：用 `setViewOffset` 處理遭遇時的取景
  - `GameCanvas.tsx`：加上 `PerformanceMonitor`
- [x] T049 [P] [US1] 先寫測試，然後實作以下元件：
  - `web/src/components/OptionCard.tsx`
  - `ChallengeSheet.tsx`
  - `CatchOverlay.tsx`
- [x] T050 [US1] 實作 `web/src/containers/EncounterContainer.tsx`：
  1. 預先建立遭遇。
  2. 播放名稱與題目語音。
  3. 執行 challenge 狀態機。
  4. 每題 PUT 作答。
  5. complete 後顯示收服畫面。
  6. 收服動畫期間預先建立下一個遭遇。
- [x] T051 [US1] 實作 `web/src/app/GameScreen.tsx`：
  - 組合 3D 場景、搖桿、遭遇、收服、連線遮罩
  - 手機直向版面
  - 讓 T041 通過

**Checkpoint**：訪客可以完整玩一次遭遇；Go、Jest、E2E 測試都通過。

---

## Phase 4: US2 — 三個學習階段與小島區域（P1）

**Independent Test**：建立起始階段為「認字」的檔案，四區題型正確，並完成道館拿到徽章。

### 測試（先寫）

- [x] T052 [P] [US2] 先寫測試 `api/internal/game/questions/spell_test.go`，涵蓋 `fill_symbol`、`fill_tone`、`build_syllable`：
  - 挖空不洩漏答案
  - `build_syllable` 的答案有順序
  - 依二拼、三拼、整個名稱的順序選題
- [x] T053 [P] [US2] 先寫測試 `api/internal/game/questions/read_test.go`，涵蓋 `listen_name`、`zhuyin_to_char`、`fill_char`：
  - 同音字不會成為干擾項
  - 多音字以注音資料為準
  - 干擾字優先取自其他寶可夢名稱
- [x] T054 [P] [US2] 先寫測試 `api/internal/game/progress/zones_test.go`：
  - `UnlockedZones` 在 79% 時不開放、80% 時開放
  - 起始階段 `spell` 開放三區、`read` 開放四區
  - `GymPassed` 7 題不通過、8 題通過
- [x] T055 [P] [US2] 先寫整合測試 `api/internal/api/zones_test.go`：
  - 未開放的區域回 403
  - 道館 10 題
  - 答對 8 題得到徽章，`badgeEarned` 只在第一次為 true
  - 不通過時沒有徽章
- [x] T056 [P] [US2] 先寫 E2E 測試 `web/e2e/us2-zones.spec.ts`：
  - 四區題型正確
  - 認字題用直排注音
  - 道館通過得到徽章；不通過時顯示鼓勵，可以再挑戰

### 實作

- [x] T057 [US2] 實作 `api/internal/game/questions/spell.go`、`read.go`，讓 T052、T053 通過
- [x] T058 [US2] 實作 `api/internal/game/progress/zones.go` 與 `encounter.PlanGym`；在 `play` 加上道館結算、區域檢查，讓 T054、T055 通過
- [x] T059 [P] [US2] 先寫測試，然後實作 `web/src/components/SpellBoard.tsx`（點選放入、點選取出），並讓 `challenge.ts` 支援 `build_syllable`
- [x] T060 [US2] 實作 `web/src/scene/zones.ts`、四區地面、未開放區域的雲霧、`GymBuilding.tsx`
- [x] T061 [US2] 實作 `web/src/containers/GymContainer.tsx` 與 `web/src/components/BadgeShelf.tsx`，讓 T056 通過

---

## Phase 5: US3 — 依照孩子的程度自動調整（P2）

**Independent Test**：答錯 ㄆ 之後，5 次遭遇內再練到 ㄆ；連續答對後選項數量增加。

- [x] T062 [P] [US3] 先寫測試 `api/internal/game/mastery/mastery_test.go`：
  - R2 表格的每一列
  - `OptionCount` 的邊界
  - `IsFamiliar`
  - 連續答對時間隔遞增
  - 性質測試：答錯的項目在 5 次遭遇內一定會被選到
- [x] T063 [P] [US3] 先寫測試 `api/internal/game/encounter/encounter_test.go`：
  - `PickPokemon` 只挑本區、能練到目標的寶可夢，沒有候選時才退回
  - 未收服的權重 ×2
  - `RareWeight` 的邊界
- [x] T064 [P] [US3] 先寫測試 `api/internal/game/questions/distractors_test.go`：干擾項優先取自混淆表，不足時補隨機，補上的仍經過 `IsAlsoCorrect` 篩選
- [x] T065 [US3] 實作 `api/internal/game/mastery/mastery.go`，讓 T062 通過
- [x] T066 [US3] 改寫 `encounter`：`PlanWild` 用 `PickTargets` 加上 `PickPokemon`，並加入稀有權重，讓 T063 通過
- [x] T067 [US3] 改寫 `distractors.go`，選項數量由 `OptionCount` 決定，讓 T064 通過
- [x] T068 [US3] 在 `play.SubmitAnswer` 加上 mastery UPSERT（`SELECT … FOR UPDATE`）；在 `api/internal/api/adaptive_test.go` 寫整合測試：答錯 ㄆ 兩次後，5 次遭遇內出現 `sym:ㄆ`

---

## Phase 6: US4 — 收集冊與夥伴寶可夢（P2）

**Independent Test**：新檔案選夥伴；收服後打開收集冊重聽發音；累積答對數後夥伴進化。

- [x] T069 [P] [US4] 先寫測試 `api/internal/game/progress/partner_test.go`：
  - 進化 50 / 150 的邊界
  - 最終進化後的稱號
  - `allCaught`
- [x] T070 [P] [US4] 先寫整合測試 `api/internal/api/partner_test.go`：
  - 選夥伴，第二次選回 409
  - 沒有夥伴時建立遭遇回 409
  - complete 回傳 `evolved`
- [x] T071 [P] [US4] 先寫 E2E 測試 `web/e2e/us4-book-partner.spec.ts`：夥伴三選一；收集冊 151 格、剪影、金框；可以重聽發音
- [x] T072 [US4] 實作 `api/internal/game/progress/partner.go`、partner handler，以及 `state` 的 partner 欄位，讓 T069、T070 通過
- [x] T073 [P] [US4] 先寫測試，然後實作 `web/src/components/PartnerPicker.tsx`
- [x] T074 [P] [US4] 實作 `web/src/scene/Partner.tsx`：跟隨、經驗值提示、進化動畫
- [x] T075 [P] [US4] 先寫測試，然後實作 `web/src/components/CollectionBook.tsx`、`BookEntry.tsx`
- [x] T076 [US4] 實作 `web/src/containers/BookContainer.tsx`、`PartnerContainer.tsx`，讓 T071 通過

---

## Phase 7: US5 — 家長帳號、小朋友檔案與換裝置（P2）

**Independent Test**：訪客註冊後進度保留；建立第二個檔案；在另一個瀏覽器登入，進度一致。

- [x] T077 [P] [US5] 先寫整合測試 `api/internal/api/auth_test.go`：
  - **註冊**：
    - 訪客升級為正式帳號，小朋友與進度保留
    - 沒有 session 時直接建立新帳號
    - 名稱重複時回 409，比對不分大小寫
    - 已經是正式帳號時再註冊回 409
    - cookie 屬性正確
  - **登入**：
    - 帳號或密碼錯誤回 401
    - 連續 5 次失敗回 429 並附 `Retry-After`
    - `bringGuestChildren` 會搬移訪客的檔案並刪除訪客帳號
    - 搬移後超過上限回 422
  - **救援碼重設密碼**：舊救援碼失效，舊 session 全部刪除
  - **登出**
- [x] T078 [P] [US5] 先寫整合測試 `api/internal/api/children_test.go`：
  - 建立檔案，第 9 個回 422
  - PATCH 修改
  - 刪除需要密碼；密碼錯誤或訪客刪除回 403
  - `DELETE /me` 刪除所有資料
- [x] T079 [P] [US5] 先寫合約測試 `api/internal/api/contract_test.go`：用 kin-openapi 驗證所有回應都符合 openapi.yaml
- [x] T080 [US5] 實作 `auth_handlers.go`（register、login、logout、reset-password、deleteMe）與 `children_handlers.go`，讓 T077～T079 通過
- [x] T081 [US5] 實作 `api/cmd/game-api/admin.go`：`admin reset-password --username`。在 `admin_test.go` 寫整合測試
- [x] T082 [P] [US5] 先寫測試，然後實作以下元件，測試放在 `web/__tests__/components/auth/`：
  - `web/src/components/auth/RegisterForm.tsx`
  - `LoginForm.tsx`：帶入訪客進度的選項
  - `RescueCodeNotice.tsx`：要按「我已保存」才能繼續
  - `ResetPasswordForm.tsx`
- [x] T083 [P] [US5] 先寫測試，然後實作以下元件，並在 `web/public/avatars/` 放 12 個原創簡單頭像：
  - `web/src/components/AvatarPicker.tsx`
  - `ChildForm.tsx`：暱稱、頭像、起始階段
  - `DeleteConfirm.tsx`
- [x] T084 [US5] 實作以下頁面與容器：
  - `web/src/app/account/page.tsx`
  - `web/src/containers/AccountContainer.tsx`：
    - 註冊、登入、重設密碼
    - 管理小朋友檔案
    - 訪客的「註冊以保存進度」提醒
  - 開始畫面加上頭像選擇
- [x] T085 [US5] 先寫 E2E 測試 `web/e2e/us5-accounts.spec.ts`，再修正到通過：
  - 訪客註冊後進度保留
  - 救援碼畫面
  - 名稱重複時有提示
  - 第二個檔案
  - 在另一個 browser context 登入，進度一致
  - `context.setOffline` 時顯示「連線中」，恢復後繼續
  - 重設密碼
  - 鎖定

**Checkpoint（停下點）**：
- Phase 1～7 完成。
- `go test ./...`、`npm run test:ci`、`npm run lint`、全部 E2E 通過。
- 向使用者回報並等待指示。

---

## Dependencies & Execution Order

- **Phase 1 → Phase 2 → US1 → US2**：依序進行。
- **US3**：依賴 US1；和 US2 都會修改 `questions`、`encounter`，所以依序進行。
- **US4**：依賴 US1，可以和 US2、US3 平行。
- **US5**：只依賴 Phase 2 的 auth 基礎；前端部分依賴 US1 的遊戲畫面。
- **每個 Story 內部**：先寫測試 → Go 規則 → 交易與 handler → 前端元件 → 容器 → E2E。

## Implementation Strategy

- 依 Phase 順序完成，每個 Checkpoint 都確認先前的測試仍然通過。
- 每完成一組邏輯相關的任務就 commit，commit 訊息用正體中文加語義化前綴。
- 元件不超過 200 行；不使用 `any`。

---

## 後續待辦（Phase 1～7 之後）

- [ ] TODO-01 寶可夢名稱改用教育部真人發音：目前 151 隻的中文名稱是 Google TTS（`public/audio/name/zh/`）。
  - 候選來源：《國語辭典簡編本》的「詞目全文聲音檔」（CC BY-ND 3.0 TW，約 5 個分割壓縮檔）；寶可夢名稱多半不是辭典詞目，可能找不到整個名稱的錄音。
  - 備案：用已經換成真人錄音的名稱音節（`data/audio/overrides/syl/`）拼接；每個字是真人發音，但字與字之間較不自然。
  - 拼接前先用試聽頁（`public/name-review.html`，本機產生、不提交）標出 TTS 唸錯的名稱，評估要全部替換或只換唸錯的。
- [ ] Phase 9（延後）：部署到 VPS（Caddy、compose.yml、每日備份）、CI、README、無障礙與效能檢查。
