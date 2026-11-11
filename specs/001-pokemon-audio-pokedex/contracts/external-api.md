# 外部 API 契約

**專案**: 寶可夢語音圖鑑
**日期**: 2025-11-04
**狀態**: 設計階段

## 概述

本文件定義應用程式與外部服務（PokéAPI、Web Speech API）的整合契約。包含請求格式、回應結構、錯誤處理和重試策略。

---

## 1. PokéAPI

官方寶可夢資料 API。

### 基礎資訊

- **基礎 URL**: `https://pokeapi.co/api/v2`
- **協議**: HTTPS
- **認證**: 無需認證（公開 API）
- **速率限制**: 無官方限制，但建議每秒不超過 100 請求
- **文件**: https://pokeapi.co/docs/v2

---

### 1.1 獲取寶可夢列表

獲取所有寶可夢的基本資訊（分頁）。

#### 請求

```http
GET /pokemon?limit={limit}&offset={offset}
```

**查詢參數**:
- `limit` (number): 每頁項目數（預設 20，建議 1000）
- `offset` (number): 跳過的項目數（預設 0）

**範例**:
```
GET https://pokeapi.co/api/v2/pokemon?limit=1000&offset=0
```

#### 回應

**成功 (200)**:
```typescript
interface PokemonListResponse {
  count: number;           // 總寶可夢數量
  next: string | null;     // 下一頁 URL
  previous: string | null; // 上一頁 URL
  results: Array<{
    name: string;          // 寶可夢名稱（英文小寫）
    url: string;           // 詳細資訊 URL
  }>;
}
```

**範例回應**:
```json
{
  "count": 1281,
  "next": "https://pokeapi.co/api/v2/pokemon?offset=1000&limit=100",
  "previous": null,
  "results": [
    {
      "name": "bulbasaur",
      "url": "https://pokeapi.co/api/v2/pokemon/1/"
    },
    {
      "name": "ivysaur",
      "url": "https://pokeapi.co/api/v2/pokemon/2/"
    }
  ]
}
```

---

### 1.2 獲取寶可夢詳細資訊

獲取單一寶可夢的完整資訊。

#### 請求

```http
GET /pokemon/{id_or_name}
```

**路徑參數**:
- `id_or_name` (number | string): 寶可夢 ID 或名稱

**範例**:
```
GET https://pokeapi.co/api/v2/pokemon/25
GET https://pokeapi.co/api/v2/pokemon/pikachu
```

#### 回應

**成功 (200)**:
```typescript
interface PokemonDetailResponse {
  id: number;
  name: string;
  order: number;
  sprites: {
    front_default: string;
    other: {
      'official-artwork': {
        front_default: string;  // 高品質美術圖
      };
    };
  };
  species: {
    name: string;
    url: string;  // 物種詳細資訊 URL（包含中文名稱）
  };
  // ... 其他欄位（能力、屬性等，本專案暫不使用）
}
```

**範例回應** (簡化):
```json
{
  "id": 25,
  "name": "pikachu",
  "order": 32,
  "sprites": {
    "front_default": "https://raw.githubusercontent.com/.../25.png",
    "other": {
      "official-artwork": {
        "front_default": "https://raw.githubusercontent.com/.../25.png"
      }
    }
  },
  "species": {
    "name": "pikachu",
    "url": "https://pokeapi.co/api/v2/pokemon-species/25/"
  }
}
```

---

### 1.3 獲取寶可夢物種資訊

獲取寶可夢的物種資訊，包含多語言名稱。

#### 請求

```http
GET /pokemon-species/{id}
```

**路徑參數**:
- `id` (number): 寶可夢 ID

**範例**:
```
GET https://pokeapi.co/api/v2/pokemon-species/25
```

#### 回應

**成功 (200)**:
```typescript
interface PokemonSpeciesResponse {
  id: number;
  name: string;
  names: Array<{
    name: string;      // 本地化名稱
    language: {
      name: string;    // 語言代碼 (如 'zh-Hant', 'en')
      url: string;
    };
  }>;
  generation: {
    name: string;      // 如 'generation-i'
    url: string;
  };
  is_legendary: boolean;
  is_mythical: boolean;
  // ... 其他欄位
}
```

**範例回應** (簡化):
```json
{
  "id": 25,
  "name": "pikachu",
  "names": [
    {
      "name": "Pikachu",
      "language": { "name": "en", "url": "..." }
    },
    {
      "name": "皮卡丘",
      "language": { "name": "zh-Hant", "url": "..." }
    }
  ],
  "generation": {
    "name": "generation-i",
    "url": "..."
  }
}
```

---

### 錯誤處理

#### 常見錯誤

**404 Not Found**:
```json
{
  "detail": "Not found."
}
```
- **原因**: 寶可夢 ID 或名稱不存在
- **處理**: 跳過此寶可夢或顯示預設資料

**429 Too Many Requests**:
```json
{
  "detail": "Request was throttled."
}
```
- **原因**: 超過速率限制
- **處理**: 使用指數退避重試（1s, 2s, 4s）

**500 Internal Server Error**:
```json
{
  "detail": "Internal server error."
}
```
- **原因**: API 伺服器錯誤
- **處理**: 重試 3 次，失敗後使用快取

