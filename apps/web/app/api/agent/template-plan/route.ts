/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/nanoid, @/lib/validations/agent，与模板目录真相源
 * [OUTPUT]: 对外提供 POST /api/agent/template-plan，返回基于模板改造的严格结构化 AgentPlan
 * [POS]: api/agent 的模板改造 planner 端点，为模板对话化链路提供专用提案入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { apiError, apiOk, handleApiError, withBodyLimit } from '@/lib/api/response'
import { getWorkflowTemplateById } from '@/lib/agent/template-catalog'
import { nanoid } from '@/lib/nanoid'
import { agentPlanRequestSchema, agentPlanSchema } from '@/lib/validations/agent'
import type { AgentPlan, AgentPlanRequest, WorkflowOperation } from '@/lib/agent/types'

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
    const plan = buildTemplatePlan(input as AgentPlanRequest)
    return apiOk({ plan: agentPlanSchema.parse(plan) })
  } catch (error) {
    return handleApiError(error)
  }
}

function buildTemplatePlan(input: AgentPlanRequest): AgentPlan {
  const goal = input.userMessage.trim()
  const template =
    input.canvasSummary.template ??
    (input.canvasSummary.templateContext?.sourceTemplate
      ? getWorkflowTemplateById(input.canvasSummary.templateContext.sourceTemplate.id)
      : null)

  if (!template) {
    throw new Error('当前工作流没有模板上下文，无法生成模板改造提案。')
  }

  const direction = inferDirection(goal)
  const outputCount = inferOutputCount(goal, template.defaultOutputSpec?.count ?? 4)
  const aspectRatio = inferAspectRatio(goal, template.defaultOutputSpec?.aspectRatio ?? '1:1')
  const model = inferModel(goal, template.defaultModel ?? 'openai/dall-e-3')

  const imageNode = input.canvasSummary.nodes.find((node) => node.type === 'image-gen')
  const promptNode = input.canvasSummary.nodes.find((node) => node.type === 'llm' || node.type === 'text-input')

  const operations: WorkflowOperation[] = []

  if (promptNode) {
    operations.push({
      type: 'update_node_data',
      nodeId: promptNode.id,
      patch: {
        config: {
          text: `请将模板“${template.name}”改造成${direction}，并突出 ${inferIndustry(goal)} 场景下的核心卖点、构图与转化导向。`,
        },
      },
    })
  }

  if (imageNode) {
    operations.push({
      type: 'batch_update_node_data',
      nodeIds: [imageNode.id],
      patch: {
        config: {
          platformModel: model,
          aspectRatio,
          outputCount,
        },
      },
    })
  }

  if (promptNode) {
    operations.push({
      type: 'annotate_change',
      nodeId: promptNode.id,
      note: `模板已改造成${direction}，并同步调整提示词语义。`,
    })
  }

  operations.push({
    type: 'focus_nodes',
    nodeIds: [promptNode?.id, imageNode?.id].filter(Boolean) as string[],
  })

  return {
    id: `plan_${nanoid()}`,
    goal,
    mode: 'template',
    intent: 'adapt_template',
    summary: `基于模板“${template.name}”生成一份面向${direction}的改造提案。`,
    reasons: [
      `保留模板主链，只改造更贴近${inferIndustry(goal)}场景的 prompt、模型与输出规格。`,
      `把输出规格同步到 ${outputCount} 个结果、比例 ${aspectRatio}，方便直接继续测试。`,
    ],
    requiresConfirmation: true,
    operations,
    templateContext: {
      sourceTemplate: template,
      adaptationDirection: direction,
      currentFocus: inferIndustry(goal),
      lastAuditEntry: input.canvasSummary.auditTrail?.at(-1),
    },
  }
}

function inferDirection(goal: string) {
  const normalized = goal.toLowerCase()
  if (normalized.includes('服装')) return '适合服装商品的商品图方向'
  if (normalized.includes('美妆')) return '适合美妆推广的精致商业方向'
  if (normalized.includes('3c')) return '适合 3C 产品展示的科技感方向'
  if (normalized.includes('视频')) return '适合短视频投放的动态脚本方向'
  return '更贴近目标行业与风格的商业化方向'
}

function inferIndustry(goal: string) {
  if (goal.includes('服装')) return '服装'
  if (goal.includes('美妆')) return '美妆'
  if (goal.toLowerCase().includes('3c')) return '3C'
  if (goal.includes('家居')) return '家居'
  return '目标行业'
}

function inferOutputCount(goal: string, fallback: number) {
  if (goal.includes('4个') || goal.includes('四个')) return 4
  if (goal.includes('6个') || goal.includes('六个')) return 6
  return fallback
}

function inferAspectRatio(goal: string, fallback: string) {
  if (goal.includes('竖版')) return '3:4'
  if (goal.includes('横版')) return '16:9'
  return fallback
}

function inferModel(goal: string, fallback: string) {
  if (goal.includes('更便宜')) return 'openai/gpt-image-1-mini'
  return fallback
}
