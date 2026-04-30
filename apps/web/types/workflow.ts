/**
 * [INPUT]: 依赖 @xyflow/react 的 Node/Edge 类型
 * [OUTPUT]: 对外提供 Workflow/WorkflowData/WorkflowNode/WorkflowEdge/TemplateSummary/WorkflowAuditEntry
 * [POS]: types 的工作流核心类型，被画布/列表/CRUD/Agent 模板改造链路共同消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Edge, Node } from '@xyflow/react'

/* ─── Workflow 实体 ─────────────────────────────────────── */

export interface Workflow {
  id: string
  name: string
  description?: string
  data: WorkflowData
  thumbnail?: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export interface WorkflowData {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  viewport?: { x: number; y: number; zoom: number }
  template?: TemplateSummary
  auditTrail?: WorkflowAuditEntry[]
}

export interface TemplateSummary {
  id: string
  key: string
  name: string
  description: string
  goal: string
  category: string
  targetAudience: string[]
  applicableIndustries: string[]
  recommendedStyles: string[]
  defaultPrompt?: string
  defaultModel?: string
  defaultOutputSpec?: {
    modality?: 'text' | 'image' | 'video' | 'audio' | 'mixed'
    count?: number
    aspectRatio?: string
  }
  source: 'system-template' | 'user-template'
  createdFromWorkflowId?: string
}

export interface WorkflowAuditEntry {
  id: string
  kind: 'template-created' | 'template-adapted'
  message: string
  createdAt: string
  actor: 'agent' | 'user'
  templateId?: string
  templateName?: string
  adaptationGoal?: string
}

/* ─── Canvas 节点/边 ────────────────────────────────────── */

export type WorkflowNode = Node<WorkflowNodeData>
export type WorkflowEdge = Edge

export type WorkflowNodeData = Record<string, unknown> & {
  label: string
  type: NodeCategory
  config: Record<string, unknown>
  status?: ExecutionStatus
}

export type NodeCategory =
  | 'input'
  | 'output'
  | 'ai-model'
  | 'transform'
  | 'condition'
  | 'loop'
  | 'api-call'
  | 'media'

export type ExecutionStatus =
  | 'idle'
  | 'queued'
  | 'running'
  | 'finalizing'
  | 'success'
  | 'error'
  | 'skipped'
