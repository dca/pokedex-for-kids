"""從《國語辭典簡編本》單字屬性聲音檔取出第一段（字音本身），輸出到 data/audio/overrides。"""
import json, os, re, subprocess, sys, zipfile

zip_path, map_path, overrides = sys.argv[1:4]
m = json.load(open(map_path))
zf = zipfile.ZipFile(zip_path)
tmp = os.path.join(os.path.dirname(map_path), 'seg-tmp')
os.makedirs(tmp, exist_ok=True)

def hexname(zy):
    return '_'.join(format(ord(c), 'x') for c in zy)

def first_segment_end(wav):
    """第一段語音結束的時間：第一個長於 0.25 秒的靜音開始處。"""
    err = subprocess.run(['ffmpeg', '-hide_banner', '-i', wav, '-af', 'silencedetect=noise=-35dB:d=0.25', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r'silence_start: ([0-9.]+)', err)]
    starts = [s for s in starts if s > 0.15]
    return starts[0] if starts else None

names = set(zf.namelist())

def pick(e):
    """依序找第一個在壓縮檔裡有音檔的同音字"""
    for ch, wid in e['candidates']:
        if f'word_wav/word_wav/{wid}.wav' in names:
            return ch, wid
    return None, None

def extract(wid, out):
    name = f'word_wav/word_wav/{wid}.wav'
    wav = os.path.join(tmp, f'{wid}.wav')
    with zf.open(name) as src, open(wav, 'wb') as dst:
        dst.write(src.read())
    end = first_segment_end(wav)
    if end is None:
        return None
    os.makedirs(os.path.dirname(out), exist_ok=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-t', f'{end + 0.12:.3f}',
                    '-ac', '1', '-ar', '22050', '-b:a', '64k', out], check=True)
    return end

report = []
used = {}
for zy, e in m['syllables'].items():
    ch, wid = pick(e)
    if not wid:
        report.append((zy, None, None, None)); continue
    end = extract(wid, os.path.join(overrides, 'syl', hexname(zy) + '.mp3'))
    used[zy] = {'char': ch, 'same': ch in e['name_chars'], 'name_chars': e['name_chars']}
    report.append((zy, ch, wid, end))
tone_num = {'ㄇㄚ': 1, 'ㄇㄚˊ': 2, 'ㄇㄚˇ': 3, 'ㄇㄚˋ': 4, '˙ㄇㄚ': 5}
for zy, e in m['tones'].items():
    ch, wid = pick(e)
    end = extract(wid, os.path.join(overrides, 'tone', f'{tone_num[zy]}.mp3'))
    used['tone' + str(tone_num[zy])] = {'char': ch, 'same': True, 'name_chars': [ch]}
    report.append((zy, ch, wid, end))
json.dump(used, open(os.path.join(os.path.dirname(map_path), 'used-chars.json'), 'w'), ensure_ascii=False, indent=1)

bad = [r for r in report if r[3] is None or r[3] < 0.2 or r[3] > 1.2]
print('完成', len(report), '個；長度異常', len(bad))
print('用同音字代替：', {k: (v['char'], v['name_chars']) for k, v in used.items() if not v['same']})
for r in bad:
    print('  ', r)
lens = sorted(r[3] for r in report if r[3])
print('第一段長度：最短 %.2f、中位 %.2f、最長 %.2f 秒' % (lens[0], lens[len(lens) // 2], lens[-1]))
