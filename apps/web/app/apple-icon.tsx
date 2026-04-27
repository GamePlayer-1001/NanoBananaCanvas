/**
 * [INPUT]: 无外部运行时依赖
 * [OUTPUT]: 对外提供 apple-touch-icon 品牌图标
 * [POS]: App Router 的 Apple 触屏图标生成器，为 iOS 收藏与主屏入口提供统一品牌标识
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { ImageResponse } from 'next/og'

export const size = {
  width: 180,
  height: 180,
}

export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #09090d 0%, #101828 45%, #172554 100%)',
        color: '#f8fafc',
        fontSize: 86,
        fontWeight: 800,
        letterSpacing: '-0.06em',
      }}
    >
      NB
    </div>,
    size,
  )
}
