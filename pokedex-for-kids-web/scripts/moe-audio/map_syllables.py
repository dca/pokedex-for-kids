"""從《國語辭典簡編本》找出每個音節對應的單字條目（字詞號），輸出 syllable-map.json。"""
import json, sys
import openpyxl

xlsx, gen1_path, out_path = sys.argv[1:4]
gen1 = json.load(open(gen1_path))
need = {}  # 注音 → 寶可夢名稱裡用到的字
for p in gen1:
    for s in p['syllables']:
        if s['isHan']:
            need.setdefault(s['zhuyin'], []).append(s['char'])
tones = {'ㄇㄚ': '媽', 'ㄇㄚˊ': '麻', 'ㄇㄚˇ': '馬', 'ㄇㄚˋ': '罵', '˙ㄇㄚ': '嗎'}

entries = {}  # 注音 → [(字, 字詞號, 多音排序)]
ws = openpyxl.load_workbook(xlsx, read_only=True).active
for i, r in enumerate(ws.iter_rows(values_only=True)):
    if i == 0:
        continue
    word, wid, _, _, _, order, zy = r[:7]
    if not word or len(word) != 1 or not zy:
        continue
    wid = str(wid).strip('="')
    zy = zy.strip().replace('　', '')
    entries.setdefault(zy, []).append((word, wid, order))

# 破音字：在字典裡有兩種以上讀音的字（例如「化」有 ㄏㄨㄚ、ㄏㄨㄚˋ），退回同音字時避開
readings = {}
for zy, lst in entries.items():
    for c in lst:
        readings.setdefault(c[0], set()).add(zy)
poly = {ch for ch, rs in readings.items() if len(rs) > 1}
result, missing = {}, []
for zy, chars in sorted(need.items()):
    cands = entries.get(zy, [])
    ordered = sorted(cands, key=lambda c: (c[0] not in chars, c[0] in poly, c[1]))
    if ordered:
        best = ordered[0]
        result[zy] = {'char': best[0], 'id': best[1], 'order': best[2], 'same_char': best[0] in chars, 'name_chars': sorted(set(chars)),
                      'candidates': [[c[0], c[1]] for c in ordered]}
    else:
        missing.append(zy)
tone_map = {}
for zy, ch in tones.items():
    cs = sorted(entries.get(zy, []), key=lambda c: (c[0] != ch, c[0] in poly, c[1]))
    tone_map[zy] = {'char': cs[0][0], 'id': cs[0][1], 'order': cs[0][2], 'candidates': [[c[0], c[1]] for c in cs]} if cs else None
json.dump({'syllables': result, 'tones': tone_map, 'missing': missing}, open(out_path, 'w'), ensure_ascii=False, indent=1)
print('音節', len(need), '找到', len(result), '缺', missing)
print('與名稱同字', sum(v['same_char'] for v in result.values()))
print('聲調', {k: (v['id'] if v else None) for k, v in tone_map.items()})
