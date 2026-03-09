/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/rate-limit, @/lib/api/response, @/lib/db, @/lib/stripe
 * [OUTPUT]: 对外提供 POST /api/billing/cancel (取消订阅，保持到期)
 * [POS]: api/billing 的取消端点，设置 cancel_at_period_end
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { checkRateLimit, rateLimitResponse } from '@/lib/api/rate-limit'
import { apiError, apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { getStripe } from '@/lib/stripe'

/* ─── POST /api/billing/cancel ───────────────────────── */

export async function POST() {
  try {
    const { userId } = await requireAuth()

    // 限流: 5 req/min per user
    const rl = checkRateLimit(`billing:${userId}`, 5, 60_000)
    if (!rl.ok) return rateLimitResponse(rl.resetAt)

    const db = await getDb()
    const stripe = await getStripe()

    const sub = await db
      .prepare('SELECT stripe_subscription_id FROM subscriptions WHERE user_id = ?')
      .bind(userId)
      .first<{ stripe_subscription_id: string | null }>()

    if (!sub?.stripe_subscription_id) {
      return apiError('NOT_FOUND', 'No active subscription to cancel', 404)
    }

    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: true,
    })

    await db
      .prepare(
        `UPDATE subscriptions SET cancel_at_period_end = 1, updated_at = datetime('now')
         WHERE user_id = ?`,
      )
      .bind(userId)
      .run()

    return apiOk({ canceled: true })
  } catch (error) {
    return handleApiError(error)
  }
}
