/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db, @/lib/errors, @/lib/nanoid, @/lib/agent/audit-storage
 * [OUTPUT]: 对外提供 GET/POST /api/workflows/:id/agent-audit
 * [POS]: api/workflows/[id] 的 Agent 审计端点，负责持久化提案/确认/执行/结果/回放索引，并把大 JSON 下沉到 R2
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { apiError, apiOk, handleApiError, withBodyLimit } from '@/lib/api/response'
import {
  buildAgentAuditPayloadPointer,
  resolveAgentAuditPayload,
  writeAgentAuditPayload,
} from '@/lib/agent/audit-storage'
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
        `SELECT id, event_type, mode, user_message, target_node_id, proposal_id, confirmed, created_at,
                payload_r2_key, payload_summary_json,
                has_canvas_summary, has_plan, has_alternatives, has_result, has_replay_snapshot, has_metadata,
                canvas_summary, plan_json, alternatives_json, result_json, replay_snapshot, metadata_json
         FROM agent_audit_logs
         WHERE workflow_id = ?
         ORDER BY created_at DESC
         LIMIT 30`,
      )
      .bind(id)
      .all()

    const parsed = await Promise.all((results ?? []).map(parseAuditRow))
    return apiOk(parsed)
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
    const payload = {
      canvasSummary: body.canvasSummary,
      plan: body.plan,
      alternatives: body.alternatives,
      result: body.result,
      replaySnapshot: body.replaySnapshot,
      metadata: body.metadata,
    }
    const pointer = buildAgentAuditPayloadPointer(userId, id, auditId, payload)

    await writeAgentAuditPayload(pointer.payloadR2Key, payload)

    await db
      .prepare(
        `INSERT INTO agent_audit_logs (
          id, user_id, workflow_id, event_type, mode, user_message, target_node_id,
          proposal_id, confirmed, payload_r2_key, payload_summary_json,
          has_canvas_summary, has_plan, has_alternatives, has_result, has_replay_snapshot, has_metadata,
          canvas_summary, plan_json, alternatives_json, result_json, replay_snapshot, metadata_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
      )
      .bind(
        auditId,
        userId,
        id,
        body.eventType,
        typeof body.mode === 'string' ? body.mode : null,
        typeof body.userMessage === 'string' ? body.userMessage : null,
        typeof body.targetNodeId === 'string' ? body.targetNodeId : null,
        typeof body.proposalId === 'string' ? body.proposalId : null,
        body.confirmed === true ? 1 : 0,
        pointer.payloadR2Key,
        pointer.payloadSummaryJson,
        pointer.hasCanvasSummary,
        pointer.hasPlan,
        pointer.hasAlternatives,
        pointer.hasResult,
        pointer.hasReplaySnapshot,
        pointer.hasMetadata,
        null,
        null,
        null,
        null,
        null,
        null,
      )
      .run()

    return apiOk({ recorded: true, id: auditId })
  } catch (error) {
    return handleApiError(error)
  }
}

async function parseAuditRow(row: Record<string, unknown>) {
  const payload = await resolveAgentAuditPayload(row)
  return {
    id: row.id,
    eventType: row.event_type,
    mode: row.mode,
    userMessage: row.user_message,
    canvasSummary: payload.canvasSummary,
    plan: payload.plan,
    alternatives: payload.alternatives,
    result: payload.result,
    replaySnapshot: payload.replaySnapshot,
    targetNodeId: row.target_node_id,
    proposalId: row.proposal_id,
    confirmed: Number(row.confirmed ?? 0) === 1,
    metadata: payload.metadata,
    createdAt: row.created_at,
  }
}
