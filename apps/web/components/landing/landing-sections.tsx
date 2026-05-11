/**
 * [INPUT]: 依赖 react 的 useEffect/useRef/useState，依赖 next/image 的本地营销素材渲染，
 *          依赖 next-intl 的 useTranslations，依赖 lucide-react 的区块与交互图标，
 *          依赖 ./model-mind-map-section，依赖 @/i18n/navigation 的 Link，
 *          依赖 @/lib/billing/pricing 类型与首页服务端注入的 Stripe 动态月付价格
 * [OUTPUT]: 对外提供 ModelMindMapSection、FeaturesSection、PricingSection、TestimonialsSection、FaqSection
 * [POS]: components/landing 的首页内容区集合，负责承接首页除 Hero 外的模型/功能/人格分层定价/评价/FAQ 叙事区块；功能区已收口为首页锚点，不再导向独立 `/features` 子页
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Sparkles, Workflow, Zap } from 'lucide-react'
import { useTranslations } from 'next-intl'

import type { PublicBillingPlanPrice } from '@/lib/billing/pricing'
import { Link } from '@/i18n/navigation'
export { ModelMindMapSection } from './model-mind-map-section'

const FEATURE_KEYS = ['canvas', 'models', 'outputs'] as const
const FEATURE_VISUALS = {
  canvas: {
    icon: Workflow,
    imageSrc: '/landing/hero/feature-workflow-overview.webp',
    imageWidth: 1586,
    imageHeight: 992,
    accent: 'from-[#8ea3ff]/34 via-[#4f46e5]/18 to-transparent',
  },
  models: {
    icon: Sparkles,
    imageSrc: '/landing/hero/feature-any-model-image.webp',
    imageWidth: 1586,
    imageHeight: 992,
    accent: 'from-[#7be6ff]/34 via-[#14b8a6]/18 to-transparent',
  },
  outputs: {
    icon: Zap,
    imageSrc: '/landing/hero/feature-video-everything.webp',
    imageWidth: 1535,
    imageHeight: 1025,
    accent: 'from-[#ffd36b]/32 via-[#f97316]/16 to-transparent',
  },
} as const

const LANDING_PERSONA_ITEMS = ['free', 'standard', 'pro', 'ultimate'] as const

const TESTIMONIAL_ITEMS = [
  'pixel',
  'neo',
  'cyber',
  'frame',
  'prompt',
  'canvas',
  'moodboard',
  'indie',
  'vfx',
  'dream',
  'lena',
  'workflow',
] as const
const FAQ_KEYS = [
  'what',
  'models',
  'canvas',
  'gptImage',
  'pricing',
  'api',
  'team',
  'commercial',
  'privacy',
  'contact',
] as const

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function formatLandingMoney(amount: number) {
  return `$${(amount / 100).toFixed(2)}`
}

function getLandingPricingKey(
  planKey: (typeof LANDING_PERSONA_ITEMS)[number],
  field:
    | 'planLabel'
    | 'supportNote'
    | 'cta'
    | 'period'
    | 'useCase'
    | 'extra'
    | 'priorityNote'
    | 'subtitle',
) {
  return `plans.${planKey}.${field}`
}

export function FeaturesSection() {
  const featuresT = useTranslations('landing.sections.features')
  const featureItems = FEATURE_KEYS.map((key, index) => ({
    key,
    index,
    title: featuresT(`items.${key}.title`),
    body: featuresT(`items.${key}.body`),
    imageSrc: FEATURE_VISUALS[key].imageSrc,
    imageWidth: FEATURE_VISUALS[key].imageWidth,
    imageHeight: FEATURE_VISUALS[key].imageHeight,
    icon: FEATURE_VISUALS[key].icon,
    accent: FEATURE_VISUALS[key].accent,
  }))
  const [activeFeature, setActiveFeature] =
    useState<(typeof FEATURE_KEYS)[number]>('canvas')
  const wheelCooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeFeatureIndex = Math.max(
    featureItems.findIndex((item) => item.key === activeFeature),
    0,
  )
  const activeFeatureItem = featureItems[activeFeatureIndex]
  const ActiveIcon = activeFeatureItem.icon

  useEffect(() => {
    return () => {
      if (wheelCooldownRef.current) {
        clearTimeout(wheelCooldownRef.current)
      }
    }
  }, [])

  function activateFeature(index: number) {
    const nextIndex = clamp(index, 0, featureItems.length - 1)
    setActiveFeature(featureItems[nextIndex].key)
  }

  function handleFeatureWheel(event: React.WheelEvent<HTMLDivElement>) {
    if (Math.abs(event.deltaY) < 18) return
    if (wheelCooldownRef.current) {
      event.preventDefault()
      return
    }

    const direction = event.deltaY > 0 ? 1 : -1
    const nextIndex = clamp(activeFeatureIndex + direction, 0, featureItems.length - 1)

    if (nextIndex === activeFeatureIndex) {
      return
    }

    event.preventDefault()
    activateFeature(nextIndex)
    wheelCooldownRef.current = setTimeout(() => {
      wheelCooldownRef.current = null
    }, 420)
  }

  return (
    <section
      id="features"
      className="relative overflow-hidden bg-[#0b0b0f] px-4 py-24 sm:px-6 lg:px-8 xl:px-10"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_22%,rgba(99,92,255,0.12),transparent_18%),radial-gradient(circle_at_83%_68%,rgba(89,214,183,0.08),transparent_18%),linear-gradient(180deg,#0b0b0f_0%,#09090d_100%)]" />
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="sr-only">
          <p>{featuresT('eyebrow')}</p>
          <h2>{featuresT('title')}</h2>
          <p>{featuresT('body')}</p>
        </div>

        <div
          className="hidden items-start gap-72 xl:grid xl:grid-cols-[minmax(0,0.3fr)_minmax(0,0.7fr)] 2xl:gap-88"
          onWheel={handleFeatureWheel}
        >
          <div className="sticky top-24 min-w-0 self-start pt-4">
            <div className="space-y-5">
              {featureItems.map((item) => {
                const isActive = item.key === activeFeature

                return (
                  <button
                    key={`feature-nav-${item.key}`}
                    type="button"
                    onClick={() => activateFeature(item.index)}
                    className={`block text-left transition-all duration-300 ${
                      isActive ? 'text-white' : 'text-white/18 hover:text-white/38'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span
                        className={`mt-2 h-12 w-px transition-colors duration-300 ${
                          isActive ? 'bg-white/80' : 'bg-transparent'
                        }`}
                      />
                      <span
                        className={`block whitespace-nowrap font-semibold tracking-tight transition-all duration-300 ${
                          isActive
                            ? 'max-w-[13ch] text-[2.9rem] leading-[0.95] 2xl:text-[3.2rem]'
                            : 'max-w-[13ch] text-[2rem] leading-[1.04] 2xl:text-[2.25rem]'
                        }`}
                      >
                        {item.title}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-10">
              <div className="mt-6 flex gap-2">
                {featureItems.map((item) => (
                  <button
                    key={`feature-dot-${item.key}`}
                    type="button"
                    onClick={() => activateFeature(item.index)}
                    className={`inline-flex h-11 items-center rounded-full px-2.5 transition-all duration-300 ${
                      item.key === activeFeature ? 'justify-start' : 'justify-center'
                    }`}
                    aria-label={item.title}
                  >
                    <span
                      aria-hidden="true"
                      className={`block rounded-full transition-all duration-300 ${
                        item.key === activeFeature
                          ? 'h-2.5 w-10 bg-white'
                          : 'h-2.5 w-2.5 bg-white/18 hover:bg-white/34'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="sticky top-24 ml-8 min-w-0 self-start w-full 2xl:ml-12">
            <article
              key={`feature-panel-${activeFeatureItem.key}`}
              className="w-full overflow-hidden rounded-[38px] border border-white/10 bg-[linear-gradient(180deg,rgba(16,17,24,0.98),rgba(10,10,14,0.98))] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.28)]"
            >
              <div
                className="relative w-full overflow-hidden rounded-[30px] border border-white/10 bg-[#0b0c12]"
                style={{
                  aspectRatio: `${activeFeatureItem.imageWidth} / ${activeFeatureItem.imageHeight}`,
                }}
              >
                <div
                  className={`pointer-events-none absolute inset-0 z-10 bg-gradient-to-br ${activeFeatureItem.accent}`}
                />
                <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(4,6,12,0.02),rgba(4,6,12,0.18)_52%,rgba(4,6,12,0.78)_100%)]" />
                <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5">
                  <span className="rounded-full border border-white/12 bg-black/22 px-4 py-1.5 text-[0.7rem] font-semibold tracking-[0.2em] text-white/78 uppercase">
                    Feature 0{activeFeatureItem.index + 1}
                  </span>
                  <span className="rounded-full border border-white/12 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/84">
                    {activeFeatureItem.title}
                  </span>
                </div>
                <Image
                  src={activeFeatureItem.imageSrc}
                  alt={activeFeatureItem.title}
                  width={activeFeatureItem.imageWidth}
                  height={activeFeatureItem.imageHeight}
                  className="absolute inset-0 h-full w-full object-contain object-center brightness-[1.08] contrast-[1.03] saturate-[1.06]"
                />
              </div>

              <div className="mt-5 rounded-[28px] border border-white/8 bg-white/[0.045] p-7">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-black">
                    <ActiveIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium tracking-[0.24em] text-white/34 uppercase">
                      Feature Detail
                    </p>
                    <p className="mt-2 text-[2rem] leading-[1.02] font-semibold tracking-tight text-white">
                      {activeFeatureItem.title}
                    </p>
                  </div>
                </div>
                <p className="mt-5 max-w-[48rem] text-base leading-8 text-white/62">
                  {activeFeatureItem.body}
                </p>
              </div>
            </article>
          </div>
        </div>

        <div className="mt-12 grid gap-5 xl:hidden">
          {featureItems.map((item) => {
            const Icon = item.icon
            return (
              <article
                key={`feature-mobile-${item.key}`}
                className="overflow-hidden rounded-[28px] border border-white/8 bg-white/[0.035] p-5 shadow-[0_18px_54px_rgba(0,0,0,0.14)]"
              >
                <div className="relative h-52 overflow-hidden rounded-[22px] border border-white/8 bg-[#07080d]">
                  <div
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${item.accent}`}
                  />
                  <Image
                    src={item.imageSrc}
                    alt={item.title}
                    width={860}
                    height={620}
                    className="absolute inset-0 h-full w-full object-contain object-center brightness-[1.12] contrast-[1.05] saturate-[1.16]"
                  />
                </div>

                <div className="mt-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-black">
                  <Icon className="h-5 w-5" />
                </div>

                <h3 className="mt-5 text-xl font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/62">{item.body}</p>
              </article>
            )
          })}

        </div>
      </div>
    </section>
  )
}

export function PricingSection({ plans }: { plans: PublicBillingPlanPrice[] }) {
  const pricingT = useTranslations('landing.sections.pricing')
  const monthlyPlans = plans.filter(
    (plan) => plan.purchaseMode === 'plan_auto_monthly',
  )
  const monthlyPlanMap = Object.fromEntries(
    monthlyPlans.map((plan) => [plan.plan, plan]),
  ) as Partial<Record<'standard' | 'pro' | 'ultimate', PublicBillingPlanPrice>>

  return (
    <section id="pricing" className="bg-[#09090d] px-4 py-24 sm:px-6 lg:px-8 xl:px-10">
      <div className="mx-auto w-full max-w-[1480px]">
        <div className="mx-auto max-w-[980px] text-center">
            <h2 className="text-3xl font-semibold text-white md:text-5xl">
              {pricingT('title')}
            </h2>
          <p className="mx-auto mt-6 max-w-[48rem] text-base leading-8 text-white/62 md:text-[1.12rem]">
            {pricingT('body')}
          </p>

        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-2 2xl:grid-cols-4">
          {LANDING_PERSONA_ITEMS.map((planKey) => {
            const livePlan =
              planKey === 'free' ? null : monthlyPlanMap[planKey]
            const priceLabel =
              planKey === 'free'
                ? pricingT('plans.free.period')
                : livePlan
                  ? `${formatLandingMoney(livePlan.unitAmount)} ${pricingT(getLandingPricingKey(planKey, 'period'))}`
                  : pricingT('pricePending')
            const highlights =
              planKey === 'free'
                ? [
                    pricingT('plans.free.note'),
                    pricingT('plans.free.storageNote'),
                    pricingT('plans.free.supportNote'),
                  ]
                : [
                    pricingT(`plans.${planKey}.note`),
                    pricingT(getLandingPricingKey(planKey, 'supportNote')),
                    ...(planKey === 'ultimate'
                      ? [pricingT(getLandingPricingKey(planKey, 'priorityNote'))]
                      : []),
                    pricingT(getLandingPricingKey(planKey, 'useCase')),
                    ...(planKey === 'ultimate'
                      ? [pricingT(getLandingPricingKey(planKey, 'extra'))]
                      : []),
                  ]

            const isRecommended = planKey === 'free'

            return (
              <article
                key={planKey}
                className={`relative flex h-full min-w-0 flex-col overflow-visible rounded-[30px] border p-7 shadow-[0_20px_60px_rgba(0,0,0,0.18)] transition-transform duration-300 hover:-translate-y-1 md:p-8 ${
                  isRecommended
                    ? 'border-[#9b5cff]/80 bg-[radial-gradient(circle_at_50%_-6%,rgba(179,95,255,0.34),transparent_34%),linear-gradient(180deg,rgba(31,19,52,0.98),rgba(12,10,22,0.99))] shadow-[0_0_0_1px_rgba(179,95,255,0.22),0_26px_90px_rgba(124,58,237,0.30)]'
                    : planKey === 'pro'
                      ? 'border-[#3f8f76]/30 bg-[linear-gradient(180deg,rgba(17,30,27,0.96),rgba(9,17,16,0.98))]'
                    : planKey === 'ultimate'
                      ? 'border-[#3a342d] bg-[linear-gradient(180deg,rgba(28,24,19,0.94),rgba(13,12,10,0.98))]'
                      : 'border-white/10 bg-[linear-gradient(180deg,rgba(19,20,24,0.96),rgba(11,12,15,0.98))]'
                }`}
              >
                {isRecommended ? (
                  <>
                    <div className="pointer-events-none absolute inset-x-8 -top-px h-px bg-[linear-gradient(90deg,transparent,rgba(220,190,255,0.95),transparent)]" />
                    <div className="absolute top-0 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,#7c3aed,#c026d3,#f97316)] px-4 py-1 text-xs font-semibold tracking-[0.08em] text-white shadow-[0_0_28px_rgba(168,85,247,0.7)]">
                      推荐试用
                    </div>
                  </>
                ) : null}
                <div className="min-h-[7.2rem]">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-[0.68rem] font-semibold tracking-[0.16em] uppercase ${
                      isRecommended
                        ? 'border-[#c084fc]/36 bg-[#8b5cf6]/20 text-[#eadcff]'
                        : planKey === 'pro'
                          ? 'border-[#68b89b]/22 bg-[#68b89b]/10 text-[#bde9d8]'
                        : planKey === 'ultimate'
                          ? 'border-[#8c7a54]/18 bg-[#8c7a54]/10 text-[#ece0c5]'
                          : 'border-white/10 bg-white/[0.06] text-white/72'
                    }`}
                  >
                    {pricingT(getLandingPricingKey(planKey, 'planLabel'))}
                  </span>
                  <div className="mt-4 max-w-[17rem]">
                    <p className="text-[1.9rem] leading-none font-semibold tracking-tight text-white md:text-[2.05rem]">
                      {pricingT(`plans.${planKey}.name`)}
                    </p>
                    <p className="mt-1.5 text-[0.98rem] leading-5 font-medium text-white/58 md:text-[1.02rem]">
                      {pricingT(getLandingPricingKey(planKey, 'subtitle'))}
                    </p>
                    {pricingT(`plans.${planKey}.body`) ? (
                      <p className="mt-4 text-[1.02rem] leading-8 text-white/60">
                        {pricingT(`plans.${planKey}.body`)}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 min-h-[4.4rem] border-t border-white/8 pt-4">
                  <p className="whitespace-nowrap text-[2.05rem] leading-none font-semibold tracking-tight text-white md:text-[2.25rem]">
                    {priceLabel}
                  </p>
                </div>

                <div className="mt-4 flex flex-1 flex-col">
                  <div className="space-y-3 border-t border-white/8 pt-4">
                    {highlights.map((highlight) => (
                      <div
                        key={highlight}
                        className="flex items-start gap-3 text-sm leading-6 text-white/74"
                      >
                        <span
                          className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            isRecommended
                              ? 'border-[#c084fc]/35 bg-[#8b5cf6]/18 text-[#eadcff]'
                              : 'border-white/10 bg-white/[0.06] text-white/72'
                          }`}
                        >
                          <Check className="h-3.2 w-3.2" />
                        </span>
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto pt-7">
                    <Link
                      href="/pricing"
                      className={`inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-4 text-sm font-semibold transition ${
                        isRecommended
                          ? 'border border-[#c084fc]/20 bg-[linear-gradient(90deg,#f8f5ff,#ffffff)] text-[#13081f] shadow-[0_16px_34px_rgba(168,85,247,0.24)] hover:shadow-[0_18px_42px_rgba(168,85,247,0.34)]'
                          : 'border border-white/10 bg-white text-black hover:bg-white/90'
                      }`}
                    >
                      {pricingT(getLandingPricingKey(planKey, 'cta'))}
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function TestimonialsSection() {
  const testimonialsT = useTranslations('landing.sections.testimonials')
  const getAvatarSeed = (handle: string) =>
    handle.replace(/^@/, '').slice(0, 2).toUpperCase()

  return (
    <section className="relative overflow-hidden bg-[#0b0b0f] px-4 py-22 sm:px-6 lg:px-8 lg:py-24 xl:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(255,255,255,0.07),transparent_20%),radial-gradient(circle_at_82%_74%,rgba(110,124,255,0.08),transparent_18%),linear-gradient(180deg,#0b0b0f_0%,#08090e_100%)]" />
      <div className="relative mx-auto w-full max-w-[1240px]">
        <div className="mx-auto max-w-[48rem] text-center">
          <h2 className="text-[2.7rem] leading-[0.96] font-semibold tracking-tight text-white md:text-[3.9rem]">
            {testimonialsT('title')}
          </h2>
        </div>

        <div className="mt-14 gap-5 md:columns-2 xl:columns-4 [&>*]:mb-5">
          {TESTIMONIAL_ITEMS.map((key, index) => (
            <article
              key={key}
              className={`break-inside-avoid rounded-[28px] border p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] transition-transform duration-300 hover:-translate-y-1 md:p-6 ${
                index % 4 === 0
                  ? 'border-white/10 bg-[linear-gradient(180deg,rgba(19,20,24,0.96),rgba(11,12,15,0.98))]'
                  : index % 4 === 1
                    ? 'border-[#303640] bg-[linear-gradient(180deg,rgba(18,24,31,0.96),rgba(10,13,18,0.98))]'
                    : index % 4 === 2
                      ? 'border-[#3a342d] bg-[linear-gradient(180deg,rgba(28,24,19,0.94),rgba(13,12,10,0.98))]'
                      : 'border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.028))]'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  aria-hidden="true"
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] text-sm font-semibold tracking-[0.08em] text-white/90"
                >
                  {getAvatarSeed(testimonialsT(`${key}.handle`))}
                </div>
                <div>
                  <p className="text-[0.98rem] font-semibold text-white">
                    {testimonialsT(`${key}.handle`)}
                  </p>
                  <p className="mt-0.5 text-xs tracking-[0.16em] text-white/55 uppercase">
                    {testimonialsT(`${key}.role`)}
                  </p>
                </div>
              </div>

              <p className="mt-5 text-[0.94rem] leading-7 text-white/82">
                “{testimonialsT(`${key}.quote`)}”
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export function FaqSection() {
  const faqT = useTranslations('landing.sections.faq')

  return (
    <section
      id="faq"
      className="relative overflow-hidden bg-[#09090d] px-4 py-24 sm:px-6 lg:px-8 xl:px-10"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(120,92,255,0.08),transparent_26%),linear-gradient(180deg,#09090d_0%,#07080d_100%)]" />
      <div className="relative mx-auto w-full max-w-[1060px]">
        <div className="mx-auto max-w-[48rem] text-center">
          <h2 className="text-[2.7rem] leading-[0.96] font-semibold tracking-tight text-white md:text-[3.9rem]">
            {faqT('title')}
          </h2>
        </div>

        <div className="mx-auto mt-18 max-w-[880px]">
          {FAQ_KEYS.map((key) => (
            <details key={key} className="group border-b border-white/8 first:border-t">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-7 pr-1 text-left text-[1.18rem] font-semibold tracking-tight text-white marker:content-none">
                <span>{faqT(`${key}.question`)}</span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/58 transition-colors duration-200 group-open:text-white group-hover:text-white">
                  <ChevronDown className="h-4.5 w-4.5 transition-transform duration-200 group-open:rotate-180" />
                </span>
              </summary>
              <div className="pb-7">
                <p className="max-w-[48rem] text-[1rem] leading-8 text-white/78 md:text-[1.05rem]">
                  {faqT(`${key}.answer`)}
                </p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
