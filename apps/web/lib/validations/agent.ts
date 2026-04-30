/**
 * [INPUT]: 依赖 zod
 * [OUTPUT]: 对外提供 Agent planner / diagnose / explain / prompt refine schema，与共享 operation schema
 * [POS]: lib/validations 的 Agent 结构化校验层，被 API route 与前端 Agent 客户端共同消费
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
  targetNodeId: z.string().min(1).optional(),
  styleOptions: z.array(promptStyleOptionSchema).optional(),
})

const templateSummarySchema = z.object({
  id: z.string().min(1),
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  goal: z.string().min(1),
  category: z.string().min(1),
  targetAudience: z.array(z.string().min(1)),
  applicableIndustries: z.array(z.string().min(1)),
  recommendedStyles: z.array(z.string().min(1)),
  defaultPrompt: z.string().min(1).optional(),
  defaultModel: z.string().min(1).optional(),
  defaultOutputSpec: z
    .object({
      modality: z.enum(['text', 'image', 'video', 'audio', 'mixed']).optional(),
      count: z.number().int().positive().optional(),
      aspectRatio: z.string().min(1).optional(),
    })
    .optional(),
  source: z.enum(['system-template', 'user-template']),
  createdFromWorkflowId: z.string().min(1).optional(),
})

const workflowAuditEntrySchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['template-created', 'template-adapted']),
  message: z.string().min(1),
  createdAt: z.string().min(1),
  actor: z.enum(['agent', 'user']),
  templateId: z.string().min(1).optional(),
  templateName: z.string().min(1).optional(),
  adaptationGoal: z.string().min(1).optional(),
})

const templateConversationSummarySchema = z.object({
  sourceTemplate: templateSummarySchema,
  adaptationDirection: z.string().min(1).optional(),
  currentFocus: z.string().min(1).optional(),
  lastAuditEntry: workflowAuditEntrySchema.optional(),
})

const canvasRecentTimelineEntrySchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['template', 'agent', 'execution', 'result']),
  summary: z.string().min(1),
  createdAt: z.string().min(1).optional(),
})

const canvasClusterSummarySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  nodeIds: z.array(z.string().min(1)).min(1),
  nodeTypes: z.array(z.string().min(1)).min(1),
  summary: z.string().min(1),
})

const canvasSubchainSummarySchema = z.object({
  id: z.string().min(1),
  nodeIds: z.array(z.string().min(1)).min(1),
  summary: z.string().min(1),
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

const agentSelectionContextSchema = z.object({
  nodeId: z.string().min(1).optional(),
  nodeType: z.string().min(1).optional(),
  nodeLabel: z.string().min(1).optional(),
  inputs: z.array(
    z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      type: z.string().min(1),
      required: z.boolean().optional(),
    }),
  ).optional(),
  outputs: z.array(
    z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      type: z.string().min(1),
      required: z.boolean().optional(),
    }),
  ).optional(),
  keyConfig: z.record(z.string(), z.unknown()).optional(),
  latestResultSummary: z.string().min(1).optional(),
  latestResultKind: z.enum(['image', 'video', 'audio', 'text']).optional(),
  executionStatus: z.enum(['idle', 'running', 'completed', 'failed']).optional(),
  executionHint: z.string().min(1).optional(),
})

const canvasOptimizationSignalsSchema = z.object({
  aiNodeCount: z.number().int().nonnegative(),
  expensiveModelNodeIds: z.array(z.string().min(1)),
  slowNodeIds: z.array(z.string().min(1)),
  redundantNodeGroups: z.array(
    z.object({
      type: z.string().min(1),
      nodeIds: z.array(z.string().min(1)).min(1),
    }),
  ),
  previewEnabledNodeIds: z.array(z.string().min(1)),
  missingDisplayNodeIds: z.array(z.string().min(1)),
  missingMergeCandidateNodeIds: z.array(z.string().min(1)),
  estimatedCostLevel: z.enum(['low', 'medium', 'high']),
  estimatedLatencyLevel: z.enum(['low', 'medium', 'high']),
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
    type: z.literal('insert_between'),
    source: z.string().min(1),
    target: z.string().min(1),
    nodeId: z.string().min(1).optional(),
    nodeType: z.string().min(1),
    initialData: z.record(z.string(), z.unknown()).optional(),
    sourceHandle: z.string().optional(),
    targetHandle: z.string().optional(),
  }),
  z.object({
    type: z.literal('replace_node'),
    nodeId: z.string().min(1),
    nextNodeType: z.string().min(1),
    configPatch: z.record(z.string(), z.unknown()).optional(),
    preserveConfigKeys: z.array(z.string().min(1)).optional(),
  }),
  z.object({
    type: z.literal('duplicate_node_branch'),
    nodeId: z.string().min(1),
    count: z.number().int().min(1).max(8),
    strategy: z.enum(['parallel-variants', 'style-variants']).optional(),
  }),
  z.object({
    type: z.literal('batch_update_node_data'),
    nodeIds: z.array(z.string().min(1)).min(1),
    patch: z.record(z.string(), z.unknown()),
  }),
  z.object({
    type: z.literal('relabel_node'),
    nodeId: z.string().min(1),
    label: z.string().min(1),
  }),
  z.object({
    type: z.literal('annotate_change'),
    nodeId: z.string().min(1),
    note: z.string().min(1),
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
  mode: z.enum(['create', 'update', 'repair', 'diagnose', 'optimize', 'extend', 'template']),
  intent: z
    .enum([
      'create_workflow',
      'adapt_template',
      'add_step',
      'split_step',
      'replace_model',
      'change_output_count',
      'add_branch',
      'repair_flow',
      'optimize_cost',
      'optimize_speed',
      'optimize_structure',
      'explain_flow',
    ])
    .optional(),
  variantLabel: z.string().min(1).optional(),
  variantTone: z.enum(['balanced', 'conservative', 'aggressive', 'cheaper', 'higher-quality']).optional(),
  summary: z.string().min(1),
  reasons: z.array(z.string().min(1)).min(1),
  requiresConfirmation: z.boolean(),
  operations: z.array(workflowOperationSchema),
  promptConfirmation: promptConfirmationPayloadSchema.optional(),
  templateContext: templateConversationSummarySchema.optional(),
})

export const agentPlanRequestSchema = z.object({
  userMessage: z.string().trim().min(1),
  mode: z.enum(['create', 'update', 'repair', 'diagnose', 'optimize', 'extend', 'template']),
  locale: z.string().trim().min(1),
  canvasSummary: z.object({
    workflowId: z.string().min(1),
    workflowName: z.string().optional(),
    workflowGoal: z.string().min(1).optional(),
    nodeCount: z.number().int().nonnegative(),
    edgeCount: z.number().int().nonnegative(),
    selectedNodeId: z.string().optional(),
    selectedNodeType: z.string().optional(),
    selectedNodeLabel: z.string().optional(),
    selectionContext: agentSelectionContextSchema.optional(),
    nodes: z.array(canvasSummaryNodeSchema),
    disconnectedNodeIds: z.array(z.string()),
    displayMissingForNodeIds: z.array(z.string()),
    assets: z
      .array(
        z.object({
          id: z.string().min(1),
          kind: z.enum(['image', 'video', 'audio', 'text']),
          sourceNodeId: z.string().min(1),
          summary: z.string().min(1),
        }),
      )
      .optional(),
    latestSuccessfulAsset: z
      .object({
        id: z.string().min(1),
        kind: z.enum(['image', 'video', 'audio', 'text']),
        sourceNodeId: z.string().min(1),
        summary: z.string().min(1),
      })
      .optional(),
    assetSummary: z.string().min(1).optional(),
    diagnosisSummary: z.string().min(1).optional(),
    clusters: z.array(canvasClusterSummarySchema).optional(),
    subchains: z.array(canvasSubchainSummarySchema).optional(),
    recentTimeline: z.array(canvasRecentTimelineEntrySchema).optional(),
    template: templateSummarySchema.optional(),
    auditTrail: z.array(workflowAuditEntrySchema).optional(),
    templateContext: templateConversationSummarySchema.optional(),
    optimizationSignals: canvasOptimizationSignalsSchema.optional(),
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
    alternatives: z.array(agentPlanSchema).optional(),
  }),
})

export const agentTemplatePlanResponseSchema = agentPlanResponseSchema

export const promptConfirmationRequestSchema = z.object({
  originalIntent: z.string().trim().min(1),
  executionPrompt: z.string().trim().optional(),
  styleDirection: z.string().trim().optional(),
  regenerate: z.boolean().optional(),
})

export const promptConfirmationResponseSchema = z.object({
  ok: z.literal(true),
  data: z.object({
    payload: promptConfirmationPayloadSchema,
  }),
})

const agentDiagnosisSchema = z.object({
  summary: z.string().min(1),
  phenomenon: z.string().min(1),
  rootCause: z.string().min(1),
  repairSuggestion: z.string().min(1),
  affectedNodeIds: z.array(z.string().min(1)),
  suggestedOperations: z.array(workflowOperationSchema).optional(),
  requiresConfirmation: z.boolean(),
  dimension: z.enum(['cost', 'speed', 'structure', 'runtime']).optional(),
  riskSummary: z.string().min(1).optional(),
  optimizationProposal: z
    .object({
      issue: z.string().min(1),
      cause: z.string().min(1),
      proposal: z.string().min(1),
      risk: z.string().min(1),
    })
    .optional(),
})

export const agentDiagnosisRequestSchema = z.object({
  userMessage: z.string().trim().min(1),
  locale: z.string().trim().min(1),
  canvasSummary: agentPlanRequestSchema.shape.canvasSummary,
})

export const agentDiagnosisResponseSchema = z.object({
  ok: z.literal(true),
  data: z.object({
    diagnosis: agentDiagnosisSchema,
  }),
})

export const agentExplainRequestSchema = z.object({
  userMessage: z.string().trim().min(1),
  locale: z.string().trim().min(1),
  canvasSummary: agentPlanRequestSchema.shape.canvasSummary,
})

export const agentExplainResponseSchema = z.object({
  ok: z.literal(true),
  data: z.object({
    answer: z.string().min(1),
  }),
})

export type AgentPlanRequestInput = z.infer<typeof agentPlanRequestSchema>
export type AgentPlanOutput = z.infer<typeof agentPlanSchema>
