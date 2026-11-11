const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  // e2e/ 是 Playwright 測試，由 npm run e2e 執行
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/e2e/'],

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1"
  }
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
