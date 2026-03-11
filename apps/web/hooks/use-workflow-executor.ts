/**
 * [INPUT]: 依赖 @/lib/executor/workflow-executor 的执行引擎，
 *          依赖 @/stores/use-flow-store 的节点/边数据，
 *          依赖 @/stores/use-execution-store 的执行状态，
 *          依赖 @/stores/use-settings-store 的 API Key，
 *          依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 useWorkflowExecutor hook (execute/abort/isExecuting + 执行历史记录)
 * [POS]: hooks 的工作流执行桥梁，连接 Executor 引擎与 Zustand Store，执行完成后写入 execution_history
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { WorkflowExecutor } from '@/lib/executor/workflow-executor'
import { useExecutionStore } from '@/stores/use-execution-store'
import { useFlowStore } from '@/stores/use-flow-store'
import { useSettingsStore } from '@/stores/use-settings-store'

/* ─── Executor Error → i18n Key 映射 ────────────────────── */

const ERROR_KEY_MAP: Record<string, string> = {
  'Workflow is empty': 'workflowEmpty',
  'Execution aborted': 'executionAborted',
  'Failed to sort workflow': 'sortFailed',
}

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
  const t = useTranslations('canvas')
  const tExec = useTranslations('executor')

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
    startTimeRef.current = Date.now()

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
        toast.success(t('workflowCompleted'))
        if (workflowId) {
          recordHistory(workflowId, 'success', startTimeRef.current, nodes.length)
        }
      },
      onError: (error) => {
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
    })
  }, [
    nodes, edges, apiKey, isExecuting, t, tExec, workflowId,
    startExecution, setCurrentNode, setNodeResult, finishExecution, failExecution,
    updateNodeData,
  ])

  const abort = useCallback(() => {
    executorRef.current.abort()
    failExecution('Execution aborted by user')
    if (workflowId) {
      recordHistory(workflowId, 'aborted', startTimeRef.current, nodes.length)
    }
  }, [failExecution, workflowId, nodes.length])

  return { execute, abort, isExecuting }
}
