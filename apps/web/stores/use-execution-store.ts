/**
 * [INPUT]: 依赖 zustand 的 create，依赖 @/lib/logger 的日志能力
 * [OUTPUT]: 对外提供 useExecutionStore (工作流执行状态追踪)
 * [POS]: stores 的执行引擎状态，被 Canvas/WorkflowExecutor/节点组件消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { create } from 'zustand'
import { createLogger } from '@/lib/logger'

const log = createLogger('ExecutionStore')

/* ─── Types ──────────────────────────────────────────── */

export interface ExecutionState {
  /* ── Data ─────────────────────────────────────────── */
  isExecuting: boolean
  currentNodeId: string | null
  executionOrder: string[]
  nodeResults: Record<string, unknown>
  error: string | null

  /* ── Actions ──────────────────────────────────────── */
  startExecution: (order: string[]) => void
  setCurrentNode: (nodeId: string) => void
  setNodeResult: (nodeId: string, result: unknown) => void
  finishExecution: () => void
  failExecution: (error: string) => void
  reset: () => void
}

/* ─── Store ──────────────────────────────────────────── */

export const useExecutionStore = create<ExecutionState>((set) => ({
  isExecuting: false,
  currentNodeId: null,
  executionOrder: [],
  nodeResults: {},
  error: null,

  startExecution: (order) => {
    log.info('Execution started', { order })
    set({
      isExecuting: true,
      currentNodeId: null,
      executionOrder: order,
      nodeResults: {},
      error: null,
    })
  },

  setCurrentNode: (nodeId) => {
    log.debug('Executing node', { nodeId })
    set({ currentNodeId: nodeId })
  },

  setNodeResult: (nodeId, result) => {
    log.debug('Node result', { nodeId })
    set((state) => ({
      nodeResults: { ...state.nodeResults, [nodeId]: result },
    }))
  },

  finishExecution: () => {
    log.info('Execution finished')
    set({ isExecuting: false, currentNodeId: null })
  },

  failExecution: (error) => {
    log.error('Execution failed', undefined, { error })
    set({ isExecuting: false, currentNodeId: null, error })
  },

  reset: () => {
    set({
      isExecuting: false,
      currentNodeId: null,
      executionOrder: [],
      nodeResults: {},
      error: null,
    })
  },
}))
