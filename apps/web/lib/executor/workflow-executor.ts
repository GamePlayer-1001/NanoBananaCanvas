/**
 * [INPUT]: 依赖 ./topological-sort 的排序能力，依赖 ./node-executor 的节点执行，
 *          依赖 @/lib/errors 的 WorkflowError，依赖 @/lib/logger
 * [OUTPUT]: 对外提供 WorkflowExecutor 类 (完整工作流执行编排，支持从指定节点起跑)
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
  updateNodeConfig: (nodeId: string, patch: Record<string, unknown>) => void
}

/* ─── Executor ───────────────────────────────────────── */

export class WorkflowExecutor {
  private abortController: AbortController | null = null

  /* ── 全流程执行 ──────────────────────────────────── */

  async execute(
    nodes: Node<WorkflowNodeData>[],
    edges: Edge[],
    workflowId: string | undefined,
    callbacks: ExecutionCallbacks,
    startNodeId?: string,
  ): Promise<void> {
    if (nodes.length === 0) {
      callbacks.onError('Workflow is empty')
      return
    }

    this.abortController = new AbortController()
    const { signal } = this.abortController

    /* ── 拓扑排序 ──────────────────────────────────── */
    let order: string[]
    try {
      order = topologicalSort(nodes, edges)
    } catch (err) {
      callbacks.onError(isAppError(err) ? err.message : 'Failed to sort workflow')
      return
    }

    if (startNodeId) {
      const reachableNodeIds = this.findReachableNodes(startNodeId, edges)
      if (!reachableNodeIds.has(startNodeId)) {
        callbacks.onError(`Start node "${startNodeId}" is not reachable`)
        return
      }
      order = order.filter((nodeId) => reachableNodeIds.has(nodeId))
    }

    log.info('Execution plan', { order })
    callbacks.onStart(order)

    for (const nodeId of order) {
      callbacks.updateNodeStatus(nodeId, 'idle')
    }

    /* ── 执行状态 ──────────────────────────────────── */
    const nodeOutputs: Record<string, Record<string, unknown>> = {}
    const skippedNodes = new Set<string>()

    /* ── 按拓扑序逐节点执行 ────────────────────────── */
    for (let orderIndex = 0; orderIndex < order.length; orderIndex++) {
      const nodeId = order[orderIndex]
      if (signal.aborted) {
        callbacks.onError('Execution aborted')
        return
      }

      /* 跳过被条件分支/循环标记的节点 */
      if (skippedNodes.has(nodeId)) continue

      const node = nodes.find((n) => n.id === nodeId)
      if (!node) continue

      const inputs = this.collectInputs(nodeId, edges, nodeOutputs)

      callbacks.onNodeStart(nodeId)
      callbacks.updateNodeStatus(nodeId, 'running')

      try {
        const result = await executeNode({
          nodeId,
          workflowId,
          nodeType: node.type ?? 'unknown',
          data: node.data as WorkflowNodeData,
          inputs,
          signal,
          onStreamChunk: callbacks.onStreamChunk,
          onTaskStateChange: (change) => {
            if (change.status) {
              callbacks.updateNodeStatus(nodeId, change.status)
            }
            if (change.configPatch) {
              callbacks.updateNodeConfig(nodeId, change.configPatch)
            }
          },
        })

        nodeOutputs[nodeId] = result.outputs
        callbacks.onNodeComplete(nodeId, result.outputs)
        callbacks.updateNodeStatus(nodeId, 'success')

        /* ── 条件分支: 跳过 null 端口的独占下游 ── */
        if (node.type === 'conditional') {
          this.handleConditionalSkip(nodeId, result.outputs, edges, skippedNodes, callbacks)
        }

        /* ── 循环: 迭代执行 body 子图 ───────────── */
        if (node.type === 'loop' && '__loop_items' in result.outputs) {
          const items = result.outputs.__loop_items as unknown[]
          const bodyResults = await this.executeLoopBody(
            nodeId, items, nodes, edges, order, workflowId, signal, nodeOutputs, skippedNodes, callbacks,
          )
          nodeOutputs[nodeId] = { ...result.outputs, 'results-out': bodyResults }
          callbacks.onNodeComplete(nodeId, nodeOutputs[nodeId])
        }

        log.debug('Node completed', { nodeId, outputKeys: Object.keys(result.outputs) })
      } catch (err) {
        if (signal.aborted) {
          callbacks.updateNodeStatus(nodeId, 'error')
          callbacks.onError('Execution aborted')
          return
        }

        const errorMsg = err instanceof Error ? err.message : String(err)
        log.error('Node execution failed', err, {
          nodeId,
          nodeType: node.type ?? 'unknown',
          workflowId: workflowId ?? null,
          executionOrderIndex: orderIndex,
          error: errorMsg,
        })

        callbacks.onNodeError(nodeId, errorMsg)
        callbacks.updateNodeStatus(nodeId, 'error')
        this.skipDownstream(nodeId, order, edges, callbacks)

        callbacks.onError(`Node "${(node.data as WorkflowNodeData).label}" failed: ${errorMsg}`)
        return
      }
    }

    callbacks.onComplete()
    this.abortController = null
    log.info('Execution completed successfully')
  }

