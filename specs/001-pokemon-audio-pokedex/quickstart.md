# 快速開始指南

**專案**: 寶可夢語音圖鑑
**日期**: 2025-11-04
**目標受眾**: 開發者

## 概述

本指南將引導你在 10 分鐘內建立開發環境並執行專案。

---

## 前置需求

### 系統需求

- **作業系統**: macOS, Linux, 或 Windows (WSL2)
- **Node.js**: 20.x LTS 或更高版本
- **npm**: 10.x 或更高版本（或 yarn, pnpm）
- **Git**: 任何最新版本

### 檢查版本

```bash
node --version   # 應顯示 v20.x.x
npm --version    # 應顯示 10.x.x
git --version    # 應顯示 git version x.x.x
```

### 瀏覽器需求

開發時建議使用：
- **Chrome** 90+ (推薦，最佳開發者工具)
- **Firefox** 88+
- **Safari** 14+ (測試 macOS/iOS 相容性)
- **Edge** 90+

---

## 安裝步驟

### 1. 克隆專案

```bash
# 克隆專案庫
git clone <repository-url> pokedex-for-kids
cd pokedex-for-kids

# 切換到功能分支
git checkout 001-pokemon-audio-pokedex
```

### 2. 安裝依賴

```bash
cd pokedex-for-kids-web
npm install
```

**預期輸出**:
```
added 324 packages in 15s
```

如果遇到問題，嘗試清除快取：
```bash
rm -rf node_modules package-lock.json
npm install
```

### 3. 檢查依賴版本

確認關鍵依賴已正確安裝：

```bash
npm list next react typescript tailwindcss
```

**預期輸出**:
```
pokedex-for-kids-web@0.1.0
├── next@15.5.0
├── react@19.2.0
├── tailwindcss@4.0.0
└── typescript@5.9.0
```

---

## 執行專案

### 1. 啟動開發伺服器

```bash
npm run dev
```

**預期輸出**:
```
▲ Next.js 15.5.0
- Local:        http://localhost:3000/pokedex-for-kids
- Network:      http://192.168.1.x:3000/pokedex-for-kids

✓ Ready in 2.3s
```

### 2. 開啟瀏覽器

在瀏覽器中訪問：
```
http://localhost:3000/pokedex-for-kids
```

**預期畫面**:
- 顯示「Pokedex!」標題
- 看到寶可夢列表
- 點擊寶可夢應播放名稱音訊

### 3. 測試功能

**基本測試清單**:
- [ ] 列表正確顯示所有寶可夢
- [ ] 圖片正確載入
- [ ] 點擊寶可夢播放音訊（需要瀏覽器支援 Web Speech API）
- [ ] 滾動列表流暢

---

## 專案結構概覽

```
pokedex-for-kids-web/
├── src/
│   ├── app/                    # Next.js App Router 頁面
│   │   ├── layout.tsx          # 根佈局
│   │   ├── page.tsx            # 首頁（重定向）
│   │   └── pokedex/            # 主功能頁面
│   │       └── page.tsx        # 寶可夢列表頁
│   ├── components/             # 共用元件（待建立）
│   ├── lib/                    # 工具函式（待建立）
│   ├── types/                  # TypeScript 型別（待建立）
│   └── hooks/                  # 自訂 Hooks（待建立）
├── public/                     # 靜態資源
├── next.config.js              # Next.js 配置
├── tailwind.config.ts          # Tailwind 配置
├── tsconfig.json               # TypeScript 配置
└── package.json                # 專案依賴
```

---

## 開發工作流程

### 典型的開發循環

```bash
# 1. 建立功能分支（如果還沒有）
git checkout -b 001-pokemon-audio-pokedex

# 2. 啟動開發伺服器
npm run dev

# 3. 開發功能（編輯檔案）
# 檔案變更會自動熱重載

# 4. 執行測試（TDD）
npm test

# 5. 執行 Linter
npm run lint

# 6. 建立生產版本（可選）
npm run build

# 7. 提交變更
git add .
git commit -m "feat: 新增寶可夢卡片元件"
```

---

## 常用指令

### 開發指令

```bash
# 啟動開發伺服器（熱重載）
npm run dev

# 建立生產版本
npm run build

# 預覽生產版本
npm run start

# 執行 Linter 檢查
npm run lint

# 自動修復 Lint 錯誤
npm run lint -- --fix
```

### 測試指令

