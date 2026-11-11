// 注音符號的分類與音節解析（顯示上色、建置腳本共用）。
// 伺服器端在 game-api/internal/game/zhuyin 有同樣規則的 Go 版本，兩邊的測試案例保持一致。

export type SymbolCategory = 'initial' | 'medial' | 'final' | 'tone'
export type Tone = 1 | 2 | 3 | 4 | 5

export interface ParsedSyllable {
  initial: string | null
  medial: string | null
  final: string | null
  tone: Tone
}

export const INITIALS = [...'ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙ'] as const
export const MEDIALS = [...'ㄧㄨㄩ'] as const
export const FINALS = [...'ㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦ'] as const

/** 一聲沒有符號，顯示時用 ˉ 表示；輕聲為 ˙ */
export const TONE_MARKS: Record<Tone, string> = { 1: 'ˉ', 2: 'ˊ', 3: 'ˇ', 4: 'ˋ', 5: '˙' }

const initialSet = new Set<string>(INITIALS)
const medialSet = new Set<string>(MEDIALS)
const finalSet = new Set<string>(FINALS)
const toneByMark: Record<string, Tone> = { ˊ: 2, ˇ: 3, ˋ: 4 }

export function categoryOf(symbol: string): SymbolCategory {
  if (initialSet.has(symbol)) return 'initial'
  if (medialSet.has(symbol)) return 'medial'
  if (finalSet.has(symbol)) return 'final'
  if (symbol === 'ˉ' || symbol === '˙' || symbol in toneByMark) return 'tone'
  throw new Error(`不是注音符號：${symbol}`)
}

export function parseSyllable(input: string): ParsedSyllable {
  let rest = [...input]
  let tone: Tone = 1
  if (rest[0] === '˙') {
    tone = 5
    rest = rest.slice(1)
  } else {
    const last = rest[rest.length - 1]
    if (last !== undefined && last in toneByMark) {
      tone = toneByMark[last]
      rest = rest.slice(0, -1)
    }
  }
  const result: ParsedSyllable = { initial: null, medial: null, final: null, tone }
  let i = 0
  if (rest[i] !== undefined && initialSet.has(rest[i])) result.initial = rest[i++]
  if (rest[i] !== undefined && medialSet.has(rest[i])) result.medial = rest[i++]
  if (rest[i] !== undefined && finalSet.has(rest[i])) result.final = rest[i++]
  if (i !== rest.length || i === 0) throw new Error(`不合法的注音音節：${input}`)
  return result
}

export function formatSyllable(p: ParsedSyllable): string {
  const body = (p.initial ?? '') + (p.medial ?? '') + (p.final ?? '')
  if (p.tone === 5) return '˙' + body
  if (p.tone === 1) return body
  return body + TONE_MARKS[p.tone]
}

/** 不含聲調的符號數：1 一拼、2 二拼、3 三拼 */
export function syllableSize(p: ParsedSyllable): 1 | 2 | 3 {
  return [p.initial, p.medial, p.final].filter(Boolean).length as 1 | 2 | 3
}

/** 依顯示順序拆成單一符號（含聲調、輕聲點、挖空「＿」） */
export function splitZhuyin(zhuyin: string): string[] {
  return [...zhuyin]
}
