/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db
 * [OUTPUT]: 对外提供 GET /api/workflows/favorites (当前用户的收藏列表，含工作流与公开输出)
 * [POS]: api/workflows 的收藏列表端点，被 profile works-tab 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'

const AUTHOR_NAME_SQL = `COALESCE(
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

/* ─── GET /api/workflows/favorites ────────────────────── */

export async function GET() {
  try {
    const { userId } = await requireAuth()
    const db = await getDb()
    const hasPublishedOutputFavoritesTable = await db
      .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'published_output_favorites'")
      .first()

    const workflowRows = await db
      .prepare(
        `SELECT
                'workflow' AS entity_type,
                w.id,
                w.name,
                w.description,
                w.thumbnail,
                w.is_public,
                NULL AS media_url,
                NULL AS media_type,
                w.like_count, w.clone_count, w.updated_at,
                f.created_at AS favorited_at,
                ${AUTHOR_NAME_SQL} as author_name, u.avatar_url as author_avatar
         FROM favorites f
         JOIN workflows w ON w.id = f.workflow_id
         JOIN users u ON u.id = w.user_id
         WHERE f.user_id = ?
         ORDER BY f.created_at DESC`,
      )
      .bind(userId)
      .all()

    const outputRows = hasPublishedOutputFavoritesTable
      ? await db
          .prepare(
            `SELECT
                    'output' AS entity_type,
                    po.id,
                    po.title AS name,
                    po.description,
                    COALESCE(po.thumbnail, po.media_url) AS thumbnail,
                    1 AS is_public,
                    po.media_url,
                    po.media_type,
                    po.like_count,
                    po.clone_count,
                    po.updated_at,
                    pof.created_at AS favorited_at,
                    ${AUTHOR_NAME_SQL} as author_name,
                    u.avatar_url as author_avatar
             FROM published_output_favorites pof
             JOIN published_outputs po ON po.id = pof.published_output_id
             JOIN users u ON u.id = po.user_id
             WHERE pof.user_id = ? AND po.is_public = 1
             ORDER BY pof.created_at DESC`,
          )
          .bind(userId)
          .all()
      : { results: [] }

    const items = [...(workflowRows.results ?? []), ...(outputRows.results ?? [])].sort((a, b) => {
      const aTime = String((a as { favorited_at?: string }).favorited_at ?? '')
      const bTime = String((b as { favorited_at?: string }).favorited_at ?? '')
      return bTime.localeCompare(aTime)
    })

    return apiOk({ items })
  } catch (error) {
    return handleApiError(error)
  }
}
