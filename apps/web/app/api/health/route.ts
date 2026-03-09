/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供 GET /api/health 健康检查端点
 * [POS]: api 路由的基础健康检查，部署验证用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  // 临时调试: 测试 Clerk auth() 在 CF Workers 中的行为
  let authDebug: Record<string, unknown> = {}
  try {
    const result = await auth()
    authDebug = { ok: true, userId: result.userId ?? null }
  } catch (e) {
    authDebug = {
      ok: false,
      name: e instanceof Error ? e.name : 'unknown',
      message: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack?.split('\n').slice(0, 3) : undefined,
    }
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.0.1',
    authDebug,
  })
}
