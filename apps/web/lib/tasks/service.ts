/**
 * [INPUT]: 依赖 @nano-banana/shared 的 TASK_CONFIG/AsyncTaskType/AsyncTaskStatus/ExecutionMode,
 *          依赖 @/lib/api-key-crypto 的 decryptApiKey，依赖 @/lib/billing/ledger 与 @/lib/billing/metering,
 *          依赖 @/lib/user-model-config, @/lib/tasks/processors 的 getProcessor,
 *          依赖 @/lib/nanoid, @/lib/logger, @/lib/errors, @/lib/env, @/lib/r2, @/lib/storage
 * [OUTPUT]: 对外提供 checkConcurrency / submitTask / processTaskDispatch / checkTask / cancelTask / listTasks / deleteTasks，并在平台模式下接回任务冻结/确认/退款与 orchestrator 持久化
 * [POS]: lib/tasks 的核心服务层 — 整个异步任务系统的心脏，编排 D1 + Processor + Queue/Workflow 双轨 + 平台 Key / 账号级模型槽位协作
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { TASK_CONFIG } from '@nano-banana/shared'
import type {
  AsyncTaskStatus,
  AsyncTaskType,
  ExecutionMode,
  TaskOrchestrator,
  TaskQueueMessage,
} from '@nano-banana/shared'

import { decryptApiKey, encryptApiKey } from '@/lib/api-key-crypto'
import {
  confirmFrozenCredits,
  freezeCredits,
  refundFrozenCredits,
} from '@/lib/billing/ledger'
import {
  estimateBillableUnits,
  estimateCreditsFromUsage,
  getModelPricing,
  type BillableUsageEstimate,
} from '@/lib/billing/metering'
import { requireEnv } from '@/lib/env'
import { ErrorCode, TaskError } from '@/lib/errors'
import {
  finalizeLearnedImageCapabilities,
  getStaticImageModelCapabilities,
  learnImageCapabilitiesFromError,
  mergeImageModelCapabilities,
  type ImageModelCapabilities,
} from '@/lib/image-model-capabilities'
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
  serializeUserModelConfig,
  toRuntimeUserModelConfig,
  type UserModelConfigPayload,
  type UserModelRuntimeConfig,
} from '@/lib/user-model-config'
import type { NodeCapability } from '@/lib/ai-node-config'
import { getPlatformKey } from '@/services/ai'

import { getProcessor } from './processors'
import type { TaskOutput, TaskProcessor } from './processors'

const log = createLogger('task:service')
const FREE_TASK_CONCURRENCY_LIMIT = 1
const WORKFLOW_STARTUP_GRACE_MS = 60_000

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
  guestUserKeyConfig?: {
    configId?: string
    capability: NodeCapability
    providerKind:
      | 'openai-compatible'
      | 'openrouter'
      | 'google-image'
      | 'gemini'
      | 'kling'
      | 'openai-audio'
    providerId: string
    apiKey: string
    modelId: string
    baseUrl?: string
    secretKey?: string
    imageCapabilities?: ImageModelCapabilities
  }
  executionMode: ExecutionMode
  input: Record<string, unknown>
  workflowId?: string
  nodeId?: string
  orchestrator?: TaskOrchestrator
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

interface TaskBillingInput extends Record<string, unknown> {
  billingDraft?: ReservedTaskBillingDraft
}

interface PersistedDataUrlDescriptor {
  __type: 'omitted-data-url'
  mediaType: string
  length: number
}

interface PersistedTaskRuntimeMeta {
  userConfigId?: string
  orchestrator?: TaskOrchestrator
}

interface TaskExecutionSnapshot {
  taskType: AsyncTaskType
  requestProvider: string
  resolvedProvider: string
  resolvedModelId: string
  executionMode: ExecutionMode
  resolvedInput: Record<string, unknown>
  originalInput: Record<string, unknown>
  apiKey?: string
  runtimeConfig?: UserModelRuntimeConfig | null
  runtimeMeta?: PersistedTaskRuntimeMeta
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

export interface DeleteTasksResult {
  deletedIds: string[]
}

interface TaskExecutionRequest {
  taskId: string
  userId: string
  taskType: AsyncTaskType
  requestProvider: string
  initialResolvedProvider: string
  resolvedModelId: string
  executionMode: ExecutionMode
  resolvedInput: Record<string, unknown>
  originalInput: Record<string, unknown>
  apiKey: string
  reservedPlatformCredits: number
  runtimeConfig: UserModelRuntimeConfig | null
  orchestrator: TaskOrchestrator
}

interface WorkflowRuntimeStatus {
  status:
    | 'queued'
    | 'running'
    | 'paused'
    | 'errored'
    | 'terminated'
    | 'complete'
    | 'waitingForPause'
    | 'waiting'
    | 'unknown'
  error?: {
    name: string
    message: string
  }
  output?: unknown
}

export interface SubmitTaskResult extends TaskDetail {
  dispatch?: TaskExecutionDispatch
}

export interface TaskExecutionDispatch {
  taskId: string
  userId: string
  orchestrator: TaskOrchestrator
}

export interface TaskServiceRuntime {
  requireEnv: (key: string) => Promise<string>
  getR2: () => Promise<R2Bucket>
  invalidateStorageCache: (userId: string) => Promise<void>
  getPlatformKey: (provider: string) => Promise<string>
  dispatchTask?: (message: TaskQueueMessage) => Promise<void>
  getWorkflowStatus?: (instanceId: string) => Promise<WorkflowRuntimeStatus | null>
}

const defaultTaskRuntime: TaskServiceRuntime = {
  requireEnv,
  getR2,
  invalidateStorageCache,
  getPlatformKey,
}

/* ─── Helpers ───────────────────────────────────────── */

function rowToDetail(row: TaskRow): TaskDetail {
  const persistedInput = JSON.parse(row.input_data || '{}') as Record<string, unknown>
  return {
    id: row.id,
    taskType: row.task_type,
    provider: row.provider,
    modelId: row.model_id,
    executionMode: row.execution_mode,
    status: row.status,
    progress: row.progress,
    input: stripPersistedTaskRuntimeMeta(persistedInput),
    output: row.output_data ? JSON.parse(row.output_data) : null,
    retryCount: row.retry_count,
    workflowId: row.workflow_id,
    nodeId: row.node_id,
    createdAt: row.created_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  }
}

