/**
 * [INPUT]: 依赖 @/lib/auth/identity-adapter 的 resolveRequestIdentity，
 *          依赖 @/lib/db，依赖 @/lib/errors，依赖 @/lib/nanoid
 * [OUTPUT]: 对外提供 getSessionActor() / requireAuthenticatedActor()，统一输出业务可消费的会话 actor
 * [POS]: lib/auth 的会话门面层，负责把外部身份源收敛到 users 表与应用内部 actor 契约
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { getDb } from '@/lib/db'
import { AppError, AuthError, ErrorCode } from '@/lib/errors'
import { nanoid } from '@/lib/nanoid'

import { resolveRequestIdentity } from './identity-adapter'

type DbUserRow = {
  id: string
  clerk_id: string
  email: string
  name: string
  avatar_url: string
  plan: string
  created_at: string
}

export type SessionActor =
  | {
      kind: 'anonymous'
      actorId: string
      userId: string
      identityKey: `anon:${string}`
      isAuthenticated: false
      email: string
      name: string
      avatarUrl: string
      plan: string
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
      name: string
      avatarUrl: string
      plan: string
      createdAt: string
    }

export type AuthenticatedActor = Extract<SessionActor, { isAuthenticated: true }>

async function findUserByIdentityKey(identityKey: string) {
  const db = await getDb()
  return db
    .prepare(
      `SELECT id, clerk_id, email, name, avatar_url, plan, created_at
       FROM users
       WHERE clerk_id = ?`,
    )
    .bind(identityKey)
    .first<DbUserRow>()
}

async function ensureAnonymousActor(identity: Extract<Awaited<ReturnType<typeof resolveRequestIdentity>>, { kind: 'anonymous' }>): Promise<SessionActor> {
  const db = await getDb()
  let user = await findUserByIdentityKey(identity.identityKey)

  if (!user) {
    const newUserId = nanoid()
    await db
      .prepare(
        `INSERT OR IGNORE INTO users (id, clerk_id, email, name, avatar_url, plan)
         VALUES (?, ?, ?, ?, ?, 'free')`,
      )
      .bind(
        newUserId,
        identity.identityKey,
        identity.profile.email,
        identity.profile.name,
        identity.profile.avatarUrl,
      )
      .run()

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
    name: user.name,
    avatarUrl: user.avatar_url || '',
    plan: user.plan,
    createdAt: user.created_at,
  }
}

async function ensureClerkActor(identity: Extract<Awaited<ReturnType<typeof resolveRequestIdentity>>, { kind: 'clerk' }>): Promise<SessionActor> {
  const db = await getDb()
  let user = await findUserByIdentityKey(identity.identityKey)

  if (user) {
    const shouldRefresh =
      user.email !== identity.profile.email ||
      user.name !== identity.profile.name ||
      (user.avatar_url || '') !== identity.profile.avatarUrl

    if (shouldRefresh) {
      await db
        .prepare(
          `UPDATE users
           SET email = ?, name = ?, avatar_url = ?, updated_at = datetime('now')
           WHERE clerk_id = ?`,
        )
        .bind(
          identity.profile.email,
          identity.profile.name,
          identity.profile.avatarUrl,
          identity.identityKey,
        )
        .run()

      user = await findUserByIdentityKey(identity.identityKey)
    }
  }

  if (!user) {
    const newUserId = nanoid()
    await db
      .prepare(
        `INSERT INTO users (id, clerk_id, email, name, avatar_url, plan)
         VALUES (?, ?, ?, ?, ?, 'free')`,
      )
      .bind(
        newUserId,
        identity.identityKey,
        identity.profile.email,
        identity.profile.name,
        identity.profile.avatarUrl,
      )
      .run()

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
    name: user.name,
    avatarUrl: user.avatar_url || '',
    plan: user.plan,
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
