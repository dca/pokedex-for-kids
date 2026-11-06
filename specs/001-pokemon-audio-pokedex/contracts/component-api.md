# 元件 API 契約

**專案**: 寶可夢語音圖鑑
**日期**: 2025-11-04
**狀態**: 設計階段

## 概述

本文件定義應用程式中所有 React 元件的公開 API（Props 介面）。這些契約確保元件之間的介面穩定且可預測。

---

## 1. PokemonCard

寶可夢卡片元件，顯示單一寶可夢的資訊並支援互動。

### Props

```typescript
interface PokemonCardProps {
  /** 寶可夢資料 */
  pokemon: Pokemon;

  /** 是否正在播放音訊 */
  isPlaying: boolean;

  /** 點擊卡片時的回呼 */
  onClick: (pokemonId: number) => void;

  /** 額外的 CSS 類別 */
  className?: string;

  /** 是否為精簡模式（僅顯示圖片和名稱） */
  compact?: boolean;

  /** 測試 ID（用於自動化測試） */
  testId?: string;
}
```

### 行為規範

- **視覺回饋**: 當 `isPlaying` 為 true 時，卡片應顯示視覺指示（如邊框高亮、動畫）
- **無障礙**: 必須支援鍵盤操作（Enter、Space 鍵觸發 onClick）
- **懶載入**: 圖片應使用懶載入以優化效能
- **錯誤處理**: 圖片載入失敗時顯示預設佔位圖

### 使用範例

```tsx
<PokemonCard
  pokemon={pikachu}
  isPlaying={currentPokemonId === pikachu.id}
  onClick={(id) => playAudio(id)}
  className="shadow-lg"
  testId="pokemon-card-25"
/>
```

---

## 2. PokemonList

寶可夢列表容器，負責虛擬滾動和列表管理。

### Props

```typescript
interface PokemonListProps {
  /** 要顯示的寶可夢陣列 */
  pokemons: Pokemon[];

  /** 當前播放中的寶可夢 ID */
  currentPlayingId: number | null;

  /** 點擊寶可夢時的回呼 */
  onPokemonClick: (pokemonId: number) => void;

  /** 是否正在載入 */
  isLoading?: boolean;

  /** 是否顯示為網格佈局（預設為 true） */
  gridLayout?: boolean;

  /** 網格列數（響應式） */
  columns?: {
    mobile: number;    // 預設 2
    tablet: number;    // 預設 3
    desktop: number;   // 預設 4
  };

  /** 測試 ID */
  testId?: string;
}
```

### 行為規範

- **虛擬滾動**: 必須使用虛擬滾動技術處理大量項目（1000+）
- **效能**: 滾動流暢度必須保持 60 FPS
- **載入狀態**: `isLoading` 為 true 時顯示骨架屏
- **空狀態**: `pokemons` 為空陣列時顯示「無結果」訊息
- **響應式**: 根據螢幕寬度自動調整列數

### 使用範例

```tsx
<PokemonList
  pokemons={filteredPokemons}
  currentPlayingId={audioState.currentPokemonId}
  onPokemonClick={handlePokemonClick}
  isLoading={isLoadingPokemons}
  columns={{ mobile: 2, tablet: 3, desktop: 5 }}
  testId="pokemon-list"
/>
```

---

## 3. SearchBar

搜尋列元件，提供即時搜尋功能。

### Props

```typescript
interface SearchBarProps {
  /** 當前搜尋值 */
  value: string;

  /** 搜尋值變更時的回呼 */
  onChange: (query: string) => void;

  /** 清除搜尋時的回呼 */
  onClear?: () => void;

  /** 佔位文字 */
  placeholder?: string;

  /** 是否正在搜尋中 */
  isSearching?: boolean;

  /** 搜尋結果數量（用於顯示） */
  resultCount?: number;

  /** 是否停用 */
  disabled?: boolean;

  /** 測試 ID */
  testId?: string;
}
```

### 行為規範

- **Debounce**: 必須使用 debounce（300ms）避免過度觸發
- **即時回饋**: 顯示搜尋中狀態（載入指示器）
- **結果計數**: 搜尋完成後顯示結果數量
- **清除按鈕**: 當 `value` 非空時顯示清除按鈕
- **無障礙**: 提供適當的 ARIA 標籤（role="search"）

### 使用範例

```tsx
<SearchBar
  value={searchQuery}
  onChange={setSearchQuery}
  onClear={() => setSearchQuery('')}
  placeholder="搜尋寶可夢..."
  isSearching={isSearching}
  resultCount={filteredPokemons.length}
  testId="pokemon-search"
/>
```

---

## 4. LanguageSelector

語言選擇器元件，讓使用者選擇音訊播放語言。

### Props

```typescript
interface LanguageSelectorProps {
  /** 當前語言模式 */
  currentMode: LanguageMode;

  /** 語言模式變更時的回呼 */
  onChange: (mode: LanguageMode) => void;

  /** 是否顯示為下拉選單（預設）或按鈕組 */
  variant?: 'dropdown' | 'buttons';

  /** 是否停用 */
  disabled?: boolean;

  /** 測試 ID */
  testId?: string;
}
```

### 行為規範

- **視覺回饋**: 當前選擇的語言模式應有明確的視覺指示
- **持久化**: 變更後立即儲存到 LocalStorage
- **無障礙**: 提供清楚的標籤和說明文字
- **響應式**: 在行動裝置上可能顯示為按鈕組，桌面顯示為下拉選單

### 使用範例

```tsx
<LanguageSelector
  currentMode={languagePreference.mode}
  onChange={handleLanguageChange}
  variant="buttons"
  testId="language-selector"
/>
```

---

## 5. AudioPlayer

