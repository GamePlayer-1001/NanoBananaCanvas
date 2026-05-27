/**
 * [INPUT]: 依赖 agent/types 的 CanvasSummary/AgentPlanIntent/WorkflowOperation
 * [OUTPUT]: 对外提供 planner 规则辅助函数，收口创建链路、节点级改动、结果续写、多提案变体构造
 * [POS]: lib/agent 的 planner 规则层，被 /api/agent/plan 入口消费，用于拆分单文件规则坏味道
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { getDefaultPlatformRuntimeModel } from '@/lib/platform-runtime'
import { matchesAny } from './constants'
import type {
  AgentPlan,
  AgentPlanIntent,
  CanvasSummary,
  CanvasSummaryNode,
  WorkflowOperation,
} from './types'

/* ─── Keywords ────────────────────────────────────────────────────────────── */

const KW_DIAGNOSE = ['为什么', '诊断', '报错'] as const
const KW_REPAIR = ['修复', '补救'] as const
const KW_OPTIMIZE = ['优化', '省钱', '更快'] as const
const KW_TEMPLATE = ['模板'] as const
const KW_EXTEND = ['继续', '延伸', '追加分支'] as const
const KW_CREATE = ['新建', '搭建', '创建'] as const
const KW_REPAIR_INTENT = ['修复', '跑不通'] as const
const KW_REPLACE_MODEL = ['换成', '替换模型', '更便宜的模型'] as const
const KW_CHANGE_OUTPUT_COUNT = ['4个变体', '四个变体', '多个变体', '输出改成'] as const
const KW_ADD_BRANCH = ['分支', '变体支线'] as const
const KW_IMAGE_TO_IMAGE = ['图生图', '以图生图', '参考图', '垫图', '图片修改', '改图'] as const
const KW_STRUCTURE_ADJUST = [
  '工作流不太对', '流程不太对', '节点不太对',
  '还需要把图片输入进去', '加一个图片输入', '补一个图片输入',
  '增加图片输入', '接入图片输入', '把图片输入进去',
  '把图接进去', '接一张图', '补输入节点',
] as const
const KW_VIDEO = ['视频'] as const
const KW_AUDIO = ['音频', '配音', '语音'] as const
const KW_IMAGE = ['图', '海报', '图片'] as const
const KW_PROMPT_EDIT = ['提示词', 'prompt', '更写实', '更真实'] as const
const KW_CHEAPER = ['更便宜'] as const
const KW_FASTER = ['更快'] as const
const KW_REALISTIC = ['更写实', '更真实'] as const

/* ─── Predicates ──────────────────────────────────────────────────────────── */

function isImageToImageRequest(normalized: string): boolean {
  return (
    matchesAny(normalized, KW_IMAGE_TO_IMAGE) ||
    (normalized.includes('修改') && normalized.includes('图片'))
  )
}

function isStructureAdjustmentRequest(normalized: string): boolean {
  return matchesAny(normalized, KW_STRUCTURE_ADJUST)
}

export function isSafeCreationPlan(
  mode: AgentPlan['mode'],
  canvasNodeCount: number,
  operations: WorkflowOperation[],
): boolean {
  return (
    mode === 'create' &&
    canvasNodeCount === 0 &&
    operations.every((operation) => operation.type === 'add_node' || operation.type === 'connect')
  )
}

export function inferModeFromMessage(
  inputMode: AgentPlan['mode'],
  normalized: string,
  nodeCount: number,
): AgentPlan['mode'] {
  if (matchesAny(normalized, KW_DIAGNOSE)) return 'diagnose'
  if (matchesAny(normalized, KW_REPAIR)) return 'repair'
  if (matchesAny(normalized, KW_OPTIMIZE)) return 'optimize'
  if (nodeCount === 0) return 'create'
  if (matchesAny(normalized, KW_TEMPLATE)) return 'template'
  if (matchesAny(normalized, KW_EXTEND)) return 'extend'
  if (matchesAny(normalized, KW_CREATE)) return 'create'
  return inputMode === 'create' && nodeCount > 0 ? 'update' : inputMode
}

export function inferIntentFromMessage(
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

  if (mode === 'repair' || matchesAny(normalized, KW_REPAIR_INTENT)) {
    return 'repair_flow'
  }

  if (isStructureAdjustmentRequest(normalized)) {
    return 'add_step'
  }

  if (mode === 'optimize') {
    return normalized.includes('快') ? 'optimize_speed' : 'optimize_cost'
  }

  if (normalized.includes('拆') && normalized.includes('步')) {
    return 'split_step'
  }

  if (matchesAny(normalized, KW_REPLACE_MODEL)) return 'replace_model'
  if (matchesAny(normalized, KW_CHANGE_OUTPUT_COUNT)) return 'change_output_count'
  if (matchesAny(normalized, KW_ADD_BRANCH)) return 'add_branch'

  return 'add_step'
}

