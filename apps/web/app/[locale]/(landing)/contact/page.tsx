/**
 * [INPUT]: 依赖 next-intl/server 的 getTranslations/setRequestLocale，依赖 @/components/contact/contact-content，
 *          依赖 @/components/landing/public-pages 的返回首页按钮，依赖 @/lib/seo 的 buildPageMetadata
 * [OUTPUT]: 对外提供 ContactPage 联系我们页面 (SSG) + SEO metadata + WebPage/BreadcrumbList 结构化数据
 * [POS]: (landing) 路由组的公开联系页，承接导航与页脚中的支持/合作/社区联系入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { ContactContent } from '@/components/contact/contact-content'
import { MarketingBackLink } from '@/components/landing/public-pages'
import {
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
      'contact us',
      'AI workflow support',
      'creator community contact',
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
  const navT = await getTranslations({ locale, namespace: 'landing.nav' })
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: t('title'),
      description: t('metaDescription'),
      url: buildAbsoluteUrl('/contact'),
      isPartOf: {
        '@type': 'WebSite',
        name: SITE_NAME,
        url: buildAbsoluteUrl('/'),
      },
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
      <div className="bg-[#09090d] px-4 pt-16 sm:px-6 sm:pt-20 lg:px-8 xl:px-10">
        <div className="mx-auto w-full max-w-[1380px]">
          <MarketingBackLink label={navT('backHome')} />
        </div>
      </div>
      <ContactContent />
    </>
  )
}
