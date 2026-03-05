/**
 * [INPUT]: 依赖 @clerk/nextjs/server 的 auth，依赖 @/lib/db 的 getDb
 * [OUTPUT]: 对外提供 requireAuth() / optionalAuth()
 * [POS]: lib/api 的认证守卫，被所有需要登录的 API route handlers 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { auth } from '@clerk/nextjs/server'

import { getDb } from '@/lib/db'
import { AuthError } from '@/lib/errors'

/* ─── Types ──────────────────────────────────────────── */

export interface AuthUser {
  userId: string
  clerkId: string
}

/* ─── Guards ─────────────────────────────────────────── */

/** 必须登录。未登录或用户不存在抛 AuthError */
export async function requireAuth(): Promise<AuthUser> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    throw new AuthError('AUTH_UNAUTHORIZED', 'Authentication required')
  }

  const db = await getDb()
  const user = await db
    .prepare('SELECT id, clerk_id FROM users WHERE clerk_id = ?')
    .bind(clerkId)
    .first<{ id: string; clerk_id: string }>()

  if (!user) {
    throw new AuthError('AUTH_UNAUTHORIZED', 'User not found in database')
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
