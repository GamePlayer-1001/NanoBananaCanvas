/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供套餐权益真相源、默认 Free 权益与 plan 元数据查询
 * [POS]: lib/billing 的套餐语义层，把 Standard/Pro/Ultimate 的本地权益镜像收口在一处
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { BillingPlan } from './config'

export interface BillingPlanSnapshot {
  plan: BillingPlan | 'free'
  monthlyCredits: number
  storageGB: number
}

export const FREE_PLAN_SNAPSHOT: BillingPlanSnapshot = {
  plan: 'free',
  monthlyCredits: 0,
  storageGB: 1,
}

export const BILLING_PLAN_SNAPSHOTS: Record<BillingPlan, BillingPlanSnapshot> = {
  standard: {
    plan: 'standard',
    monthlyCredits: 1600,
    storageGB: 10,
  },
  pro: {
    plan: 'pro',
    monthlyCredits: 5400,
    storageGB: 50,
  },
  ultimate: {
    plan: 'ultimate',
    monthlyCredits: 17000,
    storageGB: 200,
  },
}

export function getBillingPlanSnapshot(plan: BillingPlan): BillingPlanSnapshot {
  return BILLING_PLAN_SNAPSHOTS[plan]
}
