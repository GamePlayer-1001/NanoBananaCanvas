/**
 * [INPUT]: 依赖 AgentPlan 与已应用 operation 的结果摘要
 * [OUTPUT]: 对外提供 explainAgentChange()，把落图结果翻译成用户可读变更说明
 * [POS]: lib/agent 的变更解释器，被 apply-agent-plan 与聊天区落图反馈复用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { AgentPlan, WorkflowOperation } from './types'

interface ExplainAgentChangeOptions {
  plan: AgentPlan
  appliedOperations?: WorkflowOperation[]
}

export function explainAgentChange({
  plan,
  appliedOperations = plan.operations,
}: ExplainAgentChangeOptions) {
  const lines = appliedOperations.map((operation) => describeOperation(operation))
  return {
    title: `已应用提案：${plan.goal}`,
    summary: lines.join('；'),
    lines,
  }
}

function describeOperation(operation: WorkflowOperation) {
  switch (operation.type) {
    case 'add_node':
      return `新增 ${operation.nodeType} 节点`
    case 'update_node_data':
      return `更新节点 ${operation.nodeId} 的局部配置`
    case 'remove_node':
      return `删除节点 ${operation.nodeId}`
    case 'connect':
      return `连接 ${operation.source} -> ${operation.target}`
    case 'disconnect':
      return `移除连线 ${operation.edgeId}`
    case 'focus_nodes':
      return `聚焦 ${operation.nodeIds.length} 个相关节点`
    case 'request_prompt_confirmation':
      return '进入提示词确认'
    case 'run_workflow':
      return operation.scope === 'from-node'
        ? `从节点 ${operation.nodeId ?? '-'} 开始执行`
        : '执行当前工作流'
  }
}

