import { nameToZhuyin } from '@/lib/zhuyin/nameToZhuyin';

describe('nameToZhuyin', () => {
  it('把每個字轉成注音', () => {
    const result = nameToZhuyin('皮卡丘');

    expect(result.chars.map((c) => c.char)).toEqual(['皮', '卡', '丘']);
    expect(result.chars.map((c) => c.zhuyin)).toEqual(['ㄆㄧˊ', 'ㄎㄚˇ', 'ㄑㄧㄡ']);
    expect(result.zhuyin).toBe('ㄆㄧˊ ㄎㄚˇ ㄑㄧㄡ');
  });

  it('保留拼音', () => {
    const result = nameToZhuyin('皮卡丘');
    expect(result.chars.map((c) => c.pinyin)).toEqual(['pi2', 'ka3', 'qiu1']);
  });

  it('多音字會列出所有讀音並標記需校對', () => {
    const result = nameToZhuyin('傑尼龜');
    const gui = result.chars[2];

    expect(gui.polyphonic).toBe(true);
    expect(gui.readings.length).toBeGreaterThan(1);
    expect(gui.readings).toContain('ㄍㄨㄟ');
    expect(result.needsReview).toBe(true);
  });

  it('沒有多音字就不需要校對', () => {
    // 「妙、蛙」都只有一個讀音
    const result = nameToZhuyin('妙蛙');
    expect(result.chars.every((c) => !c.polyphonic)).toBe(true);
    expect(result.needsReview).toBe(false);
  });

  it('非中文字元原樣保留，不給注音', () => {
    const result = nameToZhuyin('多邊獸Ⅱ');
    const last = result.chars[3];

    expect(last).toEqual(
      expect.objectContaining({ char: 'Ⅱ', isHan: false, zhuyin: null, pinyin: null })
    );
    expect(result.zhuyin).toBe('ㄉㄨㄛ ㄅㄧㄢ ㄕㄡˋ Ⅱ');
  });

  describe('單字校正（chars）', () => {
    it('套用到所有名稱，用來修正台灣讀音', () => {
      const result = nameToZhuyin('熔岩蝸牛', { chars: { 蝸: 'ㄍㄨㄚ' } });
      expect(result.chars[2].zhuyin).toBe('ㄍㄨㄚ');
    });

    it('多音字都已確認時，不需要校對', () => {
      // 卡：ㄎㄚˇ / ㄑㄧㄚˇ
      const result = nameToZhuyin('皮卡丘', { chars: { 卡: 'ㄎㄚˇ' } });
      expect(result.chars[1].confirmed).toBe(true);
      expect(result.needsReview).toBe(false);
      expect(result.reviewed).toBe(false);
    });

    it('還有未確認的多音字時，仍然需要校對', () => {
      const result = nameToZhuyin('傑尼龜', { chars: { 傑: 'ㄐㄧㄝˊ' } });
      expect(result.needsReview).toBe(true);
    });
  });

  describe('名稱校正（names）', () => {
    it('套用後以校正值為準，並標記為已校對', () => {
      const result = nameToZhuyin('傑尼龜', {
        names: { 傑尼龜: ['ㄐㄧㄝˊ', 'ㄋㄧˊ', 'ㄍㄨㄟ'] },
      });

      expect(result.zhuyin).toBe('ㄐㄧㄝˊ ㄋㄧˊ ㄍㄨㄟ');
      expect(result.reviewed).toBe(true);
      expect(result.needsReview).toBe(false);
    });

    it('優先於單字校正', () => {
      const result = nameToZhuyin('貓鼬探長', {
        chars: { 長: 'ㄔㄤˊ' },
        names: { 貓鼬探長: [null, null, null, 'ㄓㄤˇ'] },
      });
      expect(result.chars[3].zhuyin).toBe('ㄓㄤˇ');
    });

    it('null 代表沿用自動判斷', () => {
      const result = nameToZhuyin('皮卡丘', {
        names: { 皮卡丘: [null, 'ㄎㄚ', null] },
      });
      expect(result.chars.map((c) => c.zhuyin)).toEqual(['ㄆㄧˊ', 'ㄎㄚ', 'ㄑㄧㄡ']);
    });

    it('字數和名稱不符會丟出錯誤', () => {
      expect(() => nameToZhuyin('皮卡丘', { names: { 皮卡丘: ['ㄆㄧˊ', 'ㄎㄚˇ'] } })).toThrow(/皮卡丘/);
    });

    it('非中文字元的位置用 null 佔位', () => {
      const result = nameToZhuyin('多邊獸Ⅱ', {
        names: { 多邊獸Ⅱ: ['ㄉㄨㄛ', 'ㄅㄧㄢ', 'ㄕㄡˋ', null] },
      });
      expect(result.reviewed).toBe(true);
      expect(result.zhuyin).toBe('ㄉㄨㄛ ㄅㄧㄢ ㄕㄡˋ Ⅱ');
    });
  });
});
