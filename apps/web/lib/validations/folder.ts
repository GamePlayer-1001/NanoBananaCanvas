/**
 * [INPUT]: 依赖 zod 的 z
 * [OUTPUT]: 对外提供 createFolderSchema, updateFolderSchema
 * [POS]: lib/validations 的文件夹表单验证，被 folders CRUD API 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { z } from 'zod'

/* ─── Create / Update ────────────────────────────────── */

export const createFolderSchema = z.object({
  name: z
    .string()
    .min(1, 'Folder name is required')
    .max(50, 'Folder name must be 50 characters or less')
    .transform((s) => s.trim())
    .optional()
    .default('New Folder'),
})

export const updateFolderSchema = z.object({
  name: z
    .string()
    .min(1, 'Folder name is required')
    .max(50, 'Folder name must be 50 characters or less')
    .transform((s) => s.trim()),
})

/* ─── Types ──────────────────────────────────────────── */

export type CreateFolderInput = z.infer<typeof createFolderSchema>
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>
