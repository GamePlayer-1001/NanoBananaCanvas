/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @/i18n/navigation 的 Link
 * [OUTPUT]: 对外提供 ModelMindMapSection、FeaturesSection、PricingSection、TestimonialsSection、FaqSection、CtaSection
 * [POS]: components/landing 的首页内容区集合，被 (landing)/page.tsx 按首屏后叙事顺序消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Check, CircleHelp, Sparkles, Star, Workflow, Zap } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'

const MODEL_PROVIDERS = [
  'OpenAI',
  'Anthropic',
  'Gemini',
  'Qwen',
  'Wan',
  'Kling',
  'Runway',
  'Luma',
  'Vidu',
  'MiniMax',
  'xAI',
  'Groq',
  'Black Forest',
  'OpenRouter',
  'Midjourney',
  'ByteDance',
]

const FEATURE_KEYS = ['canvas', 'models', 'outputs', 'sharing'] as const

const PRICING_PLANS = [
  { key: 'free', price: '$0', credits: '0', storage: '1 GB', popular: false },
  { key: 'standard', price: '$20', credits: '1,600', storage: '10 GB', popular: false },
  { key: 'pro', price: '$50', credits: '5,400', storage: '50 GB', popular: true },
  {
    key: 'ultimate',
    price: '$150',
    credits: '17,000',
    storage: '200 GB',
    popular: false,
  },
] as const

const TESTIMONIAL_KEYS = ['director', 'studio', 'operator'] as const
const FAQ_KEYS = ['what', 'models', 'pricing', 'team'] as const

function SectionHeader({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string
  title: string
  body: string
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-medium tracking-[0.24em] text-white/45 uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-3xl font-semibold text-white md:text-5xl">{title}</h2>
      <p className="mt-5 text-base leading-7 text-white/62 md:text-lg">{body}</p>
    </div>
  )
}

