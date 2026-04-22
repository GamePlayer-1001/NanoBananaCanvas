/**
 * [INPUT]: 依赖 @/lib/api/response，依赖 @/lib/billing/pricing
 * [OUTPUT]: 对外提供 GET /api/pricing/plans，返回公开套餐价格目录
 * [POS]: api/pricing 的公开数据入口，给匿名/登录态 UI 提供动态 Stripe 套餐价格
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { apiOk, handleApiError } from '@/lib/api/response'
import { getPublicPricingPlans } from '@/lib/billing/pricing'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const requestedCurrency = url.searchParams.get('currency')
    const result = await getPublicPricingPlans({
      requestedCurrency,
      countryCode: req.headers.get('cf-ipcountry'),
    })

    return apiOk(result)
  } catch (error) {
    return handleApiError(error)
  }
}
