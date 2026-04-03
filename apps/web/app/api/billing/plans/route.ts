/**
 * [INPUT]: 依赖 @nano-banana/shared/constants 的 PLANS/PRO_PRICING，
 *          依赖 @/lib/env 的 getEnv，
 *          依赖 @/lib/stripe 的 getStripe/STRIPE_PRODUCT_ID/getPrices，
 *          依赖 @/lib/api/response
 * [OUTPUT]: 对外提供 GET /api/billing/plans (优先 Stripe 动态拉取，缺本地密钥时回退静态套餐)
 * [POS]: api/billing 的定价数据源，被前端 usePlans hook 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { PLANS, PRO_PRICING } from '@nano-banana/shared/constants'
import { apiOk, handleApiError } from '@/lib/api/response'
import { getEnv } from '@/lib/env'
import { getStripe, getPrices, STRIPE_PRODUCT_ID } from '@/lib/stripe'

/* ─── Interval Mapping ─────────────────────────────────── */

const INTERVAL_MAP: Record<string, string> = {
  week: 'weekly',
  month: 'monthly',
  year: 'yearly',
}

const FALLBACK_PLANS = [
  { interval: 'weekly', unitAmount: PRO_PRICING.weekly, currency: 'usd' },
  { interval: 'monthly', unitAmount: PRO_PRICING.monthly, currency: 'usd' },
  { interval: 'yearly', unitAmount: PRO_PRICING.yearly, currency: 'usd' },
]

/* ─── GET /api/billing/plans ─────────────────────────── */

export async function GET() {
  try {
    const stripeKey = await getEnv('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      return apiOk({
        productName: PLANS.pro.name,
        plans: FALLBACK_PLANS.map((plan) => ({
          priceId: `fallback_${plan.interval}`,
          ...plan,
        })),
      })
    }

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
