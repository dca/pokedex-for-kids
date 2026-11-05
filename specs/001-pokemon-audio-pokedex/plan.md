# Implementation Plan: 寶可夢語音圖鑑

**Branch**: `001-pokemon-audio-pokedex` | **Date**: 2025-11-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-pokemon-audio-pokedex/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

本專案將重寫現有的寶可夢語音圖鑑應用程式，採用現代化的前端技術堆棧和使用者介面設計。核心功能包括：
1. 從 PokéAPI 獲取寶可夢列表資料
2. 提供互動式寶可夢列表介面，支援搜尋功能
3. 點擊寶可夢時播放中英文名稱音訊
4. 使用者可選擇語言偏好（僅中文、僅英文、中英文）

技術方案將基於現有的 Next.js 13 App Router、React 18、TypeScript 和 Tailwind CSS 堆棧，並升級所有依賴套件到最新版本。將引入現代化的 UI 元件庫（待研究）來提升介面設計品質，並使用文字轉語音（TTS）技術或預錄音訊方案來產生寶可夢名稱發音。

## Technical Context

**Language/Version**: TypeScript 5.x (最新穩定版), Node.js 20.x LTS
**Primary Dependencies**:
- Next.js 14.x (App Router)
- React 18.x
- Tailwind CSS 3.x
- NEEDS CLARIFICATION: UI 元件庫選擇 (shadcn/ui, Radix UI, Headless UI, Material UI 或其他)
- NEEDS CLARIFICATION: 音訊生成方案 (Web Speech API, Google TTS, Azure TTS, ElevenLabs 或預錄音訊)
- PokéAPI 客戶端或原生 fetch

**Storage**:
- LocalStorage (使用者語言偏好)
- NEEDS CLARIFICATION: 寶可夢資料快取策略 (Next.js ISR, SWR, React Query 或其他)

**Testing**:
- Jest (單元測試、整合測試)
- React Testing Library (元件測試)
- Playwright 或 Cypress (E2E 測試，待確認)

**Target Platform**: 現代瀏覽器 (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)，響應式設計支援桌面與行動裝置

**Project Type**: Web 應用程式 (單一專案結構)

**Performance Goals**:
- 首次內容繪製 (FCP) < 1.5 秒
- 最大內容繪製 (LCP) < 2.5 秒
- 互動時間 (TTI) < 3.5 秒
- 音訊播放延遲 < 1 秒
- 搜尋結果更新 < 500 毫秒
- 滾動流暢度 60 FPS

**Constraints**:
- 支援至少 1000 隻寶可夢的流暢顯示
- 音訊檔案大小 < 500KB/檔案
- 靜態輸出部署 (output: 'export')
- 基礎路徑限制 (basePath: '/pokedex-for-kids')

**Scale/Scope**:
- 約 1000+ 隻寶可夢
- 5-10 個主要元件
- 預期使用者：兒童及其家長
- 單一頁面應用，附加搜尋與設定功能

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### 一、最小可行產品優先（MVP First）✅ PASS

**評估**：功能規格已明確定義優先級（P1-P3），P1 包含基本列表顯示和音訊播放，P2 為點擊播放，P3 為搜尋和語言切換。實作將從 P1 開始，符合 MVP First 原則。

**行動**：確保實作順序嚴格遵循優先級，不在 P1 完成前實作 P2、P3 功能。

### 二、測試先行（Test-First）✅ PASS (需執行)

**評估**：憲章要求所有程式碼採用 TDD。現有專案已設定 Jest 和 React Testing Library，但需確保新功能開發遵循紅燈→綠燈→重構循環。

**行動**：
- 每個使用者故事必須先撰寫整合測試
- 每個元件必須先撰寫單元測試
- 測試必須先失敗後才開始實作
- 測試覆蓋率由測試品質保證，非數字目標

### 三、型別安全與 TypeScript 優先 ✅ PASS

**評估**：專案已使用 TypeScript 5.1.6 並啟用嚴格模式（`"strict": true`），符合憲章要求。

**行動**：
- 禁止使用 `any` 型別
- 所有 API 回應必須定義介面
- 元件 props 必須完整定義型別
- 升級到 TypeScript 5.x 最新版本

### 四、元件化與可重用性 ✅ PASS (需改善)

**評估**：現有程式碼將所有邏輯放在 `page.tsx` 中，元件劃分不清晰。需要重構為獨立、可重用的元件。

**行動**：
- 建立獨立的 `PokemonCard`、`PokemonList`、`SearchBar`、`AudioPlayer` 等元件
- 每個元件不超過 200 行
- 元件必須通過 props 接收資料
- 共用元件放在 `components/` 目錄

### 五、效能與使用者體驗 ⚠️ NEEDS ATTENTION

**評估**：規格定義了明確的效能目標，但現有實作沒有使用虛擬滾動或分頁，可能在 1000+ 寶可夢時效能不佳。

**行動**：
- 實作虛擬滾動（如 react-window 或 @tanstack/react-virtual）
- 使用 Next.js Image 元件（已使用，但需確保最佳實踐）
- 實作適當的載入狀態和錯誤處理
- 確保符合 FCP < 1.5s、LCP < 2.5s、TTI < 3.5s

