/**
 * [INPUT]: 依赖 /api/ai/* 与 /api/tasks/* 服务端执行链路，
 *          依赖 @nano-banana/shared 的 TASK_CONFIG，依赖 @/lib/errors 的 WorkflowError，依赖 @/lib/logger，依赖 @/components/nodes/plugin-registry 的 getNodePorts
 * [OUTPUT]: 对外提供 executeNode 函数 (按节点类型分发执行)
 * [POS]: lib/executor 的节点执行单元，被 WorkflowExecutor 在遍历中逐节点调用，统一衔接画布节点与服务端 AI/任务能力
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { TASK_CONFIG } from '@nano-banana/shared'
import { ErrorCode, WorkflowError } from '@/lib/errors'
import {
  findGuestRuntimeConfig,
  isGuestModelConfigId,
} from '@/lib/guest-model-config'
import { createLogger } from '@/lib/logger'
import { getNodePorts } from '@/components/nodes/plugin-registry'
import { resolveNodeExecutionTarget } from '@/lib/ai-node-config'
import type { ChatMessage, ContentPart } from '@/services/ai/types'
import type { WorkflowNodeData } from '@/types'

const log = createLogger('NodeExecutor')

/* ─── Types ──────────────────────────────────────────── */

export interface NodeExecutionContext {
  nodeId: string
  workflowId?: string
  nodeType: string
  data: WorkflowNodeData
  inputs: Record<string, unknown>
  signal: AbortSignal
  onStreamChunk?: (nodeId: string, chunk: string) => void
  onTaskStateChange?: (change: NodeTaskStateChange) => void
}

export interface NodeExecutionResult {
  outputs: Record<string, unknown>
}

export interface NodeTaskStateChange {
  status?: Extract<
    NonNullable<WorkflowNodeData['status']>,
    'queued' | 'running' | 'finalizing'
  >
  configPatch?: Record<string, unknown>
}

/* ─── Executor Registry ──────────────────────────────── */

type NodeExecutorFn = (ctx: NodeExecutionContext) => Promise<NodeExecutionResult>

const executeNoop: NodeExecutorFn = async () => ({ outputs: {} })

const executors: Record<string, NodeExecutorFn> = {
  'text-input': executeTextInput,
  'image-input': executeImageInput,
  llm: executeLLM,
  display: executeDisplay,
  'image-gen': executeImageGen,
  'video-gen': executeVideoGen,
  'audio-gen': executeAudioGen,
  note: executeNoop,
  group: executeNoop,
  conditional: executeConditional,
  loop: executeLoop,
  'text-merge': executeTextMerge,
  'image-merge': executeImageMerge,
}

/* ─── Main Entry ─────────────────────────────────────── */

export async function executeNode(
  ctx: NodeExecutionContext,
): Promise<NodeExecutionResult> {
  const executor = executors[ctx.nodeType]

  if (!executor) {
    throw new WorkflowError(
      ErrorCode.WORKFLOW_NODE_ERROR,
      `Unknown node type: ${ctx.nodeType}`,
      { nodeId: ctx.nodeId, nodeType: ctx.nodeType },
    )
  }

  log.debug('Executing node', { nodeId: ctx.nodeId, type: ctx.nodeType })
  return executor(ctx)
}

/* ─── TextInput: 直接输出文本 ────────────────────────── */

async function executeTextInput(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
  const raw = ctx.data.config.text
  const text = typeof raw === 'string' ? raw : raw == null ? '' : String(raw)
  return { outputs: { 'text-out': text } }
}

async function executeImageInput(
  ctx: NodeExecutionContext,
): Promise<NodeExecutionResult> {
  const raw = ctx.data.config.imageUrl
  const imageUrl = typeof raw === 'string' ? raw : ''

  if (!imageUrl) {
    throw new WorkflowError(
      ErrorCode.WORKFLOW_NODE_ERROR,
      'Image input node received no image',
      { nodeId: ctx.nodeId },
    )
  }

  return { outputs: { 'image-out': imageUrl } }
}

