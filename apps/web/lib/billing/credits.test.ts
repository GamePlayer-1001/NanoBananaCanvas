/**
 * [INPUT]: 依赖 vitest，依赖 @/lib/db mock，依赖 ./credits 与 ./schema 缓存重置
 * [OUTPUT]: 对外提供积分余额/流水/usage 测试，覆盖账本摘要与聚合查询口径
 * [POS]: lib/billing 的积分读取层回归测试，防止账本展示口径漂移
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(),
}))

import { getDb } from '@/lib/db'
import { NotFoundError } from '@/lib/errors'

import { getCreditBalanceSummary, getCreditTransactions, getCreditUsage } from './credits'
import { resetBillingSchemaCache } from './schema'

function createDbMock(options: {
  userColumns?: string[]
  tableColumns?: Record<string, string[]>
  existingTables?: string[]
  balanceRow?: Record<string, unknown> | null
  transactionCountRow?: Record<string, unknown> | null
  transactionRows?: Record<string, unknown>[]
  usageSummaryRow?: Record<string, unknown> | null
  usageByModelRows?: Record<string, unknown>[]
  usageDailyRows?: Record<string, unknown>[]
  onSql?: (sql: string) => void
}): D1Database {
  const existingTables = new Set(
    options.existingTables ?? [
      'users',
      'credit_balances',
      'credit_transactions',
      'subscriptions',
      'ai_usage_logs',
      'model_pricing',
    ],
  )
  const userColumns =
    options.userColumns ??
    [
      'id',
      'clerk_id',
      'email',
      'username',
      'first_name',
      'last_name',
      'name',
      'avatar_url',
      'plan',
      'membership_status',
      'created_at',
      'updated_at',
    ]
  const defaultTableColumns: Record<string, string[]> = {
    users: userColumns,
    credit_balances: [
      'user_id',
      'monthly_balance',
      'permanent_balance',
      'frozen_credits',
      'total_earned',
      'total_spent',
      'created_at',
      'updated_at',
    ],
    credit_transactions: [
      'id',
      'user_id',
      'type',
      'pool',
      'amount',
      'balance_after',
      'source',
      'reference_id',
      'description',
      'created_at',
    ],
    subscriptions: [
      'id',
      'user_id',
      'stripe_subscription_id',
      'stripe_customer_id',
      'plan',
      'purchase_mode',
      'billing_period',
      'status',
      'current_period_start',
      'current_period_end',
      'monthly_credits',
      'storage_gb',
      'cancel_at_period_end',
      'created_at',
      'updated_at',
    ],
    ai_usage_logs: [
      'id',
      'user_id',
      'provider',
      'model_id',
      'input_tokens',
      'output_tokens',
      'estimated_credits',
      'status',
      'created_at',
    ],
    model_pricing: ['id', 'provider', 'model_id', 'credits_per_1k_units'],
  }
  const tableColumns = { ...defaultTableColumns, ...options.tableColumns }

  return {
    prepare: vi.fn((sql: string) => {
      options.onSql?.(sql)

      if (sql.includes("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")) {
        return {
          bind: vi.fn((tableName: string) => ({
            first: vi.fn().mockResolvedValue(existingTables.has(tableName) ? { name: tableName } : null),
          })),
        }
      }

      const tableInfoMatch = sql.match(/PRAGMA table_info\('([^']+)'\)/u)
      if (tableInfoMatch) {
        const tableName = tableInfoMatch[1]
        return {
          all: vi.fn().mockResolvedValue({
            results: (tableColumns[tableName] ?? []).map((name) => ({ name })),
          }),
        }
      }

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
            first: vi.fn().mockResolvedValue(options.balanceRow ?? null),
          }),
        }
      }

      if (sql.includes('FROM credit_transactions') && sql.includes('COUNT(*) AS total')) {
        return {
          bind: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(options.transactionCountRow ?? { total: 0 }),
          }),
        }
      }

      if (sql.includes('FROM credit_transactions') && sql.includes('ORDER BY created_at DESC')) {
        return {
          bind: vi.fn().mockReturnValue({
            all: vi.fn().mockResolvedValue({ results: options.transactionRows ?? [] }),
          }),
        }
      }

      if (sql.includes('FROM ai_usage_logs u') && sql.includes('COUNT(*) AS total_requests')) {
        return {
          bind: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(options.usageSummaryRow ?? null),
          }),
        }
      }

      if (sql.includes('GROUP BY u.provider, u.model_id')) {
        return {
          bind: vi.fn().mockReturnValue({
            all: vi.fn().mockResolvedValue({ results: options.usageByModelRows ?? [] }),
          }),
        }
      }

      if (sql.includes('GROUP BY date(u.created_at)')) {
        return {
          bind: vi.fn().mockReturnValue({
            all: vi.fn().mockResolvedValue({ results: options.usageDailyRows ?? [] }),
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
    resetBillingSchemaCache()
  })

  it('returns merged balances from monthly, permanent and frozen pools', async () => {
    vi.mocked(getDb).mockResolvedValue(
      createDbMock({
        balanceRow: {
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
        },
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
    vi.mocked(getDb).mockResolvedValue(createDbMock({ balanceRow: null }))

    await expect(getCreditBalanceSummary('missing-user')).rejects.toBeInstanceOf(NotFoundError)
  })

  it('falls back to free defaults when billing tables are missing', async () => {
    const capturedSql: string[] = []

    vi.mocked(getDb).mockResolvedValue(
      createDbMock({
        existingTables: ['users'],
        userColumns: ['id', 'clerk_id', 'email', 'created_at'],
        balanceRow: {
          user_id: 'legacy-user',
          plan: 'free',
          membership_status: 'free',
          monthly_balance: 0,
          permanent_balance: 0,
          frozen_credits: 0,
          total_earned: 0,
          total_spent: 0,
          updated_at: null,
          subscription_monthly_credits: null,
          storage_gb: null,
        },
        onSql: (sql) => capturedSql.push(sql),
      }),
    )

    await expect(getCreditBalanceSummary('legacy-user')).resolves.toEqual({
      userId: 'legacy-user',
      plan: 'free',
      membershipStatus: 'free',
      monthlyBalance: 0,
      permanentBalance: 0,
      frozenCredits: 0,
      availableCredits: 0,
      totalCredits: 0,
      totalEarned: 0,
      totalSpent: 0,
      currentPlanMonthlyCredits: 0,
      storageGB: 1,
      updatedAt: null,
    })

    expect(capturedSql.some((sql) => sql.includes('LEFT JOIN subscriptions'))).toBe(false)
    expect(capturedSql.some((sql) => sql.includes('LEFT JOIN credit_balances'))).toBe(false)
  })

  it('falls back when billing tables exist with legacy columns', async () => {
    const capturedSql: string[] = []

    vi.mocked(getDb).mockResolvedValue(
      createDbMock({
        tableColumns: {
          credit_balances: ['user_id', 'balance', 'frozen', 'updated_at'],
          subscriptions: ['id', 'user_id', 'stripe_customer_id'],
        },
        balanceRow: {
          user_id: 'legacy-user',
          plan: 'free',
          membership_status: 'free',
          monthly_balance: 0,
          permanent_balance: 0,
          frozen_credits: 0,
          total_earned: 0,
          total_spent: 0,
          updated_at: null,
          subscription_monthly_credits: null,
          storage_gb: null,
        },
        onSql: (sql) => capturedSql.push(sql),
      }),
    )

    await expect(getCreditBalanceSummary('legacy-user')).resolves.toMatchObject({
      userId: 'legacy-user',
      monthlyBalance: 0,
      permanentBalance: 0,
      frozenCredits: 0,
      currentPlanMonthlyCredits: 0,
      storageGB: 1,
    })

    expect(capturedSql.some((sql) => sql.includes('INSERT OR IGNORE INTO credit_balances'))).toBe(false)
    expect(capturedSql.some((sql) => sql.includes('LEFT JOIN credit_balances'))).toBe(false)
    expect(capturedSql.some((sql) => sql.includes('s.monthly_credits'))).toBe(false)
    expect(capturedSql.some((sql) => sql.includes('s.storage_gb'))).toBe(false)
  })

  it('returns paginated credit transactions ordered by newest first', async () => {
    vi.mocked(getDb).mockResolvedValue(
      createDbMock({
        transactionCountRow: { total: 3 },
        transactionRows: [
          {
            id: 'txn_2',
            type: 'refund',
            pool: 'permanent',
            amount: 200,
            balance_after: 1400,
            source: 'stripe_credit_pack',
            reference_id: 'cs_test_2',
            description: 'Refunded credit pack',
            created_at: '2026-04-22 16:00:00',
          },
          {
            id: 'txn_1',
            type: 'earn',
            pool: 'monthly',
            amount: 1200,
            balance_after: 1200,
            source: 'stripe_subscription_renewal',
            reference_id: 'in_test_1',
            description: 'Renewal credits',
            created_at: '2026-04-22 15:00:00',
          },
        ],
      }),
    )

    await expect(getCreditTransactions('user-1', { page: 1, pageSize: 2 })).resolves.toEqual({
      items: [
        {
          id: 'txn_2',
          type: 'refund',
          pool: 'permanent',
          amount: 200,
          balanceAfter: 1400,
          source: 'stripe_credit_pack',
          referenceId: 'cs_test_2',
          description: 'Refunded credit pack',
          createdAt: '2026-04-22 16:00:00',
        },
        {
          id: 'txn_1',
          type: 'earn',
          pool: 'monthly',
          amount: 1200,
          balanceAfter: 1200,
          source: 'stripe_subscription_renewal',
          referenceId: 'in_test_1',
          description: 'Renewal credits',
          createdAt: '2026-04-22 15:00:00',
        },
      ],
      total: 3,
      page: 1,
      pageSize: 2,
      hasMore: true,
    })
  })

  it('returns usage summary, by-model breakdown and daily buckets', async () => {
    vi.mocked(getDb).mockResolvedValue(
      createDbMock({
        usageSummaryRow: {
          total_requests: 4,
          success_count: 3,
          failed_count: 1,
          total_input_tokens: 3200,
          total_output_tokens: 1800,
          estimated_credits_spent: 25,
        },
        usageByModelRows: [
          {
            provider: 'openrouter',
            model_id: 'openai/gpt-4o-mini',
            request_count: 3,
            success_count: 2,
            failed_count: 1,
            input_tokens: 2500,
            output_tokens: 1400,
            estimated_credits_spent: 19,
          },
        ],
        usageDailyRows: [
          {
            day: '2026-04-22',
            request_count: 2,
            success_count: 2,
            failed_count: 0,
            input_tokens: 1500,
            output_tokens: 900,
            estimated_credits_spent: 12,
          },
          {
            day: '2026-04-21',
            request_count: 2,
            success_count: 1,
            failed_count: 1,
            input_tokens: 1700,
            output_tokens: 900,
            estimated_credits_spent: 13,
          },
        ],
      }),
    )

    await expect(getCreditUsage('user-1', { windowDays: 30 })).resolves.toEqual({
      windowDays: 30,
      summary: {
        totalRequests: 4,
        successCount: 3,
        failedCount: 1,
        totalInputTokens: 3200,
        totalOutputTokens: 1800,
        estimatedCreditsSpent: 25,
      },
      byModel: [
        {
          provider: 'openrouter',
          modelId: 'openai/gpt-4o-mini',
          requestCount: 3,
          successCount: 2,
          failedCount: 1,
          inputTokens: 2500,
          outputTokens: 1400,
          estimatedCreditsSpent: 19,
        },
      ],
      daily: [
        {
          day: '2026-04-22',
          requestCount: 2,
          successCount: 2,
          failedCount: 0,
          inputTokens: 1500,
          outputTokens: 900,
          estimatedCreditsSpent: 12,
        },
        {
          day: '2026-04-21',
          requestCount: 2,
          successCount: 1,
          failedCount: 1,
          inputTokens: 1700,
          outputTokens: 900,
          estimatedCreditsSpent: 13,
        },
      ],
    })
  })
})
