/**
 * [INPUT]: 依赖 @/lib/errors，消费 Stripe SDK 风格错误对象
 * [OUTPUT]: 对外提供 mapStripeError() 与 withStripeErrorMapping()
 * [POS]: lib/billing 的 Stripe 异常适配层，把 Stripe 原生错误统一映射成本地 BillingError
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { BillingError, ErrorCode } from '@/lib/errors'

type StripeLikeError = {
  type?: string
  code?: string
  message?: string
  statusCode?: number
  requestId?: string
  decline_code?: string
  payment_intent?: string | null
}

function isStripeLikeError(error: unknown): error is StripeLikeError {
  if (!error || typeof error !== 'object') {
    return false
  }

  return 'type' in error || 'code' in error || 'requestId' in error || 'statusCode' in error
}

function buildMeta(action: string, error: StripeLikeError): Record<string, unknown> {
  return {
    action,
    stripeType: error.type ?? null,
    stripeCode: error.code ?? null,
    stripeStatusCode: error.statusCode ?? null,
    stripeRequestId: error.requestId ?? null,
    stripeDeclineCode: error.decline_code ?? null,
    stripePaymentIntent: error.payment_intent ?? null,
  }
}

export function mapStripeError(error: unknown, action: string): BillingError {
  if (error instanceof BillingError) {
    return error
  }

  if (!isStripeLikeError(error)) {
    return new BillingError(
      ErrorCode.BILLING_PROVIDER_ERROR,
      `Stripe billing request failed while ${action}`,
      { action },
    )
  }

  const message = error.message?.trim()
  const meta = buildMeta(action, error)

  if (error.type === 'StripeCardError') {
    return new BillingError(
      ErrorCode.BILLING_PAYMENT_DECLINED,
      message || `Payment was declined while ${action}`,
      meta,
    )
  }

  if (error.type === 'StripeRateLimitError') {
    return new BillingError(
      ErrorCode.BILLING_RATE_LIMITED,
      message || `Stripe rate limit hit while ${action}`,
      meta,
    )
  }

  if (error.type === 'StripeAuthenticationError' || error.type === 'StripePermissionError') {
    return new BillingError(
      ErrorCode.BILLING_CONFIG_INVALID,
      message || `Stripe configuration was rejected while ${action}`,
      meta,
    )
  }

  if (error.type === 'StripeConnectionError') {
    return new BillingError(
      ErrorCode.BILLING_NETWORK_ERROR,
      message || `Stripe network request failed while ${action}`,
      meta,
    )
  }

  return new BillingError(
    ErrorCode.BILLING_PROVIDER_ERROR,
    message || `Stripe billing request failed while ${action}`,
    meta,
  )
}

export async function withStripeErrorMapping<T>(
  action: string,
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    throw mapStripeError(error, action)
  }
}
