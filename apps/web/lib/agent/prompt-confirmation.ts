/**
 * [INPUT]: 依赖浏览器 fetch，依赖 @/lib/validations/agent 的 refine prompt schema
 * [OUTPUT]: 对外提供 refinePromptConfirmation()，向服务端请求新的 PromptConfirmationPayload
 * [POS]: lib/agent 的 prompt 确认语义层，被 use-agent-session 调用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import {
  promptConfirmationRequestSchema,
  promptConfirmationResponseSchema,
} from '@/lib/validations/agent'
import type { PromptConfirmationPayload, PromptConfirmationRequest } from './types'

export async function refinePromptConfirmation(
  input: PromptConfirmationRequest,
): Promise<PromptConfirmationPayload> {
  const request = promptConfirmationRequestSchema.parse(input)

  const response = await fetch('/api/agent/refine-prompt', {
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
        : `提示词确认接口请求失败：${response.status}`

    throw new Error(message)
  }

  const parsed = promptConfirmationResponseSchema.parse(payload)
  return parsed.data.payload
}
