/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db, @/lib/errors
 * [OUTPUT]: 对外提供 GET /api/explore/:id (工作流/公开生成作品统一详情)
 * [POS]: api/explore/[id] 的统一详情端点，向 explore 详情页返回跨实体详情
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NextRequest } from 'next/server'

import { optionalAuth } from '@/lib/api/auth'
import { apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { NotFoundError } from '@/lib/errors'

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

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const authUser = await optionalAuth()
    const { id } = await params
    const db = await getDb()

    const workflow = await db
      .prepare(
        `SELECT 'workflow' AS entity_type, w.id, w.name, w.description, w.data, w.thumbnail,
                w.view_count, w.like_count, w.clone_count, w.published_at,
                ${ACCOUNT_AUTHOR_NAME_SQL} AS author_name, u.avatar_url AS author_avatar
         FROM workflows w
         JOIN users u ON u.id = w.user_id
         WHERE w.id = ? AND w.is_public = 1`,
      )
      .bind(id)
      .first<Record<string, unknown>>()

    if (workflow) {
      await db.prepare('UPDATE workflows SET view_count = view_count + 1 WHERE id = ?').bind(id).run()
      let liked = false
      let favorited = false
      if (authUser) {
        const [likeRow, favRow] = await Promise.all([
          db.prepare('SELECT 1 FROM likes WHERE user_id = ? AND workflow_id = ?')
            .bind(authUser.userId, id).first(),
          db.prepare('SELECT 1 FROM favorites WHERE user_id = ? AND workflow_id = ?')
            .bind(authUser.userId, id).first(),
        ])
        liked = !!likeRow
        favorited = !!favRow
      }

      return apiOk({
        ...workflow,
        liked,
        favorited,
        view_count: Number(workflow.view_count ?? 0) + 1,
      })
    }

    const output = await db
      .prepare(
        `SELECT 'output' AS entity_type, po.id, po.title AS name, po.description, po.prompt,
                po.source_url, po.thumbnail, po.media_url, po.media_type, po.view_count,
                po.like_count, po.clone_count, po.published_at, po.workflow_id,
                po.source_mode, po.source_type, po.source_author_name, po.source_author_avatar,
                po.workflow_json_url,
                ${OUTPUT_AUTHOR_NAME_SQL} AS author_name, ${OUTPUT_AUTHOR_AVATAR_SQL} AS author_avatar
         FROM published_outputs po
         JOIN users u ON u.id = po.user_id
         WHERE po.id = ? AND po.is_public = 1`,
      )
      .bind(id)
      .first<Record<string, unknown>>()

    if (!output) {
      throw new NotFoundError('Explore item', id)
    }

    await db
      .prepare('UPDATE published_outputs SET view_count = view_count + 1 WHERE id = ?')
      .bind(id)
      .run()

    let liked = false
    let favorited = false
    if (authUser) {
      const [likeRow, favRow] = await Promise.all([
        db.prepare('SELECT 1 FROM published_output_likes WHERE user_id = ? AND published_output_id = ?')
          .bind(authUser.userId, id).first(),
        db.prepare('SELECT 1 FROM published_output_favorites WHERE user_id = ? AND published_output_id = ?')
          .bind(authUser.userId, id).first(),
      ])
      liked = !!likeRow
      favorited = !!favRow
    }

    return apiOk({
      ...output,
      liked,
      favorited,
      view_count: Number(output.view_count ?? 0) + 1,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
