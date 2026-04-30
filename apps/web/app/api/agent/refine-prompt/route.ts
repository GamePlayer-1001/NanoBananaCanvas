/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/nanoid, @/lib/validations/agent
 * [OUTPUT]: 对外提供 POST /api/agent/refine-prompt，返回 PromptConfirmationPayload
 * [POS]: api/agent 的提示词确认端点，为图片工作流提供原始意图 / 画面提案 / 执行 prompt 三段结构
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
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
    const payload = buildPromptPayload(input)
    return apiOk({ payload })
  } catch (error) {
    return handleApiError(error)
  }
}

function buildPromptPayload(
  input: ReturnType<typeof promptConfirmationRequestSchema.parse>,
) {
  const direction = input.styleDirection?.trim() || '默认'
  const basePrompt = input.executionPrompt?.trim() || input.originalIntent.trim()

  return {
    id: `prompt_${nanoid()}`,
    originalIntent: input.originalIntent.trim(),
    visualProposal: buildVisualProposal(input.originalIntent, direction, Boolean(input.regenerate)),
    executionPrompt: buildExecutionPrompt(basePrompt, direction, Boolean(input.regenerate)),
    styleOptions: [
      { id: 'realistic', label: '更写实', promptDelta: '强调真实摄影、镜头语言、自然光和材质细节' },
      { id: 'anime', label: '更动漫', promptDelta: '强调二次元角色造型、线稿、色块和镜头张力' },
      { id: 'commercial', label: '更商业', promptDelta: '强调品牌视觉、主商品突出、广告级构图和高级质感' },
    ],
  }
}

function buildVisualProposal(originalIntent: string, direction: string, regenerate: boolean) {
  const prefix = regenerate ? '我重新整理了一版画面方向：' : '我先整理出一版画面方向：'
  return `${prefix}${originalIntent.trim()}，整体风格偏${direction}，强调主体清晰、构图完整、画面层次明确。`
}

function buildExecutionPrompt(basePrompt: string, direction: string, regenerate: boolean) {
  const polishHint = regenerate ? '请换一个构图思路，但保留核心主题。' : '请保留用户原始主题，并补足镜头、光线和质感细节。'
  return `${basePrompt.trim()}\n\n风格方向：${direction}\n要求：${polishHint}`
}

