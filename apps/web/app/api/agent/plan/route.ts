/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/nanoid, @/lib/validations/agent，与 Agent 常量/类型
 * [OUTPUT]: 对外提供 POST /api/agent/plan，返回严格结构化的 AgentPlan
 * [POS]: api/agent 的首个 planner 端点，为右侧 Agent 面板提供稳定提案，不直接改动左侧画布
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { apiError, apiOk, handleApiError, withBodyLimit } from '@/lib/api/response'
import { AGENT_MAX_AUTO_OPERATIONS } from '@/lib/agent/constants'
import { nanoid } from '@/lib/nanoid'
import { agentPlanRequestSchema, agentPlanSchema } from '@/lib/validations/agent'
import type {
  AgentPlan,
  AgentPlanIntent,
  AgentPlanRequest,
  CanvasSummary,
  CanvasSummaryNode,
  WorkflowOperation,
} from '@/lib/agent/types'

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

    const input = agentPlanRequestSchema.parse(body)
    const plan = buildPlannerResponse(input as AgentPlanRequest)
    const parsedPlan = agentPlanSchema.parse(plan)

    return apiOk({ plan: parsedPlan })
  } catch (error) {
    return handleApiError(error)
  }
}

function buildPlannerResponse(input: AgentPlanRequest): AgentPlan {
  const goal = input.userMessage.trim()
  const normalized = goal.toLowerCase()
  const canvas = input.canvasSummary
  const inferredMode = inferMode(input, normalized)
  const intent = inferIntent(normalized, canvas, inferredMode)
  const operations =
    inferredMode === 'diagnose'
      ? buildDiagnoseOperations(canvas)
      : canvas.nodeCount === 0
        ? buildCreationOperations(normalized)
        : buildIncrementalOperations(normalized, canvas, intent)

  const reasons = buildReasons(normalized, canvas, inferredMode, operations, intent)
  const requiresConfirmation =
    operations.length > AGENT_MAX_AUTO_OPERATIONS ||
    operations.some((operation) =>
      operation.type === 'insert_between' ||
      operation.type === 'replace_node' ||
      operation.type === 'duplicate_node_branch' ||
      operation.type === 'batch_update_node_data' ||
      operation.type === 'remove_node' ||
      operation.type === 'request_prompt_confirmation' ||
      operation.type === 'run_workflow',
    )

  return {
    id: `plan_${nanoid()}`,
    goal,
    mode: inferredMode,
    intent,
    summary: buildSummary(normalized, canvas, inferredMode, operations),
    reasons,
    requiresConfirmation,
    operations,
    promptConfirmation: operations.find(
      (operation): operation is Extract<WorkflowOperation, { type: 'request_prompt_confirmation' }> =>
        operation.type === 'request_prompt_confirmation',
    )?.payload,
  }
}

function inferMode(input: AgentPlanRequest, normalized: string): AgentPlan['mode'] {
  if (normalized.includes('为什么') || normalized.includes('诊断') || normalized.includes('报错')) {
    return 'diagnose'
  }

  if (normalized.includes('修复') || normalized.includes('补救')) {
    return 'repair'
  }

  if (normalized.includes('优化') || normalized.includes('省钱') || normalized.includes('更快')) {
    return 'optimize'
  }

  if (input.canvasSummary.nodeCount === 0) {
    return 'create'
  }

  if (normalized.includes('模板')) {
    return 'template'
  }

  if (normalized.includes('继续') || normalized.includes('延伸') || normalized.includes('追加分支')) {
    return 'extend'
  }

  if (normalized.includes('新建') || normalized.includes('搭建') || normalized.includes('创建')) {
    return 'create'
  }

  return input.mode === 'create' && input.canvasSummary.nodeCount > 0 ? 'update' : input.mode
}

function inferIntent(
  normalized: string,
  canvas: CanvasSummary,
  mode: AgentPlan['mode'],
): AgentPlanIntent {
  if (mode === 'extend' && canvas.latestSuccessfulAsset) {
    return 'add_branch'
  }

  if (mode === 'create' || canvas.nodeCount === 0) {
    return 'create_workflow'
  }

  if (mode === 'repair' || normalized.includes('修复') || normalized.includes('跑不通')) {
    return 'repair_flow'
  }

  if (mode === 'optimize') {
    return normalized.includes('快') ? 'optimize_speed' : 'optimize_cost'
  }

  if (normalized.includes('拆') && normalized.includes('步')) {
    return 'split_step'
  }

  if (normalized.includes('换成') || normalized.includes('替换模型') || normalized.includes('更便宜的模型')) {
    return 'replace_model'
  }

  if (
    normalized.includes('4个变体') ||
    normalized.includes('四个变体') ||
    normalized.includes('多个变体') ||
    normalized.includes('输出改成')
  ) {
    return 'change_output_count'
  }

  if (normalized.includes('分支') || normalized.includes('变体支线')) {
    return 'add_branch'
  }

  return 'add_step'
}

