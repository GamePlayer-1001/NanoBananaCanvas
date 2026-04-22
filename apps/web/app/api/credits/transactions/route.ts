/**
 * [INPUT]: 依赖 @/lib/api/auth、@/lib/api/response、@/lib/billing/credits
 * [OUTPUT]: 对外提供 GET /api/credits/transactions，返回当前登录用户的积分流水分页结果
 * [POS]: api/credits 的交易流水入口，承接账单页与后续支付历史可视化
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuthenticatedAuth } from '@/lib/api/auth'
import { apiOk, handleApiError } from '@/lib/api/response'
import { getCreditTransactions } from '@/lib/billing/credits'

export async function GET(req: Request) {
  try {
    const { userId } = await requireAuthenticatedAuth()
    const url = new URL(req.url)
    const page = Number(url.searchParams.get('page') ?? '1')
    const pageSize = Number(url.searchParams.get('pageSize') ?? '20')
    const result = await getCreditTransactions(userId, { page, pageSize })
    return apiOk(result)
  } catch (error) {
    return handleApiError(error)
  }
}
