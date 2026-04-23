/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @/components/ui/button，
 *          依赖 @/components/landing/sections/section-shell，依赖 @/i18n/navigation 的 Link，
 *          依赖 lucide-react 的 ArrowRight
 * [OUTPUT]: 对外提供 FeaturesSection 与 PricingSummarySection
 * [POS]: landing/sections 的功能与首页定价摘要，被 landing-sections.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { SectionShell } from '@/components/landing/sections/section-shell'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

const FEATURE_INDEXES = [1, 2, 3, 4]
const PLANS = ['free', 'standard', 'pro', 'ultimate'] as const

export function FeaturesSection() {
  const t = useTranslations('landing.sections')

  return (
    <SectionShell
      id="features"
      eyebrow={t('features.eyebrow')}
      title={t('features.title')}
      description={t('features.description')}
    >
      <div className="grid gap-5 lg:grid-cols-2">
        {FEATURE_INDEXES.map((index) => (
          <FeatureCard key={index} index={index} />
        ))}
      </div>
    </SectionShell>
  )
}

export function PricingSummarySection() {
  const t = useTranslations('landing.sections')

  return (
    <SectionShell
      id="pricing"
      eyebrow={t('pricing.eyebrow')}
      title={t('pricing.title')}
      description={t('pricing.description')}
    >
      <div className="grid gap-5 xl:grid-cols-4">
        {PLANS.map((plan) => (
          <article
            key={plan}
            className={`rounded-[30px] border p-6 md:p-7 ${plan === 'pro' ? 'border-white/24 bg-[linear-gradient(180deg,rgba(255,255,255,0.11),rgba(255,255,255,0.03))]' : 'border-[var(--landing-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] tracking-[0.26em] text-[var(--landing-faint)] uppercase">
                  {t(`pricing.planEyebrow.${plan}`)}
                </p>
                <h3 className="mt-3 text-3xl font-semibold text-[var(--landing-ink)]">
                  {t(`pricing.planName.${plan}`)}
                </h3>
              </div>
              {plan === 'pro' ? (
                <span className="rounded-full border border-white/14 px-3 py-1 text-[11px] tracking-[0.2em] text-[var(--landing-ink)] uppercase">
                  {t('pricing.recommended')}
                </span>
              ) : null}
            </div>
            <p className="mt-6 text-5xl font-semibold tracking-[-0.05em] text-[var(--landing-ink)]">
              {t(`pricing.planPrice.${plan}`)}
            </p>
            <p className="mt-2 text-sm text-[var(--landing-muted)]">
              {t(`pricing.planNote.${plan}`)}
            </p>
            <p className="mt-6 text-sm leading-7 text-[var(--landing-muted)]">
              {t(`pricing.planBody.${plan}`)}
            </p>
          </article>
        ))}
      </div>
      <div className="mt-8 flex justify-center">
        <Button
          asChild
          size="lg"
          className="rounded-full bg-[var(--landing-ink)] px-7 text-black hover:bg-white"
        >
          <Link href="/pricing">
            {t('pricing.cta')}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </SectionShell>
  )
}

function FeatureCard({ index }: { index: number }) {
  const t = useTranslations('landing.sections')

  return (
    <article className="group overflow-hidden rounded-[32px] border border-[var(--landing-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]">
      <div className="relative h-56 overflow-hidden border-b border-white/8 bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_24%,rgba(255,255,255,0.14),transparent_18%),linear-gradient(180deg,#1c1c1c_0%,#0b0b0b_100%)]" />
        <div className="absolute inset-4 rounded-[24px] border border-white/8 bg-[linear-gradient(145deg,rgba(255,255,255,0.09),rgba(255,255,255,0.01))]" />
        <div className="absolute left-8 top-8 h-18 w-28 rounded-[22px] border border-white/10 bg-white/[0.05]" />
        <div className="absolute left-44 top-20 h-22 w-34 rounded-[24px] border border-white/10 bg-white/[0.04]" />
        <div className="absolute bottom-8 left-10 right-10 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.38),transparent)]" />
      </div>
      <div className="space-y-3 p-6 md:p-7">
        <p className="text-[11px] tracking-[0.28em] text-[var(--landing-faint)] uppercase">
          {t(`features.cardEyebrow${index}`)}
        </p>
        <h3 className="text-2xl font-semibold text-[var(--landing-ink)]">
          {t(`features.cardTitle${index}`)}
        </h3>
        <p className="text-sm leading-7 text-[var(--landing-muted)]">
          {t(`features.cardBody${index}`)}
        </p>
      </div>
    </article>
  )
}
