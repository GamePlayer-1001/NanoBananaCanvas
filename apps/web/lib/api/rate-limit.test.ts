/**
 * [INPUT]: 依赖 vitest，依赖 ./rate-limit
 * [OUTPUT]: rate-limit 模块的单元测试
 * [POS]: lib/api 的限流器测试，验证 KV 滑动窗口 + 超限 + 重置
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/* ─── Mock KV ──────────────────────────────────────── */

const kvStore = new Map<string, { value: string; expiresAt?: number }>()

vi.mock('@/lib/kv', () => ({
  getKV: () => ({
    get: async (key: string) => {
      const entry = kvStore.get(key)
      if (!entry) return null
      if (entry.expiresAt && Date.now() >= entry.expiresAt) {
        kvStore.delete(key)
        return null
      }
      return JSON.parse(entry.value)
    },
    put: async (key: string, value: string, opts?: { expirationTtl?: number }) => {
      kvStore.set(key, {
        value,
        expiresAt: opts?.expirationTtl ? Date.now() + opts.expirationTtl * 1000 : undefined,
      })
    },
  }),
}))

import { checkRateLimit, rateLimitResponse } from './rate-limit'

describe('checkRateLimit', () => {
  beforeEach(() => {
    kvStore.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows requests within limit', async () => {
    const r1 = await checkRateLimit('user-1', 3, 60_000)
    expect(r1.ok).toBe(true)
    expect(r1.remaining).toBe(2)
  })

  it('blocks requests exceeding limit', async () => {
    for (let i = 0; i < 3; i++) {
      await checkRateLimit('user-block', 3, 60_000)
    }

    const blocked = await checkRateLimit('user-block', 3, 60_000)
    expect(blocked.ok).toBe(false)
    expect(blocked.remaining).toBe(0)
  })

  it('resets after window expires', async () => {
    for (let i = 0; i < 3; i++) {
      await checkRateLimit('user-reset', 3, 60_000)
    }

    // 窗口过期
    vi.advanceTimersByTime(61_000)

    const fresh = await checkRateLimit('user-reset', 3, 60_000)
    expect(fresh.ok).toBe(true)
    expect(fresh.remaining).toBe(2)
  })

  it('isolates different identifiers', async () => {
    for (let i = 0; i < 3; i++) {
      await checkRateLimit('user-a', 3, 60_000)
    }

    const userB = await checkRateLimit('user-b', 3, 60_000)
    expect(userB.ok).toBe(true)
  })

  it('tracks remaining count correctly', async () => {
    const r1 = await checkRateLimit('user-count', 5, 60_000)
    expect(r1.remaining).toBe(4)

    const r2 = await checkRateLimit('user-count', 5, 60_000)
    expect(r2.remaining).toBe(3)

    const r3 = await checkRateLimit('user-count', 5, 60_000)
    expect(r3.remaining).toBe(2)
  })
})

describe('rateLimitResponse', () => {
  it('returns 429 status', () => {
    const res = rateLimitResponse(Date.now() + 30_000)
    expect(res.status).toBe(429)
  })

  it('includes Retry-After header', () => {
    const resetAt = Date.now() + 30_000
    const res = rateLimitResponse(resetAt)
    const retryAfter = res.headers.get('Retry-After')
    expect(retryAfter).toBeTruthy()
    expect(Number(retryAfter)).toBeGreaterThan(0)
  })

  it('returns JSON error body', async () => {
    const res = rateLimitResponse(Date.now() + 10_000)
    const body = await res.json()
    expect(body.ok).toBe(false)
    expect(body.error.code).toBe('RATE_LIMITED')
  })
})
