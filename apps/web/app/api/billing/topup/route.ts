/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/rate-limit, @/lib/api/response, @/lib/db, @/lib/stripe, @/lib/validations/credits
 * [OUTPUT]: 对外提供 POST /api/billing/topup (积分包购买 Checkout)
 * [POS]: api/billing 的一次性积分购买入口，创建 Stripe payment Checkout
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { checkRateLimit, rateLimitResponse } from '@/lib/api/rate-limit'
import { apiError, apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { getOrCreateCustomer, getStripe } from '@/lib/stripe'
import { topupSchema } from '@/lib/validations/credits'

/* ─── POST /api/billing/topup ────────────────────────── */

export async function POST(req: Request) {
  try {
    const { userId } = await requireAuth()

    // 限流: 5 req/min per user
    const rl = checkRateLimit(`billing:${userId}`, 5, 60_000)
    if (!rl.ok) return rateLimitResponse(rl.resetAt)

    const db = await getDb()
    const body = await req.json()
    const { packageId } = topupSchema.parse(body)

    // 查询积分包 (多货币由 Stripe Price 自动处理)
    const pkg = await db
      .prepare(
        'SELECT id, name, credits, price_cents, bonus_credits, stripe_price_id FROM credit_packages WHERE id = ? AND is_active = 1',
      )
      .bind(packageId)
      .first<{
        id: string
        name: string
        credits: number
        price_cents: number
        bonus_credits: number
        stripe_price_id: string | null
      }>()

    if (!pkg) {
      return apiError('NOT_FOUND', 'Credit package not found', 404)
    }

    if (!pkg.stripe_price_id) {
      return apiError('VALIDATION_FAILED', 'Package not configured for purchase', 400)
    }

    const stripe = await getStripe()

    // 获取用户邮箱
    const user = await db
      .prepare('SELECT email FROM users WHERE id = ?')
      .bind(userId)
      .first<{ email: string }>()

    const { customerId } = await getOrCreateCustomer(stripe, db, userId, user?.email ?? '')

    const { env } = await import('@opennextjs/cloudflare').then((m) => m.getCloudflareContext())
    const appUrl = (env as unknown as Record<string, string>).NEXT_PUBLIC_APP_URL ?? ''

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [{ price: pkg.stripe_price_id, quantity: 1 }],
      metadata: {
        userId,
        type: 'topup',
        packageId: pkg.id,
        credits: String(pkg.credits + pkg.bonus_credits),
      },
      success_url: `${appUrl}/billing?topup=success`,
      cancel_url: `${appUrl}/billing?topup=canceled`,
    })

    return apiOk({ url: session.url })
  } catch (error) {
    return handleApiError(error)
  }
}
