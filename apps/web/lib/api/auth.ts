/**
 * [INPUT]: 依赖 @clerk/nextjs/server 的 auth + currentUser，依赖 @/lib/db，依赖 @/lib/nanoid
 * [OUTPUT]: 对外提供 requireAuth() / optionalAuth()
 * [POS]: lib/api 的认证守卫，被所有需要登录的 API route handlers 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { auth, currentUser } from '@clerk/nextjs/server'

import { getDb } from '@/lib/db'
import { AuthError } from '@/lib/errors'
import { createLogger } from '@/lib/logger'
import { nanoid } from '@/lib/nanoid'

const log = createLogger('auth')

/* ─── Types ──────────────────────────────────────────── */

export interface AuthUser {
  userId: string
  clerkId: string
}

/* ─── Guards ─────────────────────────────────────────── */

/** 必须登录。未登录抛 AuthError；用户不存在则自动创建 (SYNC-001) */
export async function requireAuth(): Promise<AuthUser> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    throw new AuthError('AUTH_UNAUTHORIZED', 'Authentication required')
  }

  const db = await getDb()
  let user = await db
    .prepare('SELECT id, clerk_id FROM users WHERE clerk_id = ?')
    .bind(clerkId)
    .first<{ id: string; clerk_id: string }>()

  // SYNC-001: Clerk 已验证身份但 D1 无记录 → 自动创建
  if (!user) {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      throw new AuthError('AUTH_UNAUTHORIZED', 'Clerk user not found')
    }

    const id = nanoid()
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? ''
    const name = clerkUser.fullName ?? clerkUser.firstName ?? ''
    const avatarUrl = clerkUser.imageUrl ?? ''

    await db
      .prepare(
        `INSERT OR IGNORE INTO users (id, clerk_id, email, name, avatar_url, plan)
         VALUES (?, ?, ?, ?, ?, 'free')`,
      )
      .bind(id, clerkId, email, name, avatarUrl)
      .run()

    user = await db
      .prepare('SELECT id, clerk_id FROM users WHERE clerk_id = ?')
      .bind(clerkId)
      .first<{ id: string; clerk_id: string }>()

    if (!user) {
      throw new AuthError('AUTH_UNAUTHORIZED', 'Failed to create user')
    }

    log.info('User auto-created via SYNC-001', { clerkId, userId: user.id })
  }

  return { userId: user.id, clerkId: user.clerk_id }
}

/** 可选登录。未登录返回 null，不抛错 */
export async function optionalAuth(): Promise<AuthUser | null> {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null

  const db = await getDb()
  const user = await db
    .prepare('SELECT id, clerk_id FROM users WHERE clerk_id = ?')
    .bind(clerkId)
    .first<{ id: string; clerk_id: string }>()

  return user ? { userId: user.id, clerkId: user.clerk_id } : null
}