  /* ── 中断执行 ──────────────────────────────────────── */

  abort(): void {
    if (this.abortController) {
      log.info('Aborting execution')
      this.abortController.abort()
      this.abortController = null
    }
  }

  get isRunning(): boolean {
    return this.abortController !== null
  }

  /* ── 输入收集 ──────────────────────────────────────── */

  private collectInputs(
    nodeId: string,
    edges: Edge[],
    nodeOutputs: Record<string, Record<string, unknown>>,
  ): Record<string, unknown> {
    const inputs: Record<string, unknown> = {}

    for (const edge of edges) {
      if (edge.target !== nodeId) continue
      const sourceOutputs = nodeOutputs[edge.source]
      if (!sourceOutputs) continue

      const sourcePort = edge.sourceHandle
      const targetPort = edge.targetHandle
      if (sourcePort && targetPort && sourcePort in sourceOutputs) {
        inputs[targetPort] = sourceOutputs[sourcePort]
      }
    }

    return inputs
  }

  private findReachableNodes(startNodeId: string, edges: Edge[]): Set<string> {
    const reachable = new Set<string>([startNodeId])
    const queue = [startNodeId]

    while (queue.length > 0) {
      const current = queue.shift()
      if (!current) continue

      for (const edge of edges) {
        if (edge.source !== current || reachable.has(edge.target)) continue
        reachable.add(edge.target)
        queue.push(edge.target)
      }
    }

    return reachable
  }

  /* ── 条件分支: 跳过 null 端口的独占下游 ──────────── */

  private handleConditionalSkip(
    nodeId: string,
    outputs: Record<string, unknown>,
    edges: Edge[],
    skippedNodes: Set<string>,
    callbacks: ExecutionCallbacks,
    allowedNodes?: Set<string>,
  ): void {
    const nullPorts = Object.entries(outputs)
      .filter(([, v]) => v === null)
      .map(([port]) => port)

    if (nullPorts.length === 0) return

    /* 传播算法: 只跳过所有输入都来自 null 分支的节点 */
    const toSkip = new Set<string>()
    const queue: string[] = []

    for (const edge of edges) {
      if (edge.source === nodeId && nullPorts.includes(edge.sourceHandle ?? '')) {
        if (allowedNodes && !allowedNodes.has(edge.target)) continue
        queue.push(edge.target)
      }
    }

    while (queue.length > 0) {
      const candidate = queue.shift()!
      if (toSkip.has(candidate)) continue
      if (allowedNodes && !allowedNodes.has(candidate)) continue

      /* 检查: 该节点的所有输入是否都来自 null 分支或已跳过的节点 */
      const incoming = edges.filter(
        (e) =>
          e.target === candidate &&
          (!allowedNodes || e.source === nodeId || allowedNodes.has(e.source)),
      )
      const allFromNull = incoming.every((e) => {
        if (e.source === nodeId) return nullPorts.includes(e.sourceHandle ?? '')
        return toSkip.has(e.source)
      })

      if (!allFromNull) continue

      toSkip.add(candidate)
      skippedNodes.add(candidate)
      callbacks.updateNodeStatus(candidate, 'skipped')

      for (const edge of edges) {
        if (edge.source === candidate && !toSkip.has(edge.target)) {
          if (allowedNodes && !allowedNodes.has(edge.target)) continue
          queue.push(edge.target)
        }
      }
    }

    log.debug('Conditional skip', { nodeId, nullPorts, skipped: [...toSkip] })
  }

  /* ── 循环: 迭代执行 body 子图 ──────────────────── */

