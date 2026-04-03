/**
 * [INPUT]: 依赖 @/services/ai 的 getProvider (Provider 注册表) 与 /api/ai/* 服务端执行链路，
 *          依赖 @/lib/errors 的 WorkflowError，依赖 @/lib/logger
 * [OUTPUT]: 对外提供 executeNode 函数 (按节点类型分发执行)
 * [POS]: lib/executor 的节点执行单元，被 WorkflowExecutor 在遍历中逐节点调用，统一衔接本地节点与服务端 AI/任务能力
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { ErrorCode, WorkflowError } from '@/lib/errors'
import { createLogger } from '@/lib/logger'
import { getProvider } from '@/services/ai'
import type { ChatMessage, ContentPart } from '@/services/ai/types'
import type { WorkflowNodeData } from '@/types'

const log = createLogger('NodeExecutor')

/* ─── Types ──────────────────────────────────────────── */

export interface NodeExecutionContext {
  nodeId: string
  nodeType: string
  data: WorkflowNodeData
  inputs: Record<string, unknown>
  apiKey: string
  signal: AbortSignal
  onStreamChunk?: (nodeId: string, chunk: string) => void
}

export interface NodeExecutionResult {
  outputs: Record<string, unknown>
}

/* ─── Executor Registry ──────────────────────────────── */

type NodeExecutorFn = (ctx: NodeExecutionContext) => Promise<NodeExecutionResult>

const executeNoop: NodeExecutorFn = async () => ({ outputs: {} })

const executors: Record<string, NodeExecutorFn> = {
  'text-input': executeTextInput,
  llm: executeLLM,
  display: executeDisplay,
  'image-gen': executeImageGen,
  'video-gen': executeVideoGen,
  'audio-gen': executeAudioGen,
  note: executeNoop,
  group: executeNoop,
  conditional: executeConditional,
  loop: executeLoop,
}

/* ─── Main Entry ─────────────────────────────────────── */

