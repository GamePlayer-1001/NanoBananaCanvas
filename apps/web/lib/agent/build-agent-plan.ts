/**
 * [INPUT]: 依赖浏览器 fetch，依赖 @/lib/validations/agent 的请求/响应 schema
 * [OUTPUT]: 对外提供 buildAgentPlan()，向服务端 planner 请求结构化 AgentPlan
 * [POS]: lib/agent 的计划构建器，被 use-agent-session 调用，隔离前端与 API route 的通信细节
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { agentPlanRequestSchema, agentPlanResponseSchema } from '@/lib/validations/agent'
import type { AgentPlan, AgentPlanRequest } from './types'

export async function buildAgentPlan(input: AgentPlanRequest): Promise<AgentPlan> {
  const request = agentPlanRequestSchema.parse(input)

  const response = await fetch('/api/agent/plan', {
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
        : `计划接口请求失败：${response.status}`

    throw new Error(message)
  }

  const parsed = agentPlanResponseSchema.parse(payload)
  return parsed.data.plan
}
