/**
 * [INPUT]: 依赖 zod，依赖 @/lib/billing/config 的枚举常量
 * [OUTPUT]: 对外提供 checkoutSchema，校验套餐 Checkout 的业务语义参数
 * [POS]: lib/validations 的计费请求校验入口，先把 plan/mode/currency 的语义边界锁死
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { z } from 'zod'

import { BILLING_CURRENCIES, BILLING_PLANS } from '@/lib/billing/config'

export const checkoutSchema = z.object({
  plan: z.enum(BILLING_PLANS),
  purchaseMode: z.enum(['plan_auto_monthly', 'plan_one_time']).default('plan_auto_monthly'),
  currency: z.enum(BILLING_CURRENCIES).optional(),
})

export type CheckoutInput = z.infer<typeof checkoutSchema>
