/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/rate-limit, @/lib/api/response, @/lib/db, @/lib/stripe, @/lib/validations/billing
 * [OUTPUT]: 对外提供 POST /api/billing/checkout (创建 Stripe Checkout Session)
 * [POS]: api/billing 的订阅购买入口，返回 Stripe Checkout URL
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { checkRateLimit, rateLimitResponse } from '@/lib/api/rate-limit'
import { apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { getOrCreateCustomer, getStripe, getStripePriceId } from '@/lib/stripe'
import { checkoutSchema } from '@/lib/validations/billing'

/* ─── POST /api/billing/checkout ─────────────────────── */

export async function POST(req: Request) {
  try {
    const { userId } = await requireAuth()

    // 限流: 5 req/min per user
    const rl = checkRateLimit(`billing:${userId}`, 5, 60_000)
    if (!rl.ok) return rateLimitResponse(rl.resetAt)

    const db = await getDb()
    const body = await req.json()
    const { plan, billingPeriod, currency } = checkoutSchema.parse(body)

    const stripe = getStripe()
    const priceId = getStripePriceId(plan, billingPeriod, currency)

    // 获取用户邮箱
    const user = await db
      .prepare('SELECT email FROM users WHERE id = ?')
      .bind(userId)
      .first<{ email: string }>()

    const { customerId } = await getOrCreateCustomer(stripe, db, userId, user?.email ?? '')

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId, plan, billingPeriod, type: 'subscription' },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/billing?canceled=true`,
    })

    return apiOk({ url: session.url })
  } catch (error) {
    return handleApiError(error)
  }
}
