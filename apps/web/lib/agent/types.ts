/**
 * [INPUT]: 依赖 @xyflow/react 的 Edge/Node 类型，依赖 @/types 的 PortDefinition/WorkflowNodeData
 * [OUTPUT]: 对外提供 AgentMode、AgentMessage、AgentPlan、CanvasSummary、AgentPlanRequest 等 Agent 语义层共享类型
 * [POS]: lib/agent 的类型真相源，被 store、hooks、摘要器、校验器与 API route 共同消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Edge, Node } from '@xyflow/react'
import type { PortDefinition, WorkflowNodeData } from '@/types'

export type AgentMode = 'create' | 'update' | 'diagnose' | 'optimize'

export type AgentSessionStatus =
  | 'idle'
  | 'understanding'
  | 'planning'
  | 'patch-ready'
  | 'awaiting-confirmation'
  | 'applying-patch'
  | 'ready-to-run'
  | 'running'
  | 'diagnosing'
  | 'error'

export interface AgentSelectionContext {
  nodeId?: string
  nodeType?: string
  nodeLabel?: string
}

export interface AgentPromptStyleOption {
  id: string
  label: string
  promptDelta: string
}

export interface PromptConfirmationPayload {
  id: string
  originalIntent: string
  visualProposal: string
  executionPrompt: string
  styleOptions?: AgentPromptStyleOption[]
}

export type WorkflowOperation =
  | {
      type: 'add_node'
      nodeType: string
      position?: { x: number; y: number }
      initialData?: Record<string, unknown>
    }
  | {
      type: 'update_node_data'
      nodeId: string
      patch: Record<string, unknown>
    }
  | {
      type: 'remove_node'
      nodeId: string
    }
  | {
      type: 'connect'
      source: string
      sourceHandle?: string
      target: string
      targetHandle?: string
    }
  | {
      type: 'disconnect'
      edgeId: string
    }
  | {
      type: 'focus_nodes'
      nodeIds: string[]
    }
  | {
      type: 'request_prompt_confirmation'
      payload: PromptConfirmationPayload
    }
  | {
      type: 'run_workflow'
      scope?: 'all' | 'from-node'
      nodeId?: string
    }

export interface AgentPlan {
  id: string
  goal: string
  mode: AgentMode
  summary: string
  reasons: string[]
  requiresConfirmation: boolean
  operations: WorkflowOperation[]
  promptConfirmation?: PromptConfirmationPayload
}

export type AgentMessage =
  | {
      id: string
      role: 'user'
      text: string
      createdAt: string
    }
  | {
      id: string
      role: 'assistant'
      text: string
      createdAt: string
    }
  | {
      id: string
      role: 'process'
      text: string
      step?: string
      createdAt: string
    }
  | {
      id: string
      role: 'proposal'
      planId: string
      createdAt: string
    }
  | {
      id: string
      role: 'prompt-confirmation'
      payloadId: string
      createdAt: string
    }
  | {
      id: string
      role: 'diagnosis'
      text: string
      severity: 'info' | 'warning' | 'error'
      createdAt: string
    }

export interface CanvasSummaryNode {
  id: string
  type: string
  label: string
  inputs: PortDefinition[]
  outputs: PortDefinition[]
  configSummary: Record<string, unknown>
}

export interface CanvasExecutionSummary {
  status: 'idle' | 'running' | 'completed' | 'failed'
  failedNodeId?: string
  failedReason?: string
}

export interface CanvasSummary {
  workflowId: string
  workflowName?: string
  nodeCount: number
  edgeCount: number
  selectedNodeId?: string
  selectedNodeType?: string
  selectedNodeLabel?: string
  nodes: CanvasSummaryNode[]
  disconnectedNodeIds: string[]
  displayMissingForNodeIds: string[]
  latestExecution?: CanvasExecutionSummary
}

export interface AgentPlanRequest {
  userMessage: string
  mode: AgentMode
  canvasSummary: CanvasSummary
  locale: string
}

export interface AgentPlanResponse {
  plan: AgentPlan
}

export interface AgentPlanValidationResult {
  ok: boolean
  requiresConfirmation: boolean
  errors: string[]
  warnings: string[]
}

export type AgentCanvasNode = Node<WorkflowNodeData>
export type AgentCanvasEdge = Edge
