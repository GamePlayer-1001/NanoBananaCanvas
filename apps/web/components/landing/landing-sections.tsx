/**
 * [INPUT]: 依赖 react 的 useEffect/useState，依赖 next-intl 的 useTranslations，
 *          依赖 @/components/shared/brand-mark，依赖 @/components/ui/button，
 *          依赖 @/components/ui/collapsible，依赖 @/i18n/navigation 的 Link，
 *          依赖 lucide-react 的 ChevronDown/ArrowRight/ArrowUpRight
 * [OUTPUT]: 对外提供 Landing 中后段板块组件与右侧节点式滚动 rail
 * [POS]: landing 的主体信息区，被 (landing)/page.tsx 消费，承接 models/features/pricing/proof/faq/cta
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, ArrowUpRight, ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { BrandMark } from '@/components/shared/brand-mark'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Link } from '@/i18n/navigation'

const SECTION_IDS = ['models', 'features', 'pricing', 'proof', 'faq', 'cta'] as const

function SectionShell({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: (typeof SECTION_IDS)[number]
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className="relative border-t border-white/6 px-5 py-20 md:py-28 lg:min-h-[100svh] lg:scroll-mt-24"
    >
      <div className="mx-auto max-w-[1380px]">
        <div className="mb-10 max-w-[760px] md:mb-14">
          <p className="mb-4 text-[11px] tracking-[0.32em] text-[var(--landing-muted)] uppercase">
            {eyebrow}
          </p>
          <h2 className="text-4xl font-semibold tracking-[-0.04em] text-[var(--landing-ink)] md:text-6xl">
            {title}
          </h2>
          <p className="mt-4 max-w-[680px] text-base leading-8 text-[var(--landing-muted)] md:text-lg">
            {description}
          </p>
        </div>
        {children}
      </div>
    </section>
  )
}

function LandingRail({ activeId, visible }: { activeId: string; visible: boolean }) {
  const t = useTranslations('landing.sections.rail')

  return (
    <nav
      className={`pointer-events-none fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 xl:flex xl:flex-col xl:gap-3 xl:transition-opacity ${visible ? 'opacity-100' : 'opacity-0'}`}
      aria-label="Landing sections"
    >
      {SECTION_IDS.map((id) => {
        const active = activeId === id

        return (
          <a
            key={id}
            href={`#${id}`}
            className="pointer-events-auto group flex items-center justify-end gap-3"
          >
            <span
              className={`max-w-0 overflow-hidden text-[10px] tracking-[0.26em] whitespace-nowrap uppercase transition-all duration-300 group-hover:max-w-[10rem] ${active ? 'text-[var(--landing-ink)]' : 'text-[var(--landing-faint)]'}`}
            >
              {t(id)}
            </span>
            <span
              className={`h-2.5 w-2.5 rounded-full border transition-all duration-300 ${active ? 'border-[var(--landing-ink)] bg-[var(--landing-ink)] shadow-[0_0_16px_rgba(255,255,255,0.4)]' : 'border-white/26 bg-transparent'}`}
            />
          </a>
        )
      })}
    </nav>
  )
}

export function LandingSections() {
  const t = useTranslations('landing.sections')
  const seoT = useTranslations('landingSeo')

  const [activeId, setActiveId] = useState<string>('models')
  const [railVisible, setRailVisible] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  useEffect(() => {
    const sections = SECTION_IDS.flatMap((id) => {
      const section = document.getElementById(id)
      return section ? [section] : []
    })
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0]

        if (visibleEntry?.target.id) {
          setActiveId(visibleEntry.target.id)
        }
      },
      {
        threshold: [0.2, 0.35, 0.6],
        rootMargin: '-18% 0px -30% 0px',
      },
    )

    sections.forEach((section) => observer.observe(section))

    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined

    function revealRail() {
      setRailVisible(true)
      if (timer) {
        clearTimeout(timer)
      }
      timer = setTimeout(() => {
        setRailVisible(false)
      }, 1200)
    }

    function handlePointerMove(event: MouseEvent) {
      if (window.innerWidth < 1280) {
        return
      }

      if (event.clientX > window.innerWidth - 180) {
        revealRail()
      }
    }

    window.addEventListener('scroll', revealRail, { passive: true })
    window.addEventListener('mousemove', handlePointerMove)

    return () => {
      window.removeEventListener('scroll', revealRail)
      window.removeEventListener('mousemove', handlePointerMove)
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [])

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

  return (
    <>
      <LandingRail activeId={activeId} visible={railVisible} />

      <div className="relative bg-[var(--landing-bg)]">
        <SectionShell
          id="models"
          eyebrow={t('models.eyebrow')}
          title={t('models.title')}
          description={t('models.description')}
        >
          <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="rounded-[34px] border border-[var(--landing-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-7 md:p-9">
              <div className="flex flex-wrap items-start justify-between gap-6 border-b border-white/8 pb-6">
                <div className="max-w-[34rem]">
                  <p className="text-[11px] tracking-[0.26em] text-[var(--landing-faint)] uppercase">
                    {t('models.currentLabel')}
                  </p>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2">
                      <BrandMark className="text-2xl text-[var(--landing-ink)]" />
                    </div>
                    <p className="text-sm leading-7 text-[var(--landing-muted)]">
                      {t('models.currentBody')}
                    </p>
                  </div>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-white/14 bg-white/[0.02] text-[var(--landing-ink)] hover:bg-white/[0.06]"
                >
                  <Link href="/models">
                    {t('models.explore')}
                    <ArrowUpRight className="size-4" />
                  </Link>
                </Button>
              </div>

              <div className="mt-7 grid gap-4 md:grid-cols-2">
                <div className="rounded-[26px] border border-white/8 bg-black/24 p-5">
                  <p className="text-xs tracking-[0.26em] text-[var(--landing-faint)] uppercase">
                    {t('models.currentRuntime')}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {['OpenAI', 'Qwen', 'Gemini', 'DeepSeek', 'Kling', 'Vidu', 'MiniMax'].map(
                      (provider) => (
                        <span
                          key={provider}
                          className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-[var(--landing-ink)]"
                        >
                          {provider}
                        </span>
                      ),
                    )}
                  </div>
                </div>

                <div className="rounded-[26px] border border-white/8 bg-white/[0.03] p-5">
                  <p className="text-xs tracking-[0.26em] text-[var(--landing-faint)] uppercase">
                    {t('models.ecosystemLabel')}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      'Midjourney',
                      'Luma',
                      'Runway',
                      'xAI',
                      'Black Forest',
                      'Google',
                      'Anthropic',
                      'ElevenLabs',
                      'OpenRouter',
                      'Alibaba Wan',
                    ].map((provider) => (
                      <span
                        key={provider}
                        className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-sm text-[var(--landing-muted)]"
                      >
                        {provider}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {[
                t('models.clusterText'),
                t('models.clusterImage'),
                t('models.clusterVideo'),
                t('models.clusterAudio'),
              ].map((label, index) => (
                <article
                  key={label}
                  className="rounded-[30px] border border-[var(--landing-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] tracking-[0.26em] text-[var(--landing-faint)] uppercase">
                        {t(`models.clusterEyebrow${index + 1}`)}
                      </p>
                      <h3 className="mt-3 text-2xl font-semibold text-[var(--landing-ink)]">
                        {label}
                      </h3>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-[var(--landing-muted)]">
                      {t(`models.clusterState${index + 1}`)}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[var(--landing-muted)]">
                    {t(`models.clusterBody${index + 1}`)}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </SectionShell>

        <SectionShell
          id="features"
          eyebrow={t('features.eyebrow')}
          title={t('features.title')}
          description={t('features.description')}
        >
          <div className="grid gap-5 lg:grid-cols-2">
            {[1, 2, 3, 4].map((index) => (
              <article
                key={index}
                className="group overflow-hidden rounded-[32px] border border-[var(--landing-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]"
              >
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
            ))}
          </div>
        </SectionShell>

        <SectionShell
          id="pricing"
          eyebrow={t('pricing.eyebrow')}
          title={t('pricing.title')}
          description={t('pricing.description')}
        >
          <div className="grid gap-5 xl:grid-cols-4">
            {['free', 'standard', 'pro', 'ultimate'].map((plan) => (
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

        <SectionShell
          id="proof"
          eyebrow={t('proof.eyebrow')}
          title={t('proof.title')}
          description={t('proof.description')}
        >
          <div className="grid gap-5 xl:grid-cols-3">
            <article className="rounded-[30px] border border-[var(--landing-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6">
              <p className="text-[11px] tracking-[0.26em] text-[var(--landing-faint)] uppercase">
                {seoT('coverageTitle')}
              </p>
              <p className="mt-4 text-sm leading-7 text-[var(--landing-muted)]">{seoT('coverageBody')}</p>
              <ul className="mt-6 space-y-2 text-sm text-[var(--landing-ink)]">
                <li>{seoT('coverageRegionAmericas')}</li>
                <li>{seoT('coverageRegionEurope')}</li>
                <li>{seoT('coverageRegionApac')}</li>
              </ul>
            </article>

            <article className="rounded-[30px] border border-[var(--landing-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6">
              <p className="text-[11px] tracking-[0.26em] text-[var(--landing-faint)] uppercase">
                {seoT('capabilityTitle')}
              </p>
              <p className="mt-4 text-sm leading-7 text-[var(--landing-muted)]">
                {seoT('capabilityBody')}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {[seoT('featureWorkflow'), seoT('featureImageVideo'), seoT('featureTemplates')].map(
                  (item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-[var(--landing-ink)]"
                    >
                      {item}
                    </span>
                  ),
                )}
              </div>
            </article>

            <article className="rounded-[30px] border border-[var(--landing-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6">
              <p className="text-[11px] tracking-[0.26em] text-[var(--landing-faint)] uppercase">
                {seoT('geoTitle')}
              </p>
              <p className="mt-4 text-sm leading-7 text-[var(--landing-muted)]">{seoT('geoBody')}</p>
              <p className="mt-6 text-sm leading-7 text-[var(--landing-ink)]">{seoT('geoNote')}</p>
            </article>
          </div>
        </SectionShell>

        <SectionShell
          id="faq"
          eyebrow={t('faq.eyebrow')}
          title={seoT('faqTitle')}
          description={t('faq.description')}
        >
          <div className="mx-auto max-w-[980px] space-y-4">
            {faqItems.map((item, index) => {
              const open = openFaq === index

              return (
                <Collapsible
                  key={item.question}
                  open={open}
                  onOpenChange={(nextOpen) => setOpenFaq(nextOpen ? index : null)}
                  className="rounded-[28px] border border-[var(--landing-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-6"
                >
                  <CollapsibleTrigger className="flex w-full items-center justify-between gap-6 py-6 text-left">
                    <span className="text-lg font-medium text-[var(--landing-ink)] md:text-xl">
                      {item.question}
                    </span>
                    <span
                      className={`rounded-full border border-white/10 p-2 transition-transform ${open ? 'rotate-180' : ''}`}
                    >
                      <ChevronDown className="size-4 text-[var(--landing-ink)]" />
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden pb-6 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0">
                    <p className="max-w-[52rem] text-sm leading-8 text-[var(--landing-muted)]">
                      {item.answer}
                    </p>
                  </CollapsibleContent>
                </Collapsible>
              )
            })}
          </div>
        </SectionShell>

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
      </div>
    </>
  )
}
