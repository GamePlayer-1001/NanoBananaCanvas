/**
 * [INPUT]: 依赖 next 的 Metadata 类型
 * [OUTPUT]: 对外提供 SEO 常量、绝对 URL 构造器、关键词策略与页面级 metadata 工厂
 * [POS]: lib 的 SEO 语义层，被 sitemap/robots/页面 metadata 复用，统一公开 URL、关键词优先级与搜索展示信号
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Metadata } from 'next'
import { getLocaleDefinition } from '@/i18n/config'

export const BASE_URL = 'https://nanobananacanvas.com'
export const SITE_NAME = 'Nano Banana Canvas'
export const SITE_DESCRIPTION =
  'Visual AI workflow builder for creators and teams. Build, share, and run multimodal workflows from prompt to storyboard.'
export const GPT_IMAGE_PRIORITY_KEYWORDS = [
  'gpt image',
  'gpt image workflow',
  'gpt image prompt workflow',
  'gpt image 2',
]

export const NO_INDEX_METADATA: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export function buildAbsoluteUrl(path = '/') {
  return new URL(path, BASE_URL).toString()
}

export function buildOgImageUrl(title: string, subtitle?: string) {
  const url = new URL('/api/og', BASE_URL)
  url.searchParams.set('title', title)

  if (subtitle) {
    url.searchParams.set('subtitle', subtitle)
  }

  return url.toString()
}

export function mergeKeywords(
  ...groups: Array<Array<string | null | undefined | false>>
): string[] {
  const seen = new Set<string>()
  const merged: string[] = []

  for (const group of groups) {
    for (const keyword of group) {
      if (!keyword) continue

      const normalized = keyword.trim()
      if (!normalized) continue

      const dedupeKey = normalized.toLowerCase()
      if (seen.has(dedupeKey)) continue

      seen.add(dedupeKey)
      merged.push(normalized)
    }
  }

  return merged
}

export function buildPageMetadata({
  title,
  description,
  path = '/',
  locale,
  type = 'website',
  ogTitle,
  ogSubtitle,
  keywords,
}: {
  title: string
  description: string
  path?: string
  locale: string
  type?: 'website' | 'article'
  ogTitle?: string
  ogSubtitle?: string
  keywords?: string[]
}): Metadata {
  const canonical = buildAbsoluteUrl(path)
  const imageTitle = ogTitle ?? title
  const imageSubtitle = ogSubtitle ?? description
  const image = buildOgImageUrl(imageTitle, imageSubtitle)

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
      },
    },
    openGraph: {
      title: imageTitle,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: getLocaleDefinition(locale).ogLocale,
      type,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: imageTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: imageTitle,
      description,
      images: [image],
    },
  }
}
