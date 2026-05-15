/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/agent/server-assistant, @/lib/nanoid, @/lib/validations/agent，与 Agent 常量/类型
 * [OUTPUT]: 对外提供 POST /api/agent/plan，返回严格结构化的 AgentPlan
 * [POS]: api/agent 的首个 planner 端点，为右侧 Agent 面板提供稳定提案，不直接改动左侧画布
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { callAgentAssistantJson } from '@/lib/agent/server-assistant'
import { apiError, apiOk, handleApiError, withBodyLimit } from '@/lib/api/response'
import { AGENT_MAX_AUTO_OPERATIONS } from '@/lib/agent/constants'
import {
  buildCreationOperations,
  buildSelectedNodeOptimizationOperations,
  buildSelectedNodePromptOperations,
  inferIntentFromMessage,
  inferModeFromMessage,
  isSafeCreationPlan,
  shouldBuildPromptConfirmation,
  shouldOptimizeSelectedNode,
  shouldPatchSelectedNodePrompt,
} from '@/lib/agent/plan-rules'
import { nanoid } from '@/lib/nanoid'
import { getDefaultPlatformRuntimeModel } from '@/lib/platform-runtime'
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
    const response = await buildPlannerResponse(input as AgentPlanRequest)
    const plan = response.plan
    const parsedPlan = agentPlanSchema.parse(plan)
    const parsedAlternatives = response.alternatives?.map((item) => agentPlanSchema.parse(item))

    return apiOk({ plan: parsedPlan, alternatives: parsedAlternatives })
  } catch (error) {
    return handleApiError(error)
  }
}

async function buildPlannerResponse(input: AgentPlanRequest): Promise<{ plan: AgentPlan; alternatives?: AgentPlan[] }> {
  const goal = input.userMessage.trim()
  const normalized = goal.toLowerCase()
  const canvas = input.canvasSummary
  const workflowReferenceRequest = isWorkflowReferenceRequest(
    normalized,
    input.workflowReference,
  )
  const workflowReferenceSketch = workflowReferenceRequest
    ? await inferWorkflowReferenceSketch(input).catch(() => null)
    : null
  const aiIntent = await inferIntentWithAssistant(input).catch(() => null)
  const workflowKind =
    aiIntent?.workflowKind ?? inferWorkflowKind(goal, input.attachments, input.workflowReference)
  const inferredMode =
    aiIntent?.mode ?? inferModeFromMessage(input.mode, normalized, canvas.nodeCount)
  const intent =
    aiIntent?.intent ?? inferIntentFromMessage(normalized, canvas, inferredMode)
  const operations =
    inferredMode === 'diagnose'
      ? buildDiagnoseOperations(canvas)
      : workflowReferenceRequest && canvas.nodeCount === 0
        ? buildWorkflowReferenceOperations(workflowReferenceSketch)
      : canvas.nodeCount === 0
        ? buildCreationOperations(buildCreationMessage(normalized, workflowKind))
        : buildIncrementalOperations(normalized, canvas, intent)

  const reasons = buildReasons(
    normalized,
    canvas,
    inferredMode,
    operations,
    intent,
    workflowReferenceRequest,
    workflowReferenceSketch,
  )
  const safeCreationPlan = isSafeCreationPlan(inferredMode, canvas.nodeCount, operations)
  const requiresConfirmation =
    !safeCreationPlan &&
    (
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
    )

  const plan: AgentPlan = {
    id: `plan_${nanoid()}`,
    goal,
    mode: inferredMode,
    intent,
    summary:
      aiIntent?.summary?.trim() ||
      buildSummary(
        normalized,
        canvas,
        inferredMode,
        operations,
        workflowReferenceRequest,
        workflowReferenceSketch,
      ),
    reasons: aiIntent?.reasons?.length ? aiIntent.reasons.slice(0, 3) : reasons,
    requiresConfirmation,
    operations,
    promptConfirmation:
      shouldBuildPromptConfirmation(normalized, intent, workflowKind, canvas.nodeCount)
        ? (await buildPromptConfirmationPayload(goal, workflowKind, input.attachments)) ??
          operations.find(
            (operation): operation is Extract<WorkflowOperation, { type: 'request_prompt_confirmation' }> =>
              operation.type === 'request_prompt_confirmation',
          )?.payload
        : undefined,
  }

  const alternatives = buildPlanAlternatives(plan, canvas)

  return {
    plan,
    alternatives,
  }
}

