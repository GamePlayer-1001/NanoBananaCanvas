/**
 * [INPUT]: 依赖 @/lib/api/auth、@/lib/api/response、@/lib/billing/ledger
 * [OUTPUT]: 对外提供 GET/POST /api/credits/signin，返回签到状态并执行每日签到发放
 * [POS]: api/credits 的签到入口，被工作台侧边栏消费，负责把“当天一次的试用积分领取”接到真实账本
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuthenticatedAuth } from '@/lib/api/auth'
import { apiOk, handleApiError } from '@/lib/api/response'
import {
  awardDailySigninCredits,
  getDailySigninStatus,
} from '@/lib/billing/ledger'

export async function GET() {
  try {
    const { userId } = await requireAuthenticatedAuth()
    const result = await getDailySigninStatus(userId)
    return apiOk(result)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST() {
  try {
    const { userId } = await requireAuthenticatedAuth()
    const result = await awardDailySigninCredits(userId)
    return apiOk(result)
  } catch (error) {
    return handleApiError(error)
  }
}
