/**
 * [INPUT]: 依赖 lib/seo 的 BASE_URL
 * [OUTPUT]: 对外提供 robots.txt 配置与多 sitemap 入口
 * [POS]: App Router 的 robots.txt 生成器，控制搜索引擎爬取范围，并向爬虫声明默认语言与中文 sitemap
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
    sitemap: [`${BASE_URL}/sitemap.xml`, `${BASE_URL}/zh/sitemap.xml`],
  }
}