### 六、可存取性（Accessibility）⚠️ NEEDS IMPROVEMENT

**評估**：現有實作缺乏可存取性考量，如 ARIA 標籤、鍵盤操作、色彩對比等。

**行動**：
- 所有互動元素支援鍵盤操作（Enter、Space）
- 提供適當的 ARIA 標籤（role、aria-label、aria-pressed）
- 確保色彩對比度符合 WCAG 2.1 AA 級（4.5:1）
- 圖片提供有意義的替代文字
- 使用 UI 元件庫時選擇支援可存取性的選項

### 七、正體中文優先 ✅ PASS

**評估**：功能規格、計畫文件均使用正體中文，符合憲章要求。

**行動**：
- 確保程式碼註解使用正體中文
- Git 提交訊息使用正體中文
- UI 文字使用正體中文
- 變數和函式名稱使用英文（符合慣例）

### 總結

**通過狀態**：✅ 可以進入 Phase 0 (有條件)

**關鍵注意事項**：
1. 必須嚴格遵循 TDD 流程
2. 需大幅改善元件化設計
3. 效能優化（虛擬滾動）必須納入設計
4. 可存取性需求必須從一開始納入考量

**不需 Complexity Tracking**：無違規需要特別說明

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
pokedex-for-kids-web/
├── src/
│   ├── app/                      # Next.js 14 App Router
│   │   ├── layout.tsx            # 根佈局
│   │   ├── page.tsx              # 首頁（重定向到 /pokedex）
│   │   ├── globals.css           # 全域樣式
│   │   └── pokedex/              # 主要功能頁面
│   │       ├── page.tsx          # 寶可夢列表頁面
│   │       ├── layout.tsx        # Pokedex 佈局（可選）
│   │       └── components/       # 頁面專用元件（如需要）
│   ├── components/               # 共用元件
│   │   ├── PokemonCard.tsx       # 寶可夢卡片元件
│   │   ├── PokemonList.tsx       # 寶可夢列表容器
│   │   ├── SearchBar.tsx         # 搜尋列元件
│   │   ├── LanguageSelector.tsx  # 語言選擇器
│   │   ├── AudioPlayer.tsx       # 音訊播放器元件
│   │   └── ui/                   # UI 基礎元件（來自 UI 庫）
│   ├── lib/                      # 工具函式和配置
│   │   ├── pokeapi.ts            # PokéAPI 客戶端
│   │   ├── audio.ts              # 音訊生成/播放邏輯
│   │   ├── storage.ts            # LocalStorage 工具
│   │   └── utils.ts              # 通用工具函式
│   ├── types/                    # TypeScript 型別定義
│   │   ├── pokemon.ts            # 寶可夢相關型別
│   │   ├── audio.ts              # 音訊相關型別
│   │   └── preferences.ts        # 使用者偏好型別
│   ├── hooks/                    # 自訂 React Hooks
│   │   ├── usePokemonList.ts     # 寶可夢列表邏輯
│   │   ├── useAudioPlayer.ts     # 音訊播放邏輯
│   │   ├── useSearch.ts          # 搜尋邏輯
│   │   └── usePreferences.ts     # 使用者偏好邏輯
│   └── __tests__/                # 測試檔案（鏡像 src 結構）
│       ├── components/           # 元件測試
│       ├── lib/                  # 工具函式測試
│       ├── hooks/                # Hooks 測試
│       └── integration/          # 整合測試
├── public/                       # 靜態資源
│   ├── audio/                    # 音訊檔案（如使用預錄）
│   └── images/                   # 圖片資源
├── next.config.js                # Next.js 配置
├── tailwind.config.ts            # Tailwind CSS 配置
├── tsconfig.json                 # TypeScript 配置
├── jest.config.js                # Jest 配置
├── jest.setup.js                 # Jest 設定
└── package.json                  # 專案依賴
```

**Structure Decision**: 採用 Next.js 14 App Router 結構（Option 2 的前端部分）。這是一個純前端的 Web 應用程式，不需要後端 API（使用第三方 PokéAPI）。

**關鍵設計決策**：
1. **App Router**: 使用 Next.js 14 的 App Router 而非 Pages Router，享受 React Server Components 的優勢
2. **元件分層**: 區分頁面專用元件 (`app/pokedex/components/`) 和共用元件 (`components/`)
3. **測試結構**: 測試檔案放在 `__tests__/` 目錄，鏡像 `src/` 結構，方便維護
4. **型別定義**: 集中管理型別定義在 `types/` 目錄，避免重複定義
5. **業務邏輯分離**: 使用自訂 Hooks 封裝業務邏輯，保持元件純粹性

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**無違規** - 本專案完全符合憲章要求，不需要複雜性追蹤。

---

## Post-Phase 1 Constitution Check 重新評估

*在完成 Phase 0 (研究) 和 Phase 1 (設計) 後重新評估憲章遵守情況*

### 評估日期: 2025-11-04

### 一、最小可行產品優先（MVP First）✅ PASS

**重新評估**: 設計階段已明確定義實作優先順序：
1. P1 (MVP): 基本列表顯示 + 音訊播放
2. P2: 點擊互動和視覺回饋
3. P3: 搜尋和語言切換

**設計決策符合性**:
- 資料模型專注於核心實體（Pokemon, LanguagePreference, AudioPlaybackState）
- 元件設計採用漸進式方法，先實作基本功能
- 未過度設計未來功能

**結論**: ✅ 完全符合

---

### 二、測試先行（Test-First）✅ PASS

**重新評估**: 設計階段已為 TDD 做好準備：
- 所有元件 API 都定義了測試契約和測試範例
- Hooks API 包含完整的測試策略
- 測試結構鏡像 src/ 結構，方便維護

**設計決策符合性**:
- component-api.md 包含每個元件的測試需求
- hooks-api.md 定義了使用 @testing-library/react-hooks 的測試方法
- 定義了 Mock 策略（PokéAPI, Web Speech API, LocalStorage）

**結論**: ✅ 完全符合，實作時必須嚴格遵循 TDD

---

### 三、型別安全與 TypeScript 優先 ✅ PASS

**重新評估**: 設計階段充分利用 TypeScript：
- data-model.md 定義了所有核心型別和介面
- 使用 Zod 進行執行時型別驗證
- 所有 API 契約都有完整的 TypeScript 型別定義

**設計決策符合性**:
- 無任何 `any` 型別使用
- 所有 Props、Return 型別都明確定義
- 使用泛型（如 `useVirtualScroll<T>`）提升可重用性

**技術選擇**: TypeScript 5.9.0（最新穩定版）

**結論**: ✅ 完全符合

---

### 四、元件化與可重用性 ✅ PASS

**重新評估**: 設計階段已規劃良好的元件架構：
- 7 個獨立、可重用的元件（PokemonCard, PokemonList, SearchBar 等）
- 每個元件職責單一且明確
- 元件通過 Props 接收資料，避免全域狀態直接存取

**設計決策符合性**:
- 元件 API 清楚定義 Props 介面
- 業務邏輯封裝在自訂 Hooks 中（usePokemonList, useAudioPlayer 等）
- 共用元件放在 `components/` 目錄

**結論**: ✅ 完全符合

---

### 五、效能與使用者體驗 ✅ PASS

**重新評估**: 設計階段已納入效能優化：
- 選擇了 @tanstack/react-virtual 實作虛擬滾動
- 使用 IndexedDB + localStorage 快取策略
- 定義了明確的效能目標（FCP < 1.5s, LCP < 2.5s, TTI < 3.5s）

**設計決策符合性**:
- research.md 包含效能基準分析
- data-model.md 估算了資料量和快取策略
- external-api.md 定義了請求批次處理和重試策略

**技術選擇**:
- Next.js 15.5.0（支援 React Server Components）
- @tanstack/react-virtual（60 FPS 虛擬滾動）
- Web Speech API + 預錄音訊降級方案

**結論**: ✅ 完全符合

---

### 六、可存取性（Accessibility）✅ PASS

**重新評估**: 設計階段已充分考量可存取性：
- 所有元件 API 定義了 ARIA 標籤需求
- 元件契約要求支援鍵盤操作
- 選擇 shadcn/ui（基於 Radix UI，優秀的 a11y 支援）

**設計決策符合性**:
- component-api.md 每個元件都有「無障礙」行為規範
- 定義了 role、aria-label、aria-pressed 等屬性
- 色彩對比度要求 WCAG 2.1 AA 級（4.5:1）

**結論**: ✅ 完全符合

---

### 七、正體中文優先 ✅ PASS

**重新評估**: 所有設計文件都使用正體中文：
- research.md、data-model.md、quickstart.md 全部使用正體中文
- 元件 API 和 Hooks API 的註解使用正體中文
- UI 文字定義為正體中文

**設計決策符合性**:
- 程式碼範例的註解使用正體中文
- 型別名稱和函式名稱使用英文（符合慣例）
- 文件和規格完全正體中文化

**結論**: ✅ 完全符合

---

### 總體評估

**通過狀態**: ✅ **完全通過，可以進入 Phase 2 (任務分解)**

**關鍵改善**:
1. 虛擬滾動方案已確定（@tanstack/react-virtual）
2. 音訊生成方案已確定（Web Speech API + 預錄降級）
3. UI 元件庫已確定（shadcn/ui）
4. 所有 NEEDS CLARIFICATION 項目已解決

**實作時的關鍵提醒**:
1. ⚠️ **必須嚴格遵循 TDD**：先寫測試，確認失敗，再實作
2. ⚠️ **元件大小限制**：每個元件不超過 200 行
3. ⚠️ **可存取性優先**：從一開始就實作 ARIA 標籤和鍵盤操作
4. ⚠️ **效能監控**：定期檢查 FCP、LCP、TTI 是否符合目標

**無需特殊批准** - 所有設計決策都符合憲章原則。
