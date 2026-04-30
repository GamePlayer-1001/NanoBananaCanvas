/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/validations/agent
 * [OUTPUT]: 对外提供 POST /api/agent/explain，返回当前工作流或选中节点的自然语言解释
 * [POS]: api/agent 的解释端点，把画布结构与模板上下文翻译成用户可读说明
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { apiError, apiOk, handleApiError, withBodyLimit } from '@/lib/api/response'
import { agentExplainRequestSchema } from '@/lib/validations/agent'

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

    const input = agentExplainRequestSchema.parse(body)
    const answer = buildExplanation(input)
    return apiOk({ answer })
  } catch (error) {
    return handleApiError(error)
  }
}

function buildExplanation(
  input: ReturnType<typeof agentExplainRequestSchema.parse>,
) {
  const { canvasSummary } = input
  const selectedNode = canvasSummary.nodes.find(
    (node) => node.id === canvasSummary.selectedNodeId,
  )
  const template = canvasSummary.template
  const templateContext = canvasSummary.templateContext
  const latestTemplateChange = canvasSummary.auditTrail?.at(-1)

  if (template && !selectedNode) {
    const direction =
      templateContext?.adaptationDirection ??
      latestTemplateChange?.adaptationGoal ??
      '当前还没有额外行业化改造'

    return [
      `当前这张画板基于模板“${template.name}”创建。`,
      `它的核心目标是${template.goal}，更适合 ${template.targetAudience.join('、') || '创作者团队'}，典型行业包括 ${template.applicableIndustries.join('、') || '通用内容生产'}。`,
      `目前的改造方向是：${direction}。`,
      `从结构上看，当前画布保留了模板主链，并允许继续围绕 prompt、模型和输出规格做增量调整。`,
    ].join('')
  }

  if (selectedNode) {
    const selectionContext = canvasSummary.selectionContext
    const inputLabels =
      selectionContext?.inputs?.map((item) => item.label).join('、') ||
      selectedNode.inputs.map((item) => item.label).join('、') ||
      '上游输入'
    const outputLabels =
      selectionContext?.outputs?.map((item) => item.label).join('、') ||
      selectedNode.outputs.map((item) => item.label).join('、') ||
      '结果'
    const keyConfigEntries = Object.entries(selectionContext?.keyConfig ?? {})
      .slice(0, 3)
      .map(([key, value]) => `${key}=${String(value)}`)
    const keyConfigText =
      keyConfigEntries.length > 0
        ? `当前关键配置主要是 ${keyConfigEntries.join('，')}。`
        : '当前还没有特别突出的关键配置。'
    const resultText = selectionContext?.latestResultSummary
      ? `最近结果上，它已经产出：${selectionContext.latestResultSummary}`
      : '最近结果上，它还没有明显的稳定产出。'
    const executionText = selectionContext?.executionHint
      ? selectionContext.executionHint
      : '执行态上暂时没有额外异常线索。'
    const templateText = template
      ? `它属于模板“${template.name}”当前改造链的一部分。`
      : '它当前主要反映的是这张工作流里的局部职责。'

    return [
      `当前选中的节点是“${selectedNode.label}”。`,
      `它的类型是 ${selectedNode.type}，主要负责接收 ${inputLabels}，再输出 ${outputLabels}。`,
      keyConfigText,
      resultText,
      executionText,
      templateText,
      `从当前画布来看，它处在整条工作流的局部语境里，更适合围绕这个节点继续细化，而不是一次性大改整张图。`,
    ].join('')
  }

  const firstNode = canvasSummary.nodes[0]
  const latestExecution = canvasSummary.latestExecution
  const executionText =
    latestExecution?.status === 'failed'
      ? `最近一次执行失败，主要线索是：${latestExecution.failedReason ?? '未记录错误详情'}。`
      : latestExecution?.status === 'running'
        ? '当前工作流正在执行中。'
        : latestExecution?.status === 'completed'
          ? '最近一次执行已经完成。'
          : '当前还没有明确的执行反馈。'

  return [
    `这张工作流画板当前共有 ${canvasSummary.nodeCount} 个节点、${canvasSummary.edgeCount} 条连线。`,
    firstNode
      ? `主链通常从“${firstNode.label}”这样的起始节点展开，再逐步把输入送到中间处理节点和结果展示节点。`
      : '当前还是空画板，还没有形成可解释的主链。',
    executionText,
  ].join('')
}
