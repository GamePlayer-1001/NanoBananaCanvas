/**
 * [INPUT]: 依赖 @nano-banana/shared 的 PlanType
 * [OUTPUT]: 对外提供 User/UserCredits
 * [POS]: types 的用户领域类型，被 auth/profile/billing 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { PlanType } from '@nano-banana/shared'

export interface User {
  id: string
  clerkId: string
  email: string
  name: string
  avatarUrl?: string
  plan: PlanType
  createdAt: string
}

export interface UserCredits {
  total: number
  used: number
  remaining: number
  resetAt: string
}
