/**
 * [INPUT]: 依赖 @nano-banana/shared 的 TASK_CONFIG/AsyncTaskType/AsyncTaskStatus/ExecutionMode,
 *          依赖 @/lib/api-key-crypto 的 decryptApiKey,
 *          依赖 @/lib/user-model-config, @/lib/tasks/processors 的 getProcessor,
 *          依赖 @/lib/nanoid, @/lib/logger, @/lib/errors, @/lib/env, @/lib/r2, @/lib/storage
 * [OUTPUT]: 对外提供 checkConcurrency / submitTask / checkTask / cancelTask / listTasks，并在完成态统一收口任务输出到账户级 R2
 * [POS]: lib/tasks 的核心服务层 — 整个异步任务系统的心脏，编排 D1 + Processor + 平台 Key / 账号级模型槽位协作
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { TASK_CONFIG } from '@nano-banana/shared'
import type { AsyncTaskStatus, AsyncTaskType, ExecutionMode } from '@nano-banana/shared'

import { decryptApiKey } from '@/lib/api-key-crypto'
import {
  estimateBillableUnits,
  estimateCreditsFromUsage,
  getModelPricing,
  type BillableUsageEstimate,
} from '@/lib/billing/metering'
import { requireEnv } from '@/lib/env'
import { ErrorCode, TaskError } from '@/lib/errors'
import { createLogger } from '@/lib/logger'
import { nanoid } from '@/lib/nanoid'
import { getR2 } from '@/lib/r2'
import {
  extractR2KeyFromFileUrl,
  generateOutputPath,
  invalidateStorageCache,
  toInternalFileUrl,
} from '@/lib/storage'
import {
  deserializeUserModelConfig,
  toRuntimeUserModelConfig,
  type UserModelRuntimeConfig,
} from '@/lib/user-model-config'
import type { NodeCapability } from '@/lib/ai-node-config'
import { getPlatformKey } from '@/services/ai'

import { getProcessor } from './processors'
import type { TaskOutput, TaskProcessor } from './processors'

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
  provider?: string
  capability?: NodeCapability
  modelId?: string
  configId?: string
  executionMode: ExecutionMode
  input: Record<string, unknown>
  workflowId?: string
  nodeId?: string
}

interface ReservedTaskBillingDraft {
  mode: 'reserved'
  inputTokens: null
  outputTokens: null
  billableUnits: number | null
  estimatedCredits: number | null
  category: string | null
  unitLabel: string | null
  basis: string | null
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

function createReservedTaskBillingDraft(): ReservedTaskBillingDraft {
  return {
    mode: 'reserved',
    inputTokens: null,
    outputTokens: null,
    billableUnits: null,
    estimatedCredits: null,
    category: null,
    unitLabel: null,
    basis: null,
  }
}

async function estimateTaskBillingDraft(
  db: D1Database,
  input: {
    provider: string
    modelId: string
    taskType: AsyncTaskType
    taskInput: Record<string, unknown>
  },
): Promise<ReservedTaskBillingDraft> {
  const pricing = await getModelPricing(db, {
    provider: input.provider,
    modelId: input.modelId,
    activeOnly: false,
  })

  const estimate = estimateTaskBillableUnits(input.taskType, pricing?.category, input.taskInput)
  return {
    mode: 'reserved',
    inputTokens: null,
    outputTokens: null,
    billableUnits: estimate.billableUnits,
    estimatedCredits:
      pricing
        ? estimateCreditsFromUsage({
            billableUnits: estimate.billableUnits,
            creditsPer1kUnits: pricing.creditsPer1kUnits,
          })
        : null,
    category: estimate.category,
    unitLabel: estimate.unitLabel,
    basis: estimate.basis,
  }
}

function estimateTaskBillableUnits(
  taskType: AsyncTaskType,
  pricingCategory: string | undefined,
  taskInput: Record<string, unknown>,
): BillableUsageEstimate {
  if (taskType === 'image_gen') {
    return estimateBillableUnits({
      category: (pricingCategory as 'image' | undefined) ?? 'image',
      outputCount:
        typeof taskInput.count === 'number'
          ? taskInput.count
          : typeof taskInput.n === 'number'
            ? taskInput.n
            : 1,
    })
  }

  if (taskType === 'video_gen') {
    return estimateBillableUnits({
      category: (pricingCategory as 'video' | undefined) ?? 'video',
      durationSeconds:
        typeof taskInput.duration === 'string' || typeof taskInput.duration === 'number'
          ? taskInput.duration
          : 5,
    })
  }

  return estimateBillableUnits({
    category: (pricingCategory as 'audio' | undefined) ?? 'audio',
    text: typeof taskInput.text === 'string' ? taskInput.text : '',
  })
}

function toTaskProviderError(
  error: unknown,
  meta: Record<string, unknown>,
  fallbackMessage = 'Task provider request failed',
): TaskError {
  if (error instanceof TaskError) {
    return error
  }

  const message = error instanceof Error ? error.message : fallbackMessage
  return new TaskError(ErrorCode.TASK_PROVIDER_ERROR, message, meta)
}

const CONTENT_TYPE_EXTENSION_MAP: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/webm': 'webm',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
}

function isUrlOutput(output: TaskOutput | undefined): output is TaskOutput & { url: string } {
  return output?.type === 'url' && typeof output.url === 'string' && output.url.trim().length > 0
}

function inferExtensionFromContentType(contentType: string | null | undefined): string | null {
  if (!contentType) {
    return null
  }

  const normalized = contentType.split(';', 1)[0]?.trim().toLowerCase()
  return normalized ? CONTENT_TYPE_EXTENSION_MAP[normalized] ?? null : null
}

function inferExtensionFromUrl(url: string): string | null {
  if (url.startsWith('data:')) {
    const match = /^data:([^;,]+)/i.exec(url)
    return inferExtensionFromContentType(match?.[1] ?? null)
  }

  try {
    const parsed = new URL(url)
    const match = /\.([a-z0-9]+)$/i.exec(parsed.pathname)
    return match?.[1]?.toLowerCase() ?? null
  } catch {
    return null
  }
}

function inferOutputExtension(output: TaskOutput): string {
  return (
    inferExtensionFromContentType(output.contentType) ??
    (output.url ? inferExtensionFromUrl(output.url) : null) ??
    'bin'
  )
}

function inferOutputFileName(taskId: string, output: TaskOutput): string {
  const ext = inferOutputExtension(output)
  return `${taskId}.${ext}`
}

function normalizeInternalOutput(taskId: string, output: TaskOutput, r2Key: string): TaskOutput {
  return {
    ...output,
    url: toInternalFileUrl(r2Key),
    r2_key: r2Key,
    fileName: output.fileName ?? inferOutputFileName(taskId, output),
  }
}

async function fetchOutputPayload(output: TaskOutput): Promise<{
  body: ArrayBuffer
  contentType: string
}> {
  if (!isUrlOutput(output)) {
    throw new Error('Task output is not a valid URL payload')
  }

  const response = await fetch(output.url)
  if (!response.ok) {
    throw new Error(`Failed to fetch task output: ${response.status} ${response.statusText}`)
  }

  const body = await response.arrayBuffer()
  const contentType =
    response.headers.get('content-type') ??
    output.contentType ??
    'application/octet-stream'

  return { body, contentType }
}

async function persistTaskOutput(
  taskId: string,
  userId: string,
  output: TaskOutput,
): Promise<TaskOutput> {
  if (!isUrlOutput(output)) {
    return output
  }

  const existingKey =
    output.r2_key ??
    (output.url ? extractR2KeyFromFileUrl(output.url) : null)

  if (existingKey?.startsWith(`outputs/${userId}/`)) {
    return normalizeInternalOutput(taskId, output, existingKey)
  }

  const { body, contentType } = await fetchOutputPayload(output)
  const ext =
    inferExtensionFromContentType(contentType) ??
    inferOutputExtension({ ...output, contentType }) ??
    'bin'
  const r2Key = generateOutputPath(userId, taskId, ext)
  const fileName = output.fileName ?? `${taskId}.${ext}`
  const r2 = await getR2()

  await r2.put(r2Key, body, {
    httpMetadata: {
      contentType,
      contentDisposition: `inline; filename="${fileName}"`,
    },
  })

  await invalidateStorageCache(userId)

  return {
    ...output,
    contentType,
    fileName,
    r2_key: r2Key,
    url: toInternalFileUrl(r2Key),
  }
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
  const {
    userId,
    taskType,
    provider,
    capability,
    modelId,
    configId,
    executionMode,
    input,
    workflowId,
    nodeId,
  } = params
  const config = TASK_CONFIG[taskType]
  const requestProvider = executionMode === 'platform' ? provider : capability

  if (executionMode === 'platform' && (!provider || !modelId)) {
    throw new TaskError(
      ErrorCode.TASK_PROVIDER_ERROR,
      'Platform task execution requires provider and modelId',
      { taskType, provider, modelId, executionMode },
    )
  }

  if (executionMode === 'user_key' && !capability) {
    throw new TaskError(
      ErrorCode.TASK_PROVIDER_ERROR,
      'User key task execution requires capability',
      { taskType, capability, executionMode },
    )
  }

  let resolvedProvider = provider ?? ''
  let resolvedModelId = modelId ?? ''
  let resolvedInput = input
  let billingDraft = createReservedTaskBillingDraft()

  /* 并发检查 */
  await checkConcurrency(db, userId)

  let apiKey = ''
  let processor: ReturnType<typeof getProcessor>
  let submitResult: Awaited<ReturnType<TaskProcessor['submit']>>

  try {
    if (executionMode === 'platform') {
      apiKey = await getTaskPlatformKey(provider as string)
      billingDraft = await estimateTaskBillingDraft(db, {
        provider: resolvedProvider,
        modelId: resolvedModelId,
        taskType,
        taskInput: input,
      })
      resolvedInput = {
        ...input,
        billingDraft,
      }
    } else {
      const runtimeConfig = await getUserTaskRuntimeConfig(
        db,
        userId,
        capability as NodeCapability,
        configId,
      )
      apiKey =
        runtimeConfig.providerId === 'kling' && runtimeConfig.secretKey
          ? `${runtimeConfig.apiKey}:${runtimeConfig.secretKey}`
          : runtimeConfig.apiKey
      resolvedProvider = runtimeConfig.providerId
      resolvedModelId = runtimeConfig.modelId
      billingDraft = await estimateTaskBillingDraft(db, {
        provider: resolvedProvider,
        modelId: resolvedModelId,
        taskType,
        taskInput: input,
      })
      resolvedInput = {
        ...input,
        ...(runtimeConfig.baseUrl ? { baseUrl: runtimeConfig.baseUrl } : {}),
        billingDraft,
      }
    }

    processor = getProcessor(taskType, resolvedProvider)
    submitResult = await processor.submit(
      { model: resolvedModelId, params: resolvedInput },
      apiKey,
    )
  } catch (error) {
    log.error('Task submit failed', error, {
      taskType,
      provider: requestProvider,
      resolvedProvider,
      modelId: resolvedModelId,
      executionMode,
    })
    throw toTaskProviderError(error, {
      taskType,
      provider: requestProvider,
      resolvedProvider,
      modelId: resolvedModelId,
      executionMode,
    })
  }

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
      taskId, userId, taskType, requestProvider, resolvedModelId,
      submitResult.externalTaskId, executionMode, JSON.stringify(resolvedInput),
      initialStatus,
      config.maxRetries, workflowId ?? null, nodeId ?? null,
      now, initialStatus === 'running' ? now : null, now,
    )
    .run()

  log.info('Task submitted', {
    taskId,
    taskType,
    provider: requestProvider,
    resolvedProvider,
    executionMode,
    initialStatus,
  })

  return {
    id: taskId,
    taskType,
    provider: requestProvider as string,
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
  capability: NodeCapability,
  configId?: string,
): Promise<UserModelRuntimeConfig> {
  try {
    const keyRow = await findUserConfigRow(db, userId, capability, configId)

    if (!keyRow) {
      throw new TaskError(
        ErrorCode.TASK_PROVIDER_ERROR,
        `No API key configured for capability: ${capability}`,
        { capability },
      )
    }

    const encryptionKey = await requireEnv('ENCRYPTION_KEY')
    const decrypted = await decryptApiKey(keyRow.encrypted_key, encryptionKey)
    const payload = deserializeUserModelConfig(keyRow.configId, decrypted)
    return toRuntimeUserModelConfig(keyRow.configId, payload)
  } catch (error) {
    throw toTaskProviderError(error, { userId, capability, configId })
  }
}