---

### 客戶端實作

#### 基礎客戶端

```typescript
// src/lib/pokeapi.ts

const BASE_URL = 'https://pokeapi.co/api/v2';
const REQUEST_TIMEOUT = 10000; // 10 秒

interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

/**
 * 帶超時和重試的 fetch 包裝器
 */
async function fetchWithRetry(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { timeout = REQUEST_TIMEOUT, retries = 3, ...fetchOptions } = options;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429 && attempt < retries - 1) {
          // 速率限制：指數退避
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      if (attempt === retries - 1) throw error;
      // 重試
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error('Max retries exceeded');
}

/**
 * 獲取寶可夢列表
 */
export async function fetchPokemonList(
  limit: number = 1000,
  offset: number = 0
): Promise<PokemonListResponse> {
  const url = `${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`;
  const response = await fetchWithRetry(url);
  return response.json();
}

/**
 * 獲取寶可夢詳細資訊
 */
export async function fetchPokemonDetail(
  idOrName: number | string
): Promise<PokemonDetailResponse> {
  const url = `${BASE_URL}/pokemon/${idOrName}`;
  const response = await fetchWithRetry(url);
  return response.json();
}

/**
 * 獲取寶可夢物種資訊（包含中文名稱）
 */
export async function fetchPokemonSpecies(
  id: number
): Promise<PokemonSpeciesResponse> {
  const url = `${BASE_URL}/pokemon-species/${id}`;
  const response = await fetchWithRetry(url);
  return response.json();
}

/**
 * 批次獲取寶可夢資料（並行請求，限制並發數）
 */
export async function fetchPokemonBatch(
  ids: number[],
  concurrency: number = 10
): Promise<Pokemon[]> {
  const results: Pokemon[] = [];

  for (let i = 0; i < ids.length; i += concurrency) {
    const batch = ids.slice(i, i + concurrency);
    const promises = batch.map(async (id) => {
      try {
        const [detail, species] = await Promise.all([
          fetchPokemonDetail(id),
          fetchPokemonSpecies(id),
        ]);
        return transformToPokemon(detail, species);
      } catch (error) {
        console.error(`Failed to fetch pokemon ${id}:`, error);
        return null;
      }
    });

    const batchResults = await Promise.all(promises);
    results.push(...batchResults.filter((p): p is Pokemon => p !== null));
  }

  return results;
}

/**
 * 將 API 回應轉換為應用程式資料模型
 */
function transformToPokemon(
  detail: PokemonDetailResponse,
  species: PokemonSpeciesResponse
): Pokemon {
  const zhName = species.names.find((n) => n.language.name === 'zh-Hant')?.name || detail.name;
  const enName = species.names.find((n) => n.language.name === 'en')?.name || detail.name;

  const generation = parseInt(species.generation.name.replace('generation-', '').replace('i', '1'));

  return {
    id: detail.id,
    name: {
      en: enName,
      zh: zhName,
    },
    dexNumber: detail.id.toString().padStart(3, '0'),
    sprites: {
      official: detail.sprites.other['official-artwork'].front_default,
      icon: detail.sprites.front_default,
    },
    metadata: {
      generation: generation || 1,
      isSpecialForm: false, // 需要額外邏輯判斷
    },
  };
}
```

---

## 2. Web Speech API

瀏覽器內建的文字轉語音 API。

### 基礎資訊

- **支援度**: Chrome 33+, Edge 14+, Safari 7+（有限支援）
- **協議**: 原生瀏覽器 API
- **認證**: 無需認證
- **成本**: 免費
- **限制**: 依瀏覽器而異，某些瀏覽器需要使用者互動才能播放

### 文件

- MDN: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API

---

### 2.1 檢查支援度

```typescript
function isSpeechSynthesisSupported(): boolean {
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}
```

---

### 2.2 取得可用語音

```typescript
function getVoices(): SpeechSynthesisVoice[] {
  return speechSynthesis.getVoices();
}

// 語音列表可能在載入後才可用
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    let voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    // 等待 voiceschanged 事件
    speechSynthesis.addEventListener('voiceschanged', () => {
      voices = speechSynthesis.getVoices();
      resolve(voices);
    });
  });
}

// 選擇適合的語音
async function selectVoice(lang: 'zh' | 'en'): Promise<SpeechSynthesisVoice | null> {
  const voices = await loadVoices();

  const langMap = {
    zh: ['zh-TW', 'zh-CN', 'zh-HK', 'zh'],
    en: ['en-US', 'en-GB', 'en'],
  };

  for (const langCode of langMap[lang]) {
    const voice = voices.find((v) => v.lang.startsWith(langCode));
    if (voice) return voice;
  }

  return null;
}
```

---

### 2.3 播放文字

```typescript
interface SpeakOptions {
  text: string;
  lang: 'zh' | 'en';
  volume?: number;      // 0.0 - 1.0
  rate?: number;        // 0.1 - 10 (1 為正常速度)
  pitch?: number;       // 0 - 2 (1 為正常音高)
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: SpeechSynthesisErrorEvent) => void;
}

async function speak(options: SpeakOptions): Promise<void> {
  if (!isSpeechSynthesisSupported()) {
    throw new Error('Speech synthesis not supported');
  }

  // 停止任何正在播放的音訊
  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(options.text);
  const voice = await selectVoice(options.lang);

  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    // 降級：使用預設語音和語言代碼
    utterance.lang = options.lang === 'zh' ? 'zh-TW' : 'en-US';
  }

  utterance.volume = options.volume ?? 0.8;
  utterance.rate = options.rate ?? 1.0;
  utterance.pitch = options.pitch ?? 1.0;

  return new Promise((resolve, reject) => {
    utterance.onstart = () => {
      options.onStart?.();
    };

    utterance.onend = () => {
      options.onEnd?.();
      resolve();
    };

    utterance.onerror = (event) => {
      options.onError?.(event);
      reject(new Error(`Speech synthesis error: ${event.error}`));
    };

    speechSynthesis.speak(utterance);
  });
}

// 使用範例
await speak({
  text: '皮卡丘',
  lang: 'zh',
  volume: 0.8,
  onStart: () => console.log('開始播放'),
  onEnd: () => console.log('播放完成'),
  onError: (error) => console.error('播放錯誤', error),
});
```

---

### 2.4 停止播放

```typescript
function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    speechSynthesis.cancel();
  }
}

function pauseSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    speechSynthesis.pause();
  }
}

function resumeSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    speechSynthesis.resume();
  }
}
```

---

### 錯誤處理

#### 常見錯誤

1. **`not-allowed`**:
   - **原因**: 使用者未與頁面互動前嘗試播放
   - **處理**: 要求使用者點擊或互動後才播放

2. **`network`**:
   - **原因**: 網路問題（某些瀏覽器需要連線）
   - **處理**: 降級到預錄音訊

3. **`synthesis-failed`**:
   - **原因**: 合成失敗（文字過長、語音不支援等）
   - **處理**: 降級到預錄音訊或分段播放

4. **`audio-busy`**:
   - **原因**: 音訊設備被其他應用佔用
   - **處理**: 顯示錯誤訊息，允許使用者重試

---

### 完整客戶端實作

```typescript
// src/lib/audio.ts

export class AudioService {
  private static instance: AudioService;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  private constructor() {
    // 單例模式
  }

  public static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  public isSupported(): boolean {
    return isSpeechSynthesisSupported();
  }

  public async playPokemonName(
    pokemon: Pokemon,
    lang: 'zh' | 'en',
    volume: number = 0.8
  ): Promise<void> {
    const text = lang === 'zh' ? pokemon.name.zh : pokemon.name.en;

    try {
      await speak({
        text,
        lang,
        volume,
        onStart: () => console.log(`播放: ${text}`),
        onEnd: () => console.log(`完成: ${text}`),
        onError: (error) => {
          console.error(`錯誤: ${error.error}`);
          // 降級到預錄音訊（如果有）
          if (pokemon.audio?.[lang]) {
            this.playPrerecorded(pokemon.audio[lang]);
          }
        },
      });
    } catch (error) {
      console.error('Failed to play audio:', error);
      throw error;
    }
  }

  public stop(): void {
    stopSpeaking();
  }

  private playPrerecorded(url: string): void {
    const audio = new Audio(url);
    audio.play().catch((error) => {
      console.error('Failed to play prerecorded audio:', error);
    });
  }
}
```

---

## 測試策略

### Mock PokéAPI

```typescript
// src/lib/__mocks__/pokeapi.ts
export const fetchPokemonList = jest.fn().mockResolvedValue({
  count: 1281,
  results: [
    { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
    { name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon/25/' },
  ],
});

export const fetchPokemonDetail = jest.fn().mockResolvedValue({
  id: 25,
  name: 'pikachu',
  sprites: {
    other: {
      'official-artwork': {
        front_default: 'https://example.com/pikachu.png',
      },
    },
  },
  species: {
    url: 'https://pokeapi.co/api/v2/pokemon-species/25/',
  },
});
```

### Mock Web Speech API

```typescript
// src/lib/__mocks__/speechSynthesis.ts
const mockSpeak = jest.fn();
const mockCancel = jest.fn();

global.speechSynthesis = {
  speak: mockSpeak,
  cancel: mockCancel,
  getVoices: jest.fn(() => [
    { lang: 'zh-TW', name: 'Chinese (Taiwan)' },
    { lang: 'en-US', name: 'English (US)' },
  ]),
} as any;

global.SpeechSynthesisUtterance = jest.fn() as any;
```

---

## 效能優化

### 1. 請求批次處理

使用 `fetchPokemonBatch` 並行獲取多個寶可夢資料，限制並發數避免速率限制。

### 2. 快取策略

所有 PokéAPI 回應快取到 IndexedDB，有效期 7 天。

### 3. 語音預載

應用程式啟動時預載 Web Speech API 的語音列表，避免首次播放延遲。

---

## 監控與日誌

建議記錄以下事件：

- PokéAPI 請求失敗率
- 平均請求延遲
- Web Speech API 錯誤類型分布
- 降級到預錄音訊的頻率
