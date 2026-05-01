/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/validations/agent，与 Agent 常量/类型
 * [OUTPUT]: 对外提供 POST /api/agent/optimize，返回带标准优化结构的 AgentDiagnosis 或 AgentPlan
 * [POS]: api/agent 的优化端点，把成本/速度/结构问题翻译成“问题 -> 原因 -> 提案 -> 风险”的优化建议
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { apiError, apiOk, handleApiError, withBodyLimit } from '@/lib/api/response'
import { getDefaultPlatformRuntimeModel } from '@/lib/platform-runtime'
import { agentDiagnosisRequestSchema } from '@/lib/validations/agent'
import type { AgentDiagnosis, WorkflowOperation } from '@/lib/agent/types'

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
    return apiOk({ diagnosis: buildOptimizationDiagnosis(input) })
  } catch (error) {
    return handleApiError(error)
  }
}

function buildOptimizationDiagnosis(
  input: ReturnType<typeof agentDiagnosisRequestSchema.parse>,
): AgentDiagnosis {
  const { canvasSummary, userMessage } = input
  const signals = canvasSummary.optimizationSignals

  if (!signals) {
    return {
      summary: '当前还没有足够的优化线索，我建议先跑一次工作流再来优化。',
      phenomenon: '现象上看，当前画布缺少足够的模型、结构或执行线索。',
      rootCause: '根因是优化分析依赖的上下文还不完整。',
      repairSuggestion: '建议先执行一次，或者先把主链搭完整后再让我给优化提案。',
      affectedNodeIds: [],
      requiresConfirmation: false,
      dimension: 'runtime',
      riskSummary: '当前不适合直接改图。',
      optimizationProposal: {
        issue: '优化线索不足',
        cause: '缺少足够的主链与执行信息',
        proposal: '先补完整主链或执行一次，再重新请求优化',
        risk: '现在贸然修改容易变成拍脑袋优化',
      },
    }
  }

  const normalized = userMessage.toLowerCase()
  if (normalized.includes('省钱') || normalized.includes('成本') || signals.estimatedCostLevel === 'high') {
    return buildCostDiagnosis(signals)
  }

  if (normalized.includes('慢') || normalized.includes('更快') || signals.estimatedLatencyLevel === 'high') {
    return buildSpeedDiagnosis(signals)
  }

  return buildStructureDiagnosis(signals)
}

function buildCostDiagnosis(signals: NonNullable<ReturnType<typeof agentDiagnosisRequestSchema.parse>['canvasSummary']['optimizationSignals']>): AgentDiagnosis {
  const targetNodeIds = signals.expensiveModelNodeIds.slice(0, 3)
  const firstNodeId = targetNodeIds[0]
  const suggestedOperations: WorkflowOperation[] = []

  if (firstNodeId) {
    const cheaperImageModel = getDefaultPlatformRuntimeModel('image')
    const cheaperTextModel = getDefaultPlatformRuntimeModel('text')
    suggestedOperations.push({
      type: 'replace_node',
      nodeId: firstNodeId,
      nextNodeType: firstNodeId.startsWith('video') ? 'video-gen' : firstNodeId.startsWith('image') ? 'image-gen' : 'llm',
      configPatch:
        firstNodeId.startsWith('video')
          ? { platformProvider: 'kling', platformModel: 'kling-v1-6' }
          : firstNodeId.startsWith('image')
            ? { platformProvider: cheaperImageModel.supplierId, platformModel: cheaperImageModel.modelId }
            : { platformProvider: cheaperTextModel.supplierId, platformModel: cheaperTextModel.modelId },
      preserveConfigKeys: ['aspectRatio', 'size', 'duration', 'showPreview', 'text', 'maxTokens'],
    })
  }

  if (signals.previewEnabledNodeIds.length > 0) {
    suggestedOperations.push({
      type: 'batch_update_node_data',
      nodeIds: signals.previewEnabledNodeIds,
      patch: {
        config: {
          showPreview: false,
        },
      },
    })
  }

  return {
    summary: '我发现这条链还有明显的降本空间。',
    phenomenon: `现象上看，当前有 ${signals.expensiveModelNodeIds.length} 个高成本模型节点，且预览开关也可能在放大测试成本。`,
    rootCause: '根因是主链里仍在使用偏贵模型，且部分节点保留了不必要的高频预览配置。',
    repairSuggestion: '建议先把最贵的节点替换成更便宜的同类模型，并关闭不必要预览，再观察结果质量是否还能接受。',
    affectedNodeIds: [...targetNodeIds, ...signals.previewEnabledNodeIds].slice(0, 4),
    suggestedOperations,
    requiresConfirmation: true,
    dimension: 'cost',
    riskSummary: '降本后可能出现质量下滑，需要你确认是否接受。',
    optimizationProposal: {
      issue: '模型成本偏高',
      cause: '当前主链仍在使用旗舰或 premium 模型，且伴随额外预览开销',
      proposal: '先替换最贵节点为便宜一档模型，同时关闭预览开关',
      risk: '图像或文本质量可能下降，需要用你的 API Key 做一轮真实对比',
    },
  }
}

