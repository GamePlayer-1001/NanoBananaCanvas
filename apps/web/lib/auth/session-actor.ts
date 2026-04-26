/**
 * [INPUT]: 依赖 @/lib/auth/identity-adapter 的 resolveRequestIdentity，
 *          依赖 ./user-store，依赖 @/lib/errors
 * [OUTPUT]: 对外提供 getSessionActor() / requireAuthenticatedActor()，统一输出业务可消费的会话 actor
 * [POS]: lib/auth 的会话门面层，负责把外部身份源收敛到 users 表与应用内部 actor 契约
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { AppError, AuthError, ErrorCode } from '@/lib/errors'

import { resolveRequestIdentity } from './identity-adapter'
import {
  findUserByIdentityKey,
  insertUserByIdentityKey,
  updateUserProfileByIdentityKey,
} from './user-store'

export type SessionActor =
  | {
      kind: 'anonymous'
      actorId: string
      userId: string
      identityKey: `anon:${string}`
      isAuthenticated: false
      email: string
      username: string
      firstName: string
      lastName: string
      name: string
      avatarUrl: string
      hasPassword: boolean
      plan: string
      membershipStatus: string
      createdAt: string
    }
  | {
      kind: 'clerk'
      actorId: string
      userId: string
      identityKey: `clerk:${string}`
      isAuthenticated: true
      clerkUserId: string
      email: string
      username: string
      firstName: string
      lastName: string
      name: string
      avatarUrl: string
      hasPassword: boolean
      plan: string
      membershipStatus: string
      createdAt: string
    }

export type AuthenticatedActor = Extract<SessionActor, { isAuthenticated: true }>

async function ensureAnonymousActor(identity: Extract<Awaited<ReturnType<typeof resolveRequestIdentity>>, { kind: 'anonymous' }>): Promise<SessionActor> {
  let user = await findUserByIdentityKey(identity.identityKey)

  if (!user) {
    await insertUserByIdentityKey(identity.identityKey, identity.profile)
    user = await findUserByIdentityKey(identity.identityKey)
  }

  if (!user) {
    throw new AppError(ErrorCode.UNKNOWN, 'Failed to initialize anonymous actor', {
      identityKey: identity.identityKey,
    })
  }

  return {
    kind: 'anonymous',
    actorId: user.id,
    userId: user.id,
    identityKey: user.clerk_id as `anon:${string}`,
    isAuthenticated: false,
    email: user.email,
    username: user.username,
    firstName: user.first_name,
    lastName: user.last_name,
    name: user.name,
    avatarUrl: user.avatar_url || '',
    hasPassword: false,
    plan: user.plan,
    membershipStatus: user.membership_status,
    createdAt: user.created_at,
  }
}

async function ensureClerkActor(identity: Extract<Awaited<ReturnType<typeof resolveRequestIdentity>>, { kind: 'clerk' }>): Promise<SessionActor> {
  let user = await findUserByIdentityKey(identity.identityKey)

  if (user) {
    const shouldRefresh =
      user.email !== identity.profile.email ||
      user.username !== identity.profile.username ||
      user.first_name !== identity.profile.firstName ||
      user.last_name !== identity.profile.lastName ||
      user.name !== identity.profile.name ||
      (user.avatar_url || '') !== identity.profile.avatarUrl

    if (shouldRefresh) {
      await updateUserProfileByIdentityKey(identity.identityKey, identity.profile)
      user = await findUserByIdentityKey(identity.identityKey)
    }
  }

  if (!user) {
    await insertUserByIdentityKey(identity.identityKey, identity.profile)
    user = await findUserByIdentityKey(identity.identityKey)
  }

  if (!user) {
    throw new AppError(ErrorCode.UNKNOWN, 'Failed to initialize authenticated actor', {
      identityKey: identity.identityKey,
    })
  }

  return {
    kind: 'clerk',
    actorId: user.id,
    userId: user.id,
    identityKey: user.clerk_id as `clerk:${string}`,
    isAuthenticated: true,
    clerkUserId: identity.clerkUserId,
    email: user.email,
    username: user.username,
    firstName: user.first_name,
    lastName: user.last_name,
    name: user.name,
    avatarUrl: user.avatar_url || '',
    hasPassword: identity.profile.hasPassword,
    plan: user.plan,
    membershipStatus: user.membership_status,
    createdAt: user.created_at,
  }
}

export async function getSessionActor(): Promise<SessionActor> {
  const identity = await resolveRequestIdentity()

  if (identity.kind === 'clerk') {
    return ensureClerkActor(identity)
  }

  return ensureAnonymousActor(identity)
}

export async function requireAuthenticatedActor(): Promise<AuthenticatedActor> {
  const actor = await getSessionActor()

  if (!actor.isAuthenticated || actor.kind !== 'clerk') {
    throw new AuthError(ErrorCode.AUTH_UNAUTHORIZED, 'Authentication required')
  }

  return actor
}
