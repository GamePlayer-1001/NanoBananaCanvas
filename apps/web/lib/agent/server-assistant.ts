/**
 * [INPUT]: 依赖 @/services/ai 的平台 Provider 工厂与 API Key 解析，依赖 @/lib/platform-runtime 的默认模型解析，
 *          依赖 @/lib/errors 的统一错误类型
 * [OUTPUT]: 对外提供 callAgentAssistantJson / callAgentAssistantText，供服务端 Agent route 复用模型推理能力
 * [POS]: lib/agent 的服务端 AI 助手适配层，位于规则与 route 之间，负责把 Agent 的结构化/文本请求安全交给模型
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { AIServiceError, ErrorCode } from '@/lib/errors'
import { resolvePlatformRuntimeModel } from '@/lib/platform-runtime'
import { createPlatformTextProvider, getPlatformSupplierApiKey } from '@/services/ai'
import type { AgentAssistantRuntime } from './types'

const SYSTEM_PROMPT =
  '你是 Nano Banana Canvas 的工作流 Agent。你需要严格根据用户目标、已有画布上下文和输出格式要求返回结果。不要编造不存在的节点能力。'

export async function callAgentAssistantText(options: {
  prompt: string
  assistantRuntime?: AgentAssistantRuntime
}) {
  const runtimeModel = resolvePlatformRuntimeModel({
    category: 'text',
    modelId: options.assistantRuntime?.modelId,
    supplierHint: options.assistantRuntime?.provider,
  })
  const provider = createPlatformTextProvider(runtimeModel.supplierId)
  const apiKey = await getPlatformSupplierApiKey(runtimeModel.supplierId)
  const result = await provider.chat({
    model: runtimeModel.modelId,
    apiKey,
    temperature: 0.2,
    maxTokens: 1400,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: options.prompt },
    ],
  })

  return result.content.trim()
}

export async function callAgentAssistantJson<T>(options: {
  prompt: string
  assistantRuntime?: AgentAssistantRuntime
}): Promise<T | null> {
  const text = await callAgentAssistantText(options)
  const normalized = unwrapJsonFence(text)

  try {
    return JSON.parse(normalized) as T
  } catch {
    return null
  }
}

function unwrapJsonFence(value: string) {
  const trimmed = value.trim()
  if (!trimmed.startsWith('```')) {
    return trimmed
  }

  return trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

export function ensureAgentJson<T>(
  payload: T | null,
  message: string,
): T {
  if (payload) {
    return payload
  }

  throw new AIServiceError(ErrorCode.AI_PROVIDER_ERROR, message)
}
