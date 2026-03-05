/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/credits, @/lib/db
 * [OUTPUT]: 对外提供 GET /api/credits/balance (积分余额 + 订阅信息)
 * [POS]: api/credits 的余额端点，返回三池余额 + 当前套餐
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { apiOk, handleApiError } from '@/lib/api/response'
import { getBalance } from '@/lib/credits'
import { getDb } from '@/lib/db'

/* ─── GET /api/credits/balance ───────────────────────── */

export async function GET() {
  try {
    const { userId } = await requireAuth()
    const db = await getDb()

    const balance = await getBalance(db, userId)

    // 查订阅信息
    const sub = await db
      .prepare('SELECT plan, status, monthly_credits, current_period_end FROM subscriptions WHERE user_id = ?')
      .bind(userId)
      .first<{ plan: string; status: string; monthly_credits: number; current_period_end: string | null }>()

    return apiOk({
      monthlyBalance: balance.monthlyBalance,
      permanentBalance: balance.permanentBalance,
      available: balance.monthlyBalance + balance.permanentBalance,
      frozen: balance.frozen,
      totalEarned: balance.totalEarned,
      totalSpent: balance.totalSpent,
      plan: sub?.plan ?? 'free',
      subscriptionStatus: sub?.status ?? 'active',
      currentPeriodEnd: sub?.current_period_end ?? null,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
