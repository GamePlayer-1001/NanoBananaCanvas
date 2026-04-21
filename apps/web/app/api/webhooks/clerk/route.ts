/**
 * [INPUT]: 依赖 @clerk/nextjs/webhooks 的 verifyWebhook，依赖 @/lib/db 与 @/lib/env，
 *          依赖 @/lib/auth/user-store，依赖 @/lib/api/response 输出统一 JSON
 * [OUTPUT]: 对外提供 POST /api/webhooks/clerk (Clerk 用户镜像同步)
 * [POS]: api/webhooks 的 Clerk 入口，只处理 user.created / user.updated / user.deleted 三类最小同步事件
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { verifyWebhook } from '@clerk/nextjs/webhooks'
import type { NextRequest } from 'next/server'

import { apiError, apiOk } from '@/lib/api/response'
import {
  findUserByIdentityKey,
  insertUserByIdentityKey,
  updateUserProfileByIdentityKey,
} from '@/lib/auth/user-store'
import { getDb } from '@/lib/db'
import { getEnv } from '@/lib/env'

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

function pickAccountProfile(payload: ClerkUserPayload) {
  return {
    username: payload.username ?? '',
    firstName: payload.first_name ?? '',
    lastName: payload.last_name ?? '',
    name: pickDisplayName(payload),
    avatarUrl: payload.image_url ?? '',
  }
}

async function upsertClerkUser(payload: ClerkUserPayload) {
  if (!payload.id) {
    throw new Error('Missing Clerk user id in webhook payload')
  }

  const identityKey = toIdentityKey(payload.id)
  const profile = {
    email: pickPrimaryEmail(payload),
    ...pickAccountProfile(payload),
  }
  const existingUser = await findUserByIdentityKey(identityKey)

  if (existingUser) {
    await updateUserProfileByIdentityKey(identityKey, profile)
    return
  }

  await insertUserByIdentityKey(identityKey, profile)
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
