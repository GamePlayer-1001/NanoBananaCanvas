/**
 * [INPUT]: 依赖 vitest 与 @testing-library/react，依赖 ./use-workflow-executor、@/stores/use-flow-store、@/stores/use-execution-store
 * [OUTPUT]: useWorkflowExecutor 的中止测试，覆盖前端 abort 会下发后端 cancel 并记录 aborted 历史
 * [POS]: hooks 的执行闭环回归测试，防止用户停止执行时只停前端不清后端任务
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react'
import type { Node } from '@xyflow/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { WorkflowNodeData } from '@/types'
import { useExecutionStore } from '@/stores/use-execution-store'
import { useFlowStore } from '@/stores/use-flow-store'

const abortMock = vi.fn()
const executeMock = vi.fn()

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/lib/executor/workflow-executor', () => ({
  WorkflowExecutor: class WorkflowExecutorMock {
    execute = executeMock
    abort = abortMock
  },
}))

import { useWorkflowExecutor } from './use-workflow-executor'

function createNode(
  id: string,
  status: WorkflowNodeData['status'],
  taskId?: string,
): Node<WorkflowNodeData> {
  return {
    id,
    type: 'image-gen',
    position: { x: 0, y: 0 },
    data: {
      label: id,
      type: 'media',
      status,
      config: taskId ? { taskId } : {},
    },
  }
}

describe('useWorkflowExecutor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useExecutionStore.getState().reset()
    useFlowStore.getState().setFlow(
      [
        createNode('queued-node', 'queued', 'task-queued'),
        createNode('running-node', 'running', 'task-running'),
        createNode('done-node', 'success', 'task-done'),
      ],
      [],
    )
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true }),
      } satisfies Partial<Response>),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('aborts the executor and sends cancel requests for active task nodes only', async () => {
    const { result } = renderHook(() => useWorkflowExecutor('workflow-1'))

    await act(async () => {
      result.current.abort()
      await Promise.resolve()
    })

    expect(abortMock).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith('/api/tasks/task-queued/cancel', { method: 'POST' })
    expect(fetch).toHaveBeenCalledWith('/api/tasks/task-running/cancel', { method: 'POST' })
    expect(fetch).not.toHaveBeenCalledWith('/api/tasks/task-done/cancel', { method: 'POST' })
    expect(fetch).toHaveBeenCalledWith(
      '/api/workflows/workflow-1/history',
      expect.objectContaining({
        method: 'POST',
      }),
    )
    expect(useExecutionStore.getState().error).toBe('Execution aborted by user')
  })
})
