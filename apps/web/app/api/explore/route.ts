/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db, @/lib/validations/explore
 * [OUTPUT]: 对外提供 GET /api/explore (混合返回公开工作流 + 公开生成作品)
 * [POS]: api/explore 的广场列表端点，统一查询公开工作流与公开生成作品并标记互动状态
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NextRequest } from 'next/server'

import { optionalAuth } from '@/lib/api/auth'
import { apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { exploreQuerySchema } from '@/lib/validations/explore'

/* ─── Sort Mapping ──────────────────────────────────── */

const SORT_MAP: Record<string, string> = {
  latest: 'published_at DESC',
  popular: 'view_count DESC',
  'most-liked': 'like_count DESC',
}

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

interface ExploreSchemaSupport {
  hasPublishedOutputsTable: boolean
  hasPublishedOutputLikesTable: boolean
  hasPublishedOutputFavoritesTable: boolean
  hasPublishedOutputCategoryId: boolean
}

async function hasPublishedOutputsTable(db: Awaited<ReturnType<typeof getDb>>) {
  const row = await db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'published_outputs'")
    .first<{ name: string }>()

  return !!row?.name
}

async function hasTable(db: Awaited<ReturnType<typeof getDb>>, tableName: string) {
  const row = await db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .bind(tableName)
    .first<{ name: string }>()

  return !!row?.name
}

async function hasColumn(
  db: Awaited<ReturnType<typeof getDb>>,
  tableName: string,
  columnName: string,
) {
  const result = await db.prepare(`PRAGMA table_info(${tableName})`).all<{ name: string }>()
  return (result.results ?? []).some((column) => column.name === columnName)
}

async function getExploreSchemaSupport(
  db: Awaited<ReturnType<typeof getDb>>,
): Promise<ExploreSchemaSupport> {
  const publishedOutputsTableExists = await hasPublishedOutputsTable(db)
  if (!publishedOutputsTableExists) {
    return {
      hasPublishedOutputsTable: false,
      hasPublishedOutputLikesTable: false,
      hasPublishedOutputFavoritesTable: false,
      hasPublishedOutputCategoryId: false,
    }
  }

  const [hasPublishedOutputLikesTable, hasPublishedOutputFavoritesTable, hasPublishedOutputCategoryId] =
    await Promise.all([
      hasTable(db, 'published_output_likes'),
      hasTable(db, 'published_output_favorites'),
      hasColumn(db, 'published_outputs', 'category_id'),
    ])

  return {
    hasPublishedOutputsTable: true,
    hasPublishedOutputLikesTable,
    hasPublishedOutputFavoritesTable,
    hasPublishedOutputCategoryId,
  }
}

/* ─── GET /api/explore ──────────────────────────────── */

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const parsed = exploreQuerySchema.safeParse({
      page: url.searchParams.get('page') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      category: url.searchParams.get('category') || undefined,
      sort: url.searchParams.get('sort') ?? undefined,
      type: url.searchParams.get('type') ?? undefined,
    })

    const { page, limit, category, sort, type } = parsed.success
      ? parsed.data
      : { page: 1, limit: 20, category: undefined, sort: 'latest' as const, type: 'all' as const }

    const offset = (page - 1) * limit
    const orderBy = SORT_MAP[sort] ?? 'published_at DESC'
    const auth = await optionalAuth()
    const db = await getDb()
    const schemaSupport = await getExploreSchemaSupport(db)

    // 构建查询
    const conditions: string[] = []
    const binds: (string | number)[] = []

    if (category) {
      conditions.push('category_id = ?')
      binds.push(category)
    }

    if (type !== 'all') {
      conditions.push('content_type = ?')
      binds.push(type)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const workflowItemsSql = `
      SELECT 'workflow' AS entity_type,
             w.id,
             w.name,
             w.description,
             w.thumbnail,
             NULL AS media_url,
             w.like_count,
             w.clone_count,
             w.view_count,
             w.published_at,
             w.category_id,
             ${ACCOUNT_AUTHOR_NAME_SQL} as author_name,
             u.avatar_url as author_avatar,
             'workflow' as content_type,
             (SELECT GROUP_CONCAT(DISTINCT json_extract(j.value, '$.type'))
              FROM json_each(json_extract(w.data, '$.nodes')) j) as node_types
      FROM workflows w
      JOIN users u ON u.id = w.user_id
      WHERE w.is_public = 1
    `

    const outputItemsSql = `
      SELECT 'output' AS entity_type,
             po.id,
             po.title AS name,
             po.description,
             po.thumbnail,
             po.media_url,
             po.like_count,
             po.clone_count,
             po.view_count,
             po.published_at,
             ${schemaSupport.hasPublishedOutputCategoryId ? 'po.category_id' : 'NULL'} AS category_id,
             ${OUTPUT_AUTHOR_NAME_SQL} as author_name,
             ${OUTPUT_AUTHOR_AVATAR_SQL} as author_avatar,
             po.media_type as content_type,
             NULL as node_types
      FROM published_outputs po
      JOIN users u ON u.id = po.user_id
      WHERE po.is_public = 1
    `
    const publicItemsSql = schemaSupport.hasPublishedOutputsTable
      ? `${workflowItemsSql} UNION ALL ${outputItemsSql}`
      : workflowItemsSql

    // 总数
    const countRow = await db
      .prepare(`SELECT COUNT(*) as total FROM (${publicItemsSql}) items ${whereClause}`)
      .bind(...binds)
      .first<{ total: number }>()
    const total = countRow?.total ?? 0

    // 列表
    const rows = await db
      .prepare(
        `SELECT *
         FROM (${publicItemsSql}) items
         ${whereClause}
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
        const workflowIds = items
          .filter((r: Record<string, unknown>) => r.entity_type === 'workflow')
          .map((r: Record<string, unknown>) => r.id as string)
        const outputIds = items
          .filter((r: Record<string, unknown>) => r.entity_type === 'output')
          .map((r: Record<string, unknown>) => r.id as string)

        const likedWorkflowPromise = workflowIds.length > 0
          ? db.prepare(
            `SELECT workflow_id AS target_id FROM likes WHERE user_id = ? AND workflow_id IN (${workflowIds.map(() => '?').join(',')})`,
          ).bind(auth.userId, ...workflowIds).all()
          : Promise.resolve({ results: [] as Record<string, unknown>[] })
        const favoritedWorkflowPromise = workflowIds.length > 0
          ? db.prepare(
            `SELECT workflow_id AS target_id FROM favorites WHERE user_id = ? AND workflow_id IN (${workflowIds.map(() => '?').join(',')})`,
          ).bind(auth.userId, ...workflowIds).all()
          : Promise.resolve({ results: [] as Record<string, unknown>[] })
        const likedOutputPromise = outputIds.length > 0 && schemaSupport.hasPublishedOutputLikesTable
          ? db.prepare(
            `SELECT published_output_id AS target_id
             FROM published_output_likes
             WHERE user_id = ? AND published_output_id IN (${outputIds.map(() => '?').join(',')})`,
          ).bind(auth.userId, ...outputIds).all()
          : Promise.resolve({ results: [] as Record<string, unknown>[] })
        const favoritedOutputPromise = outputIds.length > 0 && schemaSupport.hasPublishedOutputFavoritesTable
          ? db.prepare(
            `SELECT published_output_id AS target_id
             FROM published_output_favorites
             WHERE user_id = ? AND published_output_id IN (${outputIds.map(() => '?').join(',')})`,
          ).bind(auth.userId, ...outputIds).all()
          : Promise.resolve({ results: [] as Record<string, unknown>[] })

        const [likedWorkflow, favoritedWorkflow, likedOutput, favoritedOutput] = await Promise.all([
          likedWorkflowPromise,
          favoritedWorkflowPromise,
          likedOutputPromise,
          favoritedOutputPromise,
        ])

        const likedSet = new Set(
          [
            ...(likedWorkflow.results ?? []).map((r: Record<string, unknown>) => r.target_id),
            ...(likedOutput.results ?? []).map((r: Record<string, unknown>) => r.target_id),
          ],
        )
        const favoritedSet = new Set(
          [
            ...(favoritedWorkflow.results ?? []).map((r: Record<string, unknown>) => r.target_id),
            ...(favoritedOutput.results ?? []).map((r: Record<string, unknown>) => r.target_id),
          ],
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
