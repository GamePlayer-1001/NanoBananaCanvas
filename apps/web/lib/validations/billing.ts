/**
 * [INPUT]: 依赖 zod
 * [OUTPUT]: 对外提供 checkoutSchema
 * [POS]: lib/validations 的计费操作验证，被 billing API 路由消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { z } from 'zod'

/* ─── Stripe Checkout 请求 ───────────────────────────── */

export const checkoutSchema = z.object({
  plan: z.enum(['standard', 'pro', 'ultimate'], {
    error: 'Plan is required',
  }),
  billingPeriod: z.enum(['monthly', 'yearly']).default('monthly'),
  currency: z.enum(['usd', 'cny']).default('usd'),
})
