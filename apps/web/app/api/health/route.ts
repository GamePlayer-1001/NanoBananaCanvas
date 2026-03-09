/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供 GET /api/health 健康检查端点
 * [POS]: api 路由的基础健康检查，部署验证用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.0.1',
  })
}