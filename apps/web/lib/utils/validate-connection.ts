/**
 * [INPUT]: 依赖 @xyflow/react 的 Connection/Edge/Node 类型，依赖 @/types 的 PortDefinition/WorkflowNodeData，
 *          依赖 @/components/nodes/plugin-registry 的 getNodePorts
 * [OUTPUT]: 对外提供 isValidConnection() 连接验证函数
 * [POS]: lib/utils 的连线验证器，被 Canvas 的 isValidConnection prop 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Connection, Edge, Node } from '@xyflow/react'
import type { PortDefinition, WorkflowNodeData } from '@/types'
import { getNodePorts } from '@/components/nodes/plugin-registry'

/* ─── Helpers ─────────────────────────────────────────── */

function findPort(
  nodeType: string,
  handleId: string,
  direction: 'inputs' | 'outputs',
): PortDefinition | undefined {
  const ports = getNodePorts(nodeType)
  return ports[direction].find((p) => p.id === handleId)
}

function areTypesCompatible(sourceType: string, targetType: string): boolean {
  if (sourceType === 'any' || targetType === 'any') return true
  return sourceType === targetType
}

function normalizeHandleId(handleId: string | null | undefined): string | null {
  return handleId ?? null
}

/* ─── Validator ──────────────────────────────────────── */

/**
 * 校验一条新连接是否合法
 *
 * 规则:
 * 1. 不能连接到自身
 * 2. 不能创建重复连线 (相同 source+target+handles)
 * 3. 输入端口只能被一条边占用 (多输入请使用 Merge 节点)
 * 4. 端口类型必须兼容 ('any' 接受所有类型，否则类型必须匹配)
 */
export function isValidConnection(
  connection: Connection | Edge,
  nodes: Node<WorkflowNodeData>[],
  edges: Edge[],
): boolean {
  const { source, target, sourceHandle, targetHandle } = connection
  const normalizedSourceHandle = normalizeHandleId(sourceHandle)
  const normalizedTargetHandle = normalizeHandleId(targetHandle)

  /* ── Rule 1: 禁止自连 ─────────────────────────────── */
  if (source === target) return false

  /* ── Rule 2: 禁止重复连线 ──────────────────────────── */
  const isDuplicate = edges.some(
    (e) =>
      e.source === source &&
      e.target === target &&
      normalizeHandleId(e.sourceHandle) === normalizedSourceHandle &&
      normalizeHandleId(e.targetHandle) === normalizedTargetHandle,
  )
  if (isDuplicate) return false

  /* ── Rule 3: 输入端口唯一 ─────────────────────────── */
  const isTargetPortOccupied = edges.some(
    (e) =>
      e.target === target && normalizeHandleId(e.targetHandle) === normalizedTargetHandle,
  )
  if (isTargetPortOccupied) return false

  /* ── Rule 4: 端口类型兼容 ──────────────────────────── */
  const sourceNode = nodes.find((n) => n.id === source)
  const targetNode = nodes.find((n) => n.id === target)
  if (!sourceNode?.type || !targetNode?.type) return false

  const sourcePort = findPort(sourceNode.type, normalizedSourceHandle ?? '', 'outputs')
  const targetPort = findPort(targetNode.type, normalizedTargetHandle ?? '', 'inputs')

  /* 未知端口类型时默认允许连接 (不阻塞用户操作) */
  if (!sourcePort || !targetPort) return true

  return areTypesCompatible(sourcePort.type, targetPort.type)
}
