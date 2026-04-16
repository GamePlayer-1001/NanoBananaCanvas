/**
 * [INPUT]: 依赖 next/headers 的 cookies，依赖 @/lib/db，依赖 @/lib/nanoid
 * [OUTPUT]: 对外提供 requireAuth() / optionalAuth()
 * [POS]: lib/api 的匿名访客守卫，被所有需要用户上下文的 API route handlers 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { cookies } from 'next/headers'

import { getDb } from '@/lib/db'
import { nanoid } from '@/lib/nanoid'

const ANON_COOKIE_NAME = 'nb_guest_id'
const ANON_COOKIE_MAX_AGE = 60 * 60 * 24 * 365
const ANON_CLERK_PREFIX = 'anon:'

/* ─── Types ──────────────────────────────────────────── */

export interface AuthUser {
  userId: string
  clerkId: string
}

/* ─── Guards ─────────────────────────────────────────── */

async function getOrCreateAnonymousUser(): Promise<AuthUser> {
  const cookieStore = await cookies()
  let anonymousId = cookieStore.get(ANON_COOKIE_NAME)?.value

  if (!anonymousId) {
    anonymousId = nanoid()
    cookieStore.set(ANON_COOKIE_NAME, anonymousId, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: ANON_COOKIE_MAX_AGE,
    })
  }

  const clerkId = `${ANON_CLERK_PREFIX}${anonymousId}`
  const db = await getDb()

  let user = await db
    .prepare('SELECT id, clerk_id FROM users WHERE clerk_id = ?')
    .bind(clerkId)
    .first<{ id: string; clerk_id: string }>()

  if (!user) {
    const userId = nanoid()
    await db
      .prepare(
        `INSERT OR IGNORE INTO users (id, clerk_id, email, name, avatar_url, plan)
         VALUES (?, ?, '', 'Guest', '', 'free')`,
      )
      .bind(userId, clerkId)
      .run()

    user = await db
      .prepare('SELECT id, clerk_id FROM users WHERE clerk_id = ?')
      .bind(clerkId)
      .first<{ id: string; clerk_id: string }>()
  }

  if (!user) {
    throw new Error('Failed to initialize anonymous user')
  }

  return { userId: user.id, clerkId: user.clerk_id }
}

/** 统一返回匿名访客上下文，保证现有 API 主链可继续运行。 */
export async function requireAuth(): Promise<AuthUser> {
  return getOrCreateAnonymousUser()
}

/** 匿名模式下可选认证与强制认证等价，始终返回访客上下文。 */
export async function optionalAuth(): Promise<AuthUser | null> {
  return getOrCreateAnonymousUser()
}
