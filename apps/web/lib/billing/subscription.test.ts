/**
 * [INPUT]: 依赖 vitest，依赖 @/lib/db mock，依赖 ./subscription、./schema
 * [OUTPUT]: 对外提供订阅摘要兼容测试，覆盖 subscriptions 缺失时的 Free 回退口径
 * [POS]: lib/billing 的订阅读取回归测试，防止历史库结构漂移导致 /billing 页面直接 500
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(),
}))

import { getDb } from '@/lib/db'

import { getBillingSubscription } from './subscription'
import { resetBillingSchemaCache } from './schema'

function createDbMock(options: {
  userColumns?: string[]
  tableColumns?: Record<string, string[]>
  existingTables?: string[]
  subscriptionRow?: Record<string, unknown> | null
  onSql?: (sql: string) => void
}): D1Database {
  const existingTables = new Set(options.existingTables ?? ['users', 'subscriptions'])
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

      if (sql.includes('FROM users u')) {
        return {
          bind: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(options.subscriptionRow ?? null),
          }),
        }
      }

      throw new Error(`Unexpected SQL in test: ${sql}`)
    }),
  } as unknown as D1Database
}

describe('getBillingSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetBillingSchemaCache()
  })

  it('falls back to free summary when subscriptions table is missing', async () => {
    const capturedSql: string[] = []

    vi.mocked(getDb).mockResolvedValue(
      createDbMock({
        existingTables: ['users'],
        userColumns: ['id', 'clerk_id', 'email', 'created_at'],
        subscriptionRow: {
          user_id: 'legacy-user',
          user_plan: 'free',
          membership_status: 'free',
          id: null,
          stripe_subscription_id: null,
          stripe_customer_id: null,
          plan: null,
          purchase_mode: null,
          billing_period: null,
          status: null,
          current_period_start: null,
          current_period_end: null,
          monthly_credits: null,
          storage_gb: null,
          cancel_at_period_end: null,
          created_at: null,
          updated_at: null,
        },
        onSql: (sql) => capturedSql.push(sql),
      }),
    )

    await expect(getBillingSubscription('legacy-user')).resolves.toEqual({
      userId: 'legacy-user',
      plan: 'free',
      membershipStatus: 'free',
      purchaseMode: 'free',
      billingPeriod: 'monthly',
      status: 'active',
      monthlyCredits: 0,
      storageGB: 1,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      portalEligible: false,
      cancelEligible: false,
    })

    expect(capturedSql.some((sql) => sql.includes('LEFT JOIN subscriptions'))).toBe(false)
  })
})
