/**
 * [INPUT]: 依赖 @nano-banana/shared 的 TASK_CONFIG/AsyncTaskType/AsyncTaskStatus/ExecutionMode,
 *          依赖 @/lib/api-key-crypto 的 decryptApiKey,
 *          依赖 @/lib/user-model-config, @/lib/tasks/processors 的 getProcessor,
 *          依赖 @/lib/nanoid, @/lib/logger, @/lib/errors, @/lib/env
 * [OUTPUT]: 对外提供 checkConcurrency / submitTask / checkTask / cancelTask / listTasks
 * [POS]: lib/tasks 的核心服务层 — 整个异步任务系统的心脏，编排 D1 + Processor + 平台 Key / 账号级模型槽位协作
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { TASK_CONFIG } from '@nano-banana/shared'
import type { AsyncTaskStatus, AsyncTaskType, ExecutionMode } from '@nano-banana/shared'

import { decryptApiKey } from '@/lib/api-key-crypto'
import { requireEnv } from '@/lib/env'
import { ErrorCode, TaskError } from '@/lib/errors'
import { createLogger } from '@/lib/logger'
import { nanoid } from '@/lib/nanoid'
import {
  deserializeUserModelConfig,
  isUserModelConfigSlotId,
  toRuntimeUserModelConfig,
  type UserModelRuntimeConfig,
} from '@/lib/user-model-config'
import { getPlatformKey } from '@/services/ai'

import { getProcessor } from './processors'

const log = createLogger('task:service')
const FREE_TASK_CONCURRENCY_LIMIT = 1

/* ─── D1 Row Shape ──────────────────────────────────── */

interface TaskRow {
  id: string
  user_id: string
  task_type: AsyncTaskType
  provider: string
  model_id: string
  external_task_id: string | null
  execution_mode: ExecutionMode
  input_data: string
  output_data: string | null
  status: AsyncTaskStatus
  progress: number
  retry_count: number
  max_retries: number
  last_checked_at: string | null
  workflow_id: string | null
  node_id: string | null
  created_at: string
  started_at: string | null
  completed_at: string | null
  updated_at: string
}

/* ─── Public Types ──────────────────────────────────── */

export interface SubmitTaskParams {
  userId: string
  taskType: AsyncTaskType
  provider: string
  modelId: string
  executionMode: ExecutionMode
  input: Record<string, unknown>
  workflowId?: string
  nodeId?: string
}

export interface TaskDetail {
  id: string
  taskType: AsyncTaskType
  provider: string
  modelId: string
  executionMode: ExecutionMode
  status: AsyncTaskStatus
  progress: number
  input: Record<string, unknown>
  output: unknown | null
  retryCount: number
  workflowId: string | null
  nodeId: string | null
  createdAt: string
  startedAt: string | null
  completedAt: string | null
}

export interface ListTasksResult {
  tasks: TaskDetail[]
  total: number
  page: number
  limit: number
}

/* ─── Helpers ───────────────────────────────────────── */

function rowToDetail(row: TaskRow): TaskDetail {
  return {
    id: row.id,
    taskType: row.task_type,
    provider: row.provider,
    modelId: row.model_id,
    executionMode: row.execution_mode,
    status: row.status,
    progress: row.progress,
    input: JSON.parse(row.input_data || '{}'),
    output: row.output_data ? JSON.parse(row.output_data) : null,
    retryCount: row.retry_count,
    workflowId: row.workflow_id,
    nodeId: row.node_id,
    createdAt: row.created_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  }
}

function isTerminal(status: AsyncTaskStatus): boolean {
  return status === 'completed' || status === 'failed' || status === 'cancelled'
}

/* ─── 1. Concurrency Check ──────────────────────────── */

export async function checkConcurrency(
  db: D1Database,
  userId: string,
): Promise<void> {
  const result = await db
    .prepare(
      `SELECT COUNT(*) as cnt FROM async_tasks
       WHERE user_id = ? AND status IN ('pending', 'running')`,
    )
    .bind(userId)
    .first<{ cnt: number }>()

  const active = result?.cnt ?? 0

  if (active >= FREE_TASK_CONCURRENCY_LIMIT) {
    throw new TaskError(
      ErrorCode.TASK_CONCURRENCY_EXCEEDED,
      `Concurrent task limit reached (${active}/${FREE_TASK_CONCURRENCY_LIMIT})`,
      { active, maxConcurrent: FREE_TASK_CONCURRENCY_LIMIT },
    )
  }
}