/* ─── Merge: 显式多输入汇聚 ─────────────────────────── */

async function executeTextMerge(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
  const separator = decodeConfiguredSeparator(
    (ctx.data.config.separator as string) ?? '\\n',
  )
  const parts = collectInputValues(ctx)
    .map((value) =>
      typeof value === 'string' ? value : value == null ? '' : String(value),
    )
    .filter((value) => value.length > 0)

  return { outputs: { 'text-out': parts.join(separator) } }
}

async function executeImageMerge(
  ctx: NodeExecutionContext,
): Promise<NodeExecutionResult> {
  const images = collectInputValues(ctx).filter(
    (value): value is string => typeof value === 'string' && value.length > 0,
  )

  return { outputs: { 'images-out': images } }
}

function collectInputValues(ctx: NodeExecutionContext): unknown[] {
  return getNodePorts(ctx.nodeType)
    .inputs.map((port) => ctx.inputs[port.id])
    .filter((value) => value != null && value !== '')
}

function decodeConfiguredSeparator(separator: string): string {
  return separator.replace(/\\n/g, '\n').replace(/\\t/g, '\t')
}

/* ─── LLM: 调用 AI 模型 ─────────────────────────────── */

async function executeLLM(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
  const { data, inputs, signal, onStreamChunk } = ctx
  const config = data.config
  const target = resolveNodeExecutionTarget('llm', config)
  const temperature = (config.temperature as number) ?? 0.7
  const maxTokens = (config.maxTokens as number) ?? 1024
  const systemPrompt = (config.systemPrompt as string) ?? ''
  const executionMode = target.executionMode
  const guestUserKeyConfig = resolveGuestUserKeyConfig(
    target.capability,
    target.configId,
  )

  /* ── 收集 prompt：优先上游输入，其次 config ────── */
  const promptText = (inputs['prompt-in'] as string) ?? ''

  if (!promptText) {
    throw new WorkflowError(
      ErrorCode.WORKFLOW_NODE_ERROR,
      'LLM node received empty prompt',
      { nodeId: ctx.nodeId },
    )
  }

  /* ── 构建消息列表 (支持多模态) ────────────────── */
  const messages: ChatMessage[] = []
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }

  const imageUrl = inputs['image-in'] as string | undefined
  if (imageUrl) {
    const parts: ContentPart[] = [
      { type: 'text', text: promptText },
      { type: 'image_url', image_url: { url: imageUrl } },
    ]
    messages.push({ role: 'user', content: parts })
  } else {
    messages.push({ role: 'user', content: promptText })
  }

  /* ── 执行 AI 调用 (按 Provider 路由) ────────────── */
  let result: string

  if (executionMode === 'platform' || executionMode === 'user_key') {
    result = onStreamChunk
      ? await executeLLMViaStreamApi({
          provider: target.provider,
          capability: target.capability,
          modelId: target.modelId,
          configId: target.configId,
          guestUserKeyConfig,
          messages,
          executionMode,
          temperature,
          maxTokens,
          signal,
          onChunk: (chunk) => onStreamChunk(ctx.nodeId, chunk),
        })
      : await executeLLMViaApi({
          provider: target.provider,
          capability: target.capability,
          modelId: target.modelId,
          configId: target.configId,
          guestUserKeyConfig,
          messages,
          executionMode,
          temperature,
          maxTokens,
          signal,
        })
  } else {
    throw new WorkflowError(
      ErrorCode.WORKFLOW_NODE_ERROR,
      `Unsupported execution mode for LLM node: ${executionMode}`,
      { nodeId: ctx.nodeId, executionMode },
    )
  }

  // 检查是否被中断
  if (signal.aborted) {
    throw new WorkflowError(ErrorCode.WORKFLOW_ABORTED, 'Execution aborted', {
      nodeId: ctx.nodeId,
    })
  }

  log.debug('LLM execution complete', { nodeId: ctx.nodeId, length: result.length })
  return { outputs: { 'text-out': result } }
}

