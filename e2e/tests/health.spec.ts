/**
 * [INPUT]: 依赖 @playwright/test
 * [OUTPUT]: 健康检查端点 E2E 测试
 * [POS]: e2e/tests 的基础冒烟测试
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { expect, test } from '@playwright/test'

test('GET /api/health returns ok', async ({ request }) => {
  const response = await request.get('/api/health')
  expect(response.ok()).toBeTruthy()

  const data = await response.json()
  expect(data.status).toBe('ok')
  expect(data.version).toBeDefined()
  expect(data.timestamp).toBeDefined()
})
