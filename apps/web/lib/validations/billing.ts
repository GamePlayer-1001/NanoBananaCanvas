/**
 * [INPUT]: 依赖 zod，依赖 @/lib/billing/config 的枚举常量
 * [OUTPUT]: 对外提供 checkoutSchema / topupSchema，校验套餐 Checkout 与积分包充值的业务语义参数
 * [POS]: lib/validations 的计费请求校验入口，先把 plan/mode/packageId/currency 的语义边界锁死
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { z } from 'zod'

import { BILLING_CURRENCIES, BILLING_PLANS, CREDIT_PACK_IDS } from '@/lib/billing/config'

export const checkoutSchema = z.discriminatedUnion('purchaseMode', [
  z.object({
    purchaseMode: z.literal('plan_auto_monthly').default('plan_auto_monthly'),
    plan: z.enum(BILLING_PLANS),
    currency: z.enum(BILLING_CURRENCIES).optional(),
  }),
  z.object({
    purchaseMode: z.literal('plan_one_time'),
    plan: z.enum(BILLING_PLANS),
    currency: z.enum(BILLING_CURRENCIES).optional(),
  }),
  z.object({
    purchaseMode: z.literal('credit_pack'),
    packageId: z.enum(CREDIT_PACK_IDS),
    currency: z.enum(BILLING_CURRENCIES).optional(),
  }),
])

export type CheckoutInput = z.infer<typeof checkoutSchema>

export const topupSchema = z.object({
  packageId: z.enum(CREDIT_PACK_IDS),
  currency: z.enum(BILLING_CURRENCIES).optional(),
})

export type TopupInput = z.infer<typeof topupSchema>
