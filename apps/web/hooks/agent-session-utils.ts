/**
 * [INPUT]: 依赖 @/lib/agent/types, @/stores/use-flow-store
 * [OUTPUT]: 对外提供 agent session 纯工具函数 — 意图分类、聊天填充、计划操作、确认短语
 * [POS]: hooks 的 Agent 会话工具层，从 use-agent-session.ts 拆出的纯函数
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type {
  AgentAssistantRuntime,
  AgentComposerAttachment,
  AgentMode,
  AgentPlan,
} from '@/lib/agent/types'
import { summarizeCanvas } from '@/lib/agent/summarize-canvas'
import { useFlowStore } from '@/stores/use-flow-store'

/* ─── Types ─────────────────────────────────────────── */

export type AgentCommandMode = 'workflow' | 'prompt' | 'chat'
export type AgentRequestKind = 'plan' | 'diagnose' | 'explain' | 'optimize'
export type ChatFillIntent =
  | {
      kind: 'text'
      nodeId: string
      text: string
      nodeLabel?: string
    }
  | {
      kind: 'image'
      nodeId: string
      imageUrl: string
      imageName?: string
      nodeLabel?: string
    }
export type ChatFillResolution =
  | {
      status: 'ready'
      intent: ChatFillIntent
    }
  | {
      status: 'ambiguous'
      kind: 'text' | 'image'
    }
  | {
      status: 'missing-target'
      kind: 'text' | 'image'
    }
export type WorkflowReferenceKind = 'workflow_reference' | 'content_reference' | 'uncertain'

/* ─── Confirmation Phrases ──────────────────────────── */

export const CONFIRMATION_PHRASES = new Set([
  '我确认',
  '我确定',
  '确认',
  '确定',
  '可以',
  '可以执行',
  '执行吧',
  '开始吧',
  '开始执行',
  '是的',
  '好的',
  '好',
  'ok',
  'okay',
  'yes',
  'yep',
  '继续',
  '继续吧',
])

export const REJECTION_PHRASES = new Set([
  '不',
  '不用',
  '先不要',
  '取消',
  '算了',
  '先等等',
  '先别执行',
  '不要这样',
])

/* ─── Normalization ─────────────────────────────────── */

export function normalizeIntentText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '')
}

export function normalizeConfirmationText(value: string) {
  return value.replace(/[。！!？，,\s]/g, '').trim().toLowerCase()
}

export function normalizeAgentInput(rawValue: string) {
  const trimmed = rawValue.trim()
  const normalizedSlash = trimmed.replace(/^／/, '/')
  const match = normalizedSlash.match(/^\/(workflow|prompt)\b/i)

  if (!match) {
    return {
      commandMode: 'chat' as AgentCommandMode,
      message: trimmed,
      displayText: trimmed,
    }
  }

  const command = match[1].toLowerCase() as 'workflow' | 'prompt'
  const message = normalizedSlash.slice(match[0].length).trim()
  return {
    commandMode: command,
    message,
    displayText: normalizedSlash,
  }
}

/* ─── Intent Classification ─────────────────────────── */

export function requestKindMatchesCreateLikeMessage(value: string) {
  return (
    value.includes('工作流') ||
    value.includes('图生图') ||
    value.includes('文生图') ||
    value.includes('搭建') ||
    value.includes('创建')
  )
}

export function resolveRequestKind(
  userMessage: string,
  mode: AgentMode,
): AgentRequestKind {
  const normalized = normalizeIntentText(userMessage)

  if (mode === 'diagnose') {
    return 'diagnose'
  }

  if (mode === 'optimize') {
    return 'optimize'
  }

  if (
    normalized.includes('为什么') ||
    normalized.includes('报错') ||
    normalized.includes('跑不通') ||
    normalized.includes('失败') ||
    normalized.includes('诊断')
  ) {
    return 'diagnose'
  }

  if (
    normalized.includes('优化') ||
    normalized.includes('省钱') ||
    normalized.includes('成本') ||
    normalized.includes('更快') ||
    normalized.includes('太慢')
  ) {
    return 'optimize'
  }

  if (
    normalized.includes('解释') ||
    normalized.includes('这条链在做什么') ||
    normalized.includes('这个节点在做什么') ||
    normalized.includes('workflow 在做什么')
  ) {
    return 'explain'
  }

  return 'plan'
}

export function resolveWorkflowMode(mode: AgentMode, nodeCount: number): AgentMode {
  if (mode === 'template') {
    return 'template'
  }

  if (nodeCount === 0) {
    return 'create'
  }

  return mode === 'create' ? 'update' : mode
}

