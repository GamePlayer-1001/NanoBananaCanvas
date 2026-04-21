/**
 * [INPUT]: 依赖 @/lib/auth/session-actor 的 getSessionActor / requireAuthenticatedActor
 * [OUTPUT]: 对外提供 requireAuth() / optionalAuth() / requireAuthenticatedAuth()
 * [POS]: lib/api 的 API 用户上下文入口，向现有 route handlers 屏蔽 Clerk 会话与匿名访客的底层差异
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import {
  getSessionActor,
  requireAuthenticatedActor as requireAuthenticatedSessionActor,
  type AuthenticatedActor,
  type SessionActor,
} from '@/lib/auth/session-actor'

/* ─── Types ──────────────────────────────────────────── */

export interface AuthUser {
  userId: string
  identityKey: string
  actorId: string
  actorKind: SessionActor['kind']
  isAuthenticated: boolean
  email: string
  username: string
  firstName: string
  lastName: string
  name: string
  avatarUrl: string
  plan: string
  membershipStatus: string
  createdAt: string
  clerkUserId?: string
}

function toAuthUser(actor: SessionActor): AuthUser {
  return {
    userId: actor.userId,
    actorId: actor.actorId,
    identityKey: actor.identityKey,
    actorKind: actor.kind,
    isAuthenticated: actor.isAuthenticated,
    email: actor.email,
    username: actor.username,
    firstName: actor.firstName,
    lastName: actor.lastName,
    name: actor.name,
    avatarUrl: actor.avatarUrl,
    plan: actor.plan,
    membershipStatus: actor.membershipStatus,
    createdAt: actor.createdAt,
    clerkUserId: actor.kind === 'clerk' ? actor.clerkUserId : undefined,
  }
}

export interface AuthenticatedAuthUser extends AuthUser {
  actorKind: 'clerk'
  isAuthenticated: true
  clerkUserId: string
}

/** 统一返回当前请求 actor，上层无需关心是 Clerk 账户还是匿名访客。 */
export async function requireAuth(): Promise<AuthUser> {
  const actor = await getSessionActor()
  return toAuthUser(actor)
}

/** 当前项目里 optionalAuth 与 requireAuth 等价，但保留接口以兼容公开页分支判断。 */
export async function optionalAuth(): Promise<AuthUser | null> {
  const actor = await getSessionActor()
  return toAuthUser(actor)
}

/** 仅在必须登录的资源上使用，明确拒绝匿名访客。 */
export async function requireAuthenticatedAuth(): Promise<AuthenticatedAuthUser> {
  const actor: AuthenticatedActor = await requireAuthenticatedSessionActor()
  return toAuthUser(actor) as AuthenticatedAuthUser
}
