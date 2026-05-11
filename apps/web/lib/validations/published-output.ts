/**
 * [INPUT]: 依赖 zod 的 z
 * [OUTPUT]: 对外提供 publishOutputSchema / importPublishedOutputSchema
 * [POS]: lib/validations 的公开作品表单验证，被 published output API 与批量导入脚本消费
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

export const importPublishedOutputSchema = z.object({
  importKey: z.string().min(1).max(200),
  title: z.string().min(1).max(120),
  description: z.string().max(1000).optional().default(''),
  prompt: z.string().max(8000).optional().default(''),
  sourceUrl: z.string().url().optional().or(z.literal('')).default(''),
  sourceType: z.enum(['civitai', 'manual', 'other']).default('manual'),
  sourceAuthorName: z.string().max(120).optional().default(''),
  sourceAuthorAvatar: z.string().url().optional().or(z.literal('')).default(''),
  thumbnailUrl: z.string().min(1),
  mediaUrl: z.string().min(1),
  mediaType: z.enum(['image', 'video']),
  workflowJsonUrl: z.string().url().optional().or(z.literal('')).default(''),
  workflowId: z.string().optional(),
  publishedAt: z.string().optional(),
  isPublic: z.boolean().optional().default(true),
})

export type PublishOutputInput = z.infer<typeof publishOutputSchema>
export type ImportPublishedOutputInput = z.infer<typeof importPublishedOutputSchema>
