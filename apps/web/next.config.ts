/**
 * [INPUT]: 依赖 next 核心配置
 * [OUTPUT]: 对外提供 Next.js 构建配置
 * [POS]: apps/web 的 Next.js 配置文件
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.clerk.com',
      },
    ],
  },
}

export default nextConfig