function buildCreationOperations(normalized: string): WorkflowOperation[] {
  if (normalized.includes('视频')) {
    return [
      { type: 'add_node', nodeId: 'draft-text-input', nodeType: 'text-input' },
      { type: 'add_node', nodeId: 'draft-video-gen', nodeType: 'video-gen' },
      { type: 'add_node', nodeId: 'draft-display', nodeType: 'display' },
      {
        type: 'connect',
        source: 'draft-text-input',
        sourceHandle: 'text-out',
        target: 'draft-video-gen',
        targetHandle: 'prompt-in',
      },
      {
        type: 'connect',
        source: 'draft-video-gen',
        sourceHandle: 'video-out',
        target: 'draft-display',
        targetHandle: 'content-in',
      },
    ]
  }

  if (normalized.includes('音频') || normalized.includes('配音') || normalized.includes('语音')) {
    return [
      { type: 'add_node', nodeId: 'draft-text-input', nodeType: 'text-input' },
      { type: 'add_node', nodeId: 'draft-audio-gen', nodeType: 'audio-gen' },
      { type: 'add_node', nodeId: 'draft-display', nodeType: 'display' },
      {
        type: 'connect',
        source: 'draft-text-input',
        sourceHandle: 'text-out',
        target: 'draft-audio-gen',
        targetHandle: 'text-in',
      },
      {
        type: 'connect',
        source: 'draft-audio-gen',
        sourceHandle: 'audio-out',
        target: 'draft-display',
        targetHandle: 'content-in',
      },
    ]
  }

  if (normalized.includes('图') || normalized.includes('海报') || normalized.includes('图片')) {
    return [
      { type: 'add_node', nodeId: 'draft-text-input', nodeType: 'text-input' },
      { type: 'add_node', nodeId: 'draft-image-gen', nodeType: 'image-gen' },
      { type: 'add_node', nodeId: 'draft-display', nodeType: 'display' },
      {
        type: 'connect',
        source: 'draft-text-input',
        sourceHandle: 'text-out',
        target: 'draft-image-gen',
        targetHandle: 'prompt-in',
      },
      {
        type: 'connect',
        source: 'draft-image-gen',
        sourceHandle: 'image-out',
        target: 'draft-display',
        targetHandle: 'content-in',
      },
      {
        type: 'request_prompt_confirmation',
        payload: {
          id: `prompt_${nanoid()}`,
          originalIntent: normalized,
          visualProposal: '先给出一版清晰画面方向，再决定是否直接写入图片生成节点。',
          executionPrompt: '请基于用户意图生成一版清晰、可执行、构图明确的图像生成提示词。',
          targetNodeId: 'draft-text-input',
          styleOptions: [
            { id: 'realistic', label: '更写实', promptDelta: '强调真实摄影质感、自然光与镜头语言' },
            { id: 'anime', label: '更动漫', promptDelta: '强调动漫分镜、线稿与色彩层次' },
            { id: 'commercial', label: '更商业', promptDelta: '强调广告级构图、主体清晰与品牌化质感' },
          ],
        },
      },
    ]
  }

  return [
    { type: 'add_node', nodeId: 'draft-text-input', nodeType: 'text-input' },
    { type: 'add_node', nodeId: 'draft-llm', nodeType: 'llm' },
    { type: 'add_node', nodeId: 'draft-display', nodeType: 'display' },
    {
      type: 'connect',
      source: 'draft-text-input',
      sourceHandle: 'text-out',
      target: 'draft-llm',
      targetHandle: 'prompt-in',
    },
    {
      type: 'connect',
      source: 'draft-llm',
      sourceHandle: 'text-out',
      target: 'draft-display',
      targetHandle: 'content-in',
    },
  ]
}

