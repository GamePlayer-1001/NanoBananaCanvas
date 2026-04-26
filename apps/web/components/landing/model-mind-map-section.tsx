/**
 * [INPUT]: 依赖 react 的 useEffect/useRef/useState，依赖 next-intl 的 useTranslations，
 *          依赖 lucide-react 的 Sparkles/ShieldCheck/Workflow/Zap，依赖 @/i18n/navigation 的 Link，
 *          依赖 @/lib/seo 的 SITE_NAME
 * [OUTPUT]: 对外提供 ModelMindMapSection 模型生态云图展示区
 * [POS]: components/landing 的模型展示主视觉区，被 landing-sections.tsx 转发给首页使用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import Image from 'next/image'
import { Sparkles, ShieldCheck, Workflow, Zap } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

import { Link } from '@/i18n/navigation'
import { SITE_NAME } from '@/lib/seo'

type ProviderTone = 'azure' | 'violet' | 'teal' | 'amber' | 'rose'
type ProviderSize = 'sm' | 'md' | 'lg'
type ProviderLabelSide = 'left' | 'right' | 'bottom'

type ModelProvider = {
  name: string
  iconUrl?: string
  fallback: string
  x: number
  y: number
  size: ProviderSize
  tone: ProviderTone
  labelSide: ProviderLabelSide
  iconScale?: number
  iconFilter?: string
}

type ModelMotionState = {
  progress: number
  reveal: number
  drift: number
}

function buildSimpleIconUrl(slug: string) {
  return `https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/${slug}.svg`
}

const MODEL_STAGE = {
  width: 1400,
  height: 820,
} as const

const MODEL_PROVIDERS: ModelProvider[] = [
  {
    name: 'Google',
    iconUrl: buildSimpleIconUrl('google'),
    fallback: 'G',
    x: 31,
    y: 18,
    size: 'md',
    tone: 'amber',
    labelSide: 'right',
  },
  {
    name: 'OpenAI',
    iconUrl: buildSimpleIconUrl('openai'),
    fallback: 'O',
    x: 49.5,
    y: 15.5,
    size: 'lg',
    tone: 'violet',
    labelSide: 'bottom',
    iconFilter:
      'brightness(0) saturate(100%) invert(99%) sepia(6%) saturate(283%) hue-rotate(184deg) brightness(105%) contrast(100%)',
  },
  {
    name: 'Black Forest',
    iconUrl: buildSimpleIconUrl('blackforestlabs'),
    fallback: 'BF',
    x: 63.5,
    y: 18.5,
    size: 'md',
    tone: 'azure',
    labelSide: 'bottom',
    iconScale: 0.86,
    iconFilter:
      'brightness(0) saturate(100%) invert(96%) sepia(5%) saturate(624%) hue-rotate(180deg) brightness(106%) contrast(98%)',
  },
  {
    name: 'OpenRouter',
    iconUrl: buildSimpleIconUrl('openrouter'),
    fallback: 'OR',
    x: 79,
    y: 29,
    size: 'md',
    tone: 'violet',
    labelSide: 'right',
    iconScale: 0.84,
    iconFilter:
      'brightness(0) saturate(100%) invert(98%) sepia(5%) saturate(312%) hue-rotate(181deg) brightness(107%) contrast(102%)',
  },
  {
    name: 'ByteDance',
    iconUrl: buildSimpleIconUrl('bytedance'),
    fallback: 'BD',
    x: 73.5,
    y: 43.5,
    size: 'md',
    tone: 'azure',
    labelSide: 'right',
  },
  {
    name: 'Anthropic',
    iconUrl: buildSimpleIconUrl('anthropic'),
    fallback: 'AI',
    x: 84.5,
    y: 64.5,
    size: 'md',
    tone: 'amber',
    labelSide: 'right',
    iconFilter:
      'brightness(0) saturate(100%) invert(97%) sepia(4%) saturate(295%) hue-rotate(190deg) brightness(102%) contrast(99%)',
  },
  {
    name: 'Gemini',
    iconUrl: buildSimpleIconUrl('googlegemini'),
    fallback: '✦',
    x: 67,
    y: 77,
    size: 'sm',
    tone: 'azure',
    labelSide: 'right',
  },
  {
    name: 'Alibaba Wan',
    iconUrl: buildSimpleIconUrl('alibabacloud'),
    fallback: 'AW',
    x: 50,
    y: 90.5,
    size: 'sm',
    tone: 'violet',
    labelSide: 'bottom',
    iconScale: 0.8,
  },
  {
    name: 'Kling',
    iconUrl: buildSimpleIconUrl('kling'),
    fallback: 'KL',
    x: 31,
    y: 81,
    size: 'sm',
    tone: 'teal',
    labelSide: 'right',
  },
  {
    name: 'Runway',
    iconUrl: buildSimpleIconUrl('runway'),
    fallback: 'RW',
    x: 23,
    y: 66,
    size: 'sm',
    tone: 'violet',
    labelSide: 'right',
  },
  {
    name: 'Luma',
    iconUrl: buildSimpleIconUrl('luma'),
    fallback: 'LU',
    x: 12.5,
    y: 52.5,
    size: 'sm',
    tone: 'azure',
    labelSide: 'right',
  },
  {
    name: 'Vidu',
    fallback: 'V',
    x: 8.5,
    y: 38.5,
    size: 'sm',
    tone: 'azure',
    labelSide: 'right',
  },
  {
    name: 'MiniMax',
    iconUrl: buildSimpleIconUrl('minimax'),
    fallback: 'MM',
    x: 19,
    y: 29,
    size: 'sm',
    tone: 'rose',
    labelSide: 'right',
  },
  {
    name: 'Groq',
    iconUrl: buildSimpleIconUrl('groq'),
    fallback: 'GQ',
    x: 32.5,
    y: 43,
    size: 'sm',
    tone: 'violet',
    labelSide: 'right',
    iconFilter:
      'brightness(0) saturate(100%) invert(98%) sepia(6%) saturate(283%) hue-rotate(181deg) brightness(108%) contrast(99%)',
  },
  {
    name: 'xAI',
    iconUrl: buildSimpleIconUrl('xai'),
    fallback: 'xI',
    x: 28,
    y: 45.5,
    size: 'md',
    tone: 'violet',
    labelSide: 'right',
    iconFilter:
      'brightness(0) saturate(100%) invert(99%) sepia(3%) saturate(237%) hue-rotate(178deg) brightness(108%) contrast(98%)',
  },
  {
    name: 'Qwen',
    iconUrl: buildSimpleIconUrl('qwen'),
    fallback: 'Q',
    x: 40.5,
    y: 81.5,
    size: 'sm',
    tone: 'violet',
    labelSide: 'bottom',
    iconFilter:
      'brightness(0) saturate(100%) invert(99%) sepia(7%) saturate(155%) hue-rotate(194deg) brightness(103%) contrast(99%)',
  },
  {
    name: 'Midjourney',
    iconUrl: buildSimpleIconUrl('midjourney'),
    fallback: 'MJ',
    x: 87,
    y: 40.5,
    size: 'sm',
    tone: 'violet',
    labelSide: 'right',
    iconScale: 0.9,
    iconFilter:
      'brightness(0) saturate(100%) invert(98%) sepia(5%) saturate(419%) hue-rotate(183deg) brightness(107%) contrast(99%)',
  },
]

const MODEL_NODE_DIMENSIONS = {
  sm: { orb: 76, icon: 28 },
  md: { orb: 92, icon: 34 },
  lg: { orb: 108, icon: 42 },
} as const

const MODEL_TONE_STYLES: Record<
  ProviderTone,
  {
    ring: string
    glow: string
    fill: string
    text: string
    fallbackBg: string
  }
> = {
  azure: {
    ring: 'rgba(92, 150, 255, 0.78)',
    glow: 'rgba(92, 150, 255, 0.22)',
    fill: 'radial-gradient(circle at 32% 26%, rgba(123,172,255,0.24), rgba(8,14,29,0.94) 72%)',
    text: '#eef5ff',
    fallbackBg: 'linear-gradient(180deg,rgba(28,71,162,0.9),rgba(8,16,34,0.98))',
  },
  violet: {
    ring: 'rgba(170, 116, 255, 0.8)',
    glow: 'rgba(170, 116, 255, 0.22)',
    fill: 'radial-gradient(circle at 32% 26%, rgba(188,129,255,0.24), rgba(18,10,34,0.95) 72%)',
    text: '#f6efff',
    fallbackBg: 'linear-gradient(180deg,rgba(94,49,174,0.92),rgba(16,10,31,0.98))',
  },
  teal: {
    ring: 'rgba(84, 215, 188, 0.76)',
    glow: 'rgba(84, 215, 188, 0.2)',
    fill: 'radial-gradient(circle at 32% 26%, rgba(113,225,202,0.22), rgba(8,20,24,0.94) 72%)',
    text: '#ebfffa',
    fallbackBg: 'linear-gradient(180deg,rgba(28,122,107,0.92),rgba(8,20,24,0.98))',
  },
  amber: {
    ring: 'rgba(242, 173, 104, 0.76)',
    glow: 'rgba(242, 173, 104, 0.22)',
    fill: 'radial-gradient(circle at 32% 26%, rgba(242,190,132,0.24), rgba(28,18,12,0.95) 72%)',
    text: '#fff2e3',
    fallbackBg: 'linear-gradient(180deg,rgba(142,88,29,0.92),rgba(30,18,10,0.98))',
  },
  rose: {
    ring: 'rgba(255, 110, 176, 0.8)',
    glow: 'rgba(255, 110, 176, 0.22)',
    fill: 'radial-gradient(circle at 32% 26%, rgba(255,140,192,0.24), rgba(28,10,22,0.95) 72%)',
    text: '#ffedf6',
    fallbackBg: 'linear-gradient(180deg,rgba(164,42,104,0.92),rgba(30,10,22,0.98))',
  },
}

const MODEL_SPARKS = [
  { x: 8, y: 52, tone: 'azure' },
  { x: 18, y: 22, tone: 'violet' },
  { x: 31, y: 10, tone: 'violet' },
  { x: 55, y: 13, tone: 'azure' },
  { x: 74, y: 11, tone: 'violet' },
  { x: 85, y: 18, tone: 'azure' },
  { x: 94, y: 32, tone: 'teal' },
  { x: 92, y: 58, tone: 'azure' },
  { x: 80, y: 79, tone: 'teal' },
  { x: 51, y: 96, tone: 'violet' },
  { x: 22, y: 83, tone: 'azure' },
] as const

const MODEL_STATS = [
  { key: 'vendors', icon: Workflow },
  { key: 'coverage', icon: Sparkles },
  { key: 'routing', icon: Zap },
  { key: 'team', icon: ShieldCheck },
] as const

const INITIAL_MODEL_MOTION: ModelMotionState = { progress: 0, reveal: 0, drift: -1 }

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function ProviderIcon({ provider }: { provider: ModelProvider }) {
  const [failed, setFailed] = useState(false)
  const tone = MODEL_TONE_STYLES[provider.tone]
  const dimension = MODEL_NODE_DIMENSIONS[provider.size]

  if (!provider.iconUrl || failed) {
    return (
      <span
        aria-hidden="true"
        className="flex items-center justify-center rounded-full font-semibold tracking-[0.08em]"
        style={{
          height: `${dimension.icon}px`,
          width: `${dimension.icon}px`,
          background: tone.fallbackBg,
          color: tone.text,
          fontSize:
            provider.size === 'lg'
              ? '0.98rem'
              : provider.size === 'md'
                ? '0.85rem'
                : '0.74rem',
        }}
      >
        {provider.fallback}
      </span>
    )
  }

  return (
    <Image
      src={provider.iconUrl}
      alt=""
      aria-hidden="true"
      width={dimension.icon}
      height={dimension.icon}
      unoptimized
      className="object-contain"
      style={{
        height: `${dimension.icon}px`,
        width: `${dimension.icon}px`,
        transform: `scale(${provider.iconScale ?? 1})`,
        filter:
          provider.iconFilter ??
          'brightness(0) saturate(100%) invert(99%) sepia(7%) saturate(222%) hue-rotate(183deg) brightness(105%) contrast(99%)',
      }}
      onError={() => setFailed(true)}
      referrerPolicy="no-referrer"
    />
  )
}

export function ModelMindMapSection() {
  const modelT = useTranslations('landing.sections.models')
  const sectionRef = useRef<HTMLElement | null>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [motion, setMotion] = useState(INITIAL_MODEL_MOTION)

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncPreference = () => setPrefersReducedMotion(mediaQuery.matches)

    syncPreference()
    mediaQuery.addEventListener('change', syncPreference)

    return () => mediaQuery.removeEventListener('change', syncPreference)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const section = sectionRef.current

    if (!section) return undefined

    let frame = 0

    const measure = () => {
      frame = 0

      const rect = section.getBoundingClientRect()
      const viewportHeight = window.innerHeight || 1
      const progress = clamp(
        (viewportHeight - rect.top) / (viewportHeight + rect.height),
        0,
        1,
      )
      const enter = clamp(
        (viewportHeight * 0.9 - rect.top) / (viewportHeight * 0.62),
        0,
        1,
      )
      const leave = clamp(
        (rect.bottom - viewportHeight * 0.1) / (viewportHeight * 0.52),
        0,
        1,
      )
      const reveal = clamp(Math.min(enter, leave), 0, 1)
      const drift = clamp((progress - 0.5) * 2, -1, 1)

      setMotion((previous) => {
        const hasChanged =
          Math.abs(previous.progress - progress) > 0.006 ||
          Math.abs(previous.reveal - reveal) > 0.006 ||
          Math.abs(previous.drift - drift) > 0.006

        return hasChanged ? { progress, reveal, drift } : previous
      })
    }

    const requestMeasure = () => {
      if (frame) return
      frame = window.requestAnimationFrame(measure)
    }

    requestMeasure()
    window.addEventListener('scroll', requestMeasure, { passive: true })
    window.addEventListener('resize', requestMeasure)

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', requestMeasure)
      window.removeEventListener('resize', requestMeasure)
    }
  }, [])

  const revealProgress = prefersReducedMotion ? 1 : motion.reveal
  const drift = prefersReducedMotion ? 0 : motion.drift
  const vendorCount = MODEL_PROVIDERS.length

  return (
    <section
      ref={sectionRef}
      id="models"
      className="relative overflow-hidden bg-[#05070d] px-4 py-18 sm:px-6 lg:px-8 lg:py-20 xl:px-10"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(102,92,255,0.16),transparent_20%),radial-gradient(circle_at_80%_24%,rgba(76,164,255,0.12),transparent_18%),radial-gradient(circle_at_50%_74%,rgba(166,90,255,0.16),transparent_24%),linear-gradient(180deg,#05070d_0%,#04060b_100%)]" />

      <div className="relative mx-auto w-full max-w-[1680px]">
        <div className="relative overflow-hidden rounded-[36px] border border-white/8 bg-[linear-gradient(180deg,rgba(8,10,18,0.96),rgba(6,8,14,0.98))] px-5 py-8 shadow-[0_32px_120px_rgba(0,0,0,0.28)] sm:px-7 md:px-8 lg:px-10 lg:py-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(110,84,255,0.18),transparent_26%),radial-gradient(circle_at_50%_100%,rgba(20,34,84,0.18),transparent_32%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(148,122,255,0.42),transparent)]" />

          <div
            className="relative z-20 max-w-[38rem] transition-[opacity,transform] duration-500 ease-out"
            style={{
              opacity: 0.18 + revealProgress * 0.82,
              transform: `translate3d(${-30 * (1 - revealProgress)}px, ${12 * (1 - revealProgress)}px, 0)`,
            }}
          >
            <p className="text-sm font-medium tracking-[0.24em] text-white/45 uppercase">
              {modelT('eyebrow')}
            </p>
            <h2 className="mt-5 text-[2.9rem] leading-[0.92] font-semibold tracking-tight text-white md:text-[4.6rem]">
              <span className="block">{modelT('title')}</span>
              <span className="mt-2 block bg-[linear-gradient(90deg,#ffffff_0%,#d9cfff_46%,#9a7dff_100%)] bg-clip-text text-transparent">
                {modelT('highlight')}
              </span>
            </h2>
            <p className="mt-6 max-w-[34rem] text-base leading-8 text-white/62 md:text-[1.12rem] md:leading-9">
              {modelT('body')}
            </p>
            <Link
              href="/models"
              className="mt-8 inline-flex h-[3.25rem] items-center justify-center rounded-full border border-white/12 bg-white px-6 text-sm font-semibold text-black transition hover:bg-white/90 md:px-7 md:text-[0.98rem]"
            >
              {modelT('cta')}
            </Link>
          </div>

          <div
            className="relative z-10 mt-10 transition-[opacity,transform] duration-500 ease-out lg:-mt-20"
            style={{
              opacity: 0.24 + revealProgress * 0.76,
              transform: `translate3d(0, ${18 * (1 - revealProgress) - drift * 10}px, 0)`,
            }}
          >
            <div className="relative mx-auto aspect-[1400/820] w-full max-w-[1460px]">
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox={`0 0 ${MODEL_STAGE.width} ${MODEL_STAGE.height}`}
                fill="none"
                aria-hidden="true"
                style={{
                  transform: `scale(${0.96 + revealProgress * 0.04}) rotate(${drift * 1.8}deg)`,
                  opacity: 0.32 + revealProgress * 0.68,
                }}
              >
                <ellipse
                  cx="700"
                  cy="410"
                  rx="650"
                  ry="250"
                  stroke="rgba(93, 104, 170, 0.46)"
                  strokeWidth="1.1"
                />
                <ellipse
                  cx="700"
                  cy="410"
                  rx="540"
                  ry="198"
                  stroke="rgba(111, 89, 255, 0.34)"
                  strokeWidth="1.05"
                />
                <ellipse
                  cx="700"
                  cy="410"
                  rx="408"
                  ry="146"
                  stroke="rgba(144, 109, 255, 0.28)"
                  strokeWidth="1"
                />
                <ellipse
                  cx="700"
                  cy="410"
                  rx="280"
                  ry="102"
                  stroke="rgba(125, 108, 255, 0.22)"
                  strokeWidth="0.95"
                />

                <path
                  d="M220 306C412 226 571 214 700 248C845 285 974 285 1138 232"
                  stroke="rgba(114,92,255,0.22)"
                  strokeWidth="1.1"
                  strokeDasharray="4 10"
                />
                <path
                  d="M244 618C418 572 550 560 700 588C862 619 1006 610 1172 518"
                  stroke="rgba(108,154,255,0.18)"
                  strokeWidth="1.05"
                  strokeDasharray="4 10"
                />
                <path
                  d="M386 168C559 144 824 144 1008 192"
                  stroke="rgba(166,115,255,0.2)"
                  strokeWidth="1"
                  strokeDasharray="4 10"
                />

                {MODEL_SPARKS.map((spark, index) => {
                  const tone = MODEL_TONE_STYLES[spark.tone]

                  return (
                    <circle
                      key={`${spark.x}-${spark.y}-${index}`}
                      cx={(spark.x / 100) * MODEL_STAGE.width}
                      cy={(spark.y / 100) * MODEL_STAGE.height}
                      r={index % 3 === 0 ? 7 : 5.5}
                      fill={tone.ring}
                      style={{
                        opacity: 0.28 + revealProgress * 0.72,
                        animation: prefersReducedMotion
                          ? 'none'
                          : `sparkPulse ${3.2 + (index % 4) * 0.45}s ease-in-out infinite`,
                        animationDelay: `${index * 0.18}s`,
                      }}
                    />
                  )
                })}
              </svg>

              <div
                className="absolute top-[49.5%] left-1/2 z-20 h-[42vw] max-h-[340px] w-[42vw] max-w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#b99aff]/28 bg-[radial-gradient(circle_at_50%_24%,rgba(255,255,255,0.18),rgba(162,111,255,0.92)_38%,rgba(35,16,70,0.98)_74%,rgba(9,10,18,1)_100%)] shadow-[0_0_0_16px_rgba(126,88,255,0.05),0_0_140px_rgba(126,88,255,0.22)] md:h-[320px] md:w-[320px]"
                style={{
                  opacity: 0.36 + revealProgress * 0.64,
                  transform: `translate(-50%, -50%) scale(${0.9 + revealProgress * 0.1})`,
                  animation: prefersReducedMotion
                    ? 'none'
                    : 'corePulse 6.2s ease-in-out infinite',
                }}
              >
                <div className="absolute inset-[16px] rounded-full border border-white/10" />
                <div className="absolute inset-[-14px] rounded-full border border-[#7d65ff]/14" />
                <div className="relative flex h-full flex-col items-center justify-center px-8 text-center">
                  <div className="flex h-18 w-18 items-center justify-center rounded-full border border-white/12 bg-white/10 text-white/94 backdrop-blur-sm">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <p className="mt-6 text-[1.2rem] leading-none font-semibold tracking-tight text-white md:text-[1.45rem]">
                    {SITE_NAME}
                  </p>
                  <p className="mt-3 max-w-[13rem] text-sm leading-6 text-white/72 md:text-[0.96rem] md:leading-7">
                    {modelT('centerBody')}
                  </p>
                </div>
              </div>

              {MODEL_PROVIDERS.map((provider, index) => {
                const tone = MODEL_TONE_STYLES[provider.tone]
                const dimension = MODEL_NODE_DIMENSIONS[provider.size]
                const deltaX = provider.x - 50
                const deltaY = provider.y - 50
                const outwardX = deltaX * 0.14 + drift * (provider.size === 'lg' ? 5 : 3)
                const outwardY = deltaY * 0.12 - drift * (provider.size === 'lg' ? 4 : 2)
                const directionClass =
                  provider.labelSide === 'left'
                    ? 'flex-row-reverse text-right'
                    : provider.labelSide === 'bottom'
                      ? 'flex-col text-center'
                      : 'flex-row text-left'

                return (
                  <div
                    key={provider.name}
                    className="absolute z-30 transition-[opacity,transform] duration-500 ease-out"
                    style={{
                      left: `${provider.x}%`,
                      top: `${provider.y}%`,
                      opacity: 0.14 + revealProgress * 0.86,
                      transform: `translate(-50%, -50%) translate(${outwardX * (1 - revealProgress)}px, ${
                        18 * (1 - revealProgress) + outwardY
                      }px) scale(${0.72 + revealProgress * 0.28})`,
                      transitionDelay: prefersReducedMotion
                        ? '0ms'
                        : `${90 + index * 24}ms`,
                    }}
                  >
                    <div
                      className={`flex items-center gap-3 ${directionClass}`}
                      style={{
                        animation: prefersReducedMotion
                          ? 'none'
                          : `providerFloat ${5.8 + (index % 5) * 0.42}s ease-in-out infinite`,
                        animationDelay: `${index * 0.22}s`,
                      }}
                    >
                      <div
                        className="relative shrink-0 rounded-full border"
                        style={{
                          height: `${dimension.orb}px`,
                          width: `${dimension.orb}px`,
                          borderColor: tone.ring,
                          background: tone.fill,
                          boxShadow: `0 0 0 7px ${tone.glow}, 0 18px 44px rgba(0,0,0,0.34)`,
                        }}
                      >
                        <div className="absolute inset-[7px] rounded-full border border-white/10" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ProviderIcon provider={provider} />
                        </div>
                      </div>

                      <div className="rounded-full border border-white/8 bg-[linear-gradient(180deg,rgba(18,21,31,0.94),rgba(9,11,17,0.98))] px-4 py-3 shadow-[0_18px_42px_rgba(0,0,0,0.24)] backdrop-blur-sm">
                        <p className="text-[0.95rem] font-medium whitespace-nowrap text-white md:text-[1rem]">
                          {provider.name}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div
            className="relative z-20 mt-3 grid gap-3 md:grid-cols-2 xl:mt-2 xl:grid-cols-4"
            style={{
              opacity: 0.18 + revealProgress * 0.82,
              transform: `translate3d(0, ${24 * (1 - revealProgress)}px, 0)`,
            }}
          >
            {MODEL_STATS.map((item) => {
              const Icon = item.icon

              return (
                <div
                  key={item.key}
                  className="rounded-[24px] border border-white/8 bg-white/[0.035] px-4 py-4 shadow-[0_18px_52px_rgba(0,0,0,0.18)] backdrop-blur-sm md:px-5"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.045] text-white/82">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[1.65rem] leading-none font-semibold tracking-tight text-white md:text-[2rem]">
                        {item.key === 'vendors'
                          ? modelT('stats.vendors.value', { count: vendorCount })
                          : modelT(`stats.${item.key}.value`)}
                      </p>
                      <p className="mt-2 text-sm font-medium text-white/86">
                        {modelT(`stats.${item.key}.label`)}
                      </p>
                      <p className="mt-1 text-xs leading-6 text-white/52 md:text-sm">
                        {modelT(`stats.${item.key}.body`)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <style jsx>{`
          @keyframes providerFloat {
            0%,
            100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-8px);
            }
          }

          @keyframes sparkPulse {
            0%,
            100% {
              transform: scale(1);
              opacity: 0.35;
            }
            50% {
              transform: scale(1.18);
              opacity: 1;
            }
          }

          @keyframes corePulse {
            0%,
            100% {
              box-shadow:
                0 0 0 16px rgba(126, 88, 255, 0.05),
                0 0 140px rgba(126, 88, 255, 0.22);
            }
            50% {
              box-shadow:
                0 0 0 24px rgba(126, 88, 255, 0.08),
                0 0 180px rgba(126, 88, 255, 0.28);
            }
          }
        `}</style>
      </div>
    </section>
  )
}