/* ─── 2. Submit Task ────────────────────────────────── */

export async function submitTask(
  db: D1Database,
  params: SubmitTaskParams,
): Promise<TaskDetail> {
  const { userId, taskType, provider, modelId, executionMode, input, workflowId, nodeId } = params
  const config = TASK_CONFIG[taskType]
  let resolvedProvider = provider
  let resolvedModelId = modelId
  let resolvedInput = input

  /* 并发检查 */
  await checkConcurrency(db, userId)

  let apiKey = ''

  if (executionMode === 'platform') {
    apiKey = await getTaskPlatformKey(provider)
  }

  /* user_key 模式: 获取解密后的 API Key */
  if (executionMode === 'user_key') {
    const runtimeConfig = await getUserTaskRuntimeConfig(db, userId, provider)
    apiKey = runtimeConfig.apiKey
    resolvedProvider = runtimeConfig.providerId
    resolvedModelId = runtimeConfig.modelId
    resolvedInput = runtimeConfig.baseUrl
      ? { ...input, baseUrl: runtimeConfig.baseUrl }
      : input
  }

  /* 提交到 Provider */
  const processor = getProcessor(taskType, resolvedProvider)
  const submitResult = await processor.submit(
    { model: resolvedModelId, params: resolvedInput },
    apiKey,
  )

  /* 持久化到 D1 */
  const taskId = nanoid()
  const now = new Date().toISOString()
  const initialStatus = submitResult.initialStatus

  await db
    .prepare(
      `INSERT INTO async_tasks (
        id, user_id, task_type, provider, model_id,
        external_task_id, execution_mode, input_data,
        status, progress, retry_count, max_retries, workflow_id, node_id,
        created_at, started_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      taskId, userId, taskType, provider, resolvedModelId,
      submitResult.externalTaskId, executionMode, JSON.stringify(resolvedInput),
      initialStatus,
      config.maxRetries, workflowId ?? null, nodeId ?? null,
      now, initialStatus === 'running' ? now : null, now,
    )
    .run()

  log.info('Task submitted', { taskId, taskType, provider, resolvedProvider, executionMode, initialStatus })

  return {
    id: taskId,
    taskType,
    provider,
    modelId: resolvedModelId,
    executionMode,
    status: initialStatus,
    progress: 0,
    input,
    output: null,
    retryCount: 0,
    workflowId: workflowId ?? null,
    nodeId: nodeId ?? null,
    createdAt: now,
    startedAt: initialStatus === 'running' ? now : null,
    completedAt: null,
  }
}

async function getUserTaskRuntimeConfig(
  db: D1Database,
  userId: string,
  provider: string,
): Promise<UserModelRuntimeConfig> {
  if (!isUserModelConfigSlotId(provider)) {
    throw new TaskError(
      ErrorCode.TASK_PROVIDER_ERROR,
      `Unsupported user_key provider slot: ${provider}`,
      { provider },
    )
  }

  const keyRow = await db
    .prepare(
      `SELECT encrypted_key FROM user_api_keys
       WHERE user_id = ? AND provider = ? AND is_active = 1`,
    )
    .bind(userId, provider)
    .first<{ encrypted_key: string }>()

  if (!keyRow) {
    throw new TaskError(
      ErrorCode.TASK_PROVIDER_ERROR,
      `No API key configured for provider: ${provider}`,
      { provider },
    )
  }

  const encryptionKey = await requireEnv('ENCRYPTION_KEY')
  const decrypted = await decryptApiKey(keyRow.encrypted_key, encryptionKey)
  const payload = deserializeUserModelConfig(provider, decrypted)
  return toRuntimeUserModelConfig(provider, payload)
}

async function getTaskPlatformKey(provider: string): Promise<string> {
  switch (provider) {
    case 'openrouter':
    case 'deepseek':
    case 'gemini':
      return getPlatformKey(provider)
    case 'openai':
      return requireEnv('OPENAI_API_KEY')
    case 'kling': {
      const accessKey = await requireEnv('KLING_ACCESS_KEY')
      const secretKey = await requireEnv('KLING_SECRET_KEY')
      return `${accessKey}:${secretKey}`
    }
    default:
      throw new TaskError(
        ErrorCode.TASK_PROVIDER_ERROR,
        `No platform key mapping for provider: ${provider}`,
        { provider },
      )
  }
}

/* ─── 3. Check Task (Lazy Evaluation) ───────────────── */

export async function checkTask(
  db: D1Database,
  taskId: string,
  userId: string,
): Promise<TaskDetail> {
  /* 读取 D1 当前状态 */
  const row = await db
    .prepare('SELECT * FROM async_tasks WHERE id = ? AND user_id = ?')
    .bind(taskId, userId)
    .first<TaskRow>()

  if (!row) {
    throw new TaskError(ErrorCode.TASK_NOT_FOUND, `Task not found: ${taskId}`, { taskId })
  }

  /* 终态直接返回 */
  if (isTerminal(row.status)) {
    return rowToDetail(row)
  }

  /* 节流: 距上次检查未超过阈值则直接返回 D1 缓存 */
  const config = TASK_CONFIG[row.task_type]
  const now = Date.now()
  const lastChecked = row.last_checked_at ? new Date(row.last_checked_at).getTime() : 0

  if (now - lastChecked < config.providerCheckThrottleMs) {
    return rowToDetail(row)
  }

  /* 超时检测: 创建时间超过 timeoutMs 则标记失败 */
  const created = new Date(row.created_at).getTime()
  if (now - created > config.timeoutMs) {
    await handleTimeout(db, row)
    return {
      ...rowToDetail(row),
      status: 'failed',
      output: { error: 'Task timed out' },
    }
  }

  /* 懒评估: 向 Provider 查询最新状态 */
  let apiKey = ''
  let processorProvider = row.provider
  if (row.execution_mode === 'user_key' && row.external_task_id) {
    const runtimeConfig = await getUserTaskRuntimeConfig(db, userId, row.provider)
    apiKey = runtimeConfig.apiKey
    processorProvider = runtimeConfig.providerId
  } else if (row.execution_mode === 'platform' && row.external_task_id) {
    apiKey = await getTaskPlatformKey(row.provider)
  }

  if (!row.external_task_id) {
    return rowToDetail(row)
  }

  try {
    const processor = getProcessor(row.task_type, processorProvider)
    const check = await processor.checkStatus(row.external_task_id, apiKey)
    const nowIso = new Date().toISOString()

    /* 根据 Provider 返回状态更新 D1 */
    if (check.status === 'completed' && check.result) {
      await db
        .prepare(
          `UPDATE async_tasks
           SET status = 'completed', progress = 100,
               output_data = ?, completed_at = ?,
               last_checked_at = ?, updated_at = ?
           WHERE id = ?`,
        )
        .bind(JSON.stringify(check.result), nowIso, nowIso, nowIso, taskId)
        .run()

      log.info('Task completed', { taskId })
      return {
        ...rowToDetail(row),
        status: 'completed',
        progress: 100,
        output: check.result,
        completedAt: nowIso,
      }
    }

    if (check.status === 'failed') {
      return await handleFailure(db, row, check.error ?? 'Provider reported failure')
    }

    /* 进行中: 更新进度和时间戳 */
    await db
      .prepare(
        `UPDATE async_tasks
         SET progress = ?, last_checked_at = ?, updated_at = ?,
             status = ?, started_at = COALESCE(started_at, ?)
         WHERE id = ?`,
      )
      .bind(check.progress, nowIso, nowIso, check.status, nowIso, taskId)
      .run()

    return {
      ...rowToDetail(row),
      status: check.status as AsyncTaskStatus,
      progress: check.progress,
      startedAt: row.started_at ?? nowIso,
    }
  } catch (err) {
    log.error('Provider check failed', err, { taskId, provider: row.provider })
    /* Provider 查询失败不影响任务状态，仅更新 last_checked_at */
    await db
      .prepare('UPDATE async_tasks SET last_checked_at = ? WHERE id = ?')
      .bind(new Date().toISOString(), taskId)
      .run()
    return rowToDetail(row)
  }
}

/* ─── 4. Cancel Task ────────────────────────────────── */

export async function cancelTask(
  db: D1Database,
  taskId: string,
  userId: string,
): Promise<TaskDetail> {
  const row = await db
    .prepare('SELECT * FROM async_tasks WHERE id = ? AND user_id = ?')
    .bind(taskId, userId)
    .first<TaskRow>()

  if (!row) {
    throw new TaskError(ErrorCode.TASK_NOT_FOUND, `Task not found: ${taskId}`, { taskId })
  }

  if (isTerminal(row.status)) {
    throw new TaskError(
      ErrorCode.TASK_ALREADY_TERMINAL,
      `Task already in terminal state: ${row.status}`,
      { taskId, status: row.status },
    )
  }

  /* Best-effort: 通知 Provider 取消 */
  if (row.external_task_id) {
    try {
      let apiKey = ''
      let processorProvider = row.provider
      if (row.execution_mode === 'user_key') {
        const runtimeConfig = await getUserTaskRuntimeConfig(db, userId, row.provider)
        apiKey = runtimeConfig.apiKey
        processorProvider = runtimeConfig.providerId
      } else if (row.execution_mode === 'platform') {
        apiKey = await getTaskPlatformKey(row.provider)
      }
      const processor = getProcessor(row.task_type, processorProvider)
      await processor.cancel(row.external_task_id, apiKey)
    } catch (err) {
      log.warn('Provider cancel failed (best-effort)', { taskId, error: String(err) })
    }
  }

  /* 更新 D1 */
  const nowIso = new Date().toISOString()
  await db
    .prepare(
      `UPDATE async_tasks
       SET status = 'cancelled', completed_at = ?, updated_at = ?
       WHERE id = ?`,
    )
    .bind(nowIso, nowIso, taskId)
    .run()

  log.info('Task cancelled', { taskId })
  return { ...rowToDetail(row), status: 'cancelled', completedAt: nowIso }
}

/* ─── 5. List Tasks ─────────────────────────────────── */

export async function listTasks(
  db: D1Database,
  userId: string,
  filters: { status?: AsyncTaskStatus; taskType?: AsyncTaskType; page: number; limit: number },
): Promise<ListTasksResult> {
  const conditions = ['user_id = ?']
  const binds: (string | number)[] = [userId]

  if (filters.status) {
    conditions.push('status = ?')
    binds.push(filters.status)
  }
  if (filters.taskType) {
    conditions.push('task_type = ?')
    binds.push(filters.taskType)
  }

  const where = conditions.join(' AND ')
  const offset = (filters.page - 1) * filters.limit

  /* 并行查总数 + 分页数据 */
  const [countResult, dataResult] = await Promise.all([
    db
      .prepare(`SELECT COUNT(*) as cnt FROM async_tasks WHERE ${where}`)
      .bind(...binds)
      .first<{ cnt: number }>(),
    db
      .prepare(
        `SELECT * FROM async_tasks WHERE ${where}
         ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      )
      .bind(...binds, filters.limit, offset)
      .all<TaskRow>(),
  ])

  return {
    tasks: (dataResult.results ?? []).map(rowToDetail),
    total: countResult?.cnt ?? 0,
    page: filters.page,
    limit: filters.limit,
  }
}