function isDataUrl(value: string): boolean {
  return /^data:[^;,]+;base64,/i.test(value)
}

function describeOmittedDataUrl(value: string): PersistedDataUrlDescriptor {
  const mediaType = /^data:([^;,]+)/i.exec(value)?.[1] ?? 'application/octet-stream'
  return {
    __type: 'omitted-data-url',
    mediaType,
    length: value.length,
  }
}

function sanitizeValueForPersistence(value: unknown): unknown {
  if (typeof value === 'string') {
    return isDataUrl(value) ? describeOmittedDataUrl(value) : value
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValueForPersistence(item))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        key,
        sanitizeValueForPersistence(nested),
      ]),
    )
  }

  return value
}

function sanitizeTaskInputForPersistence(input: Record<string, unknown>): Record<string, unknown> {
  return sanitizeValueForPersistence(input) as Record<string, unknown>
}

function withPersistedTaskRuntimeMeta(
  input: Record<string, unknown>,
  meta?: PersistedTaskRuntimeMeta,
): Record<string, unknown> {
  if (!meta || !Object.values(meta).some(Boolean)) {
    return input
  }

  return {
    ...input,
    __taskRuntime: meta,
  }
}

function stripPersistedTaskRuntimeMeta(input: Record<string, unknown>): Record<string, unknown> {
  if (!('__taskRuntime' in input)) {
    return input
  }

  const rest = { ...input }
  delete rest.__taskRuntime
  return rest
}

function readPersistedTaskRuntimeMeta(input: Record<string, unknown>): PersistedTaskRuntimeMeta | null {
  const raw = input.__taskRuntime
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const meta = raw as PersistedTaskRuntimeMeta
  const orchestrator =
    meta.orchestrator === 'workflow' || meta.orchestrator === 'legacy_queue'
      ? meta.orchestrator
      : undefined

  if (!meta.userConfigId && !orchestrator) {
    return null
  }

  return {
    ...(meta.userConfigId ? { userConfigId: meta.userConfigId } : {}),
    ...(orchestrator ? { orchestrator } : {}),
  }
}

function isTerminal(status: AsyncTaskStatus): boolean {
  return status === 'completed' || status === 'failed' || status === 'cancelled'
}

async function loadTaskRow(
  db: D1Database,
  taskId: string,
  userId: string,
): Promise<TaskRow | null> {
  return db
    .prepare('SELECT * FROM async_tasks WHERE id = ? AND user_id = ?')
    .bind(taskId, userId)
    .first<TaskRow>()
}

function shouldDeferTaskExecution(taskType: AsyncTaskType): boolean {
  return taskType === 'image_gen'
}

function normalizeTaskOrchestrator(
  taskType: AsyncTaskType,
  orchestrator?: TaskOrchestrator,
): TaskOrchestrator {
  if (!shouldDeferTaskExecution(taskType)) {
    return 'legacy_queue'
  }

  return orchestrator === 'workflow' ? 'workflow' : 'legacy_queue'
}

function isWorkflowRunningLikeStatus(
  status: WorkflowRuntimeStatus['status'],
): boolean {
  return (
    status === 'running' ||
    status === 'waiting' ||
    status === 'waitingForPause' ||
    status === 'paused'
  )
}

async function dispatchWorkflowStartupFallback(
  db: D1Database,
  row: TaskRow,
  runtime: TaskServiceRuntime,
  workflowStatus: WorkflowRuntimeStatus['status'],
): Promise<TaskDetail | null> {
  if (!runtime.dispatchTask) {
    return null
  }

  const now = Date.now()
  const created = new Date(row.created_at).getTime()
  const lastChecked = row.last_checked_at ? new Date(row.last_checked_at).getTime() : 0

  if (now - created < WORKFLOW_STARTUP_GRACE_MS) {
    return null
  }

  if (lastChecked && now - lastChecked < WORKFLOW_STARTUP_GRACE_MS) {
    return null
  }

  const nowIso = new Date(now).toISOString()

  await runtime.dispatchTask({
    taskId: row.id,
    userId: row.user_id,
  })

  await db
    .prepare(
      `UPDATE async_tasks
       SET last_checked_at = ?, updated_at = ?
       WHERE id = ? AND user_id = ? AND status = 'pending' AND external_task_id IS NULL`,
    )
    .bind(nowIso, nowIso, row.id, row.user_id)
    .run()

  log.warn('Workflow task startup stalled, dispatched queue fallback', {
    taskId: row.id,
    userId: row.user_id,
    taskType: row.task_type,
    workflowStatus,
  })

  const refreshedRow = await loadTaskRow(db, row.id, row.user_id)
  return refreshedRow ? rowToDetail(refreshedRow) : null
}

async function observeWorkflowTaskState(
  db: D1Database,
  row: TaskRow,
  runtime: TaskServiceRuntime,
): Promise<TaskDetail | null> {
  if (!runtime.getWorkflowStatus) {
    return null
  }

  const workflowStatus = await runtime.getWorkflowStatus(row.id)
  if (!workflowStatus) {
    return dispatchWorkflowStartupFallback(db, row, runtime, 'unknown')
  }

  if (workflowStatus.status === 'errored' || workflowStatus.status === 'terminated') {
    const errorMessage =
      workflowStatus.error?.message ??
      `Workflow instance ${workflowStatus.status}`
    return handleFailure(db, row, errorMessage)
  }

  if (
    workflowStatus.status === 'complete' &&
    (row.status === 'pending' || row.status === 'running') &&
    !row.external_task_id
  ) {
    return handleFailure(
      db,
      row,
      'Workflow completed without updating task state',
    )
  }

  if (row.status === 'pending' && isWorkflowRunningLikeStatus(workflowStatus.status)) {
    const nowIso = new Date().toISOString()
    await db
      .prepare(
        `UPDATE async_tasks
         SET status = 'running', progress = ?,
             started_at = COALESCE(started_at, ?), last_checked_at = ?, updated_at = ?
         WHERE id = ? AND user_id = ? AND status = 'pending'`,
      )
      .bind(5, nowIso, nowIso, nowIso, row.id, row.user_id)
      .run()

    const refreshedRow = await loadTaskRow(db, row.id, row.user_id)
    return refreshedRow ? rowToDetail(refreshedRow) : null
  }

  if (
    row.status === 'pending' &&
    !row.external_task_id &&
    (workflowStatus.status === 'queued' || workflowStatus.status === 'unknown')
  ) {
    return dispatchWorkflowStartupFallback(db, row, runtime, workflowStatus.status)
  }

  return null
}

