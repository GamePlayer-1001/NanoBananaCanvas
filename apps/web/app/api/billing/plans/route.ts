/**
 * [INPUT]: 依赖 @/lib/stripe 的 getStripe/STRIPE_PRODUCT_ID/getMonthlyPrice，依赖 @/lib/api/response
 * [OUTPUT]: 对外提供 GET /api/billing/plans (从 Stripe 动态拉取产品定价)
 * [POS]: api/billing 的定价数据源，被前端 usePlans hook 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { apiOk, handleApiError } from '@/lib/api/response'
import { getStripe, getMonthlyPrice, STRIPE_PRODUCT_ID } from '@/lib/stripe'

/* ─── GET /api/billing/plans ─────────────────────────── */

export async function GET() {
  try {
    const stripe = await getStripe()

    const [product, price] = await Promise.all([
      stripe.products.retrieve(STRIPE_PRODUCT_ID),
      getMonthlyPrice(STRIPE_PRODUCT_ID),
    ])

    return apiOk({
      plan: {
        id: 'pro',
        name: product.name,
        priceId: price.id,
        unitAmount: price.unit_amount ?? 0,
        currency: price.currency,
        interval: price.recurring?.interval ?? 'month',
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
