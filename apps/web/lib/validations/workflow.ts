/**
 * [INPUT]: 依赖 zod 的 z
 * [OUTPUT]: 对外提供 createWorkflowSchema, updateWorkflowSchema
 * [POS]: lib/validations 的工作流表单验证，被工作流 CRUD 表单消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { z } from 'zod'

export const createWorkflowSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
})

export const updateWorkflowSchema = createWorkflowSchema.partial()

export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>
export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>