export function shouldBuildPromptConfirmation(
  normalized: string,
  intent: AgentPlanIntent,
  workflowKind: 'image' | 'image_to_image' | 'video' | 'audio' | 'text' | undefined,
  canvasNodeCount: number,
): boolean {
  if (workflowKind !== 'image' && workflowKind !== 'image_to_image') {
    return false
  }

  if (intent !== 'create_workflow') {
    return false
  }

  if (canvasNodeCount !== 0) {
    return false
  }

  if (isStructureAdjustmentRequest(normalized)) {
    return false
  }

  return true
}

export function buildCreationOperations(normalized: string): WorkflowOperation[] {
  if (matchesAny(normalized, KW_VIDEO)) {
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

  if (matchesAny(normalized, KW_AUDIO)) {
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

  if (matchesAny(normalized, KW_IMAGE)) {
    if (isImageToImageRequest(normalized)) {
      return [
        { type: 'add_node', nodeId: 'draft-image-input', nodeType: 'image-input' },
        { type: 'add_node', nodeId: 'draft-text-input', nodeType: 'text-input' },
        { type: 'add_node', nodeId: 'draft-image-gen', nodeType: 'image-gen' },
        { type: 'add_node', nodeId: 'draft-display', nodeType: 'display' },
        {
          type: 'connect',
          source: 'draft-image-input',
          sourceHandle: 'image-out',
          target: 'draft-image-gen',
          targetHandle: 'image-in',
        },
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
      ]
    }

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

export function shouldPatchSelectedNodePrompt(normalized: string, selectedNode: CanvasSummaryNode): boolean {
  return (
    matchesAny(normalized, KW_PROMPT_EDIT) &&
    ['input', 'text-input', 'llm', 'image-gen', 'video-gen'].includes(selectedNode.type)
  )
}

export function buildSelectedNodePromptOperations(normalized: string, selectedNode: CanvasSummaryNode): WorkflowOperation[] {
  const promptValue = buildSelectedNodePromptDraft(normalized, selectedNode)

  return [
    {
      type: 'update_node_data',
      nodeId: selectedNode.id,
      patch: {
        config: (selectedNode.type === 'input' || selectedNode.type === 'text-input')
          ? { text: promptValue }
          : { prompt: promptValue },
      },
    },
    {
      type: 'annotate_change',
      nodeId: selectedNode.id,
      note: '只调整当前选中节点的提示词方向，不改整张图的结构。',
    },
    {
      type: 'focus_nodes',
      nodeIds: [selectedNode.id],
    },
  ]
}

export function shouldOptimizeSelectedNode(normalized: string): boolean {
  return matchesAny(normalized, KW_CHEAPER) || matchesAny(normalized, KW_FASTER)
}

export function buildSelectedNodeOptimizationOperations(
  normalized: string,
  selectedNode: CanvasSummaryNode,
): WorkflowOperation[] {
  const patch: Record<string, unknown> = {}
  const noteParts: string[] = []

  if (matchesAny(normalized, KW_CHEAPER)) {
    patch.platformModel = inferLowerCostModel(selectedNode)
    noteParts.push('切到更省钱的模型')
  }

  if (matchesAny(normalized, KW_FASTER)) {
    patch.platformModel = inferFasterModel(selectedNode, patch.platformModel)
    patch.quality = 'fast'
    noteParts.push('收缩到更快的执行规格')
  }

  return [
    {
      type: 'update_node_data',
      nodeId: selectedNode.id,
      patch: {
        config: patch,
      },
    },
    {
      type: 'annotate_change',
      nodeId: selectedNode.id,
      note: `只优化当前节点：${noteParts.join('，')}。`,
    },
    {
      type: 'focus_nodes',
      nodeIds: [selectedNode.id],
    },
  ]
}

export function buildSelectedNodePromptDraft(normalized: string, selectedNode: CanvasSummaryNode) {
  const basePrompt =
    String(
      selectedNode.configSummary.text ??
      selectedNode.configSummary.prompt ??
      selectedNode.label,
    ).trim() || selectedNode.label

  if (matchesAny(normalized, KW_REALISTIC)) {
    return `${basePrompt}，强调真实摄影质感、自然光、材质细节与镜头语言`
  }

  if (matchesAny(normalized, KW_FASTER)) {
    return `${basePrompt}，收缩画面复杂度，减少主体数量，优先稳定快速出图`
  }

  if (matchesAny(normalized, KW_CHEAPER)) {
    return `${basePrompt}，保持核心构图，弱化高成本细节，优先低成本稳定生成`
  }

  return `${basePrompt}，根据当前目标补齐一版更清晰可执行的提示词`
}

export function inferLowerCostModel(selectedNode: CanvasSummaryNode) {
  if (selectedNode.type === 'image-gen') {
    return 'black-forest-labs/flux-schnell'
  }

  if (selectedNode.type === 'video-gen') {
    return 'kling-v1-6'
  }

  return getDefaultPlatformRuntimeModel('text').modelId
}

export function inferFasterModel(selectedNode: CanvasSummaryNode, nextModel?: unknown) {
  if (typeof nextModel === 'string' && nextModel.trim()) {
    return nextModel
  }

  if (selectedNode.type === 'image-gen') {
    return 'black-forest-labs/flux-schnell'
  }

  if (selectedNode.type === 'video-gen') {
    return 'kling-v1-6'
  }

  return getDefaultPlatformRuntimeModel('text').modelId
}
