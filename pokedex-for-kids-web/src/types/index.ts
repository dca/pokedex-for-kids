/**
 * 共用 TypeScript 型別定義
 * Pokemon Audio Pokedex
 */

// ============================================================================
// Pokemon 相關型別
// ============================================================================

/**
 * 寶可夢實體
 */
export interface Pokemon {
  /** 唯一識別碼（PokéAPI 的 ID） */
  id: number;

  /** 寶可夢名稱 */
  name: {
    /** 英文名稱（如 "Pikachu"） */
    en: string;
    /** 繁體中文名稱（如 "皮卡丘"） */
    zh: string;
  };

  /** 圖鑑編號（格式：001, 002, ...） */
  dexNumber: string;

  /** 圖片資源 */
  sprites: {
    /** 官方美術圖（高畫質） */
    official: string;
    /** 小圖示 */
    icon: string;
  };

  /** 音訊資源（可選，視音訊生成方案而定） */
  audio?: {
    /** 英文發音 URL（Web Speech API 或預錄） */
    en?: string;
    /** 中文發音 URL */
    zh?: string;
  };

  /** 後設資料 */
  metadata: {
    /** 世代（1-9） */
    generation: number;
    /** 是否為特殊型態 */
    isSpecialForm: boolean;
  };
}

// ============================================================================
// 語言偏好相關型別
// ============================================================================

/**
 * 語言模式
 */
export type LanguageMode = 'zh-only' | 'en-only' | 'both';

/**
 * 語言偏好設定
 */
export interface LanguagePreference {
  /** 語言模式 */
  mode: LanguageMode;

  /** 當 mode 為 'both' 時的播放順序 */
  playbackOrder?: {
    /** 先播放的語言 */
    first: 'zh' | 'en';
    /** 兩次播放間的延遲（毫秒） */
    delay: number;
  };

  /** 最後更新時間（ISO 8601 格式） */
  lastUpdated: string;

  /** 音量設定（0.0 - 1.0） */
  volume: number;
}

/**
 * 預設語言偏好設定
 */
export const DEFAULT_LANGUAGE_PREFERENCE: LanguagePreference = {
  mode: 'both',
  playbackOrder: {
    first: 'en', // 先播放英文，再播放中文
    delay: 800,  // 間隔 800 毫秒
  },
  lastUpdated: new Date().toISOString(),
  volume: 0.8,
};

// ============================================================================
// 音訊播放狀態相關型別
// ============================================================================

/**
 * 播放狀態
 */
export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

/**
 * 音訊播放狀態
 */
export interface AudioPlaybackState {
  /** 當前播放狀態 */
  status: PlaybackStatus;

  /** 正在播放的寶可夢 ID（null 表示無） */
  currentPokemonId: number | null;

  /** 當前播放的語言 */
  currentLanguage: 'zh' | 'en' | null;

  /** 錯誤訊息（status 為 'error' 時） */
  error: string | null;

  /** 播放進度（0.0 - 1.0，可選） */
  progress?: number;
}

// ============================================================================
// 搜尋相關型別
// ============================================================================

/**
 * 搜尋查詢狀態
 */
export interface SearchQuery {
  /** 搜尋文字 */
  query: string;

  /** 搜尋結果（寶可夢 ID 陣列） */
  results: number[];

  /** 搜尋是否進行中 */
  isSearching: boolean;

  /** 最後搜尋時間 */
  lastSearchTime: number; // Unix timestamp
}

// ============================================================================
// 快取相關型別
// ============================================================================

/**
 * 快取狀態
 */
export type CacheStatus = 'fresh' | 'stale' | 'expired';

/**
 * 應用程式快取
 */
export interface AppCache {
  /** 快取版本（用於強制更新） */
  version: string;

  /** 寶可夢資料（以 ID 為鍵的字典） */
  pokemon: Record<number, Pokemon>;

  /** 快取建立時間 */
  createdAt: string; // ISO 8601

  /** 快取過期時間 */
  expiresAt: string; // ISO 8601

  /** 快取狀態 */
  status: CacheStatus;
}

// ============================================================================
// API 相關型別
// ============================================================================

/**
 * PokéAPI Pokemon 回應
 */
export interface PokeApiPokemon {
  id: number;
  name: string;
  sprites: {
    other?: {
      'official-artwork'?: {
        front_default?: string;
      };
    };
    front_default?: string;
  };
  species: {
    name: string;
    url: string;
  };
}

/**
 * PokéAPI Species 回應
 */
export interface PokeApiSpecies {
  id: number;
  name: string;
  names: Array<{
    language: {
      name: string;
      url: string;
    };
    name: string;
  }>;
  generation: {
    name: string;
    url: string;
  };
}

/**
 * API 錯誤
 */
export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
}

// ============================================================================
// 工具型別
// ============================================================================

/**
 * 載入狀態
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * 非同步資料狀態
 */
export interface AsyncData<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}
