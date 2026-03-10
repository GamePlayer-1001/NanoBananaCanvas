/**
 * [INPUT]: 依赖 @xyflow/react 的 Connection/Edge/Node 类型，依赖 @/types 的 PortDefinition/WorkflowNodeData
 * [OUTPUT]: 对外提供 isValidConnection() 连接验证函数，NODE_PORT_TYPES 端口类型注册表
 * [POS]: lib/utils 的连线验证器，被 Canvas 的 isValidConnection prop 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Connection, Edge, Node } from '@xyflow/react'
import type { PortDefinition, WorkflowNodeData } from '@/types'

/* ─── Port Type Registry ─────────────────────────────── */

/**
 * MVP 节点的端口类型定义
 *
 * 每个节点类型声明其 inputs/outputs 的端口 ID 和类型，
 * 用于连接时的类型兼容性校验
 */
export const NODE_PORT_TYPES: Record<string, { inputs: PortDefinition[]; outputs: PortDefinition[] }> = {
  'text-input': {
    inputs: [],
    outputs: [{ id: 'text-out', label: 'Text', type: 'string' }],
  },
  llm: {
    inputs: [{ id: 'prompt-in', label: 'Prompt', type: 'string', required: true }],
    outputs: [{ id: 'text-out', label: 'Response', type: 'string' }],
  },
  display: {
    inputs: [{ id: 'content-in', label: 'Content', type: 'any', required: true }],
    outputs: [],
  },
  'image-gen': {
    inputs: [{ id: 'prompt-in', label: 'Prompt', type: 'string', required: true }],
    outputs: [{ id: 'image-out', label: 'Image', type: 'image' }],
  },
  'video-gen': {
    inputs: [
      { id: 'prompt-in', label: 'Prompt', type: 'string', required: true },
      { id: 'image-in', label: 'Image', type: 'image' },
    ],
    outputs: [{ id: 'video-out', label: 'Video', type: 'video' }],
  },
  'audio-gen': {
    inputs: [{ id: 'text-in', label: 'Text', type: 'string', required: true }],
    outputs: [{ id: 'audio-out', label: 'Audio', type: 'audio' }],
  },
  conditional: {
    inputs: [{ id: 'value-in', label: 'Value', type: 'any', required: true }],
    outputs: [
      { id: 'true-out', label: 'True', type: 'any' },
      { id: 'false-out', label: 'False', type: 'any' },
    ],
  },
  loop: {
    inputs: [{ id: 'items-in', label: 'Items', type: 'any', required: true }],
    outputs: [
      { id: 'item-out', label: 'Item', type: 'any' },
      { id: 'index-out', label: 'Index', type: 'number' },
      { id: 'results-out', label: 'Results', type: 'any' },
    ],
  },
}

/* ─── Helpers ─────────────────────────────────────────── */

function findPort(nodeType: string, handleId: string, direction: 'inputs' | 'outputs'): PortDefinition | undefined {
  const ports = NODE_PORT_TYPES[nodeType]
  if (!ports) return undefined
  return ports[direction].find((p) => p.id === handleId)
}

function areTypesCompatible(sourceType: string, targetType: string): boolean {
  if (sourceType === 'any' || targetType === 'any') return true
  return sourceType === targetType
}

/* ─── Validator ──────────────────────────────────────── */

/**
 * 校验一条新连接是否合法
 *
 * 规则:
 * 1. 不能连接到自身
 * 2. 不能创建重复连线 (相同 source+target+handles)
 * 3. 端口类型必须兼容 ('any' 接受所有类型，否则类型必须匹配)
 */
export function isValidConnection(
  connection: Connection,
  nodes: Node<WorkflowNodeData>[],
  edges: Edge[],
): boolean {
  const { source, target, sourceHandle, targetHandle } = connection

  /* ── Rule 1: 禁止自连 ─────────────────────────────── */
  if (source === target) return false

  /* ── Rule 2: 禁止重复连线 ──────────────────────────── */
  const isDuplicate = edges.some(
    (e) =>
      e.source === source &&
      e.target === target &&
      e.sourceHandle === sourceHandle &&
      e.targetHandle === targetHandle,
  )
  if (isDuplicate) return false

  /* ── Rule 3: 端口类型兼容 ──────────────────────────── */
  const sourceNode = nodes.find((n) => n.id === source)
  const targetNode = nodes.find((n) => n.id === target)
  if (!sourceNode?.type || !targetNode?.type) return false

  const sourcePort = findPort(sourceNode.type, sourceHandle ?? '', 'outputs')
  const targetPort = findPort(targetNode.type, targetHandle ?? '', 'inputs')

  /* 未知端口类型时默认允许连接 (不阻塞用户操作) */
  if (!sourcePort || !targetPort) return true

  return areTypesCompatible(sourcePort.type, targetPort.type)
}
