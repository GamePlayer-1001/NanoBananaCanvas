/**
 * [INPUT]: 依赖 vitest，mock @/lib/db 与 @/lib/nanoid，依赖 ./user-store
 * [OUTPUT]: 对外提供 users 身份兼容测试，覆盖 legacy Clerk ID 读取与自动迁移
 * [POS]: lib/auth 的 user-store 回归测试，防止历史身份键导致同一账号拆成多条 users 记录
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(),
}))

vi.mock('@/lib/nanoid', () => ({
  nanoid: vi.fn(() => 'user_test_id'),
}))

import { getDb } from '@/lib/db'

import { findUserByIdentityKey, resetUsersColumnsCache } from './user-store'

function createDbMock(options: {
  legacyRow?: Record<string, unknown> | null
  exactRow?: Record<string, unknown> | null
  updates?: Array<{ sql: string; args: unknown[] }>
}) {
  const updates = options.updates ?? []

  return {
    prepare: vi.fn((sql: string) => {
      if (sql.includes("PRAGMA table_info(users)")) {
        return {
          all: vi.fn().mockResolvedValue({
            results: [
              { name: 'id' },
              { name: 'clerk_id' },
              { name: 'email' },
              { name: 'username' },
              { name: 'first_name' },
              { name: 'last_name' },
              { name: 'name' },
              { name: 'avatar_url' },
              { name: 'plan' },
              { name: 'membership_status' },
              { name: 'timezone' },
              { name: 'created_at' },
              { name: 'updated_at' },
            ],
          }),
        }
      }

      if (sql.includes('WHERE clerk_id IN (?, ?)')) {
        return {
          bind: vi.fn(() => ({
            first: vi.fn().mockResolvedValue(options.exactRow ?? options.legacyRow ?? null),
          })),
        }
      }

      if (sql.includes('WHERE clerk_id = ?')) {
        return {
          bind: vi.fn((identityKey: string) => ({
            first: vi.fn().mockResolvedValue(
              identityKey === 'clerk:user_123' ? options.exactRow ?? null : options.legacyRow ?? null,
            ),
          })),
        }
      }

      if (sql.startsWith('UPDATE users SET clerk_id = ?')) {
        return {
          bind: vi.fn((...args: unknown[]) => ({
            run: vi.fn().mockImplementation(async () => {
              updates.push({ sql, args })
              return {}
            }),
          })),
        }
      }

      throw new Error(`Unhandled SQL in test: ${sql}`)
    }),
  } as unknown as D1Database
}

describe('user-store identity compatibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetUsersColumnsCache()
  })

  it('migrates legacy raw Clerk ids to the prefixed identity key on read', async () => {
    const updates: Array<{ sql: string; args: unknown[] }> = []
    vi.mocked(getDb).mockResolvedValue(
      createDbMock({
        legacyRow: {
          id: 'db_user_1',
          clerk_id: 'user_123',
          email: 'test@example.com',
          username: 'tester',
          first_name: 'Test',
          last_name: 'User',
          name: 'Test User',
          avatar_url: '',
          plan: 'free',
          membership_status: 'free',
          timezone: 'Asia/Shanghai',
          created_at: '2026-05-11T00:00:00.000Z',
        },
        updates,
      }),
    )

    const user = await findUserByIdentityKey('clerk:user_123')

    expect(user).toMatchObject({
      id: 'db_user_1',
      clerk_id: 'clerk:user_123',
      timezone: 'Asia/Shanghai',
    })
    expect(updates).toEqual([
      {
        sql: "UPDATE users SET clerk_id = ?, updated_at = datetime('now') WHERE id = ? AND clerk_id = ?",
        args: ['clerk:user_123', 'db_user_1', 'user_123'],
      },
    ])
  })

  it('prefers the canonical prefixed identity row when both legacy and canonical rows exist', async () => {
    vi.mocked(getDb).mockResolvedValue(
      createDbMock({
        exactRow: {
          id: 'db_user_2',
          clerk_id: 'clerk:user_123',
          email: 'test@example.com',
          username: 'tester',
          first_name: 'Test',
          last_name: 'User',
          name: 'Test User',
          avatar_url: '',
          plan: 'free',
          membership_status: 'free',
          timezone: 'America/Los_Angeles',
          created_at: '2026-05-11T00:00:00.000Z',
        },
        legacyRow: {
          id: 'db_user_1',
          clerk_id: 'user_123',
          email: 'legacy@example.com',
          username: 'legacy',
          first_name: 'Legacy',
          last_name: 'User',
          name: 'Legacy User',
          avatar_url: '',
          plan: 'free',
          membership_status: 'free',
          timezone: 'Asia/Shanghai',
          created_at: '2026-05-10T00:00:00.000Z',
        },
      }),
    )

    const user = await findUserByIdentityKey('clerk:user_123')

    expect(user).toMatchObject({
      id: 'db_user_2',
      clerk_id: 'clerk:user_123',
      timezone: 'America/Los_Angeles',
    })
  })
})