/* ─── Internal: Failure Handling (fail-fast, no auto-retry) ─ */

async function handleFailure(
  db: D1Database,
  row: TaskRow,
  errorMsg: string,
): Promise<TaskDetail> {
  const nowIso = new Date().toISOString()

  await db
    .prepare(
      `UPDATE async_tasks
       SET status = 'failed', output_data = ?,
           completed_at = ?, updated_at = ?
       WHERE id = ?`,
    )
    .bind(JSON.stringify({ error: errorMsg }), nowIso, nowIso, row.id)
    .run()

  log.error('Task failed', undefined, { taskId: row.id, errorMsg })
  return {
    ...rowToDetail(row),
    status: 'failed',
    output: { error: errorMsg },
    completedAt: nowIso,
  }
}

/* ─── Internal: Timeout Handling ────────────────────── */

async function handleTimeout(db: D1Database, row: TaskRow): Promise<void> {
  const nowIso = new Date().toISOString()

  await db
    .prepare(
      `UPDATE async_tasks
       SET status = 'failed', output_data = ?,
           completed_at = ?, updated_at = ?
       WHERE id = ?`,
    )
    .bind(JSON.stringify({ error: 'Task timed out' }), nowIso, nowIso, row.id)
    .run()

  log.warn('Task timed out', { taskId: row.id, taskType: row.task_type })
}
