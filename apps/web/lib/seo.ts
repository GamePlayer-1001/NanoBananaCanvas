/**
 * [INPUT]: 依赖 next 的 Metadata 类型，依赖 i18n/config 的 locale 真相源
 * [OUTPUT]: 对外提供 SEO 常量、绝对 URL 构造器、多语言 URL/hreflang、locale 感知关键词策略与页面级 metadata 工厂
 * [POS]: lib 的 SEO 语义层，被 sitemap/robots/页面 metadata 复用，统一公开 URL、语言映射、关键词优先级与多语言搜索展示信号
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Metadata } from 'next'
import {
  ACTIVE_LOCALES,
  DEFAULT_LOCALE,
  getLocaleDefinition,
  resolveLocale,
} from '@/i18n/config'

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
const LOCALE_SUPPORT_KEYWORDS: Record<(typeof ACTIVE_LOCALES)[number], string[]> = {
  en: [],
  zh: [
    'gpt图片',
    'gpt图片工作流',
    'AI工作流',
    '图像生成工作流',
    '多模态工作流',
    '提示词工作流',
  ],
}

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

function stripLocalePrefix(path: string) {
  for (const locale of ACTIVE_LOCALES) {
    if (path === `/${locale}`) {
      return '/'
    }

    if (path.startsWith(`/${locale}/`)) {
      return path.slice(locale.length + 1)
    }
  }

  return path
}

export function buildLocalizedPath(path = '/', locale?: string | null) {
  const resolvedLocale = resolveLocale(locale)
  const normalizedPath = stripLocalePrefix(path.startsWith('/') ? path : `/${path}`)

  if (normalizedPath === '/') {
    return resolvedLocale === DEFAULT_LOCALE ? '/' : `/${resolvedLocale}`
  }

  return resolvedLocale === DEFAULT_LOCALE
    ? normalizedPath
    : `/${resolvedLocale}${normalizedPath}`
}

export function buildLocalizedUrl(path = '/', locale?: string | null) {
  return buildAbsoluteUrl(buildLocalizedPath(path, locale))
}

export function buildLanguageAlternates(path = '/') {
  const languages = ACTIVE_LOCALES.reduce<Record<string, string>>((acc, locale) => {
    acc[locale] = buildLocalizedUrl(path, locale)
    return acc
  }, {})

  languages['x-default'] = buildLocalizedUrl(path, DEFAULT_LOCALE)

  return languages
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

export function buildPriorityKeywords(
  locale: string | null | undefined,
  ...groups: Array<Array<string | null | undefined | false>>
) {
  const resolvedLocale = resolveLocale(locale)

  return mergeKeywords(
    GPT_IMAGE_PRIORITY_KEYWORDS,
    ...groups,
    LOCALE_SUPPORT_KEYWORDS[resolvedLocale],
  )
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
  const resolvedLocale = resolveLocale(locale)
  const canonical = buildLocalizedUrl(path, resolvedLocale)
  const imageTitle = ogTitle ?? title
  const imageSubtitle = ogSubtitle ?? description
  const image = buildOgImageUrl(imageTitle, imageSubtitle)

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical,
      languages: buildLanguageAlternates(path),
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
      locale: getLocaleDefinition(resolvedLocale).ogLocale,
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