async function inferIntentWithAssistant(input: AgentPlanRequest) {
  return callAgentAssistantJson<{
    mode?: AgentPlan['mode']
    intent?: AgentPlanIntent
    workflowKind?: 'image' | 'image_to_image' | 'video' | 'audio' | 'text'
    summary?: string
    reasons?: string[]
  }>({
    assistantRuntime: input.assistantRuntime,
    prompt: [
      '请根据用户输入和当前工作流上下文，判断这是哪一类 Agent 请求，并只返回 JSON。',
      '可选 mode: create/update/repair/diagnose/optimize/extend/template',
      '可选 intent: create_workflow/adapt_template/add_step/split_step/replace_model/change_output_count/add_branch/repair_flow/optimize_cost/optimize_speed/optimize_structure/explain_flow',
      '可选 workflowKind: image/image_to_image/video/audio/text',
      'JSON 格式：{"mode":"...","intent":"...","workflowKind":"...","summary":"...","reasons":["..."]}',
      `用户输入：${input.userMessage}`,
      `当前节点数：${input.canvasSummary.nodeCount}`,
      `当前是否有成功图片结果：${input.canvasSummary.latestSuccessfulAsset?.kind === 'image' ? '是' : '否'}`,
      `是否附带图片：${input.attachments?.length ? '是' : '否'}`,
      `附图语义：${input.workflowReference ?? 'content_reference'}`,
      `当前模式：${input.mode}`,
    ].join('\n'),
  })
}

async function inferWorkflowReferenceSketch(input: AgentPlanRequest) {
  if (!input.attachments?.length) {
    return null
  }

  return callAgentAssistantJson<{
    workflowKind?: 'image' | 'image_to_image' | 'video' | 'audio' | 'text' | 'mixed'
    nodes?: Array<{
      nodeType: 'text-input' | 'image-input' | 'image-gen' | 'video-gen' | 'audio-gen' | 'llm' | 'display'
      label?: string
    }>
    summary?: string
    notes?: string[]
  }>({
    assistantRuntime: input.assistantRuntime,
    imageUrls: input.attachments.map((item) => item.url),
    prompt: [
      '你正在查看一张工作流参考图，请判断这张图更像哪一类画板工作流，并只返回 JSON。',
      '允许的 nodeType: text-input,image-input,image-gen,video-gen,audio-gen,llm,display',
      '允许的 workflowKind: image,image_to_image,video,audio,text,mixed',
      '要求：',
      '1. nodes 最多返回 6 个，按主链顺序排列。',
      '2. 如果图里明显有参考图片输入，请包含 image-input。',
      '3. 如果无法确定，用最小可行主链，不要编造复杂节点。',
      'JSON 格式：{"workflowKind":"image","nodes":[{"nodeType":"text-input","label":"提示词"},{"nodeType":"image-gen","label":"图片生成"},{"nodeType":"display","label":"结果展示"}],"summary":"...","notes":["..."]}',
      `用户补充：${input.userMessage}`,
    ].join('\n'),
  })
}

function buildCreationMessage(
  normalized: string,
  workflowKind?: 'image' | 'image_to_image' | 'video' | 'audio' | 'text',
) {
  if (workflowKind === 'text') {
    return `${normalized} 工作流参考`
  }

  if (workflowKind === 'image_to_image') {
    return `${normalized} 图生图`
  }

  if (workflowKind === 'image') {
    return `${normalized} 图片`
  }

  if (workflowKind === 'video') {
    return `${normalized} 视频`
  }

  if (workflowKind === 'audio') {
    return `${normalized} 音频`
  }

  return normalized
}

