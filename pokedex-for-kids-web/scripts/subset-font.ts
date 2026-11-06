// npm run font：把 jf open 粉圓（OFL）切成只含遊戲用到的字，輸出 woff2（research R9）。
// 用到的字：寶可夢名稱、干擾字、固定語句、src/ 內所有中文字串、注音符號、英數字。
import fs from 'node:fs'
import path from 'node:path'
import subsetFont from 'subset-font'

const web = path.resolve(__dirname, '..')
const rawDir = path.join(web, 'data/raw-font')
const TTF_URL = 'https://cdn.jsdelivr.net/gh/justfont/open-huninn-font@master/font/jf-openhuninn-2.1.ttf'

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    return e.isDirectory() ? walk(p) : /\.(tsx?|json)$/.test(e.name) ? [p] : []
  })
}

async function main() {
  fs.mkdirSync(rawDir, { recursive: true })
  const ttf = path.join(rawDir, 'jf-openhuninn-2.1.ttf')
  if (!fs.existsSync(ttf)) {
    const res = await fetch(TTF_URL)
    if (!res.ok) throw new Error(`下載字型失敗：${res.status}`)
    fs.writeFileSync(ttf, Buffer.from(await res.arrayBuffer()))
  }
  const sources = [
    ...walk(path.join(web, 'src')),
    path.join(web, 'public/data/gen1.json'),
    path.join(web, 'data/confusables.json'),
    path.join(web, 'data/audio/prompts.json'),
  ]
  const chars = new Set<string>()
  for (const f of sources) for (const ch of fs.readFileSync(f, 'utf8')) if (ch.codePointAt(0)! > 0x2e7f) chars.add(ch)
  const base = 'ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙㄧㄨㄩㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦˉˊˇˋ˙＿？！，。、：「」（）／…'
  const ascii = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('')
  const text = [...chars].join('') + base + ascii
  const out = await subsetFont(fs.readFileSync(ttf), text, { targetFormat: 'woff2' })
  const target = path.join(web, 'public/fonts/jfopenhuninn-subset.woff2')
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, out)
  console.log(`字型子集：${chars.size} 個中文字，${(out.length / 1024).toFixed(0)} KB → public/fonts/`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