function buildIncrementalOperations(
  normalized: string,
  canvas: CanvasSummary,
  intent: AgentPlanIntent,
): WorkflowOperation[] {
  if (canvas.latestSuccessfulAsset && shouldBuildFollowUpFromResult(normalized, canvas)) {
    return buildResultFollowUpOperations(normalized, canvas)
  }

  const selectedNodeId = canvas.selectedNodeId ?? canvas.nodes[0]?.id
  const selectedNode = selectedNodeId
    ? canvas.nodes.find((node) => node.id === selectedNodeId) ?? null
    : null

  if (normalized.includes('补') && canvas.displayMissingForNodeIds.length > 0) {
    return [
      { type: 'add_node', nodeId: 'draft-display', nodeType: 'display' },
      {
        type: 'connect',
        source: canvas.displayMissingForNodeIds[0] as string,
        target: 'draft-display',
        targetHandle: 'content-in',
      },
    ]
  }

  if ((normalized.includes('优化') || normalized.includes('整理')) && canvas.disconnectedNodeIds.length > 0) {
    return [{ type: 'focus_nodes', nodeIds: canvas.disconnectedNodeIds.slice(0, 3) }]
  }

  if (intent === 'add_step') {
    const insertTarget = selectedNode ?? findFirstNodeByType(canvas.nodes, 'image-gen') ?? canvas.nodes[0]
    const upstreamNode = insertTarget ? findSingleUpstreamNode(canvas, insertTarget.id) : null

    if (insertTarget && upstreamNode) {
      return [
        {
          type: 'insert_between',
          source: upstreamNode.id,
          target: insertTarget.id,
          sourceHandle: guessPrimaryOutputHandle(upstreamNode),
          targetHandle: guessPrimaryInputHandle(insertTarget),
          nodeId: 'draft-style-analyzer',
          nodeType: 'llm',
          initialData: {
            label: 'Style Analyzer',
            config: {
              text: '请先分析风格方向，再把结果传给下游生成节点。',
            },
          },
        },
        {
          type: 'annotate_change',
          nodeId: insertTarget.id,
          note: '在主生成前补入风格分析步骤，保持原主链走向不变。',
        },
        {
          type: 'focus_nodes',
          nodeIds: [upstreamNode.id, insertTarget.id],
        },
      ]
    }
  }

  if (intent === 'split_step' && selectedNode) {
    return [
      {
        type: 'insert_between',
        source: selectedNode.id,
        target: findFirstDownstreamNode(canvas, selectedNode.id)?.id ?? selectedNode.id,
        sourceHandle: guessPrimaryOutputHandle(selectedNode),
        targetHandle: guessPrimaryInputHandle(findFirstDownstreamNode(canvas, selectedNode.id) ?? selectedNode),
        nodeId: 'draft-secondary-llm',
        nodeType: 'llm',
        initialData: {
          label: 'Body Writer',
          config: {
            text: '把当前单步产出拆成标题与正文两步。',
          },
        },
      },
      {
        type: 'relabel_node',
        nodeId: selectedNode.id,
        label: 'Title Writer',
      },
      {
        type: 'annotate_change',
        nodeId: selectedNode.id,
        note: '原单步已拆成更细的两步，方便后续单独调参。',
      },
    ]
  }

  if (intent === 'replace_model') {
    const targetNode = selectedNode ?? findFirstAIGenNode(canvas.nodes)
    if (targetNode) {
      return [
        {
          type: 'replace_node',
          nodeId: targetNode.id,
          nextNodeType: targetNode.type,
          configPatch: buildCheaperModelPatch(targetNode),
          preserveConfigKeys: ['aspectRatio', 'size', 'mode', 'duration', 'showPreview'],
        },
        {
          type: 'annotate_change',
          nodeId: targetNode.id,
          note: '替换为更便宜的模型组合，同时保留主链结构与关键配置。',
        },
        {
          type: 'focus_nodes',
          nodeIds: [targetNode.id],
        },
      ]
    }
  }

  if (intent === 'change_output_count') {
    const targetNode = selectedNode ?? findFirstNodeByType(canvas.nodes, 'image-gen')
    if (targetNode) {
      return [
        {
          type: 'batch_update_node_data',
          nodeIds: [targetNode.id],
          patch: {
            config: {
              count: 4,
            },
          },
        },
        {
          type: 'relabel_node',
          nodeId: targetNode.id,
          label: `${targetNode.label} x4`,
        },
        {
          type: 'annotate_change',
          nodeId: targetNode.id,
          note: '输出规格已调整为 4 个变体。',
        },
        {
          type: 'focus_nodes',
          nodeIds: [targetNode.id],
        },
      ]
    }
  }

  if (intent === 'add_branch') {
    const targetNode = selectedNode ?? findFirstNodeByType(canvas.nodes, 'image-gen')
    if (targetNode) {
      return [
        {
          type: 'duplicate_node_branch',
          nodeId: targetNode.id,
          count: 2,
          strategy: 'style-variants',
        },
        {
          type: 'annotate_change',
          nodeId: targetNode.id,
          note: '基于当前节点复制出变体分支，保留原主链作为基线。',
        },
        {
          type: 'focus_nodes',
          nodeIds: [targetNode.id],
        },
      ]
    }
  }

  if (selectedNodeId && (normalized.includes('提示词') || normalized.includes('prompt'))) {
    return [
      {
        type: 'update_node_data',
        nodeId: selectedNodeId,
        patch: {
          promptDraft: '根据用户新目标生成一版更新后的提示词草稿',
        },
      },
    ]
  }

  if (normalized.includes('运行') || normalized.includes('执行')) {
    return [{ type: 'run_workflow', scope: 'all' }]
  }

  return selectedNodeId ? [{ type: 'focus_nodes', nodeIds: [selectedNodeId] }] : []
}

