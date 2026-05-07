/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db, @/lib/errors, @/lib/agent/audit-storage
 * [OUTPUT]: 对外提供 GET /api/workflows/:id/agent-replay，返回最近一次可回放的 Agent 改图审计
 * [POS]: api/workflows/[id] 的 Agent 回放端点，为“回看上次改动”与“查看改动”入口提供真实数据，并兼容 R2 正文回填
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { apiOk, handleApiError } from '@/lib/api/response'
import { resolveAgentAuditPayload } from '@/lib/agent/audit-storage'
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

    const hasAgentAuditLogs = await db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
      .bind('agent_audit_logs')
      .first<{ name?: string }>()

    if (!hasAgentAuditLogs?.name) {
      return apiOk({ replay: null })
    }

    const row = await db
      .prepare(
        `SELECT id, event_type, proposal_id, created_at, payload_r2_key,
                replay_snapshot, plan_json, result_json, canvas_summary, alternatives_json, metadata_json
         FROM agent_audit_logs
         WHERE workflow_id = ?
           AND (has_replay_snapshot = 1 OR replay_snapshot IS NOT NULL)
         ORDER BY created_at DESC
         LIMIT 1`,
      )
      .bind(id)
      .first()

    if (!row) {
      return apiOk({ replay: null })
    }

    const payload = await resolveAgentAuditPayload(row as Record<string, unknown>)

    return apiOk({
      replay: {
        id: row.id,
        eventType: row.event_type,
        proposalId: row.proposal_id,
        replaySnapshot: payload.replaySnapshot,
        plan: payload.plan,
        result: payload.result,
        createdAt: row.created_at,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
