// E2E 用的小型伺服器：提供 out/ 靜態檔，並把 /api 轉給 game-api，模擬正式環境的 Caddy（同源）。
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const port = Number(process.argv[2] ?? 3100)
const api = new URL(process.env.E2E_API ?? 'http://localhost:18080')
const root = path.resolve(new URL('.', import.meta.url).pathname, '..', 'out')

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
}

function serveStatic(req, res) {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  let file = path.join(root, url)
  if (!file.startsWith(root)) {
    res.writeHead(403).end()
    return
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html')
  if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file += '.html'
  if (!fs.existsSync(file)) {
    res.writeHead(404).end('not found')
    return
  }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream' })
  fs.createReadStream(file).pipe(res)
}

function proxy(req, res) {
  const upstream = http.request(
    { hostname: api.hostname, port: api.port, path: req.url, method: req.method, headers: req.headers },
    (up) => {
      res.writeHead(up.statusCode ?? 502, up.headers)
      up.pipe(res)
    },
  )
  upstream.on('error', () => res.writeHead(502).end())
  req.pipe(upstream)
}

http
  .createServer((req, res) => (req.url?.startsWith('/api/') ? proxy(req, res) : serveStatic(req, res)))
  .listen(port, () => console.log(`e2e server on http://localhost:${port}`))
