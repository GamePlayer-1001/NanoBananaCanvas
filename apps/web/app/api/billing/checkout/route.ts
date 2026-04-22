/**
 * [INPUT]: 依赖 @/lib/api/auth、@/lib/api/rate-limit、@/lib/api/response、@/lib/billing/config、
 *          @/lib/billing/checkout、@/lib/validations/billing
 * [OUTPUT]: 对外提供 POST /api/billing/checkout，返回 Stripe Checkout URL
 * [POS]: api/billing 的套餐结账入口，先打通登录用户的 auto_monthly 套餐购买闭环
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuthenticatedAuth } from '@/lib/api/auth'
import { withRateLimit } from '@/lib/api/rate-limit'
import { apiOk, handleApiError, withBodyLimit } from '@/lib/api/response'
import { createCheckoutSession } from '@/lib/billing/checkout'
import { resolveBillingCurrency } from '@/lib/billing/config'
import { checkoutSchema } from '@/lib/validations/billing'

export async function POST(req: Request) {
  const tooLarge = withBodyLimit(req)
  if (tooLarge) return tooLarge

  const blocked = await withRateLimit(req, 'billing-checkout', 5, 60_000)
  if (blocked) return blocked

  try {
    const { userId } = await requireAuthenticatedAuth()
    const body = await req.json()
    const params = checkoutSchema.parse(body)
    const preferredCurrency = resolveBillingCurrency({
      requestedCurrency: params.currency,
      countryCode: req.headers.get('cf-ipcountry'),
    })

    const result = await createCheckoutSession({
      userId,
      plan: params.plan,
      purchaseMode: params.purchaseMode,
      preferredCurrency,
    })

    return apiOk(result, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