function buildWorkflowReferenceOperations(
  sketch: Awaited<ReturnType<typeof inferWorkflowReferenceSketch>>,
): WorkflowOperation[] {
  const normalizedNodes = normalizeWorkflowReferenceNodes(sketch)
  if (normalizedNodes.length === 0) {
    return buildCreationOperations('工作流参考图 图片')
  }

  const operations: WorkflowOperation[] = []

  for (const node of normalizedNodes) {
    operations.push({
      type: 'add_node',
      nodeId: node.id,
      nodeType: node.nodeType,
      initialData: node.label
        ? {
            label: node.label,
          }
        : undefined,
    })
  }

  const referenceConnections = buildWorkflowReferenceConnections(normalizedNodes)
  for (const connection of referenceConnections) {
    operations.push({
      type: 'connect',
      source: connection.source.id,
      sourceHandle: connection.sourceHandle,
      target: connection.target.id,
      targetHandle: connection.targetHandle,
    })
  }

  return operations
}

function inferWorkflowKind(
  userMessage: string,
  attachments: AgentPlanRequest['attachments'],
  workflowReference?: AgentPlanRequest['workflowReference'],
): 'image' | 'image_to_image' | 'video' | 'audio' | 'text' | undefined {
  const normalized = userMessage.trim().toLowerCase()

  if (workflowReference === 'workflow_reference') {
    return 'text'
  }

  if (attachments?.length) {
    return 'image_to_image'
  }

  if (
    normalized.includes('图生图') ||
    normalized.includes('以图生图') ||
    normalized.includes('改图') ||
    normalized.includes('图片修改') ||
    (normalized.includes('修改') && normalized.includes('图片'))
  ) {
    return 'image_to_image'
  }

  if (normalized.includes('视频')) {
    return 'video'
  }

  if (normalized.includes('音频') || normalized.includes('配音') || normalized.includes('语音')) {
    return 'audio'
  }

  if (normalized.includes('图') || normalized.includes('图片') || normalized.includes('海报')) {
    return 'image'
  }

  return 'text'
}

async function buildPromptConfirmationPayload(
  goal: string,
  workflowKind: 'image' | 'image_to_image' | 'video' | 'audio' | 'text' | undefined,
  attachments: AgentPlanRequest['attachments'],
) {
  if (workflowKind !== 'image' && workflowKind !== 'image_to_image') {
    return undefined
  }

  const attachedImageUrls = attachments?.map((item) => item.url)
  const fallbackVisualProposal = buildFallbackVisualProposal(goal, workflowKind)
  const fallbackExecutionPrompt = buildFallbackExecutionPrompt(goal, workflowKind, attachedImageUrls)
  const aiPayload = await callAgentAssistantJson<{
    visualProposal?: string
    executionPrompt?: string
    styleOptions?: Array<{ id: string; label: string; promptDelta: string }>
  }>({
    prompt: [
      '请把下面的图片需求整理成生成前确认卡片，并且只返回 JSON。',
      'JSON 格式：{"visualProposal":"...","executionPrompt":"...","styleOptions":[{"id":"...","label":"...","promptDelta":"..."}]}',
      '要求：',
      '1. visualProposal 必须用中文重述画面理解，补足主体、场景、镜头、光线、氛围与风格方向。',
      '2. executionPrompt 必须明显比原始需求更完整，不能只是重复原话。',
      '3. 如果用户附带参考图，executionPrompt 里要写明保留主体、构图或关键元素。',
      '4. styleOptions 给 3 个短风格方向，方便继续改写。',
      `工作流类型：${workflowKind}`,
      `原始意图：${goal}`,
      `附图数量：${attachedImageUrls?.length ?? 0}`,
    ].join('\n'),
  }).catch(() => null)

  return {
    id: `prompt_${nanoid()}`,
    originalIntent: goal,
    visualProposal: ensurePromptText(aiPayload?.visualProposal, fallbackVisualProposal),
    executionPrompt: ensurePromptText(aiPayload?.executionPrompt, fallbackExecutionPrompt),
    attachedImageUrls,
    targetNodeId: 'draft-text-input',
    styleOptions: aiPayload?.styleOptions?.length
      ? aiPayload.styleOptions
      : [
          { id: 'realistic', label: '更写实', promptDelta: '强调真实摄影、自然光和材质细节' },
          { id: 'anime', label: '更动漫', promptDelta: '强调造型、线稿和色块关系' },
          { id: 'commercial', label: '更商业', promptDelta: '强调广告感、主体突出和高级质感' },
        ],
  }
}

