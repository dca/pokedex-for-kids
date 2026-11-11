# Hooks API 契約

**專案**: 寶可夢語音圖鑑
**日期**: 2025-11-04
**狀態**: 設計階段

## 概述

本文件定義應用程式中所有自訂 React Hooks 的 API 契約。這些 Hooks 封裝業務邏輯，確保元件保持純粹和可重用。

---

## 1. usePokemonList

管理寶可夢列表的載入、快取和狀態。

### 簽章

```typescript
function usePokemonList(options?: UsePokemonListOptions): UsePokemonListReturn;
```

### Options

```typescript
interface UsePokemonListOptions {
  /** 是否在載入時自動獲取資料（預設 true） */
  autoFetch?: boolean;

  /** 快取有效期（毫秒，預設 7 天） */
  cacheExpiry?: number;

  /** 是否優先使用快取（預設 true） */
  preferCache?: boolean;

  /** 是否在背景更新過期快取（預設 true） */
  backgroundRefresh?: boolean;
}
```

### Return

```typescript
interface UsePokemonListReturn {
  /** 寶可夢列表 */
  pokemons: Pokemon[];

  /** 是否正在載入 */
  isLoading: boolean;

  /** 是否有錯誤 */
  error: Error | null;

  /** 是否從快取載入 */
  isFromCache: boolean;

  /** 手動重新載入 */
  refetch: () => Promise<void>;

  /** 清除快取 */
  clearCache: () => void;
}
```

### 行為規範

1. **初始載入**:
   - 檢查快取是否存在且未過期
   - 快取有效 → 返回快取資料，設定 `isFromCache: true`
   - 快取無效或不存在 → 從 PokéAPI 獲取資料

2. **背景更新**:
   - 如果快取過期但存在，先顯示舊資料
   - 在背景獲取新資料
   - 新資料就緒後更新狀態

3. **錯誤處理**:
   - 網路錯誤 → 如果有快取，繼續使用快取
   - API 錯誤 → 設定 `error` 狀態

### 使用範例

```typescript
function PokemonListPage() {
  const {
    pokemons,
    isLoading,
    error,
    isFromCache,
    refetch,
  } = usePokemonList({
    autoFetch: true,
    preferCache: true,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;

  return (
    <>
      {isFromCache && <CacheBadge />}
      <PokemonList pokemons={pokemons} />
    </>
  );
}
```

### 測試重點

- 快取命中時不發送 API 請求
- 快取過期時發送 API 請求
- 網路錯誤時返回快取資料
- `refetch` 強制更新資料

---

## 2. useAudioPlayer

管理音訊播放邏輯和狀態。

### 簽章

```typescript
function useAudioPlayer(
  languagePreference: LanguagePreference
): UseAudioPlayerReturn;
```

### Return

```typescript
interface UseAudioPlayerReturn {
  /** 當前播放狀態 */
  playbackState: AudioPlaybackState;

  /** 播放指定寶可夢的音訊 */
  play: (pokemon: Pokemon) => Promise<void>;

  /** 停止播放 */
  stop: () => void;

  /** 暫停播放 */
  pause: () => void;

  /** 繼續播放 */
  resume: () => void;

  /** 是否支援 Web Speech API */
  isSpeechSupported: boolean;
}
```

### 行為規範

1. **語言模式處理**:
   - `'zh-only'` → 僅播放中文
   - `'en-only'` → 僅播放英文
   - `'both'` → 依序播放中文和英文（間隔依據 `playbackOrder.delay`）

2. **音訊來源優先順序**:
   1. Web Speech API（如果支援）
   2. 預錄音訊檔案（如果存在）
   3. 降級到靜默（顯示錯誤）

3. **狀態管理**:
   - 播放開始 → `status: 'loading'`
   - 音訊就緒 → `status: 'playing'`
   - 播放完成 → `status: 'idle'`
   - 發生錯誤 → `status: 'error'`

4. **中斷處理**:
   - 新播放開始時自動停止前一個
   - 系統音訊中斷時優雅停止

### 使用範例

```typescript
function PokemonPage() {
  const languagePreference = usePreferences();
  const { playbackState, play, stop, isSpeechSupported } = useAudioPlayer(
    languagePreference
  );

  const handlePokemonClick = async (pokemon: Pokemon) => {
    await play(pokemon);
  };

  return (
    <div>
      {!isSpeechSupported && (
        <Warning message="您的瀏覽器不支援語音合成" />
      )}
      <PokemonList
        currentPlayingId={playbackState.currentPokemonId}
        onPokemonClick={handlePokemonClick}
      />
    </div>
  );
}
```

### 測試重點

