/**
 * 拼音（聲調數字格式，如 `qiu1`）轉注音符號（如 `ㄑㄧㄡ`）
 *
 * 聲調：1 不標、2 ˊ、3 ˇ、4 ˋ、0 / 5 / 省略 為輕聲（˙ 放在最前面）
 * `ü` 可寫成 `v`。
 */

const INITIALS: Record<string, string> = {
  b: 'ㄅ', p: 'ㄆ', m: 'ㄇ', f: 'ㄈ',
  d: 'ㄉ', t: 'ㄊ', n: 'ㄋ', l: 'ㄌ',
  g: 'ㄍ', k: 'ㄎ', h: 'ㄏ',
  j: 'ㄐ', q: 'ㄑ', x: 'ㄒ',
  zh: 'ㄓ', ch: 'ㄔ', sh: 'ㄕ', r: 'ㄖ',
  z: 'ㄗ', c: 'ㄘ', s: 'ㄙ',
};

const FINALS: Record<string, string> = {
  a: 'ㄚ', o: 'ㄛ', e: 'ㄜ', ê: 'ㄝ',
  ai: 'ㄞ', ei: 'ㄟ', ao: 'ㄠ', ou: 'ㄡ',
  an: 'ㄢ', en: 'ㄣ', ang: 'ㄤ', eng: 'ㄥ', er: 'ㄦ',
  ong: 'ㄨㄥ',
  i: 'ㄧ', ia: 'ㄧㄚ', io: 'ㄧㄛ', ie: 'ㄧㄝ', iai: 'ㄧㄞ', iao: 'ㄧㄠ',
  iu: 'ㄧㄡ', iou: 'ㄧㄡ', ian: 'ㄧㄢ', in: 'ㄧㄣ', iang: 'ㄧㄤ', ing: 'ㄧㄥ',
  iong: 'ㄩㄥ',
  u: 'ㄨ', ua: 'ㄨㄚ', uo: 'ㄨㄛ', uai: 'ㄨㄞ', ui: 'ㄨㄟ', uei: 'ㄨㄟ',
  uan: 'ㄨㄢ', un: 'ㄨㄣ', uen: 'ㄨㄣ', uang: 'ㄨㄤ', ueng: 'ㄨㄥ',
  ü: 'ㄩ', üe: 'ㄩㄝ', üan: 'ㄩㄢ', ün: 'ㄩㄣ',
};

/** 只有聲母、不寫韻母的音節（zhi、chi、shi、ri、zi、ci、si） */
const BARE_INITIALS = new Set(['zh', 'ch', 'sh', 'r', 'z', 'c', 's']);

/** 可以接 ü 的聲母（j、q、x 書寫時省略兩點） */
const U_UMLAUT_INITIALS = new Set(['n', 'l', 'j', 'q', 'x']);
const JQX = new Set(['j', 'q', 'x']);

const TONE_MARKS: Record<string, string> = { '1': '', '2': 'ˊ', '3': 'ˇ', '4': 'ˋ' };

/** y / w 開頭的音節還原成零聲母韻母 */
function restoreYW(syllable: string): string {
  if (syllable.startsWith('y')) {
    const rest = syllable.slice(1);
    if (['i', 'in', 'ing'].includes(rest)) return rest;
    if (rest === 'ong') return 'iong';
    if (rest.startsWith('u')) return 'ü' + rest.slice(1);
    return 'i' + rest;
  }
  if (syllable.startsWith('w')) {
    const rest = syllable.slice(1);
    if (rest === 'u') return 'u';
    return 'u' + rest;
  }
  return syllable;
}

function splitInitial(syllable: string): [string, string] {
  const two = syllable.slice(0, 2);
  if (INITIALS[two]) return [two, syllable.slice(2)];
  const one = syllable.slice(0, 1);
  if (INITIALS[one]) return [one, syllable.slice(1)];
  return ['', syllable];
}

export function pinyinToZhuyin(input: string): string {
  const normalized = input.trim().toLowerCase().replace(/v/g, 'ü');
  const match = normalized.match(/^([a-zêü]+)([0-5])?$/);
  if (!match) {
    throw new Error(`無法辨識的拼音：${JSON.stringify(input)}`);
  }

  const [, syllable, tone = '0'] = match;
  const [initial, rawFinal] = splitInitial(restoreYW(syllable));

  let final = rawFinal;
  if (JQX.has(initial) && final.startsWith('u')) {
    final = 'ü' + final.slice(1);
  }

  let body: string;
  if (initial && final === 'i' && BARE_INITIALS.has(initial)) {
    body = INITIALS[initial];
  } else {
    const finalZhuyin = FINALS[final];
    const invalidUmlaut = final.startsWith('ü') && initial !== '' && !U_UMLAUT_INITIALS.has(initial);
    const invalidJqx = JQX.has(initial) && !/^[iü]/.test(final);
    if (!finalZhuyin || invalidUmlaut || invalidJqx) {
      throw new Error(`無法辨識的拼音：${JSON.stringify(input)}`);
    }
    body = (initial ? INITIALS[initial] : '') + finalZhuyin;
  }

  if (tone === '0' || tone === '5') return '˙' + body;
  return body + TONE_MARKS[tone];
}
