/**
 * [INPUT]: 依赖 @nano-banana/shared 的 TASK_CONFIG/TASK_CONCURRENCY_LIMITS,
 *          依赖 @/lib/tasks/service-types（全部类型），
 *          依赖 @/lib/tasks/service-output（输出持久化），
 *          依赖 @/lib/tasks/service-billing（积分结算），
 *          依赖 @/lib/tasks/service-keys（密钥与配置解析），
 *          依赖 @/lib/billing/ledger 的 confirmFrozenCredits/freezeCredits,
 *          依赖 @/lib/tasks/processors 的 getProcessor
 * [OUTPUT]: 对外提供 checkConcurrency / submitTask / processTaskDispatch / checkTask / cancelTask / listTasks / deleteTasks，并在平台模式下接回任务冻结/确认/退款与 orchestrator 持久化
 * [POS]: lib/tasks 的核心服务层 — 整个异步任务系统的心脏，编排 D1 + Processor + Queue/Workflow 双轨 + 平台 Key / 账号级模型槽位协作
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { TASK_CONFIG, TASK_CONCURRENCY_LIMITS } from '@nano-banana/shared'
import type {
  AsyncTaskStatus,
  AsyncTaskType,
  TaskOrchestrator,
  TaskQueueMessage,
} from '@nano-banana/shared'

import { confirmFrozenCredits, freezeCredits } from '@/lib/billing/ledger'
import { requireEnv } from '@/lib/env'
import { ErrorCode, TaskError } from '@/lib/errors'
import {
  getStaticImageModelCapabilities,
  mergeImageModelCapabilities,
  type ImageModelCapabilities,
} from '@/lib/image-model-capabilities'
import { createLogger } from '@/lib/logger'
import { nanoid } from '@/lib/nanoid'
import { resolvePlatformRuntimeModel } from '@/lib/platform-runtime'
import { getR2 } from '@/lib/r2'
import { extractR2KeyFromFileUrl } from '@/lib/storage'
import type { UserModelRuntimeConfig } from '@/lib/user-model-config'
import type { NodeCapability } from '@/lib/ai-node-config'
import { getPlatformSupplierApiKey } from '@/services/ai'

import { getProcessor } from './processors'
import type { TaskOutput, TaskProcessor } from './processors'
import {
  estimateTaskBillingDraft,
  getReservedTaskCredits,
  refundTaskCredits,
  settleCompletedPlatformImageTask,
} from './service-billing'
import {
  getUserTaskRuntimeConfig,
  getTaskPlatformKey,
  learnUserImageCapabilitiesFromTaskError,
  taskTypeToPlatformCategory,
} from './service-keys'
import { persistTaskOutput } from './service-output'
import type {
  DeleteTasksResult,
  ListTasksResult,
  PersistedDataUrlDescriptor,
  PersistedTaskRuntimeMeta,
  SubmitTaskParams,
  SubmitTaskResult,
  TaskDetail,
  TaskExecutionDispatch,
  TaskExecutionRequest,
  TaskExecutionSnapshot,
  TaskRow,
  TaskServiceRuntime,
  WorkflowRuntimeStatus,
} from './service-types'

const log = createLogger('task:service')
const FREE_TASK_CONCURRENCY_LIMIT = TASK_CONCURRENCY_LIMITS.free
const WORKFLOW_STARTUP_GRACE_MS = 60_000

/* ─── Re-exports (barrel compatibility) ─────────────── */

export type {
  DeleteTasksResult,
  ListTasksResult,
  PageInfo,
  SubmitTaskParams,
  SubmitTaskResult,
  TaskDetail,
  TaskDiagnostics,
  TaskExecutionDispatch,
  TaskServiceRuntime,
} from './service-types'

