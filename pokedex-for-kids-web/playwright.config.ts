import { defineConfig, devices } from '@playwright/test'

// E2E 需要先啟動 API：docker compose -f ../deploy/compose.dev.yml up -d
// 靜態網站由 serve 提供，/api 由 e2e/proxy-server.mjs 轉給 API，維持同源 cookie。
const PORT = 3100

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'ipad', use: { ...devices['iPad (gen 7) landscape'] } },
    { name: 'iphone', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: `node e2e/proxy-server.mjs ${PORT}`,
    port: PORT,
    reuseExistingServer: true,
  },
})