function buildSpeedDiagnosis(signals: NonNullable<ReturnType<typeof agentDiagnosisRequestSchema.parse>['canvasSummary']['optimizationSignals']>): AgentDiagnosis {
  const slowNodeId = signals.slowNodeIds[0]
  const suggestedOperations: WorkflowOperation[] = []

  if (slowNodeId) {
    suggestedOperations.push({
      type: 'duplicate_node_branch',
      nodeId: slowNodeId,
      count: 2,
      strategy: 'parallel-variants',
    })
    suggestedOperations.push({
      type: 'annotate_change',
      nodeId: slowNodeId,
      note: '建议把慢步骤拆成并行分支，缩短单次等待时间并提高试错效率。',
    })
  }

  return {
    summary: '这条链的主要瓶颈在慢步骤和串行主链上。',
    phenomenon: `现象上看，当前至少有 ${signals.slowNodeIds.length} 个慢节点，且 AI 节点数量已经达到 ${signals.aiNodeCount} 个。`,
    rootCause: '根因是高耗时节点仍在串行主链里执行，导致整条链必须等待最慢步骤收口。',
    repairSuggestion: '建议把慢步骤改成并行变体或拆成更小步骤，减少整条链被单点阻塞的情况。',
    affectedNodeIds: signals.slowNodeIds.slice(0, 3),
    suggestedOperations,
    requiresConfirmation: true,
    dimension: 'speed',
    riskSummary: '并行化会增加结构复杂度，且可能带来额外成本。',
    optimizationProposal: {
      issue: '流程太慢',
      cause: '视频/重模型节点处于串行主链，整条链被最慢节点拖住',
      proposal: '优先对慢节点做并行分支或拆步处理',
      risk: '结构会更复杂，必要时需要补 merge 或 display 承接',
    },
  }
}

function buildStructureDiagnosis(signals: NonNullable<ReturnType<typeof agentDiagnosisRequestSchema.parse>['canvasSummary']['optimizationSignals']>): AgentDiagnosis {
  const suggestedOperations: WorkflowOperation[] = []

  if (signals.missingDisplayNodeIds[0]) {
    suggestedOperations.push({
      type: 'add_node',
      nodeId: 'draft-optimized-display',
      nodeType: 'display',
    })
    suggestedOperations.push({
      type: 'connect',
      source: signals.missingDisplayNodeIds[0],
      target: 'draft-optimized-display',
      targetHandle: 'content-in',
    })
  }

  if (signals.redundantNodeGroups[0]) {
    suggestedOperations.push({
      type: 'focus_nodes',
      nodeIds: signals.redundantNodeGroups[0].nodeIds,
    })
  }

  return {
    summary: '这条链的结构还有整理空间，不一定要先动模型。',
    phenomenon: `现象上看，当前存在 ${signals.redundantNodeGroups.length} 组重复节点线索，另有 ${signals.missingDisplayNodeIds.length} 个结果出口不清晰的节点。`,
    rootCause: '根因是结构冗余和结果承接不完整，让你后续难以判断哪一步真正有效。',
    repairSuggestion: '建议先补齐结果出口，再聚焦重复节点判断哪些可以合并或改成 merge/branch 结构。',
    affectedNodeIds: [
      ...signals.missingDisplayNodeIds,
      ...(signals.redundantNodeGroups[0]?.nodeIds ?? []),
    ].slice(0, 4),
    suggestedOperations,
    requiresConfirmation: true,
    dimension: 'structure',
    riskSummary: '结构整理会改变主链可读性，需要确认是否采用。',
    optimizationProposal: {
      issue: '结构冗余与出口不清晰',
      cause: '重复节点和缺少 Display 让主链难以维护和观察',
      proposal: '优先补 Display，再整理重复节点或并行支线',
      risk: '如果你本来在保留实验草稿，过早整理可能影响试验自由度',
    },
  }
}