function buildFallbackVisualProposal(
  goal: string,
  workflowKind: 'image' | 'image_to_image',
) {
  const base = `我先把这次画面理解整理成一版更可执行的方向：${goal.trim()}。`
  if (workflowKind === 'image_to_image') {
    return `${base} 我会保留参考图里的主体关系和关键构图，同时补足新的风格、材质、光线与氛围表达。`
  }

  return `${base} 我会补足主体设定、场景环境、镜头构图、光线层次和整体风格，让生成目标更稳定。`
}

function buildFallbackExecutionPrompt(
  goal: string,
  workflowKind: 'image' | 'image_to_image',
  attachedImageUrls?: string[],
) {
  const imageConstraint =
    attachedImageUrls && attachedImageUrls.length > 0
      ? ' 保留参考图中的主体关系、核心构图和关键视觉元素，在此基础上做风格化重绘或细节增强。'
      : ''
  const workflowConstraint =
    workflowKind === 'image_to_image'
      ? '请基于输入参考图进行改写，强化风格一致性、材质细节、光线层次和画面完成度。'
      : '请把这个想法扩展成一条完整可执行的出图描述，明确主体、场景、构图、镜头、光线、氛围与质感。'

  return `${goal.trim()}\n\n${workflowConstraint}${imageConstraint}`
}

