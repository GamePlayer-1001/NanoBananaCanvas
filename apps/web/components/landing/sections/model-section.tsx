/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @/components/shared/brand-mark，
 *          依赖 @/components/ui/button，依赖 @/i18n/navigation 的 Link，
 *          依赖 lucide-react 的 ArrowUpRight
 * [OUTPUT]: 对外提供 ModelSection 模型支持板块
 * [POS]: landing/sections 的模型生态说明，被 landing-sections.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { ArrowUpRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { SectionShell } from '@/components/landing/sections/section-shell'
import { BrandMark } from '@/components/shared/brand-mark'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

const RUNTIME_PROVIDERS = ['OpenAI', 'Qwen', 'Gemini', 'DeepSeek', 'Kling', 'Vidu', 'MiniMax']
const ECOSYSTEM_PROVIDERS = [
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
]

export function ModelSection() {
  const t = useTranslations('landing.sections')

  return (
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
            <ProviderCloud title={t('models.currentRuntime')} providers={RUNTIME_PROVIDERS} />
            <ProviderCloud
              title={t('models.ecosystemLabel')}
              providers={ECOSYSTEM_PROVIDERS}
              muted
            />
          </div>
        </div>

        <div className="grid gap-4">
          {[1, 2, 3, 4].map((index) => (
            <ModelCluster key={index} index={index} />
          ))}
        </div>
      </div>
    </SectionShell>
  )
}

function ProviderCloud({
  title,
  providers,
  muted = false,
}: {
  title: string
  providers: string[]
  muted?: boolean
}) {
  return (
    <div className={`rounded-[26px] border border-white/8 p-5 ${muted ? 'bg-white/[0.03]' : 'bg-black/24'}`}>
      <p className="text-xs tracking-[0.26em] text-[var(--landing-faint)] uppercase">{title}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {providers.map((provider) => (
          <span
            key={provider}
            className={`rounded-full border border-white/10 px-3 py-1.5 text-sm ${muted ? 'bg-white/[0.02] text-[var(--landing-muted)]' : 'text-[var(--landing-ink)]'}`}
          >
            {provider}
          </span>
        ))}
      </div>
    </div>
  )
}

function ModelCluster({ index }: { index: number }) {
  const t = useTranslations('landing.sections')
  const labels = [
    t('models.clusterText'),
    t('models.clusterImage'),
    t('models.clusterVideo'),
    t('models.clusterAudio'),
  ]

  return (
    <article className="rounded-[30px] border border-[var(--landing-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-[0.26em] text-[var(--landing-faint)] uppercase">
            {t(`models.clusterEyebrow${index}`)}
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-[var(--landing-ink)]">
            {labels[index - 1]}
          </h3>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-[var(--landing-muted)]">
          {t(`models.clusterState${index}`)}
        </span>
      </div>
      <p className="mt-4 text-sm leading-7 text-[var(--landing-muted)]">
        {t(`models.clusterBody${index}`)}
      </p>
    </article>
  )
}
