/**
 * Web Speech API 封裝服務
 * 提供文字轉語音（TTS）功能，支援中英文播放
 */

import type { LanguagePreference } from '@/types';

// ============================================================================
// 型別定義
// ============================================================================

export interface SpeakOptions {
  /** 要播放的文字 */
  text: string;
  /** 語言代碼（如 'zh-TW', 'en-US'） */
  lang: string;
  /** 音量（0.0 - 1.0） */
  volume?: number;
  /** 語速（0.1 - 10，預設 1.0） */
  rate?: number;
  /** 音調（0 - 2，預設 1.0） */
  pitch?: number;
  /** 播放開始時的回調 */
  onStart?: () => void;
  /** 播放結束時的回調 */
  onEnd?: () => void;
  /** 播放錯誤時的回調 */
  onError?: (error: SpeechSynthesisErrorEvent) => void;
}

export interface VoiceInfo {
  name: string;
  lang: string;
  localService: boolean;
  default: boolean;
}

// ============================================================================
// 語言設定
// ============================================================================

const LANGUAGE_CODES = {
  zh: 'zh-TW', // 繁體中文（台灣）
  en: 'en-US', // 英文（美國）
} as const;

const DEFAULT_VOICE_SETTINGS = {
  volume: 0.8,
  rate: 1.0,
  pitch: 1.0,
} as const;

// ============================================================================
// 瀏覽器支援性檢查
// ============================================================================

/**
 * 檢查瀏覽器是否支援 Web Speech API
 */
export function isSpeechSynthesisSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window
  );
}

/**
 * 獲取所有可用的語音
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) {
    return [];
  }

  return window.speechSynthesis.getVoices();
}

/**
 * 獲取指定語言的最佳語音
 */
export function getBestVoiceForLanguage(
  lang: string
): SpeechSynthesisVoice | null {
  const voices = getAvailableVoices();

  // 優先選擇本地語音
  let bestVoice = voices.find(
    voice => voice.lang.startsWith(lang.split('-')[0]) && voice.localService
  );

  // 如果沒有本地語音，選擇任何匹配語言的語音
  if (!bestVoice) {
    bestVoice = voices.find(voice =>
      voice.lang.startsWith(lang.split('-')[0])
    );
  }

  return bestVoice || null;
}

/**
 * 列出所有可用語音的資訊
 */
export function listVoices(): VoiceInfo[] {
  const voices = getAvailableVoices();

  return voices.map(voice => ({
    name: voice.name,
    lang: voice.lang,
    localService: voice.localService,
    default: voice.default,
  }));
}

// ============================================================================
// 語音播放控制
// ============================================================================

let currentUtterance: SpeechSynthesisUtterance | null = null;

/**
 * 停止當前播放
 */
export function stopSpeech(): void {
  if (!isSpeechSynthesisSupported()) {
    return;
  }

  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }

  currentUtterance = null;
}

/**
 * 暫停播放
 */
export function pauseSpeech(): void {
  if (!isSpeechSynthesisSupported()) {
    return;
  }

  if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
    window.speechSynthesis.pause();
  }
}

/**
 * 繼續播放
 */
export function resumeSpeech(): void {
  if (!isSpeechSynthesisSupported()) {
    return;
  }

  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }
}

/**
 * 檢查是否正在播放
 */
export function isSpeaking(): boolean {
  if (!isSpeechSynthesisSupported()) {
    return false;
  }

  return window.speechSynthesis.speaking;
}

/**
 * 檢查是否已暫停
 */
export function isPaused(): boolean {
  if (!isSpeechSynthesisSupported()) {
    return false;
  }

  return window.speechSynthesis.paused;
}

// ============================================================================
// 文字轉語音
// ============================================================================

/**
 * 播放文字
 */
export function speak(options: SpeakOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    // 檢查瀏覽器支援性
    if (!isSpeechSynthesisSupported()) {
      reject(new Error('此瀏覽器不支援語音合成功能'));
      return;
    }

    // 停止當前播放
    stopSpeech();

    // 建立新的語音播放實例
    const utterance = new SpeechSynthesisUtterance(options.text);
    utterance.lang = options.lang;
    utterance.volume = options.volume ?? DEFAULT_VOICE_SETTINGS.volume;
    utterance.rate = options.rate ?? DEFAULT_VOICE_SETTINGS.rate;
    utterance.pitch = options.pitch ?? DEFAULT_VOICE_SETTINGS.pitch;

    // 選擇最佳語音
    const bestVoice = getBestVoiceForLanguage(options.lang);
    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    // 設定事件處理器
    utterance.onstart = () => {
      options.onStart?.();
    };

    utterance.onend = () => {
      currentUtterance = null;
      options.onEnd?.();
      resolve();
    };

    utterance.onerror = (event) => {
      currentUtterance = null;
      options.onError?.(event);

      // 某些錯誤是非致命的（如 interrupted）
      if (event.error === 'interrupted' || event.error === 'canceled') {
        resolve();
      } else {
        reject(new Error(`語音播放錯誤: ${event.error}`));
      }
    };

    // 儲存當前播放實例
    currentUtterance = utterance;

    // 開始播放
    try {
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      currentUtterance = null;
      reject(new Error(`無法播放語音: ${(error as Error).message}`));
    }
  });
}

