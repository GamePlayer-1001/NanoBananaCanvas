/**
 * [INPUT]: 依赖 @xyflow/react 的 Node/Edge 类型
 * [OUTPUT]: 对外提供 Workflow/WorkflowData/WorkflowNode/WorkflowEdge
 * [POS]: types 的工作流核心类型，被画布/列表/CRUD 模块消费
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
  authorId: string
}

export interface WorkflowData {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  viewport?: { x: number; y: number; zoom: number }
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

export type ExecutionStatus = 'idle' | 'running' | 'success' | 'error' | 'skipped'