/* ─── ImageGen: 提交图片生成任务 ─────────────────────── */

async function executeImageGen(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
  const { data, inputs, signal } = ctx
  const config = data.config
  const target = resolveNodeExecutionTarget('image-gen', config)
  const size = (config.size as string) ?? '1k'
  const aspectRatio = (config.aspectRatio as string) ?? '1:1'
  const executionMode = target.executionMode
  const guestUserKeyConfig = resolveGuestUserKeyConfig(
    target.capability,
    target.configId,
  )
  const prompt = (inputs['prompt-in'] as string) ?? ''
  const referenceImage = (inputs['image-in'] as string) || undefined

  if (!prompt) {
    throw new WorkflowError(
      ErrorCode.WORKFLOW_NODE_ERROR,
      'Image gen node received empty prompt',
      { nodeId: ctx.nodeId },
    )
  }

  if (executionMode !== 'platform' && executionMode !== 'user_key') {
    throw new WorkflowError(
      ErrorCode.WORKFLOW_NODE_ERROR,
      `Unsupported execution mode for image node: ${executionMode}`,
      { nodeId: ctx.nodeId, executionMode },
    )
  }

  const resultUrl = await executeTaskOutputViaApi({
    taskType: 'image_gen',
    workflowId: ctx.workflowId,
    nodeId: ctx.nodeId,
    provider: target.provider,
    capability: target.capability,
    modelId: target.modelId,
    configId: target.configId,
    guestUserKeyConfig,
    executionMode,
    input: { prompt, size, aspectRatio, imageUrl: referenceImage },
    outputType: 'image',
    signal,
    onStateChange: ctx.onTaskStateChange,
  })

  log.debug('Image gen complete', {
    nodeId: ctx.nodeId,
    provider: target.provider ?? target.capability,
  })
  return { outputs: { 'image-out': resultUrl } }
}

/* ─── VideoGen: 提交视频生成任务 ─────────────────────── */

async function executeVideoGen(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
  const { data, inputs, signal } = ctx
  const config = data.config
  const target = resolveNodeExecutionTarget('video-gen', config)
  const executionMode = target.executionMode
  const guestUserKeyConfig = resolveGuestUserKeyConfig(
    target.capability,
    target.configId,
  )
  const prompt = (inputs['prompt-in'] as string) ?? ''
  const imageUrl = (inputs['image-in'] as string) || undefined

  if (!prompt && !imageUrl) {
    throw new WorkflowError(
      ErrorCode.WORKFLOW_NODE_ERROR,
      'Video gen node needs prompt or image input',
      { nodeId: ctx.nodeId },
    )
  }

  if (executionMode !== 'platform' && executionMode !== 'user_key') {
    throw new WorkflowError(
      ErrorCode.WORKFLOW_NODE_ERROR,
      `Unsupported execution mode for video node: ${executionMode}`,
      { nodeId: ctx.nodeId, executionMode },
    )
  }

  const resultUrl = await executeTaskOutputViaApi({
    taskType: 'video_gen',
    workflowId: ctx.workflowId,
    nodeId: ctx.nodeId,
    provider: target.provider,
    capability: target.capability,
    modelId: target.modelId,
    configId: target.configId,
    guestUserKeyConfig,
    executionMode,
    input: {
      prompt,
      imageUrl,
      duration: (config.duration as string) ?? '5',
      aspectRatio: (config.aspectRatio as string) ?? '16:9',
      mode: (config.mode as string) ?? 'std',
    },
    outputType: 'video',
    signal,
  })

  log.debug('Video gen complete', {
    nodeId: ctx.nodeId,
    provider: target.provider ?? target.capability,
  })
  return { outputs: { 'video-out': resultUrl } }
}

/* ─── AudioGen: 调用 OpenAI TTS 合成语音 ────────────── */

