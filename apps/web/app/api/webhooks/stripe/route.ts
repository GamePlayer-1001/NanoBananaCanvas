/**
 * [INPUT]: 依赖 @/lib/api/response，依赖 @/lib/billing/webhook
 * [OUTPUT]: 对外提供 POST /api/webhooks/stripe，校验签名并同步 Stripe 事件到本地账本
 * [POS]: api/webhooks 的 Stripe 入口，负责最小账单闭环的验签、幂等与状态镜像
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { apiError, apiOk } from '@/lib/api/response'
import { isAppError } from '@/lib/errors'
import { processStripeWebhookEvent, verifyStripeWebhookSignature } from '@/lib/billing/webhook'

export async function POST(req: Request) {
  const payload = await req.text()
  const signature = req.headers.get('stripe-signature')

  try {
    const event = await verifyStripeWebhookSignature(payload, signature)
    const result = await processStripeWebhookEvent(event)
    return apiOk(result)
  } catch (error) {
    if (isAppError(error)) {
      return apiError(error.code, error.message, error.code === 'BILLING_CONFIG_INVALID' ? 400 : 500)
    }

    const message = error instanceof Error ? error.message : 'Failed to process Stripe webhook'
    return apiError('WEBHOOK_INVALID', message, 400)
  }
}
