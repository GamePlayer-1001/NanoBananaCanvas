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
  AgentPlanRequest,
  CanvasSummary,
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
    const plan = buildPlannerResponse(input)
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
  const operations =
    inferredMode === 'diagnose'
      ? buildDiagnoseOperations(canvas)
      : canvas.nodeCount === 0
        ? buildCreationOperations(normalized)
        : buildUpdateOperations(normalized, canvas)

  const reasons = buildReasons(normalized, canvas, inferredMode, operations)
  const requiresConfirmation =
    operations.length > AGENT_MAX_AUTO_OPERATIONS ||
    operations.some((operation) =>
      operation.type === 'remove_node' ||
      operation.type === 'request_prompt_confirmation' ||
      operation.type === 'run_workflow',
    )

  return {
    id: `plan_${nanoid()}`,
    goal,
    mode: inferredMode,
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

  if (normalized.includes('优化')) {
    return 'optimize'
  }

  if (input.canvasSummary.nodeCount === 0) {
    return 'create'
  }

  if (normalized.includes('新建') || normalized.includes('搭建') || normalized.includes('创建')) {
    return 'create'
  }

  return input.mode === 'create' && input.canvasSummary.nodeCount > 0 ? 'update' : input.mode
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

function buildUpdateOperations(normalized: string, canvas: CanvasSummary): WorkflowOperation[] {
  const selectedNodeId = canvas.selectedNodeId ?? canvas.nodes[0]?.id

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

  if (operations[0]?.type === 'focus_nodes') {
    return '我先把注意力聚焦到最相关的节点范围，再给你一个可检查的修改方向。'
  }

  if (operations[0]?.type === 'update_node_data') {
    return '我准备先做一个小范围配置修改提案，不直接动整张图。'
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

  if (mode === 'diagnose') {
    reasons.push('你当前的目标更像是在定位问题，所以我先收缩到问题节点而不是直接改图。')
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
