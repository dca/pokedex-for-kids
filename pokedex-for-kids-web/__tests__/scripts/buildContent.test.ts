import { buildContent, audioFileName, type SourcePokemon } from '../../scripts/content/buildContent'
import source from '../../public/data/pokemon-zhuyin.json'
import zonesConfig from '../../data/gen1-zones.json'
import confusables from '../../data/confusables.json'
import prompts from '../../data/audio/prompts.json'
import { formatSyllable } from '@/game/zhuyin'

const out = buildContent({
  source: source as SourcePokemon[],
  zonesConfig: zonesConfig as Parameters<typeof buildContent>[0]['zonesConfig'],
  confusables,
  prompts,
})

describe('buildContent', () => {
  it('151 隻都存在且依編號排序', () => {
    expect(out.gen1).toHaveLength(151)
    expect(out.gen1.map((p) => p.id)).toEqual(Array.from({ length: 151 }, (_, i) => i + 1))
    expect(out.gen1[24]).toMatchObject({ id: 25, name: '皮卡丘', en: 'Pikachu', rare: true })
  })

  it('音節拼回等於已校對的注音', () => {
    const src = new Map((source as SourcePokemon[]).map((p) => [p.id, p]))
    for (const p of out.gen1) {
      const chars = src.get(p.id)!.chars
      p.syllables.forEach((s, i) => {
        expect(s.char).toBe(chars[i].char)
        if (s.isHan) expect(formatSyllable(s)).toBe(chars[i].zhuyin)
      })
    }
  })

  it('非漢字標記為 isHan=false（第一世代沒有，但來源資料若出現符號也要能處理）', () => {
    const withSymbol = (source as SourcePokemon[]).map((p) =>
      p.id === 29 ? { ...p, chars: [...p.chars, { char: '♀', isHan: false, zhuyin: null }] } : p,
    )
    const built = buildContent({
      source: withSymbol,
      zonesConfig: zonesConfig as Parameters<typeof buildContent>[0]['zonesConfig'],
      confusables,
      prompts,
    })
    const last = built.gen1[28].syllables.at(-1)!
    expect(last).toMatchObject({ char: '♀', isHan: false, zhuyin: '' })
  })

  it('每隻寶可夢都有區域，四區都有寶可夢', () => {
    const zones = new Set(out.gen1.map((p) => p.zone))
    expect([...zones].sort()).toEqual(['beach', 'forest', 'hill', 'meadow'])
  })

  it('夥伴的進化路線', () => {
    expect(out.gen1[0].evolvesTo).toBe(2)
    expect(out.gen1[1].evolvesTo).toBe(3)
    expect(out.gen1[2].evolvesTo).toBeNull()
  })

  it('區域的練習項目', () => {
    const [meadow, beach, forest, hill] = out.zones
    expect(meadow.items).toHaveLength(21)
    expect(beach.items).toHaveLength(16 + 5)
    expect(forest.items.every((i) => i.startsWith('syl:'))).toBe(true)
    expect(hill.items.every((i) => i.startsWith('char:'))).toBe(true)
    expect(out.zones.map((z) => z.order)).toEqual([1, 2, 3, 4])
  })

  it('音檔清單涵蓋所有需要的鍵', () => {
    expect(out.audio['sym:ㄅ']).toBe(`/audio/sym/${audioFileName('ㄅ')}.mp3`)
    expect(out.audio['tone:5']).toBe('/audio/tone/5.mp3')
    expect(out.audio['name:zh:25']).toBe('/audio/name/zh/025.mp3')
    expect(out.audio['name:en:151']).toBe('/audio/name/en/151.mp3')
    expect(out.audio['prompt:first-sound']).toBe('/audio/prompt/first-sound.mp3')
    for (const p of out.gen1) for (const s of p.syllables) if (s.isHan) expect(out.audio[`syl:${s.zhuyin}`]).toBeDefined()
    expect(Object.keys(out.audio).some((k) => k.startsWith('prompt:_'))).toBe(false)
  })

  it('音檔名稱只有 ASCII', () => {
    expect(audioFileName('˙ㄉㄜ')).toMatch(/^[0-9a-f_]+$/)
  })

  it('移除註解欄位', () => {
    expect(out.confusables).not.toHaveProperty('_comment')
  })

  it('產生涵蓋率報告', () => {
    expect(out.report).toContain('新手草原')
  })
})
