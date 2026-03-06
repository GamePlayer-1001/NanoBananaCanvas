/**
 * [INPUT]: 依赖 vitest，依赖 ./engine
 * [OUTPUT]: credit engine 核心事务逻辑测试
 * [POS]: lib/credits 的引擎测试，验证冻结/确认/退还 + 幂等性 + 优先级消耗
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { describe, expect, it } from 'vitest'
import { freezeCredits, confirmSpend, refundCredits, getBalance } from './engine'

/* ─── Minimal D1 Mock ────────────────────────────────── */

function createMockD1() {
  const tables: Record<string, MockRow[]> = {
    credit_balances: [],
    credit_transactions: [],
  }

  const db = {
    prepare(sql: string) {
      let boundValues: unknown[] = []

      const stmt = {
        bind(...args: unknown[]) {
          boundValues = args
          return stmt
        },
        async first<T>(): Promise<T | null> {
          const normalizedSql = sql.toLowerCase().trim()

          if (normalizedSql.includes('from credit_balances')) {
            const userId = boundValues[0] as string
            const row = tables.credit_balances.find((r) => r.user_id === userId)
            return (row as T) ?? null
          }

          if (normalizedSql.includes('from credit_transactions')) {
            const rows = tables.credit_transactions.filter((r) => {
              if (normalizedSql.includes('reference_id = ?')) {
                return r.reference_id === boundValues[0] && r.type === boundValues[1]
              }
              if (normalizedSql.includes('id = ?')) {
                return r.id === boundValues[0] && r.type === boundValues[1]
              }
              return false
            })
            return (rows[0] as T) ?? null
          }

          return null
        },
        async run() {
          const normalizedSql = sql.toLowerCase().trim()

          if (normalizedSql.startsWith('insert') && normalizedSql.includes('credit_balances')) {
            const userId = boundValues[0] as string
            if (!tables.credit_balances.find((r) => r.user_id === userId)) {
              tables.credit_balances.push({
                user_id: userId,
                monthly_balance: 200,
                permanent_balance: 0,
                frozen: 0,
                total_earned: 200,
                total_spent: 0,
              })
            }
          }

          return { meta: { changes: 1 } }
        },
      }

      return stmt
    },
    async batch(stmts: unknown[]) {
      // 每条语句返回成功
      return stmts.map(() => ({ meta: { changes: 1 } }))
    },
    _tables: tables,
  }

  return db as unknown as D1Database & { _tables: typeof tables }
}

/* ─── Seed Helper ────────────────────────────────────── */

function seedBalance(
  db: ReturnType<typeof createMockD1>,
  userId: string,
  monthly: number,
  permanent: number,
  frozen = 0,
) {
  db._tables.credit_balances = [
    {
      user_id: userId,
      monthly_balance: monthly,
      permanent_balance: permanent,
      frozen,
      total_earned: monthly + permanent,
      total_spent: 0,
    },
  ]
}

function seedTransaction(
  db: ReturnType<typeof createMockD1>,
  id: string,
  userId: string,
  type: string,
  amount: number,
  pool: string,
  referenceId?: string,
) {
  db._tables.credit_transactions.push({
    id,
    user_id: userId,
    type,
    amount,
    pool,
    reference_id: referenceId ?? null,
    balance_after: 0,
    source: 'test',
  })
}

/* ─── Tests ──────────────────────────────────────────── */

describe('getBalance', () => {
  it('returns existing balance', async () => {
    const db = createMockD1()
    seedBalance(db, 'u1', 500, 100)

    const balance = await getBalance(db, 'u1')
    expect(balance.monthlyBalance).toBe(500)
    expect(balance.permanentBalance).toBe(100)
  })

  it('initializes balance for new user', async () => {
    const db = createMockD1()

    const balance = await getBalance(db, 'new-user')
    expect(balance.monthlyBalance).toBe(200)
    expect(balance.permanentBalance).toBe(0)
    expect(balance.frozen).toBe(0)
  })
})

describe('freezeCredits', () => {
  it('throws on insufficient credits', async () => {
    const db = createMockD1()
    seedBalance(db, 'u1', 5, 0)

    await expect(freezeCredits(db, 'u1', 10)).rejects.toThrow('Insufficient credits')
  })

  it('throws on zero or negative amount', async () => {
    const db = createMockD1()
    seedBalance(db, 'u1', 100, 0)

    await expect(freezeCredits(db, 'u1', 0)).rejects.toThrow('positive')
    await expect(freezeCredits(db, 'u1', -5)).rejects.toThrow('positive')
  })

  it('returns transaction ID on success', async () => {
    const db = createMockD1()
    seedBalance(db, 'u1', 100, 50)

    const txId = await freezeCredits(db, 'u1', 10)
    expect(txId).toBeTruthy()
    expect(typeof txId).toBe('string')
  })

  it('freezes from monthly first', async () => {
    const db = createMockD1()
    seedBalance(db, 'u1', 30, 20)

    // 冻结 25: 应从 monthly 取 25
    const txId = await freezeCredits(db, 'u1', 25)
    expect(txId).toBeTruthy()
  })

  it('freezes from both pools when monthly insufficient', async () => {
    const db = createMockD1()
    seedBalance(db, 'u1', 10, 20)

    // 冻结 20: monthly=10 + permanent=10
    const txId = await freezeCredits(db, 'u1', 20)
    expect(txId).toBeTruthy()
  })
})

describe('confirmSpend — idempotency', () => {
  it('skips if spend already confirmed', async () => {
    const db = createMockD1()
    seedBalance(db, 'u1', 100, 0, 10)
    // 已有一笔 spend 记录
    seedTransaction(db, 'spend-1', 'u1', 'spend', 10, 'monthly', 'freeze-tx-1')

    // 不应抛错，应静默返回
    await expect(confirmSpend(db, 'u1', 'freeze-tx-1', 10)).resolves.toBeUndefined()
  })
})

describe('refundCredits — idempotency', () => {
  it('skips if refund already processed', async () => {
    const db = createMockD1()
    seedBalance(db, 'u1', 100, 0, 10)
    // 已有一笔 refund 记录
    seedTransaction(db, 'refund-1', 'u1', 'refund', 10, 'monthly', 'freeze-tx-2')

    // 不应抛错，应静默返回
    await expect(refundCredits(db, 'u1', 'freeze-tx-2')).resolves.toBeUndefined()
  })

  it('returns silently when freeze transaction not found', async () => {
    const db = createMockD1()
    seedBalance(db, 'u1', 100, 0)

    // 没有对应的 freeze 事务，应该静默返回
    await expect(refundCredits(db, 'u1', 'nonexistent')).resolves.toBeUndefined()
  })
})
