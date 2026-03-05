/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db
 * [OUTPUT]: 对外提供 GET /api/notifications, PATCH /api/notifications
 * [POS]: api/notifications 的通知端点，分页查询 + 标记已读
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NextRequest } from 'next/server'

import { requireAuth } from '@/lib/api/auth'
import { apiOk, handleApiError } from '@/lib/api/response'
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

    // 总数
    const countRow = await db
      .prepare('SELECT COUNT(*) as total FROM notifications WHERE user_id = ?')
      .bind(userId)
      .first<{ total: number }>()
    const total = countRow?.total ?? 0

    // 未读数
    const unreadRow = await db
      .prepare('SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND is_read = 0')
      .bind(userId)
      .first<{ unread: number }>()
    const unread = unreadRow?.unread ?? 0

    // 列表
    const rows = await db
      .prepare(
        `SELECT id, type, title, body, data, is_read, created_at
         FROM notifications WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
      )
      .bind(userId, limit, offset)
      .all()

    return apiOk({
      items: rows.results ?? [],
      unread,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/* ─── PATCH /api/notifications ──────────────────────── */

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await requireAuth()
    const body = await req.json()
    const db = await getDb()

    if (body.id) {
      // 标记单条已读
      await db
        .prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?')
        .bind(body.id, userId)
        .run()
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
