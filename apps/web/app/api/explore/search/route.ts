/**
 * [INPUT]: 依赖 @/lib/api/response, @/lib/db, @/lib/validations/explore
 * [OUTPUT]: 对外提供 GET /api/explore/search
 * [POS]: api/explore/search 的搜索端点，LIKE 模糊匹配公开工作流
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NextRequest } from 'next/server'

import { apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { searchQuerySchema } from '@/lib/validations/explore'

/* ─── GET /api/explore/search ───────────────────────── */

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const parsed = searchQuerySchema.safeParse({
      q: url.searchParams.get('q'),
      page: url.searchParams.get('page'),
      limit: url.searchParams.get('limit'),
    })

    if (!parsed.success) {
      return apiOk({ items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } })
    }

    const { q, page, limit } = parsed.data
    const offset = (page - 1) * limit
    const keyword = `%${q}%`
    const db = await getDb()

    // 总数
    const countRow = await db
      .prepare(
        `SELECT COUNT(*) as total FROM workflows
         WHERE is_public = 1 AND (name LIKE ? OR description LIKE ?)`,
      )
      .bind(keyword, keyword)
      .first<{ total: number }>()
    const total = countRow?.total ?? 0

    // 列表
    const rows = await db
      .prepare(
        `SELECT w.id, w.name, w.description, w.thumbnail, w.like_count, w.clone_count,
                w.view_count, w.published_at, w.category_id,
                u.name as author_name, u.avatar_url as author_avatar
         FROM workflows w
         JOIN users u ON u.id = w.user_id
         WHERE w.is_public = 1 AND (w.name LIKE ? OR w.description LIKE ?)
         ORDER BY w.published_at DESC
         LIMIT ? OFFSET ?`,
      )
      .bind(keyword, keyword, limit, offset)
      .all()

    return apiOk({
      items: rows.results ?? [],
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