export async function executeNode(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
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

/* ─── LLM: 调用 AI 模型 ─────────────────────────────── */

async function executeLLM(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
  const { data, inputs, apiKey, signal, onStreamChunk } = ctx
  const config = data.config

  const providerId = (config.provider as string) ?? 'openrouter'
  const model = (config.model as string) ?? 'openai/gpt-4o-mini'
  const temperature = (config.temperature as number) ?? 0.7
  const maxTokens = (config.maxTokens as number) ?? 1024
  const systemPrompt = (config.systemPrompt as string) ?? ''
  const executionMode = (config.executionMode as string) ?? 'credits'

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

  if (executionMode === 'credits' || executionMode === 'user_key') {
    result = onStreamChunk
      ? await executeLLMViaStreamApi({
        provider: providerId,
        modelId: model,
        messages,
        executionMode,
        temperature,
        maxTokens,
        signal,
        onChunk: (chunk) => onStreamChunk(ctx.nodeId, chunk),
      })
      : await executeLLMViaApi({
        provider: providerId,
        modelId: model,
        messages,
        executionMode,
        temperature,
        maxTokens,
        signal,
      })
  } else {
    if (!apiKey) {
      throw new WorkflowError(
        ErrorCode.WORKFLOW_NODE_ERROR,
        'API key is required for LLM execution',
        { nodeId: ctx.nodeId },
      )
    }

    const provider = getProvider(providerId)
    if (onStreamChunk) {
      result = await provider.chatStream({
        model,
        messages,
        temperature,
        maxTokens,
        apiKey,
        signal,
        onChunk: (chunk) => onStreamChunk(ctx.nodeId, chunk),
      })
    } else {
      const chatResult = await provider.chat({
        model,
        messages,
        temperature,
        maxTokens,
        apiKey,
        signal,
      })
      result = chatResult.content
    }
  }

  // 检查是否被中断
  if (signal.aborted) {
    throw new WorkflowError(
      ErrorCode.WORKFLOW_ABORTED,
      'Execution aborted',
      { nodeId: ctx.nodeId },
    )
  }

  log.debug('LLM execution complete', { nodeId: ctx.nodeId, length: result.length })
  return { outputs: { 'text-out': result } }
}

/* ─── ImageGen: 提交图片生成任务 ─────────────────────── */

async function executeImageGen(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
  const { data, inputs, apiKey } = ctx
  const config = data.config

  const provider = (config.provider as string) ?? 'openrouter'
  const model = (config.model as string) ?? 'openai/dall-e-3'
  const size = (config.size as string) ?? '1024x1024'
  const prompt = (inputs['prompt-in'] as string) ?? ''
  const referenceImage = (inputs['image-in'] as string) || undefined

  if (!prompt) {
    throw new WorkflowError(
      ErrorCode.WORKFLOW_NODE_ERROR,
      'Image gen node received empty prompt',
      { nodeId: ctx.nodeId },
    )
  }

  const { ImageGenProcessor } = await import('@/lib/tasks/processors/image-gen')
  const processor = new ImageGenProcessor(provider)
  const submitResult = await processor.submit(
    { model, params: { prompt, size, imageUrl: referenceImage } },
    apiKey,
  )

  // 同步 Provider: submit 直接返回 URL，check 即完成
  const checkResult = await processor.checkStatus(submitResult.externalTaskId, apiKey)
  const resultUrl = checkResult.result?.url ?? ''

  log.debug('Image gen complete', { nodeId: ctx.nodeId, provider })
  return { outputs: { 'image-out': resultUrl } }
}

/* ─── VideoGen: 提交视频生成任务 ─────────────────────── */

async function executeVideoGen(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
  const { data, inputs, apiKey } = ctx
  const config = data.config

  const provider = (config.provider as string) ?? 'kling'
  const model = (config.model as string) ?? 'kling-v2-0'
  const prompt = (inputs['prompt-in'] as string) ?? ''
  const imageUrl = (inputs['image-in'] as string) || undefined

  if (!prompt && !imageUrl) {
    throw new WorkflowError(
      ErrorCode.WORKFLOW_NODE_ERROR,
      'Video gen node needs prompt or image input',
      { nodeId: ctx.nodeId },
    )
  }

  const { VideoGenProcessor } = await import('@/lib/tasks/processors/video-gen')
  const processor = new VideoGenProcessor(provider)

  const submitResult = await processor.submit(
    {
      model,
      params: {
        prompt,
        imageUrl,
        duration: (config.duration as string) ?? '5',
        aspectRatio: (config.aspectRatio as string) ?? '16:9',
        mode: (config.mode as string) ?? 'std',
      },
    },
    apiKey,
  )

  // 视频生成是异步的 — 返回任务 ID 供轮询
  log.debug('Video gen submitted', { nodeId: ctx.nodeId, taskId: submitResult.externalTaskId })
  return { outputs: { 'video-out': submitResult.externalTaskId } }
}

/* ─── AudioGen: 调用 OpenAI TTS 合成语音 ────────────── */

async function executeAudioGen(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
  const { data, inputs, apiKey } = ctx
  const config = data.config

  const provider = (config.provider as string) ?? 'openai'
  const model = (config.model as string) ?? 'tts-1'
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

  const { AudioGenProcessor } = await import('@/lib/tasks/processors/audio-gen')
  const processor = new AudioGenProcessor(provider)
  const submitResult = await processor.submit(
    { model, params: { text, voice, speed } },
    apiKey,
  )

  // 同步 Provider: submit 直接返回 data URL，check 即完成
  const checkResult = await processor.checkStatus(submitResult.externalTaskId, apiKey)
  const resultUrl = checkResult.result?.url ?? ''

  log.debug('Audio gen complete', { nodeId: ctx.nodeId, provider })
  return { outputs: { 'audio-out': resultUrl } }
}

/* ─── Conditional: 条件分支 ─────────────────────────── */

async function executeConditional(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
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

function evaluateCondition(value: unknown, operator: string, compareValue: string): boolean {
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
        return normalizedValue.some((item) => areConditionValuesEqual(item, normalizedCompare))
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
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
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
  provider: string
  modelId: string
  messages: ChatMessage[]
  executionMode: 'credits' | 'user_key'
  temperature: number
  maxTokens: number
  signal: AbortSignal
}

async function executeLLMViaApi(params: ExecuteLLMApiParams): Promise<string> {
  const { signal, ...body } = params
  const response = await fetch('/api/ai/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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

async function executeLLMViaStreamApi(params: ExecuteLLMStreamApiParams): Promise<string> {
  const { signal, onChunk, ...body } = params
  const response = await fetch('/api/ai/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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
