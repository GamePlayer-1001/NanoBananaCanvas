/**
 * [INPUT]: 依赖浏览器 fetch，依赖 @/lib/validations/agent 的 explain schema
 * [OUTPUT]: 对外提供 explainCanvas()，向服务端请求自然语言解释
 * [POS]: lib/agent 的解释语义层，被 use-agent-session 调用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import {
  agentExplainRequestSchema,
  agentExplainResponseSchema,
} from '@/lib/validations/agent'
import type { AgentExplainRequest } from './types'

export async function explainCanvas(
  input: AgentExplainRequest,
): Promise<string> {
  const request = agentExplainRequestSchema.parse(input)

  const response = await fetch('/api/agent/explain', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  let payload: unknown = null
  try {
    payload = await response.json()
  } catch {
    /* ignore */
  }

  if (!response.ok) {
    const message =
      typeof payload === 'object' &&
      payload &&
      'error' in payload &&
      typeof payload.error === 'object' &&
      payload.error &&
      'message' in payload.error
        ? String(payload.error.message)
        : `解释接口请求失败：${response.status}`

    throw new Error(message)
  }

  const parsed = agentExplainResponseSchema.parse(payload)
  return parsed.data.answer
}