- 不同語言模式的播放順序
- Web Speech API 不支援時的降級
- 播放中斷時的狀態變更
- 錯誤情境的處理

---

## 3. useSearch

管理搜尋邏輯和過濾。

### 簽章

```typescript
function useSearch(
  items: Pokemon[],
  options?: UseSearchOptions
): UseSearchReturn;
```

### Options

```typescript
interface UseSearchOptions {
  /** Debounce 延遲（毫秒，預設 300） */
  debounceDelay?: number;

  /** 搜尋欄位（預設 ['name.zh', 'name.en']） */
  searchFields?: string[];

  /** 是否區分大小寫（預設 false） */
  caseSensitive?: boolean;

  /** 最小搜尋字元數（預設 0） */
  minSearchLength?: number;
}
```

### Return

```typescript
interface UseSearchReturn {
  /** 搜尋查詢 */
  query: string;

  /** 設定搜尋查詢 */
  setQuery: (query: string) => void;

  /** 過濾後的結果 */
  results: Pokemon[];

  /** 是否正在搜尋（debounce 期間） */
  isSearching: boolean;

  /** 清除搜尋 */
  clearSearch: () => void;

  /** 結果數量 */
  resultCount: number;
}
```

### 行為規範

1. **Debounce**:
   - 使用者輸入後延遲 `debounceDelay` 毫秒才執行搜尋
   - 延遲期間 `isSearching: true`

2. **搜尋邏輯**:
   - 部分匹配（如「皮卡」匹配「皮卡丘」）
   - 預設不區分大小寫
   - 同時搜尋中英文名稱

3. **空查詢**:
   - `query` 為空字串時返回所有項目

### 使用範例

```typescript
function PokemonListPage() {
  const { pokemons } = usePokemonList();
  const {
    query,
    setQuery,
    results,
    isSearching,
    resultCount,
    clearSearch,
  } = useSearch(pokemons, {
    debounceDelay: 300,
    searchFields: ['name.zh', 'name.en'],
  });

  return (
    <>
      <SearchBar
        value={query}
        onChange={setQuery}
        onClear={clearSearch}
        isSearching={isSearching}
        resultCount={resultCount}
      />
      <PokemonList pokemons={results} />
    </>
  );
}
```

### 測試重點

- Debounce 功能正常運作
- 中英文搜尋都能正確匹配
- 部分匹配功能
- 空查詢返回所有結果

---

## 4. usePreferences

管理使用者偏好設定（語言選擇、音量等）。

### 簽章

```typescript
function usePreferences(): UsePreferencesReturn;
```

### Return

```typescript
interface UsePreferencesReturn {
  /** 當前偏好設定 */
  preferences: LanguagePreference;

  /** 更新語言模式 */
  setLanguageMode: (mode: LanguageMode) => void;

  /** 更新播放順序 */
  setPlaybackOrder: (order: { first: 'zh' | 'en'; delay: number }) => void;

  /** 更新音量 */
  setVolume: (volume: number) => void;

  /** 重置為預設值 */
  resetToDefault: () => void;

  /** 是否已初始化（從 LocalStorage 載入） */
  isInitialized: boolean;
}
```

### 行為規範

1. **初始化**:
   - 從 LocalStorage 讀取 `language-preference`
   - 如果不存在或無效，使用預設值

2. **持久化**:
   - 每次更新立即寫入 LocalStorage
   - 寫入失敗時記錄錯誤但不中斷

3. **預設值**:
   ```typescript
   {
     mode: 'both',
     playbackOrder: { first: 'zh', delay: 800 },
     volume: 0.8,
     lastUpdated: new Date().toISOString(),
   }
   ```

### 使用範例

```typescript
function SettingsPage() {
  const {
    preferences,
    setLanguageMode,
    setVolume,
    resetToDefault,
  } = usePreferences();

  return (
    <div>
      <LanguageSelector
        currentMode={preferences.mode}
        onChange={setLanguageMode}
      />
      <VolumeSlider
        value={preferences.volume}
        onChange={setVolume}
      />
      <button onClick={resetToDefault}>重置為預設值</button>
    </div>
  );
}
```

### 測試重點

- LocalStorage 讀寫正常
- 更新後立即持久化
- LocalStorage 不可用時的降級處理
- 預設值正確

---

## 5. useVirtualScroll

處理虛擬滾動邏輯（基於 @tanstack/react-virtual）。

### 簽章

```typescript
function useVirtualScroll<T>(
  items: T[],
  options?: UseVirtualScrollOptions
): UseVirtualScrollReturn<T>;
```

### Options

```typescript
interface UseVirtualScrollOptions {
  /** 每個項目的預估高度（像素） */
  estimateSize?: number;

  /** 超量渲染數量（上下額外渲染的項目數） */
  overscan?: number;

  /** 滾動容器 ref */
  parentRef?: React.RefObject<HTMLElement>;
}
```

