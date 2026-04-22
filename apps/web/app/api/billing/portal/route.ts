/**
 * [INPUT]: 依赖 @/lib/api/auth、@/lib/api/rate-limit、@/lib/api/response、@/lib/billing/portal
 * [OUTPUT]: 对外提供 POST /api/billing/portal，返回 Stripe Customer Portal URL
 * [POS]: api/billing 的订阅管理入口，要求登录态并跳转到 Stripe Customer Portal
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuthenticatedAuth } from '@/lib/api/auth'
import { withRateLimit } from '@/lib/api/rate-limit'
import { apiOk, handleApiError } from '@/lib/api/response'
import { createPortalSession } from '@/lib/billing/portal'

export async function POST(req: Request) {
  const blocked = await withRateLimit(req, 'billing-portal', 10, 60_000)
  if (blocked) return blocked

  try {
    const { userId } = await requireAuthenticatedAuth()
    const result = await createPortalSession(userId)
    return apiOk(result, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
