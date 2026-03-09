/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/rate-limit, @/lib/api/response, @/lib/db, @/lib/stripe, @/lib/validations/billing
 * [OUTPUT]: 对外提供 POST /api/billing/checkout (创建 Stripe Checkout Session)
 * [POS]: api/billing 的订阅购买入口，返回 Stripe Checkout URL
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api/auth'
import { checkRateLimit, rateLimitResponse } from '@/lib/api/rate-limit'
import { apiOk } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { getOrCreateCustomer, getStripe, getStripePriceId } from '@/lib/stripe'
import { checkoutSchema } from '@/lib/validations/billing'

/* ─── POST /api/billing/checkout ─────────────────────── */

export async function POST(req: Request) {
  // 临时调试: 逐步定位 500 根因
  const steps: string[] = []
  try {
    steps.push('1:auth')
    const { userId } = await requireAuth()
    steps.push(`2:auth-ok:${userId.slice(0, 8)}`)

    const rl = checkRateLimit(`billing:${userId}`, 5, 60_000)
    if (!rl.ok) return rateLimitResponse(rl.resetAt)

    steps.push('3:db')
    const db = await getDb()

    steps.push('4:parse')
    const body = await req.json()
    const { plan, billingPeriod, currency } = checkoutSchema.parse(body)
    steps.push(`5:parsed:${plan}/${billingPeriod}/${currency}`)

    steps.push('6:stripe-init')
    const stripe = await getStripe()

    steps.push('7:price-id')
    const priceId = await getStripePriceId(plan, billingPeriod, currency)
    steps.push(`8:price:${priceId?.slice(0, 10)}`)

    steps.push('9:user-email')
    const user = await db
      .prepare('SELECT email FROM users WHERE id = ?')
      .bind(userId)
      .first<{ email: string }>()
    steps.push(`10:email:${user?.email ? 'found' : 'empty'}`)

    steps.push('11:customer')
    const { customerId } = await getOrCreateCustomer(stripe, db, userId, user?.email ?? '')
    steps.push(`12:cust:${customerId?.slice(0, 10)}`)

    steps.push('13:app-url')
    const { env } = await import('@opennextjs/cloudflare').then((m) => m.getCloudflareContext())
    const appUrl = (env as unknown as Record<string, string>).NEXT_PUBLIC_APP_URL ?? ''
    steps.push(`14:url:${appUrl?.slice(0, 20)}`)

    steps.push('15:session')
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId, plan, billingPeriod, type: 'subscription' },
      success_url: `${appUrl}/billing?success=true`,
      cancel_url: `${appUrl}/billing?canceled=true`,
    })
    steps.push('16:done')

    return apiOk({ url: session.url })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    const errName = error instanceof Error ? error.name : 'unknown'
    return NextResponse.json(
      { ok: false, error: { code: 'DEBUG', message: errMsg, name: errName, steps } },
      { status: 500 },
    )
  }
}
