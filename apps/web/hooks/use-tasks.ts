/**
 * [INPUT]: 依赖 @tanstack/react-query, 依赖 @nano-banana/shared 的 TASK_CONFIG/AsyncTaskType,
 *          依赖 @/lib/query/keys 的 queryKeys, 依赖 @/lib/tasks 的 TaskDetail/ListTasksResult
 * [OUTPUT]: 对外提供 useTasks / useTask / useTaskPolling / useSubmitTask / useCancelTask
 * [POS]: hooks 的异步任务数据层，被 workspace/canvas 页面消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { TASK_CONFIG } from '@nano-banana/shared'
import type { AsyncTaskStatus, AsyncTaskType } from '@nano-banana/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query/keys'
import type { ListTasksResult, TaskDetail } from '@/lib/tasks'

/* ─── Fetcher ───────────────────────────────────────── */

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error?.message ?? `Request failed: ${res.status}`)
  }
  const json = await res.json()
  return json.data as T
}

/* ─── Types ─────────────────────────────────────────── */

interface TaskListParams {
  status?: AsyncTaskStatus
  taskType?: AsyncTaskType
  page?: number
  limit?: number
}

interface SubmitTaskInput {
  taskType: AsyncTaskType
  provider: string
  modelId: string
  executionMode: 'credits' | 'user_key'
  input: Record<string, unknown>
  workflowId?: string
  nodeId?: string
}

/* ─── Helpers ───────────────────────────────────────── */

function isTerminal(status: AsyncTaskStatus): boolean {
  return status === 'completed' || status === 'failed' || status === 'cancelled'
}

/* ─── 1. useTasks — 任务列表 ────────────────────────── */

export function useTasks(params?: TaskListParams) {
  const qs = new URLSearchParams()
  if (params?.status) qs.set('status', params.status)
  if (params?.taskType) qs.set('taskType', params.taskType)
  if (params?.page) qs.set('page', String(params.page))
  if (params?.limit) qs.set('limit', String(params.limit))
  const query = qs.toString()

  return useQuery<ListTasksResult>({
    queryKey: queryKeys.tasks.list(params),
    queryFn: () => fetchJson(`/api/tasks${query ? `?${query}` : ''}`),
  })
}

/* ─── 2. useTask — 单任务详情 ───────────────────────── */

export function useTask(taskId: string | undefined) {
  return useQuery<TaskDetail>({
    queryKey: queryKeys.tasks.detail(taskId ?? ''),
    queryFn: () => fetchJson(`/api/tasks/${taskId}`),
    enabled: !!taskId,
  })
}

/* ─── 3. useTaskPolling — 核心轮询 Hook ─────────────── */

export function useTaskPolling(taskId: string | undefined, taskType: AsyncTaskType) {
  const config = TASK_CONFIG[taskType]

  return useQuery<TaskDetail>({
    queryKey: queryKeys.tasks.detail(taskId ?? ''),
    queryFn: () => fetchJson(`/api/tasks/${taskId}`),
    enabled: !!taskId,
    /* 动态轮询: 终态返回 false 停止, 活跃态返回配置间隔 */
    refetchInterval: (query) => {
      const data = query.state.data
      if (data && isTerminal(data.status)) return false
      return config.pollIntervalMs
    },
    /* 页面不可见时停止轮询，节省资源 */
    refetchIntervalInBackground: false,
  })
}

/* ─── 4. useSubmitTask — 提交任务 ───────────────────── */

export function useSubmitTask() {
  const qc = useQueryClient()

  return useMutation<TaskDetail, Error, SubmitTaskInput>({
    mutationFn: (input) =>
      fetchJson('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all })
    },
  })
}

/* ─── 5. useCancelTask — 取消任务 ───────────────────── */

export function useCancelTask() {
  const qc = useQueryClient()

  return useMutation<TaskDetail, Error, string>({
    mutationFn: (taskId) =>
      fetchJson(`/api/tasks/${taskId}/cancel`, { method: 'POST' }),
    onSuccess: (_, taskId) => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) })
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all })
    },
  })
}
