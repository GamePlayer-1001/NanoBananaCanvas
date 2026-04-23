/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @/components/shared/brand-mark，
 *          依赖 @/components/ui/button，依赖 @/components/landing/sections/section-shell，
 *          依赖 @/i18n/navigation 的 Link，依赖 lucide-react 的 ArrowRight/ArrowUpRight
 * [OUTPUT]: 对外提供 FinalCtaSection 底部转化板块
 * [POS]: landing/sections 的末屏 CTA，被 landing-sections.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { SectionShell } from '@/components/landing/sections/section-shell'
import { BrandMark } from '@/components/shared/brand-mark'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

export function FinalCtaSection() {
  const t = useTranslations('landing.sections')

  return (
    <SectionShell
      id="cta"
      eyebrow={t('cta.eyebrow')}
      title={t('cta.title')}
      description={t('cta.description')}
    >
      <div className="overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-8 md:p-12">
        <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
          <div>
            <BrandMark className="text-3xl text-[var(--landing-ink)] md:text-5xl" />
            <p className="mt-5 max-w-[38rem] text-base leading-8 text-[var(--landing-muted)] md:text-lg">
              {t('cta.body')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 lg:justify-end">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-[var(--landing-ink)] px-7 text-black hover:bg-white"
            >
              <Link href="/sign-in?redirect_url=/workspace">
                {t('cta.primary')}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-white/14 bg-white/[0.02] px-7 text-[var(--landing-ink)] hover:bg-white/[0.06]"
            >
              <Link href="/docs">
                {t('cta.secondary')}
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </SectionShell>
  )
}
