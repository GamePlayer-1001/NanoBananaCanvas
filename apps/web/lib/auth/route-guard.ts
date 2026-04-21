/**
 * [INPUT]: 依赖 @/lib/auth/session-actor 的 requireAuthenticatedActor
 * [OUTPUT]: 对外提供 requireAccountActor()，为账户级资源守卫提供语义化别名
 * [POS]: lib/auth 的资源守卫层，避免账户级 API 直接依赖底层 session facade 名称
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuthenticatedActor } from './session-actor'

export async function requireAccountActor() {
  return requireAuthenticatedActor()
}
