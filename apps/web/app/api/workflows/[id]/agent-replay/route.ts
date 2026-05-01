/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db, @/lib/errors
 * [OUTPUT]: 对外提供 GET /api/workflows/:id/agent-replay，返回最近一次可回放的 Agent 改图审计
 * [POS]: api/workflows/[id] 的 Agent 回放端点，为“回看上次改动”与“查看改动”入口提供真实数据
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { NotFoundError } from '@/lib/errors'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth()
    const { id } = await params
    const db = await getDb()

    const wf = await db
      .prepare('SELECT id FROM workflows WHERE id = ? AND user_id = ?')
      .bind(id, userId)
      .first()

    if (!wf) throw new NotFoundError('Workflow', id)

    const row = await db
      .prepare(
        `SELECT id, event_type, proposal_id, replay_snapshot, plan_json, result_json, created_at
         FROM agent_audit_logs
         WHERE workflow_id = ?
           AND replay_snapshot IS NOT NULL
         ORDER BY created_at DESC
         LIMIT 1`,
      )
      .bind(id)
      .first()

    if (!row) {
      return apiOk({ replay: null })
    }

    return apiOk({
      replay: {
        id: row.id,
        eventType: row.event_type,
        proposalId: row.proposal_id,
        replaySnapshot: parseJsonField(row.replay_snapshot),
        plan: parseJsonField(row.plan_json),
        result: parseJsonField(row.result_json),
        createdAt: row.created_at,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

function parseJsonField(value: unknown) {
  if (typeof value !== 'string' || value.length === 0) return undefined
  try {
    return JSON.parse(value)
  } catch {
    return undefined
  }
}
