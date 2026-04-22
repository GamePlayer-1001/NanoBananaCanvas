/**
 * [INPUT]: 依赖 vitest，依赖 route.ts，mock Stripe Webhook 验签与处理器
 * [OUTPUT]: 对外提供 Stripe Webhook 路由测试，覆盖成功路径、配置错误与无效签名
 * [POS]: api/webhooks/stripe 的集成测试，验证请求载荷到响应状态码的编排边界
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/billing/webhook', () => ({
  processStripeWebhookEvent: vi.fn(),
  verifyStripeWebhookSignature: vi.fn(),
}))

import { BillingError, ErrorCode } from '@/lib/errors'
import { processStripeWebhookEvent, verifyStripeWebhookSignature } from '@/lib/billing/webhook'

import { POST } from './route'

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should verify the signature and return processed webhook data', async () => {
    vi.mocked(verifyStripeWebhookSignature).mockResolvedValue({
      id: 'evt_123',
      type: 'customer.subscription.deleted',
    } as never)
    vi.mocked(processStripeWebhookEvent).mockResolvedValue({
      received: true,
      processed: true,
    })

    const response = await POST(
      new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': 't=123,v1=testsig',
        },
        body: JSON.stringify({ id: 'evt_123' }),
      }),
    )

    expect(verifyStripeWebhookSignature).toHaveBeenCalledWith(
      JSON.stringify({ id: 'evt_123' }),
      't=123,v1=testsig',
    )
    expect(processStripeWebhookEvent).toHaveBeenCalledWith({
      id: 'evt_123',
      type: 'customer.subscription.deleted',
    })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: {
        received: true,
        processed: true,
      },
    })
  })

  it('should map billing config errors to 400', async () => {
    vi.mocked(verifyStripeWebhookSignature).mockRejectedValue(
      new BillingError(ErrorCode.BILLING_CONFIG_INVALID, 'Missing Stripe-Signature header'),
    )

    const response = await POST(
      new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: '{}',
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: ErrorCode.BILLING_CONFIG_INVALID,
        message: 'Missing Stripe-Signature header',
      },
    })
    expect(processStripeWebhookEvent).not.toHaveBeenCalled()
  })

  it('should map non-app-errors to webhook invalid responses', async () => {
    vi.mocked(verifyStripeWebhookSignature).mockRejectedValue(new Error('Invalid Stripe signature'))

    const response = await POST(
      new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': 'bad-signature',
        },
        body: '{"invalid":true}',
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: 'WEBHOOK_INVALID',
        message: 'Invalid Stripe signature',
      },
    })
  })
})
