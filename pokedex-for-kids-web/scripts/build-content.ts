// npm run content：產生遊戲的靜態內容，同時輸出到前端與 game-api。
import fs from 'node:fs'
import path from 'node:path'
import { buildContent, type SourcePokemon } from './content/buildContent'
import { rewriteAudioManifest } from './content/audioVersion'

const web = path.resolve(__dirname, '..')
const repo = path.resolve(web, '..')
const readJson = (p: string) => JSON.parse(fs.readFileSync(p, 'utf8'))

const out = buildContent({
  source: readJson(path.join(web, 'public/data/pokemon-zhuyin.json')) as SourcePokemon[],
  zonesConfig: readJson(path.join(web, 'data/gen1-zones.json')),
  confusables: readJson(path.join(web, 'data/confusables.json')),
  prompts: readJson(path.join(web, 'data/audio/prompts.json')),
})

const files: Record<string, unknown> = {
  'gen1.json': out.gen1,
  'zones.json': out.zones,
  'confusables.json': out.confusables,
}
for (const dir of [path.join(web, 'public/data'), path.join(repo, 'game-api/internal/content/data')]) {
  fs.mkdirSync(dir, { recursive: true })
  for (const [name, data] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), JSON.stringify(data, null, 1) + '\n')
}
fs.writeFileSync(path.join(web, 'public/data/audio.json'), JSON.stringify(out.audio, null, 1) + '\n')
fs.writeFileSync(path.join(web, 'data/coverage.md'), out.report)

// 複製 151 隻的中英文名稱音檔
const mp3 = path.join(repo, 'crawlers/assets/mp3')
const zhFiles = fs.readdirSync(path.join(mp3, 'zh-TW'))
const enFiles = fs.readdirSync(path.join(mp3, 'en'))
for (const lang of ['zh', 'en'] as const) fs.mkdirSync(path.join(web, `public/audio/name/${lang}`), { recursive: true })
let missing = 0
for (const p of out.gen1) {
  const zh = zhFiles.find((f) => f.startsWith(`${p.id}-`))
  const en = enFiles.find((f) => f.startsWith(`${p.id}-`))
  const target = (lang: string) => path.join(web, `public/audio/name/${lang}/${String(p.id).padStart(3, '0')}.mp3`)
  if (zh) fs.copyFileSync(path.join(mp3, 'zh-TW', zh), target('zh'))
  else missing++
  if (en) fs.copyFileSync(path.join(mp3, 'en', en), target('en'))
  else missing++
}

rewriteAudioManifest(web)
console.log(`gen1：${out.gen1.length} 隻；音檔鍵：${Object.keys(out.audio).length} 個；缺少名稱音檔：${missing} 個`)
console.log(out.report)
if (missing > 0) process.exitCode = 1
