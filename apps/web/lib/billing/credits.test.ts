/**
 * [INPUT]: 依赖 vitest，依赖 @/lib/db mock，依赖 ./credits
 * [OUTPUT]: 对外提供积分余额摘要测试，覆盖双池汇总与缺失用户错误
 * [POS]: lib/billing 的积分读取层回归测试，防止账本展示口径漂移
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(),
}))

import { getDb } from '@/lib/db'
import { NotFoundError } from '@/lib/errors'

import { getCreditBalanceSummary } from './credits'

function createDbMock(row: Record<string, unknown> | null): D1Database {
  return {
    prepare: vi.fn((sql: string) => {
      if (sql.includes('INSERT OR IGNORE INTO credit_balances')) {
        return {
          bind: vi.fn().mockReturnValue({
            run: vi.fn().mockResolvedValue({}),
          }),
        }
      }

      if (sql.includes('FROM users u')) {
        return {
          bind: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(row),
          }),
        }
      }

      throw new Error(`Unexpected SQL in test: ${sql}`)
    }),
  } as unknown as D1Database
}

describe('getCreditBalanceSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns merged balances from monthly, permanent and frozen pools', async () => {
    vi.mocked(getDb).mockResolvedValue(
      createDbMock({
        user_id: 'user-1',
        plan: 'pro',
        membership_status: 'pro',
        monthly_balance: 1200,
        permanent_balance: 350,
        frozen_credits: 80,
        total_earned: 4000,
        total_spent: 2370,
        updated_at: '2026-04-22 15:00:00',
        subscription_monthly_credits: 5400,
        storage_gb: 100,
      }),
    )

    await expect(getCreditBalanceSummary('user-1')).resolves.toEqual({
      userId: 'user-1',
      plan: 'pro',
      membershipStatus: 'pro',
      monthlyBalance: 1200,
      permanentBalance: 350,
      frozenCredits: 80,
      availableCredits: 1550,
      totalCredits: 1630,
      totalEarned: 4000,
      totalSpent: 2370,
      currentPlanMonthlyCredits: 5400,
      storageGB: 100,
      updatedAt: '2026-04-22 15:00:00',
    })
  })

  it('throws when the user row does not exist', async () => {
    vi.mocked(getDb).mockResolvedValue(createDbMock(null))

    await expect(getCreditBalanceSummary('missing-user')).rejects.toBeInstanceOf(NotFoundError)
  })
})
