/**
 * [INPUT]: 依赖 zod 的 z
 * [OUTPUT]: 对外提供 createWorkflowSchema, updateWorkflowSchema, publishWorkflowSchema, saveWorkflowDataSchema
 * [POS]: lib/validations 的工作流表单验证，被工作流 CRUD、模板元数据写入与 API 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { z } from 'zod'

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

/* ─── Create / Update ────────────────────────────────── */

export const createWorkflowSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
  data: z.string().optional(),
  template: templateSummarySchema.optional(),
  auditTrail: z.array(workflowAuditEntrySchema).optional(),
})

export const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  data: z.string().optional(),
  template: templateSummarySchema.optional(),
  auditTrail: z.array(workflowAuditEntrySchema).optional(),
  folder_id: z.string().nullable().optional(),
})

/* ─── Publish ────────────────────────────────────────── */

export const publishWorkflowSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  thumbnail: z.string().optional(),
})

/* ─── Types ──────────────────────────────────────────── */

export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>
export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>
export type PublishWorkflowInput = z.infer<typeof publishWorkflowSchema>
