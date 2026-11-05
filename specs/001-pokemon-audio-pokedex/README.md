# 寶可夢語音圖鑑 (Pokemon Audio Pokedex)

一個為兒童設計的互動式寶可夢圖鑑，支援中英文語音播放，採用現代化的 UI 設計。

## 🎯 功能特色

- ✅ **完整寶可夢列表** - 顯示所有寶可夢及其圖片
- ✅ **中英文雙語音** - 點擊寶可夢即可播放中英文名稱
- ✅ **智慧搜尋** - 支援中文、英文部分匹配搜尋
- ✅ **語言設定** - 可選擇僅中文、僅英文或雙語播放
- ✅ **虛擬滾動** - 流暢顯示 1000+ 隻寶可夢 (60 FPS)
- ✅ **快速啟動** - 預載資料，瞬間載入
- ✅ **現代化 UI** - 採用 Naive UI 設計風格，漸層色彩、流暢動畫
- ✅ **響應式設計** - 完美支援手機、平板和桌面

## 🎨 UI 設計特色

### 視覺效果
- **漸層背景** - 藍色到紫色到粉色的夢幻漸層
- **卡片設計** - 圓角、陰影、懸停效果
- **流暢動畫** - 卡片懸停上浮、按鈕縮放效果
- **精靈球載入動畫** - 旋轉的精靈球造型載入指示器

### 互動體驗
- **視覺反饋** - 點擊時的動畫和顏色變化
- **播放指示** - 三色脈動點顯示正在播放的寶可夢
- **搜尋提示** - 即時顯示搜尋關鍵字
- **音量視覺化** - 動態音量圖示和進度條

## 🚀 快速開始

\`\`\`bash
# 安裝依賴
npm install

# 抓取寶可夢資料（首次使用）
node scripts/fetch-pokemon-data.js

# 啟動開發伺服器
npm run dev

# 建立生產版本
npm run build
\`\`\`

訪問 http://localhost:3002/pokedex-for-kids/ 即可使用

## 📚 技術堆棧

### 核心框架
- **Next.js 15.5.0** - React 框架，支援靜態匯出
- **React 19.2.0** - UI 庫
- **TypeScript 5.9.3** - 型別安全

### UI & 樣式
- **Tailwind CSS 4.0.0** - 原子化 CSS 框架
- **Naive UI** - UI 設計指南（設計風格）
- 自訂動畫與漸層效果

### 功能庫
- **@tanstack/react-virtual** - 虛擬滾動優化
- **Web Speech API** - 瀏覽器原生 TTS
- **IndexedDB** - 本地資料快取
- **localStorage** - 用戶偏好設定

## 📁 專案結構

\`\`\`
src/
├── app/                    # Next.js App Router 頁面
│   ├── page.tsx           # 主頁（寶可夢列表）
│   └── settings/          # 設定頁面
├── components/            # React 組件
│   ├── PokemonCard.tsx   # 寶可夢卡片（現代化設計）
│   ├── PokemonList.tsx   # 虛擬滾動列表
│   ├── SearchBar.tsx     # 搜尋列（圓角設計）
│   ├── LoadingSpinner.tsx # 精靈球載入動畫
│   └── LanguageSelector.tsx # 語言選擇器（卡片式）
├── hooks/                 # 自訂 React Hooks
├── services/             # 業務邏輯服務
├── types/                # TypeScript 類型定義
└── constants/            # 常數定義

public/
└── data/
    └── pokemon.json      # 預載的寶可夢資料

scripts/
└── fetch-pokemon-data.js # 資料抓取腳本
\`\`\`

## 🎯 使用指南

### 首頁
1. **搜尋** - 在頂部搜尋列輸入寶可夢名稱（中英文皆可）
2. **點擊** - 點擊任意寶可夢卡片聽取名稱發音
3. **設定** - 點擊右上角設定按鈕進入設定頁面

### 設定頁面
1. **語言模式** - 選擇僅中文、僅英文或中英文雙語
2. **音量控制** - 拖動滑桿調整語音音量
3. **使用說明** - 查看詳細使用指南

## 🌟 UI 更新亮點 (v2.0)

### 2025-11-05 重大 UI 更新
- ✨ 採用 Naive UI 設計語言
- 🎨 漸層色彩系統（藍-紫-粉）
- 🃏 現代化卡片設計
- 💫 流暢動畫效果
- 📱 優化移動端體驗
- 🎭 精靈球主題載入動畫
- 🔊 視覺化音量控制

詳細文件請參閱 [quickstart.md](specs/001-pokemon-audio-pokedex/quickstart.md)
