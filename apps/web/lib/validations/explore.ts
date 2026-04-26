/**
 * [INPUT]: 依赖 zod 的 z
 * [OUTPUT]: 对外提供 exploreQuerySchema, searchQuerySchema 及对应类型
 * [POS]: lib/validations 的广场查询验证，被 explore/search API 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { z } from 'zod'

/* ─── Explore ───────────────────────────────────────── */

export const exploreTypeSchema = z.enum(['all', 'video', 'image', 'workflow'])

export const exploreQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  category: z.string().optional(),
  sort: z.enum(['latest', 'popular', 'most-liked']).default('latest'),
  type: exploreTypeSchema.default('all'),
})

export type ExploreQuery = z.infer<typeof exploreQuerySchema>

/* ─── Search ────────────────────────────────────────── */

export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export type SearchQuery = z.infer<typeof searchQuerySchema>
