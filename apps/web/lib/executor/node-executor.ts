/**
 * [INPUT]: 依赖 @/services/ai/openrouter 的 AI 调用能力，
 *          依赖 @/lib/errors 的 WorkflowError，依赖 @/lib/logger
 * [OUTPUT]: 对外提供 executeNode 函数 (按节点类型分发执行)
 * [POS]: lib/executor 的节点执行单元，被 WorkflowExecutor 在遍历中逐节点调用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { ErrorCode, WorkflowError } from '@/lib/errors'
import { createLogger } from '@/lib/logger'
import { openRouter } from '@/services/ai/openrouter'
import type { ChatMessage } from '@/services/ai/types'
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

const executors: Record<string, NodeExecutorFn> = {
  'text-input': executeTextInput,
  llm: executeLLM,
  display: executeDisplay,
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
  const text = (ctx.data.config.text as string) ?? ''
  return { outputs: { 'text-out': text } }
}

/* ─── LLM: 调用 AI 模型 ─────────────────────────────── */

async function executeLLM(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
  const { data, inputs, apiKey, signal, onStreamChunk } = ctx
  const config = data.config

  const model = (config.model as string) ?? 'openai/gpt-4o-mini'
  const temperature = (config.temperature as number) ?? 0.7
  const maxTokens = (config.maxTokens as number) ?? 1024
  const systemPrompt = (config.systemPrompt as string) ?? ''

  /* ── 收集 prompt：优先上游输入，其次 config ────── */
  const promptText = (inputs['prompt-in'] as string) ?? ''

  if (!promptText) {
    throw new WorkflowError(
      ErrorCode.WORKFLOW_NODE_ERROR,
      'LLM node received empty prompt',
      { nodeId: ctx.nodeId },
    )
  }

  if (!apiKey) {
    throw new WorkflowError(
      ErrorCode.WORKFLOW_NODE_ERROR,
      'API key is required for LLM execution',
      { nodeId: ctx.nodeId },
    )
  }

  /* ── 构建消息列表 ─────────────────────────────── */
  const messages: ChatMessage[] = []
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }
  messages.push({ role: 'user', content: promptText })

  /* ── 执行 AI 调用 (流式) ──────────────────────── */
  let result: string

  if (onStreamChunk) {
    // 注册中断监听
    const abortHandler = () => {
      // OpenRouter fetch 会自然中断
    }
    signal.addEventListener('abort', abortHandler)

    try {
      result = await openRouter.chatStream({
        model,
        messages,
        temperature,
        maxTokens,
        apiKey,
        onChunk: (chunk) => onStreamChunk(ctx.nodeId, chunk),
      })
    } finally {
      signal.removeEventListener('abort', abortHandler)
    }
  } else {
    result = await openRouter.chat({
      model,
      messages,
      temperature,
      maxTokens,
      apiKey,
    })
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

/* ─── Display: 透传内容 ──────────────────────────────── */

async function executeDisplay(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
  const content = (ctx.inputs['content-in'] as string) ?? ''
  return { outputs: { content } }
}
