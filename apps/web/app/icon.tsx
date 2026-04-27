/**
 * [INPUT]: 无外部运行时依赖
 * [OUTPUT]: 对外提供站点 favicon/icon 品牌图标
 * [POS]: App Router 的通用图标生成器，为浏览器标签、快捷入口与分享外围资产提供统一品牌标识
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { ImageResponse } from 'next/og'

export const size = {
  width: 512,
  height: 512,
}

export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(circle at top, #1d4ed8 0%, #172554 42%, #09090d 100%)',
        color: '#f8fafc',
        fontSize: 224,
        fontWeight: 800,
        letterSpacing: '-0.08em',
      }}
    >
      NB
    </div>,
    size,
  )
}
