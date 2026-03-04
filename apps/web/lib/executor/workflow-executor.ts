/**
 * [INPUT]: 依赖 ./topological-sort 的排序能力，依赖 ./node-executor 的节点执行，
 *          依赖 @/stores/use-flow-store 和 @/stores/use-execution-store 的状态读写，
 *          依赖 @/lib/errors 的 WorkflowError，依赖 @/lib/logger
 * [OUTPUT]: 对外提供 WorkflowExecutor 类 (完整工作流执行编排)
 * [POS]: lib/executor 的顶层编排器，被 hooks/use-workflow-executor 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Edge, Node } from '@xyflow/react'
import { isAppError } from '@/lib/errors'
import { createLogger } from '@/lib/logger'
import type { WorkflowNodeData } from '@/types'
import { executeNode } from './node-executor'
import { topologicalSort } from './topological-sort'

const log = createLogger('WorkflowExecutor')

/* ─── Types ──────────────────────────────────────────── */

export interface ExecutionCallbacks {
  onStart: (order: string[]) => void
  onNodeStart: (nodeId: string) => void
  onNodeComplete: (nodeId: string, outputs: Record<string, unknown>) => void
  onNodeError: (nodeId: string, error: string) => void
  onStreamChunk: (nodeId: string, chunk: string) => void
  onComplete: () => void
  onError: (error: string) => void
  updateNodeStatus: (nodeId: string, status: WorkflowNodeData['status']) => void
}

/* ─── Executor ───────────────────────────────────────── */

export class WorkflowExecutor {
  private abortController: AbortController | null = null

  /* ── 全流程执行 (EXEC-005) ──────────────────────── */

  async execute(
    nodes: Node<WorkflowNodeData>[],
    edges: Edge[],
    apiKey: string,
    callbacks: ExecutionCallbacks,
  ): Promise<void> {
    /* ── 前置校验 ─────────────────────────────────── */
    if (nodes.length === 0) {
      callbacks.onError('Workflow is empty')
      return
    }

    /* ── 中断控制器 (EXEC-007) ────────────────────── */
    this.abortController = new AbortController()
    const { signal } = this.abortController

    /* ── 拓扑排序 (EXEC-001) ─────────────────────── */
    let order: string[]
    try {
      order = topologicalSort(nodes, edges)
    } catch (err) {
      const msg = isAppError(err) ? err.message : 'Failed to sort workflow'
      callbacks.onError(msg)
      return
    }

    log.info('Execution plan', { order })
    callbacks.onStart(order)

    /* ── 重置所有节点状态 ─────────────────────────── */
    for (const nodeId of order) {
      callbacks.updateNodeStatus(nodeId, 'idle')
    }

    /* ── 节点结果缓存 (端口级) ────────────────────── */
    const nodeOutputs: Record<string, Record<string, unknown>> = {}

    /* ── 按拓扑序逐节点执行 ──────────────────────── */
    for (const nodeId of order) {
      if (signal.aborted) {
        callbacks.onError('Execution aborted')
        return
      }

      const node = nodes.find((n) => n.id === nodeId)
      if (!node) continue

      /* ── 收集输入 (EXEC-003) ─────────────────── */
      const inputs = this.collectInputs(nodeId, edges, nodeOutputs)

      /* ── 标记节点执行中 (EXEC-006) ───────────── */
      callbacks.onNodeStart(nodeId)
      callbacks.updateNodeStatus(nodeId, 'running')

      try {
        /* ── 执行节点 (EXEC-004) ─────────────── */
        const result = await executeNode({
          nodeId,
          nodeType: node.type ?? 'unknown',
          data: node.data as WorkflowNodeData,
          inputs,
          apiKey,
          signal,
          onStreamChunk: callbacks.onStreamChunk,
        })

        /* ── 缓存输出 + 更新状态 ─────────────── */
        nodeOutputs[nodeId] = result.outputs
        callbacks.onNodeComplete(nodeId, result.outputs)
        callbacks.updateNodeStatus(nodeId, 'success')

        log.debug('Node completed', { nodeId, outputKeys: Object.keys(result.outputs) })
      } catch (err) {
        /* ── 错误处理 (EXEC-008) ─────────────── */
        if (signal.aborted) {
          callbacks.updateNodeStatus(nodeId, 'error')
          callbacks.onError('Execution aborted')
          return
        }

        const errorMsg = err instanceof Error ? err.message : String(err)
        log.error('Node execution failed', { nodeId, error: errorMsg })

        callbacks.onNodeError(nodeId, errorMsg)
        callbacks.updateNodeStatus(nodeId, 'error')

        // 标记下游节点为 skipped
        this.skipDownstream(nodeId, order, edges, callbacks)

        callbacks.onError(`Node "${(node.data as WorkflowNodeData).label}" failed: ${errorMsg}`)
        return
      }
    }

    /* ── 执行完毕 ─────────────────────────────────── */
    callbacks.onComplete()
    this.abortController = null
    log.info('Execution completed successfully')
  }

  /* ── 中断执行 (EXEC-007) ────────────────────────── */

  abort(): void {
    if (this.abortController) {
      log.info('Aborting execution')
      this.abortController.abort()
      this.abortController = null
    }
  }

  /* ── 是否正在执行 ──────────────────────────────── */

  get isRunning(): boolean {
    return this.abortController !== null
  }

  /* ── 输入收集 (EXEC-003) ────────────────────────── */

  private collectInputs(
    nodeId: string,
    edges: Edge[],
    nodeOutputs: Record<string, Record<string, unknown>>,
  ): Record<string, unknown> {
    const inputs: Record<string, unknown> = {}

    // 找到所有指向当前节点的边
    const incomingEdges = edges.filter((e) => e.target === nodeId)

    for (const edge of incomingEdges) {
      const sourceOutputs = nodeOutputs[edge.source]
      if (!sourceOutputs) continue

      // sourceHandle = 上游输出端口 ID, targetHandle = 当前输入端口 ID
      const sourcePort = edge.sourceHandle
      const targetPort = edge.targetHandle

      if (sourcePort && targetPort && sourcePort in sourceOutputs) {
        inputs[targetPort] = sourceOutputs[sourcePort]
      }
    }

    return inputs
  }

  /* ── 标记下游节点跳过 ──────────────────────────── */

  private skipDownstream(
    failedNodeId: string,
    order: string[],
    edges: Edge[],
    callbacks: ExecutionCallbacks,
  ): void {
    const failedIndex = order.indexOf(failedNodeId)
    const downstream = new Set<string>()

    // BFS 找所有下游节点
    const queue = [failedNodeId]
    while (queue.length > 0) {
      const current = queue.shift()!
      for (const edge of edges) {
        if (edge.source === current && !downstream.has(edge.target)) {
          downstream.add(edge.target)
          queue.push(edge.target)
        }
      }
    }

    // 只标记排序中在失败节点之后的下游
    for (let i = failedIndex + 1; i < order.length; i++) {
      if (downstream.has(order[i])) {
        callbacks.updateNodeStatus(order[i], 'skipped')
      }
    }
  }
}
