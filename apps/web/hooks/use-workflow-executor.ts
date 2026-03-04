/**
 * [INPUT]: 依赖 @/lib/executor/workflow-executor 的执行引擎，
 *          依赖 @/stores/use-flow-store 的节点/边数据，
 *          依赖 @/stores/use-execution-store 的执行状态，
 *          依赖 @/stores/use-settings-store 的 API Key
 * [OUTPUT]: 对外提供 useWorkflowExecutor hook (execute/abort/isExecuting)
 * [POS]: hooks 的工作流执行桥梁，连接 Executor 引擎与 Zustand Store
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { WorkflowExecutor } from '@/lib/executor/workflow-executor'
import { useExecutionStore } from '@/stores/use-execution-store'
import { useFlowStore } from '@/stores/use-flow-store'
import { useSettingsStore } from '@/stores/use-settings-store'

/* ─── Store Helpers (非响应式，直接读快照) ────────────── */

function getNodeConfig(nodeId: string): Record<string, unknown> {
  const node = useFlowStore.getState().nodes.find((n) => n.id === nodeId)
  return (node?.data as Record<string, unknown> & { config: Record<string, unknown> })?.config ?? {}
}

function syncOutputsToNodeData(
  nodeId: string,
  outputs: Record<string, unknown>,
  updateNodeData: (id: string, data: Record<string, unknown>) => void,
) {
  const node = useFlowStore.getState().nodes.find((n) => n.id === nodeId)
  if (!node) return

  const config = getNodeConfig(nodeId)

  if (node.type === 'llm' && 'text-out' in outputs) {
    updateNodeData(nodeId, { config: { ...config, output: outputs['text-out'] } })
  }

  if (node.type === 'display' && 'content' in outputs) {
    updateNodeData(nodeId, { config: { ...config, content: outputs['content'] } })
  }
}

/* ─── Hook ───────────────────────────────────────────── */

export function useWorkflowExecutor() {
  const executorRef = useRef(new WorkflowExecutor())

  const nodes = useFlowStore((s) => s.nodes)
  const edges = useFlowStore((s) => s.edges)
  const updateNodeData = useFlowStore((s) => s.updateNodeData)
  const apiKey = useSettingsStore((s) => s.apiKey)

  const isExecuting = useExecutionStore((s) => s.isExecuting)
  const startExecution = useExecutionStore((s) => s.startExecution)
  const setCurrentNode = useExecutionStore((s) => s.setCurrentNode)
  const setNodeResult = useExecutionStore((s) => s.setNodeResult)
  const finishExecution = useExecutionStore((s) => s.finishExecution)
  const failExecution = useExecutionStore((s) => s.failExecution)

  const execute = useCallback(async () => {
    if (isExecuting) return

    await executorRef.current.execute(nodes, edges, apiKey, {
      onStart: (order) => startExecution(order),

      onNodeStart: (nodeId) => {
        setCurrentNode(nodeId)
        updateNodeData(nodeId, { config: { ...getNodeConfig(nodeId), output: '' } })
      },

      onNodeComplete: (nodeId, outputs) => {
        setNodeResult(nodeId, outputs)
        syncOutputsToNodeData(nodeId, outputs, updateNodeData)
      },

      onNodeError: (nodeId, error) => {
        setNodeResult(nodeId, { error })
      },

      onStreamChunk: (nodeId, chunk) => {
        const current = (getNodeConfig(nodeId).output as string) ?? ''
        updateNodeData(nodeId, {
          config: { ...getNodeConfig(nodeId), output: current + chunk },
        })
      },

      onComplete: () => {
        finishExecution()
        toast.success('Workflow completed')
      },
      onError: (error) => {
        failExecution(error)
        toast.error(error)
      },

      updateNodeStatus: (nodeId, status) => {
        updateNodeData(nodeId, { status })
      },
    })
  }, [
    nodes, edges, apiKey, isExecuting,
    startExecution, setCurrentNode, setNodeResult, finishExecution, failExecution,
    updateNodeData,
  ])

  const abort = useCallback(() => {
    executorRef.current.abort()
    failExecution('Execution aborted by user')
  }, [failExecution])

  return { execute, abort, isExecuting }
}
