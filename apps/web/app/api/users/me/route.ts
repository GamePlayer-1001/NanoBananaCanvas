/**
 * [INPUT]: 依赖 @clerk/nextjs/server 的 auth + currentUser，依赖 @/lib/db，依赖 @/lib/nanoid
 * [OUTPUT]: 对外提供 GET /api/users/me (用户信息 + 首次登录自动创建)
 * [POS]: api/users 的用户端点，实现 SYNC-001 用户同步 + API-001 用户信息
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { auth, currentUser } from '@clerk/nextjs/server'

import { apiError, apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { nanoid } from '@/lib/nanoid'

/* ─── GET /api/users/me ──────────────────────────────── */

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return apiError('AUTH_UNAUTHORIZED', 'Not authenticated', 401)
    }

    const db = await getDb()

    // 查找现有用户
    let user = await db
      .prepare('SELECT * FROM users WHERE clerk_id = ?')
      .bind(clerkId)
      .first()

    // SYNC-001: 首次登录自动创建 (INSERT OR IGNORE — 幂等，防并发/Webhook 竞态)
    if (!user) {
      const clerkUser = await currentUser()
      if (!clerkUser) {
        return apiError('AUTH_UNAUTHORIZED', 'Clerk user not found', 401)
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

      // 无论是本次插入还是已存在，统一用 clerk_id 查询
      user = await db
        .prepare('SELECT * FROM users WHERE clerk_id = ?')
        .bind(clerkId)
        .first()
    }

    return apiOk(user)
  } catch (error) {
    return handleApiError(error)
  }
}