export function looksLikeExplainSelectionQuestion(
  value: string,
  canvasSummary: ReturnType<typeof summarizeCanvas>,
) {
  if (!canvasSummary.selectionContext?.nodeId) {
    return false
  }

  const normalized = normalizeIntentText(value)
  const nodeLabel = normalizeIntentText(canvasSummary.selectionContext.nodeLabel ?? '')
  return (
    normalized.includes('这个节点') ||
    normalized.includes('当前节点') ||
    normalized.includes('选中的节点') ||
    normalized.includes('这里') ||
    normalized.includes('这个参数') ||
    normalized.includes('这个配置') ||
    normalized.includes('这个 prompt') ||
    normalized.includes('这个prompt') ||
    normalized.includes('这个模型') ||
    normalized.includes('这个节点是做什么') ||
    normalized.includes('这个节点怎么用') ||
    normalized.includes('这个节点有什么用') ||
    normalized.includes('为什么这么连') ||
    normalized.includes('为什么这样连') ||
    normalized.includes('它为什么') ||
    normalized.includes('它是干嘛') ||
    normalized.includes('它在做什么') ||
    normalized.includes('什么意思') ||
    (nodeLabel.length > 0 &&
      (normalized.includes(nodeLabel) &&
        (normalized.includes('为什么') ||
          normalized.includes('做什么') ||
          normalized.includes('干嘛') ||
          normalized.includes('作用') ||
          normalized.includes('意思'))))
  )
}

export function looksLikeNodeScopedCollaboration(
  value: string,
  canvasSummary: ReturnType<typeof summarizeCanvas>,
) {
  if (!canvasSummary.selectionContext?.nodeId) {
    return false
  }

  const normalized = normalizeIntentText(value)
  return (
    normalized.includes('怎么调') ||
    normalized.includes('怎么改') ||
    normalized.includes('怎么写') ||
    normalized.includes('这里填什么') ||
    normalized.includes('这个节点适合') ||
    normalized.includes('这一格填什么') ||
    normalized.includes('这个参数怎么设') ||
    normalized.includes('这个节点下一步') ||
    normalized.includes('帮我看看这个节点')
  )
}

export function buildNodeScopedReply(
  userMessage: string,
  canvasSummary: ReturnType<typeof summarizeCanvas>,
) {
  const selection = canvasSummary.selectionContext
  if (!selection?.nodeId || !selection.nodeType) {
    return null
  }

  const normalized = normalizeIntentText(userMessage)
  const nodeLabel = selection.nodeLabel ? `节点「${selection.nodeLabel}」` : '这个节点'

  if (selection.nodeType === 'text-input') {
    if (normalized.includes('怎么调') || normalized.includes('怎么写') || normalized.includes('填什么')) {
      return `${nodeLabel}更适合先把目标说清楚，再补风格和约束。一个稳定顺序是：主体/任务 -> 场景 -> 风格 -> 细节要求 -> 限制条件。你可以先把一句核心目标写短一点，我再陪你往下收。`
    }
    return `${nodeLabel}主要决定下游拿到的原始意图。这里优先保证信息完整、句子别太散，先把"想生成什么"和"最重要的限制"写稳。`
  }

  if (selection.nodeType === 'image-gen' || selection.nodeType === 'video-gen') {
    if (normalized.includes('怎么调') || normalized.includes('参数')) {
      return `${nodeLabel}优先看三件事：输入 prompt 是否够清楚、模型/质量档位是否匹配目标、输入参考图有没有接对。想先稳结果，就先少改参数，先把 prompt 和输入链路对齐。`
    }
    return `${nodeLabel}是主生成节点，最容易受上游 prompt、参考图和模型规格影响。这里先别同时改很多参数，最好一次只动一类变量。`
  }

  if (selection.nodeType === 'image-input') {
    return `${nodeLabel}主要影响参考图约束。这里先确认放进去的是不是你真想参考的那一张，再看下游生成节点有没有正确接到 image-in。`
  }

  if (selection.nodeType === 'llm') {
    return `${nodeLabel}更适合拆清"输入是什么、要产出什么格式、口吻要不要固定"。如果你觉得结果飘，通常先收紧输出格式和任务边界会更稳。`
  }

  if (selection.nodeType === 'display') {
    return `${nodeLabel}本身不决定生成质量，它主要帮助你检查上游有没有把结果正确传下来。如果这里没东西，优先回头看上游连线和输出句柄。`
  }

  return null
}

export function inferPromptStyleDirection(value: string) {
  if (value.includes('写实') || value.includes('真实')) {
    return '更写实'
  }
  if (value.includes('动漫') || value.includes('二次元')) {
    return '更动漫'
  }
  if (value.includes('商业') || value.includes('广告')) {
    return '更商业'
  }
  return undefined
}

/* ─── Workflow Reference ─────────────────────────────── */