async function executeAudioGen(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
  const { data, inputs, signal } = ctx
  const config = data.config
  const target = resolveNodeExecutionTarget('audio-gen', config)
  const executionMode = target.executionMode
  const guestUserKeyConfig = resolveGuestUserKeyConfig(
    target.capability,
    target.configId,
  )
  const voice = (config.voice as string) ?? 'alloy'
  const speed = (config.speed as number) ?? 1.0
  const text = (inputs['text-in'] as string) ?? ''

  if (!text) {
    throw new WorkflowError(
      ErrorCode.WORKFLOW_NODE_ERROR,
      'Audio gen node received empty text',
      { nodeId: ctx.nodeId },
    )
  }

  if (executionMode !== 'platform' && executionMode !== 'user_key') {
    throw new WorkflowError(
      ErrorCode.WORKFLOW_NODE_ERROR,
      `Unsupported execution mode for audio node: ${executionMode}`,
      { nodeId: ctx.nodeId, executionMode },
    )
  }

  const resultUrl = await executeTaskOutputViaApi({
    taskType: 'audio_gen',
    workflowId: ctx.workflowId,
    nodeId: ctx.nodeId,
    provider: target.provider,
    capability: target.capability,
    modelId: target.modelId,
    configId: target.configId,
    guestUserKeyConfig,
    executionMode,
    input: { text, voice, speed },
    outputType: 'audio',
    signal,
  })

  log.debug('Audio gen complete', {
    nodeId: ctx.nodeId,
    provider: target.provider ?? target.capability,
  })
  return { outputs: { 'audio-out': resultUrl } }
}

/* ─── Conditional: 条件分支 ─────────────────────────── */

async function executeConditional(
  ctx: NodeExecutionContext,
): Promise<NodeExecutionResult> {
  const config = ctx.data.config
  const value = ctx.inputs['value-in']
  const operator = (config.operator as string) ?? '=='
  const compareValue = (config.compareValue as string) ?? ''

  const result = evaluateCondition(value, operator, compareValue)
  log.debug('Conditional evaluated', { nodeId: ctx.nodeId, operator, result })

  return {
    outputs: {
      'true-out': result ? value : null,
      'false-out': result ? null : value,
    },
  }
}

function evaluateCondition(
  value: unknown,
  operator: string,
  compareValue: string,
): boolean {
  const normalizedValue = normalizeConditionValue(value)
  const normalizedCompare = normalizeConditionValue(compareValue)
  const leftText = stringifyConditionValue(normalizedValue)
  const rightText = stringifyConditionValue(normalizedCompare)
  const leftNumber = toComparableNumber(normalizedValue)
  const rightNumber = toComparableNumber(normalizedCompare)

  switch (operator) {
    case '==':
      return areConditionValuesEqual(normalizedValue, normalizedCompare)
    case '!=':
      return !areConditionValuesEqual(normalizedValue, normalizedCompare)
    case '>':
      return leftNumber != null && rightNumber != null ? leftNumber > rightNumber : false
    case '<':
      return leftNumber != null && rightNumber != null ? leftNumber < rightNumber : false
    case '>=':
      return leftNumber != null && rightNumber != null ? leftNumber >= rightNumber : false
    case '<=':
      return leftNumber != null && rightNumber != null ? leftNumber <= rightNumber : false
    case 'contains':
      if (Array.isArray(normalizedValue)) {
        return normalizedValue.some((item) =>
          areConditionValuesEqual(item, normalizedCompare),
        )
      }
      return leftText.includes(rightText)
    case 'empty':
      return isConditionValueEmpty(normalizedValue)
    case 'notEmpty':
      return !isConditionValueEmpty(normalizedValue)
    default:
      return false
  }
}

