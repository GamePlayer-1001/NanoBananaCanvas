/**
 * [INPUT]: 依赖 @xyflow/react 的 Edge/Node 类型，依赖 @/types 的 PortDefinition/WorkflowNodeData/TemplateSummary/WorkflowAuditEntry
 * [OUTPUT]: 对外提供 AgentMode、AgentMessage、AgentPlan、CanvasSummary、Diagnosis/Explain 契约等 Agent 语义层共享类型
 * [POS]: lib/agent 的类型真相源，被 store、hooks、摘要器、校验器与 API route 共同消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Edge, Node } from '@xyflow/react'
import type {
  PortDefinition,
  TemplateSummary,
  WorkflowAuditEntry,
  WorkflowNodeData,
} from '@/types'

export type AgentMode =
  | 'create'
  | 'update'
  | 'repair'
  | 'diagnose'
  | 'optimize'
  | 'extend'
  | 'template'

export type AgentSessionStatus =
  | 'idle'
  | 'understanding'
  | 'planning'
  | 'comparing'
  | 'patch-ready'
  | 'awaiting-confirmation'
  | 'applying-patch'
  | 'ready-to-run'
  | 'running'
  | 'diagnosing'
  | 'optimizing'
  | 'replaying'
  | 'error'

export type AgentPlanIntent =
  | 'create_workflow'
  | 'adapt_template'
  | 'add_step'
  | 'split_step'
  | 'replace_model'
  | 'change_output_count'
  | 'add_branch'
  | 'repair_flow'
  | 'optimize_cost'
  | 'optimize_speed'
  | 'optimize_structure'
  | 'explain_flow'

export interface CanvasOptimizationSignals {
  aiNodeCount: number
  expensiveModelNodeIds: string[]
  slowNodeIds: string[]
  redundantNodeGroups: Array<{
    type: string
    nodeIds: string[]
  }>
  previewEnabledNodeIds: string[]
  missingDisplayNodeIds: string[]
  missingMergeCandidateNodeIds: string[]
  estimatedCostLevel: 'low' | 'medium' | 'high'
  estimatedLatencyLevel: 'low' | 'medium' | 'high'
}

export interface AgentSelectionContext {
  nodeId?: string
  nodeType?: string
  nodeLabel?: string
  inputs?: PortDefinition[]
  outputs?: PortDefinition[]
  keyConfig?: Record<string, unknown>
  latestResultSummary?: string
  latestResultKind?: 'image' | 'video' | 'audio' | 'text'
  executionStatus?: CanvasExecutionSummary['status']
  executionHint?: string
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
  targetNodeId?: string
  styleOptions?: AgentPromptStyleOption[]
}

export interface TemplateConversationSummary {
  sourceTemplate: TemplateSummary
  adaptationDirection?: string
  currentFocus?: string
  lastAuditEntry?: WorkflowAuditEntry
}

export type WorkflowOperation =
  | {
      type: 'add_node'
      nodeId?: string
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
      type: 'insert_between'
      source: string
      target: string
      nodeId?: string
      nodeType: string
      initialData?: Record<string, unknown>
      sourceHandle?: string
      targetHandle?: string
    }
  | {
      type: 'replace_node'
      nodeId: string
      nextNodeType: string
      configPatch?: Record<string, unknown>
      preserveConfigKeys?: string[]
    }
  | {
      type: 'duplicate_node_branch'
      nodeId: string
      count: number
      strategy?: 'parallel-variants' | 'style-variants'
    }
  | {
      type: 'batch_update_node_data'
      nodeIds: string[]
      patch: Record<string, unknown>
    }
  | {
      type: 'relabel_node'
      nodeId: string
      label: string
    }
  | {
      type: 'annotate_change'
      nodeId: string
      note: string
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
  intent?: AgentPlanIntent
  summary: string
  reasons: string[]
  requiresConfirmation: boolean
  operations: WorkflowOperation[]
  promptConfirmation?: PromptConfirmationPayload
  templateContext?: TemplateConversationSummary
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
      role: 'template-context'
      text: string
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
  selectionContext?: AgentSelectionContext
  nodes: CanvasSummaryNode[]
  disconnectedNodeIds: string[]
  displayMissingForNodeIds: string[]
  assets?: Array<{
    id: string
    kind: 'image' | 'video' | 'audio' | 'text'
    sourceNodeId: string
    summary: string
  }>
  latestSuccessfulAsset?: {
    id: string
    kind: 'image' | 'video' | 'audio' | 'text'
    sourceNodeId: string
    summary: string
  }
  latestExecution?: CanvasExecutionSummary
  template?: TemplateSummary
  auditTrail?: WorkflowAuditEntry[]
  templateContext?: TemplateConversationSummary
  optimizationSignals?: CanvasOptimizationSignals
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

export interface PromptConfirmationRequest {
  originalIntent: string
  executionPrompt?: string
  styleDirection?: string
  regenerate?: boolean
}

export interface PromptConfirmationResponse {
  payload: PromptConfirmationPayload
}

export interface AgentPlanValidationResult {
  ok: boolean
  requiresConfirmation: boolean
  errors: string[]
  warnings: string[]
}

export interface AgentDiagnosis {
  summary: string
  phenomenon: string
  rootCause: string
  repairSuggestion: string
  affectedNodeIds: string[]
  suggestedOperations?: WorkflowOperation[]
  requiresConfirmation: boolean
  dimension?: 'cost' | 'speed' | 'structure' | 'runtime'
  riskSummary?: string
  optimizationProposal?: {
    issue: string
    cause: string
    proposal: string
    risk: string
  }
}

export interface AgentDiagnosisRequest {
  userMessage: string
  canvasSummary: CanvasSummary
  locale: string
}

export interface AgentDiagnosisResponse {
  diagnosis: AgentDiagnosis
}

export interface AgentExplainRequest {
  userMessage: string
  canvasSummary: CanvasSummary
  locale: string
}

export interface AgentExplainResponse {
  answer: string
}

export type AgentCanvasNode = Node<WorkflowNodeData>
export type AgentCanvasEdge = Edge
