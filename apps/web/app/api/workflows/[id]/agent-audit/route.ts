/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db, @/lib/errors, @/lib/nanoid
 * [OUTPUT]: 对外提供 GET/POST /api/workflows/:id/agent-audit
 * [POS]: api/workflows/[id] 的 Agent 审计端点，负责持久化提案/确认/执行/结果/回放索引并返回最近记录
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { apiError, apiOk, handleApiError, withBodyLimit } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { NotFoundError } from '@/lib/errors'
import { nanoid } from '@/lib/nanoid'

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

    const { results } = await db
      .prepare(
        `SELECT id, event_type, mode, user_message, canvas_summary, plan_json, alternatives_json,
                result_json, replay_snapshot, target_node_id, proposal_id, confirmed, metadata_json, created_at
         FROM agent_audit_logs
         WHERE workflow_id = ?
         ORDER BY created_at DESC
         LIMIT 30`,
      )
      .bind(id)
      .all()

    return apiOk(results.map(parseAuditRow))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const tooLarge = withBodyLimit(req, 2_097_152)
  if (tooLarge) return tooLarge

  try {
    const { userId } = await requireAuth()
    const { id } = await params
    const body = await req.json() as Record<string, unknown>
    const db = await getDb()

    const wf = await db
      .prepare('SELECT id FROM workflows WHERE id = ? AND user_id = ?')
      .bind(id, userId)
      .first()

    if (!wf) throw new NotFoundError('Workflow', id)

    if (typeof body.eventType !== 'string' || body.eventType.trim().length === 0) {
      return apiError('VALIDATION_FAILED', 'eventType is required', 400)
    }

    const auditId = nanoid()
    await db
      .prepare(
        `INSERT INTO agent_audit_logs (
          id, user_id, workflow_id, event_type, mode, user_message, canvas_summary,
          plan_json, alternatives_json, result_json, replay_snapshot, target_node_id,
          proposal_id, confirmed, metadata_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        auditId,
        userId,
        id,
        body.eventType,
        typeof body.mode === 'string' ? body.mode : null,
        typeof body.userMessage === 'string' ? body.userMessage : null,
        stringifyNullable(body.canvasSummary),
        stringifyNullable(body.plan),
        stringifyNullable(body.alternatives),
        stringifyNullable(body.result),
        stringifyNullable(body.replaySnapshot),
        typeof body.targetNodeId === 'string' ? body.targetNodeId : null,
        typeof body.proposalId === 'string' ? body.proposalId : null,
        body.confirmed === true ? 1 : 0,
        stringifyNullable(body.metadata),
      )
      .run()

    return apiOk({ recorded: true, id: auditId })
  } catch (error) {
    return handleApiError(error)
  }
}

function stringifyNullable(value: unknown) {
  if (value === undefined) return null
  return JSON.stringify(value)
}

function parseAuditRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    eventType: row.event_type,
    mode: row.mode,
    userMessage: row.user_message,
    canvasSummary: parseJsonField(row.canvas_summary),
    plan: parseJsonField(row.plan_json),
    alternatives: parseJsonField(row.alternatives_json),
    result: parseJsonField(row.result_json),
    replaySnapshot: parseJsonField(row.replay_snapshot),
    targetNodeId: row.target_node_id,
    proposalId: row.proposal_id,
    confirmed: Number(row.confirmed ?? 0) === 1,
    metadata: parseJsonField(row.metadata_json),
    createdAt: row.created_at,
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
