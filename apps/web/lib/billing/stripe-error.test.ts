/**
 * [INPUT]: 依赖 vitest，依赖 ./stripe-error、@/lib/errors
 * [OUTPUT]: 对外提供 Stripe 错误映射测试，覆盖支付拒绝、限流、配置拒绝、网络异常与通用异常
 * [POS]: lib/billing 的 Stripe 异常适配测试，确保 Checkout/Portal/Cancel 失败语义稳定
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { describe, expect, it } from 'vitest'

import { BillingError, ErrorCode } from '@/lib/errors'

import { mapStripeError, withStripeErrorMapping } from './stripe-error'

describe('stripe error mapping', () => {
  it('should map card errors to payment declined', () => {
    const error = mapStripeError(
      {
        type: 'StripeCardError',
        code: 'card_declined',
        message: 'Your card was declined.',
        requestId: 'req_card',
      },
      'creating checkout session',
    )

    expect(error).toBeInstanceOf(BillingError)
    expect(error).toMatchObject({
      code: ErrorCode.BILLING_PAYMENT_DECLINED,
      message: 'Your card was declined.',
      meta: expect.objectContaining({
        action: 'creating checkout session',
        stripeType: 'StripeCardError',
        stripeCode: 'card_declined',
        stripeRequestId: 'req_card',
      }),
    })
  })

  it('should map rate limit errors to billing rate limited', () => {
    const error = mapStripeError(
      {
        type: 'StripeRateLimitError',
        code: 'rate_limit',
      },
      'opening billing portal',
    )

    expect(error.code).toBe(ErrorCode.BILLING_RATE_LIMITED)
    expect(error.message).toContain('opening billing portal')
  })

  it('should map authentication errors to billing config invalid', () => {
    const error = mapStripeError(
      {
        type: 'StripeAuthenticationError',
        message: 'Invalid API Key provided.',
      },
      'creating stripe customer',
    )

    expect(error.code).toBe(ErrorCode.BILLING_CONFIG_INVALID)
    expect(error.message).toBe('Invalid API Key provided.')
  })

  it('should map connection errors to billing network error', () => {
    const error = mapStripeError(
      {
        type: 'StripeConnectionError',
      },
      'canceling subscription',
    )

    expect(error.code).toBe(ErrorCode.BILLING_NETWORK_ERROR)
    expect(error.message).toContain('canceling subscription')
  })

  it('should keep billing errors unchanged', () => {
    const original = new BillingError(
      ErrorCode.BILLING_PRICE_NOT_CONFIGURED,
      'Missing Stripe price',
    )

    expect(mapStripeError(original, 'creating checkout session')).toBe(original)
  })

  it('should wrap unexpected errors through helper as provider error', async () => {
    await expect(
      withStripeErrorMapping('creating checkout session', async () => {
        throw new Error('boom')
      }),
    ).rejects.toMatchObject({
      code: ErrorCode.BILLING_PROVIDER_ERROR,
      message: 'Stripe billing request failed while creating checkout session',
    })
  })
})
