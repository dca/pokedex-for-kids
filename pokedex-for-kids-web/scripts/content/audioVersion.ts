// 在音檔網址加上內容雜湊（?v=xxxxxxxx），換了音檔後瀏覽器與 CDN 不會繼續用舊檔。
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

export function versionAudioManifest(audio: Record<string, string>, publicDir: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, url] of Object.entries(audio)) {
    const clean = url.split('?')[0]
    const file = path.join(publicDir, clean)
    if (!fs.existsSync(file)) {
      out[key] = clean
      continue
    }
    const hash = crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex').slice(0, 8)
    out[key] = `${clean}?v=${hash}`
  }
  return out
}

/** 重新計算 public/data/audio.json 中每個音檔的版本 */
export function rewriteAudioManifest(webDir: string) {
  const manifestPath = path.join(webDir, 'public/data/audio.json')
  const audio = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as Record<string, string>
  fs.writeFileSync(manifestPath, JSON.stringify(versionAudioManifest(audio, path.join(webDir, 'public')), null, 1) + '\n')
}