const defaultTaskRuntime: TaskServiceRuntime = {
  requireEnv,
  getR2,
  getPlatformSupplierApiKey,
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
    diagnostics: row.diagnostics_data ? JSON.parse(row.diagnostics_data) : null,
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

function sanitizeTaskInputForPersistence(
  input: Record<string, unknown>,
): Record<string, unknown> {
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

function stripPersistedTaskRuntimeMeta(
  input: Record<string, unknown>,
): Record<string, unknown> {
  if (!('__taskRuntime' in input)) {
    return input
  }

  const rest = { ...input }
  delete rest.__taskRuntime
  return rest
}

function readPersistedTaskRuntimeMeta(
  input: Record<string, unknown>,
): PersistedTaskRuntimeMeta | null {
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

function isWorkflowRunningLikeStatus(status: WorkflowRuntimeStatus['status']): boolean {
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
      workflowStatus.error?.message ?? `Workflow instance ${workflowStatus.status}`
    return handleFailure(db, row, errorMessage)
  }

  if (
    workflowStatus.status === 'complete' &&
    (row.status === 'pending' || row.status === 'running') &&
    !row.external_task_id
  ) {
    return handleFailure(db, row, 'Workflow completed without updating task state')
  }

  if (row.status === 'pending' && isWorkflowRunningLikeStatus(workflowStatus.status)) {
    const nowIso = new Date().toISOString()
    await db
      .prepare(
        `UPDATE async_tasks
         SET last_checked_at = ?, updated_at = ?
         WHERE id = ? AND user_id = ? AND status = 'pending'`,
      )
      .bind(nowIso, nowIso, row.id, row.user_id)
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

/* ─── 1. Concurrency Check ──────────────────────────── */

export async function checkConcurrency(db: D1Database, userId: string): Promise<void> {
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
  log.info('Task submit started', {
    taskId,
    userId,
    taskType,
    provider: provider ?? null,
    capability: capability ?? null,
    modelId: modelId ?? null,
    configId: configId ?? null,
    executionMode,
    workflowId: workflowId ?? null,
    nodeId: nodeId ?? null,
    orchestrator: taskOrchestrator,
  })

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
  let fallbackApiKey: string | undefined
  let submitResult: Awaited<ReturnType<TaskProcessor['submit']>> | null = null
  let persistedOutput: TaskOutput | null = null
  let persistedProvider = requestProvider as string
  let persistedModelId = resolvedModelId

  function fingerprintKey(value: string | undefined): string | null {
    if (!value) return null
    if (value.length <= 10) {
      return `${value.slice(0, 2)}***${value.slice(-2)}`
    }
    return `${value.slice(0, 6)}***${value.slice(-4)}`
  }

  try {
    if (executionMode === 'platform') {
      const runtimeModel = resolvePlatformRuntimeModel({
        category: taskTypeToPlatformCategory(taskType),
        modelId: modelId,
        supplierHint: provider,
      })
      resolvedProvider = runtimeModel.supplierId
      resolvedModelId = runtimeModel.modelId
      apiKey = await getTaskPlatformKey(
        runtimeModel.supplierId,
        taskType,
        resolvedModelId,
        runtime,
      )
      fallbackApiKey =
        taskType === 'image_gen' && runtimeModel.supplierId === 'dlapi'
          ? await runtime.getPlatformSupplierApiKey?.('comfly').catch(() => undefined)
          : undefined
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
          db,
        })
      }
    } else {
      runtimeConfig = await getUserTaskRuntimeConfig(
        db,
        userId,
        capability as NodeCapability,
        configId,
        runtime,
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
      if (taskType === 'image_gen') {
        log.info('Image task provider auth context', {
          taskId,
          executionMode,
          provider: resolvedProvider,
          modelId: resolvedModelId,
          keyFingerprint: fingerprintKey(apiKey),
          fallbackProvider:
            resolvedProvider === 'dlapi' && fallbackApiKey ? 'comfly' : null,
          fallbackKeyFingerprint: fingerprintKey(fallbackApiKey),
        })
      }
      submitResult = await getProcessor(taskType, resolvedProvider).submit(
        {
          model: resolvedModelId,
          params: resolvedInput,
          fallbackApiKey,
        },
        apiKey,
      )
      persistedProvider =
        submitResult.providerOverride ?? requestProvider ?? resolvedProvider
      persistedModelId = submitResult.modelOverride ?? resolvedModelId

      if (submitResult.initialStatus === 'completed') {
        if (!submitResult.result) {
          throw new Error('Synchronous task provider completed without output')
        }

        persistedOutput = await persistTaskOutput(
          taskId,
          userId,
          submitResult.result,
          runtime,
        )
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
          fallbackApiKey,
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
        db,
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
  const startedAt =
    initialStatus === 'running' || initialStatus === 'completed' ? now : null
  const completedAt = initialStatus === 'completed' ? now : null

  try {
    await db
      .prepare(
        `INSERT INTO async_tasks (
          id, user_id, task_type, provider, model_id,
          external_task_id, execution_mode, input_data,
          status, progress, retry_count, max_retries, workflow_id, node_id,
          created_at, started_at, completed_at, output_data, updated_at,
          diagnostics_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        taskId,
        userId,
        taskType,
        persistedProvider,
        persistedModelId,
        submitResult?.externalTaskId ?? null,
        executionMode,
        JSON.stringify(persistedInput),
        initialStatus,
        initialProgress,
        config.maxRetries,
        workflowId ?? null,
        nodeId ?? null,
        now,
        startedAt,
        completedAt,
        persistedOutput ? JSON.stringify(persistedOutput) : null,
        now,
        submitResult?.diagnostics ? JSON.stringify(submitResult.diagnostics) : null,
      )
      .run()

    if (
      executionMode === 'platform' &&
      initialStatus === 'completed' &&
      persistedOutput
    ) {
      if (taskType === 'image_gen') {
        await settleCompletedPlatformImageTask({
          db,
          userId,
          taskId,
          provider: persistedProvider,
          modelId: persistedModelId,
          taskInput: persistedInput,
          output: persistedOutput,
        })
      } else if (reservedPlatformCredits > 0) {
        await confirmFrozenCredits({
          userId,
          referenceId: taskId,
          requestedCredits: reservedPlatformCredits,
          source: 'task_platform_confirm',
          description: `Confirm async task billing ${taskType} ${persistedProvider}/${persistedModelId}`,
          db,
        })
      }
    }
  } catch (error) {
    if (executionMode === 'platform' && reservedPlatformCredits > 0) {
      await refundTaskCredits({
        userId,
        referenceId: taskId,
        source: 'task_submit_platform_insert_refund',
        description: `Refund async task credits after persistence failure ${taskType} ${persistedProvider}/${persistedModelId}`,
        db,
      })
    }

    if (shouldDeferTaskExecution(taskType)) {
      await deleteTaskExecutionSnapshot(taskId, userId, runtime).catch(() => undefined)
    }

    throw error
  }

  log.info('Task submitted', {
    taskId,
    userId,
    taskType,
    provider: requestProvider,
    resolvedProvider: persistedProvider,
    modelId: persistedModelId,
    executionMode,
    workflowId: workflowId ?? null,
    nodeId: nodeId ?? null,
    orchestrator: taskOrchestrator,
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
    diagnostics: null,
    retryCount: 0,
    workflowId: workflowId ?? null,
    nodeId: nodeId ?? null,
    createdAt: now,
    startedAt,
    completedAt,
    dispatch: shouldDeferTaskExecution(taskType)
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
  await r2.put(buildTaskExecutionSnapshotKey(userId, taskId), JSON.stringify(payload), {
    httpMetadata: {
      contentType: 'application/json',
    },
  })
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
  message: TaskQueueMessage | TaskExecutionDispatch,
  runtime: TaskServiceRuntime = defaultTaskRuntime,
): Promise<void> {
  log.info('Task dispatch started', {
    taskId: message.taskId,
    userId: message.userId,
  })
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
    const executionSnapshot = await readTaskExecutionSnapshot(
      row.id,
      row.user_id,
      runtime,
    )

    let runtimeConfig: UserModelRuntimeConfig | null =
      executionSnapshot.runtimeConfig ?? null
    let apiKey = executionSnapshot.apiKey ?? ''

    if (!apiKey) {
      if (row.execution_mode === 'platform') {
        apiKey = await getTaskPlatformKey(
          executionSnapshot.resolvedProvider,
          row.task_type,
          executionSnapshot.resolvedModelId,
          runtime,
        )
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
        fallbackApiKey: executionSnapshot.fallbackApiKey,
        reservedPlatformCredits: getReservedTaskCredits(persistedInput),
        runtimeConfig,
        orchestrator:
          runtimeMeta?.orchestrator ??
          executionSnapshot.runtimeMeta?.orchestrator ??
          'legacy_queue',
      },
      runtime,
    )
    log.info('Task dispatch completed', {
      taskId: row.id,
      userId: row.user_id,
      taskType: row.task_type,
      executionMode: row.execution_mode,
      workflowId: row.workflow_id,
      nodeId: row.node_id,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error('Task dispatch failed', error, {
      taskId: row.id,
      userId: row.user_id,
      taskType: row.task_type,
      provider: row.provider,
      modelId: row.model_id,
      executionMode: row.execution_mode,
      workflowId: row.workflow_id,
      nodeId: row.node_id,
    })
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
    fallbackApiKey,
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

  log.info('Task execution claimed', {
    taskId,
    userId,
    taskType,
    provider: requestProvider,
    resolvedProvider: initialResolvedProvider,
    modelId: resolvedModelId,
    executionMode,
    orchestrator: deferred.orchestrator,
  })

  try {
    const processor = getProcessor(taskType, initialResolvedProvider)
    const loadInternalReferenceImageAsset = async (r2Key: string) => {
      const r2 = await runtime.getR2()
      const object = await r2.get(r2Key)

      if (!object) {
        throw new Error(`Reference image not found in internal storage: ${r2Key}`)
      }

      const buffer = await object.arrayBuffer()
      const mimeType = object.httpMetadata?.contentType ?? 'image/png'
      const extension =
        mimeType === 'image/jpeg'
          ? 'jpg'
          : mimeType === 'image/webp'
            ? 'webp'
            : mimeType === 'image/gif'
              ? 'gif'
              : 'png'

      return {
        blob: new Blob([buffer], { type: mimeType }),
        filename: `reference.${extension}`,
      }
    }

    const submitResult = await processor.submit(
      {
        model: resolvedModelId,
        params: resolvedInput,
        fallbackApiKey,
        loadInternalReferenceImageAsset,
      },
      apiKey,
    )
    const resolvedProvider = submitResult.providerOverride ?? initialResolvedProvider
    const persistedModelId = submitResult.modelOverride ?? resolvedModelId

    if (submitResult.initialStatus === 'completed') {
      if (!submitResult.result) {
        throw new Error('Task execution provider completed without output')
      }

      const persistedOutput = await persistTaskOutput(
        taskId,
        userId,
        submitResult.result,
        runtime,
      )
      const completedAt = new Date().toISOString()

      if (executionMode === 'platform') {
        if (taskType === 'image_gen') {
          await settleCompletedPlatformImageTask({
            db,
            userId,
            taskId,
            provider: resolvedProvider,
            modelId: persistedModelId,
            taskInput: resolvedInput,
            output: persistedOutput,
          })
        } else if (reservedPlatformCredits > 0) {
          await confirmFrozenCredits({
            userId,
            referenceId: taskId,
            requestedCredits: reservedPlatformCredits,
            source: 'task_platform_confirm',
            description: `Confirm async task billing ${taskType} ${resolvedProvider}/${persistedModelId}`,
            db,
          })
        }
      }

      await db
        .prepare(
          `UPDATE async_tasks
           SET provider = ?, model_id = ?, status = 'completed', progress = 100, external_task_id = ?,
               output_data = ?, completed_at = ?, last_checked_at = ?, updated_at = ?, diagnostics_data = ?
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
          submitResult.diagnostics ? JSON.stringify(submitResult.diagnostics) : null,
          taskId,
          userId,
        )
        .run()

      await deleteTaskExecutionSnapshot(taskId, userId, runtime).catch(() => undefined)
      log.info('Task execution completed', {
        taskId,
        taskType,
        provider: requestProvider,
      })
      return
    }

    const runningAt = new Date().toISOString()
    await db
      .prepare(
        `UPDATE async_tasks
         SET provider = ?, model_id = ?, status = ?, progress = ?, external_task_id = ?, last_checked_at = ?, updated_at = ?,
             diagnostics_data = ?
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
        submitResult.diagnostics ? JSON.stringify(submitResult.diagnostics) : null,
        taskId,
        userId,
      )
      .run()

    await deleteTaskExecutionSnapshot(taskId, userId, runtime).catch(() => undefined)
    log.info('Task execution handed off to provider', {
      taskId,
      userId,
      taskType,
      provider: requestProvider,
      resolvedProvider,
      modelId: persistedModelId,
      executionMode,
      externalTaskId: submitResult.externalTaskId ?? null,
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
        db,
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
      .bind(JSON.stringify({ error: errorMessage }), failedAt, failedAt, taskId, userId)
      .run()

    await deleteTaskExecutionSnapshot(taskId, userId, runtime).catch(() => undefined)
    log.error('Task execution failed', error, {
      taskId,
      userId,
      taskType,
      provider: requestProvider,
      resolvedProvider: initialResolvedProvider,
      modelId: resolvedModelId,
      executionMode,
      orchestrator: deferred.orchestrator,
    })
  }
}

/* ─── 3. Check Task (Lazy Evaluation) ───────────────── */

export async function checkTask(
  db: D1Database,
  taskId: string,
  userId: string,
  runtime: TaskServiceRuntime = defaultTaskRuntime,
): Promise<TaskDetail> {
  log.debug('Task check requested', { taskId, userId })
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
          taskType: row.task_type,
          provider: row.provider,
          modelId: row.model_id,
          executionMode: row.execution_mode,
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
    apiKey = await getTaskPlatformKey(row.provider, row.task_type, row.model_id, runtime)
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
      const persistedOutput = await persistTaskOutput(
        taskId,
        userId,
        check.result,
        runtime,
      )

      if (row.execution_mode === 'platform') {
        const parsedInput = JSON.parse(row.input_data || '{}') as Record<string, unknown>
        if (row.task_type === 'image_gen') {
          await settleCompletedPlatformImageTask({
            db,
            userId,
            taskId: row.id,
            provider: persistedProvider,
            modelId: persistedModelId,
            taskInput: parsedInput,
            output: persistedOutput,
          })
        } else {
          const reservedCredits = getReservedTaskCredits(parsedInput)
          if (reservedCredits > 0) {
            await confirmFrozenCredits({
              userId,
              referenceId: row.id,
              requestedCredits: reservedCredits,
              source: 'task_platform_confirm',
              description: `Confirm async task billing ${row.task_type} ${processorProvider}/${row.model_id}`,
              db,
            })
          }
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
    log.error('Provider check failed', err, {
      taskId,
      userId,
      taskType: row.task_type,
      provider: row.provider,
      modelId: row.model_id,
      executionMode: row.execution_mode,
      workflowId: row.workflow_id,
      nodeId: row.node_id,
      orchestrator: taskOrchestrator,
    })
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
        apiKey = await getTaskPlatformKey(
          row.provider,
          row.task_type,
          row.model_id,
          runtime,
        )
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
        db,
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
  filters: {
    status?: AsyncTaskStatus
    taskType?: AsyncTaskType
    page: number
    limit: number
  },
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
  const countResult = await db
    .prepare(
      `SELECT COUNT(*) as total
       FROM async_tasks
       WHERE ${where}`,
    )
    .bind(...binds)
    .first<{ total: number }>()
  const total = countResult?.total ?? 0

  const dataResult = await db
    .prepare(
      `SELECT id, task_type, provider, model_id, execution_mode, status, progress,
              input_data, output_data, diagnostics_data, retry_count, workflow_id, node_id,
              created_at, started_at, completed_at
       FROM async_tasks
       WHERE ${where}
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    )
    .bind(...binds, filters.limit, offset)
    .all<TaskRow>()

  const visibleRows = dataResult.results ?? []
  const hasMore = offset + visibleRows.length < total

  return {
    tasks: visibleRows.map(rowToDetail),
    total,
    page: filters.page,
    limit: filters.limit,
    pageInfo: {
      page: filters.page,
      limit: filters.limit,
      hasMore,
      nextPage: hasMore ? filters.page + 1 : null,
    },
  }
}

export async function deleteTasks(
  db: D1Database,
  userId: string,
  taskIds: string[],
  runtime: TaskServiceRuntime = defaultTaskRuntime,
): Promise<DeleteTasksResult> {
  const uniqueTaskIds = Array.from(
    new Set(taskIds.map((id) => id.trim()).filter(Boolean)),
  )

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
        db,
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
  log.error('Task failed', undefined, {
    taskId: row.id,
    userId: row.user_id,
    taskType: row.task_type,
    provider: row.provider,
    modelId: row.model_id,
    executionMode: row.execution_mode,
    workflowId: row.workflow_id,
    nodeId: row.node_id,
    errorMsg,
  })
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
        db,
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

  log.warn('Task timed out', {
    taskId: row.id,
    userId: row.user_id,
    taskType: row.task_type,
    provider: row.provider,
    modelId: row.model_id,
    executionMode: row.execution_mode,
    workflowId: row.workflow_id,
    nodeId: row.node_id,
    errorMessage,
  })
}
