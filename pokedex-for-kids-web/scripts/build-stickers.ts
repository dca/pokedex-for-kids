// npm run stickers：下載第一世代 151 張官方圖片，做成「白色粗邊＋深藍墨線」的貼紙 webp（research R8）。
// 原始圖片放在 data/raw-artwork/（不提交），輸出到 public/pokemon/NNN.webp。
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const web = path.resolve(__dirname, '..')
const rawDir = path.join(web, 'data/raw-artwork')
const outDir = path.join(web, 'public/pokemon')
const SIZE = 256
const INNER = 200
const art = (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`

async function download(id: number): Promise<Buffer> {
  const file = path.join(rawDir, `${id}.png`)
  if (fs.existsSync(file)) return fs.readFileSync(file)
  const res = await fetch(art(id))
  if (!res.ok) throw new Error(`#${id} 下載失敗：${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(file, buf)
  return buf
}

/** 把透明度遮罩向外擴張 radius 像素（模糊後取門檻），再塗成指定顏色 */
async function ring(alpha: Buffer, radius: number, rgb: [number, number, number]): Promise<Buffer> {
  const { data: grown, info } = await sharp(alpha, { raw: { width: SIZE, height: SIZE, channels: 1 } })
    .blur(radius / 2)
    .raw()
    .toBuffer({ resolveWithObject: true })
  // sharp 不依呼叫順序套用 threshold（會在 blur 之前），所以在這裡自己取門檻
  const out = Buffer.alloc(SIZE * SIZE * 4)
  for (let i = 0; i < SIZE * SIZE; i++) {
    out[i * 4] = rgb[0]
    out[i * 4 + 1] = rgb[1]
    out[i * 4 + 2] = rgb[2]
    out[i * 4 + 3] = grown[i * info.channels] > 8 ? 255 : 0
  }
  return sharp(out, { raw: { width: SIZE, height: SIZE, channels: 4 } }).png().toBuffer()
}

async function sticker(id: number) {
  const pad = (SIZE - INNER) / 2
  const base = await sharp(await download(id))
    .resize(INNER, INNER, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
  const alpha = await sharp(base).extractChannel('alpha').raw().toBuffer()
  const ink = await ring(alpha, 14, [0x2b, 0x3a, 0x67])
  const white = await ring(alpha, 10, [0xff, 0xff, 0xff])
  await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: ink }, { input: white }, { input: base }])
    .webp({ quality: 82, alphaQuality: 90 })
    .toFile(path.join(outDir, `${String(id).padStart(3, '0')}.webp`))
}

async function main() {
  fs.mkdirSync(rawDir, { recursive: true })
  fs.mkdirSync(outDir, { recursive: true })
  const ids = Array.from({ length: 151 }, (_, i) => i + 1)
  for (let i = 0; i < ids.length; i += 8) await Promise.all(ids.slice(i, i + 8).map(sticker))
  console.log(`完成 ${ids.length} 張貼紙 → public/pokemon/`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