function normalizeConditionValue(value: unknown): unknown {
  if (typeof value !== 'string') return value

  const trimmed = value.trim()
  if (trimmed === '') return ''
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  if (trimmed === 'null') return null

  if (!Number.isNaN(Number(trimmed))) {
    return Number(trimmed)
  }

  if (
    (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
    (trimmed.startsWith('{') && trimmed.endsWith('}'))
  ) {
    try {
      return JSON.parse(trimmed) as unknown
    } catch {
      return value
    }
  }

  return value
}

function stringifyConditionValue(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function toComparableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (
    typeof value === 'string' &&
    value.trim() !== '' &&
    Number.isFinite(Number(value))
  ) {
    return Number(value)
  }
  return null
}

function areConditionValuesEqual(left: unknown, right: unknown): boolean {
  if (typeof left === 'object' || typeof right === 'object') {
    return stringifyConditionValue(left) === stringifyConditionValue(right)
  }
  return left === right
}

function isConditionValueEmpty(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string') return value.length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/* ─── Loop: 循环执行 (准备阶段，实际迭代由 WorkflowExecutor 驱动) */

async function executeLoop(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
  const config = ctx.data.config
  const mode = (config.mode as string) ?? 'forEach'
  const iterations = (config.iterations as number) ?? 3
  const separator = (config.separator as string) ?? '\\n'

  let items: unknown[]

  if (mode === 'repeat') {
    items = Array.from({ length: iterations }, (_, i) => i)
  } else {
    const raw = ctx.inputs['items-in']
    if (Array.isArray(raw)) {
      items = raw
    } else if (typeof raw === 'string') {
      items = parseLoopStringItems(raw, separator)
    } else {
      items = raw == null ? [] : [raw]
    }
  }

  log.debug('Loop prepared', { nodeId: ctx.nodeId, mode, itemCount: items.length })

  /* 返回完整 items 列表 + 第一项作为初始值
   * WorkflowExecutor 负责迭代逻辑 */
  return {
    outputs: {
      'item-out': items[0] ?? null,
      'index-out': 0,
      'results-out': [],
      __loop_items: items,
    },
  }
}

function parseLoopStringItems(raw: string, separator: string): unknown[] {
  const trimmed = raw.trim()

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown
      if (Array.isArray(parsed)) return parsed
    } catch {
      /* fallback to separator mode */
    }
  }

  const sep = separator.replace(/\\n/g, '\n').replace(/\\t/g, '\t')
  return raw
    .split(sep)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

/* ─── Display: 透传内容 ──────────────────────────────── */

async function executeDisplay(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
  const content = ctx.inputs['content-in'] ?? ''
  return { outputs: { content } }
}

interface ExecuteLLMApiParams {
  provider?: string
  capability?: 'text' | 'image' | 'video' | 'audio'
  modelId?: string
  configId?: string
  guestUserKeyConfig?: ReturnType<typeof findGuestRuntimeConfig>
  messages: ChatMessage[]
  executionMode: 'platform' | 'user_key'
  temperature: number
  maxTokens: number
  signal: AbortSignal
}

async function executeLLMViaApi(params: ExecuteLLMApiParams): Promise<string> {
  const { signal, ...body } = params
  const response = await fetch('/api/ai/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...body,
      guestUserKeyConfig: body.guestUserKeyConfig
        ? {
            configId: body.guestUserKeyConfig.configId,
            capability: body.guestUserKeyConfig.capability,
            providerKind: body.guestUserKeyConfig.providerKind,
            providerId: body.guestUserKeyConfig.providerId,
            apiKey: body.guestUserKeyConfig.apiKey,
            secretKey: body.guestUserKeyConfig.secretKey,
            baseUrl: body.guestUserKeyConfig.baseUrl,
            modelId: body.guestUserKeyConfig.modelId,
            imageCapabilities: body.guestUserKeyConfig.imageCapabilities,
          }
        : undefined,
    }),
    signal,
  })

  if (!response.ok) {
    throw await createApiWorkflowError(response)
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

  return result
}

interface ExecuteLLMStreamApiParams extends ExecuteLLMApiParams {
  onChunk: (chunk: string) => void
}

