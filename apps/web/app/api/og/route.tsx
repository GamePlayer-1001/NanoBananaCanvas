/**
 * [INPUT]: 依赖 next/og 的 ImageResponse
 * [OUTPUT]: 对外提供动态 OG 图片生成 (1200x630)
 * [POS]: API 路由，被各页面 openGraph.images 引用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const title = searchParams.get('title') || 'Nano Banana Canvas'
  const subtitle =
    searchParams.get('subtitle') || 'Visual AI Workflow Platform'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
          padding: '60px',
        }}
      >
        {/* 品牌标识 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '16px',
              fontSize: '28px',
            }}
          >
            🍌
          </div>
          <span
            style={{
              fontSize: '28px',
              color: '#94a3b8',
              letterSpacing: '-0.02em',
            }}
          >
            Nano Banana Canvas
          </span>
        </div>

        {/* 标题 */}
        <div
          style={{
            fontSize: '56px',
            fontWeight: 700,
            color: '#f8fafc',
            textAlign: 'center',
            lineHeight: 1.2,
            maxWidth: '900px',
            letterSpacing: '-0.03em',
          }}
        >
          {title}
        </div>

        {/* 副标题 */}
        <div
          style={{
            fontSize: '24px',
            color: '#94a3b8',
            marginTop: '20px',
            textAlign: 'center',
            maxWidth: '700px',
          }}
        >
          {subtitle}
        </div>

        {/* 底部装饰线 */}
        <div
          style={{
            width: '120px',
            height: '4px',
            borderRadius: '2px',
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            marginTop: '40px',
          }}
        />
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
