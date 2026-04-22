/**
 * [INPUT]: 依赖 @/lib/api/auth、@/lib/api/rate-limit、@/lib/api/response、@/lib/billing/subscription
 * [OUTPUT]: 对外提供 POST /api/billing/cancel，返回已标记 cancel_at_period_end 的订阅摘要
 * [POS]: api/billing 的取消入口，当前只处理 Stripe 自动月付订阅的到期取消
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuthenticatedAuth } from '@/lib/api/auth'
import { withRateLimit } from '@/lib/api/rate-limit'
import { apiOk, handleApiError } from '@/lib/api/response'
import { cancelBillingSubscription } from '@/lib/billing/subscription'

export async function POST(req: Request) {
  const blocked = await withRateLimit(req, 'billing-cancel', 3, 60_000)
  if (blocked) return blocked

  try {
    const { userId } = await requireAuthenticatedAuth()
    const result = await cancelBillingSubscription(userId)
    return apiOk(result)
  } catch (error) {
    return handleApiError(error)
  }
}
