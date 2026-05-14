/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db
 * [OUTPUT]: 对外提供 GET /api/notifications, PATCH /api/notifications
 * [POS]: api/notifications 的通知端点，分页查询 + 标记已读，并把精确总数限制在进入页面查询阶段
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NextRequest } from 'next/server'

import { requireAuth } from '@/lib/api/auth'
import { apiError, apiOk, handleApiError, withBodyLimit } from '@/lib/api/response'
import { getDb } from '@/lib/db'

/* ─── GET /api/notifications ────────────────────────── */

export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth()
    const url = new URL(req.url)
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || 20))
    const offset = (page - 1) * limit
    const db = await getDb()

    // 未读数
    const unreadRow = await db
      .prepare('SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND is_read = 0')
      .bind(userId)
      .first<{ unread: number }>()
    const unread = unreadRow?.unread ?? 0

    // 列表：多取一条判断是否还有下一页，避免每次分页都额外 COUNT(*)
    const rows = await db
      .prepare(
        `SELECT id, type, title, body, data, is_read, created_at
         FROM notifications WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
      )
      .bind(userId, limit + 1, offset)
      .all()

    const items = rows.results ?? []
    const hasMore = items.length > limit
    const visibleItems = hasMore ? items.slice(0, limit) : items

    // 精确总数：仅第一页计算，后续翻页通过 hasMore 驱动，避免重复 COUNT(*)
    const total =
      page === 1
        ? (await db
            .prepare('SELECT COUNT(*) as total FROM notifications WHERE user_id = ?')
            .bind(userId)
            .first<{ total: number }>())?.total ?? visibleItems.length
        : offset + visibleItems.length + (hasMore ? 1 : 0)

    return apiOk({
      items: visibleItems,
      unread,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        hasMore,
        nextPage: hasMore ? page + 1 : null,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/* ─── PATCH /api/notifications ──────────────────────── */

export async function PATCH(req: NextRequest) {
  const tooLarge = withBodyLimit(req)
  if (tooLarge) return tooLarge

  try {
    const { userId } = await requireAuth()
    const body = (await req.json()) as { id?: string }
    const db = await getDb()

    if (body.id) {
      // 标记单条已读 — 校验存在性
      const result = await db
        .prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?')
        .bind(body.id, userId)
        .run()

      if (!result.meta.changes) {
        return apiError('NOT_FOUND', 'Notification not found', 404)
      }
    } else {
      // 标记全部已读
      await db
        .prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0')
        .bind(userId)
        .run()
    }

    return apiOk({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
