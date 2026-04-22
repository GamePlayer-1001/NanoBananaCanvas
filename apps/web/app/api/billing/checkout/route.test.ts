/**
 * [INPUT]: 依赖 vitest，依赖 route.ts，mock 认证/限流/计费服务
 * [OUTPUT]: 对外提供 Checkout API 路由测试，覆盖限流阻断、套餐结账与积分包分流
 * [POS]: api/billing/checkout 的集成测试，验证请求体到服务层调用的编排边界
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api/auth', () => ({
  requireAuthenticatedAuth: vi.fn(),
}))

vi.mock('@/lib/api/rate-limit', () => ({
  withRateLimit: vi.fn(),
}))

vi.mock('@/lib/billing/checkout', () => ({
  createCheckoutSession: vi.fn(),
}))

vi.mock('@/lib/billing/config', async () => {
  const actual = await vi.importActual<typeof import('@/lib/billing/config')>('@/lib/billing/config')
  return {
    ...actual,
    resolveBillingCurrency: vi.fn(),
  }
})

import { requireAuthenticatedAuth } from '@/lib/api/auth'
import { withRateLimit } from '@/lib/api/rate-limit'
import { createCheckoutSession } from '@/lib/billing/checkout'
import { resolveBillingCurrency } from '@/lib/billing/config'
import { BillingError, ErrorCode } from '@/lib/errors'

import { POST } from './route'

describe('POST /api/billing/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(withRateLimit).mockResolvedValue(null)
    vi.mocked(requireAuthenticatedAuth).mockResolvedValue({ userId: 'user_123' } as never)
    vi.mocked(resolveBillingCurrency).mockReturnValue('usd')
  })

  it('should return the rate-limit response without calling checkout services', async () => {
    const blocked = new Response(JSON.stringify({ ok: false }), { status: 429 })
    vi.mocked(withRateLimit).mockResolvedValue(blocked)

    const response = await POST(
      new Request('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          purchaseMode: 'plan_auto_monthly',
          plan: 'pro',
        }),
      }),
    )

    expect(response.status).toBe(429)
    expect(requireAuthenticatedAuth).not.toHaveBeenCalled()
    expect(createCheckoutSession).not.toHaveBeenCalled()
  })

  it('should create a recurring plan checkout session for authenticated users', async () => {
    vi.mocked(createCheckoutSession).mockResolvedValue({
      checkoutUrl: 'https://checkout.stripe.test/session_123',
      sessionId: 'cs_test_123',
      preferredCurrency: 'usd',
      plan: 'pro',
      purchaseMode: 'plan_auto_monthly',
    })

    const response = await POST(
      new Request('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'cf-ipcountry': 'US',
        },
        body: JSON.stringify({
          purchaseMode: 'plan_auto_monthly',
          plan: 'pro',
        }),
      }),
    )

    expect(withRateLimit).toHaveBeenCalledWith(expect.any(Request), 'billing-checkout', 5, 60_000)
    expect(resolveBillingCurrency).toHaveBeenCalledWith({
      requestedCurrency: undefined,
      countryCode: 'US',
    })
    expect(createCheckoutSession).toHaveBeenCalledWith({
      userId: 'user_123',
      purchaseMode: 'plan_auto_monthly',
      plan: 'pro',
      preferredCurrency: 'usd',
    })
    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: {
        sessionId: 'cs_test_123',
        plan: 'pro',
        purchaseMode: 'plan_auto_monthly',
      },
    })
  })

  it('should route credit pack requests to the credit-pack checkout branch', async () => {
    vi.mocked(resolveBillingCurrency).mockReturnValue('eur')
    vi.mocked(createCheckoutSession).mockResolvedValue({
      checkoutUrl: 'https://checkout.stripe.test/session_pack_1200',
      sessionId: 'cs_test_pack_1200',
      preferredCurrency: 'eur',
      packageId: '1200',
      purchaseMode: 'credit_pack',
    })

    const response = await POST(
      new Request('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'cf-ipcountry': 'DE',
        },
        body: JSON.stringify({
          purchaseMode: 'credit_pack',
          packageId: '1200',
        }),
      }),
    )

    expect(createCheckoutSession).toHaveBeenCalledWith({
      userId: 'user_123',
      purchaseMode: 'credit_pack',
      packageId: '1200',
      preferredCurrency: 'eur',
    })
    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: {
        packageId: '1200',
        purchaseMode: 'credit_pack',
      },
    })
  })

  it('should map billing errors through handleApiError', async () => {
    vi.mocked(createCheckoutSession).mockRejectedValue(
      new BillingError(ErrorCode.BILLING_PRICE_NOT_CONFIGURED, 'Missing Stripe price'),
    )

    const response = await POST(
      new Request('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          purchaseMode: 'plan_one_time',
          plan: 'standard',
        }),
      }),
    )

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: ErrorCode.BILLING_PRICE_NOT_CONFIGURED,
        message: 'Missing Stripe price',
      },
    })
  })
})
