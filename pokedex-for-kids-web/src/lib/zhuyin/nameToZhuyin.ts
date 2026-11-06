/**
 * 中文名稱轉注音
 *
 * 讀音來自 pinyin-pro（中國大陸標準讀音，會依詞語上下文判斷多音字）。
 * 台灣讀音不同或判斷錯誤時，用人工校正表（overrides）覆蓋：
 *   chars：單字讀音，套用到所有名稱；也代表這個多音字已確認，不必再校對
 *   names：整個名稱每個字的讀音，優先於 chars；null 代表沿用
 */

import { pinyin } from 'pinyin-pro';
import { pinyinToZhuyin } from './pinyinToZhuyin';

export interface ZhuyinChar {
  char: string;
  /** 是否為漢字；非漢字（如 Ⅱ、Ｚ）不給拼音與注音 */
  isHan: boolean;
  /** 自動判斷的拼音（聲調數字格式） */
  pinyin: string | null;
  /** 最終採用的注音（有校正時為校正值） */
  zhuyin: string | null;
  /** 這個字所有可能的注音讀音 */
  readings: string[];
  /** 是否為多音字 */
  polyphonic: boolean;
  /** 讀音已由單字或名稱校正確認 */
  confirmed: boolean;
}

export interface ZhuyinName {
  name: string;
  chars: ZhuyinChar[];
  /** 以空白分隔每個字的注音，非漢字原樣保留 */
  zhuyin: string;
  /** 已套用人工校正 */
  reviewed: boolean;
  /** 含多音字且尚未人工校正 */
  needsReview: boolean;
}

export interface ZhuyinOverrides {
  /** 單字 → 注音 */
  chars?: Record<string, string>;
  /** 名稱 → 每個字的注音；null 代表沿用（非漢字位置也用 null） */
  names?: Record<string, (string | null)[]>;
}

function toZhuyinSafe(syllable: string): string | null {
  try {
    return pinyinToZhuyin(syllable);
  } catch {
    // pinyin-pro 偶爾會給出 m、n、ng 這類嘆詞讀音，名稱用不到，直接略過
    return null;
  }
}

function readingsOf(char: string): string[] {
  const all = pinyin(char, { multiple: true, type: 'array', toneType: 'num' });
  const zhuyin = all.map(toZhuyinSafe).filter((z): z is string => z !== null);
  return Array.from(new Set(zhuyin));
}

export function nameToZhuyin(name: string, overrides: ZhuyinOverrides = {}): ZhuyinName {
  const chars = Array.from(name);
  const contextual = pinyin(name, { type: 'all', toneType: 'num' });

  if (contextual.length !== chars.length) {
    throw new Error(`pinyin-pro 回傳的字數與名稱不符：${name}`);
  }

  const result: ZhuyinChar[] = contextual.map((item, i) => {
    if (!item.isZh) {
      return { char: chars[i], isHan: false, pinyin: null, zhuyin: null, readings: [], polyphonic: false, confirmed: false };
    }
    const readings = readingsOf(chars[i]);
    const charOverride = overrides.chars?.[chars[i]];
    return {
      char: chars[i],
      isHan: true,
      pinyin: item.pinyin,
      zhuyin: charOverride ?? toZhuyinSafe(item.pinyin),
      readings,
      polyphonic: readings.length > 1,
      confirmed: charOverride !== undefined,
    };
  });

  const nameOverride = overrides.names?.[name];
  if (nameOverride) {
    if (nameOverride.length !== result.length) {
      throw new Error(`校正表「${name}」有 ${nameOverride.length} 個讀音，但名稱有 ${result.length} 個字`);
    }
    nameOverride.forEach((zhuyin, i) => {
      if (result[i].isHan && zhuyin !== null) result[i].zhuyin = zhuyin;
      if (result[i].isHan) result[i].confirmed = true;
    });
  }

  const reviewed = Boolean(nameOverride);
  const hasUnconfirmedPolyphonic = result.some((c) => c.polyphonic && !c.confirmed);
  const hasMissing = result.some((c) => c.isHan && c.zhuyin === null);

  return {
    name,
    chars: result,
    zhuyin: result.map((c) => (c.isHan ? c.zhuyin ?? '?' : c.char)).join(' '),
    reviewed,
    needsReview: !reviewed && (hasUnconfirmedPolyphonic || hasMissing),
  };
}
