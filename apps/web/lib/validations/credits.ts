/**
 * [INPUT]: 依赖 zod
 * [OUTPUT]: 对外提供 creditTransactionsQuerySchema / topupSchema / usageQuerySchema
 * [POS]: lib/validations 的积分查询验证，被 credits API 路由消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { z } from 'zod'

/* ─── 交易历史查询 ───────────────────────────────────── */

export const creditTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  type: z.enum(['earn', 'spend', 'freeze', 'unfreeze', 'refund']).optional(),
})

/* ─── 积分包购买 ─────────────────────────────────────── */

export const topupSchema = z.object({
  packageId: z.string().min(1, 'Package ID is required'),
  currency: z.enum(['usd', 'cny']).default('usd'),
})

/* ─── 使用统计查询 ───────────────────────────────────── */

export const usageQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(30).default(7),
})
