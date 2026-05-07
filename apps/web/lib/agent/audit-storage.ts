/**
 * [INPUT]: 依赖 @/lib/r2 的对象存储，依赖 Agent 审计事件的 JSON 字段载荷
 * [OUTPUT]: 对外提供 Agent 审计大 JSON 的 R2 Key 生成 / 摘要提炼 / R2 读写与兼容回填工具
 * [POS]: lib/agent 的审计存储适配层，被 agent-audit / agent-replay API 复用，用来把 D1 从正文存储降为索引层
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { getR2 } from '@/lib/r2'

export interface AgentAuditPayloadBlob {
  canvasSummary?: unknown
  plan?: unknown
  alternatives?: unknown
  result?: unknown
  replaySnapshot?: unknown
  metadata?: unknown
}

export interface AgentAuditPayloadSummary {
  planSummary?: string
  alternativeCount?: number
  resultKeyCount?: number
  replayChangeSummary?: string
  canvasNodeCount?: number
}

export interface AgentAuditPayloadFlags {
  hasCanvasSummary: number
  hasPlan: number
  hasAlternatives: number
  hasResult: number
  hasReplaySnapshot: number
  hasMetadata: number
}

export interface AgentAuditPayloadPointer extends AgentAuditPayloadFlags {
  payloadR2Key: string | null
  payloadSummaryJson: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function hasValue(value: unknown): boolean {
  if (value == null) {
    return false
  }

  if (typeof value === 'string') {
    return value.length > 0
  }

  if (Array.isArray(value)) {
    return value.length > 0
  }

  if (typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>).length > 0
  }

  return true
}

function toFlag(value: unknown): number {
  return hasValue(value) ? 1 : 0
}

export function buildAgentAuditPayloadKey(
  userId: string,
  workflowId: string,
  auditId: string,
): string {
  return `agent-audit/${userId}/${workflowId}/${auditId}.json`
}

export function summarizeAgentAuditPayload(
  payload: AgentAuditPayloadBlob,
): AgentAuditPayloadSummary {
  const summary: AgentAuditPayloadSummary = {}

  if (isRecord(payload.plan) && typeof payload.plan.summary === 'string') {
    summary.planSummary = payload.plan.summary
  }

  if (Array.isArray(payload.alternatives)) {
    summary.alternativeCount = payload.alternatives.length
  }

  if (isRecord(payload.result)) {
    summary.resultKeyCount = Object.keys(payload.result).length
  }

  if (
    isRecord(payload.replaySnapshot) &&
    typeof payload.replaySnapshot.changeSummary === 'string'
  ) {
    summary.replayChangeSummary = payload.replaySnapshot.changeSummary
  }

  if (isRecord(payload.canvasSummary) && Array.isArray(payload.canvasSummary.nodes)) {
    summary.canvasNodeCount = payload.canvasSummary.nodes.length
  } else if (isRecord(payload.canvasSummary) && typeof payload.canvasSummary.nodeCount === 'number') {
    summary.canvasNodeCount = payload.canvasSummary.nodeCount
  }

  return summary
}

export function buildAgentAuditPayloadPointer(
  userId: string,
  workflowId: string,
  auditId: string,
  payload: AgentAuditPayloadBlob,
): AgentAuditPayloadPointer {
  const flags: AgentAuditPayloadFlags = {
    hasCanvasSummary: toFlag(payload.canvasSummary),
    hasPlan: toFlag(payload.plan),
    hasAlternatives: toFlag(payload.alternatives),
    hasResult: toFlag(payload.result),
    hasReplaySnapshot: toFlag(payload.replaySnapshot),
    hasMetadata: toFlag(payload.metadata),
  }

  const hasPayload = Object.values(flags).some((value) => value === 1)
  return {
    payloadR2Key: hasPayload ? buildAgentAuditPayloadKey(userId, workflowId, auditId) : null,
    payloadSummaryJson: JSON.stringify(summarizeAgentAuditPayload(payload)),
    ...flags,
  }
}

export async function writeAgentAuditPayload(
  key: string | null,
  payload: AgentAuditPayloadBlob,
): Promise<void> {
  if (!key) {
    return
  }

  const r2 = await getR2()
  await r2.put(key, JSON.stringify(payload), {
    httpMetadata: {
      contentType: 'application/json; charset=utf-8',
    },
  })
}

export async function readAgentAuditPayload(
  key: string | null,
): Promise<AgentAuditPayloadBlob | null> {
  if (!key) {
    return null
  }

  const r2 = await getR2()
  const object = await r2.get(key)
  if (!object) {
    return null
  }

  try {
    return JSON.parse(await object.text()) as AgentAuditPayloadBlob
  } catch {
    return null
  }
}

export function parseStoredJsonField(value: unknown): unknown {
  if (typeof value !== 'string' || value.length === 0) {
    return undefined
  }

  try {
    return JSON.parse(value)
  } catch {
    return undefined
  }
}

export function buildLegacyAgentAuditPayload(row: Record<string, unknown>): AgentAuditPayloadBlob {
  return {
    canvasSummary: parseStoredJsonField(row.canvas_summary),
    plan: parseStoredJsonField(row.plan_json),
    alternatives: parseStoredJsonField(row.alternatives_json),
    result: parseStoredJsonField(row.result_json),
    replaySnapshot: parseStoredJsonField(row.replay_snapshot),
    metadata: parseStoredJsonField(row.metadata_json),
  }
}

export async function resolveAgentAuditPayload(
  row: Record<string, unknown>,
): Promise<AgentAuditPayloadBlob> {
  const remotePayload = await readAgentAuditPayload(
    typeof row.payload_r2_key === 'string' ? row.payload_r2_key : null,
  )

  if (remotePayload) {
    return remotePayload
  }

  return buildLegacyAgentAuditPayload(row)
}

