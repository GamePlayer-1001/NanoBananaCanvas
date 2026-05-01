/**
 * [INPUT]: 依赖 vitest，依赖 @/lib/db mock，依赖 ./ledger
 * [OUTPUT]: 对外提供积分事务测试，覆盖双池冻结顺序与 freeze/confirm/refund 三阶段语义
 * [POS]: lib/billing 的账本事务回归测试，保护 Stripe Phase 5 的核心扣费真相源
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(),
}))

vi.mock('@/lib/nanoid', () => ({
  nanoid: vi.fn(() => 'txn_test_id'),
}))

import { getDb } from '@/lib/db'
import { BillingError } from '@/lib/errors'
import { resetBillingSchemaCache } from './schema'

import {
  awardDailySigninCredits,
  confirmFrozenCredits,
  freezeCredits,
  getDailySigninStatus,
  getReferenceCreditSummary,
  refundFrozenCredits,
} from './ledger'

function createPreparedRecorder(sql: string, onBind?: (...args: unknown[]) => void) {
  return {
    bind: vi.fn((...args: unknown[]) => {
      onBind?.(...args)
      return {
        sql,
        args,
        run: vi.fn().mockResolvedValue({}),
        first: vi.fn(),
        all: vi.fn(),
      }
    }),
  }
}

function createDbMock(options: {
  balanceRow?: Record<string, unknown> | null
  referenceRows?: Record<string, unknown>[]
  dailySigninRow?: Record<string, unknown> | null
  hasDailySigninsTable?: boolean
  dailySigninsColumns?: string[]
  failTrialTransactionInsert?: boolean
  recordedBatches?: Array<Array<{ sql: string; args: unknown[] }>>
}) {
  const recordedBatches = options.recordedBatches ?? []
  const defaultColumnsByTable: Record<string, string[]> = {
    users: ['id'],
    subscriptions: ['user_id'],
    credit_balances: [
      'user_id',
      'trial_balance',
      'trial_expires_at',
      'monthly_balance',
      'permanent_balance',
      'frozen_credits',
      'total_earned',
      'total_spent',
    ],
    credit_transactions: [
      'user_id',
      'id',
      'type',
      'pool',
      'amount',
      'balance_after',
      'source',
      'reference_id',
      'description',
      'created_at',
    ],
    daily_signins: options.dailySigninsColumns ?? [
      'id',
      'user_id',
      'signin_date',
      'credits_awarded',
      'expires_at',
    ],
    ai_usage_logs: ['user_id', 'provider', 'model_id', 'created_at'],
    model_pricing: ['provider', 'model_id', 'credits_per_1k_units'],
  }

  return {
    prepare: vi.fn((sql: string) => {
      if (sql.includes('INSERT OR IGNORE INTO credit_balances')) {
        return {
          bind: vi.fn(() => ({
            run: vi.fn().mockResolvedValue({}),
          })),
        }
      }

      if (sql.includes('FROM credit_balances')) {
        return {
          bind: vi.fn(() => ({
            first: vi.fn().mockResolvedValue(options.balanceRow ?? null),
          })),
        }
      }

      if (sql.includes("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")) {
        return {
          bind: vi.fn((tableName: string) => ({
            first: vi.fn().mockResolvedValue(
              tableName === 'daily_signins' && options.hasDailySigninsTable === false
                ? null
                : { name: tableName },
            ),
          })),
        }
      }

      const pragmaMatch = sql.match(/PRAGMA table_info\('([^']+)'\)/)
      if (pragmaMatch) {
        const tableName = pragmaMatch[1] ?? ''
        const columnNames = defaultColumnsByTable[tableName] ?? ['id']
        return {
          all: vi.fn(async () => ({
            results: columnNames.map((name) => ({ name })),
          })),
          bind: vi.fn(() => ({
            all: vi.fn(async () => ({
              results: columnNames.map((name) => ({ name })),
            })),
          })),
        }
      }

      if (sql.includes('FROM daily_signins')) {
        return {
          bind: vi.fn(() => ({
            first: vi.fn().mockResolvedValue(options.dailySigninRow ?? null),
          })),
        }
      }

      if (sql.includes('GROUP BY pool')) {
        return {
          bind: vi.fn(() => ({
            all: vi.fn().mockResolvedValue({ results: options.referenceRows ?? [] }),
          })),
        }
      }

      return createPreparedRecorder(sql)
    }),
    batch: vi.fn(async (statements: Array<{ sql: string; args: unknown[] }>) => {
      if (
        options.failTrialTransactionInsert &&
        statements.some(
          (statement) =>
            statement.sql.includes('INSERT INTO credit_transactions') &&
            statement.args.includes('trial'),
        )
      ) {
        throw new Error(
          "D1_ERROR: CHECK constraint failed: pool IN ('monthly', 'permanent')",
        )
      }

      recordedBatches.push(statements)
      return statements.map(() => ({ success: true }))
    }),
  } as unknown as D1Database
}

describe('billing ledger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetBillingSchemaCache()
  })

  it('freezes monthly credits before permanent credits', async () => {
    const recordedBatches: Array<Array<{ sql: string; args: unknown[] }>> = []
    vi.mocked(getDb).mockResolvedValue(
      createDbMock({
        balanceRow: {
          monthly_balance: 300,
          permanent_balance: 500,
          frozen_credits: 10,
          total_earned: 900,
          total_spent: 120,
        },
        recordedBatches,
      }),
    )

    const result = await freezeCredits({
      userId: 'user-1',
      requestedCredits: 450,
      referenceId: 'exec_1',
      source: 'ai_execute',
      description: 'Freeze credits for AI execution',
    })

    expect(result).toEqual({
      referenceId: 'exec_1',
      frozen: {
        trial: 0,
        monthly: 300,
        permanent: 150,
        total: 450,
      },
      availableCreditsAfter: 350,
      frozenCreditsAfter: 460,
    })

    expect(recordedBatches).toHaveLength(1)
    expect(recordedBatches[0]).toHaveLength(3)
    expect(recordedBatches[0][0]?.sql).toContain('UPDATE credit_balances')
    expect(recordedBatches[0][0]?.args).toEqual([0, 0, 350, 460, 'user-1'])
    expect(recordedBatches[0][1]?.args.slice(2, 9)).toEqual([
      'freeze',
      'monthly',
      -300,
      500,
      'ai_execute',
      'exec_1',
      'Freeze credits for AI execution',
    ])
    expect(recordedBatches[0][2]?.args.slice(2, 9)).toEqual([
      'freeze',
      'permanent',
      -150,
      350,
      'ai_execute',
      'exec_1',
      'Freeze credits for AI execution',
    ])
  })

  it('throws when available credits are insufficient', async () => {
    vi.mocked(getDb).mockResolvedValue(
      createDbMock({
        balanceRow: {
          monthly_balance: 50,
          permanent_balance: 30,
          frozen_credits: 0,
          total_earned: 80,
          total_spent: 10,
        },
      }),
    )

    await expect(
      freezeCredits({
        userId: 'user-1',
        requestedCredits: 120,
        referenceId: 'exec_2',
        source: 'ai_execute',
        description: 'Freeze credits for AI execution',
      }),
    ).rejects.toBeInstanceOf(BillingError)
  })

  it('confirms remaining frozen credits without changing available balance', async () => {
    const recordedBatches: Array<Array<{ sql: string; args: unknown[] }>> = []
    vi.mocked(getDb).mockResolvedValue(
      createDbMock({
        balanceRow: {
          monthly_balance: 0,
          permanent_balance: 350,
          frozen_credits: 450,
          total_earned: 900,
          total_spent: 120,
        },
        referenceRows: [
          { pool: 'monthly', frozen_amount: 300, settled_amount: 0 },
          { pool: 'permanent', frozen_amount: 150, settled_amount: 0 },
        ],
        recordedBatches,
      }),
    )

    const result = await confirmFrozenCredits({
      userId: 'user-1',
      referenceId: 'exec_1',
      source: 'ai_execute_confirm',
      description: 'Confirm AI execution billing',
    })

    expect(result).toEqual({
      referenceId: 'exec_1',
      finalized: {
        trial: 0,
        monthly: 300,
        permanent: 150,
        total: 450,
      },
      availableCreditsAfter: 350,
      frozenCreditsAfter: 0,
      totalSpentAfter: 570,
    })

    expect(recordedBatches[0]?.[0]?.args).toEqual([0, 0, 350, 0, 570, 'user-1'])
    expect(recordedBatches[0]?.[1]?.args.slice(2, 9)).toEqual([
      'spend',
      'monthly',
      -300,
      350,
      'ai_execute_confirm',
      'exec_1',
      'Confirm AI execution billing',
    ])
    expect(recordedBatches[0]?.[2]?.args.slice(2, 9)).toEqual([
      'spend',
      'permanent',
      -150,
      350,
      'ai_execute_confirm',
      'exec_1',
      'Confirm AI execution billing',
    ])
  })

  it('supports partially confirming a reference before refunding the remainder', async () => {
    const recordedBatches: Array<Array<{ sql: string; args: unknown[] }>> = []
    vi.mocked(getDb).mockResolvedValue(
      createDbMock({
        balanceRow: {
          monthly_balance: 0,
          permanent_balance: 350,
          frozen_credits: 450,
          total_earned: 900,
          total_spent: 120,
        },
        referenceRows: [
          { pool: 'monthly', frozen_amount: 300, settled_amount: 0 },
          { pool: 'permanent', frozen_amount: 150, settled_amount: 0 },
        ],
        recordedBatches,
      }),
    )

    const result = await confirmFrozenCredits({
      userId: 'user-1',
      referenceId: 'exec_partial',
      source: 'ai_execute_confirm',
      description: 'Confirm actual AI execution billing',
      requestedCredits: 320,
    })

    expect(result).toEqual({
      referenceId: 'exec_partial',
      finalized: {
        trial: 0,
        monthly: 300,
        permanent: 20,
        total: 320,
      },
      availableCreditsAfter: 350,
      frozenCreditsAfter: 130,
      totalSpentAfter: 440,
    })

    expect(recordedBatches[0]?.[0]?.args).toEqual([0, 0, 350, 130, 440, 'user-1'])
    expect(recordedBatches[0]?.[1]?.args.slice(2, 9)).toEqual([
      'spend',
      'monthly',
      -300,
      350,
      'ai_execute_confirm',
      'exec_partial',
      'Confirm actual AI execution billing',
    ])
    expect(recordedBatches[0]?.[2]?.args.slice(2, 9)).toEqual([
      'spend',
      'permanent',
      -20,
      350,
      'ai_execute_confirm',
      'exec_partial',
      'Confirm actual AI execution billing',
    ])
  })

  it('refunds frozen credits back to the original pools', async () => {
    const recordedBatches: Array<Array<{ sql: string; args: unknown[] }>> = []
    vi.mocked(getDb).mockResolvedValue(
      createDbMock({
        balanceRow: {
          monthly_balance: 0,
          permanent_balance: 350,
          frozen_credits: 450,
          total_earned: 900,
          total_spent: 120,
        },
        referenceRows: [
          { pool: 'monthly', frozen_amount: 300, settled_amount: 0 },
          { pool: 'permanent', frozen_amount: 150, settled_amount: 0 },
        ],
        recordedBatches,
      }),
    )

    const result = await refundFrozenCredits({
      userId: 'user-1',
      referenceId: 'exec_1',
      source: 'ai_execute_refund',
      description: 'Refund failed AI execution',
    })

    expect(result).toEqual({
      referenceId: 'exec_1',
      finalized: {
        trial: 0,
        monthly: 300,
        permanent: 150,
        total: 450,
      },
      availableCreditsAfter: 800,
      frozenCreditsAfter: 0,
      totalSpentAfter: 120,
    })

    expect(recordedBatches[0]?.[0]?.args).toEqual([0, 300, 500, 0, 120, 'user-1'])
    expect(recordedBatches[0]?.[1]?.args.slice(2, 9)).toEqual([
      'refund',
      'monthly',
      300,
      650,
      'ai_execute_refund',
      'exec_1',
      'Refund failed AI execution',
    ])
    expect(recordedBatches[0]?.[2]?.args.slice(2, 9)).toEqual([
      'refund',
      'permanent',
      150,
      800,
      'ai_execute_refund',
      'exec_1',
      'Refund failed AI execution',
    ])
  })

  it('summarizes frozen, settled and remaining credits by pool', async () => {
    vi.mocked(getDb).mockResolvedValue(
      createDbMock({
        referenceRows: [
          { pool: 'monthly', frozen_amount: 300, settled_amount: 100 },
          { pool: 'permanent', frozen_amount: 150, settled_amount: 20 },
        ],
      }),
    )

    await expect(getReferenceCreditSummary('user-1', 'exec_1')).resolves.toEqual({
      referenceId: 'exec_1',
      frozen: {
        trial: 0,
        monthly: 300,
        permanent: 150,
        total: 450,
      },
      settled: {
        trial: 0,
        monthly: 100,
        permanent: 20,
        total: 120,
      },
      remaining: {
        trial: 0,
        monthly: 200,
        permanent: 130,
        total: 330,
      },
    })
  })

  it('returns a safe daily signin status when the table is missing', async () => {
    vi.mocked(getDb).mockResolvedValue(
      createDbMock({
        balanceRow: {
          trial_balance: 40,
          trial_expires_at: '2026-05-02T00:00:00.000Z',
          monthly_balance: 0,
          permanent_balance: 0,
          frozen_credits: 0,
          total_earned: 40,
          total_spent: 0,
        },
        hasDailySigninsTable: false,
      }),
    )

    await expect(getDailySigninStatus('user-1')).resolves.toEqual({
      checkedInToday: false,
      trialBalance: 40,
      trialExpiresAt: '2026-05-02T00:00:00.000Z',
    })
  })

  it('rejects daily signin awards when the billing schema is incomplete', async () => {
    vi.mocked(getDb).mockResolvedValue(
      createDbMock({
        balanceRow: {
          trial_balance: 0,
          trial_expires_at: null,
          monthly_balance: 0,
          permanent_balance: 0,
          frozen_credits: 0,
          total_earned: 0,
          total_spent: 0,
        },
        hasDailySigninsTable: false,
      }),
    )

    await expect(awardDailySigninCredits('user-1')).rejects.toMatchObject({
      code: 'BILLING_CONFIG_INVALID',
    })
  })

  it('still awards daily signin credits when legacy transaction pool constraints reject trial logs', async () => {
    const recordedBatches: Array<Array<{ sql: string; args: unknown[] }>> = []
    vi.mocked(getDb).mockResolvedValue(
      createDbMock({
        balanceRow: {
          trial_balance: 0,
          trial_expires_at: null,
          monthly_balance: 10,
          permanent_balance: 20,
          frozen_credits: 0,
          total_earned: 30,
          total_spent: 0,
        },
        failTrialTransactionInsert: true,
        recordedBatches,
      }),
    )

    await expect(awardDailySigninCredits('user-1')).resolves.toMatchObject({
      creditsAwarded: 100,
      trialBalance: 100,
    })

    expect(recordedBatches).toHaveLength(1)
    expect(recordedBatches[0]?.[0]?.sql).toContain('UPDATE credit_balances')
    expect(recordedBatches[0]?.[1]?.sql).toContain('INSERT INTO daily_signins')
  })
})
