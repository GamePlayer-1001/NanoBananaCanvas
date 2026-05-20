/**
 * [INPUT]: 依赖 @nano-banana/shared 的 AsyncTaskType/AsyncTaskStatus/ExecutionMode/TaskOrchestrator/TaskQueueMessage,
 *          依赖 @/lib/user-model-config 的 UserModelRuntimeConfig,
 *          依赖 @/lib/platform-runtime 的 PlatformSupplierId,
 *          依赖 @/lib/ai-node-config 的 NodeCapability
 * [OUTPUT]: 对外提供 task service 所有类型定义
 * [POS]: lib/tasks 的类型定义层，被 service.ts 及其拆分子模块消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type {
  AsyncTaskStatus,
  AsyncTaskType,
  ExecutionMode,
  TaskOrchestrator,
  TaskQueueMessage,
} from '@nano-banana/shared'

import type { NodeCapability } from '@/lib/ai-node-config'
import type { PlatformSupplierId } from '@/lib/platform-runtime'
import type { UserModelRuntimeConfig } from '@/lib/user-model-config'

import type { TaskOutput } from './processors'

/* ─── D1 Row Shape ──────────────────────────────────── */

export interface TaskRow {
  id: string
  user_id: string
  task_type: AsyncTaskType
  provider: string
  model_id: string
  external_task_id: string | null
  execution_mode: ExecutionMode
  input_data: string
  output_data: string | null
  diagnostics_data: string | null
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
  orchestrator?: TaskOrchestrator
}

export interface ReservedTaskBillingDraft {
  mode: 'reserved'
  inputTokens: null
  outputTokens: null
  billableUnits: number | null
  estimatedCredits: number | null
  category: string | null
  unitLabel: string | null
  basis: string | null
}

export interface TaskBillingInput extends Record<string, unknown> {
  billingDraft?: ReservedTaskBillingDraft
}

export interface PersistedDataUrlDescriptor {
  __type: 'omitted-data-url'
  mediaType: string
  length: number
}

export interface PersistedTaskRuntimeMeta {
  userConfigId?: string
  orchestrator?: TaskOrchestrator
}

export interface MediaDimensions {
  width: number
  height: number
}

export interface TaskExecutionSnapshot {
  taskType: AsyncTaskType
  requestProvider: string
  resolvedProvider: string
  resolvedModelId: string
  executionMode: ExecutionMode
  resolvedInput: Record<string, unknown>
  originalInput: Record<string, unknown>
  apiKey?: string
  fallbackApiKey?: string
  runtimeConfig?: UserModelRuntimeConfig | null
  runtimeMeta?: PersistedTaskRuntimeMeta
}

export interface TaskDiagnostics {
  [key: string]: unknown
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
  diagnostics: TaskDiagnostics | null
  retryCount: number
  workflowId: string | null
  nodeId: string | null
  createdAt: string
  startedAt: string | null
  completedAt: string | null
}

export interface PageInfo {
  page: number
  limit: number
  hasMore: boolean
  nextPage: number | null
}

export interface ListTasksResult {
  tasks: TaskDetail[]
  total: number
  page: number
  limit: number
  pageInfo: PageInfo
}

export interface DeleteTasksResult {
  deletedIds: string[]
}

export interface TaskExecutionRequest {
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
  fallbackApiKey?: string
  reservedPlatformCredits: number
  runtimeConfig: UserModelRuntimeConfig | null
  orchestrator: TaskOrchestrator
}

export interface WorkflowRuntimeStatus {
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
  getPlatformSupplierApiKey?: (provider: PlatformSupplierId) => Promise<string>
  getPlatformKey?: (provider: string) => Promise<string>
  dispatchTask?: (message: TaskQueueMessage) => Promise<void>
  getWorkflowStatus?: (instanceId: string) => Promise<WorkflowRuntimeStatus | null>
}
