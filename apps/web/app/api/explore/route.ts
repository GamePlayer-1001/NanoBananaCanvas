/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db, @/lib/validations/explore
 * [OUTPUT]: 对外提供 GET /api/explore (含 node_types 字段)
 * [POS]: api/explore 的广场列表端点，查询公开工作流并标记互动状态，提取节点类型
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NextRequest } from 'next/server'

import { optionalAuth } from '@/lib/api/auth'
import { apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { exploreQuerySchema } from '@/lib/validations/explore'

/* ─── Sort Mapping ──────────────────────────────────── */

const SORT_MAP: Record<string, string> = {
  latest: 'w.published_at DESC',
  popular: 'w.view_count DESC',
  'most-liked': 'w.like_count DESC',
}

/* ─── GET /api/explore ──────────────────────────────── */

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const parsed = exploreQuerySchema.safeParse({
      page: url.searchParams.get('page'),
      limit: url.searchParams.get('limit'),
      category: url.searchParams.get('category') || undefined,
      sort: url.searchParams.get('sort'),
    })

    const { page, limit, category, sort } = parsed.success
      ? parsed.data
      : { page: 1, limit: 20, category: undefined, sort: 'latest' as const }

    const offset = (page - 1) * limit
    const orderBy = SORT_MAP[sort] ?? 'w.published_at DESC'
    const auth = await optionalAuth()
    const db = await getDb()

    // 构建查询
    const conditions = ['w.is_public = 1']
    const binds: (string | number)[] = []

    if (category) {
      conditions.push('w.category_id = ?')
      binds.push(category)
    }

    const where = conditions.join(' AND ')

    // 总数
    const countRow = await db
      .prepare(`SELECT COUNT(*) as total FROM workflows w WHERE ${where}`)
      .bind(...binds)
      .first<{ total: number }>()
    const total = countRow?.total ?? 0

    // 列表
    const rows = await db
      .prepare(
        `SELECT w.id, w.name, w.description, w.thumbnail, w.like_count, w.clone_count,
                w.view_count, w.published_at, w.category_id,
                u.name as author_name, u.avatar_url as author_avatar,
                (SELECT GROUP_CONCAT(DISTINCT json_extract(j.value, '$.type'))
                 FROM json_each(json_extract(w.data, '$.nodes')) j) as node_types
         FROM workflows w
         JOIN users u ON u.id = w.user_id
         LEFT JOIN categories c ON c.id = w.category_id
         WHERE ${where}
         ORDER BY ${orderBy}
         LIMIT ? OFFSET ?`,
      )
      .bind(...binds, limit, offset)
      .all()

    // 标记当前用户互动状态
    let items = rows.results ?? []
    if (auth) {
      const ids = items.map((r: Record<string, unknown>) => r.id as string)
      if (ids.length > 0) {
        const placeholders = ids.map(() => '?').join(',')

        const [liked, favorited] = await Promise.all([
          db
            .prepare(
              `SELECT workflow_id FROM likes WHERE user_id = ? AND workflow_id IN (${placeholders})`,
            )
            .bind(auth.userId, ...ids)
            .all(),
          db
            .prepare(
              `SELECT workflow_id FROM favorites WHERE user_id = ? AND workflow_id IN (${placeholders})`,
            )
            .bind(auth.userId, ...ids)
            .all(),
        ])

        const likedSet = new Set(
          (liked.results ?? []).map((r: Record<string, unknown>) => r.workflow_id),
        )
        const favoritedSet = new Set(
          (favorited.results ?? []).map((r: Record<string, unknown>) => r.workflow_id),
        )

        items = items.map((item: Record<string, unknown>) => ({
          ...item,
          liked: likedSet.has(item.id),
          favorited: favoritedSet.has(item.id),
        }))
      }
    }

    return apiOk({
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
