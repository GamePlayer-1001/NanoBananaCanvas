/**
 * [INPUT]: 依赖 @nano-banana/shared 的 TASK_CONFIG，依赖 @/lib/errors，依赖 @/lib/logger
 * [OUTPUT]: 对外提供 executeLLMViaApi, executeLLMViaStreamApi, executeTaskOutputViaApi 等 API 通信函数
 * [POS]: lib/executor 的 API 通信层，从 node-executor.ts 拆出
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { TASK_CONFIG } from '@nano-banana/shared'
import { ErrorCode, WorkflowError } from '@/lib/errors'
import { createLogger } from '@/lib/logger'
import type { ChatMessage } from '@/services/ai/types'
import type { NodeTaskStateChange } from './node-executor'

const log = createLogger('NodeExecutor')

/* ─── LLM API Types ──────────────────────────────────── */

export interface ExecuteLLMApiParams {
  nodeId?: string
  workflowId?: string
  provider?: string
  capability?: 'text' | 'image' | 'video' | 'audio'
  modelId?: string
  configId?: string
  messages: ChatMessage[]
  executionMode: 'platform' | 'user_key'
  temperature: number
  maxTokens: number
  signal: AbortSignal
}

export interface ExecuteLLMStreamApiParams extends ExecuteLLMApiParams {
  onChunk: (chunk: string) => void
}

/* ─── Task API Types ─────────────────────────────────── */

export interface ExecuteTaskOutputApiParams {
  taskType: 'image_gen' | 'video_gen' | 'audio_gen'
  workflowId?: string
  nodeId?: string
  provider?: string
  capability?: 'text' | 'image' | 'video' | 'audio'
  modelId?: string
  configId?: string
  executionMode: 'platform' | 'user_key'
  input: Record<string, unknown>
  outputType: 'image' | 'video' | 'audio'
  signal: AbortSignal
  onStateChange?: (change: NodeTaskStateChange) => void
}

/* ─── LLM Execution ─────────────────────────────────── */

export async function executeLLMViaApi(params: ExecuteLLMApiParams): Promise<string> {
  const { signal, nodeId, workflowId, ...body } = params
  log.info('LLM request started', {
    nodeId: nodeId ?? null,
    workflowId: workflowId ?? null,
    provider: body.provider ?? null,
    capability: body.capability ?? null,
    modelId: body.modelId ?? null,
    configId: body.configId ?? null,
    executionMode: body.executionMode,
    endpoint: '/api/ai/execute',
  })
  const response = await fetch('/api/ai/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    throw await createApiWorkflowError(response, {
      nodeId,
      workflowId,
      endpoint: '/api/ai/execute',
      provider: body.provider,
      capability: body.capability,
      modelId: body.modelId,
      configId: body.configId,
      executionMode: body.executionMode,
    })
  }

  const payload = (await response.json()) as {
    ok?: boolean
    data?: { result?: string }
  }

  const result = payload.data?.result
  if (typeof result !== 'string') {
    throw new WorkflowError(
      ErrorCode.WORKFLOW_NODE_ERROR,
      'LLM API returned invalid result payload',
    )
  }

  log.info('LLM request completed', {
    nodeId: nodeId ?? null,
    workflowId: workflowId ?? null,
    provider: body.provider ?? null,
    capability: body.capability ?? null,
    modelId: body.modelId ?? null,
    executionMode: body.executionMode,
    resultLength: result.length,
  })
  return result
}