  private async executeLoopBody(
    loopNodeId: string,
    items: unknown[],
    nodes: Node<WorkflowNodeData>[],
    edges: Edge[],
    order: string[],
    workflowId: string | undefined,
    signal: AbortSignal,
    nodeOutputs: Record<string, Record<string, unknown>>,
    skippedNodes: Set<string>,
    callbacks: ExecutionCallbacks,
  ): Promise<unknown[]> {
    /* 找 body 子图: 从 item-out/index-out 可达的节点 */
    const bodyPorts = ['item-out', 'index-out']
    const bodyNodes = this.findBodyNodes(loopNodeId, bodyPorts, edges)

    /* body 节点按拓扑序排列 */
    const bodyOrder = order.filter((id) => bodyNodes.has(id))

    /* 标记 body 节点: 主循环中跳过 (由循环驱动) */
    for (const id of bodyNodes) {
      skippedNodes.add(id)
    }

    log.debug('Loop body', { loopNodeId, bodyOrder, itemCount: items.length })

    const allResults: unknown[] = []

    for (let i = 0; i < items.length; i++) {
      if (signal.aborted) break
      const iterationSkipped = new Set<string>()

      /* 设置当前迭代的输出 */
      nodeOutputs[loopNodeId] = {
        ...nodeOutputs[loopNodeId],
        'item-out': items[i],
        'index-out': i,
      }

      /* 按拓扑序执行 body 子图 */
      for (const bodyNodeId of bodyOrder) {
        if (signal.aborted) break
        if (iterationSkipped.has(bodyNodeId)) continue

        const bodyNode = nodes.find((n) => n.id === bodyNodeId)
        if (!bodyNode) continue

        const inputs = this.collectInputs(bodyNodeId, edges, nodeOutputs)

        callbacks.onNodeStart(bodyNodeId)
        callbacks.updateNodeStatus(bodyNodeId, 'running')

        try {
          const result = await executeNode({
            nodeId: bodyNodeId,
            workflowId,
            nodeType: bodyNode.type ?? 'unknown',
            data: bodyNode.data as WorkflowNodeData,
            inputs,
            signal,
            onStreamChunk: callbacks.onStreamChunk,
          })

          nodeOutputs[bodyNodeId] = result.outputs
          callbacks.onNodeComplete(bodyNodeId, result.outputs)
          callbacks.updateNodeStatus(bodyNodeId, 'success')

          if (bodyNode.type === 'conditional') {
            this.handleConditionalSkip(
              bodyNodeId,
              result.outputs,
              edges,
              iterationSkipped,
              callbacks,
              bodyNodes,
            )
          }

          if (bodyNode.type === 'loop' && '__loop_items' in result.outputs) {
            const nestedItems = result.outputs.__loop_items as unknown[]
            const nestedResults = await this.executeLoopBody(
              bodyNodeId,
              nestedItems,
              nodes,
              edges,
              order,
              workflowId,
              signal,
              nodeOutputs,
              skippedNodes,
              callbacks,
            )
            nodeOutputs[bodyNodeId] = {
              ...result.outputs,
              'results-out': nestedResults,
            }
            callbacks.onNodeComplete(bodyNodeId, nodeOutputs[bodyNodeId])
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err)
          callbacks.onNodeError(bodyNodeId, errorMsg)
          callbacks.updateNodeStatus(bodyNodeId, 'error')
          log.error('Loop body node failed', { bodyNodeId, iteration: i, error: errorMsg })
          break
        }
      }

      /* 收集本次迭代的终端输出 */
      const terminalNodes = this.findTerminalNodes(bodyOrder, edges)
      const iterResult: Record<string, unknown> = {}
      for (const tid of terminalNodes) {
        if (!nodeOutputs[tid] || iterationSkipped.has(tid)) continue
        Object.assign(iterResult, this.stripInternalOutputs(nodeOutputs[tid]))
      }
      allResults.push(iterResult)
    }

    return allResults
  }

  /* ── 找 body 子图节点 (BFS) ──────────────────────── */

  private findBodyNodes(loopNodeId: string, bodyPorts: string[], edges: Edge[]): Set<string> {
    const body = new Set<string>()
    const queue: string[] = []

    for (const edge of edges) {
      if (edge.source === loopNodeId && bodyPorts.includes(edge.sourceHandle ?? '')) {
        queue.push(edge.target)
      }
    }

    while (queue.length > 0) {
      const current = queue.shift()!
      if (body.has(current)) continue
      body.add(current)

      for (const edge of edges) {
        if (edge.source === current && !body.has(edge.target)) {
          queue.push(edge.target)
        }
      }
    }

    return body
  }

  /* ── 找终端节点 (无出边或出边指向 body 外) ──────── */

  private findTerminalNodes(bodyOrder: string[], edges: Edge[]): string[] {
    const bodySet = new Set(bodyOrder)
    return bodyOrder.filter((id) => {
      const outEdges = edges.filter((e) => e.source === id)
      return outEdges.length === 0 || outEdges.every((e) => !bodySet.has(e.target))
    })
  }

  private stripInternalOutputs(outputs: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(outputs).filter(([key]) => !key.startsWith('__')),
    )
  }

  /* ── 标记下游节点跳过 (错误时) ──────────────────── */

  private skipDownstream(
    failedNodeId: string,
    order: string[],
    edges: Edge[],
    callbacks: ExecutionCallbacks,
  ): void {
    const failedIndex = order.indexOf(failedNodeId)
    const downstream = new Set<string>()

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

    for (let i = failedIndex + 1; i < order.length; i++) {
      if (downstream.has(order[i])) {
        callbacks.updateNodeStatus(order[i], 'skipped')
      }
    }
  }
}
