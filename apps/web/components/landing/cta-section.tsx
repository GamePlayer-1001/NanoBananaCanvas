/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @/i18n/navigation 的 Link
 * [OUTPUT]: 对外提供 CtaSection 二次行动号召组件
 * [POS]: landing 的底部 CTA 区域，被 (landing)/page.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'

/* ─── Component ──────────────────────────────────────── */

export function CtaSection() {
  const t = useTranslations('landing.ctaSection')

  return (
    <section className="relative flex items-center justify-center py-28">
      {/* 背景辉光 */}
      <div className="bg-brand-500/10 pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]" />

      <div className="relative z-10 text-center">
        {/* 标题 */}
        <h2 className="mb-2 text-3xl font-light leading-tight text-white/90 md:text-4xl">
          {t('heading1')}
        </h2>
        <h2 className="mb-6 text-3xl font-light leading-tight text-white/90 md:text-4xl">
          {t('heading2')}
        </h2>

        {/* 副标题 */}
        <p className="mb-8 text-sm text-white/40">
          {t('subtitle')}
        </p>

        {/* CTA */}
        <Link
          href="/sign-up"
          className="border-brand-500/50 bg-brand-500/10 hover:bg-brand-500/20 inline-flex h-12 items-center rounded-lg border px-8 text-sm font-medium text-white transition-all"
        >
          {t('button')}
        </Link>
      </div>
    </section>
  )
}
