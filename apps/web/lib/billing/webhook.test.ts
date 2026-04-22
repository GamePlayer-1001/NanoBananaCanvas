/**
 * [INPUT]: 依赖 vitest，依赖 @/lib/db mock，依赖 ./webhook 与 ./entitlements mock
 * [OUTPUT]: 对外提供 Stripe Webhook 幂等测试，覆盖重复事件只处理一次
 * [POS]: lib/billing 的 Webhook 回归测试，确保 processed_stripe_events 闸门稳定阻止重复落账
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(),
}))

vi.mock('./entitlements', () => ({
  applyFreePlanDowngrade: vi.fn(),
  awardCreditPackCredits: vi.fn(),
  awardOneTimePlanCredits: vi.fn(),
  resetPlanMonthlyCredits: vi.fn(),
  syncUserPlanEntitlement: vi.fn(),
}))

import { getDb } from '@/lib/db'

import { applyFreePlanDowngrade } from './entitlements'
import { processStripeWebhookEvent } from './webhook'

function createDbMock(changeQueue: number[]): D1Database {
  return {
    prepare: vi.fn((sql: string) => {
      if (sql.includes('INSERT OR IGNORE INTO processed_stripe_events')) {
        const nextChange = changeQueue.shift() ?? 0

        return {
          bind: vi.fn().mockReturnValue({
            run: vi.fn().mockResolvedValue({
              meta: { changes: nextChange },
            }),
          }),
        }
      }

      throw new Error(`Unexpected SQL in webhook test: ${sql}`)
    }),
  } as unknown as D1Database
}

describe('processStripeWebhookEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should ignore unsupported webhook events without touching the idempotency table', async () => {
    vi.mocked(getDb).mockResolvedValue(createDbMock([]))

    await expect(
      processStripeWebhookEvent({
        id: 'evt_ignore',
        type: 'charge.refunded',
        data: { object: {} },
      } as never),
    ).resolves.toEqual({
      received: true,
      processed: false,
      ignored: true,
    })

    expect(getDb).not.toHaveBeenCalled()
    expect(applyFreePlanDowngrade).not.toHaveBeenCalled()
  })

  it('should only process the first delivery of the same webhook event', async () => {
    vi.mocked(getDb).mockResolvedValue(createDbMock([1, 0]))

    const event = {
      id: 'evt_subscription_deleted_1',
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_123',
          customer: 'cus_123',
          metadata: {
            userId: 'user_123',
          },
        },
      },
    } as never

    await expect(processStripeWebhookEvent(event)).resolves.toEqual({
      received: true,
      processed: true,
    })

    await expect(processStripeWebhookEvent(event)).resolves.toEqual({
      received: true,
      processed: false,
      ignored: true,
    })

    expect(applyFreePlanDowngrade).toHaveBeenCalledTimes(1)
    expect(applyFreePlanDowngrade).toHaveBeenCalledWith({
      userId: 'user_123',
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: 'sub_123',
      status: 'canceled',
      referenceId: 'evt_subscription_deleted_1',
    })
  })
})
