/**
 * [INPUT]: 依赖 zod 的 z
 * [OUTPUT]: 对外提供 reportSchema, ReportInput
 * [POS]: lib/validations 的举报表单验证，被 report API 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { z } from 'zod'

/* ─── Schema ────────────────────────────────────────── */

export const reportSchema = z.object({
  reason: z.enum(['spam', 'nsfw', 'copyright', 'other'], {
    required_error: 'Reason is required',
  }),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional(),
})

/* ─── Types ─────────────────────────────────────────── */

export type ReportInput = z.infer<typeof reportSchema>
