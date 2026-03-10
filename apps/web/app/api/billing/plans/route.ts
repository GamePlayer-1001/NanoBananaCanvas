/**
 * [INPUT]: 依赖 @/lib/stripe 的 getStripe/STRIPE_PRODUCT_ID/getPrices，依赖 @/lib/api/response
 * [OUTPUT]: 对外提供 GET /api/billing/plans (从 Stripe 动态拉取产品全部定价)
 * [POS]: api/billing 的定价数据源，被前端 usePlans hook 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { apiOk, handleApiError } from '@/lib/api/response'
import { getStripe, getPrices, STRIPE_PRODUCT_ID } from '@/lib/stripe'

/* ─── Interval Mapping ─────────────────────────────────── */

const INTERVAL_MAP: Record<string, string> = {
  week: 'weekly',
  month: 'monthly',
  year: 'yearly',
}

/* ─── GET /api/billing/plans ─────────────────────────── */

export async function GET() {
  try {
    const stripe = await getStripe()

    const [product, prices] = await Promise.all([
      stripe.products.retrieve(STRIPE_PRODUCT_ID),
      getPrices(STRIPE_PRODUCT_ID),
    ])

    const plans = prices
      .filter((p) => p.recurring)
      .map((p) => ({
        priceId: p.id,
        interval: INTERVAL_MAP[p.recurring!.interval] ?? p.recurring!.interval,
        unitAmount: p.unit_amount ?? 0,
        currency: p.currency,
      }))
      .sort((a, b) => a.unitAmount - b.unitAmount)

    return apiOk({
      productName: product.name,
      plans,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
