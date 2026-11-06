// npm run audio -- [--engine say|google] [--force]
// 產生注音符號、聲調示範、名稱音節與固定語句的音檔（research R1）。
//
// - say（預設）：macOS 內建的台灣中文語音 Meijia，用來先做出可以玩的版本。
// - google：Google Cloud TTS（cmn-TW），需要 `gcloud auth application-default login` 與 GOOGLE_CLOUD_PROJECT，會產生費用。
//
// data/audio/overrides/<相同路徑>.mp3 存在時直接採用（真人錄音），不會被覆蓋。
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execFileSync } from 'node:child_process'
import { audioFileName } from './content/buildContent'

type Engine = 'say' | 'google'
const args = process.argv.slice(2)
const engine: Engine = args.includes('--engine') ? (args[args.indexOf('--engine') + 1] as Engine) : 'say'
const force = args.includes('--force')

const web = path.resolve(__dirname, '..')
const readJson = (p: string) => JSON.parse(fs.readFileSync(path.join(web, p), 'utf8'))
const gen1 = readJson('public/data/gen1.json') as { syllables: { char: string; isHan: boolean; zhuyin: string }[] }[]
const allSource = readJson('public/data/pokemon-zhuyin.json') as { chars: { char: string; zhuyin: string | null; readings?: string[] }[] }[]
const symbolChars = readJson('data/audio/symbol-chars.json') as {
  chars: Record<string, string>
  tones: Record<string, string>
  needsRecording: string[]
}
const prompts = readJson('data/audio/prompts.json') as Record<string, string>

/** 音節的代表字：優先挑只有一種讀音的字，避免 TTS 唸錯多音字 */
function representativeChars(): Record<string, string> {
  const best: Record<string, { char: string; unique: boolean }> = {}
  for (const p of allSource) {
    for (const c of p.chars) {
      if (!c.zhuyin) continue
      const unique = (c.readings?.length ?? 1) === 1
      const cur = best[c.zhuyin]
      if (!cur || (!cur.unique && unique)) best[c.zhuyin] = { char: c.char, unique }
    }
  }
  return Object.fromEntries(Object.entries(best).map(([k, v]) => [k, v.char]))
}

const jobs: { rel: string; text: string; note?: string }[] = []
for (const [sym, ch] of Object.entries(symbolChars.chars)) {
  jobs.push({ rel: `sym/${audioFileName(sym)}.mp3`, text: ch, note: symbolChars.needsRecording.includes(sym) ? `${sym}：建議真人錄音` : undefined })
}
for (const [tone, ch] of Object.entries(symbolChars.tones)) jobs.push({ rel: `tone/${tone}.mp3`, text: ch })
const reps = representativeChars()
const syllables = new Set(gen1.flatMap((p) => p.syllables.filter((s) => s.isHan).map((s) => s.zhuyin)))
for (const zy of syllables) jobs.push({ rel: `syl/${audioFileName(zy)}.mp3`, text: reps[zy] ?? zy, note: `${zy}（${reps[zy]}）` })
for (const [key, text] of Object.entries(prompts)) if (!key.startsWith('_')) jobs.push({ rel: `prompt/${key}.mp3`, text })

const outRoot = path.join(web, 'public/audio')
const overrideRoot = path.join(web, 'data/audio/overrides')
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'zhuyin-audio-'))

function synthSay(text: string, target: string) {
  const aiff = path.join(tmp, 'x.aiff')
  execFileSync('say', ['-v', 'Meijia', '-r', '150', '-o', aiff, text])
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', aiff, '-ac', '1', '-ar', '24000', '-b:a', '48k', target])
}

function synthGoogle(text: string, target: string, token: string) {
  const body = JSON.stringify({
    input: { text },
    // 與 crawlers/ 產生寶可夢名稱音檔的設定相同（cmn-TW 女聲、預設語速），題目接著名稱播放時聲音才一致
    voice: { languageCode: 'cmn-TW', ssmlGender: 'FEMALE' },
    audioConfig: { audioEncoding: 'MP3' },
  })
  const res = execFileSync('curl', [
    '-sS', '-X', 'POST', 'https://texttospeech.googleapis.com/v1/text:synthesize',
    '-H', `Authorization: Bearer ${token}`,
    '-H', `x-goog-user-project: ${process.env.GOOGLE_CLOUD_PROJECT ?? ''}`,
    '-H', 'Content-Type: application/json', '-d', body,
  ]).toString()
  const json = JSON.parse(res) as { audioContent?: string; error?: { message: string } }
  if (!json.audioContent) throw new Error(json.error?.message ?? 'TTS 失敗')
  fs.writeFileSync(target, Buffer.from(json.audioContent, 'base64'))
}

const token = engine === 'google' ? execFileSync('gcloud', ['auth', 'application-default', 'print-access-token']).toString().trim() : ''
let made = 0
let skipped = 0
for (const job of jobs) {
  const target = path.join(outRoot, job.rel)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  const override = path.join(overrideRoot, job.rel)
  if (fs.existsSync(override)) {
    fs.copyFileSync(override, target)
    continue
  }
  if (fs.existsSync(target) && !force) {
    skipped++
    continue
  }
  if (engine === 'google') synthGoogle(job.text, target, token)
  else synthSay(job.text, target)
  made++
}

const review = [
  '# 音檔試聽清單',
  '',
  `產生方式：${engine === 'say' ? 'macOS Meijia（暫用，待正式產生）' : 'Google Cloud TTS cmn-TW'}。`,
  '試聽後不合格的檔案，請把真人錄音放到 `data/audio/overrides/` 的相同路徑，再執行 `npm run audio`。',
  '',
  '| 檔案 | 唸的字 | 備註 |',
  '|---|---|---|',
  ...jobs.map((j) => `| public/audio/${j.rel} | ${j.text} | ${j.note ?? ''} |`),
  '',
]
fs.writeFileSync(path.join(web, 'data/audio/review.md'), review.join('\n'))
console.log(`產生 ${made} 個、略過已存在 ${skipped} 個、共 ${jobs.length} 個`)
