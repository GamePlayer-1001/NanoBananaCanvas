/**
 * [INPUT]: 依赖 @nano-banana/shared 的 AsyncTaskType,
 *          依赖 @/lib/billing/ledger 的 confirmFrozenCredits/freezeCredits/refundFrozenCredits,
 *          依赖 @/lib/billing/metering 的 estimateBillableUnits/estimateCreditsFromUsage/getModelPricing,
 *          依赖 @/lib/billing/workflow-pricing 的 getWorkflowImagePriceForSize,
 *          依赖 @/lib/tasks/processors 的 TaskOutput,
 *          依赖 @/lib/tasks/service-types 的 ReservedTaskBillingDraft/TaskBillingInput,
 *          依赖 @/lib/tasks/service-output 的 resolveImagePriceTierFromOutput
 * [OUTPUT]: 对外提供任务积分冻结/确认/退款与计费草案估算
 * [POS]: lib/tasks 的计费子模块，从 service.ts 拆出的积分结算与计费估算逻辑
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { AsyncTaskType } from '@nano-banana/shared'

import {
  confirmFrozenCredits,
  freezeCredits,
  refundFrozenCredits,
} from '@/lib/billing/ledger'
import {
  estimateBillableUnits,
  estimateCreditsFromUsage,
  getModelPricing,
  type BillableUsageEstimate,
} from '@/lib/billing/metering'
import { getWorkflowImagePriceForSize } from '@/lib/billing/workflow-pricing'

import type { TaskOutput } from './processors'
import { resolveImagePriceTierFromOutput } from './service-output'
import type { ReservedTaskBillingDraft, TaskBillingInput } from './service-types'

/* ─── Credit Helpers ──────────────────────────────── */

export function getReservedTaskCredits(input: Record<string, unknown>): number {
  const billingDraft = (input as TaskBillingInput).billingDraft
  const estimatedCredits = billingDraft?.estimatedCredits

  if (typeof estimatedCredits !== 'number' || !Number.isFinite(estimatedCredits) || estimatedCredits <= 0) {
    return 0
  }

  return Math.round(estimatedCredits)
}

export async function refundTaskCredits(input: {
  userId: string
  referenceId: string
  source: string
  description: string
  requestedCredits?: number
  db?: D1Database
}) {
  await refundFrozenCredits({
    userId: input.userId,
    referenceId: input.referenceId,
    requestedCredits: input.requestedCredits,
    source: input.source,
    description: input.description,
    db: input.db,
  })
}

/* ─── Completed Task Settlement ──────────────────── */

export async function resolveCompletedImageTaskCredits(
  db: D1Database,
  input: {
    provider: string
    modelId: string
    taskInput: Record<string, unknown>
    output: TaskOutput
  },
): Promise<number | null> {
  const requestedSize =
    typeof input.taskInput.size === 'string' ? input.taskInput.size : 'auto'
  const pricing = await getModelPricing(db, {
    provider: input.provider,
    modelId: input.modelId,
    activeOnly: false,
  })

  if (requestedSize !== 'auto') {
    return getWorkflowImagePriceForSize({
      modelId: input.modelId,
      modelName: pricing?.modelName,
      size: requestedSize as '1k' | '2k' | '4k' | '8k',
    })
  }

  const actualTier = resolveImagePriceTierFromOutput(input.output)
  if (!actualTier) {
    return null
  }

  return getWorkflowImagePriceForSize({
    modelId: input.modelId,
    modelName: pricing?.modelName,
    size: actualTier,
  })
}