function ensurePromptText(value: string | undefined, fallback: string) {
  return value?.trim() ? value.trim() : fallback
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

  if (selectedNode && shouldPatchSelectedNodePrompt(normalized, selectedNode)) {
    return buildSelectedNodePromptOperations(normalized, selectedNode)
  }

  if (selectedNode && shouldOptimizeSelectedNode(normalized)) {
    return buildSelectedNodeOptimizationOperations(normalized, selectedNode)
  }

  const missingImageInputPatch = buildMissingImageInputOperations(normalized, canvas)
  if (missingImageInputPatch.length > 0) {
    return missingImageInputPatch
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

  if (normalized.includes('运行') || normalized.includes('执行')) {
    if (selectedNodeId && (normalized.includes('从这个节点') || normalized.includes('当前节点') || normalized.includes('选中节点'))) {
      return [
        { type: 'focus_nodes', nodeIds: [selectedNodeId] },
        { type: 'run_workflow', scope: 'from-node', nodeId: selectedNodeId },
      ]
    }

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
  workflowReferenceRequest = false,
  workflowReferenceSketch?: Awaited<ReturnType<typeof inferWorkflowReferenceSketch>> | null,
) {
  if (mode === 'diagnose') {
    if (canvas.latestExecution?.failedReason) {
      return `我会先围绕最近一次失败继续定位：${canvas.latestExecution.failedReason}`
    }
    return '我会先聚焦可能有问题的节点，再给出下一步修复建议。'
  }

  if (canvas.nodeCount === 0) {
    if (workflowReferenceRequest) {
      return workflowReferenceSketch?.summary?.trim()
        ? `我先按参考工作流图还原出一版主链提案：${workflowReferenceSketch.summary.trim()}`
        : '我准备先按参考工作流图整理出一版可落到画板里的结构提案，而不是把图片当成普通参考素材。'
    }

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
  workflowReferenceRequest = false,
  workflowReferenceSketch?: Awaited<ReturnType<typeof inferWorkflowReferenceSketch>> | null,
) {
  const reasons = []

  if (canvas.nodeCount === 0) {
    reasons.push('当前画板还是空白，适合先给出最小可运行结构。')
  } else {
    reasons.push(`当前画板已有 ${canvas.nodeCount} 个节点，先做局部提案更安全。`)
  }

  if (workflowReferenceRequest || isWorkflowReferenceRequest(normalized)) {
    reasons.push('这次附图更像结构参考，我会优先复用图里的流程意图，而不是把它只当内容素材。')
  }

  if (workflowReferenceSketch?.notes?.length) {
    reasons.push(workflowReferenceSketch.notes[0] as string)
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

  if (canvas.selectionContext?.nodeLabel) {
    reasons.push(`当前已选中节点「${canvas.selectionContext.nodeLabel}」，我会优先围绕这个局部上下文生成提案。`)
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

function isWorkflowReferenceRequest(
  normalized: string,
  workflowReference?: AgentPlanRequest['workflowReference'],
) {
  if (workflowReference === 'workflow_reference') {
    return true
  }

  return (
    normalized.includes('工作流参考图') ||
    normalized.includes('参考这张工作流图') ||
    normalized.includes('复刻画板工作流') ||
    normalized.includes('参考这个流程图')
  )
}

function normalizeWorkflowReferenceNodes(
  sketch: Awaited<ReturnType<typeof inferWorkflowReferenceSketch>>,
) {
  const fallback = [
    { id: 'draft-text-input', nodeType: 'text-input', label: '提示词输入' },
    { id: 'draft-image-gen', nodeType: 'image-gen', label: '图片生成' },
    { id: 'draft-display', nodeType: 'display', label: '结果展示' },
  ] as const

  const nodes = sketch?.nodes?.filter((node) =>
    ['text-input', 'image-input', 'image-gen', 'video-gen', 'audio-gen', 'llm', 'display'].includes(
      node.nodeType,
    ),
  )
  if (!nodes?.length) {
    return [...fallback]
  }

  return nodes.slice(0, 6).map((node, index) => ({
    id: `draft-ref-${index + 1}`,
    nodeType: node.nodeType,
    label: node.label?.trim() || defaultReferenceNodeLabel(node.nodeType),
  }))
}

function buildWorkflowReferenceConnections(
  nodes: Array<{ id: string; nodeType: string; label: string }>,
) {
  const connections: Array<{
    source: { id: string; nodeType: string; label: string }
    target: { id: string; nodeType: string; label: string }
    sourceHandle?: string
    targetHandle?: string
  }> = []

  const displayNode = nodes.find((node) => node.nodeType === 'display')
  const imageGenNode = nodes.find((node) => node.nodeType === 'image-gen')
  const videoGenNode = nodes.find((node) => node.nodeType === 'video-gen')
  const audioGenNode = nodes.find((node) => node.nodeType === 'audio-gen')
  const llmNode = nodes.find((node) => node.nodeType === 'llm')
  const promptSource =
    nodes.find((node) => node.nodeType === 'text-input') ??
    nodes.find((node) => node.nodeType === 'llm')
  const imageInputNode = nodes.find((node) => node.nodeType === 'image-input')

  if (promptSource && imageGenNode) {
    connections.push({
      source: promptSource,
      target: imageGenNode,
      sourceHandle: 'text-out',
      targetHandle: 'prompt-in',
    })
  }

  if (imageInputNode && imageGenNode) {
    connections.push({
      source: imageInputNode,
      target: imageGenNode,
      sourceHandle: 'image-out',
      targetHandle: 'image-in',
    })
  }

  if (promptSource && videoGenNode) {
    connections.push({
      source: promptSource,
      target: videoGenNode,
      sourceHandle: 'text-out',
      targetHandle: 'prompt-in',
    })
  }

  if (imageInputNode && videoGenNode) {
    connections.push({
      source: imageInputNode,
      target: videoGenNode,
      sourceHandle: 'image-out',
      targetHandle: 'image-in',
    })
  }

  if (promptSource && audioGenNode) {
    connections.push({
      source: promptSource,
      target: audioGenNode,
      sourceHandle: 'text-out',
      targetHandle: 'text-in',
    })
  }

  if (promptSource && llmNode && !imageGenNode && !videoGenNode && !audioGenNode) {
    connections.push({
      source: promptSource,
      target: llmNode,
      sourceHandle: 'text-out',
      targetHandle: 'prompt-in',
    })
  }

  const terminalNode = imageGenNode ?? videoGenNode ?? audioGenNode ?? llmNode
  if (terminalNode && displayNode) {
    const handles = resolveReferenceHandles(terminalNode.nodeType, displayNode.nodeType)
    connections.push({
      source: terminalNode,
      target: displayNode,
      sourceHandle: handles.sourceHandle,
      targetHandle: handles.targetHandle,
    })
  }

  if (connections.length > 0) {
    return dedupeReferenceConnections(connections)
  }

  const linearConnections: typeof connections = []
  for (let index = 0; index < nodes.length - 1; index += 1) {
    const source = nodes[index]
    const target = nodes[index + 1]
    const handles = resolveReferenceHandles(source.nodeType, target.nodeType)
    linearConnections.push({
      source,
      target,
      sourceHandle: handles.sourceHandle,
      targetHandle: handles.targetHandle,
    })
  }

  return dedupeReferenceConnections(linearConnections)
}

function dedupeReferenceConnections(
  connections: Array<{
    source: { id: string }
    target: { id: string }
    sourceHandle?: string
    targetHandle?: string
  }>,
) {
  const seen = new Set<string>()
  return connections.filter((connection) => {
    const key = [
      connection.source.id,
      connection.sourceHandle ?? '',
      connection.target.id,
      connection.targetHandle ?? '',
    ].join(':')
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

function defaultReferenceNodeLabel(nodeType: string) {
  if (nodeType === 'text-input') return '提示词输入'
  if (nodeType === 'image-input') return '参考图输入'
  if (nodeType === 'image-gen') return '图片生成'
  if (nodeType === 'video-gen') return '视频生成'
  if (nodeType === 'audio-gen') return '音频生成'
  if (nodeType === 'llm') return '文本处理'
  return '结果展示'
}

function resolveReferenceHandles(sourceType: string, targetType: string) {
  if (sourceType === 'text-input' && ['image-gen', 'video-gen', 'llm'].includes(targetType)) {
    return { sourceHandle: 'text-out', targetHandle: 'prompt-in' }
  }

  if (sourceType === 'text-input' && targetType === 'audio-gen') {
    return { sourceHandle: 'text-out', targetHandle: 'text-in' }
  }

  if (sourceType === 'image-input' && ['image-gen', 'video-gen', 'llm'].includes(targetType)) {
    return { sourceHandle: 'image-out', targetHandle: 'image-in' }
  }

  if (sourceType === 'image-gen') {
    return { sourceHandle: 'image-out', targetHandle: 'content-in' }
  }

  if (sourceType === 'video-gen') {
    return { sourceHandle: 'video-out', targetHandle: 'content-in' }
  }

  if (sourceType === 'audio-gen') {
    return { sourceHandle: 'audio-out', targetHandle: 'content-in' }
  }

  return { sourceHandle: 'text-out', targetHandle: 'content-in' }
}

function buildPlanAlternatives(plan: AgentPlan, canvas: CanvasSummary): AgentPlan[] | undefined {
  if (canvas.nodeCount === 0 && plan.mode === 'create') {
    return [
      {
        ...plan,
        id: `plan_${nanoid()}`,
        variantLabel: '更保守',
        variantTone: 'conservative',
        summary: '我先给你一版更保守的最小工作流，只保留最核心的输入、生成和展示主链。',
        reasons: ['适合先快速验证主链是否跑通。'],
      },
      {
        ...plan,
        id: `plan_${nanoid()}`,
        variantLabel: '更激进',
        variantTone: 'aggressive',
        summary: '我也准备了一版更激进的工作流，会更早补入分析或变体步骤。',
        reasons: ['适合一开始就把后续扩展位留出来。'],
      },
    ]
  }

  if (plan.mode === 'optimize' || plan.intent === 'replace_model') {
    return [
      {
        ...plan,
        id: `plan_${nanoid()}`,
        variantLabel: '更省钱',
        variantTone: 'cheaper',
        summary: '这版更偏成本收缩，优先替换高成本模型和预览开销。',
        reasons: ['适合预算敏感的当前工作流。'],
      },
      {
        ...plan,
        id: `plan_${nanoid()}`,
        variantLabel: '更高质量',
        variantTone: 'higher-quality',
        summary: '这版保留更高质量输出，只收缩最不必要的成本点。',
        reasons: ['适合仍要优先保证结果质量的场景。'],
      },
    ]
  }

  return undefined
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

function buildMissingImageInputOperations(
  normalized: string,
  canvas: CanvasSummary,
): WorkflowOperation[] {
  if (!isMissingImageInputRequest(normalized)) {
    return []
  }

  const targetNode = findImageGenNodeMissingImageInput(canvas)
  if (!targetNode) {
    return []
  }

  return [
    {
      type: 'add_node',
      nodeId: 'draft-image-input',
      nodeType: 'image-input',
      initialData: {
        label: '参考图输入',
      },
    },
    {
      type: 'connect',
      source: 'draft-image-input',
      sourceHandle: 'image-out',
      target: targetNode.id,
      targetHandle: 'image-in',
    },
    {
      type: 'annotate_change',
      nodeId: targetNode.id,
      note: '已补上参考图输入节点，并接到图片生成节点的 image-in 入口。',
    },
    {
      type: 'focus_nodes',
      nodeIds: ['draft-image-input', targetNode.id],
    },
  ]
}

function isMissingImageInputRequest(normalized: string) {
  return (
    normalized.includes('图片输入') ||
    normalized.includes('把图接进去') ||
    normalized.includes('接一张图') ||
    normalized.includes('参考图') ||
    normalized.includes('图生图') ||
    normalized.includes('输入图片') ||
    normalized.includes('图片输进去')
  )
}

function findImageGenNodeMissingImageInput(canvas: CanvasSummary) {
  return (
    canvas.nodes.find((node) => {
      if (node.type !== 'image-gen') {
        return false
      }

      const hasImageInputPort = node.inputs.some((input) => input.id === 'image-in' || input.type === 'image')
      if (!hasImageInputPort) {
        return false
      }

      const alreadyHasImageInputNode = canvas.nodes.some((candidate) => candidate.type === 'image-input')
      if (alreadyHasImageInputNode) {
        return false
      }

      return true
    }) ?? null
  )
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
  if (node.type === 'image-gen') {
    const model = getDefaultPlatformRuntimeModel('image')
    return {
      platformProvider: model.supplierId,
      platformModel: model.modelId,
    }
  }

  if (node.type === 'video-gen') {
    return {
      platformProvider: 'kling',
      platformModel: 'kling-v1-6',
    }
  }

  if (node.type === 'llm') {
    const model = getDefaultPlatformRuntimeModel('text')
    return {
      platformProvider: model.supplierId,
      platformModel: model.modelId,
    }
  }

  return {}
}
