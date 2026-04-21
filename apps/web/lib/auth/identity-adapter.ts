/**
 * [INPUT]: 依赖 @clerk/nextjs/server 的 auth/currentUser，依赖 next/headers 的 cookies，
 *          依赖 @/lib/nanoid 生成匿名访客 ID
 * [OUTPUT]: 对外提供 resolveRequestIdentity()，统一解析 Clerk 登录态与匿名访客态
 * [POS]: lib/auth 的身份来源适配层，向 session-actor 提供单一身份输入，不让业务层直接接触 Clerk 原始对象
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { auth, currentUser } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'

import { nanoid } from '@/lib/nanoid'

const ANON_COOKIE_NAME = 'nb_guest_id'
const ANON_COOKIE_MAX_AGE = 60 * 60 * 24 * 365
const ANON_IDENTITY_PREFIX = 'anon:'
const CLERK_IDENTITY_PREFIX = 'clerk:'

type IdentityProfile = {
  email: string
  username: string
  firstName: string
  lastName: string
  name: string
  avatarUrl: string
}

export type ResolvedIdentity =
  | {
      kind: 'anonymous'
      anonymousId: string
      identityKey: `anon:${string}`
      isAuthenticated: false
      profile: IdentityProfile
    }
  | {
      kind: 'clerk'
      clerkUserId: string
      identityKey: `clerk:${string}`
      isAuthenticated: true
      profile: IdentityProfile
    }

function toAnonymousIdentityKey(anonymousId: string): `anon:${string}` {
  return `${ANON_IDENTITY_PREFIX}${anonymousId}`
}

function toClerkIdentityKey(clerkUserId: string): `clerk:${string}` {
  return `${CLERK_IDENTITY_PREFIX}${clerkUserId}`
}

function pickPrimaryEmail(user: Awaited<ReturnType<typeof currentUser>>) {
  if (!user) return ''

  const primaryEmail =
    user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId)
      ?.emailAddress ?? user.emailAddresses[0]?.emailAddress

  return primaryEmail ?? ''
}

function pickDisplayName(user: Awaited<ReturnType<typeof currentUser>>) {
  if (!user) return 'Member'

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
  return fullName || user.fullName || user.username || user.firstName || user.lastName || 'Member'
}

async function resolveAnonymousIdentity(): Promise<ResolvedIdentity> {
  const cookieStore = await cookies()
  let anonymousId = cookieStore.get(ANON_COOKIE_NAME)?.value

  if (!anonymousId) {
    anonymousId = nanoid()
    cookieStore.set(ANON_COOKIE_NAME, anonymousId, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: ANON_COOKIE_MAX_AGE,
    })
  }

  return {
    kind: 'anonymous',
    anonymousId,
    identityKey: toAnonymousIdentityKey(anonymousId),
    isAuthenticated: false,
    profile: {
      email: '',
      username: '',
      firstName: '',
      lastName: '',
      name: 'Guest',
      avatarUrl: '',
    },
  }
}

export async function resolveRequestIdentity(): Promise<ResolvedIdentity> {
  const authState = await auth()

  if (!authState.userId) {
    return resolveAnonymousIdentity()
  }

  const user = await currentUser()

  return {
    kind: 'clerk',
    clerkUserId: authState.userId,
    identityKey: toClerkIdentityKey(authState.userId),
    isAuthenticated: true,
    profile: {
      email: pickPrimaryEmail(user),
      username: user?.username ?? '',
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      name: pickDisplayName(user),
      avatarUrl: user?.imageUrl ?? '',
    },
  }
}
