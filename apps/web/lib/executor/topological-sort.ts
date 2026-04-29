/**
 * [INPUT]: 依赖 @xyflow/react 的 Node/Edge 类型，依赖 @/lib/errors 的 WorkflowError
 * [OUTPUT]: 对外提供 topologicalSort 函数 (DAG 拓扑排序 + 环检测 + 已就绪分支优先调度)
 * [POS]: lib/executor 的排序基石，被 WorkflowExecutor 消费以确定执行顺序，并尽量让独立分支先走通再切换
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Edge, Node } from '@xyflow/react'
import { ErrorCode, WorkflowError } from '@/lib/errors'

/* ─── Kahn's Algorithm (ready-branch priority) ───────── */

/**
 * 对 DAG 节点进行拓扑排序
 *
 * 与普通 Kahn BFS 不同，这里优先继续执行当前已打开分支，
 * 而不是先把所有同层根节点横向扫完。
 * 这样独立分支会更接近人类直觉的“文本 → 图片 → 展示”顺序，
 * 避免前一条分支明明已经成功却被另一条无关分支的失败拦在展示之前。
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

  /* ── 就绪栈: 从入度为 0 的节点开始，优先延续当前分支 ─ */
  const ready: string[] = []

  for (let index = nodes.length - 1; index >= 0; index -= 1) {
    const id = nodes[index]?.id
    if (id && (inDegree.get(id) ?? 0) === 0) {
      ready.push(id)
    }
  }

  const sorted: string[] = []

  while (ready.length > 0) {
    const current = ready.pop()!
    sorted.push(current)

    const released: string[] = []

    for (const neighbor of adjacency.get(current) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 1) - 1
      inDegree.set(neighbor, newDegree)
      if (newDegree === 0) released.push(neighbor)
    }

    for (let index = released.length - 1; index >= 0; index -= 1) {
      const neighbor = released[index]
      if (neighbor) ready.push(neighbor)
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
