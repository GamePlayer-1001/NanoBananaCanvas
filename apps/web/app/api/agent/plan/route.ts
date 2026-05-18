/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/agent/intent-resolver, @/lib/agent/operations-builder, @/lib/agent/plan-summary, @/lib/agent/plan-rules, @/lib/nanoid, @/lib/validations/agent，与 Agent 常量/类型
 * [OUTPUT]: 对外提供 POST /api/agent/plan，返回严格结构化的 AgentPlan
 * [POS]: api/agent 的首个 planner 端点，为右侧 Agent 面板提供稳定提案，不直接改动左侧画布
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { AGENT_MAX_AUTO_OPERATIONS } from '@/lib/agent/constants'
import {
  buildCreationMessage,
  buildPromptConfirmationPayload,
  inferIntentWithAssistant,
  inferWorkflowKind,
  inferWorkflowReferenceSketch,
  isWorkflowReferenceRequest,
} from '@/lib/agent/intent-resolver'
import {
  buildDiagnoseOperations,
  buildIncrementalOperations,
  buildWorkflowReferenceOperations,
} from '@/lib/agent/operations-builder'
import {
  buildCreationOperations,
  inferIntentFromMessage,
  inferModeFromMessage,
  isSafeCreationPlan,
  shouldBuildPromptConfirmation,
} from '@/lib/agent/plan-rules'
import { buildPlanAlternatives, buildReasons, buildSummary } from '@/lib/agent/plan-summary'
import { apiError, apiOk, handleApiError, withBodyLimit } from '@/lib/api/response'
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
  const workflowReferenceRequest = isWorkflowReferenceRequest(normalized, input.workflowReference)
  const workflowReferenceSketch = workflowReferenceRequest
    ? await inferWorkflowReferenceSketch(input).catch(() => null)
    : null
  const aiIntent = await inferIntentWithAssistant(input).catch(() => null)
  const workflowKind = aiIntent?.workflowKind ?? inferWorkflowKind(goal, input.attachments, input.workflowReference)
  const inferredMode = aiIntent?.mode ?? inferModeFromMessage(input.mode, normalized, canvas.nodeCount)
  const intent = aiIntent?.intent ?? inferIntentFromMessage(normalized, canvas, inferredMode)

  const operations =
    inferredMode === 'diagnose'
      ? buildDiagnoseOperations(canvas)
      : workflowReferenceRequest && canvas.nodeCount === 0
        ? buildWorkflowReferenceOperations(workflowReferenceSketch)
        : canvas.nodeCount === 0
          ? buildCreationOperations(buildCreationMessage(normalized, workflowKind))
          : buildIncrementalOperations(normalized, canvas, intent)

  const reasons = buildReasons(normalized, canvas, inferredMode, operations, intent, workflowReferenceRequest, workflowReferenceSketch)
  const safeCreationPlan = isSafeCreationPlan(inferredMode, canvas.nodeCount, operations)
  const requiresConfirmation =
    !safeCreationPlan &&
    (operations.length > AGENT_MAX_AUTO_OPERATIONS ||
      operations.some((op) =>
        op.type === 'insert_between' ||
        op.type === 'replace_node' ||
        op.type === 'duplicate_node_branch' ||
        op.type === 'batch_update_node_data' ||
        op.type === 'remove_node' ||
        op.type === 'request_prompt_confirmation' ||
        op.type === 'run_workflow',
      ))

  const plan: AgentPlan = {
    id: `plan_${nanoid()}`,
    goal,
    mode: inferredMode,
    intent,
    summary:
      aiIntent?.summary?.trim() ||
      buildSummary(normalized, canvas, inferredMode, operations, workflowReferenceRequest, workflowReferenceSketch),
    reasons: aiIntent?.reasons?.length ? aiIntent.reasons.slice(0, 3) : reasons,
    requiresConfirmation,
    operations,
    promptConfirmation: shouldBuildPromptConfirmation(normalized, intent, workflowKind, canvas.nodeCount)
      ? (await buildPromptConfirmationPayload(goal, workflowKind, input.attachments)) ??
        operations.find(
          (op): op is Extract<WorkflowOperation, { type: 'request_prompt_confirmation' }> =>
            op.type === 'request_prompt_confirmation',
        )?.payload
      : undefined,
    metadata: {
      workflowReferenceKind: input.workflowReference,
      workflowReferenceSummary: workflowReferenceSketch?.summary?.trim() || undefined,
      workflowReferenceNodeTypes: workflowReferenceSketch?.nodes?.map((node) => node.nodeType) ?? undefined,
    },
  }

  return { plan, alternatives: buildPlanAlternatives(plan, canvas) }
}