export async function classifyWorkflowReferenceInput(input: {
  userMessage: string
  attachments: AgentComposerAttachment[]
  assistantRuntime?: AgentAssistantRuntime
}): Promise<{ kind: WorkflowReferenceKind }> {
  if (input.attachments.length === 0) {
    return { kind: 'content_reference' }
  }

  const normalized = normalizeIntentText(input.userMessage)
  if (mentionsWorkflowDiagramReference(normalized)) {
    return { kind: 'workflow_reference' }
  }

  if (!input.assistantRuntime) {
    return { kind: 'content_reference' }
  }

  return { kind: 'content_reference' }
}

export function buildWorkflowUserMessage(
  userMessage: string,
  referenceKind: WorkflowReferenceKind,
  attachments: AgentComposerAttachment[],
) {
  const trimmed = userMessage.trim()
  if (referenceKind === 'workflow_reference') {
    const suffix =
      attachments.length > 0
        ? '我上传了一张工作流参考图，请优先按这张图的结构来生成或复刻画板工作流提案。'
        : ''
    return [trimmed, suffix].filter(Boolean).join('\n')
  }

  if (!trimmed && attachments.length > 0) {
    return '请基于我上传的参考图片生成合适的工作流提案，并把图片视为内容参考输入。'
  }

  return trimmed
}

/* ─── Chat Fill ──────────────────────────────────────── */

export function detectChatFillIntent(input: {
  userMessage: string
  attachments: AgentComposerAttachment[]
  canvasSummary: ReturnType<typeof summarizeCanvas>
}): ChatFillResolution | null {
  const normalized = normalizeIntentText(input.userMessage)
  const flowState = useFlowStore.getState()
  const selectedNodeId = input.canvasSummary.selectionContext?.nodeId

  if (input.attachments.length > 0 && mentionsImageFillIntent(normalized)) {
    const imageNode = resolveSingleTargetNode({
      selectedNodeId,
      candidateNodeType: 'image-input',
      fallbackNodeType: 'image-input',
      nodes: flowState.nodes,
    })
    if (imageNode.status !== 'ready') {
      return imageNode.status === 'ambiguous'
        ? { status: 'ambiguous', kind: 'image' }
        : { status: 'missing-target', kind: 'image' }
    }

    return {
      status: 'ready',
      intent: {
        kind: 'image',
        nodeId: imageNode.node.id,
        imageUrl: input.attachments[0].url,
        imageName: input.attachments[0].name,
        nodeLabel: extractNodeLabel(imageNode.node.data),
      },
    }
  }

  if (!input.userMessage.trim() || !mentionsTextFillIntent(normalized)) {
    return null
  }

  const textNode = resolveSingleTargetNode({
    selectedNodeId,
    candidateNodeType: 'text-input',
    fallbackNodeType: 'text-input',
    nodes: flowState.nodes,
  })
  if (textNode.status !== 'ready') {
    return textNode.status === 'ambiguous'
      ? { status: 'ambiguous', kind: 'text' }
      : { status: 'missing-target', kind: 'text' }
  }

  return {
    status: 'ready',
    intent: {
      kind: 'text',
      nodeId: textNode.node.id,
      text: extractTextFillContent(input.userMessage),
      nodeLabel: extractNodeLabel(textNode.node.data),
    },
  }
}

export function resolveSingleTargetNode(input: {
  selectedNodeId?: string
  candidateNodeType: string
  fallbackNodeType: string
  nodes: ReturnType<typeof useFlowStore.getState>['nodes']
}) {
  if (input.selectedNodeId) {
    const selectedNode = input.nodes.find((node) => node.id === input.selectedNodeId)
    if (selectedNode?.type === input.candidateNodeType) {
      return {
        status: 'ready' as const,
        node: selectedNode,
      }
    }
    return {
      status: 'missing-target' as const,
    }
  }

  const candidates = input.nodes.filter((node) => node.type === input.fallbackNodeType)
  if (candidates.length === 0) {
    return {
      status: 'missing-target' as const,
    }
  }
  if (candidates.length > 1) {
    return {
      status: 'ambiguous' as const,
    }
  }
  return {
    status: 'ready' as const,
    node: candidates[0],
  }
}

export function fillTextInputNode(nodeId: string, text: string) {
  const { nodes, updateNodeData } = useFlowStore.getState()
  const node = nodes.find((item) => item.id === nodeId)
  const currentConfig = isRecord(node?.data?.config) ? node.data.config : {}
  updateNodeData(nodeId, {
    config: {
      ...currentConfig,
      text,
    },
  })
}

export function fillImageInputNode(nodeId: string, imageUrl: string) {
  const { nodes, updateNodeData } = useFlowStore.getState()
  const node = nodes.find((item) => item.id === nodeId)
  const currentConfig = isRecord(node?.data?.config) ? node.data.config : {}
  updateNodeData(nodeId, {
    config: {
      ...currentConfig,
      imageUrl,
    },
  })
}

/* ─── Plan Operations ───────────────────────────────── */

