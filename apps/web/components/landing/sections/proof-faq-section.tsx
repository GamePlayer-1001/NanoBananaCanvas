/**
 * [INPUT]: 依赖 react 的 useState，依赖 next-intl 的 useTranslations，
 *          依赖 @/components/ui/collapsible，依赖 @/components/landing/sections/section-shell，
 *          依赖 lucide-react 的 ChevronDown
 * [OUTPUT]: 对外提供 ProofSection 与 FaqSection
 * [POS]: landing/sections 的社会证明与 FAQ 板块，被 landing-sections.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { type ReactNode, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { SectionShell } from '@/components/landing/sections/section-shell'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

export function ProofSection() {
  const t = useTranslations('landing.sections')
  const seoT = useTranslations('landingSeo')

  return (
    <SectionShell
      id="proof"
      eyebrow={t('proof.eyebrow')}
      title={t('proof.title')}
      description={t('proof.description')}
    >
      <div className="grid gap-5 xl:grid-cols-3">
        <ProofCard title={seoT('coverageTitle')} body={seoT('coverageBody')}>
          <ul className="mt-6 space-y-2 text-sm text-[var(--landing-ink)]">
            <li>{seoT('coverageRegionAmericas')}</li>
            <li>{seoT('coverageRegionEurope')}</li>
            <li>{seoT('coverageRegionApac')}</li>
          </ul>
        </ProofCard>

        <ProofCard title={seoT('capabilityTitle')} body={seoT('capabilityBody')}>
          <div className="mt-6 flex flex-wrap gap-2">
            {[
              seoT('featureWorkflow'),
              seoT('featureImageVideo'),
              seoT('featureTemplates'),
            ].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-[var(--landing-ink)]"
              >
                {item}
              </span>
            ))}
          </div>
        </ProofCard>

        <ProofCard title={seoT('geoTitle')} body={seoT('geoBody')}>
          <p className="mt-6 text-sm leading-7 text-[var(--landing-ink)]">
            {seoT('geoNote')}
          </p>
        </ProofCard>
      </div>
    </SectionShell>
  )
}

export function FaqSection() {
  const t = useTranslations('landing.sections')
  const seoT = useTranslations('landingSeo')
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const faqItems = [
    { question: seoT('faqQuestion1'), answer: seoT('faqAnswer1') },
    { question: seoT('faqQuestion2'), answer: seoT('faqAnswer2') },
    { question: seoT('faqQuestion3'), answer: seoT('faqAnswer3') },
  ]

  return (
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
              className="rounded-lg border border-[var(--landing-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-6"
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
              <CollapsibleContent className="data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 overflow-hidden pb-6">
                <p className="max-w-[52rem] text-sm leading-8 text-[var(--landing-muted)]">
                  {item.answer}
                </p>
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </div>
    </SectionShell>
  )
}

function ProofCard({
  title,
  body,
  children,
}: {
  title: string
  body: string
  children: ReactNode
}) {
  return (
    <article className="rounded-lg border border-[var(--landing-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6">
      <p className="text-[11px] tracking-[0.26em] text-[var(--landing-faint)] uppercase">
        {title}
      </p>
      <p className="mt-4 text-sm leading-7 text-[var(--landing-muted)]">{body}</p>
      {children}
    </article>
  )
}
