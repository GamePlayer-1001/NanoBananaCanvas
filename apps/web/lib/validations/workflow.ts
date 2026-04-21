/**
 * [INPUT]: 依赖 zod 的 z
 * [OUTPUT]: 对外提供 createWorkflowSchema, updateWorkflowSchema, publishWorkflowSchema, saveWorkflowDataSchema
 * [POS]: lib/validations 的工作流表单验证，被工作流 CRUD 和 API 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { z } from 'zod'

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
})

export const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  data: z.string().optional(),
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
