/**
 * 語言配置常數
 */

// ============================================================================
// 語言代碼
// ============================================================================

export const LANGUAGE_CODES = {
  ZH_TW: 'zh-TW', // 繁體中文（台灣）
  ZH_CN: 'zh-CN', // 簡體中文（中國）
  EN_US: 'en-US', // 英文（美國）
  EN_GB: 'en-GB', // 英文（英國）
  JA_JP: 'ja-JP', // 日文（日本）
} as const;

export type LanguageCode = typeof LANGUAGE_CODES[keyof typeof LANGUAGE_CODES];

// ============================================================================
// 語言名稱
// ============================================================================

export const LANGUAGE_NAMES: Record<LanguageCode, { native: string; english: string }> = {
  [LANGUAGE_CODES.ZH_TW]: { native: '繁體中文', english: 'Traditional Chinese' },
  [LANGUAGE_CODES.ZH_CN]: { native: '简体中文', english: 'Simplified Chinese' },
  [LANGUAGE_CODES.EN_US]: { native: 'English (US)', english: 'English (US)' },
  [LANGUAGE_CODES.EN_GB]: { native: 'English (UK)', english: 'English (UK)' },
  [LANGUAGE_CODES.JA_JP]: { native: '日本語', english: 'Japanese' },
};

// ============================================================================
// 語音合成設定
// ============================================================================

export const SPEECH_CONFIG = {
  // 預設語言
  DEFAULT_LANGUAGE: LANGUAGE_CODES.ZH_TW,

  // 音量設定（0.0 - 1.0）
  DEFAULT_VOLUME: 0.8,
  MIN_VOLUME: 0.0,
  MAX_VOLUME: 1.0,

  // 語速設定（0.1 - 10）
  DEFAULT_RATE: 1.0,
  MIN_RATE: 0.5,
  MAX_RATE: 2.0,

  // 音調設定（0 - 2）
  DEFAULT_PITCH: 1.0,
  MIN_PITCH: 0.5,
  MAX_PITCH: 2.0,

  // 播放間隔時間（毫秒）
  DEFAULT_DELAY: 800,
  MIN_DELAY: 300,
  MAX_DELAY: 2000,

  // 間隔時間容差（毫秒）
  DELAY_TOLERANCE: 50,
} as const;

// ============================================================================
// 語言模式
// ============================================================================

export const LANGUAGE_MODES = {
  ZH_ONLY: 'zh-only',
  EN_ONLY: 'en-only',
  BOTH: 'both',
} as const;

export type LanguageMode = typeof LANGUAGE_MODES[keyof typeof LANGUAGE_MODES];

export const LANGUAGE_MODE_LABELS: Record<LanguageMode, string> = {
  [LANGUAGE_MODES.ZH_ONLY]: '僅中文',
  [LANGUAGE_MODES.EN_ONLY]: '僅英文',
  [LANGUAGE_MODES.BOTH]: '中英文',
};

export const LANGUAGE_MODE_DESCRIPTIONS: Record<LanguageMode, string> = {
  [LANGUAGE_MODES.ZH_ONLY]: '只播放寶可夢的中文名稱',
  [LANGUAGE_MODES.EN_ONLY]: '只播放寶可夢的英文名稱',
  [LANGUAGE_MODES.BOTH]: '依序播放英文與中文名稱（間隔 800 毫秒）',
};

// ============================================================================
// 播放順序
// ============================================================================

export const PLAYBACK_ORDER = {
  ZH_FIRST: 'zh',
  EN_FIRST: 'en',
} as const;

export type PlaybackOrder = typeof PLAYBACK_ORDER[keyof typeof PLAYBACK_ORDER];

export const PLAYBACK_ORDER_LABELS: Record<PlaybackOrder, string> = {
  [PLAYBACK_ORDER.ZH_FIRST]: '先中文後英文',
  [PLAYBACK_ORDER.EN_FIRST]: '先英文後中文',
};

// ============================================================================
// 語言偏好儲存
// ============================================================================

export const STORAGE_KEYS = {
  LANGUAGE_PREFERENCE: 'language-preference',
  CACHE_VERSION: 'cache-version',
  LAST_UPDATE: 'last-update',
} as const;

// ============================================================================
// 語音識別語言對照
// ============================================================================

/**
 * PokéAPI 語言代碼對照表
 */
export const POKEAPI_LANGUAGE_MAP: Record<string, string> = {
  'zh': 'zh-Hant', // 繁體中文
  'en': 'en',      // 英文
  'ja': 'ja',      // 日文
  'ko': 'ko',      // 韓文
  'fr': 'fr',      // 法文
  'de': 'de',      // 德文
  'es': 'es',      // 西班牙文
  'it': 'it',      // 義大利文
};

/**
 * Web Speech API 語言對照
 */
export const WEB_SPEECH_LANGUAGE_MAP: Record<string, LanguageCode> = {
  'zh': LANGUAGE_CODES.ZH_TW,
  'en': LANGUAGE_CODES.EN_US,
  'ja': LANGUAGE_CODES.JA_JP,
};

// ============================================================================
// 時間設定
// ============================================================================

export const TIMING = {
  // 防抖延遲
  SEARCH_DEBOUNCE: 300,       // 搜尋輸入防抖（毫秒）
  RESIZE_DEBOUNCE: 150,       // 視窗調整防抖（毫秒）

  // 節流延遲
  SCROLL_THROTTLE: 100,       // 滾動事件節流（毫秒）

  // 動畫持續時間
  ANIMATION_DURATION: 300,    // 一般動畫持續時間（毫秒）
  TRANSITION_DURATION: 150,   // 過渡動畫持續時間（毫秒）

  // 載入狀態
  MIN_LOADING_TIME: 500,      // 最小載入時間（避免閃爍）
  MAX_LOADING_TIME: 30000,    // 最大載入時間（超時）

  // 重試設定
  RETRY_DELAY: 1000,          // 重試延遲（毫秒）
  MAX_RETRIES: 3,             // 最大重試次數

  // 快取設定
  CACHE_TTL: 7 * 24 * 60 * 60 * 1000, // 快取有效期（7 天）
} as const;

// ============================================================================
// 效能設定
// ============================================================================

export const PERFORMANCE = {
  // 目標效能指標
  TARGET_FPS: 60,
  TARGET_FCP: 1500,           // First Contentful Paint（毫秒）
  TARGET_LCP: 2500,           // Largest Contentful Paint（毫秒）
  TARGET_TTI: 3500,           // Time to Interactive（毫秒）

  // 搜尋效能
  MAX_SEARCH_TIME: 500,       // 搜尋最大執行時間（毫秒）

  // 音訊播放
  MAX_AUDIO_DELAY: 1000,      // 音訊播放最大延遲（毫秒）

  // 虛擬滾動
  VIRTUAL_SCROLL_OVERSCAN: 5, // 虛擬滾動預載項目數
} as const;
