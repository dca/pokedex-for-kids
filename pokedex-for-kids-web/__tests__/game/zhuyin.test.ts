import { categoryOf, parseSyllable, formatSyllable, splitZhuyin, syllableSize, INITIALS, MEDIALS, FINALS } from '@/game/zhuyin'
import zhuyinData from '../../public/data/pokemon-zhuyin.json'

describe('categoryOf', () => {
  it('37 個符號的分類正確', () => {
    expect(INITIALS).toHaveLength(21)
    expect(MEDIALS).toHaveLength(3)
    expect(FINALS).toHaveLength(13)
    INITIALS.forEach((s) => expect(categoryOf(s)).toBe('initial'))
    MEDIALS.forEach((s) => expect(categoryOf(s)).toBe('medial'))
    FINALS.forEach((s) => expect(categoryOf(s)).toBe('final'))
  })

  it('聲調符號（含輕聲點與挖空）屬於 tone', () => {
    ;['ˊ', 'ˇ', 'ˋ', '˙', 'ˉ'].forEach((s) => expect(categoryOf(s)).toBe('tone'))
  })

  it('不是注音符號時丟出錯誤', () => {
    expect(() => categoryOf('a')).toThrow()
  })
})

describe('parseSyllable', () => {
  it('三拼加聲調', () => {
    expect(parseSyllable('ㄑㄧㄡ')).toEqual({ initial: 'ㄑ', medial: 'ㄧ', final: 'ㄡ', tone: 1 })
    expect(parseSyllable('ㄇㄧㄠˋ')).toEqual({ initial: 'ㄇ', medial: 'ㄧ', final: 'ㄠ', tone: 4 })
  })

  it('輕聲點在最前面', () => {
    expect(parseSyllable('˙ㄉㄜ')).toEqual({ initial: 'ㄉ', medial: null, final: 'ㄜ', tone: 5 })
  })

  it('只有韻母、只有介音、只有聲母', () => {
    expect(parseSyllable('ㄚ')).toEqual({ initial: null, medial: null, final: 'ㄚ', tone: 1 })
    expect(parseSyllable('ㄦˊ')).toEqual({ initial: null, medial: null, final: 'ㄦ', tone: 2 })
    expect(parseSyllable('ㄧˇ')).toEqual({ initial: null, medial: 'ㄧ', final: null, tone: 3 })
    expect(parseSyllable('ㄓ')).toEqual({ initial: 'ㄓ', medial: null, final: null, tone: 1 })
    expect(parseSyllable('ㄙˇ')).toEqual({ initial: 'ㄙ', medial: null, final: null, tone: 3 })
  })

  it('不合法的音節丟出錯誤', () => {
    ;['', 'ㄚㄅ', 'ㄅㄆ', 'ˇˇ', 'ㄧㄧ', 'abc', 'ㄅ˙'].forEach((s) => expect(() => parseSyllable(s)).toThrow())
  })
})

describe('syllableSize', () => {
  it('一拼、二拼、三拼（不含聲調）', () => {
    expect(syllableSize(parseSyllable('ㄚ'))).toBe(1)
    expect(syllableSize(parseSyllable('ㄎㄚˇ'))).toBe(2)
    expect(syllableSize(parseSyllable('ㄑㄧㄡ'))).toBe(3)
  })
})

describe('splitZhuyin', () => {
  it('把注音拆成符號，聲調與挖空各自一個元素', () => {
    expect(splitZhuyin('ㄑ＿ㄡ')).toEqual(['ㄑ', '＿', 'ㄡ'])
    expect(splitZhuyin('˙ㄉㄜ')).toEqual(['˙', 'ㄉ', 'ㄜ'])
    expect(splitZhuyin('ㄎㄚˇ')).toEqual(['ㄎ', 'ㄚ', 'ˇ'])
  })
})

describe('round-trip', () => {
  it('第一世代所有音節 format(parse(x)) === x', () => {
    const gen1 = (zhuyinData as { id: number | null; chars: { isHan: boolean; zhuyin: string | null }[] }[]).filter(
      (p) => typeof p.id === 'number' && p.id <= 151,
    )
    expect(gen1).toHaveLength(151)
    for (const p of gen1) {
      for (const c of p.chars) {
        if (!c.isHan || !c.zhuyin) continue
        expect(formatSyllable(parseSyllable(c.zhuyin))).toBe(c.zhuyin)
      }
    }
  })
})
