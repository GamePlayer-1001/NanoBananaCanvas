/**
 * [INPUT]: 依赖 vitest，依赖 @/lib/db mock，依赖 ./stripe-client、./schema
 * [OUTPUT]: 对外提供 Stripe Customer 绑定兼容测试，覆盖 subscriptions 缺失时的受控失败
 * [POS]: lib/billing 的 Stripe 客户端门面回归测试，防止账单迁移缺口制造未知 500 或孤儿 Stripe Customer
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(),
}))

vi.mock('@/lib/env', () => ({
  getEnv: vi.fn(),
}))

vi.mock('@/lib/nanoid', () => ({
  nanoid: vi.fn(() => 'sub_new'),
}))

const createStripeCustomerMock = vi.fn()

vi.mock('stripe', () => {
  class StripeMock {
    customers = {
      create: createStripeCustomerMock,
    }

    static createFetchHttpClient() {
      return {}
    }
  }

  return {
    default: StripeMock,
  }
})

import { getDb } from '@/lib/db'
import { getEnv } from '@/lib/env'
import { BillingError, ErrorCode } from '@/lib/errors'

import { resetBillingSchemaCache } from './schema'
import { getOrCreateStripeCustomer } from './stripe-client'

function createDbMock(options: {
  existingTables?: string[]
  userColumns?: string[]
  tableColumns?: Record<string, string[]>
  userRow?: Record<string, unknown> | null
  subscriptionRow?: Record<string, unknown> | null
  captureSql?: string[]
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
      'stripe_customer_id',
      'plan',
      'purchase_mode',
      'billing_period',
      'status',
      'monthly_credits',
      'storage_gb',
      'updated_at',
    ],
  }
  const tableColumns = { ...defaultTableColumns, ...options.tableColumns }

  return {
    prepare: vi.fn((sql: string) => {
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

      if (sql.includes('SELECT id, email, name')) {
        return {
          bind: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(options.userRow ?? null),
          }),
        }
      }

      if (sql.includes('SELECT id, stripe_customer_id')) {
        return {
          bind: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(options.subscriptionRow ?? null),
          }),
        }
      }

      if (sql.includes('INSERT INTO subscriptions') || sql.includes('UPDATE subscriptions')) {
        options.captureSql?.push(sql)
        return {
          bind: vi.fn().mockReturnValue({
            run: vi.fn().mockResolvedValue({ success: true }),
          }),
        }
      }

      throw new Error(`Unexpected SQL in test: ${sql}`)
    }),
  } as unknown as D1Database
}

describe('getOrCreateStripeCustomer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetBillingSchemaCache()
    vi.mocked(getEnv).mockResolvedValue('sk_test_123')
    createStripeCustomerMock.mockResolvedValue({ id: 'cus_test_123' })
  })

  it('fails with a controlled billing config error when subscriptions table is missing', async () => {
    vi.mocked(getDb).mockResolvedValue(
      createDbMock({
        existingTables: ['users'],
        userRow: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'User One',
        },
      }),
    )

    await expect(getOrCreateStripeCustomer('user-1')).rejects.toMatchObject({
      name: 'BillingError',
      code: ErrorCode.BILLING_CONFIG_INVALID,
      message: 'Billing subscriptions table is not available',
      meta: { userId: 'user-1', table: 'subscriptions' },
    } satisfies Partial<BillingError>)
  })

  it('creates a stripe customer with a legacy subscriptions schema without new billing columns', async () => {
    const capturedSql: string[] = []

    vi.mocked(getDb).mockResolvedValue(
      createDbMock({
        userRow: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'User One',
        },
        subscriptionRow: null,
        tableColumns: {
          subscriptions: [
            'id',
            'user_id',
            'stripe_customer_id',
            'plan',
            'status',
            'monthly_credits',
            'created_at',
            'updated_at',
          ],
        },
        captureSql: capturedSql,
      }),
    )

    const result = await getOrCreateStripeCustomer('user-1')

    expect(result).toMatchObject({
      customerId: 'cus_test_123',
      subscriptionRowId: 'sub_new',
      email: 'user@example.com',
      name: 'User One',
    })
    expect(createStripeCustomerMock).toHaveBeenCalledWith({
      email: 'user@example.com',
      name: 'User One',
      metadata: { userId: 'user-1' },
    })
    expect(capturedSql).toHaveLength(1)
    expect(capturedSql[0]).toContain('INSERT INTO subscriptions')
    expect(capturedSql[0]).not.toContain('purchase_mode')
    expect(capturedSql[0]).not.toContain('billing_period')
    expect(capturedSql[0]).not.toContain('storage_gb')
  })
})
