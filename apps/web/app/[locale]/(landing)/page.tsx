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
import {
  BASE_URL,
  SITE_NAME,
  buildAbsoluteUrl,
  buildPageMetadata,
} from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })
  return buildPageMetadata({
    title: t('landingTitle'),
    description: t('landingDescription'),
    path: '/',
    locale,
  })
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const seoT = await getTranslations({ locale, namespace: 'landingSeo' })

  const faqItems = [
    {
      question: seoT('faqQuestion1'),
      answer: seoT('faqAnswer1'),
    },
    {
      question: seoT('faqQuestion2'),
      answer: seoT('faqAnswer2'),
    },
    {
      question: seoT('faqQuestion3'),
      answer: seoT('faqAnswer3'),
    },
  ]

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
          availableLanguage: ['en', 'zh'],
        },
      ],
      areaServed: [
        seoT('coverageRegionAmericas'),
        seoT('coverageRegionEurope'),
        seoT('coverageRegionApac'),
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
      '@type': 'SoftwareApplication',
      name: SITE_NAME,
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Web',
      url: BASE_URL,
      description: seoT('structuredDescription'),
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      availableLanguage: ['en', 'zh'],
      featureList: [
        seoT('featureWorkflow'),
        seoT('featureImageVideo'),
        seoT('featureTemplates'),
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
  ]

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HeroSection />
      <section className="border-t border-white/5 bg-[#0b0b0f] px-5 py-16">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="max-w-3xl space-y-4">
            <p className="text-sm font-medium tracking-[0.2em] text-white/45 uppercase">
              {seoT('eyebrow')}
            </p>
            <h2 className="text-3xl font-semibold text-white md:text-4xl">
              {seoT('title')}
            </h2>
            <p className="text-base leading-7 text-white/62 md:text-lg">
              {seoT('intro')}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <article className="rounded-3xl border border-white/8 bg-white/[0.03] p-6">
              <h3 className="text-xl font-semibold text-white">
                {seoT('coverageTitle')}
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/62">
                {seoT('coverageBody')}
              </p>
              <ul className="mt-5 space-y-2 text-sm text-white/70">
                <li>{seoT('coverageRegionAmericas')}</li>
                <li>{seoT('coverageRegionEurope')}</li>
                <li>{seoT('coverageRegionApac')}</li>
              </ul>
            </article>

            <article className="rounded-3xl border border-white/8 bg-white/[0.03] p-6">
              <h3 className="text-xl font-semibold text-white">
                {seoT('capabilityTitle')}
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/62">
                {seoT('capabilityBody')}
              </p>
              <ul className="mt-5 space-y-2 text-sm text-white/70">
                <li>{seoT('featureWorkflow')}</li>
                <li>{seoT('featureImageVideo')}</li>
                <li>{seoT('featureTemplates')}</li>
              </ul>
            </article>

            <article className="rounded-3xl border border-white/8 bg-white/[0.03] p-6">
              <h3 className="text-xl font-semibold text-white">
                {seoT('geoTitle')}
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/62">
                {seoT('geoBody')}
              </p>
              <p className="mt-5 text-sm leading-6 text-white/70">
                {seoT('geoNote')}
              </p>
            </article>
          </div>

          <div className="rounded-[32px] border border-white/8 bg-white/[0.03] p-7 md:p-9">
            <h3 className="text-2xl font-semibold text-white">{seoT('faqTitle')}</h3>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {faqItems.map((item) => (
                <article key={item.question} className="space-y-3">
                  <h4 className="text-base font-semibold text-white">{item.question}</h4>
                  <p className="text-sm leading-6 text-white/62">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
      <LandingFooter />
    </main>
  )
}
