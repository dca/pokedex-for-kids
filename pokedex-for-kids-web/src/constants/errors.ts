/**
 * 錯誤處理常數與訊息
 */

// ============================================================================
// 錯誤代碼
// ============================================================================

export const ERROR_CODES = {
  // 網路錯誤
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  HTTP_ERROR: 'HTTP_ERROR',

  // API 錯誤
  API_ERROR: 'API_ERROR',
  FETCH_FAILED: 'FETCH_FAILED',
  INVALID_RESPONSE: 'INVALID_RESPONSE',

  // 快取錯誤
  CACHE_ERROR: 'CACHE_ERROR',
  CACHE_READ_ERROR: 'CACHE_READ_ERROR',
  CACHE_WRITE_ERROR: 'CACHE_WRITE_ERROR',

  // 音訊錯誤
  SPEECH_NOT_SUPPORTED: 'SPEECH_NOT_SUPPORTED',
  SPEECH_ERROR: 'SPEECH_ERROR',
  AUDIO_PLAYBACK_ERROR: 'AUDIO_PLAYBACK_ERROR',

  // 資料錯誤
  INVALID_DATA: 'INVALID_DATA',
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // 一般錯誤
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// ============================================================================
// 錯誤訊息
// ============================================================================

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ERROR_CODES.NETWORK_ERROR]: '網路連線失敗，請檢查網路設定',
  [ERROR_CODES.TIMEOUT]: '請求超時，請稍後再試',
  [ERROR_CODES.HTTP_ERROR]: '伺服器回應錯誤',

  [ERROR_CODES.API_ERROR]: 'API 請求失敗',
  [ERROR_CODES.FETCH_FAILED]: '資料載入失敗',
  [ERROR_CODES.INVALID_RESPONSE]: 'API 回應格式錯誤',

  [ERROR_CODES.CACHE_ERROR]: '快取操作失敗',
  [ERROR_CODES.CACHE_READ_ERROR]: '讀取快取資料失敗',
  [ERROR_CODES.CACHE_WRITE_ERROR]: '寫入快取資料失敗',

  [ERROR_CODES.SPEECH_NOT_SUPPORTED]: '您的瀏覽器不支援語音播放功能',
  [ERROR_CODES.SPEECH_ERROR]: '語音播放失敗',
  [ERROR_CODES.AUDIO_PLAYBACK_ERROR]: '音訊播放時發生錯誤',

  [ERROR_CODES.INVALID_DATA]: '資料格式不正確',
  [ERROR_CODES.VALIDATION_ERROR]: '資料驗證失敗',

  [ERROR_CODES.UNKNOWN_ERROR]: '發生未知錯誤',
};

// ============================================================================
// 錯誤類別
// ============================================================================

export class AppError extends Error {
  code: ErrorCode;
  statusCode?: number;
  originalError?: Error;

  constructor(
    code: ErrorCode,
    message?: string,
    statusCode?: number,
    originalError?: Error
  ) {
    super(message || ERROR_MESSAGES[code]);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}

// ============================================================================
// 錯誤處理工具
// ============================================================================

/**
 * 格式化錯誤訊息
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR];
}

/**
 * 判斷是否為網路錯誤
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof AppError) {
    const networkErrorCodes: ErrorCode[] = [
      ERROR_CODES.NETWORK_ERROR,
      ERROR_CODES.TIMEOUT,
      ERROR_CODES.HTTP_ERROR,
    ];
    return networkErrorCodes.includes(error.code);
  }

  if (error instanceof Error) {
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('timeout')
    );
  }

  return false;
}

/**
 * 判斷錯誤是否可重試
 */
export function isRetryableError(error: unknown): boolean {
  return isNetworkError(error);
}

/**
 * 記錄錯誤（開發環境）
 */
export function logError(error: unknown, context?: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Error${context ? ` - ${context}` : ''}]:`, error);
  }
}
