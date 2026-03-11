/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db, @/lib/nanoid
 * [OUTPUT]: 对外提供 GET/POST /api/workflows/:id/history
 * [POS]: api/workflows/[id]/history 的执行历史端点，由 executor hook 写入、前端面板读取
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NextRequest } from 'next/server'

import { requireAuth } from '@/lib/api/auth'
import { apiOk, handleApiError, withBodyLimit } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { NotFoundError } from '@/lib/errors'
import { nanoid } from '@/lib/nanoid'

/* ─── Params ─────────────────────────────────────────── */

type Params = { params: Promise<{ id: string }> }

/* ─── GET /api/workflows/:id/history ─────────────────── */

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth()
    const { id } = await params

    const db = await getDb()

    /* 验证工作流归属 */
    const wf = await db
      .prepare('SELECT id FROM workflows WHERE id = ? AND user_id = ?')
      .bind(id, userId)
      .first()

    if (!wf) throw new NotFoundError('Workflow', id)

    /* 最近 20 条执行记录 */
    const { results } = await db
      .prepare(
        `SELECT id, status, node_count, duration_ms, error_message, summary, created_at
         FROM execution_history
         WHERE workflow_id = ?
         ORDER BY created_at DESC
         LIMIT 20`,
      )
      .bind(id)
      .all()

    return apiOk(results)
  } catch (error) {
    return handleApiError(error)
  }
}

/* ─── POST /api/workflows/:id/history ────────────────── */

export async function POST(req: NextRequest, { params }: Params) {
  const tooLarge = withBodyLimit(req)
  if (tooLarge) return tooLarge

  try {
    const { userId } = await requireAuth()
    const { id } = await params
    const body = await req.json()

    const db = await getDb()

    /* 验证工作流归属 — 防止跨用户写入 */
    const wf = await db
      .prepare('SELECT id FROM workflows WHERE id = ? AND user_id = ?')
      .bind(id, userId)
      .first()

    if (!wf) throw new NotFoundError('Workflow', id)

    await db
      .prepare(
        `INSERT INTO execution_history (id, user_id, workflow_id, status, node_count, duration_ms, error_message, summary)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        nanoid(),
        userId,
        id,
        body.status ?? 'success',
        body.nodeCount ?? 0,
        body.durationMs ?? null,
        body.errorMessage ?? null,
        JSON.stringify(body.summary ?? {}),
      )
      .run()

    return apiOk({ recorded: true })
  } catch (error) {
    return handleApiError(error)
  }
}