音訊播放器元件（通常為無 UI 的邏輯元件）。

### Props

```typescript
interface AudioPlayerProps {
  /** 要播放的寶可夢 */
  pokemon: Pokemon | null;

  /** 語言偏好設定 */
  languagePreference: LanguagePreference;

  /** 播放狀態變更時的回呼 */
  onStatusChange: (status: PlaybackStatus) => void;

  /** 播放完成時的回呼 */
  onPlayComplete?: () => void;

  /** 播放錯誤時的回呼 */
  onError?: (error: string) => void;
}
```

### 行為規範

- **自動播放**: 當 `pokemon` 從 null 變為非 null 時自動開始播放
- **停止前一個**: 新播放開始時停止任何正在播放的音訊
- **語言處理**: 根據 `languagePreference.mode` 決定播放順序
- **錯誤恢復**: 播放失敗時嘗試降級方案（如預錄音訊）
- **音量控制**: 使用 `languagePreference.volume` 設定音量

### 使用範例

```tsx
<AudioPlayer
  pokemon={selectedPokemon}
  languagePreference={languagePreference}
  onStatusChange={setPlaybackStatus}
  onPlayComplete={() => setSelectedPokemon(null)}
  onError={(error) => console.error(error)}
/>
```

---

## 6. LoadingSpinner

載入指示器元件。

### Props

```typescript
interface LoadingSpinnerProps {
  /** 載入文字 */
  message?: string;

  /** 大小 */
  size?: 'small' | 'medium' | 'large';

  /** 是否全螢幕覆蓋 */
  fullscreen?: boolean;

  /** 測試 ID */
  testId?: string;
}
```

### 使用範例

```tsx
<LoadingSpinner
  message="載入寶可夢資料中..."
  size="large"
  fullscreen
  testId="loading-spinner"
/>
```

---

## 7. ErrorBoundary

錯誤邊界元件，捕捉並顯示錯誤。

### Props

```typescript
interface ErrorBoundaryProps {
  /** 子元件 */
  children: React.ReactNode;

  /** 自訂錯誤 UI */
  fallback?: (error: Error, resetError: () => void) => React.ReactNode;

  /** 錯誤發生時的回呼 */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}
```

### 使用範例

```tsx
<ErrorBoundary
  fallback={(error, reset) => (
    <div>
      <h2>發生錯誤</h2>
      <p>{error.message}</p>
      <button onClick={reset}>重試</button>
    </div>
  )}
  onError={(error, info) => console.error(error, info)}
>
  <PokemonList {...props} />
</ErrorBoundary>
```

---

## 元件層級結構

```
App
├── ErrorBoundary
│   └── PokemonListPage
│       ├── SearchBar
│       ├── LanguageSelector
│       ├── PokemonList
│       │   └── PokemonCard (虛擬滾動，多個)
│       ├── AudioPlayer (無 UI)
│       └── LoadingSpinner (條件渲染)
```

---

## 測試契約

每個元件必須包含以下測試：

### 單元測試

1. **Props 驗證**: 所有必需 props 的測試
2. **事件處理**: 回呼函式被正確呼叫
3. **條件渲染**: 根據不同 props 的渲染邏輯
4. **無障礙**: ARIA 屬性和鍵盤操作

### 整合測試

1. **元件互動**: 父子元件間的資料流
2. **狀態管理**: 狀態變更正確反映在 UI
3. **錯誤處理**: 錯誤情境的處理

### 測試範例

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { PokemonCard } from './PokemonCard';

describe('PokemonCard', () => {
  const mockPokemon: Pokemon = {
    id: 25,
    name: { en: 'Pikachu', zh: '皮卡丘' },
    dexNumber: '025',
    sprites: { official: '/pikachu.png', icon: '/pikachu-icon.png' },
    metadata: { generation: 1, isSpecialForm: false },
  };

  it('應該渲染寶可夢名稱', () => {
    render(
      <PokemonCard
        pokemon={mockPokemon}
        isPlaying={false}
        onClick={jest.fn()}
      />
    );
    expect(screen.getByText('皮卡丘')).toBeInTheDocument();
  });

  it('點擊時應該呼叫 onClick', () => {
    const handleClick = jest.fn();
    render(
      <PokemonCard
        pokemon={mockPokemon}
        isPlaying={false}
        onClick={handleClick}
      />
    );
    fireEvent.click(screen.getByTestId('pokemon-card-25'));
    expect(handleClick).toHaveBeenCalledWith(25);
  });

  it('播放中時應該顯示視覺指示', () => {
    const { container } = render(
      <PokemonCard
        pokemon={mockPokemon}
        isPlaying={true}
        onClick={jest.fn()}
      />
    );
    expect(container.firstChild).toHaveClass('playing');
  });
});
```

---

## 型別匯出

所有元件 Props 介面應從統一位置匯出：

```typescript
// src/components/index.ts
export { PokemonCard } from './PokemonCard';
export type { PokemonCardProps } from './PokemonCard';

export { PokemonList } from './PokemonList';
export type { PokemonListProps } from './PokemonList';

// ... 其他元件
```

---

## 變更管理

當元件 API 需要變更時：

1. **向後相容**: 盡可能保持向後相容，使用可選參數
2. **版本標註**: 標記棄用的 props（使用 `@deprecated` JSDoc 註解）
3. **遷移指南**: 提供從舊 API 遷移到新 API 的範例
4. **漸進式棄用**: 給予至少一個版本的棄用期

### 範例

```typescript
interface PokemonCardProps {
  pokemon: Pokemon;

  /** @deprecated 使用 onClick 代替 */
  onCardClick?: (id: number) => void;

  /** 點擊卡片時的回呼 */
  onClick: (pokemonId: number) => void;
}
```
