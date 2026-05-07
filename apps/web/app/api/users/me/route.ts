/**
 * [INPUT]: 依赖 @/lib/api/auth，依赖 @/lib/db，依赖 @/lib/timezones
 * [OUTPUT]: 对外提供 GET /api/users/me 与 PATCH /api/users/me/timezone (当前 actor 的账户镜像 + 时区矫正)
 * [POS]: api/users 的用户端点，返回当前请求对应的 users 表记录与 actor 身份视图
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { normalizeTimeZone } from '@/lib/timezones'

/* ─── GET /api/users/me ──────────────────────────────── */

export async function GET() {
  try {
    const authUser = await requireAuth()
    const db = await getDb()
    const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(authUser.userId).first()

    if (!user) {
      return apiOk(null)
    }

    return apiOk({
      id: user.id,
      actorId: authUser.actorId,
      actorKind: authUser.actorKind,
      isAuthenticated: authUser.isAuthenticated,
      identityKey: user.clerk_id,
      clerkUserId: authUser.clerkUserId ?? null,
      username: user.username || '',
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      name: user.name,
      email: user.email,
      avatarUrl: user.avatar_url || '',
      hasPassword: authUser.hasPassword,
      tier: user.plan,
      plan: user.plan,
      membershipStatus: user.membership_status || user.plan,
      timezone: user.timezone || null,
      createdAt: user.created_at,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(request: Request) {
  try {
    const authUser = await requireAuth()
    if (!authUser.isAuthenticated) {
      throw new Error('Authentication required')
    }

    const body = (await request.json().catch(() => ({}))) as { timezone?: string | null }
    const timezone = normalizeTimeZone(body.timezone)

    if (!timezone) {
      throw new Error('Invalid timezone')
    }

    const db = await getDb()
    await db
      .prepare(
        `UPDATE users
         SET timezone = ?,
             updated_at = datetime('now')
         WHERE id = ?`,
      )
      .bind(timezone, authUser.userId)
      .run()

    return apiOk({ timezone })
  } catch (error) {
    return handleApiError(error)
  }
}
