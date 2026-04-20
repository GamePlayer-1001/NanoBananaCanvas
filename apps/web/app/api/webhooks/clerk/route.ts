/**
 * [INPUT]: 依赖 @clerk/nextjs/webhooks 的 verifyWebhook，依赖 @/lib/db 与 @/lib/env，
 *          依赖 @/lib/nanoid 生成本地用户 ID，依赖 @/lib/api/response 输出统一 JSON
 * [OUTPUT]: 对外提供 POST /api/webhooks/clerk (Clerk 用户镜像同步)
 * [POS]: api/webhooks 的 Clerk 入口，只处理 user.created / user.updated / user.deleted 三类最小同步事件
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { verifyWebhook } from '@clerk/nextjs/webhooks'
import type { NextRequest } from 'next/server'

import { apiError, apiOk } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { getEnv } from '@/lib/env'
import { nanoid } from '@/lib/nanoid'

const CLERK_IDENTITY_PREFIX = 'clerk:'
const CLERK_WEBHOOK_EVENTS = new Set([
  'user.created',
  'user.updated',
  'user.deleted',
])

type ClerkEmailAddress = {
  id?: string
  email_address?: string
}

type ClerkUserPayload = {
  id?: string
  username?: string | null
  first_name?: string | null
  last_name?: string | null
  image_url?: string | null
  primary_email_address_id?: string | null
  email_addresses?: ClerkEmailAddress[] | null
}

type DbUserRow = {
  id: string
}

function toIdentityKey(clerkUserId: string) {
  return `${CLERK_IDENTITY_PREFIX}${clerkUserId}`
}

function pickPrimaryEmail(payload: ClerkUserPayload) {
  const emailAddresses = payload.email_addresses ?? []
  const primaryEmail = emailAddresses.find(
    (item) => item.id === payload.primary_email_address_id,
  )

  return primaryEmail?.email_address ?? emailAddresses[0]?.email_address ?? ''
}

function pickDisplayName(payload: ClerkUserPayload) {
  const fullName = [payload.first_name, payload.last_name]
    .filter(Boolean)
    .join(' ')
    .trim()

  return fullName || payload.username || payload.first_name || payload.last_name || 'Member'
}

async function upsertClerkUser(payload: ClerkUserPayload) {
  if (!payload.id) {
    throw new Error('Missing Clerk user id in webhook payload')
  }

  const identityKey = toIdentityKey(payload.id)
  const email = pickPrimaryEmail(payload)
  const name = pickDisplayName(payload)
  const avatarUrl = payload.image_url ?? ''
  const db = await getDb()

  const existingUser = await db
    .prepare('SELECT id FROM users WHERE clerk_id = ?')
    .bind(identityKey)
    .first<DbUserRow>()

  if (existingUser) {
    await db
      .prepare(
        `UPDATE users
         SET email = ?, name = ?, avatar_url = ?, updated_at = datetime('now')
         WHERE clerk_id = ?`,
      )
      .bind(email, name, avatarUrl, identityKey)
      .run()

    return
  }

  await db
    .prepare(
      `INSERT INTO users (id, clerk_id, email, name, avatar_url, plan)
       VALUES (?, ?, ?, ?, ?, 'free')`,
    )
    .bind(nanoid(), identityKey, email, name, avatarUrl)
    .run()
}

async function deleteClerkUser(payload: ClerkUserPayload) {
  if (!payload.id) {
    throw new Error('Missing Clerk user id in webhook payload')
  }

  const db = await getDb()
  await db
    .prepare('DELETE FROM users WHERE clerk_id = ?')
    .bind(toIdentityKey(payload.id))
    .run()
}

export async function POST(req: NextRequest) {
  const signingSecret = await getEnv('CLERK_WEBHOOK_SECRET')

  if (!signingSecret) {
    return apiError('WEBHOOK_SECRET_MISSING', 'Missing Clerk webhook secret', 500)
  }

  let event: Awaited<ReturnType<typeof verifyWebhook>>

  try {
    event = await verifyWebhook(req, { signingSecret })
  } catch {
    return apiError('WEBHOOK_INVALID', 'Invalid Clerk webhook signature', 400)
  }

  if (!CLERK_WEBHOOK_EVENTS.has(event.type)) {
    return apiOk({ received: true, ignored: true })
  }

  try {
    const payload = event.data as ClerkUserPayload

    if (event.type === 'user.deleted') {
      await deleteClerkUser(payload)
      return apiOk({ received: true, type: event.type })
    }

    await upsertClerkUser(payload)
    return apiOk({ received: true, type: event.type })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sync Clerk webhook'
    return apiError('WEBHOOK_SYNC_FAILED', message, 500)
  }
}
