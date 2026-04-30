/**
 * [INPUT]: 依赖 vitest 与 @testing-library/react，依赖 ./use-agent-task-summary、@/hooks/use-tasks、@/stores/use-execution-store
 * [OUTPUT]: 对外提供 useAgentTaskSummary 的回归测试，覆盖任务完成后的自然语言摘要与结果续写建议
 * [POS]: hooks 的 Agent 任务观察测试，确保异步任务完成后右侧面板能收到可信的下一步提示
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

// @vitest-environment jsdom

import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useExecutionStore } from '@/stores/use-execution-store'

vi.mock('@/hooks/use-tasks', () => ({
  useTasks: vi.fn(),
}))

import { useTasks } from '@/hooks/use-tasks'
import { useAgentTaskSummary } from './use-agent-task-summary'

describe('useAgentTaskSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useExecutionStore.getState().reset()
  })

  it('emits a follow-up suggestion when an image task completes', () => {
    vi.mocked(useTasks).mockReturnValue({
      data: {
        tasks: [
          {
            id: 'task-image-1',
            workflowId: 'workflow-1',
            taskType: 'image_gen',
            status: 'completed',
            progress: 100,
          },
        ],
      },
    } as never)

    const { result } = renderHook(() =>
      useAgentTaskSummary({
        workflowId: 'workflow-1',
      }),
    )

    expect(result.current.terminalEvents).toEqual([
      {
        taskId: 'task-image-1',
        message: '异步任务已经完成，图片生成 结果已回到左侧节点。',
        tone: 'assistant',
      },
      {
        taskId: 'task-image-1:follow-up',
        message: '这次图片结果已经出来了。要不要我基于这张图继续补一个视频分支，或者再长出标题/正文文案分支？',
        tone: 'assistant',
      },
    ])
  })

  it('keeps diagnosis tone for failed tasks', () => {
    vi.mocked(useTasks).mockReturnValue({
      data: {
        tasks: [
          {
            id: 'task-image-2',
            workflowId: 'workflow-1',
            taskType: 'image_gen',
            status: 'failed',
            progress: 0,
          },
        ],
      },
    } as never)

    const { result } = renderHook(() =>
      useAgentTaskSummary({
        workflowId: 'workflow-1',
      }),
    )

    expect(result.current.terminalEvents).toEqual([
      {
        taskId: 'task-image-2',
        message: '异步任务执行失败了，我建议你先检查对应节点配置或让我继续诊断。',
        tone: 'diagnosis',
      },
    ])
  })
})
