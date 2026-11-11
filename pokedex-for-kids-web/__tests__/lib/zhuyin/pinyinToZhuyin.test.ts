import { pinyinToZhuyin } from '@/lib/zhuyin/pinyinToZhuyin';

describe('pinyinToZhuyin', () => {
  describe('聲調', () => {
    it.each([
      ['ma1', 'ㄇㄚ'],
      ['ma2', 'ㄇㄚˊ'],
      ['ma3', 'ㄇㄚˇ'],
      ['ma4', 'ㄇㄚˋ'],
      ['ma0', '˙ㄇㄚ'],
      ['ma5', '˙ㄇㄚ'],
      ['ma', '˙ㄇㄚ'],
    ])('%s → %s', (input, expected) => {
      expect(pinyinToZhuyin(input)).toBe(expected);
    });
  });

  describe('寶可夢名稱常見音節', () => {
    it.each([
      ['pi2', 'ㄆㄧˊ'],
      ['ka3', 'ㄎㄚˇ'],
      ['qiu1', 'ㄑㄧㄡ'],
      ['miao4', 'ㄇㄧㄠˋ'],
      ['wa1', 'ㄨㄚ'],
      ['zhong3', 'ㄓㄨㄥˇ'],
      ['zi3', 'ㄗˇ'],
      ['huo3', 'ㄏㄨㄛˇ'],
      ['long2', 'ㄌㄨㄥˊ'],
      ['jie2', 'ㄐㄧㄝˊ'],
      ['gui1', 'ㄍㄨㄟ'],
      ['shui3', 'ㄕㄨㄟˇ'],
      ['jian4', 'ㄐㄧㄢˋ'],
    ])('%s → %s', (input, expected) => {
      expect(pinyinToZhuyin(input)).toBe(expected);
    });
  });

  describe('整體認讀（只有聲母）', () => {
    it.each([
      ['zhi1', 'ㄓ'],
      ['chi1', 'ㄔ'],
      ['shi4', 'ㄕˋ'],
      ['ri4', 'ㄖˋ'],
      ['zi4', 'ㄗˋ'],
      ['ci2', 'ㄘˊ'],
      ['si1', 'ㄙ'],
    ])('%s → %s', (input, expected) => {
      expect(pinyinToZhuyin(input)).toBe(expected);
    });
  });

  describe('y / w 開頭', () => {
    it.each([
      ['yi1', 'ㄧ'],
      ['ya2', 'ㄧㄚˊ'],
      ['ye4', 'ㄧㄝˋ'],
      ['yao4', 'ㄧㄠˋ'],
      ['you3', 'ㄧㄡˇ'],
      ['yan2', 'ㄧㄢˊ'],
      ['yin2', 'ㄧㄣˊ'],
      ['yang2', 'ㄧㄤˊ'],
      ['ying1', 'ㄧㄥ'],
      ['yong3', 'ㄩㄥˇ'],
      ['yu2', 'ㄩˊ'],
      ['yue4', 'ㄩㄝˋ'],
      ['yuan2', 'ㄩㄢˊ'],
      ['yun2', 'ㄩㄣˊ'],
      ['wu3', 'ㄨˇ'],
      ['wo3', 'ㄨㄛˇ'],
      ['wei4', 'ㄨㄟˋ'],
      ['wan2', 'ㄨㄢˊ'],
      ['wen2', 'ㄨㄣˊ'],
      ['wang2', 'ㄨㄤˊ'],
      ['weng1', 'ㄨㄥ'],
    ])('%s → %s', (input, expected) => {
      expect(pinyinToZhuyin(input)).toBe(expected);
    });
  });

  describe('ü 與 j / q / x 的 u', () => {
    it.each([
      ['lü4', 'ㄌㄩˋ'],
      ['lv4', 'ㄌㄩˋ'],
      ['nüe4', 'ㄋㄩㄝˋ'],
      ['ju2', 'ㄐㄩˊ'],
      ['que4', 'ㄑㄩㄝˋ'],
      ['xuan2', 'ㄒㄩㄢˊ'],
      ['jun1', 'ㄐㄩㄣ'],
      ['xiong2', 'ㄒㄩㄥˊ'],
    ])('%s → %s', (input, expected) => {
      expect(pinyinToZhuyin(input)).toBe(expected);
    });
  });

  describe('韻母縮寫還原（iu / ui / un）', () => {
    it.each([
      ['liu2', 'ㄌㄧㄡˊ'],
      ['dui4', 'ㄉㄨㄟˋ'],
      ['lun2', 'ㄌㄨㄣˊ'],
    ])('%s → %s', (input, expected) => {
      expect(pinyinToZhuyin(input)).toBe(expected);
    });
  });

  describe('零聲母', () => {
    it.each([
      ['a1', 'ㄚ'],
      ['e2', 'ㄜˊ'],
      ['ai4', 'ㄞˋ'],
      ['ao4', 'ㄠˋ'],
      ['ou3', 'ㄡˇ'],
      ['an1', 'ㄢ'],
      ['en1', 'ㄣ'],
      ['er2', 'ㄦˊ'],
    ])('%s → %s', (input, expected) => {
      expect(pinyinToZhuyin(input)).toBe(expected);
    });
  });

  it('大小寫不影響結果', () => {
    expect(pinyinToZhuyin('PI2')).toBe('ㄆㄧˊ');
  });

  it.each(['', 'xyz1', 'bv2', 'ma6'])('無法辨識的拼音 %p 會丟出錯誤', (input) => {
    expect(() => pinyinToZhuyin(input)).toThrow();
  });
});
