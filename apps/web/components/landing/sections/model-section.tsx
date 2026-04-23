/**
 * [INPUT]: 依赖 react 的 CSSProperties 类型，依赖 next-intl 的 useTranslations，
 *          依赖 @/components/shared/brand-mark，依赖 @/components/ui/button，
 *          依赖 @/i18n/navigation 的 Link，依赖 lucide-react 的 ArrowUpRight
 * [OUTPUT]: 对外提供 ModelSection 与 ModelMindMapSection 模型脑图板块
 * [POS]: landing/sections 的模型生态说明，被 landing-sections.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import type { CSSProperties } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { SectionShell } from '@/components/landing/sections/section-shell'
import { BrandMark } from '@/components/shared/brand-mark'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

type ProviderStatus = 'runtime' | 'ecosystem'
type ClusterId = 'text' | 'image' | 'video' | 'audio'

interface ProviderNode {
  name: string
  status: ProviderStatus
  x: number
  y: number
}

interface ClusterNode {
  id: ClusterId
  x: number
  y: number
  providers: ProviderNode[]
}

interface ClusterCopy {
  label: string
  body: string
  state: string
}

const RUNTIME_PROVIDERS = ['OpenRouter', 'DeepSeek', 'Gemini', 'Kling', 'OpenAI']
const ECOSYSTEM_PROVIDERS = [
  'Qwen',
  'Midjourney',
  'Luma',
  'Groq',
  'xAI',
  'Black Forest Labs',
  'Runway',
  'ByteDance',
  'Google',
  'Anthropic',
  'MiniMax',
  'Vidu',
  'Alibaba Wan',
  'ElevenLabs',
  'Stability',
]

const CLUSTERS: ClusterNode[] = [
  {
    id: 'text',
    x: 50,
    y: 16,
    providers: [
      { name: 'OpenRouter', status: 'runtime', x: 34, y: 9 },
      { name: 'DeepSeek', status: 'runtime', x: 62, y: 7 },
      { name: 'Anthropic', status: 'ecosystem', x: 23, y: 23 },
      { name: 'Groq', status: 'ecosystem', x: 78, y: 23 },
      { name: 'xAI', status: 'ecosystem', x: 50, y: 4 },
    ],
  },
  {
    id: 'image',
    x: 83,
    y: 50,
    providers: [
      { name: 'OpenAI', status: 'runtime', x: 88, y: 30 },
      { name: 'Gemini', status: 'runtime', x: 91, y: 46 },
      { name: 'Midjourney', status: 'ecosystem', x: 72, y: 37 },
      { name: 'Black Forest Labs', status: 'ecosystem', x: 68, y: 61 },
      { name: 'Stability', status: 'ecosystem', x: 90, y: 68 },
      { name: 'Qwen', status: 'ecosystem', x: 96, y: 56 },
    ],
  },
  {
    id: 'video',
    x: 50,
    y: 84,
    providers: [
      { name: 'Kling', status: 'runtime', x: 49, y: 94 },
      { name: 'Runway', status: 'ecosystem', x: 29, y: 84 },
      { name: 'Luma', status: 'ecosystem', x: 67, y: 91 },
      { name: 'ByteDance', status: 'ecosystem', x: 74, y: 77 },
      { name: 'Alibaba Wan', status: 'ecosystem', x: 36, y: 72 },
      { name: 'MiniMax', status: 'ecosystem', x: 58, y: 69 },
      { name: 'Vidu', status: 'ecosystem', x: 20, y: 94 },
    ],
  },
  {
    id: 'audio',
    x: 17,
    y: 50,
    providers: [
      { name: 'OpenAI', status: 'runtime', x: 9, y: 37 },
      { name: 'ElevenLabs', status: 'ecosystem', x: 8, y: 57 },
      { name: 'Google', status: 'ecosystem', x: 25, y: 28 },
      { name: 'MiniMax', status: 'ecosystem', x: 31, y: 68 },
    ],
  },
]

export function ModelSection() {
  return <ModelMindMapSection />
}

export function ModelMindMapSection() {
  const t = useTranslations('landing.sections')

  return (
    <SectionShell
      id="models"
      eyebrow={t('models.eyebrow')}
      title={t('models.title')}
      description={t('models.description')}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <MindMapCanvas />
        <ModelBoundaryPanel />
      </div>
    </SectionShell>
  )
}

function MindMapCanvas() {
  const t = useTranslations('landing.sections')
  const clusterCopies = useModelClusterCopies()

  return (
    <div className="relative min-h-[620px] overflow-hidden rounded-lg border border-[var(--landing-border)] bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.12),transparent_25%),linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.018))]">
      <div className="landing-grain pointer-events-none absolute inset-0 opacity-35" />
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
      >
        {CLUSTERS.map((cluster) => (
          <g key={cluster.id}>
            <line
              x1="50"
              y1="50"
              x2={cluster.x}
              y2={cluster.y}
              className="landing-model-link"
            />
            {cluster.providers.map((provider) => (
              <line
                key={`${cluster.id}-${provider.name}`}
                x1={cluster.x}
                y1={cluster.y}
                x2={provider.x}
                y2={provider.y}
                className={
                  provider.status === 'runtime'
                    ? 'landing-model-link landing-model-link-runtime'
                    : 'landing-model-link landing-model-link-muted'
                }
              />
            ))}
          </g>
        ))}
      </svg>

      <div className="landing-model-center absolute top-1/2 left-1/2 z-20 flex h-38 w-38 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-white/18 bg-black/72 text-center shadow-[0_0_72px_rgba(255,255,255,0.16)] backdrop-blur-md">
        <p className="text-[10px] tracking-[0.24em] text-[var(--landing-faint)] uppercase">
          {t('models.centerLabel')}
        </p>
        <BrandMark className="mt-2 max-w-[8rem] text-3xl leading-none text-[var(--landing-ink)]" />
      </div>

      {CLUSTERS.map((cluster) => (
        <ClusterBubble
          key={cluster.id}
          cluster={cluster}
          label={clusterCopies[cluster.id].label}
        />
      ))}

      {CLUSTERS.flatMap((cluster) =>
        cluster.providers.map((provider) => (
          <ProviderPill key={`${cluster.id}-${provider.name}`} provider={provider} />
        )),
      )}
    </div>
  )
}

function ModelBoundaryPanel() {
  const t = useTranslations('landing.sections')
  const clusterCopies = useModelClusterCopies()

  return (
    <div className="grid gap-5">
      <div className="rounded-lg border border-[var(--landing-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.052),rgba(255,255,255,0.018))] p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-[11px] tracking-[0.26em] text-[var(--landing-faint)] uppercase">
              {t('models.currentLabel')}
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--landing-muted)]">
              {t('models.currentBody')}
            </p>
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
      </div>

      <ProviderCloud title={t('models.currentRuntime')} providers={RUNTIME_PROVIDERS} />
      <ProviderCloud
        title={t('models.ecosystemLabel')}
        providers={ECOSYSTEM_PROVIDERS}
        muted
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        {CLUSTERS.map((cluster) => (
          <article
            key={cluster.id}
            className="rounded-lg border border-white/8 bg-white/[0.025] p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-xl font-semibold text-[var(--landing-ink)]">
                {clusterCopies[cluster.id].label}
              </h3>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-[var(--landing-muted)]">
                {clusterCopies[cluster.id].state}
              </span>
            </div>
            <p className="mt-3 text-sm leading-7 text-[var(--landing-muted)]">
              {clusterCopies[cluster.id].body}
            </p>
          </article>
        ))}
      </div>
    </div>
  )
}

function ClusterBubble({ cluster, label }: { cluster: ClusterNode; label: string }) {
  const style = {
    '--x': `${cluster.x}%`,
    '--y': `${cluster.y}%`,
  } as CSSProperties

  return (
    <div
      className="landing-model-bubble absolute z-10 flex h-26 w-26 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/16 bg-black/62 p-4 text-center shadow-[0_18px_60px_rgba(0,0,0,0.38)] backdrop-blur-md"
      style={style}
    >
      <span className="text-sm leading-5 font-semibold text-[var(--landing-ink)]">
        {label}
      </span>
    </div>
  )
}

function useModelClusterCopies(): Record<ClusterId, ClusterCopy> {
  const t = useTranslations('landing.sections')

  return {
    text: {
      label: t('models.clusterText'),
      body: t('models.clusterBody1'),
      state: t('models.clusterState1'),
    },
    image: {
      label: t('models.clusterImage'),
      body: t('models.clusterBody2'),
      state: t('models.clusterState2'),
    },
    video: {
      label: t('models.clusterVideo'),
      body: t('models.clusterBody3'),
      state: t('models.clusterState3'),
    },
    audio: {
      label: t('models.clusterAudio'),
      body: t('models.clusterBody4'),
      state: t('models.clusterState4'),
    },
  }
}

function ProviderPill({ provider }: { provider: ProviderNode }) {
  const t = useTranslations('landing.sections')
  const style = {
    '--x': `${provider.x}%`,
    '--y': `${provider.y}%`,
  } as CSSProperties
  const runtime = provider.status === 'runtime'

  return (
    <div
      className={`landing-model-provider absolute z-30 -translate-x-1/2 -translate-y-1/2 rounded-full border px-3 py-1.5 text-xs shadow-[0_12px_32px_rgba(0,0,0,0.3)] backdrop-blur-md ${runtime ? 'border-white/28 bg-white/90 text-black' : 'border-white/12 bg-black/58 text-[var(--landing-muted)]'}`}
      style={style}
    >
      <span className="font-medium">{provider.name}</span>
      <span className="sr-only">
        {runtime ? t('models.runtimeBadge') : t('models.ecosystemBadge')}
      </span>
    </div>
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
    <div
      className={`rounded-lg border border-white/8 p-5 ${muted ? 'bg-white/[0.025]' : 'bg-black/24'}`}
    >
      <p className="text-xs tracking-[0.26em] text-[var(--landing-faint)] uppercase">
        {title}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {providers.map((provider) => (
          <span
            key={provider}
            className={`rounded-full border border-white/10 px-3 py-1.5 text-sm ${muted ? 'bg-white/[0.02] text-[var(--landing-muted)]' : 'bg-white/[0.04] text-[var(--landing-ink)]'}`}
          >
            {provider}
          </span>
        ))}
      </div>
    </div>
  )
}
