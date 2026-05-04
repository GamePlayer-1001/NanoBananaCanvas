/**
 * [INPUT]: 依赖 @/lib/executor/workflow-executor 的执行引擎，
 *          依赖 @/stores/use-flow-store 的节点/边数据，
 *          依赖 @/stores/use-execution-store 的执行状态，
 *          依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 useWorkflowExecutor hook (execute/executeFromNode/abort/isExecuting + 执行历史记录 + abort 时联动取消活跃异步任务)
 * [POS]: hooks 的工作流执行桥梁，连接 Executor 引擎与 Zustand Store，执行完成后写入 execution_history，并在用户中止时同步清理后端任务
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { WorkflowExecutor } from '@/lib/executor/workflow-executor'
import { useExecutionStore } from '@/stores/use-execution-store'
import { useFlowStore } from '@/stores/use-flow-store'

/* ─── Executor Error → i18n Key 映射 ────────────────────── */

const ERROR_KEY_MAP: Record<string, string> = {
  'Workflow is empty': 'workflowEmpty',
  'Execution aborted': 'executionAborted',
  'Failed to sort workflow': 'sortFailed',
}

const ABORTABLE_NODE_STATUSES = new Set(['queued', 'running', 'finalizing'])

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

  if (node.type === 'image-gen' && 'image-out' in outputs) {
    updateNodeData(nodeId, { config: { ...config, resultUrl: outputs['image-out'] } })
  }

  if (node.type === 'video-gen' && 'video-out' in outputs) {
    updateNodeData(nodeId, { config: { ...config, resultUrl: outputs['video-out'] } })
  }

  if (node.type === 'audio-gen' && 'audio-out' in outputs) {
    updateNodeData(nodeId, { config: { ...config, resultUrl: outputs['audio-out'] } })
  }
}

function getNodeRunStartConfigPatch(nodeId: string): Record<string, unknown> {
  const node = useFlowStore.getState().nodes.find((item) => item.id === nodeId)
  if (!node) return {}

  const config = getNodeConfig(nodeId)
  switch (node.type) {
    case 'llm':
      return { ...config, output: '' }
    case 'image-gen':
    case 'video-gen':
    case 'audio-gen':
      return { ...config, resultUrl: '', progress: 0 }
    default:
      return config
  }
}

function collectAbortableTaskIds(): string[] {
  const nodes = useFlowStore.getState().nodes
  const activeTaskIds = nodes.flatMap((node) => {
    const status = node.data.status
    const taskId = node.data.config?.taskId
    if (
      typeof taskId === 'string' &&
      taskId.length > 0 &&
      status &&
      ABORTABLE_NODE_STATUSES.has(status)
    ) {
      return [taskId]
    }
    return []
  })

  return Array.from(new Set(activeTaskIds))
}

async function cancelActiveTasks(taskIds: string[]): Promise<void> {
  if (taskIds.length === 0) {
    return
  }

  await Promise.allSettled(
    taskIds.map(async (taskId) => {
      const response = await fetch(`/api/tasks/${taskId}/cancel`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(`Failed to cancel task ${taskId} (${response.status})`)
      }
    }),
  )
}

/* ─── Record Execution History ────────────────────────── */

function recordHistory(
  workflowId: string,
  status: 'success' | 'failed' | 'aborted',
  startTime: number,
  nodeCount: number,
  errorMessage?: string,
) {
  fetch(`/api/workflows/${workflowId}/history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status,
      nodeCount,
      durationMs: Date.now() - startTime,
      errorMessage: errorMessage ?? null,
    }),
  }).catch(() => { /* 历史记录失败不影响主流程 */ })
}

/* ─── Hook ───────────────────────────────────────────── */

export function useWorkflowExecutor(workflowId?: string) {
  const executorRef = useRef(new WorkflowExecutor())
  const startTimeRef = useRef(0)
  const abortingRef = useRef(false)
  const t = useTranslations('canvas')
  const tExec = useTranslations('executor')

  const updateNodeData = useFlowStore((s) => s.updateNodeData)

  const isExecuting = useExecutionStore((s) => s.isExecuting)
  const startExecution = useExecutionStore((s) => s.startExecution)
  const setCurrentNode = useExecutionStore((s) => s.setCurrentNode)
  const setNodeResult = useExecutionStore((s) => s.setNodeResult)
  const finishExecution = useExecutionStore((s) => s.finishExecution)
  const failExecution = useExecutionStore((s) => s.failExecution)

  const executeWithScope = useCallback(async (startNodeId?: string) => {
    if (isExecuting) return
    startTimeRef.current = Date.now()
    abortingRef.current = false
    const { nodes, edges } = useFlowStore.getState()

    await executorRef.current.execute(nodes, edges, workflowId, {
      onStart: (order) => startExecution(order),

      onNodeStart: (nodeId) => {
        setCurrentNode(nodeId)
        updateNodeData(nodeId, { config: getNodeRunStartConfigPatch(nodeId) })
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
        abortingRef.current = false
        finishExecution()
        toast.success(t('workflowCompleted'))
        if (workflowId) {
          recordHistory(workflowId, 'success', startTimeRef.current, nodes.length)
        }
      },
      onError: (error) => {
        const isUserAbort = abortingRef.current && error === 'Execution aborted'
        if (isUserAbort) {
          abortingRef.current = false
          return
        }

        failExecution(error)
        const key = ERROR_KEY_MAP[error]
        toast.error(key ? tExec(key) : error)
        if (workflowId) {
          recordHistory(workflowId, 'failed', startTimeRef.current, nodes.length, error)
        }
      },

      updateNodeStatus: (nodeId, status) => {
        updateNodeData(nodeId, { status })
      },
      updateNodeConfig: (nodeId, patch) => {
        updateNodeData(nodeId, { config: { ...getNodeConfig(nodeId), ...patch } })
      },
    }, startNodeId)
  }, [
    isExecuting, t, tExec, workflowId,
    startExecution, setCurrentNode, setNodeResult, finishExecution, failExecution,
    updateNodeData,
  ])

  const execute = useCallback(async () => {
    await executeWithScope()
  }, [executeWithScope])

  const executeFromNode = useCallback(async (nodeId: string) => {
    await executeWithScope(nodeId)
  }, [executeWithScope])

  const abort = useCallback(() => {
    abortingRef.current = true
    executorRef.current.abort()
    void cancelActiveTasks(collectAbortableTaskIds())
    failExecution('Execution aborted by user')
    const { nodes } = useFlowStore.getState()
    if (workflowId) {
      recordHistory(workflowId, 'aborted', startTimeRef.current, nodes.length)
    }
  }, [failExecution, workflowId])

  return { execute, executeFromNode, abort, isExecuting }
}
