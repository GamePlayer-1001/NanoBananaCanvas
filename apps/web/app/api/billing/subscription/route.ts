/**
 * [INPUT]: 依赖 @/lib/api/auth、@/lib/api/response、@/lib/billing/subscription
 * [OUTPUT]: 对外提供 GET /api/billing/subscription，返回当前登录用户的订阅镜像摘要
 * [POS]: api/billing 的订阅摘要入口，承接账户页与未来 /billing 页的账单读取
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuthenticatedAuth } from '@/lib/api/auth'
import { apiOk, handleApiError } from '@/lib/api/response'
import { getBillingSubscription } from '@/lib/billing/subscription'

export async function GET() {
  try {
    const { userId } = await requireAuthenticatedAuth()
    const result = await getBillingSubscription(userId)
    return apiOk(result)
  } catch (error) {
    return handleApiError(error)
  }
}
