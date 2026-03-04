/**
 * [INPUT]: 依赖 @xyflow/react 的 Node/Edge 类型，依赖 @/lib/errors 的 WorkflowError
 * [OUTPUT]: 对外提供 topologicalSort 函数 (DAG 拓扑排序 + 环检测)
 * [POS]: lib/executor 的排序基石，被 WorkflowExecutor 消费以确定执行顺序
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Edge, Node } from '@xyflow/react'
import { ErrorCode, WorkflowError } from '@/lib/errors'

/* ─── Kahn's Algorithm ───────────────────────────────── */

/**
 * 对 DAG 节点进行拓扑排序 (Kahn's BFS)
 *
 * @returns 按执行顺序排列的节点 ID 数组
 * @throws WorkflowError 当检测到环依赖时
 */
export function topologicalSort(nodes: Node[], edges: Edge[]): string[] {
  if (nodes.length === 0) return []

  /* ── 构建邻接表 + 入度表 ─────────────────────────── */
  const inDegree = new Map<string, number>()
  const adjacency = new Map<string, string[]>()

  for (const node of nodes) {
    inDegree.set(node.id, 0)
    adjacency.set(node.id, [])
  }

  for (const edge of edges) {
    const neighbors = adjacency.get(edge.source)
    if (neighbors) neighbors.push(edge.target)
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1)
  }

  /* ── BFS: 从入度为 0 的节点开始 ─────────────────── */
  const queue: string[] = []

  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id)
  }

  const sorted: string[] = []

  while (queue.length > 0) {
    const current = queue.shift()!
    sorted.push(current)

    for (const neighbor of adjacency.get(current) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 1) - 1
      inDegree.set(neighbor, newDegree)
      if (newDegree === 0) queue.push(neighbor)
    }
  }

  /* ── 环检测：排序结果数量 ≠ 节点数量 → 有环 ────── */
  if (sorted.length !== nodes.length) {
    const cycleNodes = nodes
      .filter((n) => !sorted.includes(n.id))
      .map((n) => n.id)

    throw new WorkflowError(
      ErrorCode.WORKFLOW_CYCLE_DETECTED,
      'Circular dependency detected in workflow',
      { cycleNodes },
    )
  }

  return sorted
}
