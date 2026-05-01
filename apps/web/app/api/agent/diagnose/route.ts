/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/validations/agent
 * [OUTPUT]: 对外提供 POST /api/agent/diagnose，返回 AgentDiagnosis
 * [POS]: api/agent 的诊断端点，把执行现象翻译成现象/根因/修复建议
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { apiError, apiOk, handleApiError, withBodyLimit } from '@/lib/api/response'
import { agentDiagnosisRequestSchema } from '@/lib/validations/agent'

export async function POST(req: Request) {
  const tooLarge = withBodyLimit(req)
  if (tooLarge) return tooLarge

  try {
    await requireAuth()

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return apiError('VALIDATION_FAILED', 'Invalid JSON body', 400)
    }

    const input = agentDiagnosisRequestSchema.parse(body)
    const diagnosis = buildDiagnosis(input)
    return apiOk({ diagnosis })
  } catch (error) {
    return handleApiError(error)
  }
}

function buildDiagnosis(
  input: ReturnType<typeof agentDiagnosisRequestSchema.parse>,
) {
  const { canvasSummary, userMessage } = input
  const selectedNodeId = canvasSummary.selectedNodeId
  const failedNodeId = canvasSummary.latestExecution?.failedNodeId
  const failedReason = canvasSummary.latestExecution?.failedReason
  const disconnectedNodeIds = canvasSummary.disconnectedNodeIds.slice(0, 3)
  const displayMissingNodeId = canvasSummary.displayMissingForNodeIds[0]
  const focusNodeIds = [
    ...(failedNodeId ? [failedNodeId] : []),
    ...disconnectedNodeIds,
  ].slice(0, 3)

  if (failedNodeId || failedReason) {
    return {
      summary: failedReason
        ? `我定位到最近一次失败主要卡在 ${failedNodeId ?? '当前执行链'}。`
        : '我定位到最近一次执行失败需要先看错误节点。',
      phenomenon: failedReason
        ? `现象上看，这条链最近一次执行失败，错误信息是：${failedReason}`
        : '现象上看，当前工作流最近一次执行没有成功收口。',
      rootCause: failedNodeId
        ? `根因大概率集中在节点 ${failedNodeId} 的输入、配置或上游依赖不完整。`
        : '根因大概率是运行时配置或上游数据没有满足当前节点要求。',
      repairSuggestion: failedNodeId
        ? `建议先聚焦到节点 ${failedNodeId}，检查它的必填输入、模型参数和最近一次错误输出，再决定是否让我代你修。`
        : '建议先检查最近一次报错节点的输入和配置，再决定是否让我代为修复。',
      affectedNodeIds: failedNodeId ? [failedNodeId] : focusNodeIds,
      suggestedOperations: focusNodeIds.length > 0
        ? [{ type: 'focus_nodes' as const, nodeIds: focusNodeIds }]
        : undefined,
      requiresConfirmation: false,
    }
  }

  if (displayMissingNodeId) {
    return {
      summary: '我发现有 AI 节点没有把结果显式承接出来。',
      phenomenon: `现象上看，节点 ${displayMissingNodeId} 已经可以产出内容，但左侧还没有清晰的结果展示承接。`,
      rootCause: '根因不是模型本身报错，而是工作流结构缺少结果出口，导致你看起来像“没跑出来”。',
      repairSuggestion: `建议为节点 ${displayMissingNodeId} 补一个 Display，或者把它接到现有展示链路，这样执行结果就能被直接看到。`,
      affectedNodeIds: [displayMissingNodeId],
      suggestedOperations: [
        { type: 'focus_nodes' as const, nodeIds: [displayMissingNodeId] },
      ],
      requiresConfirmation: false,
    }
  }

  if (disconnectedNodeIds.length > 0) {
    return {
      summary: '我发现当前画布里有未连线节点。',
      phenomenon: `现象上看，当前至少有 ${disconnectedNodeIds.length} 个节点没有接入主链。`,
      rootCause: '根因更像是结构断裂，而不是节点本身配置错误。',
      repairSuggestion: '建议先检查这些孤立节点是不是临时草稿；如果不是，就需要把它们重新接回主链。',
      affectedNodeIds: disconnectedNodeIds,
      suggestedOperations: [
        { type: 'focus_nodes' as const, nodeIds: disconnectedNodeIds },
      ],
      requiresConfirmation: false,
    }
  }

  if (selectedNodeId) {
    return {
      summary: '我先围绕你当前选中的节点给出一版检查结论。',
      phenomenon: `现象上看，你当前更关注节点 ${selectedNodeId} 附近的行为。`,
      rootCause: '目前没有明确运行失败证据，所以更像是局部理解或配置确认需求。',
      repairSuggestion: '建议先让我解释这个节点在整条链里的角色，再决定是否继续修改。',
      affectedNodeIds: [selectedNodeId],
      suggestedOperations: [
        { type: 'focus_nodes' as const, nodeIds: [selectedNodeId] },
      ],
      requiresConfirmation: false,
    }
  }

  return {
    summary: '当前没有明显报错，我先从整体结构给出诊断。',
    phenomenon: `现象上看，当前画布共有 ${canvasSummary.nodeCount} 个节点，用户问题是：“${userMessage.trim()}”。`,
    rootCause: '目前没有单点失败证据，更像是用户在确认整体结构、执行路径或下一步方向。',
    repairSuggestion: '建议先解释当前工作流主链，再根据你最关心的节点继续细化。',
    affectedNodeIds: [],
    suggestedOperations: undefined,
    requiresConfirmation: false,
  }
}
