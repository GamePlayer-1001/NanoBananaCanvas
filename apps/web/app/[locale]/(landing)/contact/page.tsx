/**
 * [INPUT]: 依赖 next-intl/server 的 setRequestLocale/getTranslations，
 *          依赖 @/components/contact/contact-content，依赖 @/lib/seo 的 SEO 工具
 * [OUTPUT]: 对外提供 /contact 公开联系页面 + Organization JSON-LD
 * [POS]: (landing) 路由组的公开联系页面，被 Landing 导航、页脚与 sitemap 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { ContactContent } from '@/components/contact/contact-content'
import { AVAILABLE_LANGUAGE_CODES } from '@/i18n/config'
import { BASE_URL, SITE_NAME, buildAbsoluteUrl, buildPageMetadata } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'contact' })

  return buildPageMetadata({
    title: t('title'),
    description: t('subtitle'),
    path: '/contact',
    locale,
  })
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: BASE_URL,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        url: buildAbsoluteUrl('/contact'),
        availableLanguage: AVAILABLE_LANGUAGE_CODES,
      },
    ],
    sameAs: [
      'https://t.me/nanobananacanvas',
      'https://discord.gg/nanobananacanvas',
      'https://x.com/nanobananacanvas',
      'https://instagram.com/nanobananacanvas',
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ContactContent />
    </>
  )
}
