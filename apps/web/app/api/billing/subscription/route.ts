/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db
 * [OUTPUT]: 对外提供 GET /api/billing/subscription (当前订阅信息)
 * [POS]: api/billing 的订阅查询端点
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'

/* ─── GET /api/billing/subscription ──────────────────── */

export async function GET() {
  try {
    const { userId } = await requireAuth()
    const db = await getDb()

    const sub = await db
      .prepare(
        `SELECT plan, billing_period, status, current_period_start, current_period_end,
                monthly_credits, cancel_at_period_end, created_at, updated_at
         FROM subscriptions WHERE user_id = ?`,
      )
      .bind(userId)
      .first()

    if (!sub) {
      return apiOk({
        plan: 'free',
        billingPeriod: 'monthly',
        status: 'active',
        currentPeriodStart: null,
        currentPeriodEnd: null,
        monthlyCredits: 200,
        cancelAtPeriodEnd: false,
      })
    }

    return apiOk({
      plan: sub.plan,
      billingPeriod: sub.billing_period,
      status: sub.status,
      currentPeriodStart: sub.current_period_start,
      currentPeriodEnd: sub.current_period_end,
      monthlyCredits: sub.monthly_credits,
      cancelAtPeriodEnd: !!sub.cancel_at_period_end,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
