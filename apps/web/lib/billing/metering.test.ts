/**
 * [INPUT]: 依赖 vitest，依赖 @/lib/db mock，依赖 ./metering
 * [OUTPUT]: 对外提供计量层测试，覆盖 model_pricing 查询、文本/图片/视频/音频 billable units 与 credits 预估
 * [POS]: lib/billing 的计量回归测试，保护 Stripe Phase 5 的 token 计费与统一单位换算口径
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/errors', async () => {
  const actual = await vi.importActual<typeof import('@/lib/errors')>('@/lib/errors')
  return actual
})

import { BillingError } from '@/lib/errors'

import {
  estimateBillableUnits,
  estimateCreditsFromUsage,
  getModelPricing,
} from './metering'

function createDbMock(pricingRow: Record<string, unknown> | null) {
  return {
    prepare: vi.fn(() => ({
      bind: vi.fn(() => ({
        first: vi.fn().mockResolvedValue(pricingRow),
      })),
    })),
  } as unknown as D1Database
}

describe('billing metering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads model pricing snapshot from D1', async () => {
    const db = createDbMock({
      id: 'mpr-text-001',
      provider: 'openrouter',
      model_id: 'openai/gpt-4o-mini',
      model_name: 'GPT-4o Mini',
      category: 'text',
      credits_per_1k_units: 3,
      tier: 'standard',
      min_plan: 'free',
      is_active: 1,
    })

    await expect(
      getModelPricing(db, {
        provider: 'openrouter',
        modelId: 'openai/gpt-4o-mini',
        activeOnly: false,
      }),
    ).resolves.toEqual({
      id: 'mpr-text-001',
      provider: 'openrouter',
      modelId: 'openai/gpt-4o-mini',
      modelName: 'GPT-4o Mini',
      category: 'text',
      creditsPer1kUnits: 3,
      tier: 'standard',
      minPlan: 'free',
      isActive: true,
    })
  })

  it('prefers real token usage for text billing when usage is available', () => {
    expect(
      estimateBillableUnits({
        category: 'text',
        inputTokens: 1200,
        outputTokens: 300,
      }),
    ).toEqual({
      category: 'text',
      billableUnits: 1500,
      unitLabel: 'tokens',
      basis: 'token_usage',
    })
  })

  it('falls back to message character estimation for text streaming logs', () => {
    expect(
      estimateBillableUnits({
        category: 'text',
        messages: [
          { role: 'user', content: 'hello world' },
          { role: 'assistant', content: [{ type: 'text', text: 'streamed answer' }] },
        ],
        outputText: 'done',
      }),
    ).toEqual({
      category: 'text',
      billableUnits: 8,
      unitLabel: 'tokens',
      basis: 'message_char_estimate',
    })
  })

  it('normalizes image count and video seconds into 1k-unit billing', () => {
    expect(
      estimateBillableUnits({
        category: 'image',
        outputCount: 3,
      }),
    ).toEqual({
      category: 'image',
      billableUnits: 3000,
      unitLabel: 'generated_images',
      basis: 'image_count',
    })

    expect(
      estimateBillableUnits({
        category: 'video',
        durationSeconds: '8',
      }),
    ).toEqual({
      category: 'video',
      billableUnits: 8000,
      unitLabel: 'video_seconds',
      basis: 'video_duration',
    })
  })

  it('uses audio text length as billable characters', () => {
    expect(
      estimateBillableUnits({
        category: 'audio',
        text: '你好，世界',
      }),
    ).toEqual({
      category: 'audio',
      billableUnits: 5,
      unitLabel: 'characters',
      basis: 'text_length',
    })
  })

  it('estimates credits from billable units in 1k-unit scale', () => {
    expect(
      estimateCreditsFromUsage({
        billableUnits: 2500,
        creditsPer1kUnits: 8,
      }),
    ).toBe(20)
  })

  it('throws on unsupported metering category', () => {
    expect(() =>
      estimateBillableUnits({
        category: 'text' as never,
      }),
    ).not.toThrow()

    expect(() =>
      estimateBillableUnits({
        category: 'unknown' as never,
      }),
    ).toThrow(BillingError)
  })
})
