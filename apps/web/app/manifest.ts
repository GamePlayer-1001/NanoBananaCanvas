/**
 * [INPUT]: 依赖 lib/seo 的站点名称与描述常量
 * [OUTPUT]: 对外提供 Web App Manifest
 * [POS]: App Router 的品牌与平台入口描述文件，为浏览器、移动设备与分享入口补全站点图标和名称信号；图标统一走站内相对路径，避免绝对 URL 在缓存重验证时触发安装图标读取失败
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { MetadataRoute } from 'next'

import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/seo'

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
        src: '/brand/logo-1024.png',
        sizes: '1024x1024',
        type: 'image/png',
      },
      {
        src: '/brand/logo-1024.png',
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