export async function executeLLMViaStreamApi(
  params: ExecuteLLMStreamApiParams,
): Promise<string> {
  const { signal, onChunk, nodeId, workflowId, ...body } = params
  log.info('LLM stream request started', {
    nodeId: nodeId ?? null,
    workflowId: workflowId ?? null,
    provider: body.provider ?? null,
    capability: body.capability ?? null,
    modelId: body.modelId ?? null,
    configId: body.configId ?? null,
    executionMode: body.executionMode,
    endpoint: '/api/ai/stream',
  })
  const response = await fetch('/api/ai/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok || !response.body) {
    throw await createApiWorkflowError(response, {
      nodeId,
      workflowId,
      endpoint: '/api/ai/stream',
      provider: body.provider,
      capability: body.capability,
      modelId: body.modelId,
      configId: body.configId,
      executionMode: body.executionMode,
    })
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let result = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const events = buffer.split('\n\n')
    buffer = events.pop() ?? ''

    for (const event of events) {
      const lines = event
        .split('\n')
        .filter((line) => line.startsWith('data: '))
        .map((line) => line.slice(6).trim())

      for (const line of lines) {
        if (!line || line === '[DONE]') continue

        const payload = JSON.parse(line) as {
          choices?: Array<{ delta?: { content?: string } }>
        }
        const chunk = payload.choices?.[0]?.delta?.content
        if (!chunk) continue

        result += chunk
        onChunk(chunk)
      }
    }
  }

  log.info('LLM stream request completed', {
    nodeId: nodeId ?? null,
    workflowId: workflowId ?? null,
    provider: body.provider ?? null,
    capability: body.capability ?? null,
    modelId: body.modelId ?? null,
    executionMode: body.executionMode,
    resultLength: result.length,
  })
  return result
}

/* ─── Error Factory ──────────────────────────────────── */

async function createApiWorkflowError(
  response: Response,
  context?: Record<string, unknown>,
): Promise<WorkflowError> {
  let message = `AI API request failed (${response.status})`
  let responseBody: unknown = null

  try {
    const payload = (await response.json()) as {
      error?: { message?: string }
    }
    responseBody = payload
    message = payload.error?.message ?? message
  } catch {
    /* ignore malformed response body */
  }

  log.error('API-backed node request failed', undefined, {
    ...context,
    status: response.status,
    statusText: response.statusText,
    responseBody,
    message,
  })

  return new WorkflowError(ErrorCode.WORKFLOW_NODE_ERROR, message)
}

/* ─── Task Polling ───────────────────────────────────── */

function getTaskPollingPlan(taskType: ExecuteTaskOutputApiParams['taskType']) {
  const config = TASK_CONFIG[taskType]
  const intervalMs = Math.max(1_000, config.pollIntervalMs)
  return { intervalMs }
}

function didTaskUseFallbackProvider(
  requestedProvider: string | undefined,
  resolvedProvider: string | undefined,
): boolean {
  if (!requestedProvider || !resolvedProvider) {
    return false
  }

  return requestedProvider !== resolvedProvider
}

