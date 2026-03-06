/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @/i18n/navigation 的 Link，
 *          依赖 @/components/landing/floating-cards
 * [OUTPUT]: 对外提供 HeroSection 组件
 * [POS]: landing 的主视觉区域，被 (landing)/page.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { FloatingCards } from './floating-cards'

/* ─── Component ──────────────────────────────────────── */

export function HeroSection() {
  const t = useTranslations('landing.hero')

  return (
    <section className="relative flex min-h-[calc(100vh-65px)] items-center justify-center overflow-hidden pt-16">
      {/* ── Floating Cards (装饰层) ─────────────────── */}
      <div className="absolute inset-0 mx-auto max-w-[1152px]">
        <FloatingCards />
      </div>

      {/* ── 背景辉光 ──────────────────────────────── */}
      <div className="bg-brand-500/8 pointer-events-none absolute top-1/3 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]" />

      {/* ── Main Text Content ────────────────────────── */}
      <div className="relative z-10 mx-auto max-w-[560px] px-4 text-center">
        {/* 品牌名 */}
        <h2 className="mb-2 font-serif text-3xl italic tracking-wide text-white/90 md:text-4xl">
          {t('heading')}
        </h2>

        {/* 主标语 */}
        <h1 className="from-brand-300 mb-6 bg-gradient-to-r to-white bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
          {t('tagline')}
        </h1>

        {/* 描述 */}
        <p className="mx-auto mb-8 max-w-md whitespace-pre-line text-sm leading-relaxed text-white/50">
          {t('description')}
        </p>

        {/* CTA 按钮 */}
        <Link
          href="/sign-up"
          className="border-brand-500/50 bg-brand-500/10 hover:bg-brand-500/20 inline-flex h-12 items-center rounded-lg border px-8 text-sm font-medium text-white transition-all"
        >
          {t('cta')}
        </Link>

        {/* 模型标签 */}
        <p className="mt-4 text-xs tracking-wide text-white/30">
          {t('models')}
        </p>
      </div>
    </section>
  )
}
