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

import { getDb } from '@/lib/db'
import { BillingError, ErrorCode } from '@/lib/errors'

import { resetBillingSchemaCache } from './schema'
import { getOrCreateStripeCustomer } from './stripe-client'

function createDbMock(options: {
  existingTables?: string[]
  userColumns?: string[]
  userRow?: Record<string, unknown> | null
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

  return {
    prepare: vi.fn((sql: string) => {
      if (sql.includes("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")) {
        return {
          bind: vi.fn((tableName: string) => ({
            first: vi.fn().mockResolvedValue(existingTables.has(tableName) ? { name: tableName } : null),
          })),
        }
      }

      if (sql.includes("PRAGMA table_info('users')")) {
        return {
          all: vi.fn().mockResolvedValue({
            results: userColumns.map((name) => ({ name })),
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

      throw new Error(`Unexpected SQL in test: ${sql}`)
    }),
  } as unknown as D1Database
}

describe('getOrCreateStripeCustomer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetBillingSchemaCache()
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
})
