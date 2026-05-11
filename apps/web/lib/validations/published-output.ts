/**
 * [INPUT]: 依赖 zod 的 z
 * [OUTPUT]: 对外提供 publishOutputSchema
 * [POS]: lib/validations 的公开生成作品表单验证，被 published output API 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { z } from 'zod'

export const publishOutputSchema = z.object({
  taskId: z.string().min(1, 'Task id is required'),
  title: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
  prompt: z.string().max(8000).optional(),
  sourceUrl: z.string().url().optional().or(z.literal('')),
  thumbnail: z.string().optional(),
})

export type PublishOutputInput = z.infer<typeof publishOutputSchema>