function buildDiagnoseOperations(canvas: CanvasSummary): WorkflowOperation[] {
  if (canvas.latestExecution?.failedNodeId) {
    return [{ type: 'focus_nodes', nodeIds: [canvas.latestExecution.failedNodeId] }]
  }

  if (canvas.disconnectedNodeIds.length > 0) {
    return [{ type: 'focus_nodes', nodeIds: canvas.disconnectedNodeIds.slice(0, 3) }]
  }

  return canvas.nodes[0]
    ? [{ type: 'focus_nodes', nodeIds: [canvas.nodes[0].id] }]
    : []
}

function buildSummary(
  normalized: string,
  canvas: CanvasSummary,
  mode: AgentPlan['mode'],
  operations: WorkflowOperation[],
) {
  if (mode === 'diagnose') {
    if (canvas.latestExecution?.failedReason) {
      return `我会先围绕最近一次失败继续定位：${canvas.latestExecution.failedReason}`
    }
    return '我会先聚焦可能有问题的节点，再给出下一步修复建议。'
  }

  if (canvas.nodeCount === 0) {
    if (normalized.includes('图') || normalized.includes('图片') || normalized.includes('海报')) {
      return '我准备先搭出“输入提示词 -> 图片生成 -> 结果展示”的最小工作流提案。'
    }

    if (normalized.includes('视频')) {
      return '我准备先搭出“输入提示词 -> 视频生成 -> 结果展示”的最小工作流提案。'
    }

    if (normalized.includes('音频') || normalized.includes('语音')) {
      return '我准备先搭出“文本输入 -> 音频生成 -> 结果展示”的最小工作流提案。'
    }

    return '我准备先搭出“文本输入 -> LLM -> 结果展示”的最小工作流提案。'
  }

  if (
    (mode === 'extend' || shouldBuildFollowUpFromResult(normalized, canvas)) &&
    canvas.latestSuccessfulAsset &&
    operations.length > 0
  ) {
    return `我会基于最近产出的${assetKindLabel(canvas.latestSuccessfulAsset.kind)}结果继续往下长一条新分支，而不是改坏原主链。`
  }

  if (operations[0]?.type === 'focus_nodes') {
    return '我先把注意力聚焦到最相关的节点范围，再给你一个可检查的修改方向。'
  }

  if (operations[0]?.type === 'update_node_data') {
    return '我准备先做一个小范围配置修改提案，不直接动整张图。'
  }

  if (operations[0]?.type === 'insert_between') {
    return '我会在现有主链中间补一小步，而不是推翻重建整条流程。'
  }

  if (operations[0]?.type === 'replace_node') {
    return '我会只替换目标节点的模型配置，尽量保留上下游连接和原链路。'
  }

  if (operations[0]?.type === 'batch_update_node_data') {
    return '我准备做一次受控的小范围批量调参，并把改动粒度保持在可撤销范围内。'
  }

  if (operations[0]?.type === 'run_workflow') {
    return '我会先把执行动作作为待确认提案，而不是直接替你运行。'
  }

  return '我准备在当前画板基础上补一小步结构，让链路更完整。'
}

