/**
 * [INPUT]: 依赖 /api/ai/* 与 /api/tasks/* 服务端执行链路，
 *          依赖 @nano-banana/shared 的 TASK_CONFIG，依赖 @/lib/errors 的 WorkflowError，依赖 @/lib/logger，依赖 @/components/nodes/plugin-registry 的 getNodePorts
 * [OUTPUT]: 对外提供 executeNode 函数 (按节点类型分发执行)
 * [POS]: lib/executor 的节点执行单元，被 WorkflowExecutor 在遍历中逐节点调用，统一衔接画布节点与服务端 AI/任务能力
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { ErrorCode, WorkflowError } from '@/lib/errors'
import { createLogger } from '@/lib/logger'
import { getNodePorts } from '@/components/nodes/plugin-registry'
import { resolveNodeExecutionTarget } from '@/lib/ai-node-config'
import type { ChatMessage, ContentPart } from '@/services/ai/types'
import type { WorkflowNodeData } from '@/types'
import {
  executeLLMViaApi,
  executeLLMViaStreamApi,
  executeTaskOutputViaApi,
} from './node-executor-api'

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
  'input': executeUnifiedInput,
  'text-input': executeUnifiedInput,
  'image-input': executeUnifiedInput,
  'image-mask': executeImageMask,
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
  'image-compare': executeImageCompare,
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

/* ─── UnifiedInput: 统一输入节点 (文本 + 媒体) ────────── */

interface MediaFileConfig {
  id: string
  url: string
  type: 'image' | 'video'
  name?: string
}

async function executeUnifiedInput(
  ctx: NodeExecutionContext,
): Promise<NodeExecutionResult> {
  const config = ctx.data.config

  /* ── text output ─────────────────────────────────── */
  const rawText = config.text
  const text = typeof rawText === 'string' ? rawText : rawText == null ? '' : String(rawText)

  /* ── image output (first media file, or legacy imageUrl) ── */
  const mediaFiles = Array.isArray(config.mediaFiles)
    ? (config.mediaFiles as MediaFileConfig[])
    : []
  let imageUrl = mediaFiles.find((f) => f.type === 'image')?.url ?? ''

  // backward compat: legacy image-input nodes stored imageUrl directly
  if (!imageUrl && typeof config.imageUrl === 'string') {
    imageUrl = config.imageUrl
  }

  return {
    outputs: {
      'text-out': text,
      'image-out': imageUrl || null,
    },
  }
}

/* ─── ImageMask: 笔刷蒙版节点 ────────────────────────── */

async function executeImageMask(
  ctx: NodeExecutionContext,
): Promise<NodeExecutionResult> {
  const imageUrl =
    typeof ctx.data.config.imageUrl === 'string'
      ? (ctx.data.config.imageUrl as string)
      : ''
  const maskUrl =
    typeof ctx.data.config.maskUrl === 'string' ? (ctx.data.config.maskUrl as string) : ''

  if (!imageUrl) {
    throw new WorkflowError(
      ErrorCode.WORKFLOW_NODE_ERROR,
      'Image mask node has no image uploaded yet',
      { nodeId: ctx.nodeId },
    )
  }

  if (!maskUrl) {
    throw new WorkflowError(
      ErrorCode.WORKFLOW_NODE_ERROR,
      'Image mask node has no mask painted yet',
      { nodeId: ctx.nodeId },
    )
  }

  return {
    outputs: {
      'image-out': { imageUrl, maskUrl },
    },
  }
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

async function executeImageCompare(
  ctx: NodeExecutionContext,
): Promise<NodeExecutionResult> {
  const imageA = ctx.inputs['image-a-in']
  const imageB = ctx.inputs['image-b-in']

  if (typeof imageA !== 'string' || !imageA) {
    throw new WorkflowError(
      ErrorCode.WORKFLOW_NODE_ERROR,
      'Image Compare requires Image A input',
      { nodeId: ctx.nodeId },
    )
  }
  if (typeof imageB !== 'string' || !imageB) {
    throw new WorkflowError(
      ErrorCode.WORKFLOW_NODE_ERROR,
      'Image Compare requires Image B input',
      { nodeId: ctx.nodeId },
    )
  }

  ctx.onTaskStateChange?.({
    configPatch: { imageA, imageB },
  })

  return { outputs: { 'image-out': imageA } }
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

  const { referenceImage: imageUrl } = unpackImageMaskInput(inputs['image-in'])
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
          nodeId: ctx.nodeId,
          workflowId: ctx.workflowId,
          provider: target.provider,
          capability: target.capability,
          modelId: target.modelId,
          configId: target.configId,
          messages,
          executionMode,
          temperature,
          maxTokens,
          signal,
          onChunk: (chunk) => onStreamChunk(ctx.nodeId, chunk),
        })
      : await executeLLMViaApi({
          nodeId: ctx.nodeId,
          workflowId: ctx.workflowId,
          provider: target.provider,
          capability: target.capability,
          modelId: target.modelId,
          configId: target.configId,
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

function unpackImageMaskInput(value: unknown): {
  referenceImage: string | undefined
  maskImage: string | undefined
} {
  if (typeof value === 'string') {
    return { referenceImage: value || undefined, maskImage: undefined }
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const imageUrl = typeof record.imageUrl === 'string' ? record.imageUrl : ''
    const maskUrl = typeof record.maskUrl === 'string' ? record.maskUrl : ''
    return {
      referenceImage: imageUrl || undefined,
      maskImage: maskUrl || undefined,
    }
  }
  return { referenceImage: undefined, maskImage: undefined }
}

async function executeImageGen(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
  const { data, inputs, signal } = ctx
  const config = data.config
  const target = resolveNodeExecutionTarget('image-gen', config)
  const size = (config.size as string) ?? '1k'
  const aspectRatio = (config.aspectRatio as string) ?? '1:1'
  const executionMode = target.executionMode
  const prompt = (inputs['prompt-in'] as string) ?? ''
  const referenceInput = inputs['image-in']
  const { referenceImage, maskImage } = unpackImageMaskInput(referenceInput)

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
    executionMode,
    input: {
      prompt,
      size,
      aspectRatio,
      imageUrl: referenceImage,
      maskUrl: maskImage,
    },
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
  const prompt = (inputs['prompt-in'] as string) ?? ''
  const { referenceImage: imageUrl } = unpackImageMaskInput(inputs['image-in'])

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

