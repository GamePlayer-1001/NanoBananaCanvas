/**
 * [INPUT]: 依赖 svix 的 Webhook，依赖 @/lib/db，依赖 @/lib/nanoid
 * [OUTPUT]: 对外提供 POST /api/webhooks/clerk (Clerk Webhook 事件处理)
 * [POS]: api/webhooks 的 Clerk 端点，处理 user.created/updated/deleted
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Webhook } from 'svix'

import { getDb } from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { nanoid } from '@/lib/nanoid'

const log = createLogger('webhook:clerk')

/* ─── Types ──────────────────────────────────────────── */

interface ClerkWebhookEvent {
  type: string
  data: {
    id: string
    email_addresses?: Array<{ email_address: string }>
    first_name?: string | null
    last_name?: string | null
    image_url?: string | null
  }
}

/* ─── POST /api/webhooks/clerk ───────────────────────── */

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) {
    log.error('CLERK_WEBHOOK_SECRET not configured')
    return new Response('Webhook secret not configured', { status: 500 })
  }

  // 验证 svix 签名
  const svixId = req.headers.get('svix-id')
  const svixTimestamp = req.headers.get('svix-timestamp')
  const svixSignature = req.headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  const body = await req.text()
  const wh = new Webhook(WEBHOOK_SECRET)

  let event: ClerkWebhookEvent
  try {
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEvent
  } catch {
    log.error('Invalid webhook signature')
    return new Response('Invalid signature', { status: 400 })
  }

  const db = await getDb()

  switch (event.type) {
    case 'user.created': {
      const { id: clerkId, email_addresses, first_name, last_name, image_url } = event.data
      const email = email_addresses?.[0]?.email_address ?? ''
      const name = [first_name, last_name].filter(Boolean).join(' ')

      await db
        .prepare(
          `INSERT OR IGNORE INTO users (id, clerk_id, email, name, avatar_url)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .bind(nanoid(), clerkId, email, name, image_url ?? '')
        .run()

      log.info('User created via webhook', { clerkId })
      break
    }

    case 'user.updated': {
      const { id: clerkId, email_addresses, first_name, last_name, image_url } = event.data
      const email = email_addresses?.[0]?.email_address ?? ''
      const name = [first_name, last_name].filter(Boolean).join(' ')

      await db
        .prepare(
          `UPDATE users SET email = ?, name = ?, avatar_url = ?, updated_at = datetime('now')
           WHERE clerk_id = ?`,
        )
        .bind(email, name, image_url ?? '', clerkId)
        .run()

      log.info('User updated via webhook', { clerkId })
      break
    }

    case 'user.deleted': {
      const { id: clerkId } = event.data
      await db.prepare('DELETE FROM users WHERE clerk_id = ?').bind(clerkId).run()
      log.info('User deleted via webhook', { clerkId })
      break
    }

    default:
      log.info('Unhandled webhook event', { type: event.type })
  }

  return new Response('ok', { status: 200 })
}
