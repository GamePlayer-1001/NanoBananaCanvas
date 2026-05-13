/**
 * [INPUT]: 依赖 @/lib/api/response, @/lib/db, @/lib/validations/explore
 * [OUTPUT]: 对外提供 GET /api/explore/search
 * [POS]: api/explore/search 的搜索端点，对公开工作流与公开生成作品做标题/描述/作者/Prompt/来源的模糊搜索，并按相关性优先排序
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
      q: url.searchParams.get('q') ?? undefined,
      page: url.searchParams.get('page') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    })

    if (!parsed.success) {
      return apiOk({ items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } })
    }

    const { q, page, limit } = parsed.data
    const offset = (page - 1) * limit
    const normalizedQuery = q.trim()
    const keyword = `%${normalizedQuery}%`
    const exactKeyword = normalizedQuery
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
             w.category_id,
             'workflow' AS content_type,
             ${ACCOUNT_AUTHOR_NAME_SQL} as author_name,
             u.avatar_url as author_avatar,
             '' AS prompt,
             '' AS source_url,
             '' AS source_author_name
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
             po.category_id,
             po.media_type AS content_type,
             ${OUTPUT_AUTHOR_NAME_SQL} as author_name,
             ${OUTPUT_AUTHOR_AVATAR_SQL} as author_avatar,
             COALESCE(po.prompt, '') AS prompt,
             COALESCE(po.source_url, '') AS source_url,
             COALESCE(po.source_author_name, '') AS source_author_name
      FROM published_outputs po
      JOIN users u ON u.id = po.user_id
      WHERE po.is_public = 1
    `

    const searchWhere = `
      WHERE name LIKE ?
         OR description LIKE ?
         OR author_name LIKE ?
         OR prompt LIKE ?
         OR source_url LIKE ?
         OR source_author_name LIKE ?
    `

    const relevanceScoreSql = `
      CASE
        WHEN LOWER(name) = LOWER(?) THEN 1000
        WHEN LOWER(name) LIKE LOWER(?) THEN 800
        WHEN LOWER(author_name) = LOWER(?) THEN 700
        WHEN LOWER(author_name) LIKE LOWER(?) THEN 600
        WHEN LOWER(description) LIKE LOWER(?) THEN 500
        WHEN LOWER(prompt) LIKE LOWER(?) THEN 400
        WHEN LOWER(source_author_name) LIKE LOWER(?) THEN 300
        WHEN LOWER(source_url) LIKE LOWER(?) THEN 200
        ELSE 0
      END
    `

    // 总数
    const countRow = await db
      .prepare(
        `SELECT COUNT(*) as total
         FROM (${publicItemsSql}) items
         ${searchWhere}`,
      )
      .bind(keyword, keyword, keyword, keyword, keyword, keyword)
      .first<{ total: number }>()
    const total = countRow?.total ?? 0

    // 列表
    const rows = await db
      .prepare(
        `SELECT *
         FROM (${publicItemsSql}) items
         ${searchWhere}
         ORDER BY ${relevanceScoreSql} DESC, published_at DESC
         LIMIT ? OFFSET ?`,
      )
      .bind(
        keyword,
        keyword,
        keyword,
        keyword,
        keyword,
        keyword,
        exactKeyword,
        keyword,
        exactKeyword,
        keyword,
        keyword,
        keyword,
        keyword,
        keyword,
        limit,
        offset,
      )
      .all()

    return apiOk({
      items: rows.results ?? [],
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