### Return

```typescript
interface UseVirtualScrollReturn<T> {
  /** 虛擬化的項目 */
  virtualItems: VirtualItem[];

  /** 總高度 */
  totalSize: number;

  /** 測量項目大小的 ref */
  measureElement: (element: HTMLElement | null) => void;

  /** 滾動到指定索引 */
  scrollToIndex: (index: number, options?: ScrollToOptions) => void;
}
```

### 使用範例

```typescript
function PokemonList({ pokemons }: { pokemons: Pokemon[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const { virtualItems, totalSize, measureElement } = useVirtualScroll(
    pokemons,
    {
      estimateSize: 200,
      overscan: 5,
      parentRef,
    }
  );

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${totalSize}px`, position: 'relative' }}>
        {virtualItems.map((virtualItem) => (
          <div
            key={virtualItem.key}
            data-index={virtualItem.index}
            ref={measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <PokemonCard pokemon={pokemons[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 6. useLocalStorage

通用的 LocalStorage 存取 Hook。

### 簽章

```typescript
function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  options?: UseLocalStorageOptions<T>
): UseLocalStorageReturn<T>;
```

### Options

```typescript
interface UseLocalStorageOptions<T> {
  /** 序列化函式（預設 JSON.stringify） */
  serializer?: (value: T) => string;

  /** 反序列化函式（預設 JSON.parse） */
  deserializer?: (value: string) => T;

  /** 驗證函式（檢查載入的值是否有效） */
  validator?: (value: unknown) => value is T;
}
```

### Return

```typescript
interface UseLocalStorageReturn<T> {
  /** 當前值 */
  value: T;

  /** 設定值 */
  setValue: (value: T | ((prev: T) => T)) => void;

  /** 移除值 */
  removeValue: () => void;

  /** 是否可用（某些瀏覽器可能禁用 LocalStorage） */
  isAvailable: boolean;
}
```

### 使用範例

```typescript
function useTheme() {
  const { value: theme, setValue: setTheme } = useLocalStorage<'light' | 'dark'>(
    'theme',
    'light',
    {
      validator: (value): value is 'light' | 'dark' =>
        value === 'light' || value === 'dark',
    }
  );

  return { theme, setTheme };
}
```

---

## Hooks 測試策略

### 測試框架

使用 `@testing-library/react-hooks` 測試 Hooks：

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useAudioPlayer } from './useAudioPlayer';

describe('useAudioPlayer', () => {
  it('應該初始化為 idle 狀態', () => {
    const { result } = renderHook(() =>
      useAudioPlayer(DEFAULT_PREFERENCE)
    );

    expect(result.current.playbackState.status).toBe('idle');
  });

  it('播放寶可夢時應該更新狀態', async () => {
    const { result } = renderHook(() =>
      useAudioPlayer(DEFAULT_PREFERENCE)
    );

    await act(async () => {
      await result.current.play(mockPokemon);
    });

    expect(result.current.playbackState.status).toBe('playing');
    expect(result.current.playbackState.currentPokemonId).toBe(25);
  });
});
```

### Mock 策略

```typescript
// Mock Web Speech API
global.speechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  getVoices: jest.fn(() => []),
  speaking: false,
  pending: false,
  paused: false,
} as any;

// Mock LocalStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;
```

---

## Hooks 依賴圖

```mermaid
graph TD
    A[usePreferences] --> B[useLocalStorage]
    C[useAudioPlayer] --> A
    D[usePokemonList] --> B
    D --> E[useCache]
    F[useSearch] --> G[useDebounce]
    H[useVirtualScroll] --> I[@tanstack/react-virtual]
```

---

## 最佳實踐

1. **單一職責**: 每個 Hook 專注於一個特定功能
2. **可測試性**: 避免直接存取全域物件，使用依賴注入
3. **錯誤處理**: 所有副作用都應有適當的錯誤處理
4. **型別安全**: 充分利用 TypeScript 的泛型和型別推論
5. **文件化**: 每個 Hook 都應有完整的 JSDoc 註解

### JSDoc 範例

```typescript
/**
 * 管理音訊播放邏輯和狀態
 *
 * @param languagePreference - 使用者的語言偏好設定
 * @returns 音訊播放器的狀態和控制方法
 *
 * @example
 * ```tsx
 * const { play, playbackState } = useAudioPlayer(preferences);
 *
 * const handleClick = async () => {
 *   await play(pokemon);
 * };
 * ```
 */
export function useAudioPlayer(
  languagePreference: LanguagePreference
): UseAudioPlayerReturn {
  // ...
}
```
