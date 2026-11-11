/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development'

const nextConfig = {
  output: 'export',
  // GitHub Pages 用 /pokedex-for-kids；自己的主機用空字串
  basePath: process.env.NEXT_BASE_PATH ?? '',
  reactStrictMode: true,
  images: { unoptimized: true },
  // 靜態輸出不支援 rewrites，只在開發模式把 /api 轉給本機的 game-api
  ...(isDev && {
    async rewrites() {
      return [{ source: '/api/:path*', destination: 'http://localhost:18080/api/:path*' }]
    },
  }),
}

module.exports = nextConfig
