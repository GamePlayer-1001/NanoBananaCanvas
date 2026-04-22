/**
 * [INPUT]: 依赖 ./config 的 BillingPlan / CreditPackId 类型
 * [OUTPUT]: 对外提供套餐与积分包权益真相源、默认 Free 权益与 snapshot 查询器
 * [POS]: lib/billing 的权益语义层，把 Standard/Pro/Ultimate 与 credit_pack 的本地镜像收口在一处
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { BillingPlan, CreditPackId } from './config'

export interface BillingPlanSnapshot {
  plan: BillingPlan | 'free'
  monthlyCredits: number
  storageGB: number
}

export interface CreditPackSnapshot {
  packageId: CreditPackId
  credits: number
  bonusCredits: number
  totalCredits: number
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

export const BILLING_CREDIT_PACK_SNAPSHOTS: Record<CreditPackId, CreditPackSnapshot> = {
  '500': {
    packageId: '500',
    credits: 500,
    bonusCredits: 0,
    totalCredits: 500,
  },
  '1200': {
    packageId: '1200',
    credits: 1000,
    bonusCredits: 200,
    totalCredits: 1200,
  },
  '3500': {
    packageId: '3500',
    credits: 2500,
    bonusCredits: 1000,
    totalCredits: 3500,
  },
  '8000': {
    packageId: '8000',
    credits: 5000,
    bonusCredits: 3000,
    totalCredits: 8000,
  },
}

export function getBillingPlanSnapshot(plan: BillingPlan): BillingPlanSnapshot {
  return BILLING_PLAN_SNAPSHOTS[plan]
}

export function getCreditPackSnapshot(packageId: CreditPackId): CreditPackSnapshot {
  return BILLING_CREDIT_PACK_SNAPSHOTS[packageId]
}
