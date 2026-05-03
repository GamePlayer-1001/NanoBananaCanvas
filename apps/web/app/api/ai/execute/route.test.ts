/**
 * [INPUT]: 依赖 vitest，mock 认证/限流/DB/Provider/计费内核
 * [OUTPUT]: 对外提供 POST /api/ai/execute 路由测试，覆盖平台模式冻结结算与失败退款
 * [POS]: api/ai/execute 的回归测试，保护 Stripe Phase 7 非流式执行链计费编排
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api/auth', () => ({
  requireAuth: vi.fn(),
}))

vi.mock('@/lib/api/rate-limit', () => ({
  checkRateLimit: vi.fn(),
  rateLimitResponse: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(),
}))

vi.mock('@/lib/billing/ledger', () => ({
  freezeCredits: vi.fn(),
  confirmFrozenCredits: vi.fn(),
  refundFrozenCredits: vi.fn(),
}))

vi.mock('@/lib/billing/metering', () => ({
  getModelPricing: vi.fn(),
  estimateBillableUnits: vi.fn(),
  estimateCreditsFromUsage: vi.fn(),
}))

vi.mock('@/services/ai', () => ({
  getPlatformKey: vi.fn(),
  getPlatformSupplierApiKey: vi.fn(),
  getProvider: vi.fn(),
  createPlatformTextProvider: vi.fn(),
}))

import { requireAuth } from '@/lib/api/auth'
import { checkRateLimit } from '@/lib/api/rate-limit'
import { confirmFrozenCredits, freezeCredits, refundFrozenCredits } from '@/lib/billing/ledger'
import {
  estimateBillableUnits,
  estimateCreditsFromUsage,
  getModelPricing,
} from '@/lib/billing/metering'
import { getDb } from '@/lib/db'
import {
  createPlatformTextProvider,
  getPlatformKey,
  getPlatformSupplierApiKey,
  getProvider,
} from '@/services/ai'

import { POST } from './route'

function createDbMock() {
  return {
    prepare: vi.fn(() => ({
      bind: vi.fn(() => ({
        run: vi.fn().mockResolvedValue({}),
      })),
    })),
  } as unknown as D1Database
}

describe('POST /api/ai/execute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAuth).mockResolvedValue({ userId: 'user_exec_1' } as never)
    vi.mocked(checkRateLimit).mockResolvedValue({ ok: true, resetAt: Date.now() } as never)
    vi.mocked(getDb).mockResolvedValue(createDbMock())
    vi.mocked(getPlatformKey).mockResolvedValue('platform-key')
    vi.mocked(getPlatformSupplierApiKey).mockResolvedValue('platform-key')
    vi.mocked(getModelPricing).mockResolvedValue({
      id: 'pricing_1',
      provider: 'openrouter',
      modelId: 'gpt-4.1-mini',
      modelName: 'GPT-4.1 Mini',
      category: 'text',
      creditsPer1kUnits: 10,
      tier: 'standard',
      minPlan: 'free',
      isActive: true,
    })
    vi.mocked(freezeCredits).mockResolvedValue({
      referenceId: 'ref',
      frozen: { trial: 0, monthly: 0, permanent: 0, total: 0 },
      availableCreditsAfter: 1000,
      frozenCreditsAfter: 0,
    })
    vi.mocked(confirmFrozenCredits).mockResolvedValue({
      referenceId: 'ref',
      finalized: { trial: 0, monthly: 0, permanent: 0, total: 0 },
      availableCreditsAfter: 1000,
      frozenCreditsAfter: 0,
      totalSpentAfter: 0,
    })
    vi.mocked(refundFrozenCredits).mockResolvedValue({
      referenceId: 'ref',
      finalized: { trial: 0, monthly: 0, permanent: 0, total: 0 },
      availableCreditsAfter: 1000,
      frozenCreditsAfter: 0,
      totalSpentAfter: 0,
    })
  })

  it('freezes reserved credits, confirms actual spend, and refunds unused remainder', async () => {
    vi.mocked(estimateBillableUnits).mockReturnValue({
        category: 'text',
        billableUnits: 3200,
        unitLabel: 'tokens',
        basis: 'token_usage',
      })
    vi.mocked(estimateCreditsFromUsage)
      .mockReturnValueOnce(50)
      .mockReturnValueOnce(32)
      .mockReturnValueOnce(32)
    vi.mocked(createPlatformTextProvider).mockReturnValue({
      chat: vi.fn().mockResolvedValue({
        content: 'hello world',
        usage: {
          promptTokens: 1200,
          completionTokens: 2000,
        },
      }),
    } as never)

    const response = await POST(
      new Request('http://localhost/api/ai/execute', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          executionMode: 'platform',
          provider: 'openrouter',
          modelId: 'gpt-4.1-mini',
          messages: [{ role: 'user', content: 'hello' }],
        }),
      }),
    )

    expect(response.status).toBe(200)
    expect(freezeCredits).toHaveBeenCalledTimes(1)
    expect(freezeCredits).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user_exec_1',
        requestedCredits: 1,
        source: 'ai_execute_platform_freeze',
      }),
    )
    expect(confirmFrozenCredits).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user_exec_1',
        requestedCredits: 1,
        source: 'ai_execute_platform_confirm',
      }),
    )
    expect(refundFrozenCredits).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: { result: 'hello world' },
    })
  })

  it('refunds the reserved credits when provider execution fails', async () => {
    vi.mocked(estimateBillableUnits).mockReturnValue({
      category: 'text',
      billableUnits: 4000,
      unitLabel: 'tokens',
      basis: 'message_char_estimate',
    })
    vi.mocked(estimateCreditsFromUsage).mockReturnValue(40)
    vi.mocked(createPlatformTextProvider).mockReturnValue({
      chat: vi.fn().mockRejectedValue(new Error('provider exploded')),
    } as never)

    const response = await POST(
      new Request('http://localhost/api/ai/execute', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          executionMode: 'platform',
          provider: 'openrouter',
          modelId: 'gpt-4.1-mini',
          messages: [{ role: 'user', content: 'boom' }],
        }),
      }),
    )

    expect(response.status).toBe(503)
    expect(freezeCredits).toHaveBeenCalledTimes(1)
    expect(confirmFrozenCredits).not.toHaveBeenCalled()
    expect(refundFrozenCredits).toHaveBeenCalledTimes(1)
    expect(refundFrozenCredits).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user_exec_1',
        source: 'ai_execute_platform_failure_refund',
      }),
    )
  })

  it('returns 503 with a clear message when platform provider secret is missing', async () => {
    vi.mocked(getPlatformSupplierApiKey).mockRejectedValue(
      new Error('Missing required environment variable: COMFLY_API_KEY'),
    )

    const response = await POST(
      new Request('http://localhost/api/ai/execute', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          executionMode: 'platform',
          provider: 'comfly',
          modelId: 'gpt-5.4',
          messages: [{ role: 'user', content: 'hello' }],
        }),
      }),
    )

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: 'AI_PROVIDER_ERROR',
        message: 'Platform provider "comfly" is not configured for model "gpt-5.4"',
      },
    })
    expect(refundFrozenCredits).toHaveBeenCalledTimes(1)
  })

  it('does not require model_pricing for platform text execution', async () => {
    vi.mocked(getModelPricing).mockRejectedValue(new Error('model_pricing missing'))
    vi.mocked(createPlatformTextProvider).mockReturnValue({
      chat: vi.fn().mockResolvedValue({
        content: 'deep answer',
        usage: {
          promptTokens: 300,
          completionTokens: 200,
        },
      }),
    } as never)

    const response = await POST(
      new Request('http://localhost/api/ai/execute', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          executionMode: 'platform',
          provider: 'comfly',
          modelId: 'gemini-3.1-pro-preview',
          messages: [{ role: 'user', content: 'hello' }],
        }),
      }),
    )

    expect(response.status).toBe(200)
    expect(freezeCredits).toHaveBeenCalledWith(
      expect.objectContaining({
        requestedCredits: 3,
      }),
    )
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: { result: 'deep answer' },
    })
  })
})