async function findUserConfigRow(
  db: D1Database,
  userId: string,
  capability: string,
  configId?: string,
): Promise<{ encrypted_key: string; configId: string } | null> {
  if (configId) {
    const row = await db
      .prepare(
        `SELECT encrypted_key FROM user_api_keys
         WHERE user_id = ? AND provider = ? AND is_active = 1`,
      )
      .bind(userId, configId)
      .first<{ encrypted_key: string }>()

    if (row) {
      return { ...row, configId }
    }
    return null
  }

  const encryptionKey = await requireEnv('ENCRYPTION_KEY')
  const rows = await db
    .prepare(
      `SELECT provider, encrypted_key FROM user_api_keys
       WHERE user_id = ? AND is_active = 1
       ORDER BY created_at ASC`,
    )
    .bind(userId)
    .all<{ provider: string; encrypted_key: string }>()

  for (const row of rows.results ?? []) {
    const decrypted = await decryptApiKey(String(row.encrypted_key), encryptionKey)
    const payload = deserializeUserModelConfig(String(row.provider), decrypted)
    if (payload.capability === capability) {
      return { encrypted_key: String(row.encrypted_key), configId: String(row.provider) }
    }
  }

  return null
}

async function getTaskPlatformKey(provider: string): Promise<string> {
  try {
    switch (provider) {
      case 'openrouter':
      case 'deepseek':
      case 'gemini':
        return await getPlatformKey(provider)
      case 'openai':
        return await requireEnv('OPENAI_API_KEY')
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
  } catch (error) {
    throw toTaskProviderError(error, { provider })
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
    const runtimeConfig = await getUserTaskRuntimeConfig(
      db,
      userId,
      row.provider as NodeCapability,
    )
    apiKey =
      runtimeConfig.providerId === 'kling' && runtimeConfig.secretKey
        ? `${runtimeConfig.apiKey}:${runtimeConfig.secretKey}`
        : runtimeConfig.apiKey
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
      const persistedOutput = await persistTaskOutput(taskId, userId, check.result)

      await db
        .prepare(
          `UPDATE async_tasks
           SET status = 'completed', progress = 100,
               output_data = ?, completed_at = ?,
               last_checked_at = ?, updated_at = ?
           WHERE id = ?`,
        )
        .bind(JSON.stringify(persistedOutput), nowIso, nowIso, nowIso, taskId)
        .run()

      log.info('Task completed', { taskId })
      return {
        ...rowToDetail(row),
        status: 'completed',
        progress: 100,
        output: persistedOutput,
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
        const runtimeConfig = await getUserTaskRuntimeConfig(
          db,
          userId,
          row.provider as NodeCapability,
        )
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
