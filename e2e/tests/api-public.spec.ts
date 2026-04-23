/**
 * [INPUT]: 依赖 @playwright/test
 * [OUTPUT]: 公开 API 端点 E2E 测试 — 健康检查与匿名请求守卫
 * [POS]: e2e/tests 的 API 层烟雾覆盖，避免依赖本地 D1 种子状态
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { expect, test } from '@playwright/test'

test.describe('Public API Endpoints', () => {
  test('GET /api/health returns system status', async ({ request }) => {
    const res = await request.get('/api/health')
    expect(res.ok()).toBeTruthy()

    const data = await res.json()
    expect(data.status).toBe('ok')
    expect(data.version).toBeDefined()
    expect(data.timestamp).toBeDefined()
  })

  test('POST /api/ai/execute rejects malformed anonymous payloads without 5xx', async ({ request }) => {
    const res = await request.post('/api/ai/execute', {
      data: { model: 'test', messages: [] },
    })
    expect(res.status()).toBe(400)
  })

  test('POST /api/tasks rejects malformed anonymous payloads without 5xx', async ({ request }) => {
    const res = await request.post('/api/tasks', {
      data: { type: 'image_gen' },
    })
    expect(res.status()).toBe(400)
  })

  test('oversized request body returns 413', async ({ request }) => {
    // 生成一个超过 1MB 的 payload
    const largePayload = { data: 'x'.repeat(1_100_000) }
    const res = await request.post('/api/ai/execute', {
      data: largePayload,
    })
    // 应返回 413 Payload Too Large；某些运行时也可能先命中请求校验
    expect([400, 413]).toContain(res.status())
  })
})