/**
 * 播放寶可夢名稱（根據語言偏好）
 */
export async function speakPokemonName(
  englishName: string,
  chineseName: string,
  preference: LanguagePreference
): Promise<void> {
  const { mode, volume, playbackOrder } = preference;

  const commonOptions = {
    volume,
    rate: 1.0,
    pitch: 1.0,
  };

  try {
    switch (mode) {
      case 'en-only':
        // 只播放英文
        await speak({
          text: englishName,
          lang: LANGUAGE_CODES.en,
          ...commonOptions,
        });
        break;

      case 'zh-only':
        // 只播放中文
        await speak({
          text: chineseName,
          lang: LANGUAGE_CODES.zh,
          ...commonOptions,
        });
        break;

      case 'both':
        // 播放兩種語言
        if (!playbackOrder) {
          throw new Error('playbackOrder is required for "both" mode');
        }

        const firstLang = playbackOrder.first === 'en' ? englishName : chineseName;
        const firstLangCode = playbackOrder.first === 'en' ? LANGUAGE_CODES.en : LANGUAGE_CODES.zh;
        const secondLang = playbackOrder.first === 'en' ? chineseName : englishName;
        const secondLangCode = playbackOrder.first === 'en' ? LANGUAGE_CODES.zh : LANGUAGE_CODES.en;

        // 播放第一種語言
        await speak({
          text: firstLang,
          lang: firstLangCode,
          ...commonOptions,
        });

        // 等待間隔時間
        await new Promise(resolve => setTimeout(resolve, playbackOrder.delay));

        // 播放第二種語言
        await speak({
          text: secondLang,
          lang: secondLangCode,
          ...commonOptions,
        });
        break;

      default:
        throw new Error(`未知的語言模式: ${mode}`);
    }
  } catch (error) {
    throw new Error(`播放寶可夢名稱失敗: ${(error as Error).message}`);
  }
}

// ============================================================================
// 初始化
// ============================================================================

/**
 * 初始化 Speech API（載入語音列表）
 * 某些瀏覽器需要非同步載入語音列表
 */
export function initializeSpeechAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (!isSpeechSynthesisSupported()) {
      resolve();
      return;
    }

    // 如果語音列表已載入，直接返回
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve();
      return;
    }

    // 等待語音列表載入
    window.speechSynthesis.onvoiceschanged = () => {
      resolve();
    };

    // 設定超時保護（某些瀏覽器可能不會觸發 onvoiceschanged）
    setTimeout(() => {
      resolve();
    }, 1000);
  });
}

// ============================================================================
// 測試與除錯
// ============================================================================

/**
 * 測試語音播放功能
 */
export async function testSpeech(): Promise<{
  supported: boolean;
  voiceCount: number;
  testResult: 'success' | 'error';
  error?: string;
}> {
  const supported = isSpeechSynthesisSupported();
  const voiceCount = getAvailableVoices().length;

  if (!supported) {
    return {
      supported: false,
      voiceCount: 0,
      testResult: 'error',
      error: '瀏覽器不支援 Web Speech API',
    };
  }

  try {
    await speak({
      text: 'Test',
      lang: 'en-US',
      volume: 0.5,
    });

    return {
      supported: true,
      voiceCount,
      testResult: 'success',
    };
  } catch (error) {
    return {
      supported: true,
      voiceCount,
      testResult: 'error',
      error: (error as Error).message,
    };
  }
}

/**
 * 獲取語音合成的詳細資訊
 */
export function getSpeechInfo(): {
  supported: boolean;
  speaking: boolean;
  paused: boolean;
  pending: boolean;
  voiceCount: number;
  voices: VoiceInfo[];
} {
  if (!isSpeechSynthesisSupported()) {
    return {
      supported: false,
      speaking: false,
      paused: false,
      pending: false,
      voiceCount: 0,
      voices: [],
    };
  }

  return {
    supported: true,
    speaking: window.speechSynthesis.speaking,
    paused: window.speechSynthesis.paused,
    pending: window.speechSynthesis.pending,
    voiceCount: getAvailableVoices().length,
    voices: listVoices(),
  };
}
