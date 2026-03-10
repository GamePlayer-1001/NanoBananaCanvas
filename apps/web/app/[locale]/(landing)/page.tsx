/**
 * [INPUT]: 依赖 next-intl/server 的 setRequestLocale，
 *          依赖 @/components/landing/hero-section，
 *          依赖 @/components/layout/landing-footer
 * [OUTPUT]: 对外提供 Landing Page 首页
 * [POS]: (landing) 路由组的首页，SSG 渲染，极简结构: Hero Canvas + Footer
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { HeroSection } from '@/components/landing/hero-section'
import { LandingFooter } from '@/components/layout/landing-footer'

const BASE_URL = 'https://nanobananacanvas.com'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })
  return {
    title: t('landingTitle'),
    description: t('landingDescription'),
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: { en: `${BASE_URL}/en`, zh: `${BASE_URL}/zh` },
    },
    openGraph: {
      title: t('landingTitle'),
      description: t('landingDescription'),
      url: `${BASE_URL}/${locale}`,
      siteName: 'Nano Banana Canvas',
      type: 'website',
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
      images: [
        {
          url: `${BASE_URL}/api/og?title=${encodeURIComponent(t('landingTitle'))}&subtitle=${encodeURIComponent(t('landingDescription'))}`,
          width: 1200,
          height: 630,
          alt: t('landingTitle'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('landingTitle'),
      description: t('landingDescription'),
      images: [`${BASE_URL}/api/og?title=${encodeURIComponent(t('landingTitle'))}`],
    },
  }
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  // JSON-LD 结构化数据
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Nano Banana Canvas',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    url: 'https://nanobananacanvas.com',
    description:
      'Visual AI Workflow Platform — Build, share, and run AI workflows with drag & drop',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  }

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HeroSection />
      <LandingFooter />
    </main>
  )
}