```bash
# 執行所有測試（監視模式）
npm test

# 執行所有測試（單次）
npm run test:ci

# 執行測試並產生覆蓋率報告
npm run test:ci -- --coverage

# 執行特定測試檔案
npm test -- PokemonCard.test.tsx
```

### 套件管理

```bash
# 安裝新依賴（生產環境）
npm install <package-name>

# 安裝新依賴（開發環境）
npm install --save-dev <package-name>

# 更新依賴到最新版本
npm update

# 檢查過時的依賴
npm outdated

# 移除依賴
npm uninstall <package-name>
```

---

## 配置編輯器

### Visual Studio Code

推薦安裝以下擴充套件：

1. **ESLint** (`dbaeumer.vscode-eslint`)
   - 即時顯示 Lint 錯誤

2. **Prettier** (`esbenp.prettier-vscode`)
   - 自動格式化程式碼

3. **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`)
   - Tailwind 類別自動完成

4. **TypeScript Error Translator** (`mattpocock.ts-error-translator`)
   - 翻譯 TypeScript 錯誤訊息

### VSCode 設定

建立 `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

---

## 環境變數

### 開發環境

建立 `.env.local` 檔案（如需要）:

```bash
# PokéAPI 基礎 URL（可選，預設使用官方 API）
NEXT_PUBLIC_POKEAPI_BASE_URL=https://pokeapi.co/api/v2

# Sentry DSN（可選，用於錯誤追蹤）
# NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn

# 是否啟用除錯模式
NEXT_PUBLIC_DEBUG_MODE=true
```

**注意**: `.env.local` 已被 `.gitignore` 排除，不會提交到版本控制。

---

## 除錯技巧

### React DevTools