export function shouldAutoApplyPlan(
  plan: AgentPlan,
  requestKind: 'plan' | 'diagnose' | 'explain' | 'optimize',
) {
  if (requestKind !== 'plan') return false
  if (plan.mode === 'create') return !plan.requiresConfirmation
  return !plan.requiresConfirmation && !plan.promptConfirmation
}

export function buildFallbackPromptConfirmationPlan(
  payload: AgentPlan['promptConfirmation'] | null,
): AgentPlan | null {
  if (!payload) return null

  return {
    id: `plan_prompt_confirm_${payload.id}`,
    goal: payload.originalIntent,
    mode: 'create',
    intent: 'create_workflow',
    summary: '继续执行当前已确认的图片工作流。',
    reasons: ['当前确认卡片仍然存在，只缺少待执行计划外壳。'],
    requiresConfirmation: false,
    operations: [],
    promptConfirmation: payload,
  }
}

export function resolvePromptTargetWithNodeMap(
  plan: AgentPlan,
  nodeIdMap: Record<string, string>,
): AgentPlan | null {
  if (!plan.promptConfirmation?.targetNodeId) return null

  const mappedTargetNodeId =
    nodeIdMap[plan.promptConfirmation.targetNodeId] ?? plan.promptConfirmation.targetNodeId
  const nodes = useFlowStore.getState().nodes
  if (!nodes.some((node) => node.id === mappedTargetNodeId)) {
    return null
  }

  return {
    ...plan,
    promptConfirmation: {
      ...plan.promptConfirmation,
      targetNodeId: mappedTargetNodeId,
    },
  }
}

export function extractFocusNodeIds(plan: AgentPlan) {
  return plan.operations
    .filter((operation): operation is Extract<typeof plan.operations[number], { type: 'focus_nodes' }> =>
      operation.type === 'focus_nodes',
    )
    .flatMap((operation) => operation.nodeIds)
}

export function mergeNodeTextIntoInitialData(
  initialData: Record<string, unknown> | undefined,
  text: string,
): Record<string, unknown> {
  const nextInitialData = isRecord(initialData) ? { ...initialData } : {}
  const currentConfig = isRecord(nextInitialData.config) ? nextInitialData.config : {}

  return {
    ...nextInitialData,
    config: {
      ...currentConfig,
      text,
    },
  }
}

export function mergeNodeImageIntoInitialData(
  initialData: Record<string, unknown> | undefined,
  imageUrl: string,
): Record<string, unknown> {
  const nextInitialData = isRecord(initialData) ? { ...initialData } : {}
  const currentConfig = isRecord(nextInitialData.config) ? nextInitialData.config : {}

  return {
    ...nextInitialData,
    config: {
      ...currentConfig,
      imageUrl,
    },
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function normalizeHandleId(handleId: string | null | undefined) {
  return handleId ?? null
}

/* ─── Internal Intent Helpers ────────────────────────── */

function mentionsTextFillIntent(normalized: string) {
  return (
    normalized.includes('放进') ||
    normalized.includes('填到') ||
    normalized.includes('填入') ||
    normalized.includes('写入') ||
    normalized.includes('放到') ||
    normalized.includes('放入')
  )
}

function mentionsImageFillIntent(normalized: string) {
  return mentionsTextFillIntent(normalized) || normalized.includes('用这张图')
}

function mentionsWorkflowDiagramReference(normalized: string) {
  return (
    normalized.includes('参考这个工作流') ||
    normalized.includes('参考这张工作流图') ||
    normalized.includes('参考这个流程图') ||
    normalized.includes('照着这个工作流') ||
    normalized.includes('复刻这个工作流') ||
    normalized.includes('按这个流程图') ||
    normalized.includes('按照这张工作流图') ||
    normalized.includes('根据这张工作流图')
  )
}

export function extractTextFillContent(userMessage: string) {
  const trimmed = userMessage.trim()
  const quotedMatches = [
    ...trimmed.matchAll(/[""](.*?)[""]/g),
    ...trimmed.matchAll(/[「『](.*?)[」』]/g),
  ]
  const quotedText = quotedMatches
    .map((match) => match[1]?.trim())
    .find((value) => Boolean(value))
  if (quotedText) {
    return quotedText
  }

  const separators = ['：', ':', '为', '成']
  for (const separator of separators) {
    const index = trimmed.indexOf(separator)
    if (index >= 0) {
      const candidate = trimmed.slice(index + separator.length).trim()
      if (candidate) {
        return candidate
      }
    }
  }

  return trimmed
}

export function formatNodeLabel(nodeLabel: string | undefined, fallback: string) {
  if (!nodeLabel) {
    return fallback
  }

  return `节点「${nodeLabel}」`
}

export function extractNodeLabel(data: unknown) {
  if (!isRecord(data)) {
    return undefined
  }

  return typeof data.label === 'string' ? data.label : undefined
}
