/**
 * [INPUT]: 依赖 @/lib/api/auth、@/lib/api/response、@/lib/billing/credits
 * [OUTPUT]: 对外提供 GET /api/credits/usage，返回当前登录用户的 usage 聚合摘要
 * [POS]: api/credits 的使用统计入口，承接账单页用量图与模型维度消费分析
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuthenticatedAuth } from '@/lib/api/auth'
import { apiOk, handleApiError } from '@/lib/api/response'
import { getCreditUsage } from '@/lib/billing/credits'

export async function GET(req: Request) {
  try {
    const { userId } = await requireAuthenticatedAuth()
    const url = new URL(req.url)
    const windowDays = Number(url.searchParams.get('windowDays') ?? '30')
    const result = await getCreditUsage(userId, { windowDays })
    return apiOk(result)
  } catch (error) {
    return handleApiError(error)
  }
}
