/**
 * [INPUT]: 依赖 @/lib/agent/server-assistant 的 AI 调用能力，依赖 @/lib/nanoid
 * [OUTPUT]: 对外提供 inferIntentWithAssistant / inferWorkflowReferenceSketch / inferWorkflowKind / isWorkflowReferenceRequest / buildCreationMessage / buildPromptConfirmationPayload + WorkflowReferenceSketch 类型
 * [POS]: lib/agent 的意图解析层，被 api/agent/plan/route 消费，负责把用户意图与附图翻译成结构化 AI 输入
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { callAgentAssistantJson } from '@/lib/agent/server-assistant'
import { nanoid } from '@/lib/nanoid'
import type { AgentPlan, AgentPlanIntent, AgentPlanRequest } from './types'

/* ─── Types ───────────────────────────────────────────── */

export type WorkflowReferenceSketch = {
  workflowKind?: 'image' | 'image_to_image' | 'video' | 'audio' | 'text' | 'mixed'
  nodes?: Array<{
    nodeType: 'text-input' | 'image-input' | 'image-gen' | 'video-gen' | 'audio-gen' | 'llm' | 'display'
    label?: string
  }>
  summary?: string
  notes?: string[]
} | null

/* ─── Keywords ────────────────────────────────────────── */

const KEYWORDS_IMAGE_TO_IMAGE = ['图生图', '以图生图', '改图', '图片修改'] as const
const KEYWORDS_VIDEO = ['视频'] as const
const KEYWORDS_AUDIO = ['音频', '配音', '语音'] as const
const KEYWORDS_IMAGE = ['图', '图片', '海报'] as const
const KEYWORDS_WORKFLOW_REFERENCE = [
  '工作流参考图',
  '参考这张工作流图',
  '复刻画板工作流',
  '参考这个流程图',
] as const

function matchesAny(str: string, keywords: readonly string[]): boolean {
  return keywords.some((kw) => str.includes(kw))
}

/* ─── Workflow Reference ──────────────────────────────── */

export function isWorkflowReferenceRequest(
  normalized: string,
  workflowReference?: AgentPlanRequest['workflowReference'],
): boolean {
  if (workflowReference === 'workflow_reference') {
    return true
  }
  return matchesAny(normalized, KEYWORDS_WORKFLOW_REFERENCE)
}

/* ─── Workflow Kind ───────────────────────────────────── */

export function inferWorkflowKind(
  userMessage: string,
  attachments: AgentPlanRequest['attachments'],
  workflowReference?: AgentPlanRequest['workflowReference'],
): 'image' | 'image_to_image' | 'video' | 'audio' | 'text' | undefined {
  const normalized = userMessage.trim().toLowerCase()

  if (workflowReference === 'workflow_reference') return 'text'
  if (attachments?.length) return 'image_to_image'

  if (
    matchesAny(normalized, KEYWORDS_IMAGE_TO_IMAGE) ||
    (normalized.includes('修改') && normalized.includes('图片'))
  ) {
    return 'image_to_image'
  }

  if (matchesAny(normalized, KEYWORDS_VIDEO)) return 'video'
  if (matchesAny(normalized, KEYWORDS_AUDIO)) return 'audio'
  if (matchesAny(normalized, KEYWORDS_IMAGE)) return 'image'

  return 'text'
}

export function buildCreationMessage(
  normalized: string,
  workflowKind?: 'image' | 'image_to_image' | 'video' | 'audio' | 'text',
): string {
  if (workflowKind === 'text') return `${normalized} 工作流参考`
  if (workflowKind === 'image_to_image') return `${normalized} 图生图`
  if (workflowKind === 'image') return `${normalized} 图片`
  if (workflowKind === 'video') return `${normalized} 视频`
  if (workflowKind === 'audio') return `${normalized} 音频`
  return normalized
}

/* ─── AI-Assisted Intent Inference ───────────────────── */

export async function inferIntentWithAssistant(input: AgentPlanRequest) {
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

export async function inferWorkflowReferenceSketch(input: AgentPlanRequest): Promise<WorkflowReferenceSketch> {
  if (!input.attachments?.length) {
    return null
  }

  return callAgentAssistantJson<NonNullable<WorkflowReferenceSketch>>({
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

/* ─── Prompt Confirmation Payload ─────────────────────── */

export async function buildPromptConfirmationPayload(
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

function buildFallbackVisualProposal(goal: string, workflowKind: 'image' | 'image_to_image'): string {
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
): string {
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

function ensurePromptText(value: string | undefined, fallback: string): string {
  return value?.trim() ? value.trim() : fallback
}
