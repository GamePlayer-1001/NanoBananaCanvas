/**
 * [INPUT]: 依赖 @/components/nodes/plugin-registry 的节点注册表，依赖 @/lib/utils/validate-connection 的连线合法性，依赖当前画布 nodes/edges
 * [OUTPUT]: 对外提供 validateAgentPlan()，对结构化 plan 做本地白名单校验与确认阈值判断
 * [POS]: lib/agent 的本地安全阀，被 use-agent-session 与后续真正落图链复用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Connection } from '@xyflow/react'
import { getNodeMeta } from '@/components/nodes/plugin-registry'
import { isValidConnection } from '@/lib/utils/validate-connection'
import { useFlowStore } from '@/stores/use-flow-store'
import {
  AGENT_ALLOWED_OPERATIONS,
  AGENT_MAX_AUTO_OPERATIONS,
} from './constants'
import type {
  AgentCanvasEdge,
  AgentCanvasNode,
  AgentPlan,
  AgentPlanValidationResult,
} from './types'

interface ValidateAgentPlanOptions {
  nodes?: AgentCanvasNode[]
  edges?: AgentCanvasEdge[]
}

export function validateAgentPlan(
  plan: AgentPlan,
  {
    nodes = useFlowStore.getState().nodes,
    edges = useFlowStore.getState().edges,
  }: ValidateAgentPlanOptions = {},
): AgentPlanValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  let requiresConfirmation = plan.requiresConfirmation

  for (const operation of plan.operations) {
    if (!AGENT_ALLOWED_OPERATIONS.includes(operation.type)) {
      errors.push(`不支持的操作类型：${operation.type}`)
      continue
    }

    if (operation.type === 'add_node' && !getNodeMeta(operation.nodeType)) {
      errors.push(`未知节点类型：${operation.nodeType}`)
    }

    if (operation.type === 'update_node_data' || operation.type === 'remove_node') {
      if (!nodes.some((node) => node.id === operation.nodeId)) {
        errors.push(`目标节点不存在：${operation.nodeId}`)
      }
    }

    if (operation.type === 'disconnect') {
      if (!edges.some((edge) => edge.id === operation.edgeId)) {
        errors.push(`目标连线不存在：${operation.edgeId}`)
      }
    }

    if (operation.type === 'connect') {
      const connection: Connection = {
        source: operation.source,
        target: operation.target,
        sourceHandle: operation.sourceHandle,
        targetHandle: operation.targetHandle,
      }

      if (!isValidConnection(connection, nodes, edges)) {
        warnings.push(`连接 ${operation.source} -> ${operation.target} 需要在真实落图时再确认端口兼容性`)
      }
    }

    if (
      operation.type === 'remove_node' ||
      operation.type === 'request_prompt_confirmation' ||
      operation.type === 'run_workflow'
    ) {
      requiresConfirmation = true
    }
  }

  if (plan.operations.length > AGENT_MAX_AUTO_OPERATIONS) {
    requiresConfirmation = true
    warnings.push(`本次提案包含 ${plan.operations.length} 个操作，超过自动落地阈值`)
  }

  return {
    ok: errors.length === 0,
    requiresConfirmation,
    errors,
    warnings,
  }
}