function buildReasons(
  normalized: string,
  canvas: CanvasSummary,
  mode: AgentPlan['mode'],
  operations: WorkflowOperation[],
  intent: AgentPlanIntent,
) {
  const reasons = []

  if (canvas.nodeCount === 0) {
    reasons.push('当前画板还是空白，适合先给出最小可运行结构。')
  } else {
    reasons.push(`当前画板已有 ${canvas.nodeCount} 个节点，先做局部提案更安全。`)
  }

  if (canvas.displayMissingForNodeIds.length > 0) {
    reasons.push(`我发现有 ${canvas.displayMissingForNodeIds.length} 个 AI 节点还没有明显结果承接。`)
  }

  if (canvas.disconnectedNodeIds.length > 0) {
    reasons.push(`当前有 ${canvas.disconnectedNodeIds.length} 个节点处于未连线状态，后续需要重点确认。`)
  }

  if (canvas.latestSuccessfulAsset) {
    reasons.push(`最近一次成功结果已经沉淀为${assetKindLabel(canvas.latestSuccessfulAsset.kind)}资产，适合拿来继续扩展。`)
  }

  if (mode === 'diagnose') {
    reasons.push('你当前的目标更像是在定位问题，所以我先收缩到问题节点而不是直接改图。')
  }

  if (intent === 'add_step' || intent === 'split_step') {
    reasons.push('这次更适合在现有主链上增量插入步骤，而不是整体重建。')
  }

  if (intent === 'replace_model') {
    reasons.push('你的目标是替换模型而不是改结构，所以我优先保留上下游关系。')
  }

  if (intent === 'change_output_count') {
    reasons.push('这属于输出规格改造，优先走局部参数 patch 更稳。')
  }

  if (
    normalized.includes('图') ||
    normalized.includes('图片') ||
    normalized.includes('海报')
  ) {
    reasons.push('这类请求通常先需要明确提示词方向，所以我把 prompt 确认保留成显式步骤。')
  }

  if (operations.length === 0) {
    reasons.push('当前上下文不足以安全生成具体操作，我先给出聚焦提案。')
  }

  return reasons.slice(0, 3)
}

function assetKindLabel(kind: 'image' | 'video' | 'audio' | 'text') {
  switch (kind) {
    case 'image':
      return '图片'
    case 'video':
      return '视频'
    case 'audio':
      return '音频'
    case 'text':
      return '文本'
  }
}

function shouldBuildFollowUpFromResult(normalized: string, canvas: CanvasSummary) {
  if (!canvas.latestSuccessfulAsset) return false

  return (
    normalized.includes('基于结果继续') ||
    normalized.includes('基于这张') ||
    normalized.includes('继续扩展') ||
    normalized.includes('继续做下去') ||
    normalized.includes('下一步') ||
    normalized.includes('补视频') ||
    normalized.includes('加视频') ||
    normalized.includes('补标题') ||
    normalized.includes('加标题') ||
    normalized.includes('正文') ||
    normalized.includes('文案变体')
  )
}

