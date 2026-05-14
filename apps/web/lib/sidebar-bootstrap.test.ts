/**
 * [INPUT]: 依赖 vitest，依赖 ./sidebar-bootstrap，mock @/lib/db、@/lib/billing/credits、@/lib/billing/ledger
 * [OUTPUT]: 对外提供侧边栏 bootstrap 回归测试，覆盖真实签到状态优先于余额猜测的聚合口径
 * [POS]: lib 的侧边栏聚合测试，防止时区与签到状态再次从余额层漂移
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(),
}))

vi.mock('@/lib/billing/credits', () => ({
  getCreditBalanceSummary: vi.fn(),
}))

vi.mock('@/lib/billing/ledger', () => ({
  getDailySigninStatus: vi.fn(),
}))

import { getCreditBalanceSummary } from '@/lib/billing/credits'
import { getDb } from '@/lib/db'
import { getDailySigninStatus } from '@/lib/billing/ledger'

import { getSidebarBootstrap } from './sidebar-bootstrap'

describe('sidebar bootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses ledger signin status instead of inferring from the balance snapshot', async () => {
    vi.mocked(getDb).mockResolvedValue({
      prepare: vi.fn(() => ({
        bind: vi.fn(() => ({
          all: vi.fn().mockResolvedValue({ results: [] }),
        })),
      })),
    } as unknown as D1Database)

    vi.mocked(getCreditBalanceSummary).mockResolvedValue({
      userId: 'user-1',
      plan: 'free',
      membershipStatus: 'free',
      trialBalance: 100,
      trialExpiresAt: '2099-05-02T00:00:00.000Z',
      monthlyBalance: 0,
      permanentBalance: 0,
      frozenCredits: 0,
      availableCredits: 100,
      totalCredits: 100,
      totalEarned: 100,
      totalSpent: 0,
      checkedInToday: true,
      currentPlanMonthlyCredits: 0,
      updatedAt: null,
    })

    vi.mocked(getDailySigninStatus).mockResolvedValue({
      status: 'available',
      available: true,
      checkedInToday: false,
      trialBalance: 100,
      trialExpiresAt: '2099-05-02T00:00:00.000Z',
    })

    const result = await getSidebarBootstrap({
      kind: 'clerk',
      actorId: 'actor-1',
      userId: 'user-1',
      identityKey: 'clerk:test',
      isAuthenticated: true,
      clerkUserId: 'clerk_123',
      email: 'test@example.com',
      username: 'tester',
      firstName: 'Test',
      lastName: 'User',
      name: 'Test User',
      avatarUrl: '',
      hasPassword: true,
      plan: 'free',
      membershipStatus: 'free',
      timezone: 'Asia/Shanghai',
      createdAt: '2026-05-11T00:00:00.000Z',
    })

    expect(getDailySigninStatus).toHaveBeenCalledWith('user-1', {
      reportedTimezone: 'Asia/Shanghai',
    })
    expect(result.signinStatus).toEqual({
      status: 'available',
      available: true,
      checkedInToday: false,
      trialBalance: 100,
      trialExpiresAt: '2099-05-02T00:00:00.000Z',
    })
  })
})
