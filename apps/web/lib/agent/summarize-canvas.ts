/**
 * [INPUT]: 依赖 @/components/nodes/plugin-registry 的节点元数据，依赖 @/stores/use-flow-store 与 @/stores/use-execution-store 的当前真相源
 * [OUTPUT]: 对外提供 summarizeCanvas()，把节点、连线、执行态和选中语境压缩成稳定 CanvasSummary
 * [POS]: lib/agent 的画布摘要器，被 use-agent-session 与后续诊断/解释 API 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { getNodeMeta, getNodePorts } from '@/components/nodes/plugin-registry'
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
}

export function summarizeCanvas({
  workflowId,
  workflowName,
  nodes = useFlowStore.getState().nodes,
  edges = useFlowStore.getState().edges,
}: SummarizeCanvasOptions): CanvasSummary {
  const execution = useExecutionStore.getState()
  const selectedNode = nodes.find((node) => node.selected)

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

