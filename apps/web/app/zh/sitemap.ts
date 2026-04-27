/**
 * [INPUT]: 依赖 app/sitemap 的共享公开 sitemap 构造器
 * [OUTPUT]: 对外提供中文专属 sitemap.xml
 * [POS]: 中文语言分区的搜索入口，向搜索引擎显式暴露 `/zh/*` 可索引 URL 集合
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { MetadataRoute } from 'next'

import { buildPublicSitemap } from '@/app/sitemap'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildPublicSitemap(['zh'])
}
