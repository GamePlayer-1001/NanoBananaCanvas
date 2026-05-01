/**
 * [INPUT]: 依赖浏览器 fetch，依赖 @/lib/validations/agent 的 diagnose schema
 * [OUTPUT]: 对外提供 optimizeCanvas()，向服务端请求优化诊断
 * [POS]: lib/agent 的优化语义层，被 use-agent-session 调用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import {
  agentDiagnosisRequestSchema,
  agentDiagnosisResponseSchema,
} from '@/lib/validations/agent'
import type { AgentDiagnosis, AgentDiagnosisRequest } from './types'

export async function optimizeCanvas(
  input: AgentDiagnosisRequest,
): Promise<AgentDiagnosis> {
  const request = agentDiagnosisRequestSchema.parse(input)

  const response = await fetch('/api/agent/optimize', {
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
        : `优化接口请求失败：${response.status}`

    throw new Error(message)
  }

  const parsed = agentDiagnosisResponseSchema.parse(payload)
  return parsed.data.diagnosis
}
