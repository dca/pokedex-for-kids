# 交接資訊：注音島

更新日期：2026-11-12

## 現在的狀態

- **分支**：`002-zhuyin-island-game`，已 push，工作目錄沒有未提交的修改（這份文件之前的最後一個 commit 是 `094eef5`）。
- **PR**：[#12](https://github.com/dca/pokedex-for-kids/pull/12) 開著、CI 全綠、**還沒合併**（使用者先前決定「先不要合併」，合併前要再問一次）。
- **工作目錄**：`/Users/dca/code/dca/pokedex-for-kids/.claude/worktrees/plan-learning-game`（git worktree；主要 checkout 在 `/Users/dca/code/dca/pokedex-for-kids`，還停在舊的 main）。
- **進度**：tasks.md 的 Phase 1～7（T001～T085）全部完成。遊戲功能做完了，還沒有正式部署。
- **測試**：Jest 165 個、Go 測試、E2E 21 個情境（desktop、ipad、iphone）全部通過；lint 與型別檢查乾淨。

## 本機環境

| 服務 | 位置 | 狀態（寫這份文件時） |
|---|---|---|
| game-api | http://localhost:18080（容器 `zhuyin-island-dev-game-api-1`） | 執行中 |
| Postgres | localhost:55432（容器 `zhuyin-island-dev-postgres-1`） | 執行中 |
| 前端開發伺服器 | http://localhost:3200 | **已停止**，用 `npm run dev` 重開 |
| Cloudflare tunnel | 臨時網址，每次重開都會換 | **已停止** |

重開前端與 tunnel：

```bash
cd pokedex-for-kids-web && npm run dev
cloudflared tunnel --no-autoupdate --protocol http2 --url http://localhost:3200
```

- tunnel 用預設的 QUIC 斷過兩次，改用 `--protocol http2` 比較穩；電腦休眠或換網路後仍可能斷，斷了網址就失效。
- 開發用的 compose 開著 `GAME_API_TEST_HOOKS=1`（E2E 用，可以指定遇到哪隻寶可夢）。tunnel 對外公開時這個開關也是開著的。
- 3000、8080、5432 被使用者其他專案的容器占用（`laradock-workspace` 等），**不要動那些容器**。

## 使用者定下的規則

- 用正體中文回覆；commit 訊息用正體中文加語義化前綴。
- **只有使用者要求時才 commit、push**。例外：上一次為了驗證 CI，在「合併前都處理好」的要求下直接 push 了。
- 不要自己合併 PR #12。
- 不要更改 GCP 專案設定、不要自己啟用 API。Google TTS 使用 `pokedex-for-kids` 專案；環境變數裡的 `lyrical-edition-478801-a8` 沒有權限。
- 專案非營利；開放註冊，不做防濫用（FR-060）。
- 沒有家長區、沒有離線模式；資料全部存在伺服器，規則由伺服器計算。
- 選項的發音維持「答對後才唸」。
- 遊戲裡的注音符號、音節、聲調必須使用教育部的真人錄音。

## 接下來可以做的事

依建議順序：

1. **合併 PR #12**（等使用者確認）。合併後：
   - GitHub Pages 的自動部署已移除，但 Pages 上的舊版網頁還在，要不要下架由使用者到 Settings → Pages 決定。
   - 主要 checkout 的 `CLAUDE.md` 還是舊版，合併後 pull 就會更新。
2. **README 的版權聲明請使用者確認**：「寶可夢的名稱與圖片版權屬於 Nintendo、Creatures Inc.、GAME FREAK inc.，本專案是非官方、非營利的學習用途」這句是我加的，使用者還沒回覆是否合適。
3. **Phase 9：部署**（還沒開始）。`deploy/` 只有 `compose.dev.yml`。需要正式版 compose、Caddy（網頁和 API 同網域、HTTPS）、資料庫每日備份。正式環境必須 `COOKIE_SECURE` 開啟、`GAME_API_TEST_HOOKS` 關閉。目標是使用者自己的 VPS。
4. **TODO-01：寶可夢名稱改用教育部真人發音**（還沒開始）。151 隻的中文名稱和題目提示語現在是 Google TTS。做法與備案寫在 tasks.md 的「後續待辦」。試聽頁 `public/name-review.html` 是本機產生的，不提交。
5. **真機測試**：iPad 和 iPhone 只用 Playwright 的 WebKit 模擬過，還沒在真機上確認觸控、音效、3D 效能。
6. **給小朋友試玩**：規格裡的目標（例如每次遭遇時間中位數 60 秒內）還沒有真實資料。
7. **E2E 放進 CI**（選做）：目前只在本機跑，約 7 分鐘。

## 容易踩到的地方

- **worktree 的指令限制**：這個 worktree 裡，太複雜的 bash（heredoc 寫檔、多層 `cd` 加 `&&`）會被擋下來。寫檔用 Write 工具，指令拆成簡單的幾條。
- **跑 E2E 前先停掉開發伺服器**：兩者共用 `.next`。流程是 `npm run build:e2e` → `npm run e2e`（Playwright 會自己啟動 `e2e/proxy-server.mjs`，port 3100）。跑完 `out/` 會是 E2E 版本。
- **版面檢查**：`node e2e/layout-check.mjs http://localhost:3100 <截圖資料夾>`，需要 E2E 版本的 build 和手動啟動 `node e2e/proxy-server.mjs 3100`。它會標出家長用的三個 56px 按鈕（「家長登入／註冊」「← 回到遊戲」「修改」），這是刻意保留的，不用修。
- **介面縮放**：CSS 變數 `--ui`（`src/components/scale.ts`），以 1180×820 為基準，範圍 1～1.6，**不會小於 1**（FR-081 要求小朋友的按鈕至少 80px）。用 CSS `zoom` 套用；在有 `zoom` 的元素裡用 `getBoundingClientRect` 算位移時要換算回縮放前（參考 `Joystick.tsx`）。
- **遭遇鏡頭與裝飾**：寶可夢站位、鏡頭參數集中在 `src/scene/layout.ts`（`wildSpot`、`gymSpot`、`ENCOUNTER_OFFSET`）。`Decor.tsx` 會避開鏡頭視線，改站位或鏡頭時兩邊會一起變。
- **音檔快取**：音檔網址帶內容雜湊（`?v=`），換音檔後要跑 `npm run content` 更新 `audio.json`。
- **教育部簡編本的替代字**：有 11 個音節在簡編本沒有錄音，改用同音字（清單在 `CREDITS.md`）。簡編本是「禁止改作」授權，只能轉檔、不能改讀音，使用說明 PDF 要保留在 `licenses/`。
- **Go 測試**：用 testcontainers，需要 Docker；ryuk 已在 `internal/testutil` 裡關閉，測試會自己清掉容器。
- **改 API**：先改 `game-api/openapi.yaml`，再 `make generate`（game-api）和 `npm run api-types`（前端）。

## 文件在哪裡

- 規格、計畫、任務：`specs/002-zhuyin-island-game/`（`spec.md`、`plan.md`、`tasks.md`、`research.md`、`data-model.md`、`contracts/`、`quickstart.md`）
- 專案說明：`README.md`；給 Claude 的開發指引：`CLAUDE.md`
- 素材來源與授權：`CREDITS.md`、`licenses/`
- 恢復上一個 Claude Code 對話：在 worktree 目錄執行 `claude --resume ae8be5f8-32d7-46ea-b63b-4a511c125508`
