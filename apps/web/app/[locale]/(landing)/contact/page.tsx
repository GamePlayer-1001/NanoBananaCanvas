/**
 * [INPUT]: 依赖 next-intl/server 的 setRequestLocale/getTranslations，
 *          依赖 @/components/contact/contact-content，依赖 @/components/landing/marketing-site-tree
 * [OUTPUT]: 对外提供联系我们页面 + SEO metadata + Organization/BreadcrumbList 结构化数据
 * [POS]: (landing) 路由组的联系页面，展示 Telegram/Discord/X/Instagram 四平台并承接公开站点资源入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { ContactContent } from '@/components/contact/contact-content'
import { MarketingSiteTree } from '@/components/landing/marketing-site-tree'
import { AVAILABLE_LANGUAGE_CODES } from '@/i18n/config'
import {
  BASE_URL,
  SITE_NAME,
  buildAbsoluteUrl,
  buildPageMetadata,
  buildPriorityKeywords,
} from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'contact' })
  return buildPageMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    path: '/contact',
    locale,
    keywords: buildPriorityKeywords(locale, [
      'contact Nano Banana Canvas',
      'AI workflow support',
      'gpt image support',
    ]),
  })
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'contact' })

  const jsonLd = [
    {
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
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: SITE_NAME,
          item: buildAbsoluteUrl('/'),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: t('title'),
          item: buildAbsoluteUrl('/contact'),
        },
      ],
    },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ContactContent />
      <div className="bg-[#09090d] px-4 pb-24 sm:px-6 lg:px-8 xl:px-10">
        <div className="mx-auto w-full max-w-[1380px]">
          <MarketingSiteTree activeHref="/contact" />
        </div>
      </div>
    </>
  )
}