export async function settleCompletedPlatformImageTask(input: {
  db: D1Database
  userId: string
  taskId: string
  provider: string
  modelId: string
  taskInput: Record<string, unknown>
  output: TaskOutput
}) {
  const reservedCredits = getReservedTaskCredits(input.taskInput)
  const actualCredits = await resolveCompletedImageTaskCredits(input.db, {
    provider: input.provider,
    modelId: input.modelId,
    taskInput: input.taskInput,
    output: input.output,
  })

  if (actualCredits == null) {
    if (reservedCredits > 0) {
      await confirmFrozenCredits({
        userId: input.userId,
        referenceId: input.taskId,
        requestedCredits: reservedCredits,
        source: 'task_platform_confirm',
        description: `Confirm async task billing image_gen ${input.provider}/${input.modelId}`,
        db: input.db,
      })
    }
    return
  }

  if (actualCredits > reservedCredits) {
    await freezeCredits({
      userId: input.userId,
      requestedCredits: actualCredits - reservedCredits,
      referenceId: input.taskId,
      source: 'task_platform_adjust',
      description: `Freeze additional credits for completed image task ${input.provider}/${input.modelId}`,
      db: input.db,
    })
  }

  await confirmFrozenCredits({
    userId: input.userId,
    referenceId: input.taskId,
    requestedCredits: actualCredits,
    source: 'task_platform_confirm',
    description: `Confirm async task billing image_gen ${input.provider}/${input.modelId}`,
    db: input.db,
  })

  if (actualCredits < reservedCredits) {
    await refundTaskCredits({
      userId: input.userId,
      referenceId: input.taskId,
      requestedCredits: reservedCredits - actualCredits,
      source: 'task_platform_refund',
      description: `Refund unused reserved credits for completed image task ${input.provider}/${input.modelId}`,
      db: input.db,
    })
  }
}

/* ─── Billing Draft Estimation ───────────────────── */

export async function estimateTaskBillingDraft(
  db: D1Database,
  input: {
    provider: string
    modelId: string
    taskType: AsyncTaskType
    taskInput: Record<string, unknown>
  },
): Promise<ReservedTaskBillingDraft> {
  if (input.taskType === 'image_gen') {
    const pricing = await getModelPricing(db, {
      provider: input.provider,
      modelId: input.modelId,
      activeOnly: false,
    })
    const size = typeof input.taskInput.size === 'string' ? input.taskInput.size : 'auto'
    const estimatedCredits = getWorkflowImagePriceForSize({
      modelId: input.modelId,
      modelName: pricing?.modelName,
      size: size as 'auto' | '1k' | '2k' | '4k' | '8k',
    })

    return {
      mode: 'reserved',
      inputTokens: null,
      outputTokens: null,
      billableUnits: null,
      estimatedCredits,
      category: 'image',
      unitLabel: null,
      basis: size === 'auto' ? 'image_size_auto' : 'image_size_preset',
    }
  }

  const pricing = await getModelPricing(db, {
    provider: input.provider,
    modelId: input.modelId,
    activeOnly: false,
  })

  const estimate = estimateTaskBillableUnits(input.taskType, pricing?.category, input.taskInput)
  return {
    mode: 'reserved',
    inputTokens: null,
    outputTokens: null,
    billableUnits: estimate.billableUnits,
    estimatedCredits:
      pricing
        ? estimateCreditsFromUsage({
            billableUnits: estimate.billableUnits,
            creditsPer1kUnits: pricing.creditsPer1kUnits,
          })
        : null,
    category: estimate.category,
    unitLabel: estimate.unitLabel,
    basis: estimate.basis,
  }
}

export function estimateTaskBillableUnits(
  taskType: AsyncTaskType,
  pricingCategory: string | undefined,
  taskInput: Record<string, unknown>,
): BillableUsageEstimate {
  if (taskType === 'image_gen') {
    return estimateBillableUnits({
      category: (pricingCategory as 'image' | undefined) ?? 'image',
      outputCount:
        typeof taskInput.count === 'number'
          ? taskInput.count
          : typeof taskInput.n === 'number'
            ? taskInput.n
            : 1,
    })
  }

  if (taskType === 'video_gen') {
    return estimateBillableUnits({
      category: (pricingCategory as 'video' | undefined) ?? 'video',
      durationSeconds:
        typeof taskInput.duration === 'string' || typeof taskInput.duration === 'number'
          ? taskInput.duration
          : 5,
    })
  }

  return estimateBillableUnits({
    category: (pricingCategory as 'audio' | undefined) ?? 'audio',
    text: typeof taskInput.text === 'string' ? taskInput.text : '',
  })
}
