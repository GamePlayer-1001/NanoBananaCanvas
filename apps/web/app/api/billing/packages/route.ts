/**
 * [INPUT]: 依赖 @/lib/api/response，依赖 @/lib/billing/pricing
 * [OUTPUT]: 对外提供 GET /api/billing/packages，返回公开积分包价格目录
 * [POS]: api/billing 的积分包目录入口，给本地账单页与未来 topup 界面提供动态价格真相源
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { apiOk, handleApiError } from '@/lib/api/response'
import { getPublicBillingPackages } from '@/lib/billing/pricing'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const requestedCurrency = url.searchParams.get('currency')
    const result = await getPublicBillingPackages({
      requestedCurrency,
      countryCode: req.headers.get('cf-ipcountry'),
    })

    return apiOk(result)
  } catch (error) {
    return handleApiError(error)
  }
}
