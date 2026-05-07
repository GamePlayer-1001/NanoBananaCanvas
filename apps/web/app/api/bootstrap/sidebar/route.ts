/**
 * [INPUT]: 依赖 @/lib/api/auth，依赖 @/lib/api/response，依赖 @/lib/sidebar-bootstrap
 * [OUTPUT]: 对外提供 GET /api/bootstrap/sidebar，返回侧边栏所需的用户/积分/签到/文件夹聚合数据
 * [POS]: api/bootstrap 的侧边栏聚合入口，用于把常驻 4 请求收口成 1 请求
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { apiOk, handleApiError } from '@/lib/api/response'
import { getSidebarBootstrap } from '@/lib/sidebar-bootstrap'

export async function GET() {
  try {
    const actor = await requireAuth()
    const payload = await getSidebarBootstrap(
      actor.actorKind === 'clerk'
        ? {
            kind: 'clerk',
            actorId: actor.actorId,
            userId: actor.userId,
            identityKey: actor.identityKey as `clerk:${string}`,
            isAuthenticated: true,
            clerkUserId: actor.clerkUserId ?? '',
            email: actor.email,
            username: actor.username,
            firstName: actor.firstName,
            lastName: actor.lastName,
            name: actor.name,
            avatarUrl: actor.avatarUrl,
            hasPassword: actor.hasPassword,
            plan: actor.plan,
            membershipStatus: actor.membershipStatus,
            timezone: actor.timezone,
            createdAt: actor.createdAt,
          }
        : {
            kind: 'anonymous',
            actorId: actor.actorId,
            userId: actor.userId,
            identityKey: actor.identityKey as `anon:${string}`,
            isAuthenticated: false,
            email: actor.email,
            username: actor.username,
            firstName: actor.firstName,
            lastName: actor.lastName,
            name: actor.name,
            avatarUrl: actor.avatarUrl,
            hasPassword: actor.hasPassword,
            plan: actor.plan,
            membershipStatus: actor.membershipStatus,
            timezone: actor.timezone,
            createdAt: actor.createdAt,
          },
    )
    return apiOk(payload)
  } catch (error) {
    return handleApiError(error)
  }
}
