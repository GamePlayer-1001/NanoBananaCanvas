/**
 * [INPUT]: 依赖 react 的 useMemo，依赖 @/hooks/use-tasks 与 @/stores/use-execution-store
 * [OUTPUT]: 对外提供 useAgentTaskSummary()，把执行态与异步任务态压缩成 Agent 可读摘要
 * [POS]: hooks 的 Agent 任务观察层，被编辑器页消费，用于把真实任务状态翻译成自然语言反馈
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useMemo } from 'react'
import { useTasks } from '@/hooks/use-tasks'
import { useExecutionStore } from '@/stores/use-execution-store'

interface UseAgentTaskSummaryOptions {
  workflowId: string
}

export interface AgentTaskTerminalEvent {
  taskId: string
  message: string
  tone: 'assistant' | 'diagnosis'
}

export interface AgentTaskSummary {
  executionLabel: string | null
  activeTaskLabel: string | null
  terminalEvents: AgentTaskTerminalEvent[]
}

export function useAgentTaskSummary({
  workflowId,
}: UseAgentTaskSummaryOptions): AgentTaskSummary {
  const isExecuting = useExecutionStore((state) => state.isExecuting)
  const currentNodeId = useExecutionStore((state) => state.currentNodeId)
  const executionError = useExecutionStore((state) => state.error)
  const { data } = useTasks({ page: 1, limit: 20 })

  const workflowTasks = useMemo(
    () => (data?.tasks ?? []).filter((task) => task.workflowId === workflowId),
    [data?.tasks, workflowId],
  )

  const activeTask = workflowTasks.find(
    (task) => task.status === 'pending' || task.status === 'running',
  )

  const executionLabel = useMemo(() => {
    if (isExecuting) {
      return currentNodeId
        ? `我正在执行左侧工作流，当前跑到节点 ${currentNodeId}。`
        : '我正在执行左侧工作流。'
    }

    if (executionError) {
      return `最近一次执行没有成功收口：${executionError}`
    }

    return null
  }, [currentNodeId, executionError, isExecuting])

  const activeTaskLabel = useMemo(() => {
    if (!activeTask) return null

    if (activeTask.status === 'pending') {
      return `异步任务已进入队列，正在等待 ${toTaskTypeLabel(activeTask.taskType)} 开始处理。`
    }

    return `异步任务正在处理 ${toTaskTypeLabel(activeTask.taskType)}，当前进度约 ${Math.max(activeTask.progress, 5)}%。`
  }, [activeTask])

  const terminalEvents = useMemo(
    () =>
      workflowTasks.flatMap((task) => {
        if (task.status === 'completed') {
          return [{
            taskId: task.id,
            message: `异步任务已经完成，${toTaskTypeLabel(task.taskType)} 结果已回到左侧节点。`,
            tone: 'assistant' as const,
          }]
        }

        if (task.status === 'failed') {
          return [{
            taskId: task.id,
            message: '异步任务执行失败了，我建议你先检查对应节点配置或让我继续诊断。',
            tone: 'diagnosis' as const,
          }]
        }

        if (task.status === 'cancelled') {
          return [{
            taskId: task.id,
            message: '异步任务已取消，左侧画板会保持当前状态。',
            tone: 'assistant' as const,
          }]
        }

        return []
      }),
    [workflowTasks],
  )

  return {
    executionLabel,
    activeTaskLabel,
    terminalEvents,
  }
}

function toTaskTypeLabel(taskType: string) {
  if (taskType === 'image_gen') return '图片生成'
  if (taskType === 'video_gen') return '视频生成'
  if (taskType === 'audio_gen') return '音频生成'
  return taskType
}
