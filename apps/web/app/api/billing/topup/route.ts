/**
 * [INPUT]: 依赖 @/lib/api/auth、@/lib/api/rate-limit、@/lib/api/response、@/lib/billing/checkout、
 *          @/lib/billing/config、@/lib/validations/billing
 * [OUTPUT]: 对外提供 POST /api/billing/topup，返回积分包 Stripe Checkout URL
 * [POS]: api/billing 的积分包充值入口，要求登录态并只接收 packageId/currency 业务语义
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuthenticatedAuth } from '@/lib/api/auth'
import { withRateLimit } from '@/lib/api/rate-limit'
import { apiOk, handleApiError, withBodyLimit } from '@/lib/api/response'
import { createCheckoutSession } from '@/lib/billing/checkout'
import { resolveBillingCurrency } from '@/lib/billing/config'
import { topupSchema } from '@/lib/validations/billing'

export async function POST(req: Request) {
  const tooLarge = withBodyLimit(req)
  if (tooLarge) return tooLarge

  const blocked = await withRateLimit(req, 'billing-topup', 5, 60_000)
  if (blocked) return blocked

  try {
    const { userId } = await requireAuthenticatedAuth()
    const body = await req.json()
    const params = topupSchema.parse(body)
    const preferredCurrency = resolveBillingCurrency({
      requestedCurrency: params.currency,
      countryCode: req.headers.get('cf-ipcountry'),
    })

    const result = await createCheckoutSession({
      userId,
      purchaseMode: 'credit_pack',
      packageId: params.packageId,
      preferredCurrency,
    })

    return apiOk(result, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