function getReservedTaskCredits(input: Record<string, unknown>): number {
  const billingDraft = (input as TaskBillingInput).billingDraft
  const estimatedCredits = billingDraft?.estimatedCredits

  if (typeof estimatedCredits !== 'number' || !Number.isFinite(estimatedCredits) || estimatedCredits <= 0) {
    return 0
  }

  return Math.round(estimatedCredits)
}

function buildTaskExecutionSnapshotKey(userId: string, taskId: string): string {
  return `task-inputs/${userId}/${taskId}.json`
}

function buildTaskDispatch(
  taskId: string,
  userId: string,
  orchestrator: TaskOrchestrator,
): TaskExecutionDispatch {
  return { taskId, userId, orchestrator }
}

async function refundTaskCredits(input: {
  userId: string
  referenceId: string
  source: string
  description: string
  requestedCredits?: number
}) {
  await refundFrozenCredits({
    userId: input.userId,
    referenceId: input.referenceId,
    requestedCredits: input.requestedCredits,
    source: input.source,
    description: input.description,
  })
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
  runtime: TaskServiceRuntime = defaultTaskRuntime,
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
  const r2 = await runtime.getR2()

  await r2.put(r2Key, body, {
    httpMetadata: {
      contentType,
      contentDisposition: `inline; filename="${fileName}"`,
    },
  })

  await runtime.invalidateStorageCache(userId)

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

async function listActiveTasksForUser(
  db: D1Database,
  userId: string,
): Promise<TaskRow[]> {
  const result = await db
    .prepare(
      `SELECT * FROM async_tasks
       WHERE user_id = ? AND status IN ('pending', 'running')
       ORDER BY created_at DESC`,
    )
    .bind(userId)
    .all<TaskRow>()

  return result.results ?? []
}

async function resolveActiveTaskSlot(
  db: D1Database,
  row: TaskRow,
  runtime: TaskServiceRuntime,
  expirationMessage: string,
): Promise<{ detail: TaskDetail | null; released: boolean }> {
  const persistedInput = JSON.parse(row.input_data || '{}') as Record<string, unknown>
  const runtimeMeta = readPersistedTaskRuntimeMeta(persistedInput)
  const taskOrchestrator = runtimeMeta?.orchestrator ?? 'legacy_queue'

  if (taskOrchestrator === 'workflow') {
    const observed = await observeWorkflowTaskState(db, row, runtime)
    if (observed) {
      return {
        detail: isTerminal(observed.status) ? null : observed,
        released: isTerminal(observed.status),
      }
    }
  }

  const config = TASK_CONFIG[row.task_type]
  const created = new Date(row.created_at).getTime()
  if (Date.now() - created > config.timeoutMs) {
    if (taskOrchestrator === 'workflow') {
      await handleFailure(db, row, expirationMessage)
    } else {
      await handleTimeout(db, row, expirationMessage)
    }
    return { detail: null, released: true }
  }

  return { detail: rowToDetail(row), released: false }
}

async function releaseBlockedActiveTasksBeforeConcurrency(
  db: D1Database,
  userId: string,
  runtime: TaskServiceRuntime,
): Promise<void> {
  const activeRows = await listActiveTasksForUser(db, userId)

  for (const row of activeRows) {
    const resolution = await resolveActiveTaskSlot(
      db,
      row,
      runtime,
      `Task slot expired after ${TASK_CONFIG[row.task_type].timeoutMs / 1000}s before new submission`,
    )

    if (resolution.released) {
      log.warn('Released stale active task slot before concurrency gate', {
        taskId: row.id,
        userId,
        taskType: row.task_type,
        workflowId: row.workflow_id,
        nodeId: row.node_id,
      })
    }
  }
}

async function findLatestActiveTaskForNode(
  db: D1Database,
  input: {
    userId: string
    taskType: AsyncTaskType
    workflowId?: string
    nodeId?: string
  },
): Promise<TaskRow | null> {
  if (!input.workflowId || !input.nodeId) {
    return null
  }

  return db
    .prepare(
      `SELECT * FROM async_tasks
       WHERE user_id = ?
         AND task_type = ?
         AND workflow_id = ?
         AND node_id = ?
         AND status IN ('pending', 'running')
       ORDER BY created_at DESC
       LIMIT 1`,
    )
    .bind(input.userId, input.taskType, input.workflowId, input.nodeId)
    .first<TaskRow>()
}

async function resolveReusableActiveTask(
  db: D1Database,
  row: TaskRow,
  runtime: TaskServiceRuntime,
): Promise<TaskDetail | null> {
  const resolution = await resolveActiveTaskSlot(
    db,
    row,
    runtime,
    `Task slot expired after ${TASK_CONFIG[row.task_type].timeoutMs / 1000}s before node rerun`,
  )

  return resolution.released ? null : resolution.detail
}

/* ─── 2. Submit Task ────────────────────────────────── */

export async function submitTask(
  db: D1Database,
  params: SubmitTaskParams,
  runtime: TaskServiceRuntime = defaultTaskRuntime,
): Promise<SubmitTaskResult> {
  const {
    userId,
    taskType,
    provider,
    capability,
    modelId,
    configId,
    guestUserKeyConfig,
    executionMode,
    input,
    workflowId,
    nodeId,
    orchestrator,
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
  let reservedPlatformCredits = 0
  let runtimeConfig: UserModelRuntimeConfig | null = null
  let imageCapabilities: ImageModelCapabilities | undefined
  let persistedRuntimeMeta: PersistedTaskRuntimeMeta | undefined
  const taskId = nanoid()
  const taskOrchestrator = normalizeTaskOrchestrator(taskType, orchestrator)

  const activeTaskForNode = await findLatestActiveTaskForNode(db, {
    userId,
    taskType,
    workflowId,
    nodeId,
  })

  if (activeTaskForNode) {
    const reusableTask = await resolveReusableActiveTask(db, activeTaskForNode, runtime)
    if (reusableTask) {
      log.info('Reusing active task for node rerun', {
        taskId: reusableTask.id,
        taskType,
        workflowId,
        nodeId,
        status: reusableTask.status,
      })
      return reusableTask
    }
  }

  await releaseBlockedActiveTasksBeforeConcurrency(db, userId, runtime)

  /* 并发检查 */
  await checkConcurrency(db, userId)

  let apiKey = ''
  let submitResult: Awaited<ReturnType<TaskProcessor['submit']>> | null = null
  let persistedOutput: TaskOutput | null = null
  let persistedProvider = requestProvider as string
  let persistedModelId = resolvedModelId

  try {
    if (executionMode === 'platform') {
      apiKey = await getTaskPlatformKey(provider as string, runtime)
      imageCapabilities =
        taskType === 'image_gen'
          ? mergeImageModelCapabilities(
              getStaticImageModelCapabilities(resolvedProvider, resolvedModelId),
            )
          : undefined
      const billingDraft = await estimateTaskBillingDraft(db, {
        provider: resolvedProvider,
        modelId: resolvedModelId,
        taskType,
        taskInput: input,
      })
      resolvedInput = {
        ...input,
        billingDraft,
        ...(imageCapabilities ? { imageCapabilities } : {}),
      }
      reservedPlatformCredits = getReservedTaskCredits(resolvedInput)

      if (reservedPlatformCredits > 0) {
        await freezeCredits({
          userId,
          requestedCredits: reservedPlatformCredits,
          referenceId: taskId,
          source: 'task_submit_platform_freeze',
          description: `Freeze credits for async task ${taskType} ${resolvedProvider}/${resolvedModelId}`,
        })
      }
    } else {
      runtimeConfig = await getUserTaskRuntimeConfig(
        db,
        userId,
        capability as NodeCapability,
        configId,
        runtime,
        guestUserKeyConfig,
      )
      apiKey =
        runtimeConfig.providerId === 'kling' && runtimeConfig.secretKey
          ? `${runtimeConfig.apiKey}:${runtimeConfig.secretKey}`
          : runtimeConfig.apiKey
      resolvedProvider = runtimeConfig.providerId
      resolvedModelId = runtimeConfig.modelId
      imageCapabilities =
        taskType === 'image_gen'
          ? mergeImageModelCapabilities(
              getStaticImageModelCapabilities(
                runtimeConfig.providerId,
                runtimeConfig.modelId,
              ),
              runtimeConfig.imageCapabilities,
            )
          : undefined
      resolvedInput = {
        ...input,
        ...(runtimeConfig.baseUrl ? { baseUrl: runtimeConfig.baseUrl } : {}),
        ...(imageCapabilities ? { imageCapabilities } : {}),
      }
      persistedRuntimeMeta = {
        userConfigId: runtimeConfig.configId,
        orchestrator: taskOrchestrator,
      }
    }

    if (!shouldDeferTaskExecution(taskType)) {
      submitResult = await getProcessor(taskType, resolvedProvider).submit(
        { model: resolvedModelId, params: resolvedInput },
        apiKey,
      )
      persistedProvider = submitResult.providerOverride ?? requestProvider ?? resolvedProvider
      persistedModelId = submitResult.modelOverride ?? resolvedModelId

      if (submitResult.initialStatus === 'completed') {
        if (!submitResult.result) {
          throw new Error('Synchronous task provider completed without output')
        }

        persistedOutput = await persistTaskOutput(taskId, userId, submitResult.result, runtime)
      }
    } else {
      persistedRuntimeMeta = {
        ...persistedRuntimeMeta,
        orchestrator: taskOrchestrator,
      }
      getProcessor(taskType, resolvedProvider)
      await persistTaskExecutionSnapshot(
        taskId,
        userId,
        {
          taskType,
          requestProvider: requestProvider as string,
          resolvedProvider,
          resolvedModelId,
          executionMode,
          resolvedInput,
          originalInput: input,
          apiKey,
          runtimeConfig,
          runtimeMeta: persistedRuntimeMeta,
        },
        runtime,
      )
    }
  } catch (error) {
    if (executionMode === 'user_key' && taskType === 'image_gen' && runtimeConfig) {
      await learnUserImageCapabilitiesFromTaskError(
        db,
        userId,
        runtimeConfig,
        input,
        error,
        runtime,
      )
    }

    if (executionMode === 'platform' && reservedPlatformCredits > 0) {
      await refundTaskCredits({
        userId,
        referenceId: taskId,
        source: 'task_submit_platform_failure_refund',
        description: `Refund failed async task submission ${taskType} ${resolvedProvider}/${resolvedModelId}`,
      })
    }

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
  const now = new Date().toISOString()
  const initialStatus = submitResult?.initialStatus ?? 'pending'
  const persistedInput = sanitizeTaskInputForPersistence(
    withPersistedTaskRuntimeMeta(resolvedInput, persistedRuntimeMeta),
  )
  const initialProgress = initialStatus === 'completed' ? 100 : 0
  const startedAt = initialStatus === 'running' || initialStatus === 'completed' ? now : null
  const completedAt = initialStatus === 'completed' ? now : null

  try {
    await db
      .prepare(
        `INSERT INTO async_tasks (
          id, user_id, task_type, provider, model_id,
          external_task_id, execution_mode, input_data,
          status, progress, retry_count, max_retries, workflow_id, node_id,
          created_at, started_at, completed_at, output_data, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        taskId, userId, taskType, persistedProvider, persistedModelId,
        submitResult?.externalTaskId ?? null, executionMode, JSON.stringify(persistedInput),
        initialStatus, initialProgress,
        config.maxRetries, workflowId ?? null, nodeId ?? null,
        now, startedAt, completedAt, persistedOutput ? JSON.stringify(persistedOutput) : null, now,
      )
      .run()

    if (executionMode === 'platform' && reservedPlatformCredits > 0 && initialStatus === 'completed') {
      await confirmFrozenCredits({
        userId,
        referenceId: taskId,
        requestedCredits: reservedPlatformCredits,
        source: 'task_platform_confirm',
        description: `Confirm async task billing ${taskType} ${persistedProvider}/${persistedModelId}`,
      })
    }
  } catch (error) {
    if (executionMode === 'platform' && reservedPlatformCredits > 0) {
      await refundTaskCredits({
        userId,
        referenceId: taskId,
        source: 'task_submit_platform_insert_refund',
        description: `Refund async task credits after persistence failure ${taskType} ${persistedProvider}/${persistedModelId}`,
      })
    }

    if (shouldDeferTaskExecution(taskType)) {
      await deleteTaskExecutionSnapshot(taskId, userId, runtime).catch(() => undefined)
    }

    throw error
  }

  log.info('Task submitted', {
    taskId,
    taskType,
    provider: requestProvider,
    resolvedProvider: persistedProvider,
    executionMode,
    initialStatus,
  })

  return {
    id: taskId,
    taskType,
    provider: persistedProvider,
    modelId: persistedModelId,
    executionMode,
    status: initialStatus,
    progress: initialProgress,
    input,
    output: persistedOutput,
    retryCount: 0,
    workflowId: workflowId ?? null,
    nodeId: nodeId ?? null,
    createdAt: now,
    startedAt,
    completedAt,
    dispatch:
      shouldDeferTaskExecution(taskType)
        ? buildTaskDispatch(taskId, userId, taskOrchestrator)
        : undefined,
  }
}

async function persistTaskExecutionSnapshot(
  taskId: string,
  userId: string,
  payload: TaskExecutionSnapshot,
  runtime: TaskServiceRuntime = defaultTaskRuntime,
): Promise<void> {
  const r2 = await runtime.getR2()
  await r2.put(
    buildTaskExecutionSnapshotKey(userId, taskId),
    JSON.stringify(payload),
    {
      httpMetadata: {
        contentType: 'application/json',
      },
    },
  )
}

async function readTaskExecutionSnapshot(
  taskId: string,
  userId: string,
  runtime: TaskServiceRuntime = defaultTaskRuntime,
): Promise<TaskExecutionSnapshot> {
  const r2 = await runtime.getR2()
  const obj = await r2.get(buildTaskExecutionSnapshotKey(userId, taskId))

  if (!obj) {
    throw new Error(`Task execution snapshot not found for task: ${taskId}`)
  }

  return obj.json<TaskExecutionSnapshot>()
}

async function deleteTaskExecutionSnapshot(
  taskId: string,
  userId: string,
  runtime: TaskServiceRuntime = defaultTaskRuntime,
): Promise<void> {
  const r2 = await runtime.getR2()
  await r2.delete(buildTaskExecutionSnapshotKey(userId, taskId))
}

export async function processTaskDispatch(
  db: D1Database,
  message: TaskQueueMessage,
  runtime: TaskServiceRuntime = defaultTaskRuntime,
): Promise<void> {
  const row = await loadTaskRow(db, message.taskId, message.userId)

  if (!row) {
    log.warn('Dispatched task missing from database', {
      taskId: message.taskId,
      userId: message.userId,
    })
    return
  }

  if (isTerminal(row.status)) {
    log.info('Dispatched task already terminal, skip execution', {
      taskId: row.id,
      status: row.status,
    })
    await deleteTaskExecutionSnapshot(row.id, row.user_id, runtime).catch(() => undefined)
    return
  }

  try {
    const persistedInput = JSON.parse(row.input_data || '{}') as Record<string, unknown>
    const runtimeMeta = readPersistedTaskRuntimeMeta(persistedInput)
    const executionSnapshot = await readTaskExecutionSnapshot(row.id, row.user_id, runtime)

    let runtimeConfig: UserModelRuntimeConfig | null = executionSnapshot.runtimeConfig ?? null
    let apiKey = executionSnapshot.apiKey ?? ''

    if (!apiKey) {
      if (row.execution_mode === 'platform') {
        apiKey = await getTaskPlatformKey(executionSnapshot.resolvedProvider, runtime)
      } else {
        runtimeConfig = await getUserTaskRuntimeConfig(
          db,
          row.user_id,
          row.provider as NodeCapability,
          runtimeMeta?.userConfigId ?? executionSnapshot.runtimeMeta?.userConfigId,
          runtime,
        )
        apiKey =
          runtimeConfig.providerId === 'kling' && runtimeConfig.secretKey
            ? `${runtimeConfig.apiKey}:${runtimeConfig.secretKey}`
            : runtimeConfig.apiKey
      }
    }

    await executeTaskRequest(
      db,
      {
        taskId: row.id,
        userId: row.user_id,
        taskType: row.task_type,
        requestProvider: executionSnapshot.requestProvider,
        initialResolvedProvider: executionSnapshot.resolvedProvider,
        resolvedModelId: executionSnapshot.resolvedModelId,
        executionMode: row.execution_mode,
        resolvedInput: executionSnapshot.resolvedInput,
        originalInput: executionSnapshot.originalInput,
        apiKey,
        reservedPlatformCredits: getReservedTaskCredits(persistedInput),
        runtimeConfig,
        orchestrator:
          runtimeMeta?.orchestrator ??
          executionSnapshot.runtimeMeta?.orchestrator ??
          'legacy_queue',
      },
      runtime,
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    await handleFailure(db, row, errorMessage, runtime)
  }
}

async function executeTaskRequest(
  db: D1Database,
  deferred: TaskExecutionRequest,
  runtime: TaskServiceRuntime = defaultTaskRuntime,
): Promise<void> {
  const {
    taskId,
    userId,
    taskType,
    requestProvider,
    initialResolvedProvider,
    resolvedModelId,
    executionMode,
    resolvedInput,
    originalInput,
    apiKey,
    reservedPlatformCredits,
    runtimeConfig,
  } = deferred

  const startedAt = new Date().toISOString()
  const claimResult = await db
    .prepare(
      `UPDATE async_tasks
       SET status = 'running', progress = 5,
           started_at = COALESCE(started_at, ?), updated_at = ?
       WHERE id = ? AND user_id = ? AND status = 'pending' AND external_task_id IS NULL`,
    )
    .bind(startedAt, startedAt, taskId, userId)
    .run()

  if (!(claimResult.meta.changes ?? 0)) {
    log.info('Task execution claim skipped', { taskId, userId, taskType })
    return
  }

  try {
    const processor = getProcessor(taskType, initialResolvedProvider)
    const submitResult = await processor.submit(
      { model: resolvedModelId, params: resolvedInput },
      apiKey,
    )
    const resolvedProvider = submitResult.providerOverride ?? initialResolvedProvider
    const persistedModelId = submitResult.modelOverride ?? resolvedModelId

    if (submitResult.initialStatus === 'completed') {
      if (!submitResult.result) {
        throw new Error('Task execution provider completed without output')
      }

      const persistedOutput = await persistTaskOutput(taskId, userId, submitResult.result, runtime)
      const completedAt = new Date().toISOString()

      if (executionMode === 'platform' && reservedPlatformCredits > 0) {
        await confirmFrozenCredits({
          userId,
          referenceId: taskId,
          requestedCredits: reservedPlatformCredits,
          source: 'task_platform_confirm',
          description: `Confirm async task billing ${taskType} ${resolvedProvider}/${persistedModelId}`,
        })
      }

      await db
        .prepare(
          `UPDATE async_tasks
           SET provider = ?, model_id = ?, status = 'completed', progress = 100, external_task_id = ?,
               output_data = ?, completed_at = ?, last_checked_at = ?, updated_at = ?
           WHERE id = ? AND user_id = ?`,
        )
        .bind(
          resolvedProvider,
          persistedModelId,
          submitResult.externalTaskId,
          JSON.stringify(persistedOutput),
          completedAt,
          completedAt,
          completedAt,
          taskId,
          userId,
        )
        .run()

      await deleteTaskExecutionSnapshot(taskId, userId, runtime).catch(() => undefined)
      log.info('Task execution completed', { taskId, taskType, provider: requestProvider })
      return
    }

    const runningAt = new Date().toISOString()
    await db
      .prepare(
        `UPDATE async_tasks
         SET provider = ?, model_id = ?, status = ?, progress = ?, external_task_id = ?, last_checked_at = ?, updated_at = ?
         WHERE id = ? AND user_id = ?`,
      )
      .bind(
        resolvedProvider,
        persistedModelId,
        submitResult.initialStatus,
        submitResult.initialStatus === 'running' ? 10 : 0,
        submitResult.externalTaskId,
        runningAt,
        runningAt,
        taskId,
        userId,
      )
      .run()

    await deleteTaskExecutionSnapshot(taskId, userId, runtime).catch(() => undefined)
    log.info('Task execution handed off to provider', {
      taskId,
      taskType,
      provider: requestProvider,
      status: submitResult.initialStatus,
    })
  } catch (error) {
    if (executionMode === 'user_key' && taskType === 'image_gen' && runtimeConfig) {
      await learnUserImageCapabilitiesFromTaskError(
        db,
        userId,
        runtimeConfig,
        originalInput,
        error,
        runtime,
      )
    }

    if (executionMode === 'platform' && reservedPlatformCredits > 0) {
      await refundTaskCredits({
        userId,
        referenceId: taskId,
        source: 'task_submit_platform_failure_refund',
        description: `Refund failed async task submission ${taskType} ${initialResolvedProvider}/${resolvedModelId}`,
      })
    }

    const failedAt = new Date().toISOString()
    const errorMessage = error instanceof Error ? error.message : String(error)
    await db
      .prepare(
        `UPDATE async_tasks
         SET status = 'failed', output_data = ?, completed_at = ?, updated_at = ?
         WHERE id = ? AND user_id = ?`,
      )
      .bind(
        JSON.stringify({ error: errorMessage }),
        failedAt,
        failedAt,
        taskId,
        userId,
      )
      .run()

    await deleteTaskExecutionSnapshot(taskId, userId, runtime).catch(() => undefined)
    log.error('Task execution failed', error, {
      taskId,
      taskType,
      provider: requestProvider,
      resolvedProvider: initialResolvedProvider,
      modelId: resolvedModelId,
      executionMode,
    })
  }
}

async function getUserTaskRuntimeConfig(
  db: D1Database,
  userId: string,
  capability: NodeCapability,
  configId?: string,
  runtime: TaskServiceRuntime = defaultTaskRuntime,
  guestConfig?: SubmitTaskParams['guestUserKeyConfig'],
): Promise<UserModelRuntimeConfig> {
  try {
    if (guestConfig) {
      return {
        configId: guestConfig.configId?.trim() || `guest_${capability}`,
        capability: guestConfig.capability,
        providerKind: guestConfig.providerKind,
        providerId: guestConfig.providerId,
        apiKey: guestConfig.apiKey,
        modelId: guestConfig.modelId,
        baseUrl: guestConfig.baseUrl,
        secretKey: guestConfig.secretKey,
        imageCapabilities: guestConfig.imageCapabilities,
      }
    }

    const keyRow = await findUserConfigRow(db, userId, capability, configId, runtime)

    if (!keyRow) {
      throw new TaskError(
        ErrorCode.TASK_PROVIDER_ERROR,
        `No API key configured for capability: ${capability}`,
        { capability },
      )
    }

    const encryptionKey = await runtime.requireEnv('ENCRYPTION_KEY')
    const decrypted = await decryptApiKey(keyRow.encrypted_key, encryptionKey)
    const payload = deserializeUserModelConfig(keyRow.configId, decrypted)
    return toRuntimeUserModelConfig(keyRow.configId, payload)
  } catch (error) {
    throw toTaskProviderError(error, { userId, capability, configId })
  }
}

async function learnUserImageCapabilitiesFromTaskError(
  db: D1Database,
  userId: string,
  runtimeConfig: UserModelRuntimeConfig,
  input: Record<string, unknown>,
  error: unknown,
  runtime: TaskServiceRuntime = defaultTaskRuntime,
) {
  const message = error instanceof Error ? error.message : String(error)
  const learned = learnImageCapabilitiesFromError(message)

  if (!learned) {
    return
  }

  const finalized = finalizeLearnedImageCapabilities(
    learned,
    typeof input.size === 'string' ? input.size : 'auto',
    typeof input.aspectRatio === 'string' ? input.aspectRatio : '1:1',
    message,
  )

  await updateStoredUserImageCapabilities(db, userId, runtimeConfig.configId, finalized, runtime)
}

async function updateStoredUserImageCapabilities(
  db: D1Database,
  userId: string,
  configId: string,
  learned: ImageModelCapabilities,
  runtime: TaskServiceRuntime = defaultTaskRuntime,
) {
  const encryptionKey = await runtime.requireEnv('ENCRYPTION_KEY')
  const row = await db
    .prepare(
      `SELECT encrypted_key
       FROM user_api_keys
       WHERE user_id = ? AND provider = ? AND is_active = 1`,
    )
    .bind(userId, configId)
    .first<{ encrypted_key: string }>()

  if (!row) {
    return
  }

  const decrypted = await decryptApiKey(row.encrypted_key, encryptionKey)
  const payload = deserializeUserModelConfig(configId, decrypted)
  const nextPayload: UserModelConfigPayload = {
    ...payload,
    version: 4,
    imageCapabilities: mergeImageModelCapabilities(payload.imageCapabilities, learned),
  }
  const encrypted = await encryptApiKey(
    serializeUserModelConfig(nextPayload),
    encryptionKey,
  )

  await db
    .prepare(
      `UPDATE user_api_keys
       SET encrypted_key = ?, updated_at = datetime('now')
       WHERE user_id = ? AND provider = ?`,
    )
    .bind(encrypted, userId, configId)
    .run()
}

async function findUserConfigRow(
  db: D1Database,
  userId: string,
  capability: string,
  configId?: string,
  runtime: TaskServiceRuntime = defaultTaskRuntime,
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

  const encryptionKey = await runtime.requireEnv('ENCRYPTION_KEY')
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

async function getTaskPlatformKey(
  provider: string,
  runtime: TaskServiceRuntime = defaultTaskRuntime,
): Promise<string> {
  try {
    switch (provider) {
      case 'openrouter':
      case 'deepseek':
      case 'gemini':
      case 'dlapi':
      case 'comfly':
        return await runtime.getPlatformKey(provider)
      case 'openai':
        return await runtime.requireEnv('OPENAI_API_KEY')
      case 'kling': {
        const accessKey = await runtime.requireEnv('KLING_ACCESS_KEY')
        const secretKey = await runtime.requireEnv('KLING_SECRET_KEY')
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
  runtime: TaskServiceRuntime = defaultTaskRuntime,
): Promise<TaskDetail> {
  /* 读取 D1 当前状态 */
  const row = await loadTaskRow(db, taskId, userId)

  if (!row) {
    throw new TaskError(ErrorCode.TASK_NOT_FOUND, `Task not found: ${taskId}`, { taskId })
  }

  const persistedInput = JSON.parse(row.input_data || '{}') as Record<string, unknown>
  const runtimeMeta = readPersistedTaskRuntimeMeta(persistedInput)
  const taskOrchestrator = runtimeMeta?.orchestrator ?? 'legacy_queue'

  /* 自愈: 图片任务若仍停留 pending 且尚未拿到 external_task_id，则补投递队列，避免轮询请求同步执行 */
  if (
    row.task_type === 'image_gen' &&
    taskOrchestrator === 'legacy_queue' &&
    row.status === 'pending' &&
    !row.external_task_id
  ) {
    const config = TASK_CONFIG[row.task_type]
    const now = Date.now()
    const lastChecked = row.last_checked_at ? new Date(row.last_checked_at).getTime() : 0

    if (runtime.dispatchTask && now - lastChecked >= config.providerCheckThrottleMs) {
      const nowIso = new Date(now).toISOString()

      try {
        await runtime.dispatchTask({
          taskId: row.id,
          userId: row.user_id,
        })
        await db
          .prepare(
            `UPDATE async_tasks
             SET last_checked_at = ?, updated_at = ?
             WHERE id = ? AND user_id = ?`,
          )
          .bind(nowIso, nowIso, row.id, row.user_id)
          .run()

        const refreshedRow = await loadTaskRow(db, row.id, row.user_id)
        if (refreshedRow) {
          return rowToDetail(refreshedRow)
        }
      } catch (error) {
        log.warn('Deferred image task re-enqueue from poll failed', {
          taskId: row.id,
          userId: row.user_id,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }
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

  if (taskOrchestrator === 'workflow') {
    const observed = await observeWorkflowTaskState(db, row, runtime)
    if (observed) {
      return observed
    }

    return rowToDetail(row)
  }

  /* 超时检测: 这里只剩 legacy queue / 传统任务路径 */
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
  let persistedProvider = row.provider
  let persistedModelId = row.model_id
  if (row.execution_mode === 'user_key' && row.external_task_id) {
    const runtimeConfig = await getUserTaskRuntimeConfig(
      db,
      userId,
      row.provider as NodeCapability,
      runtimeMeta?.userConfigId,
      runtime,
    )
    apiKey =
      runtimeConfig.providerId === 'kling' && runtimeConfig.secretKey
        ? `${runtimeConfig.apiKey}:${runtimeConfig.secretKey}`
        : runtimeConfig.apiKey
    processorProvider = runtimeConfig.providerId
  } else if (row.execution_mode === 'platform' && row.external_task_id) {
    apiKey = await getTaskPlatformKey(row.provider, runtime)
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
      persistedProvider = check.providerOverride ?? processorProvider
      persistedModelId = check.modelOverride ?? row.model_id
      const persistedOutput = await persistTaskOutput(taskId, userId, check.result, runtime)

      if (row.execution_mode === 'platform') {
        const reservedCredits = getReservedTaskCredits(JSON.parse(row.input_data || '{}'))
        if (reservedCredits > 0) {
          await confirmFrozenCredits({
            userId,
            referenceId: row.id,
            requestedCredits: reservedCredits,
            source: 'task_platform_confirm',
            description: `Confirm async task billing ${row.task_type} ${processorProvider}/${row.model_id}`,
          })
        }
      }

      await db
        .prepare(
          `UPDATE async_tasks
           SET provider = ?, model_id = ?, status = 'completed', progress = 100,
               output_data = ?, completed_at = ?,
               last_checked_at = ?, updated_at = ?
           WHERE id = ?`,
        )
        .bind(
          persistedProvider,
          persistedModelId,
          JSON.stringify(persistedOutput),
          nowIso,
          nowIso,
          nowIso,
          taskId,
        )
        .run()

      log.info('Task completed', { taskId })
      return {
        ...rowToDetail(row),
        provider: persistedProvider,
        modelId: persistedModelId,
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
  runtime: TaskServiceRuntime = defaultTaskRuntime,
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
      const persistedInput = JSON.parse(row.input_data || '{}') as Record<string, unknown>
      const runtimeMeta = readPersistedTaskRuntimeMeta(persistedInput)
      if (row.execution_mode === 'user_key') {
        const runtimeConfig = await getUserTaskRuntimeConfig(
          db,
          userId,
          row.provider as NodeCapability,
          runtimeMeta?.userConfigId,
          runtime,
        )
        apiKey = runtimeConfig.apiKey
        processorProvider = runtimeConfig.providerId
      } else if (row.execution_mode === 'platform') {
        apiKey = await getTaskPlatformKey(row.provider, runtime)
      }
      const processor = getProcessor(row.task_type, processorProvider)
      await processor.cancel(row.external_task_id, apiKey)
    } catch (err) {
      log.warn('Provider cancel failed (best-effort)', { taskId, error: String(err) })
    }
  }

  if (row.execution_mode === 'platform') {
    const reservedCredits = getReservedTaskCredits(JSON.parse(row.input_data || '{}'))
    if (reservedCredits > 0) {
      await refundTaskCredits({
        userId: row.user_id,
        referenceId: row.id,
        source: 'task_platform_cancel_refund',
        description: `Refund cancelled async task ${row.task_type} ${row.provider}/${row.model_id}`,
      })
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

  await deleteTaskExecutionSnapshot(taskId, userId, runtime).catch(() => undefined)

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

export async function deleteTasks(
  db: D1Database,
  userId: string,
  taskIds: string[],
  runtime: TaskServiceRuntime = defaultTaskRuntime,
): Promise<DeleteTasksResult> {
  const uniqueTaskIds = Array.from(new Set(taskIds.map((id) => id.trim()).filter(Boolean)))

  if (!uniqueTaskIds.length) {
    return { deletedIds: [] }
  }

  const placeholders = uniqueTaskIds.map(() => '?').join(', ')
  const result = await db
    .prepare(
      `SELECT id, output_data
       FROM async_tasks
       WHERE user_id = ?
         AND id IN (${placeholders})
         AND status IN ('completed', 'failed', 'cancelled')`,
    )
    .bind(userId, ...uniqueTaskIds)
    .all<{ id: string; output_data: string | null }>()

  const rows = result.results ?? []
  if (!rows.length) {
    return { deletedIds: [] }
  }

  const r2 = await runtime.getR2()

  for (const row of rows) {
    try {
      if (!row.output_data) {
        continue
      }

      const output = JSON.parse(row.output_data) as { r2_key?: string; url?: string }
      const r2Key =
        output.r2_key ??
        (typeof output.url === 'string' ? extractR2KeyFromFileUrl(output.url) : null)

      if (r2Key?.startsWith(`outputs/${userId}/`)) {
        await r2.delete(r2Key)
      }
    } catch (error) {
      log.warn('Failed to cleanup task output during delete', {
        taskId: row.id,
        userId,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const deletedIds = rows.map((row) => row.id)
  await db
    .prepare(`DELETE FROM async_tasks WHERE user_id = ? AND id IN (${placeholders})`)
    .bind(userId, ...deletedIds)
    .run()

  await runtime.invalidateStorageCache(userId)

  return { deletedIds }
}

/* ─── Internal: Failure Handling (fail-fast, no auto-retry) ─ */

async function handleFailure(
  db: D1Database,
  row: TaskRow,
  errorMsg: string,
  runtime: TaskServiceRuntime = defaultTaskRuntime,
): Promise<TaskDetail> {
  const nowIso = new Date().toISOString()

  if (row.execution_mode === 'platform') {
    const reservedCredits = getReservedTaskCredits(JSON.parse(row.input_data || '{}'))
    if (reservedCredits > 0) {
      await refundTaskCredits({
        userId: row.user_id,
        referenceId: row.id,
        source: 'task_platform_failure_refund',
        description: `Refund failed async task ${row.task_type} ${row.provider}/${row.model_id}`,
      })
    }
  }

  await db
    .prepare(
      `UPDATE async_tasks
       SET status = 'failed', output_data = ?,
           completed_at = ?, updated_at = ?
       WHERE id = ?`,
    )
    .bind(JSON.stringify({ error: errorMsg }), nowIso, nowIso, row.id)
    .run()

  await deleteTaskExecutionSnapshot(row.id, row.user_id, runtime).catch(() => undefined)
  log.error('Task failed', undefined, { taskId: row.id, errorMsg })
  return {
    ...rowToDetail(row),
    status: 'failed',
    output: { error: errorMsg },
    completedAt: nowIso,
  }
}

/* ─── Internal: Timeout Handling ────────────────────── */

async function handleTimeout(
  db: D1Database,
  row: TaskRow,
  errorMessage = 'Task timed out',
): Promise<void> {
  const nowIso = new Date().toISOString()

  if (row.execution_mode === 'platform') {
    const reservedCredits = getReservedTaskCredits(JSON.parse(row.input_data || '{}'))
    if (reservedCredits > 0) {
      await refundTaskCredits({
        userId: row.user_id,
        referenceId: row.id,
        source: 'task_platform_timeout_refund',
        description: `Refund timed out async task ${row.task_type} ${row.provider}/${row.model_id}`,
      })
    }
  }

  await db
    .prepare(
      `UPDATE async_tasks
       SET status = 'failed', output_data = ?,
           completed_at = ?, updated_at = ?
       WHERE id = ?`,
    )
    .bind(JSON.stringify({ error: errorMessage }), nowIso, nowIso, row.id)
    .run()

  log.warn('Task timed out', { taskId: row.id, taskType: row.task_type, errorMessage })
}
