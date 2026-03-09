/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db, @/lib/stripe
 * [OUTPUT]: 对外提供 POST /api/billing/portal (Stripe Customer Portal URL)
 * [POS]: api/billing 的自助管理入口，用户可在 Portal 中管理订阅/支付方式
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { apiError, apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { getStripe } from '@/lib/stripe'

/* ─── POST /api/billing/portal ───────────────────────── */

export async function POST() {
  try {
    const { userId } = await requireAuth()
    const db = await getDb()
    const stripe = await getStripe()

    const sub = await db
      .prepare('SELECT stripe_customer_id FROM subscriptions WHERE user_id = ?')
      .bind(userId)
      .first<{ stripe_customer_id: string | null }>()

    if (!sub?.stripe_customer_id) {
      return apiError('NOT_FOUND', 'No active subscription found', 404)
    }

    const { env } = await import('@opennextjs/cloudflare').then((m) => m.getCloudflareContext())
    const appUrl = (env as unknown as Record<string, string>).NEXT_PUBLIC_APP_URL ?? ''

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${appUrl}/billing`,
    })

    return apiOk({ url: session.url })
  } catch (error) {
    return handleApiError(error)
  }
}
