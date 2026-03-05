/**
 * [INPUT]: 依赖 @/lib/errors
 * [OUTPUT]: 对外提供 getModelPricing / checkModelAccess
 * [POS]: lib/credits 的模型定价查询 + 套餐权限校验
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { AppError, ErrorCode } from '@/lib/errors'

/* ─── Types ──────────────────────────────────────────── */

export interface ModelPricing {
  id: string
  provider: string
  modelId: string
  modelName: string
  category: string
  creditsPerCall: number
  tier: string
  minPlan: string
  isActive: boolean
}

/* ─── Plan Hierarchy ─────────────────────────────────── */

const PLAN_RANK: Record<string, number> = {
  free: 0,
  standard: 1,
  pro: 2,
  ultimate: 3,
}

/* ─── Query ──────────────────────────────────────────── */

export async function getModelPricing(
  db: D1Database,
  provider: string,
  modelId: string,
): Promise<ModelPricing> {
  const row = await db
    .prepare(
      `SELECT id, provider, model_id, model_name, category, credits_per_call, tier, min_plan, is_active
       FROM model_pricing
       WHERE provider = ? AND model_id = ? AND is_active = 1`,
    )
    .bind(provider, modelId)
    .first<{
      id: string
      provider: string
      model_id: string
      model_name: string
      category: string
      credits_per_call: number
      tier: string
      min_plan: string
      is_active: number
    }>()

  if (!row) {
    throw new AppError(ErrorCode.AI_MODEL_UNAVAILABLE, `Model not found: ${provider}/${modelId}`)
  }

  return {
    id: row.id,
    provider: row.provider,
    modelId: row.model_id,
    modelName: row.model_name,
    category: row.category,
    creditsPerCall: row.credits_per_call,
    tier: row.tier,
    minPlan: row.min_plan,
    isActive: !!row.is_active,
  }
}

/* ─── Access Check ───────────────────────────────────── */

export function checkModelAccess(userPlan: string, modelMinPlan: string): void {
  const userRank = PLAN_RANK[userPlan] ?? 0
  const minRank = PLAN_RANK[modelMinPlan] ?? 0

  if (userRank < minRank) {
    throw new AppError(
      ErrorCode.AUTH_FORBIDDEN,
      `This model requires ${modelMinPlan} plan or above`,
      { userPlan, requiredPlan: modelMinPlan },
    )
  }
}
