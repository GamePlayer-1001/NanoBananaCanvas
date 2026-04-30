/**
 * [INPUT]: 依赖 zod
 * [OUTPUT]: 对外提供 Agent planner 请求/响应 schema，与共享 operation schema
 * [POS]: lib/validations 的 Agent 结构化校验层，被 API route 与前端 buildAgentPlan 共同消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { z } from 'zod'

const promptStyleOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  promptDelta: z.string().min(1),
})

const promptConfirmationPayloadSchema = z.object({
  id: z.string().min(1),
  originalIntent: z.string().min(1),
  visualProposal: z.string().min(1),
  executionPrompt: z.string().min(1),
  styleOptions: z.array(promptStyleOptionSchema).optional(),
})

const canvasSummaryNodeSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  label: z.string().min(1),
  inputs: z.array(
    z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      type: z.string().min(1),
      required: z.boolean().optional(),
    }),
  ),
  outputs: z.array(
    z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      type: z.string().min(1),
      required: z.boolean().optional(),
    }),
  ),
  configSummary: z.record(z.string(), z.unknown()),
})

const workflowOperationSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('add_node'),
    nodeId: z.string().min(1).optional(),
    nodeType: z.string().min(1),
    position: z.object({ x: z.number(), y: z.number() }).optional(),
    initialData: z.record(z.string(), z.unknown()).optional(),
  }),
  z.object({
    type: z.literal('update_node_data'),
    nodeId: z.string().min(1),
    patch: z.record(z.string(), z.unknown()),
  }),
  z.object({
    type: z.literal('remove_node'),
    nodeId: z.string().min(1),
  }),
  z.object({
    type: z.literal('connect'),
    source: z.string().min(1),
    sourceHandle: z.string().optional(),
    target: z.string().min(1),
    targetHandle: z.string().optional(),
  }),
  z.object({
    type: z.literal('disconnect'),
    edgeId: z.string().min(1),
  }),
  z.object({
    type: z.literal('focus_nodes'),
    nodeIds: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    type: z.literal('request_prompt_confirmation'),
    payload: promptConfirmationPayloadSchema,
  }),
  z.object({
    type: z.literal('run_workflow'),
    scope: z.enum(['all', 'from-node']).optional(),
    nodeId: z.string().optional(),
  }),
])

export const agentPlanSchema = z.object({
  id: z.string().min(1),
  goal: z.string().min(1),
  mode: z.enum(['create', 'update', 'diagnose', 'optimize']),
  summary: z.string().min(1),
  reasons: z.array(z.string().min(1)).min(1),
  requiresConfirmation: z.boolean(),
  operations: z.array(workflowOperationSchema),
  promptConfirmation: promptConfirmationPayloadSchema.optional(),
})

export const agentPlanRequestSchema = z.object({
  userMessage: z.string().trim().min(1),
  mode: z.enum(['create', 'update', 'diagnose', 'optimize']),
  locale: z.string().trim().min(1),
  canvasSummary: z.object({
    workflowId: z.string().min(1),
    workflowName: z.string().optional(),
    nodeCount: z.number().int().nonnegative(),
    edgeCount: z.number().int().nonnegative(),
    selectedNodeId: z.string().optional(),
    selectedNodeType: z.string().optional(),
    selectedNodeLabel: z.string().optional(),
    nodes: z.array(canvasSummaryNodeSchema),
    disconnectedNodeIds: z.array(z.string()),
    displayMissingForNodeIds: z.array(z.string()),
    latestExecution: z
      .object({
        status: z.enum(['idle', 'running', 'completed', 'failed']),
        failedNodeId: z.string().optional(),
        failedReason: z.string().optional(),
      })
      .optional(),
  }),
})

export const agentPlanResponseSchema = z.object({
  ok: z.literal(true),
  data: z.object({
    plan: agentPlanSchema,
  }),
})

export type AgentPlanRequestInput = z.infer<typeof agentPlanRequestSchema>
export type AgentPlanOutput = z.infer<typeof agentPlanSchema>
