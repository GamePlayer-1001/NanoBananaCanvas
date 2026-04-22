/**
 * [INPUT]: 依赖 @/lib/api/auth、@/lib/api/response、@/lib/billing/credits
 * [OUTPUT]: 对外提供 GET /api/credits/balance，返回当前登录用户的积分余额摘要
 * [POS]: api/credits 的余额入口，承接账户资产展示与后续 /billing 页面读取
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuthenticatedAuth } from '@/lib/api/auth'
import { apiOk, handleApiError } from '@/lib/api/response'
import { getCreditBalanceSummary } from '@/lib/billing/credits'

export async function GET() {
  try {
    const { userId } = await requireAuthenticatedAuth()
    const result = await getCreditBalanceSummary(userId)
    return apiOk(result)
  } catch (error) {
    return handleApiError(error)
  }
}