1. 安裝 [React Developer Tools](https://react.dev/learn/react-developer-tools)
2. 開啟瀏覽器開發者工具
3. 切換到「Components」或「Profiler」頁籤

### Next.js DevTools

開發模式下，Next.js 會自動顯示：
- 編譯錯誤
- React 錯誤邊界
- 路由資訊

### 常見問題除錯

#### 1. 模組找不到

**錯誤**:
```
Module not found: Can't resolve '@/components/...'
```

**解決**:
```bash
# 確認 TypeScript 路徑別名配置
cat tsconfig.json | grep -A 5 "paths"

# 重啟開發伺服器
npm run dev
```

#### 2. 型別錯誤

**錯誤**:
```
Type 'X' is not assignable to type 'Y'
```

**解決**:
1. 檢查型別定義是否正確
2. 使用 TypeScript 語言伺服器重新載入專案（VSCode: Cmd+Shift+P → "TypeScript: Restart TS Server"）

#### 3. 樣式未載入

**錯誤**: Tailwind 類別沒有效果

**解決**:
```bash
# 檢查 Tailwind 配置
cat tailwind.config.ts

# 確認 globals.css 已正確匯入
cat src/app/layout.tsx | grep globals.css

# 重建專案
rm -rf .next
npm run dev
```

---

## 執行測試

### 第一次執行測試

```bash
# 執行所有測試（監視模式）
npm test

# 按 'a' 執行所有測試
# 按 'q' 退出
```

**預期輸出**:
```
PASS  src/app/page.test.tsx
PASS  src/app/pokedex-kids/page.test.tsx

Test Suites: 2 passed, 2 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        3.256s
```

### 測試驅動開發 (TDD) 流程

```bash
# 1. 撰寫失敗的測試
# 編輯 src/components/PokemonCard.test.tsx

# 2. 執行測試（應該失敗）
npm test -- PokemonCard.test.tsx

# 3. 實作最小程式碼讓測試通過
# 編輯 src/components/PokemonCard.tsx

# 4. 測試應該通過
# 5. 重構程式碼（保持測試通過）
```

---

## 建立生產版本

### 本地建立

```bash
# 建立靜態輸出
npm run build
```

**預期輸出**:
```
▲ Next.js 15.5.0

✓ Linting and checking validity of types
✓ Creating an optimized production build
✓ Collecting page data
✓ Generating static pages (3/3)
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    137 B          75 kB
└ ○ /pokedex-kids                        5.2 kB         85 kB
+ First Load JS shared by all            70.8 kB
  ├ chunks/framework-[hash].js           45 kB
  └ chunks/main-app-[hash].js            25.8 kB

○  (Static)  automatically rendered as static HTML (uses no initial props)
```

### 檢視建立結果

```bash
# 查看輸出目錄
ls -lh out/

# 使用靜態伺服器預覽
npx serve out/
```

在瀏覽器訪問 `http://localhost:3000/pokedex-for-kids`

---

## 效能檢查

### 使用 Lighthouse

1. 開啟 Chrome DevTools
2. 切換到「Lighthouse」頁籤
3. 選擇「Desktop」或「Mobile」
4. 點擊「Analyze page load」

**目標分數**:
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 80

### 使用 Bundle Analyzer

```bash
# 安裝 bundle analyzer
npm install --save-dev @next/bundle-analyzer

# 分析 bundle 大小
ANALYZE=true npm run build
```

---

## 下一步

現在你已經成功執行專案！接下來可以：

1. **閱讀設計文件**:
   - [data-model.md](./data-model.md) - 資料模型
   - [contracts/component-api.md](./contracts/component-api.md) - 元件 API
   - [contracts/hooks-api.md](./contracts/hooks-api.md) - Hooks API

2. **查看實作計畫**:
   - [plan.md](./plan.md) - 完整實作計畫

3. **開始開發**:
   - 使用 `/speckit.tasks` 產生任務列表
   - 遵循 TDD 流程開始實作功能

4. **參與協作**:
   - 閱讀 [.specify/memory/constitution.md](../../.specify/memory/constitution.md) - 專案憲章
   - 遵循程式碼風格和提交規範

---

## 取得協助

### 文件資源

- **Next.js 文件**: https://nextjs.org/docs
- **React 文件**: https://react.dev
- **Tailwind CSS 文件**: https://tailwindcss.com/docs
- **TypeScript 文件**: https://www.typescriptlang.org/docs
- **PokéAPI 文件**: https://pokeapi.co/docs/v2

### 專案文件

- **功能規格**: [spec.md](./spec.md)
- **實作計畫**: [plan.md](./plan.md)
- **技術研究**: [research.md](./research.md)
- **專案憲章**: [../../.specify/memory/constitution.md](../../.specify/memory/constitution.md)

### 常見問題

#### Q: 為什麼音訊不播放？

**A**: 檢查以下幾點：
1. 瀏覽器是否支援 Web Speech API（檢查 `window.speechSynthesis`）
2. 是否在使用者互動後才嘗試播放（某些瀏覽器限制）
3. 檢查瀏覽器控制台是否有錯誤訊息

#### Q: 如何切換到不同的 Node.js 版本？

**A**: 使用 nvm (Node Version Manager):
```bash
# 安裝 Node.js 20
nvm install 20

# 切換到 Node.js 20
nvm use 20

# 設定為預設版本
nvm alias default 20
```

#### Q: 測試失敗怎麼辦？

**A**:
1. 確認測試檔案路徑正確
2. 檢查 mock 是否正確設定
3. 清除 Jest 快取：`npx jest --clearCache`
4. 查看詳細錯誤訊息

#### Q: 如何升級依賴套件？

**A**:
```bash
# 檢查可更新的套件
npm outdated

# 更新特定套件到最新版本
npm install <package-name>@latest

# 更新所有次要版本
npm update

# 更新所有主要版本（謹慎使用）
npx npm-check-updates -u
npm install
```

---

## 疑難排解

### 問題：Port 3000 已被佔用

```bash
# 查找佔用 Port 的程序
lsof -i :3000

# 終止程序
kill -9 <PID>

# 或使用不同的 Port
PORT=3001 npm run dev
```

### 問題：依賴安裝失敗

```bash
# 清除 npm 快取
npm cache clean --force

# 刪除 node_modules 和 lock 檔案
rm -rf node_modules package-lock.json

# 重新安裝
npm install
```

### 問題：TypeScript 錯誤

```bash
# 重新產生 TypeScript 定義
rm -rf .next
npm run dev

# 檢查 TypeScript 配置
npx tsc --noEmit
```

---

## 成功檢查清單

在開始開發前，確認以下所有項目：

- [ ] Node.js 20.x 已安裝
- [ ] 專案已克隆並切換到正確分支
- [ ] 依賴已成功安裝（`npm install` 無錯誤）
- [ ] 開發伺服器可以啟動（`npm run dev`）
- [ ] 瀏覽器可以訪問 `http://localhost:3000/pokedex-for-kids`
- [ ] 頁面正確顯示寶可夢列表
- [ ] 測試可以執行（`npm test`）
- [ ] VSCode 擴充套件已安裝（可選但推薦）
- [ ] 已閱讀專案憲章 [constitution.md](../../.specify/memory/constitution.md)
- [ ] 已閱讀功能規格 [spec.md](./spec.md)

**恭喜！你現在可以開始開發寶可夢語音圖鑑了！** 🎉