export async function executeTaskOutputViaApi(
  params: ExecuteTaskOutputApiParams,
): Promise<string> {
  log.info('Async task request started', {
    taskType: params.taskType,
    workflowId: params.workflowId ?? null,
    nodeId: params.nodeId ?? null,
    provider: params.provider ?? null,
    capability: params.capability ?? null,
    modelId: params.modelId ?? null,
    configId: params.configId ?? null,
    executionMode: params.executionMode,
  })
  const submitResponse = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      taskType: params.taskType,
      workflowId: params.workflowId,
      nodeId: params.nodeId,
      provider: params.provider,
      capability: params.capability,
      modelId: params.modelId,
      configId: params.configId,
      executionMode: params.executionMode,
      input: params.input,
    }),
    signal: params.signal,
  })

  if (!submitResponse.ok) {
    throw await createApiWorkflowError(submitResponse, {
      endpoint: '/api/tasks',
      taskType: params.taskType,
      workflowId: params.workflowId ?? null,
      nodeId: params.nodeId ?? null,
      provider: params.provider ?? null,
      capability: params.capability ?? null,
      modelId: params.modelId ?? null,
      configId: params.configId ?? null,
      executionMode: params.executionMode,
    })
  }

  const submitPayload = (await submitResponse.json()) as {
    data?: { id?: string }
  }

  const taskId = submitPayload.data?.id
  if (!taskId) {
    throw new WorkflowError(
      ErrorCode.WORKFLOW_NODE_ERROR,
      'Task submission returned no task id',
    )
  }

  log.info('Async task submitted', {
    taskId,
    taskType: params.taskType,
    workflowId: params.workflowId ?? null,
    nodeId: params.nodeId ?? null,
    provider: params.provider ?? null,
    capability: params.capability ?? null,
    modelId: params.modelId ?? null,
    executionMode: params.executionMode,
  })

  params.onStateChange?.({
    status: 'queued',
    configPatch: { progress: 0, taskId },
  })

  const polling = getTaskPollingPlan(params.taskType)

  for (;;) {
    await delay(polling.intervalMs, params.signal)

    const taskResponse = await fetch(`/api/tasks/${taskId}`, {
      cache: 'no-store',
      signal: params.signal,
    })

    if (!taskResponse.ok) {
      throw await createApiWorkflowError(taskResponse, {
        endpoint: '/api/tasks/:id',
        taskId,
        taskType: params.taskType,
        workflowId: params.workflowId ?? null,
        nodeId: params.nodeId ?? null,
        provider: params.provider ?? null,
        capability: params.capability ?? null,
        modelId: params.modelId ?? null,
        executionMode: params.executionMode,
      })
    }

    const taskPayload = (await taskResponse.json()) as {
      data?: {
        status?: string
        progress?: number
        provider?: string
        modelId?: string
        output?: { url?: string; error?: string } | null
      }
    }

    const status = taskPayload.data?.status
    const progress = typeof taskPayload.data?.progress === 'number' ? taskPayload.data.progress : 0
    const resolvedProvider = taskPayload.data?.provider
    const resolvedModelId = taskPayload.data?.modelId
    const output = taskPayload.data?.output

    log.debug('Async task poll tick', {
      taskId,
      taskType: params.taskType,
      workflowId: params.workflowId ?? null,
      nodeId: params.nodeId ?? null,
      status: status ?? 'unknown',
      progress,
    })

    if (status === 'pending') {
      params.onStateChange?.({
        status: 'queued',
        configPatch: { progress: 0, taskId },
      })
    }

    if (status === 'running') {
      params.onStateChange?.({
        status: 'running',
        configPatch: { progress, taskId },
      })
    }

    if (status === 'completed' && output?.url) {
      params.onStateChange?.({
        status: 'finalizing',
        configPatch: { progress: 100, taskId },
      })
      if (didTaskUseFallbackProvider(params.provider, resolvedProvider)) {
        log.warn('Async task completed via fallback provider', {
          taskId,
          taskType: params.taskType,
          workflowId: params.workflowId ?? null,
          nodeId: params.nodeId ?? null,
          requestedProvider: params.provider ?? null,
          requestedModelId: params.modelId ?? null,
          resolvedProvider: resolvedProvider ?? null,
          resolvedModelId: resolvedModelId ?? null,
          outputType: params.outputType,
        })
      }
      log.info('Async task completed', {
        taskId,
        taskType: params.taskType,
        workflowId: params.workflowId ?? null,
        nodeId: params.nodeId ?? null,
        provider: params.provider ?? null,
        modelId: params.modelId ?? null,
        resolvedProvider: resolvedProvider ?? null,
        resolvedModelId: resolvedModelId ?? null,
        outputType: params.outputType,
      })
      return output.url
    }

    if (status === 'failed' || status === 'cancelled') {
      log.error('Async task reached terminal failure state', undefined, {
        taskId,
        taskType: params.taskType,
        workflowId: params.workflowId ?? null,
        nodeId: params.nodeId ?? null,
        status,
        output,
      })
      throw new WorkflowError(
        ErrorCode.WORKFLOW_NODE_ERROR,
        output?.error ?? `${params.outputType} task ${status}`,
      )
    }
  }

}

/* ─── Utilities ──────────────────────────────────────── */

async function delay(ms: number, signal: AbortSignal): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup()
      resolve()
    }, ms)

    const onAbort = () => {
      cleanup()
      reject(new WorkflowError(ErrorCode.WORKFLOW_ABORTED, 'Execution aborted'))
    }

    const cleanup = () => {
      clearTimeout(timeout)
      signal.removeEventListener('abort', onAbort)
    }

    signal.addEventListener('abort', onAbort, { once: true })
  })
}
