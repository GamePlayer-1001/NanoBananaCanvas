/**
 * [INPUT]: 依赖 @/components/nodes/plugin-registry 的节点元数据，依赖 @/stores/use-flow-store 与 @/stores/use-execution-store 的当前真相源
 * [OUTPUT]: 对外提供 summarizeCanvas()，把节点、连线、执行态、模板上下文与选中语境压缩成稳定 CanvasSummary
 * [POS]: lib/agent 的画布摘要器，被 use-agent-session 与后续诊断/解释 API 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { getNodeMeta, getNodePorts } from '@/components/nodes/plugin-registry'
import type { TemplateSummary, WorkflowAuditEntry } from '@/types'
import { useExecutionStore } from '@/stores/use-execution-store'
import { useFlowStore } from '@/stores/use-flow-store'
import type {
  AgentCanvasEdge,
  AgentCanvasNode,
  CanvasExecutionSummary,
  CanvasSummary,
} from './types'
import {
  AGENT_CONFIG_SUMMARY_KEYS,
  AGENT_MAX_CONFIG_KEYS,
  AGENT_MAX_SUMMARY_NODES,
  AGENT_MAX_SUMMARY_TEXT_LENGTH,
} from './constants'

interface SummarizeCanvasOptions {
  workflowId: string
  workflowName?: string
  nodes?: AgentCanvasNode[]
  edges?: AgentCanvasEdge[]
  template?: TemplateSummary
  auditTrail?: WorkflowAuditEntry[]
}

export function summarizeCanvas({
  workflowId,
  workflowName,
  nodes = useFlowStore.getState().nodes,
  edges = useFlowStore.getState().edges,
  template,
  auditTrail = [],
}: SummarizeCanvasOptions): CanvasSummary {
  const execution = useExecutionStore.getState()
  const selectedNode = nodes.find((node) => node.selected)
  const lastAuditEntry = auditTrail.at(-1)
  const optimizationSignals = buildOptimizationSignals(nodes, edges)

  return {
    workflowId,
    workflowName,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    selectedNodeId: selectedNode?.id,
    selectedNodeType: selectedNode?.type,
    selectedNodeLabel: getNodeLabel(selectedNode),
    nodes: nodes.slice(0, AGENT_MAX_SUMMARY_NODES).map((node) => ({
      id: node.id,
      type: node.type ?? 'unknown',
      label: getNodeLabel(node),
      inputs: getNodePorts(node.type ?? '').inputs,
      outputs: getNodePorts(node.type ?? '').outputs,
      configSummary: summarizeNodeConfig(node.data?.config),
    })),
    disconnectedNodeIds: nodes
      .filter((node) => isDisconnectedNode(node.id, edges))
      .map((node) => node.id),
    displayMissingForNodeIds: nodes
      .filter((node) => needsDisplayButHasNoConsumer(node.id, node.type ?? '', edges))
      .map((node) => node.id),
    latestExecution: summarizeExecution(execution),
    template,
    auditTrail,
    optimizationSignals,
    templateContext: template
      ? {
          sourceTemplate: template,
          adaptationDirection: lastAuditEntry?.adaptationGoal,
          currentFocus: selectedNode ? getNodeLabel(selectedNode) : template.goal,
          lastAuditEntry,
        }
      : undefined,
  }
}

function getNodeLabel(node?: AgentCanvasNode): string {
  if (!node) return ''
  const rawLabel = node.data?.label
  if (typeof rawLabel === 'string' && rawLabel.trim()) return rawLabel
  return getNodeMeta(node.type ?? '')?.label ?? node.type ?? 'Unknown Node'
}

function summarizeNodeConfig(config: unknown): Record<string, unknown> {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return {}
  }

  const entries = Object.entries(config)
    .filter(([key, value]) => AGENT_CONFIG_SUMMARY_KEYS.includes(key as never) || isUsefulPrimitive(value))
    .slice(0, AGENT_MAX_CONFIG_KEYS)

  return Object.fromEntries(entries.map(([key, value]) => [key, compressValue(value)]))
}

function isUsefulPrimitive(value: unknown): boolean {
  return ['string', 'number', 'boolean'].includes(typeof value)
}

function compressValue(value: unknown): unknown {
  if (typeof value === 'string') {
    const normalized = value.replace(/\s+/g, ' ').trim()
    return normalized.length > AGENT_MAX_SUMMARY_TEXT_LENGTH
      ? `${normalized.slice(0, AGENT_MAX_SUMMARY_TEXT_LENGTH)}...`
      : normalized
  }

  if (Array.isArray(value)) {
    return value.slice(0, 4).map((item) => compressValue(item))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .slice(0, 4)
        .map(([key, child]) => [key, compressValue(child)]),
    )
  }

  return value
}

function isDisconnectedNode(nodeId: string, edges: AgentCanvasEdge[]) {
  return !edges.some((edge) => edge.source === nodeId || edge.target === nodeId)
}

function needsDisplayButHasNoConsumer(nodeId: string, nodeType: string, edges: AgentCanvasEdge[]) {
  const meta = getNodeMeta(nodeType)
  if (!meta || meta.category !== 'ai-model') return false
  return !edges.some((edge) => edge.source === nodeId)
}

function summarizeExecution(execution: ReturnType<typeof useExecutionStore.getState>): CanvasExecutionSummary {
  if (execution.isExecuting) {
    return {
      status: 'running',
      failedNodeId: execution.currentNodeId ?? undefined,
    }
  }

  if (execution.error) {
    return {
      status: 'failed',
      failedNodeId: execution.currentNodeId ?? undefined,
      failedReason: execution.error,
    }
  }

  if (Object.keys(execution.nodeResults).length > 0) {
    return {
      status: 'completed',
    }
  }

  return {
    status: 'idle',
  }
}

function buildOptimizationSignals(nodes: AgentCanvasNode[], edges: AgentCanvasEdge[]) {
  const aiNodes = nodes.filter((node) => ['llm', 'image-gen', 'video-gen', 'audio-gen'].includes(node.type ?? ''))
  const expensiveModelNodeIds = aiNodes
    .filter((node) => isExpensiveModel(node.data?.config))
    .map((node) => node.id)
  const slowNodeIds = aiNodes
    .filter((node) => isSlowNode(node))
    .map((node) => node.id)
  const previewEnabledNodeIds = aiNodes
    .filter((node) => node.data?.config && (node.data.config as Record<string, unknown>).showPreview === true)
    .map((node) => node.id)
  const missingDisplayNodeIds = nodes
    .filter((node) => needsDisplayButHasNoConsumer(node.id, node.type ?? '', edges))
    .map((node) => node.id)
  const redundantNodeGroups = findRedundantNodeGroups(aiNodes)
  const missingMergeCandidateNodeIds = findMissingMergeCandidates(nodes, edges)

  return {
    aiNodeCount: aiNodes.length,
    expensiveModelNodeIds,
    slowNodeIds,
    redundantNodeGroups,
    previewEnabledNodeIds,
    missingDisplayNodeIds,
    missingMergeCandidateNodeIds,
    estimatedCostLevel:
      expensiveModelNodeIds.length >= 2 || previewEnabledNodeIds.length >= 2 ? 'high'
      : expensiveModelNodeIds.length >= 1 ? 'medium'
      : 'low',
    estimatedLatencyLevel:
      slowNodeIds.length >= 2 || aiNodes.length >= 5 ? 'high'
      : slowNodeIds.length >= 1 || aiNodes.length >= 3 ? 'medium'
      : 'low',
  } as const
}

function isExpensiveModel(config: unknown) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) return false
  const modelId = String((config as Record<string, unknown>).platformModel ?? '')
  return ['gpt-4o', 'dall-e-3', 'flux-pro', 'kling-v2-0', 'gemini-2.5-pro'].some((keyword) =>
    modelId.includes(keyword),
  )
}

function isSlowNode(node: AgentCanvasNode) {
  const type = node.type ?? ''
  const config = node.data?.config
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return type === 'video-gen'
  }

  const modelId = String((config as Record<string, unknown>).platformModel ?? '')
  const duration = String((config as Record<string, unknown>).duration ?? '')
  return (
    type === 'video-gen' ||
    modelId.includes('gemini-2.5-pro') ||
    modelId.includes('flux-pro') ||
    duration === '10'
  )
}

function findRedundantNodeGroups(nodes: AgentCanvasNode[]) {
  const groups = new Map<string, string[]>()

  for (const node of nodes) {
    const config = node.data?.config
    const normalizedPrompt =
      config && typeof config === 'object' && !Array.isArray(config)
        ? String((config as Record<string, unknown>).text ?? (config as Record<string, unknown>).prompt ?? '')
            .replace(/\s+/g, ' ')
            .trim()
        : ''
    const key = `${node.type ?? 'unknown'}::${normalizedPrompt}`
    const current = groups.get(key) ?? []
    current.push(node.id)
    groups.set(key, current)
  }

  return Array.from(groups.entries())
    .filter(([, nodeIds]) => nodeIds.length >= 2)
    .map(([key, nodeIds]) => ({
      type: key.split('::')[0] ?? 'unknown',
      nodeIds,
    }))
}

function findMissingMergeCandidates(nodes: AgentCanvasNode[], edges: AgentCanvasEdge[]) {
  const incomingCounts = new Map<string, number>()
  for (const edge of edges) {
    incomingCounts.set(edge.target, (incomingCounts.get(edge.target) ?? 0) + 1)
  }

  return nodes
    .filter((node) => ['display', 'image-gen', 'video-gen', 'audio-gen'].includes(node.type ?? ''))
    .filter((node) => (incomingCounts.get(node.id) ?? 0) >= 2)
    .filter((node) => !['text-merge', 'image-merge'].includes(node.type ?? ''))
    .map((node) => node.id)
}
