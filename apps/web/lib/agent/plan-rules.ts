/**
 * [INPUT]: 依赖 @/lib/nanoid，依赖 agent/types 的 CanvasSummary/AgentPlanIntent/WorkflowOperation
 * [OUTPUT]: 对外提供 planner 规则辅助函数，收口创建链路、节点级改动、结果续写、多提案变体构造
 * [POS]: lib/agent 的 planner 规则层，被 /api/agent/plan 入口消费，用于拆分单文件规则坏味道
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { nanoid } from '@/lib/nanoid'
import type {
  AgentPlan,
  AgentPlanIntent,
  CanvasSummary,
  CanvasSummaryNode,
  WorkflowOperation,
} from './types'

export function inferModeFromMessage(
  inputMode: AgentPlan['mode'],
  normalized: string,
  nodeCount: number,
): AgentPlan['mode'] {
  if (normalized.includes('为什么') || normalized.includes('诊断') || normalized.includes('报错')) {
    return 'diagnose'
  }

  if (normalized.includes('修复') || normalized.includes('补救')) {
    return 'repair'
  }

  if (normalized.includes('优化') || normalized.includes('省钱') || normalized.includes('更快')) {
    return 'optimize'
  }

  if (nodeCount === 0) {
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

export function buildCreationOperations(normalized: string): WorkflowOperation[] {
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

export function shouldPatchSelectedNodePrompt(normalized: string, selectedNode: CanvasSummaryNode) {
  return (
    (normalized.includes('提示词') || normalized.includes('prompt') || normalized.includes('更写实') || normalized.includes('更真实')) &&
    ['text-input', 'llm', 'image-gen', 'video-gen'].includes(selectedNode.type)
  )
}

export function buildSelectedNodePromptOperations(normalized: string, selectedNode: CanvasSummaryNode): WorkflowOperation[] {
  const promptValue = buildSelectedNodePromptDraft(normalized, selectedNode)

  return [
    {
      type: 'update_node_data',
      nodeId: selectedNode.id,
      patch: {
        config: selectedNode.type === 'text-input'
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

export function shouldOptimizeSelectedNode(normalized: string) {
  return normalized.includes('更便宜') || normalized.includes('更快')
}

export function buildSelectedNodeOptimizationOperations(
  normalized: string,
  selectedNode: CanvasSummaryNode,
): WorkflowOperation[] {
  const patch: Record<string, unknown> = {}
  const noteParts: string[] = []

  if (normalized.includes('更便宜')) {
    patch.platformModel = inferLowerCostModel(selectedNode)
    noteParts.push('切到更省钱的模型')
  }

  if (normalized.includes('更快')) {
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

  if (normalized.includes('更写实') || normalized.includes('更真实')) {
    return `${basePrompt}，强调真实摄影质感、自然光、材质细节与镜头语言`
  }

  if (normalized.includes('更快')) {
    return `${basePrompt}，收缩画面复杂度，减少主体数量，优先稳定快速出图`
  }

  if (normalized.includes('更便宜')) {
    return `${basePrompt}，保持核心构图，弱化高成本细节，优先低成本稳定生成`
  }

  return `${basePrompt}，根据当前目标补齐一版更清晰可执行的提示词`
}

export function inferLowerCostModel(selectedNode: CanvasSummaryNode) {
  const currentModel = String(selectedNode.configSummary.platformModel ?? '')

  if (selectedNode.type === 'image-gen') {
    return currentModel.includes('flux') ? 'black-forest-labs/flux-schnell' : 'openai/gpt-image-1-mini'
  }

  if (selectedNode.type === 'video-gen') {
    return 'kling-v1-6'
  }

  return 'openai/gpt-4o-mini'
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

  return 'openai/gpt-4o-mini'
}
