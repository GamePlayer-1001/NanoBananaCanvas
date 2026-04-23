/**
 * [INPUT]: 依赖 @playwright/test 的 defineConfig
 * [OUTPUT]: 对外提供 Playwright E2E 测试配置
 * [POS]: e2e 的测试运行器配置，直接在 apps/web 内启动 dev server，并固定本地端口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev:e2e',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    cwd: '../apps/web',
    timeout: 120_000,
  },
})
