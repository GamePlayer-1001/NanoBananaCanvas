/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供 robots.txt 配置
 * [POS]: App Router 的 robots.txt 生成器，控制搜索引擎爬取范围
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { MetadataRoute } from 'next'
import { BASE_URL } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/account',
          '/canvas/',
          '/sign-in',
          '/sign-up',
          '/workspace/',
        ],
      },
    ],
    host: BASE_URL,
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