function buildResultFollowUpOperations(
  normalized: string,
  canvas: CanvasSummary,
): WorkflowOperation[] {
  const asset = canvas.latestSuccessfulAsset
  if (!asset) return []

  if (
    asset.kind === 'image' &&
    (normalized.includes('视频') || normalized.includes('动起来') || normalized.includes('动态'))
  ) {
    return [
      {
        type: 'add_node',
        nodeId: 'draft-followup-video',
        nodeType: 'video-gen',
        initialData: {
          label: 'Video Follow-up',
          config: {
            mode: 'image-to-video',
          },
        },
      },
      {
        type: 'add_node',
        nodeId: 'draft-followup-display',
        nodeType: 'display',
        initialData: {
          label: 'Video Preview',
        },
      },
      {
        type: 'connect',
        source: asset.sourceNodeId,
        sourceHandle: 'image-out',
        target: 'draft-followup-video',
        targetHandle: 'image-in',
      },
      {
        type: 'connect',
        source: 'draft-followup-video',
        sourceHandle: 'video-out',
        target: 'draft-followup-display',
        targetHandle: 'content-in',
      },
      {
        type: 'annotate_change',
        nodeId: asset.sourceNodeId,
        note: '基于最近图片结果新增了一条补视频分支，原主链保持不动。',
      },
      {
        type: 'focus_nodes',
        nodeIds: [asset.sourceNodeId, 'draft-followup-video', 'draft-followup-display'],
      },
    ]
  }

  if (
    asset.kind === 'image' &&
    (normalized.includes('标题') || normalized.includes('正文') || normalized.includes('文案'))
  ) {
    return [
      {
        type: 'add_node',
        nodeId: 'draft-followup-copy',
        nodeType: 'llm',
        initialData: {
          label: 'Copy Follow-up',
          config: {
            text:
              normalized.includes('正文')
                ? '基于最新图片结果生成一版正文文案。'
                : normalized.includes('标题')
                  ? '基于最新图片结果生成 3 个标题变体。'
                  : '基于最新图片结果生成标题和正文文案变体。',
          },
        },
      },
      {
        type: 'add_node',
        nodeId: 'draft-followup-display',
        nodeType: 'display',
        initialData: {
          label: 'Copy Preview',
        },
      },
      {
        type: 'connect',
        source: asset.sourceNodeId,
        sourceHandle: 'image-out',
        target: 'draft-followup-copy',
        targetHandle: 'image-in',
      },
      {
        type: 'connect',
        source: 'draft-followup-copy',
        sourceHandle: 'text-out',
        target: 'draft-followup-display',
        targetHandle: 'content-in',
      },
      {
        type: 'annotate_change',
        nodeId: asset.sourceNodeId,
        note: '基于最近图片结果补出了一条文案续写分支，方便继续做标题/正文承接。',
      },
      {
        type: 'focus_nodes',
        nodeIds: [asset.sourceNodeId, 'draft-followup-copy', 'draft-followup-display'],
      },
    ]
  }

  if (asset.kind === 'text') {
    return [
      {
        type: 'duplicate_node_branch',
        nodeId: asset.sourceNodeId,
        count: 2,
        strategy: 'style-variants',
      },
      {
        type: 'annotate_change',
        nodeId: asset.sourceNodeId,
        note: '基于最近文本结果复制出变体支线，方便继续扩写或改写。',
      },
      {
        type: 'focus_nodes',
        nodeIds: [asset.sourceNodeId],
      },
    ]
  }

  return [
    {
      type: 'focus_nodes',
      nodeIds: [asset.sourceNodeId],
    },
  ]
}

function findFirstNodeByType(nodes: CanvasSummaryNode[], type: string) {
  return nodes.find((node) => node.type === type) ?? null
}

function findFirstAIGenNode(nodes: CanvasSummaryNode[]) {
  return nodes.find((node) => ['image-gen', 'video-gen', 'audio-gen', 'llm'].includes(node.type)) ?? null
}

function findSingleUpstreamNode(canvas: CanvasSummary, targetId: string) {
  const targetNode = canvas.nodes.find((node) => node.id === targetId)
  if (!targetNode) return null

  const index = canvas.nodes.findIndex((node) => node.id === targetId)
  if (index <= 0) return null

  return canvas.nodes[index - 1] ?? null
}

function findFirstDownstreamNode(canvas: CanvasSummary, sourceId: string) {
  const index = canvas.nodes.findIndex((node) => node.id === sourceId)
  if (index < 0 || index >= canvas.nodes.length - 1) return null
  return canvas.nodes[index + 1] ?? null
}

function guessPrimaryInputHandle(node: CanvasSummaryNode | null) {
  return node?.inputs[0]?.id
}

function guessPrimaryOutputHandle(node: CanvasSummaryNode | null) {
  return node?.outputs[0]?.id
}

function buildCheaperModelPatch(node: CanvasSummaryNode) {
  const config = node.configSummary
  const currentProvider = typeof config.platformProvider === 'string' ? config.platformProvider : undefined

  if (node.type === 'image-gen') {
    return {
      platformProvider: currentProvider === 'openrouter' ? 'openrouter' : 'openrouter',
      platformModel: 'google/gemini-2.5-flash-image-preview',
    }
  }

  if (node.type === 'video-gen') {
    return {
      platformProvider: 'kling',
      platformModel: 'kling-v1-6',
    }
  }

  if (node.type === 'llm') {
    return {
      platformProvider: 'openrouter',
      platformModel: 'openai/gpt-4o-mini',
    }
  }

  return {}
}
