/**
 * [INPUT]: 依赖 lib/seo 的站点常量
 * [OUTPUT]: 对外提供 Web App Manifest
 * [POS]: App Router 的品牌与平台入口描述文件，为浏览器、移动设备与分享入口补全站点图标和名称信号
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { MetadataRoute } from 'next'

import { BASE_URL, SITE_DESCRIPTION, SITE_NAME } from '@/lib/seo'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: 'Nano Banana',
    description: SITE_DESCRIPTION,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#09090d',
    theme_color: '#09090d',
    icons: [
      {
        src: `${BASE_URL}/brand/logo-1024.png`,
        sizes: '1024x1024',
        type: 'image/png',
      },
      {
        src: `${BASE_URL}/brand/logo-1024.png`,
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
