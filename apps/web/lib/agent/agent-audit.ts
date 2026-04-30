/**
 * [INPUT]: 依赖浏览器 fetch，依赖 agent/types 的审计语义
 * [OUTPUT]: 对外提供 recordAgentAudit() / fetchAgentAuditLogs() / fetchLatestAgentReplay()
 * [POS]: lib/agent 的审计语义层，被会话编排和回放入口消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { AgentAuditLog } from './types'

export async function recordAgentAudit(
  workflowId: string,
  payload: Omit<AgentAuditLog, 'id' | 'workflowId' | 'createdAt'>,
) {
  const response = await fetch(`/api/workflows/${workflowId}/agent-audit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Agent audit request failed: ${response.status}`)
  }

  return response.json()
}

export async function fetchAgentAuditLogs(workflowId: string) {
  const response = await fetch(`/api/workflows/${workflowId}/agent-audit`)
  if (!response.ok) {
    throw new Error(`Agent audit fetch failed: ${response.status}`)
  }
  return response.json()
}

export async function fetchLatestAgentReplay(workflowId: string) {
  const response = await fetch(`/api/workflows/${workflowId}/agent-replay`)
  if (!response.ok) {
    throw new Error(`Agent replay fetch failed: ${response.status}`)
  }
  return response.json()
}
