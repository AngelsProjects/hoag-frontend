import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './src/e2e',
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    {
      // Mock NestJS must start first so Next.js SSR can reach it during dev startup
      command: 'node src/e2e/mock-nestjs.mjs',
      url: 'http://localhost:3001/files',
      reuseExistingServer: !process.env.CI,
      env: {},
    },
    {
      command: 'pnpm dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      env: {
        NESTJS_API_URL: 'http://localhost:3001',
      },
    },
  ],
})
