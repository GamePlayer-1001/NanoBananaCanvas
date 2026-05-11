/**
 * [INPUT]: 依赖 @/lib/api/response, @/lib/db, @/lib/validations/explore
 * [OUTPUT]: 对外提供 GET /api/explore/search
 * [POS]: api/explore/search 的搜索端点，LIKE 模糊匹配公开工作流与公开生成作品
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NextRequest } from 'next/server'

import { apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { searchQuerySchema } from '@/lib/validations/explore'

const ACCOUNT_AUTHOR_NAME_SQL = `COALESCE(
  NULLIF(TRIM(u.name), ''), 
  NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), ''),
  NULLIF(TRIM(u.username), ''),
  NULLIF(
    TRIM(
      CASE
        WHEN INSTR(COALESCE(u.email, ''), '@') > 1
          THEN SUBSTR(u.email, 1, INSTR(u.email, '@') - 1)
        ELSE COALESCE(u.email, '')
      END
    ),
    ''
  ),
  'Unknown Creator'
)`

const OUTPUT_AUTHOR_NAME_SQL = `COALESCE(
  NULLIF(TRIM(po.source_author_name), ''),
  ${ACCOUNT_AUTHOR_NAME_SQL}
)`

const OUTPUT_AUTHOR_AVATAR_SQL = `COALESCE(
  NULLIF(TRIM(po.source_author_avatar), ''),
  NULLIF(TRIM(u.avatar_url), '')
)`

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

    const publicItemsSql = `
      SELECT 'workflow' AS entity_type,
             w.id,
             w.name,
             w.description,
             w.thumbnail,
             w.like_count,
             w.clone_count,
             w.view_count,
             w.published_at,
             'workflow' AS content_type,
             ${ACCOUNT_AUTHOR_NAME_SQL} as author_name,
             u.avatar_url as author_avatar
      FROM workflows w
      JOIN users u ON u.id = w.user_id
      WHERE w.is_public = 1

      UNION ALL

      SELECT 'output' AS entity_type,
             po.id,
             po.title AS name,
             po.description,
             po.thumbnail,
             po.like_count,
             po.clone_count,
             po.view_count,
             po.published_at,
             po.media_type AS content_type,
             ${OUTPUT_AUTHOR_NAME_SQL} as author_name,
             ${OUTPUT_AUTHOR_AVATAR_SQL} as author_avatar
      FROM published_outputs po
      JOIN users u ON u.id = po.user_id
      WHERE po.is_public = 1
    `

    // 总数
    const countRow = await db
      .prepare(
        `SELECT COUNT(*) as total FROM (${publicItemsSql}) items
         WHERE name LIKE ? OR description LIKE ?`,
      )
      .bind(keyword, keyword)
      .first<{ total: number }>()
    const total = countRow?.total ?? 0

    // 列表
    const rows = await db
      .prepare(
        `SELECT *
         FROM (${publicItemsSql}) items
         WHERE name LIKE ? OR description LIKE ?
         ORDER BY published_at DESC
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
