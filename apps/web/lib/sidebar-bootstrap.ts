/**
 * [INPUT]: 依赖 @/lib/db，依赖 @/lib/auth/session-actor，依赖 @/lib/billing/credits
 * [OUTPUT]: 对外提供 getSidebarBootstrap，聚合侧边栏所需的用户/积分/签到/文件夹数据
 * [POS]: lib 的侧边栏聚合读取层，被 bootstrap API 与服务端预取复用，负责把 4 次常驻请求收口为 1 次
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { SessionActor } from '@/lib/auth/session-actor'
import { getCreditBalanceSummary, type CreditBalanceSummary } from '@/lib/billing/credits'
import { getDb } from '@/lib/db'

export interface SidebarFolderSummary {
  id: string
  name: string
  sort_order: number
  created_at: string
  updated_at: string
  project_count: number
}

export interface SidebarSigninStatus {
  status: 'available' | 'claimed' | 'unavailable'
  available: boolean
  checkedInToday: boolean
  trialBalance: number
  trialExpiresAt: string | null
}

export interface SidebarBootstrapPayload {
  user: {
    id: string
    actorId: string
    actorKind: SessionActor['kind']
    isAuthenticated: boolean
    identityKey: string
    clerkUserId?: string | null
    username: string
    firstName: string
    lastName: string
    name: string
    email: string
    avatarUrl: string
    hasPassword: boolean
    tier: string
    plan: string
    membershipStatus: string
    timezone: string | null
    createdAt: string
  }
  balance: CreditBalanceSummary | null
  signinStatus: SidebarSigninStatus | null
  folders: SidebarFolderSummary[]
}

async function getSidebarFolders(userId: string): Promise<SidebarFolderSummary[]> {
  const db = await getDb()
  const result = await db
    .prepare(
      `SELECT
         folders.id,
         folders.name,
         folders.sort_order,
         folders.created_at,
         folders.updated_at,
         COUNT(workflows.id) AS project_count
       FROM folders
       LEFT JOIN workflows
         ON workflows.folder_id = folders.id
        AND workflows.user_id = folders.user_id
       WHERE folders.user_id = ?
       GROUP BY folders.id, folders.name, folders.sort_order, folders.created_at, folders.updated_at
       ORDER BY folders.sort_order ASC, folders.created_at ASC`,
    )
    .bind(userId)
    .all<SidebarFolderSummary>()

  return result.results ?? []
}

function toSigninStatus(balance: CreditBalanceSummary): SidebarSigninStatus {
  const available = balance.checkedInToday === false

  return {
    status: balance.checkedInToday ? 'claimed' : available ? 'available' : 'unavailable',
    available,
    checkedInToday: balance.checkedInToday,
    trialBalance: balance.trialBalance,
    trialExpiresAt: balance.trialExpiresAt,
  }
}

export async function getSidebarBootstrap(actor: SessionActor): Promise<SidebarBootstrapPayload> {
  const foldersPromise = getSidebarFolders(actor.userId)
  const balancePromise = actor.isAuthenticated
    ? getCreditBalanceSummary(actor.userId).catch(() => null)
    : Promise.resolve<CreditBalanceSummary | null>(null)

  const [folders, balance] = await Promise.all([foldersPromise, balancePromise])

  return {
    user: {
      id: actor.userId,
      actorId: actor.actorId,
      actorKind: actor.kind,
      isAuthenticated: actor.isAuthenticated,
      identityKey: actor.identityKey,
      clerkUserId: actor.kind === 'clerk' ? actor.clerkUserId : null,
      username: actor.username,
      firstName: actor.firstName,
      lastName: actor.lastName,
      name: actor.name,
      email: actor.email,
      avatarUrl: actor.avatarUrl,
      hasPassword: actor.hasPassword,
      tier: actor.plan,
      plan: actor.plan,
      membershipStatus: actor.membershipStatus,
      timezone: actor.timezone,
      createdAt: actor.createdAt,
    },
    balance,
    signinStatus: balance ? toSigninStatus(balance) : null,
    folders,
  }
}
