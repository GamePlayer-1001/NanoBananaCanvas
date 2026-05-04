/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/agent/server-assistant, @/lib/nanoid, @/lib/validations/agent
 * [OUTPUT]: 对外提供 POST /api/agent/refine-prompt，返回 PromptConfirmationPayload
 * [POS]: api/agent 的提示词确认端点，为图片工作流提供原始意图 / 画面提案 / 执行 prompt 三段结构
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { callAgentAssistantJson } from '@/lib/agent/server-assistant'
import { apiError, apiOk, handleApiError, withBodyLimit } from '@/lib/api/response'
import { nanoid } from '@/lib/nanoid'
import {
  promptConfirmationRequestSchema,
} from '@/lib/validations/agent'

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

    const input = promptConfirmationRequestSchema.parse(body)
    const payload = await buildPromptPayload(input)
    return apiOk({ payload })
  } catch (error) {
    return handleApiError(error)
  }
}

async function buildPromptPayload(
  input: ReturnType<typeof promptConfirmationRequestSchema.parse>,
) {
  const direction = input.styleDirection?.trim() || '默认'
  const basePrompt = input.executionPrompt?.trim() || input.originalIntent.trim()
  const fallbackVisualProposal = buildVisualProposal(input.originalIntent, direction, Boolean(input.regenerate))
  const fallbackExecutionPrompt = buildExecutionPrompt(
    basePrompt,
    direction,
    Boolean(input.regenerate),
    input.attachedImageUrls,
  )
  const fallbackStyleOptions = [
    { id: 'realistic', label: '更写实', promptDelta: '强调真实摄影、镜头语言、自然光和材质细节' },
    { id: 'anime', label: '更动漫', promptDelta: '强调二次元角色造型、线稿、色块和镜头张力' },
    { id: 'commercial', label: '更商业', promptDelta: '强调品牌视觉、主商品突出、广告级构图和高级质感' },
  ]
  const aiPayload = await callAgentAssistantJson<{
    visualProposal?: string
    executionPrompt?: string
    styleOptions?: Array<{ id: string; label: string; promptDelta: string }>
  }>({
    prompt: [
      '请把下面的用户需求整理成图片生成前的确认内容，并只返回 JSON。',
      'JSON 格式：{"visualProposal":"...","executionPrompt":"...","styleOptions":[{"id":"...","label":"...","promptDelta":"..."}]}',
      '约束：',
      '1. visualProposal 用中文描述你理解的画面、主体、镜头、光线、氛围和风格方向。',
      '2. executionPrompt 必须比原始意图更完整、更适合生成，不能只重复原话。',
      '3. 如果带了参考图，就要把“保留参考图主体/构图/关键元素”的约束写进 executionPrompt。',
      '4. styleOptions 给 3 个短风格方向，便于继续改写。',
      `原始意图：${input.originalIntent.trim()}`,
      `当前提示词：${input.executionPrompt?.trim() || '无'}`,
      `风格方向：${direction}`,
      `重新生成：${input.regenerate ? '是' : '否'}`,
      `附图数量：${input.attachedImageUrls?.length ?? 0}`,
    ].join('\n'),
  }).catch(() => null)

  return {
    id: `prompt_${nanoid()}`,
    originalIntent: input.originalIntent.trim(),
    visualProposal: ensureText(aiPayload?.visualProposal, fallbackVisualProposal),
    executionPrompt: ensureText(aiPayload?.executionPrompt, fallbackExecutionPrompt),
    attachedImageUrls: input.attachedImageUrls,
    styleOptions: aiPayload?.styleOptions?.length ? aiPayload.styleOptions : fallbackStyleOptions,
  }
}

function buildVisualProposal(originalIntent: string, direction: string, regenerate: boolean) {
  const prefix = regenerate ? '我重新整理了一版画面方向：' : '我先整理出一版画面方向：'
  return `${prefix}${originalIntent.trim()}，整体风格偏${direction}，强调主体清晰、构图完整、画面层次明确。`
}

function buildExecutionPrompt(
  basePrompt: string,
  direction: string,
  regenerate: boolean,
  attachedImageUrls?: string[],
) {
  const polishHint = regenerate ? '请换一个构图思路，但保留核心主题。' : '请保留用户原始主题，并补足镜头、光线和质感细节。'
  const imageHint =
    attachedImageUrls && attachedImageUrls.length > 0
      ? '\n参考图约束：请保留参考图中的主体关系、关键构图和核心视觉元素。'
      : ''
  return `${basePrompt.trim()}\n\n风格方向：${direction}\n要求：${polishHint}${imageHint}`
}

function ensureText(value: string | undefined, fallback: string) {
  return value?.trim() ? value.trim() : fallback
}
