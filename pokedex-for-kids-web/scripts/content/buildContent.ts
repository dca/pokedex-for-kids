// 由已校對的注音資料產生遊戲的靜態內容（前端與 game-api 共用）。
import { FINALS, INITIALS, MEDIALS, parseSyllable, type Tone } from '../../src/game/zhuyin'

export type ZoneId = 'meadow' | 'beach' | 'forest' | 'hill'
export type Stage = 'learn' | 'spell' | 'read'

export interface SourceChar {
  char: string
  isHan: boolean
  zhuyin: string | null
}
export interface SourcePokemon {
  id: number | null
  en: string
  name: string
  chars: SourceChar[]
}
export interface ZonesConfig {
  types: string[]
  zoneByType: Record<string, ZoneId>
  zoneOverrides: Record<string, ZoneId>
  rare: number[]
  evolvesTo: Record<string, number>
}
export interface Confusables {
  symbols: string[][]
  tones: number[][]
  chars: string[][]
}

export interface Syllable {
  char: string
  isHan: boolean
  zhuyin: string
  initial: string | null
  medial: string | null
  final: string | null
  tone: Tone
}
export interface Pokemon {
  id: number
  name: string
  en: string
  zone: ZoneId
  rare: boolean
  evolvesTo: number | null
  syllables: Syllable[]
}
export interface Zone {
  id: ZoneId
  name: string
  stage: Stage
  order: number
  items: string[]
  questionTypes: string[]
}

export interface ContentOutput {
  gen1: Pokemon[]
  zones: Zone[]
  confusables: Confusables
  audio: Record<string, string>
  report: string
}

const ZONE_META: Omit<Zone, 'items'>[] = [
  { id: 'meadow', name: '新手草原', stage: 'learn', order: 1, questionTypes: ['listen_symbol', 'first_sound'] },
  { id: 'beach', name: '泡泡海灘', stage: 'learn', order: 2, questionTypes: ['listen_symbol', 'listen_tone'] },
  { id: 'forest', name: '拼音森林', stage: 'spell', order: 3, questionTypes: ['fill_symbol', 'fill_tone', 'build_syllable'] },
  { id: 'hill', name: '文字山丘', stage: 'read', order: 4, questionTypes: ['listen_name', 'zhuyin_to_char', 'fill_char'] },
]

/** 注音轉成 ASCII 檔名：每個字元的 Unicode 十六進位，以底線連接 */
export function audioFileName(zhuyin: string): string {
  return [...zhuyin].map((c) => c.codePointAt(0)!.toString(16)).join('_')
}

const pad3 = (n: number) => String(n).padStart(3, '0')

export function buildContent(input: {
  source: SourcePokemon[]
  zonesConfig: ZonesConfig
  confusables: Confusables & { _comment?: string }
  prompts: Record<string, string>
}): ContentOutput {
  const { zonesConfig } = input
  if (zonesConfig.types.length !== 151) throw new Error(`types 必須有 151 筆，現在是 ${zonesConfig.types.length}`)

  const byId = new Map<number, SourcePokemon>()
  for (const p of input.source) if (typeof p.id === 'number' && p.id <= 151) byId.set(p.id, p)

  const gen1: Pokemon[] = []
  for (let id = 1; id <= 151; id++) {
    const src = byId.get(id)
    if (!src) throw new Error(`缺少 #${id}`)
    const type = zonesConfig.types[id - 1]
    const zone = zonesConfig.zoneOverrides[String(id)] ?? zonesConfig.zoneByType[type]
    if (!zone) throw new Error(`#${id} 的屬性 ${type} 沒有對應的區域`)
    const syllables: Syllable[] = src.chars.map((c) => {
      if (!c.isHan || !c.zhuyin) {
        return { char: c.char, isHan: false, zhuyin: '', initial: null, medial: null, final: null, tone: 1 }
      }
      return { char: c.char, isHan: true, zhuyin: c.zhuyin, ...parseSyllable(c.zhuyin) }
    })
    gen1.push({
      id,
      name: src.name,
      en: src.en,
      zone,
      rare: zonesConfig.rare.includes(id),
      evolvesTo: zonesConfig.evolvesTo[String(id)] ?? null,
      syllables,
    })
  }

  const hanOf = (zone: ZoneId) => gen1.filter((p) => p.zone === zone).flatMap((p) => p.syllables.filter((s) => s.isHan))
  const uniq = (xs: string[]) => [...new Set(xs)]
  const itemsByZone: Record<ZoneId, string[]> = {
    meadow: INITIALS.map((s) => `sym:${s}`),
    beach: [...MEDIALS, ...FINALS].map((s) => `sym:${s}`).concat([1, 2, 3, 4, 5].map((t) => `tone:${t}`)),
    forest: uniq(hanOf('forest').map((s) => `syl:${s.zhuyin}`)),
    hill: uniq(hanOf('hill').map((s) => `char:${s.char}`)),
  }
  const zones: Zone[] = ZONE_META.map((z) => ({ ...z, items: itemsByZone[z.id] }))

  const audio: Record<string, string> = {}
  for (const s of [...INITIALS, ...MEDIALS, ...FINALS]) audio[`sym:${s}`] = `/audio/sym/${audioFileName(s)}.mp3`
  for (const t of [1, 2, 3, 4, 5]) audio[`tone:${t}`] = `/audio/tone/${t}.mp3`
  for (const p of gen1) {
    audio[`name:zh:${p.id}`] = `/audio/name/zh/${pad3(p.id)}.mp3`
    audio[`name:en:${p.id}`] = `/audio/name/en/${pad3(p.id)}.mp3`
    for (const s of p.syllables) if (s.isHan) audio[`syl:${s.zhuyin}`] = `/audio/syl/${audioFileName(s.zhuyin)}.mp3`
  }
  for (const key of Object.keys(input.prompts)) {
    if (key.startsWith('_')) continue
    audio[`prompt:${key}`] = `/audio/prompt/${key}.mp3`
  }

  const { _comment: _ignored, ...confusables } = input.confusables
  void _ignored
  return { gen1, zones, confusables, audio, report: coverageReport(gen1, zones) }
}

function coverageReport(gen1: Pokemon[], zones: Zone[]): string {
  const lines = ['# 內容涵蓋率報告', '', '由 `npm run content` 產生。出現 0 次的項目會改用「聽音找符號」練習。', '']
  for (const z of zones) {
    const names = gen1.filter((p) => p.zone === z.id)
    const han = names.flatMap((p) => p.syllables.filter((s) => s.isHan))
    const count = (item: string) => {
      const [kind, value] = [item.slice(0, item.indexOf(':')), item.slice(item.indexOf(':') + 1)]
      if (kind === 'sym') return han.filter((s) => [s.initial, s.medial, s.final].includes(value)).length
      if (kind === 'tone') return han.filter((s) => String(s.tone) === value).length
      if (kind === 'syl') return han.filter((s) => s.zhuyin === value).length
      return han.filter((s) => s.char === value).length
    }
    const zero = z.items.filter((i) => count(i) === 0)
    lines.push(`## ${z.name}（${names.length} 隻、${z.items.length} 個練習項目）`, '')
    lines.push(zero.length ? `名稱中出現 0 次：${zero.join('、')}` : '所有項目都至少出現一次。', '')
  }
  return lines.join('\n')
}
