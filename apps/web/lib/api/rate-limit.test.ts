/**
 * [INPUT]: 依赖 vitest，依赖 ./rate-limit
 * [OUTPUT]: rate-limit 模块的单元测试
 * [POS]: lib/api 的限流器测试，验证滑动窗口 + 超限 + 重置
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { checkRateLimit, rateLimitResponse } from './rate-limit'

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows requests within limit', () => {
    const r1 = checkRateLimit('user-1', 3, 60_000)
    expect(r1.ok).toBe(true)
    expect(r1.remaining).toBe(2)
  })

  it('blocks requests exceeding limit', () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit('user-block', 3, 60_000)
    }

    const blocked = checkRateLimit('user-block', 3, 60_000)
    expect(blocked.ok).toBe(false)
    expect(blocked.remaining).toBe(0)
  })

  it('resets after window expires', () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit('user-reset', 3, 60_000)
    }

    // 窗口过期
    vi.advanceTimersByTime(61_000)

    const fresh = checkRateLimit('user-reset', 3, 60_000)
    expect(fresh.ok).toBe(true)
    expect(fresh.remaining).toBe(2)
  })

  it('isolates different identifiers', () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit('user-a', 3, 60_000)
    }

    const userB = checkRateLimit('user-b', 3, 60_000)
    expect(userB.ok).toBe(true)
  })

  it('tracks remaining count correctly', () => {
    const r1 = checkRateLimit('user-count', 5, 60_000)
    expect(r1.remaining).toBe(4)

    const r2 = checkRateLimit('user-count', 5, 60_000)
    expect(r2.remaining).toBe(3)

    const r3 = checkRateLimit('user-count', 5, 60_000)
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
