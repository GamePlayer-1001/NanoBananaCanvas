/**
 * [INPUT]: 依赖 @xyflow/react 的 Node/Edge/Viewport，依赖 @/types 的 WorkflowNodeData/TemplateSummary/WorkflowAuditEntry
 * [OUTPUT]: 对外提供 serializeWorkflow / deserializeWorkflow (JSON 双向转换)
 * [POS]: services/storage 的序列化核心，被 localStorage 自动保存、导入导出与模板上下文持久化消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Edge, Node, Viewport } from '@xyflow/react'
import type { TemplateSummary, WorkflowAuditEntry, WorkflowNodeData } from '@/types'

/* ─── Serialized Format ──────────────────────────────── */

export interface SerializedWorkflow {
  version: 1
  name: string
  nodes: SerializedNode[]
  edges: SerializedEdge[]
  viewport: Viewport
  template?: TemplateSummary
  auditTrail?: WorkflowAuditEntry[]
  savedAt: string
}

interface SerializedNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: WorkflowNodeData
}

interface SerializedEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string | null
  targetHandle?: string | null
  type?: string
}

/* ─── Serialize (DATA-001) ───────────────────────────── */

export function serializeWorkflow(
  nodes: Node<WorkflowNodeData>[],
  edges: Edge[],
  viewport: Viewport,
  name = 'Untitled Workflow',
  metadata?: {
    template?: TemplateSummary
    auditTrail?: WorkflowAuditEntry[]
  },
): SerializedWorkflow {
  return {
    version: 1,
    name,
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.type ?? 'unknown',
      position: n.position,
      data: stripRuntimeState(n.data as WorkflowNodeData),
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      type: e.type,
    })),
    viewport,
    template: metadata?.template,
    auditTrail: metadata?.auditTrail,
    savedAt: new Date().toISOString(),
  }
}

/* ─── Deserialize (DATA-002) ─────────────────────────── */

export function deserializeWorkflow(json: unknown): {
  nodes: Node<WorkflowNodeData>[]
  edges: Edge[]
  viewport: Viewport
  name: string
  template?: TemplateSummary
  auditTrail?: WorkflowAuditEntry[]
} {
  const data = json as SerializedWorkflow

  if (!data || typeof data !== 'object' || data.version !== 1) {
    throw new Error('Invalid workflow format')
  }

  if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
    throw new Error('Invalid workflow: missing nodes or edges')
  }

  const nodes: Node<WorkflowNodeData>[] = data.nodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: { ...n.data, status: 'idle' as const },
  }))

  const edges: Edge[] = data.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    type: e.type ?? 'custom',
  }))

  const viewport: Viewport = data.viewport ?? { x: 0, y: 0, zoom: 1 }

  return {
    nodes,
    edges,
    viewport,
    name: data.name ?? 'Untitled Workflow',
    template: data.template,
    auditTrail: data.auditTrail,
  }
}

/* ─── Internal ───────────────────────────────────────── */

/** 清除运行时状态 (status/output)，只保留用户配置 */
function stripRuntimeState(data: WorkflowNodeData): WorkflowNodeData {
  return {
    ...data,
    status: 'idle',
    config: stripOutputFromConfig(data.config),
  }
}

function stripOutputFromConfig(config: Record<string, unknown>): Record<string, unknown> {
  const cleaned = { ...config }
  delete cleaned.output
  delete cleaned.content
  return cleaned
}
