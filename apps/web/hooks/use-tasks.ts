/**
 * [INPUT]: 依赖 @tanstack/react-query, 依赖 @nano-banana/shared 的 AsyncTaskType/PageInfo,
 *          依赖 @/lib/query/keys 的 queryKeys, 依赖 @/lib/tasks 的 TaskDetail/ListTasksResult
 * [OUTPUT]: 对外提供 useTasks / useTask / useTaskPolling / useSubmitTask / useCancelTask
 * [POS]: hooks 的异步任务数据层，被 workspace/canvas 页面消费，并对高频任务轮询做前台三段式退避
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import type { AsyncTaskStatus, AsyncTaskType, PageInfo } from '@nano-banana/shared'
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

interface TaskListResponse extends ListTasksResult {
  pageInfo?: PageInfo
}

interface SubmitTaskInput {
  taskType: AsyncTaskType
  provider: string
  modelId: string
  executionMode: 'platform' | 'user_key'
  input: Record<string, unknown>
  workflowId?: string
  nodeId?: string
}

/* ─── Helpers ───────────────────────────────────────── */

function isTerminal(status: AsyncTaskStatus): boolean {
  return status === 'completed' || status === 'failed' || status === 'cancelled'
}

function getTaskPollInterval(task: TaskDetail | undefined): number | false {
  if (!task) {
    return 15_000
  }

  if (isTerminal(task.status)) {
    return false
  }

  const startedAtMs = task.startedAt ? Date.parse(task.startedAt) : Number.NaN
  const createdAtMs = Date.parse(task.createdAt)
  const baseline = Number.isFinite(startedAtMs) ? startedAtMs : createdAtMs
  const elapsedMs = Number.isFinite(baseline) ? Date.now() - baseline : 0

  if (elapsedMs >= 180_000) {
    return 15_000
  }

  if (elapsedMs >= 60_000) {
    return 10_000
  }

  return 15_000
}

/* ─── 1. useTasks — 任务列表 ────────────────────────── */

export function useTasks(params?: TaskListParams) {
  const qs = new URLSearchParams()
  if (params?.status) qs.set('status', params.status)
  if (params?.taskType) qs.set('taskType', params.taskType)
  if (params?.page) qs.set('page', String(params.page))
  if (params?.limit) qs.set('limit', String(params.limit))
  const query = qs.toString()

  return useQuery<TaskListResponse>({
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

export function useTaskPolling(taskId: string | undefined) {
  return useQuery<TaskDetail>({
    queryKey: queryKeys.tasks.detail(taskId ?? ''),
    queryFn: () => fetchJson(`/api/tasks/${taskId}`),
    enabled: !!taskId,
    /* 动态轮询: 0-60s 每 15s，60-180s 每 10s，180s 后每 15s，终态即停 */
    refetchInterval: (query) => {
      return getTaskPollInterval(query.state.data)
    },
    /* 页面不可见时停止轮询，节省 Worker/D1 请求 */
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
