/**
 * [INPUT]: 依赖 @playwright/test
 * [OUTPUT]: 公开 API 端点 E2E 测试 — health/explore/categories/models
 * [POS]: e2e/tests 的 API 层核心覆盖 (无需认证的端点)
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

  test('GET /api/categories returns category list', async ({ request }) => {
    const res = await request.get('/api/categories')

    if (res.ok()) {
      const data = await res.json()
      expect(data.ok).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
    }
    // 即使 D1 不可用也不应 500
    expect(res.status()).not.toBe(500)
  })

  test('GET /api/explore returns public workflows', async ({ request }) => {
    const res = await request.get('/api/explore')

    if (res.ok()) {
      const data = await res.json()
      expect(data.ok).toBe(true)
    }
    expect(res.status()).not.toBe(500)
  })

  test('GET /api/explore/search supports query parameter', async ({ request }) => {
    const res = await request.get('/api/explore/search?q=test')

    if (res.ok()) {
      const data = await res.json()
      expect(data.ok).toBe(true)
    }
    expect(res.status()).not.toBe(500)
  })

  test('GET /api/ai/models returns model catalog', async ({ request }) => {
    const res = await request.get('/api/ai/models')

    if (res.ok()) {
      const data = await res.json()
      expect(data.ok).toBe(true)
    }
    // 可能需要认证，但不应 500
    expect(res.status()).not.toBe(500)
  })

  test('POST /api/ai/execute requires authentication', async ({ request }) => {
    const res = await request.post('/api/ai/execute', {
      data: { model: 'test', messages: [] },
    })
    // 未认证应返回 401
    expect(res.status()).toBe(401)
  })

  test('POST /api/tasks requires authentication', async ({ request }) => {
    const res = await request.post('/api/tasks', {
      data: { type: 'image_gen' },
    })
    expect(res.status()).toBe(401)
  })

  test('oversized request body returns 413', async ({ request }) => {
    // 生成一个超过 1MB 的 payload
    const largePayload = { data: 'x'.repeat(1_100_000) }
    const res = await request.post('/api/ai/execute', {
      data: largePayload,
    })
    // 应返回 413 Payload Too Large（如果 Content-Length 检查生效）
    // 或 401（如果认证先于 body limit 检查）
    expect([401, 413]).toContain(res.status())
  })
})
