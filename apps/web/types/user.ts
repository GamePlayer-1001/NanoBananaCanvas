/**
 * [INPUT]: 无额外依赖
 * [OUTPUT]: 对外提供 User
 * [POS]: types 的用户领域类型，被 auth/profile 等用户态 UI 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export interface User {
  id: string
  identityKey: string
  email: string
  username: string
  firstName: string
  lastName: string
  name: string
  avatarUrl?: string
  tier: string
  membershipStatus: string
  createdAt: string
}
