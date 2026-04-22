/**
 * [INPUT]: 依赖 @/lib/errors，消费 D1Database、ai_usage 参数与任务输入载荷
 * [OUTPUT]: 对外提供 getModelPricing()、estimateBillableUnits()、estimateCreditsFromUsage()
 * [POS]: lib/billing 的计量真相源，统一文本/图片/视频/音频的 billable units 与 credits 预估口径
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { BillingError, ErrorCode } from '@/lib/errors'

export type BillingCategory = 'text' | 'image' | 'video' | 'audio'

export interface ModelPricingSnapshot {
  id: string
  provider: string
  modelId: string
  modelName: string
  category: BillingCategory
  creditsPer1kUnits: number
  tier: string
  minPlan: string
  isActive: boolean
}

export interface EstimateBillableUnitsInput {
  category: BillingCategory
  inputTokens?: number | null
  outputTokens?: number | null
  messages?: Array<{
    role?: string
    content?: unknown
  }>
  outputText?: string | null
  text?: string | null
  outputCount?: number | null
  durationSeconds?: number | string | null
}

export interface BillableUsageEstimate {
  category: BillingCategory
  billableUnits: number
  unitLabel: 'tokens' | 'characters' | 'generated_images' | 'video_seconds'
  basis:
    | 'token_usage'
    | 'message_char_estimate'
    | 'text_length'
    | 'image_count'
    | 'video_duration'
}

type ModelPricingRow = {
  id: string
  provider: string
  model_id: string
  model_name: string
  category: BillingCategory
  credits_per_1k_units: number
  tier: string
  min_plan: string
  is_active: number
}

function clampNonNegativeInteger(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0
  }

  return Math.round(value)
}

function normalizeOutputCount(value: number | null | undefined): number {
  return Math.max(1, clampNonNegativeInteger(value ?? 1))
}

function normalizeDurationSeconds(value: number | string | null | undefined): number {
  if (typeof value === 'number') {
    return Math.max(1, clampNonNegativeInteger(value))
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10)
    return Math.max(1, clampNonNegativeInteger(Number.isNaN(parsed) ? 5 : parsed))
  }

  return 5
}

function flattenMessageContent(content: unknown): string {
  if (typeof content === 'string') {
    return content
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') {
          return item
        }

        if (
          item &&
          typeof item === 'object' &&
          'text' in item &&
          typeof (item as { text?: unknown }).text === 'string'
        ) {
          return (item as { text: string }).text
        }

        return ''
      })
      .join(' ')
  }

  return ''
}

function estimateTokensFromText(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) {
    return 0
  }

  // 轻量 token 估算：约 4 字符 ≈ 1 token，保守向上取整。
  return Math.max(1, Math.ceil(trimmed.length / 4))
}

function estimateTokensFromMessages(
  messages: EstimateBillableUnitsInput['messages'],
  outputText: string | null | undefined,
): number {
  const inputText = (messages ?? [])
    .map((message) => flattenMessageContent(message.content))
    .join('\n')

  return (
    estimateTokensFromText(inputText) +
    estimateTokensFromText(outputText ?? '')
  )
}

export async function getModelPricing(
  db: D1Database,
  input: {
    provider: string
    modelId: string
    activeOnly?: boolean
  },
): Promise<ModelPricingSnapshot | null> {
  const where = input.activeOnly === false ? '' : 'AND is_active = 1'
  const row = await db
    .prepare(
      `SELECT id, provider, model_id, model_name, category, credits_per_1k_units, tier, min_plan, is_active
       FROM model_pricing
       WHERE provider = ? AND model_id = ? ${where}
       ORDER BY is_active DESC
       LIMIT 1`,
    )
    .bind(input.provider, input.modelId)
    .first<ModelPricingRow>()

  if (!row) {
    return null
  }

  return {
    id: row.id,
    provider: row.provider,
    modelId: row.model_id,
    modelName: row.model_name,
    category: row.category,
    creditsPer1kUnits: row.credits_per_1k_units,
    tier: row.tier,
    minPlan: row.min_plan,
    isActive: row.is_active === 1,
  }
}

export function estimateBillableUnits(
  input: EstimateBillableUnitsInput,
): BillableUsageEstimate {
  switch (input.category) {
    case 'text': {
      const tokenTotal =
        clampNonNegativeInteger(input.inputTokens ?? 0) +
        clampNonNegativeInteger(input.outputTokens ?? 0)

      if (tokenTotal > 0) {
        return {
          category: 'text',
          billableUnits: tokenTotal,
          unitLabel: 'tokens',
          basis: 'token_usage',
        }
      }

      return {
        category: 'text',
        billableUnits: estimateTokensFromMessages(input.messages, input.outputText),
        unitLabel: 'tokens',
        basis: 'message_char_estimate',
      }
    }

    case 'audio': {
      const rawText = input.text ?? input.outputText ?? ''
      return {
        category: 'audio',
        billableUnits: Math.max(1, rawText.trim().length),
        unitLabel: 'characters',
        basis: 'text_length',
      }
    }

    case 'image':
      return {
        category: 'image',
        billableUnits: normalizeOutputCount(input.outputCount) * 1000,
        unitLabel: 'generated_images',
        basis: 'image_count',
      }

    case 'video':
      return {
        category: 'video',
        billableUnits: normalizeDurationSeconds(input.durationSeconds) * 1000,
        unitLabel: 'video_seconds',
        basis: 'video_duration',
      }

    default:
      throw new BillingError(
        ErrorCode.BILLING_CONFIG_INVALID,
        'Unsupported billing category for metering',
        { category: input.category },
      )
  }
}

export function estimateCreditsFromUsage(input: {
  billableUnits: number
  creditsPer1kUnits: number
}): number {
  const billableUnits = clampNonNegativeInteger(input.billableUnits)
  const creditsPer1kUnits = clampNonNegativeInteger(input.creditsPer1kUnits)

  if (billableUnits === 0 || creditsPer1kUnits === 0) {
    return 0
  }

  return Math.round((billableUnits / 1000) * creditsPer1kUnits)
}
