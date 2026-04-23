/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @/components/ui/button，
 *          依赖 @/components/landing/sections/section-shell，依赖 @/i18n/navigation 的 Link，
 *          依赖 lucide-react 的 ArrowRight
 * [OUTPUT]: 对外提供 FeaturesSection 与 PricingSummarySection
 * [POS]: landing/sections 的功能图文卡片与首页定价摘要，被 landing-sections.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { SectionShell } from '@/components/landing/sections/section-shell'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

const FEATURE_INDEXES = [1, 2, 3, 4]
const PLANS = ['free', 'standard', 'pro', 'ultimate'] as const
const FEATURE_VISUALS = ['workflow', 'fusion', 'video', 'routing'] as const
type FeatureVisual = (typeof FEATURE_VISUALS)[number]
const FEATURE_VISUAL_COMPONENTS = {
  workflow: WorkflowVisual,
  fusion: FusionVisual,
  video: VideoVisual,
  routing: RoutingVisual,
} satisfies Record<FeatureVisual, () => ReactNode>

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
            className={`rounded-lg border p-6 md:p-7 ${plan === 'pro' ? 'border-white/24 bg-[linear-gradient(180deg,rgba(255,255,255,0.11),rgba(255,255,255,0.03))]' : 'border-[var(--landing-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]'}`}
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
          variant="ghost"
          size="lg"
          className="rounded-lg border border-white/16 bg-white/[0.055] px-7 text-[var(--landing-ink)] hover:border-white/24 hover:bg-white/[0.09] hover:text-[var(--landing-ink)]"
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
  const visual = FEATURE_VISUALS[index - 1] ?? 'workflow'

  return (
    <article className="group overflow-hidden rounded-lg border border-[var(--landing-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]">
      <FeatureVisualPanel visual={visual} />
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

function FeatureVisualPanel({ visual }: { visual: FeatureVisual }) {
  const Visual = FEATURE_VISUAL_COMPONENTS[visual]

  return (
    <div className="relative h-72 overflow-hidden border-b border-white/8 bg-black">
      <div className="landing-grain pointer-events-none absolute inset-0 opacity-25" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.16),transparent_22%),radial-gradient(circle_at_78%_66%,rgba(255,255,255,0.08),transparent_24%),linear-gradient(180deg,#151515_0%,#050505_100%)]" />
      <Visual />
    </div>
  )
}

function WorkflowVisual() {
  return (
    <div className="absolute inset-5">
      <FeatureLine className="top-[26%] left-[22%] w-[35%] rotate-[14deg]" />
      <FeatureLine className="top-[54%] left-[44%] w-[32%] -rotate-[18deg]" />
      <FeatureNode className="top-8 left-0 h-24 w-36" />
      <FeatureNode className="top-24 left-[38%] h-28 w-40" strong />
      <FeatureNode className="top-5 right-0 h-24 w-34" />
      <FeatureNode className="right-8 bottom-4 h-24 w-38" />
    </div>
  )
}

function FusionVisual() {
  return (
    <div className="absolute inset-5">
      <div className="absolute top-6 left-2 h-36 w-32 rounded-lg border border-white/12 bg-[radial-gradient(circle_at_50%_34%,rgba(255,255,255,0.42),transparent_16%),linear-gradient(180deg,rgba(255,255,255,0.13),rgba(255,255,255,0.035))]" />
      <div className="absolute top-16 left-[30%] h-32 w-34 rounded-lg border border-white/12 bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,0.26),transparent_18%),linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.02))]" />
      <div className="absolute top-7 right-0 h-44 w-[42%] rounded-lg border border-white/18 bg-[radial-gradient(circle_at_52%_35%,rgba(255,255,255,0.38),transparent_14%),radial-gradient(circle_at_50%_72%,rgba(255,255,255,0.13),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.025))] shadow-[0_0_60px_rgba(255,255,255,0.08)]" />
      <FeatureLine className="top-[47%] left-[22%] w-[30%] rotate-[6deg]" />
      <FeatureLine className="top-[54%] left-[48%] w-[25%] -rotate-[10deg]" />
    </div>
  )
}

function VideoVisual() {
  return (
    <div className="absolute inset-5">
      <div className="absolute top-8 right-2 left-2 grid grid-cols-3 gap-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-30 rounded-lg border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.13),rgba(255,255,255,0.025))]"
          >
            <div className="mx-auto mt-8 h-10 w-10 rounded-full border border-white/18 bg-white/8" />
          </div>
        ))}
      </div>
      <div className="absolute right-5 bottom-8 left-5 h-2 rounded-full bg-white/8">
        <div className="h-full w-2/3 rounded-full bg-[var(--landing-ink)]" />
      </div>
      <div
        aria-hidden="true"
        className="absolute bottom-15 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/16 bg-black/58 px-4 py-2"
      >
        <span className="h-2 w-2 rounded-full bg-[var(--landing-ink)]" />
        <span className="h-1.5 w-16 rounded-full bg-white/28" />
      </div>
    </div>
  )
}

function RoutingVisual() {
  return (
    <div className="absolute inset-5">
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 z-10 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/18 bg-black/70 shadow-[0_0_60px_rgba(255,255,255,0.12)]"
      >
        <span className="h-10 w-10 rounded-full border border-white/24 bg-white/[0.08]" />
      </div>
      {['OpenAI', 'Kling', 'Gemini', 'R2', 'D1'].map((label, index) => (
        <span
          key={label}
          className={`absolute rounded-full border border-white/12 bg-white/[0.055] px-3 py-1.5 text-xs text-[var(--landing-muted)] ${ROUTING_POSITIONS[index]}`}
        >
          {label}
        </span>
      ))}
      <FeatureLine className="top-[30%] left-[24%] w-[28%] rotate-[28deg]" />
      <FeatureLine className="top-[33%] left-[49%] w-[27%] -rotate-[28deg]" />
      <FeatureLine className="top-[68%] left-[25%] w-[30%] -rotate-[23deg]" />
      <FeatureLine className="top-[67%] left-[50%] w-[28%] rotate-[22deg]" />
    </div>
  )
}

const ROUTING_POSITIONS = [
  'left-2 top-8',
  'right-6 top-10',
  'left-5 bottom-10',
  'right-12 bottom-8',
  'left-1/2 top-2 -translate-x-1/2',
]

function FeatureNode({
  className,
  strong = false,
}: {
  className: string
  strong?: boolean
}) {
  return (
    <div
      aria-hidden="true"
      className={`absolute rounded-lg border p-4 shadow-[0_18px_48px_rgba(0,0,0,0.3)] ${strong ? 'border-white/24 bg-white/[0.11]' : 'border-white/12 bg-white/[0.055]'} ${className}`}
    >
      <div className="h-2 w-10 rounded-full bg-white/22" />
      <div className="mt-6 space-y-2">
        <div className="h-1.5 w-20 rounded-full bg-white/18" />
        <div className="h-1.5 w-14 rounded-full bg-white/12" />
      </div>
    </div>
  )
}

function FeatureLine({ className }: { className: string }) {
  return (
    <div
      className={`landing-feature-line absolute h-px origin-left bg-[linear-gradient(90deg,transparent,rgba(247,244,238,0.62),transparent)] ${className}`}
    />
  )
}