async function executeLLMViaStreamApi(
  params: ExecuteLLMStreamApiParams,
): Promise<string> {
  const { signal, onChunk, ...body } = params
  const response = await fetch('/api/ai/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...body,
      guestUserKeyConfig: body.guestUserKeyConfig
        ? {
            configId: body.guestUserKeyConfig.configId,
            capability: body.guestUserKeyConfig.capability,
            providerKind: body.guestUserKeyConfig.providerKind,
            providerId: body.guestUserKeyConfig.providerId,
            apiKey: body.guestUserKeyConfig.apiKey,
            secretKey: body.guestUserKeyConfig.secretKey,
            baseUrl: body.guestUserKeyConfig.baseUrl,
            modelId: body.guestUserKeyConfig.modelId,
            imageCapabilities: body.guestUserKeyConfig.imageCapabilities,
          }
        : undefined,
    }),
    signal,
  })

  if (!response.ok || !response.body) {
    throw await createApiWorkflowError(response)
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

  return result
}

async function createApiWorkflowError(response: Response): Promise<WorkflowError> {
  let message = `AI API request failed (${response.status})`

  try {
    const payload = (await response.json()) as {
      error?: { message?: string }
    }
    message = payload.error?.message ?? message
  } catch {
    /* ignore malformed response body */
  }

  return new WorkflowError(ErrorCode.WORKFLOW_NODE_ERROR, message)
}

interface ExecuteTaskOutputApiParams {
  taskType: 'image_gen' | 'video_gen' | 'audio_gen'
  workflowId?: string
  nodeId?: string
  provider?: string
  capability?: 'text' | 'image' | 'video' | 'audio'
  modelId?: string
  configId?: string
  guestUserKeyConfig?: ReturnType<typeof findGuestRuntimeConfig>
  executionMode: 'platform' | 'user_key'
  input: Record<string, unknown>
  outputType: 'image' | 'video' | 'audio'
  signal: AbortSignal
  onStateChange?: (change: NodeTaskStateChange) => void
}

function getTaskPollingPlan(taskType: ExecuteTaskOutputApiParams['taskType']) {
  const config = TASK_CONFIG[taskType]
  const intervalMs = Math.max(1_000, config.pollIntervalMs)
  return { intervalMs }
}

function resolveGuestUserKeyConfig(
  capability: 'text' | 'image' | 'video' | 'audio' | undefined,
  configId?: string,
) {
  if (!capability || !configId || !isGuestModelConfigId(configId)) {
    return undefined
  }

  return findGuestRuntimeConfig(capability, configId) ?? undefined
}

async function executeTaskOutputViaApi(
  params: ExecuteTaskOutputApiParams,
): Promise<string> {
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
      guestUserKeyConfig: params.guestUserKeyConfig
        ? {
            configId: params.guestUserKeyConfig.configId,
            capability: params.guestUserKeyConfig.capability,
            providerKind: params.guestUserKeyConfig.providerKind,
            providerId: params.guestUserKeyConfig.providerId,
            apiKey: params.guestUserKeyConfig.apiKey,
            secretKey: params.guestUserKeyConfig.secretKey,
            baseUrl: params.guestUserKeyConfig.baseUrl,
            modelId: params.guestUserKeyConfig.modelId,
            imageCapabilities: params.guestUserKeyConfig.imageCapabilities,
          }
        : undefined,
      executionMode: params.executionMode,
      input: params.input,
    }),
    signal: params.signal,
  })

  if (!submitResponse.ok) {
    throw await createApiWorkflowError(submitResponse)
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
      throw await createApiWorkflowError(taskResponse)
    }

    const taskPayload = (await taskResponse.json()) as {
      data?: {
        status?: string
        progress?: number
        output?: { url?: string; error?: string } | null
      }
    }

    const status = taskPayload.data?.status
    const progress = typeof taskPayload.data?.progress === 'number' ? taskPayload.data.progress : 0
    const output = taskPayload.data?.output

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
      return output.url
    }

    if (status === 'failed' || status === 'cancelled') {
      throw new WorkflowError(
        ErrorCode.WORKFLOW_NODE_ERROR,
        output?.error ?? `${params.outputType} task ${status}`,
      )
    }
  }

}

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
