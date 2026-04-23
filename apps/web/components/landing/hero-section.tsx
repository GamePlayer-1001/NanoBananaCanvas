/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @/components/shared/brand-mark，
 *          依赖 @/components/ui/button，依赖 @/components/landing/hero-canvas，
 *          依赖 @/i18n/navigation 的 Link
 * [OUTPUT]: 对外提供 HeroSection 首屏品牌叙事组件
 * [POS]: landing 的首屏文案壳，图像节点画布下沉给 hero-canvas.tsx
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { ArrowRight, Play } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { HeroCanvas } from '@/components/landing/hero-canvas'
import { BrandMark } from '@/components/shared/brand-mark'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

export function HeroSection() {
  const t = useTranslations('landing.hero')

  return (
    <section
      id="hero"
      className="landing-snap-section relative overflow-hidden border-b border-white/6 bg-[var(--landing-bg)] px-5 pb-18 pt-28 sm:pt-32 md:pb-24"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),transparent_28%),linear-gradient(180deg,#030303_0%,#080808_44%,#020202_100%)]" />
        <div className="absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:84px_84px]" />
        <div className="landing-grain absolute inset-0 opacity-40" />
        <div className="absolute left-1/2 top-[18%] h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-white/8 blur-[160px]" />
      </div>

      <div className="relative mx-auto max-w-[1480px]">
        <div className="mb-10 max-w-[760px]">
          <p className="mb-5 text-[11px] tracking-[0.34em] text-[var(--landing-muted)] uppercase">
            {t('eyebrow')}
          </p>
          <BrandMark className="text-4xl text-[var(--landing-ink)] md:text-6xl">
            {t('heading')}
          </BrandMark>
          <h1 className="mt-5 max-w-[900px] text-5xl font-semibold tracking-[-0.04em] text-[var(--landing-ink)] md:text-7xl">
            {t('tagline')}
          </h1>
          <p className="mt-5 max-w-[620px] text-base leading-8 text-[var(--landing-muted)] md:text-lg">
            {t('description')}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full bg-[var(--landing-ink)] px-7 text-sm font-medium text-black shadow-[0_18px_44px_rgba(255,255,255,0.18)] transition hover:bg-white"
            >
              <Link href="/sign-in?redirect_url=/workspace">
                {t('primaryCta')}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-full border-white/16 bg-white/[0.02] px-7 text-sm font-medium text-[var(--landing-ink)] shadow-none hover:bg-white/[0.06]"
            >
              <Link href="/pricing">
                <Play className="size-4 fill-current" />
                {t('secondaryCta')}
              </Link>
            </Button>
          </div>
          <p className="mt-5 text-sm text-[var(--landing-faint)]">{t('models')}</p>
        </div>

        <HeroCanvas />
      </div>
    </section>
  )
}