export function ModelMindMapSection() {
  const modelT = useTranslations('landing.sections.models')

  return (
    <section id="models" className="relative overflow-hidden bg-[#09090d] px-5 py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(99,102,241,0.16),transparent_34%),radial-gradient(circle_at_15%_80%,rgba(20,184,166,0.12),transparent_28%)]" />
      <div className="relative mx-auto max-w-[1400px]">
        <SectionHeader
          eyebrow={modelT('eyebrow')}
          title={modelT('title')}
          body={modelT('body')}
        />

        <div className="relative mx-auto mt-14 min-h-[520px] max-w-6xl overflow-hidden rounded-[32px] border border-white/8 bg-black/24 p-6 md:p-10">
          <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:42px_42px]" />
          <div className="relative flex min-h-[460px] items-center justify-center">
            <div className="absolute h-48 w-48 rounded-full border border-white/12 bg-white/[0.04] shadow-[0_0_80px_rgba(255,255,255,0.08)]" />
            <div className="relative z-10 flex h-40 w-40 flex-col items-center justify-center rounded-full border border-white/16 bg-white text-center text-black shadow-[0_28px_120px_rgba(0,0,0,0.35)]">
              <Workflow className="h-7 w-7" />
              <p className="mt-3 text-sm font-semibold">{modelT('centerTitle')}</p>
              <p className="mt-1 text-xs text-black/55">{modelT('centerBody')}</p>
            </div>

            {MODEL_PROVIDERS.map((provider, index) => {
              const angle = (index / MODEL_PROVIDERS.length) * Math.PI * 2
              const radiusX = 430
              const radiusY = 188
              const x = Math.cos(angle) * radiusX
              const y = Math.sin(angle) * radiusY

              return (
                <div
                  key={provider}
                  className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block"
                  style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
                >
                  <div className="rounded-full border border-white/10 bg-white/[0.055] px-4 py-2 text-sm text-white/78 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
                    {provider}
                  </div>
                </div>
              )
            })}

            <div className="grid w-full gap-3 md:hidden">
              {MODEL_PROVIDERS.slice(0, 12).map((provider) => (
                <div
                  key={provider}
                  className="rounded-full border border-white/10 bg-white/[0.055] px-4 py-2 text-center text-sm text-white/78"
                >
                  {provider}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function FeaturesSection() {
  const featuresT = useTranslations('landing.sections.features')

  return (
    <section id="features" className="bg-[#0b0b0f] px-5 py-24">
      <div className="mx-auto max-w-[1400px]">
        <SectionHeader
          eyebrow={featuresT('eyebrow')}
          title={featuresT('title')}
          body={featuresT('body')}
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-4">
          {FEATURE_KEYS.map((key, index) => (
            <article
              key={key}
              className="min-h-[300px] rounded-[28px] border border-white/8 bg-white/[0.035] p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-black">
                {index === 0 ? <Workflow className="h-5 w-5" /> : null}
                {index === 1 ? <Sparkles className="h-5 w-5" /> : null}
                {index === 2 ? <Zap className="h-5 w-5" /> : null}
                {index === 3 ? <Star className="h-5 w-5" /> : null}
              </div>
              <h3 className="mt-7 text-xl font-semibold text-white">
                {featuresT(`items.${key}.title`)}
              </h3>
              <p className="mt-4 text-sm leading-7 text-white/62">
                {featuresT(`items.${key}.body`)}
              </p>
              <div className="mt-7 h-28 rounded-2xl border border-white/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.11),rgba(255,255,255,0.02))] p-3">
                <div className="grid h-full grid-cols-3 gap-2">
                  <div className="rounded-xl bg-white/10" />
                  <div className="rounded-xl bg-emerald-300/18" />
                  <div className="rounded-xl bg-amber-300/18" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export function PricingSection() {
  const pricingT = useTranslations('landing.sections.pricing')

  return (
    <section id="pricing" className="bg-[#09090d] px-5 py-24">
      <div className="mx-auto max-w-[1400px]">
        <SectionHeader
          eyebrow={pricingT('eyebrow')}
          title={pricingT('title')}
          body={pricingT('body')}
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-4">
          {PRICING_PLANS.map((plan) => (
            <article
              key={plan.key}
              className={`flex min-h-[430px] flex-col rounded-[28px] border p-6 ${
                plan.popular
                  ? 'border-white/24 bg-white/[0.075] shadow-[0_28px_100px_rgba(255,255,255,0.08)]'
                  : 'border-white/8 bg-white/[0.035]'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold text-white">
                    {pricingT(`plans.${plan.key}.name`)}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-white/58">
                    {pricingT(`plans.${plan.key}.body`)}
                  </p>
                </div>
                {plan.popular ? (
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-black">
                    {pricingT('popular')}
                  </span>
                ) : null}
              </div>

              <p className="mt-8 text-5xl font-semibold text-white">{plan.price}</p>
              <p className="mt-2 text-sm text-white/45">
                {pricingT(`plans.${plan.key}.period`)}
              </p>

              <div className="mt-8 space-y-3 text-sm text-white/78">
                <div className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-emerald-300" />
                  {pricingT('credits', { value: plan.credits })}
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-emerald-300" />
                  {pricingT('storage', { value: plan.storage })}
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-emerald-300" />
                  {pricingT(`plans.${plan.key}.note`)}
                </div>
              </div>

              <Link
                href="/pricing"
                className={`mt-auto inline-flex h-11 items-center justify-center rounded-xl text-sm font-medium transition ${
                  plan.popular
                    ? 'bg-white text-black hover:bg-white/88'
                    : 'border border-white/12 text-white hover:bg-white/8'
                }`}
              >
                {pricingT('cta')}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export function TestimonialsSection() {
  const testimonialsT = useTranslations('landing.sections.testimonials')

  return (
    <section className="bg-[#0b0b0f] px-5 py-24">
      <div className="mx-auto max-w-[1400px]">
        <SectionHeader
          eyebrow={testimonialsT('eyebrow')}
          title={testimonialsT('title')}
          body={testimonialsT('body')}
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {TESTIMONIAL_KEYS.map((key) => (
            <article
              key={key}
              className="rounded-[28px] border border-white/8 bg-white/[0.035] p-7"
            >
              <div className="flex gap-1 text-amber-200">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-7 text-lg leading-8 text-white/82">
                {testimonialsT(`${key}.quote`)}
              </p>
              <div className="mt-8 border-t border-white/8 pt-5">
                <p className="font-medium text-white">{testimonialsT(`${key}.name`)}</p>
                <p className="mt-1 text-sm text-white/45">
                  {testimonialsT(`${key}.role`)}
                </p>
              </div>
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
    <section id="faq" className="bg-[#09090d] px-5 py-24">
      <div className="mx-auto max-w-5xl">
        <SectionHeader
          eyebrow={faqT('eyebrow')}
          title={faqT('title')}
          body={faqT('body')}
        />

        <div className="mt-12 space-y-4">
          {FAQ_KEYS.map((key) => (
            <details
              key={key}
              className="group rounded-2xl border border-white/8 bg-white/[0.035] p-6"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium text-white">
                <span>{faqT(`${key}.question`)}</span>
                <CircleHelp className="h-5 w-5 shrink-0 text-white/45 transition group-open:rotate-45" />
              </summary>
              <p className="mt-5 text-sm leading-7 text-white/62">
                {faqT(`${key}.answer`)}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

export function CtaSection() {
  const ctaT = useTranslations('landing.sections.cta')

  return (
    <section className="bg-[#0b0b0f] px-5 py-24">
      <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
        <p className="text-sm font-medium tracking-[0.24em] text-white/45 uppercase">
          {ctaT('eyebrow')}
        </p>
        <h2 className="mt-5 max-w-3xl text-4xl font-semibold text-white md:text-6xl">
          {ctaT('title')}
        </h2>
        <p className="mt-6 max-w-2xl text-base leading-7 text-white/62 md:text-lg">
          {ctaT('body')}
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/sign-in"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-7 text-sm font-medium text-black transition hover:bg-white/88"
          >
            {ctaT('primary')}
          </Link>
          <Link
            href="/pricing"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-white/12 px-7 text-sm font-medium text-white transition hover:bg-white/8"
          >
            {ctaT('secondary')}
          </Link>
        </div>
      </div>
    </section>
  )
}
