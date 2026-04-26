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
type ProviderOrbit = 'inner' | 'middle' | 'outer'

type ModelProvider = {
  name: string
  iconUrl?: string
  fallback: string
  orbit: ProviderOrbit
  angle: number
  speed: number
  lane?: -1 | 0 | 1
  size: ProviderSize
  tone: ProviderTone
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

const MODEL_STAGE_CENTER = {
  x: 744,
  y: 412,
} as const

const MODEL_CORE_POSITION = {
  x: (MODEL_STAGE_CENTER.x / MODEL_STAGE.width) * 100,
  y: (MODEL_STAGE_CENTER.y / MODEL_STAGE.height) * 100,
} as const

const MODEL_ORBIT_RADII: Record<ProviderOrbit, { x: number; y: number }> = {
  inner: { x: 262, y: 96 },
  middle: { x: 398, y: 146 },
  outer: { x: 560, y: 212 },
}

const MODEL_PROVIDERS: ModelProvider[] = [
  {
    name: 'Google',
    iconUrl: buildSimpleIconUrl('google'),
    fallback: 'G',
    orbit: 'outer',
    angle: 228,
    speed: 3.72,
    lane: -1,
    size: 'md',
    tone: 'amber',
  },
  {
    name: 'OpenAI',
    iconUrl: buildSimpleIconUrl('openai'),
    fallback: 'O',
    orbit: 'outer',
    angle: 270,
    speed: 3.98,
    lane: 0,
    size: 'lg',
    tone: 'violet',
    iconFilter:
      'brightness(0) saturate(100%) invert(99%) sepia(6%) saturate(283%) hue-rotate(184deg) brightness(105%) contrast(100%)',
  },
  {
    name: 'Black Forest',
    iconUrl: buildSimpleIconUrl('blackforestlabs'),
    fallback: 'BF',
    orbit: 'outer',
    angle: 322,
    speed: 4.24,
    lane: 1,
    size: 'md',
    tone: 'azure',
    iconScale: 0.86,
    iconFilter:
      'brightness(0) saturate(100%) invert(96%) sepia(5%) saturate(624%) hue-rotate(180deg) brightness(106%) contrast(98%)',
  },
  {
    name: 'OpenRouter',
    iconUrl: buildSimpleIconUrl('openrouter'),
    fallback: 'OR',
    orbit: 'middle',
    angle: 18,
    speed: 5.34,
    lane: 1,
    size: 'md',
    tone: 'violet',
    iconScale: 0.84,
    iconFilter:
      'brightness(0) saturate(100%) invert(98%) sepia(5%) saturate(312%) hue-rotate(181deg) brightness(107%) contrast(102%)',
  },
  {
    name: 'ByteDance',
    iconUrl: buildSimpleIconUrl('bytedance'),
    fallback: 'BD',
    orbit: 'middle',
    angle: 354,
    speed: 5.34,
    lane: 1,
    size: 'md',
    tone: 'azure',
  },
  {
    name: 'Anthropic',
    iconUrl: buildSimpleIconUrl('anthropic'),
    fallback: 'AI',
    orbit: 'outer',
    angle: 34,
    speed: 3.72,
    lane: -1,
    size: 'md',
    tone: 'amber',
    iconFilter:
      'brightness(0) saturate(100%) invert(97%) sepia(4%) saturate(295%) hue-rotate(190deg) brightness(102%) contrast(99%)',
  },
  {
    name: 'Gemini',
    iconUrl: buildSimpleIconUrl('googlegemini'),
    fallback: '✦',
    orbit: 'outer',
    angle: 66,
    speed: 4.24,
    lane: 1,
    size: 'sm',
    tone: 'azure',
  },
  {
    name: 'Alibaba Wan',
    iconUrl: buildSimpleIconUrl('alibabacloud'),
    fallback: 'AW',
    orbit: 'outer',
    angle: 92,
    speed: 3.98,
    lane: 0,
    size: 'sm',
    tone: 'violet',
    iconScale: 0.8,
  },
  {
    name: 'Kling',
    iconUrl: buildSimpleIconUrl('kling'),
    fallback: 'KL',
    orbit: 'outer',
    angle: 132,
    speed: 4.24,
    lane: 1,
    size: 'sm',
    tone: 'teal',
  },
  {
    name: 'Runway',
    iconUrl: buildSimpleIconUrl('runway'),
    fallback: 'RW',
    orbit: 'middle',
    angle: 154,
    speed: 4.86,
    lane: -1,
    size: 'sm',
    tone: 'violet',
  },
  {
    name: 'Luma',
    iconUrl: buildSimpleIconUrl('luma'),
    fallback: 'LU',
    orbit: 'outer',
    angle: 182,
    speed: 4.24,
    lane: 1,
    size: 'sm',
    tone: 'azure',
  },
  {
    name: 'Vidu',
    fallback: 'V',
    orbit: 'outer',
    angle: 206,
    speed: 3.98,
    lane: 0,
    size: 'sm',
    tone: 'azure',
  },
  {
    name: 'MiniMax',
    iconUrl: buildSimpleIconUrl('minimax'),
    fallback: 'MM',
    orbit: 'middle',
    angle: 232,
    speed: 4.86,
    lane: -1,
    size: 'sm',
    tone: 'rose',
  },
  {
    name: 'Groq',
    iconUrl: buildSimpleIconUrl('groq'),
    fallback: 'GQ',
    orbit: 'inner',
    angle: 50,
    speed: 6.1,
    lane: -1,
    size: 'sm',
    tone: 'violet',
    iconFilter:
      'brightness(0) saturate(100%) invert(98%) sepia(6%) saturate(283%) hue-rotate(181deg) brightness(108%) contrast(99%)',
  },
  {
    name: 'xAI',
    iconUrl: buildSimpleIconUrl('xai'),
    fallback: 'xI',
    orbit: 'inner',
    angle: 176,
    speed: 6.36,
    lane: 1,
    size: 'md',
    tone: 'violet',
    iconFilter:
      'brightness(0) saturate(100%) invert(99%) sepia(3%) saturate(237%) hue-rotate(178deg) brightness(108%) contrast(98%)',
  },
  {
    name: 'Qwen',
    iconUrl: buildSimpleIconUrl('qwen'),
    fallback: 'Q',
    orbit: 'middle',
    angle: 78,
    speed: 5.1,
    lane: 0,
    size: 'sm',
    tone: 'violet',
    iconFilter:
      'brightness(0) saturate(100%) invert(99%) sepia(7%) saturate(155%) hue-rotate(194deg) brightness(103%) contrast(99%)',
  },
  {
    name: 'Midjourney',
    iconUrl: buildSimpleIconUrl('midjourney'),
    fallback: 'MJ',
    orbit: 'outer',
    angle: 6,
    speed: 3.98,
    lane: 0,
    size: 'sm',
    tone: 'violet',
    iconScale: 0.9,
    iconFilter:
      'brightness(0) saturate(100%) invert(98%) sepia(5%) saturate(419%) hue-rotate(183deg) brightness(107%) contrast(99%)',
  },
]

const MODEL_NODE_DIMENSIONS = {
  sm: { orb: 76, icon: 22 },
  md: { orb: 92, icon: 28 },
  lg: { orb: 110, icon: 34 },
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
  const [orbitTime, setOrbitTime] = useState(0)

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

  useEffect(() => {
    if (typeof window === 'undefined' || prefersReducedMotion) return undefined

    let frame = 0
    const startedAt = window.performance.now()

    const tick = (now: number) => {
      setOrbitTime((now - startedAt) / 1000)
      frame = window.requestAnimationFrame(tick)
    }

    frame = window.requestAnimationFrame(tick)

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [prefersReducedMotion])

  const revealProgress = prefersReducedMotion ? 1 : motion.reveal
  const drift = prefersReducedMotion ? 0 : motion.drift
  const visibleOrbitTime = prefersReducedMotion ? 0 : orbitTime
  const vendorCount = MODEL_PROVIDERS.length

  return (
    <section
      ref={sectionRef}
      id="models"
      className="relative overflow-hidden bg-[#05070d] px-4 py-18 sm:px-6 lg:px-8 lg:py-24 xl:px-10"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(102,92,255,0.18),transparent_18%),radial-gradient(circle_at_83%_22%,rgba(76,164,255,0.12),transparent_18%),radial-gradient(circle_at_50%_72%,rgba(166,90,255,0.16),transparent_24%),linear-gradient(180deg,#05070d_0%,#04060b_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(136,118,255,0.22),transparent)]" />

      <div className="relative mx-auto w-full max-w-[1680px]">
        <div className="relative px-1 sm:px-2 lg:px-0">
          <div className="pointer-events-none absolute inset-x-[9%] top-[4%] h-[34rem] rounded-full bg-[radial-gradient(circle,rgba(101,78,255,0.12),transparent_62%)] blur-3xl" />
          <div className="pointer-events-none absolute right-[4%] bottom-[8%] h-[18rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(52,110,255,0.08),transparent_68%)] blur-3xl" />

          <div
            className="relative z-20 max-w-[38rem] transition-[opacity,transform] duration-500 ease-out xl:pl-7"
            style={{
              opacity: 0.18 + revealProgress * 0.82,
              transform: `translate3d(${-30 * (1 - revealProgress)}px, ${12 * (1 - revealProgress)}px, 0)`,
            }}
          >
            <h2 className="text-[2.55rem] leading-[0.94] font-semibold tracking-[-0.05em] text-white md:text-[4.3rem]">
              <span className="bg-[linear-gradient(90deg,#ffffff_0%,#e0d4ff_40%,#a586ff_100%)] bg-clip-text whitespace-nowrap text-transparent">
                {modelT('title')}
              </span>
            </h2>
            <p className="mt-6 max-w-[34rem] text-base leading-8 text-white/56 md:text-[1.08rem] md:leading-[2.05rem]">
              {modelT('body')}
            </p>
            <Link
              href="/models"
              className="mt-8 inline-flex h-[3.15rem] items-center justify-center rounded-full border border-white/10 bg-white px-6 text-sm font-semibold text-black transition hover:bg-white/92 md:px-7 md:text-[0.97rem]"
            >
              {modelT('cta')}
            </Link>
          </div>

          <div
            className="relative z-10 mt-10 transition-[opacity,transform] duration-500 ease-out lg:-mt-14"
            style={{
              opacity: 0.24 + revealProgress * 0.76,
              transform: `translate3d(0, ${18 * (1 - revealProgress) - drift * 10}px, 0)`,
            }}
          >
            <div className="relative mx-auto aspect-[1400/820] w-full max-w-[1420px]">
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox={`0 0 ${MODEL_STAGE.width} ${MODEL_STAGE.height}`}
                fill="none"
                aria-hidden="true"
                style={{
                  transform: `scale(${0.96 + revealProgress * 0.04}) rotate(${drift * 1.8}deg)`,
                  opacity: 0.24 + revealProgress * 0.76,
                }}
              >
                <ellipse
                  cx={MODEL_STAGE_CENTER.x}
                  cy={MODEL_STAGE_CENTER.y}
                  rx="650"
                  ry="250"
                  stroke="rgba(98, 111, 180, 0.34)"
                  strokeWidth="1"
                />
                <ellipse
                  cx={MODEL_STAGE_CENTER.x}
                  cy={MODEL_STAGE_CENTER.y}
                  rx="540"
                  ry="198"
                  stroke="rgba(111, 89, 255, 0.28)"
                  strokeWidth="0.96"
                />
                <ellipse
                  cx={MODEL_STAGE_CENTER.x}
                  cy={MODEL_STAGE_CENTER.y}
                  rx="408"
                  ry="146"
                  stroke="rgba(144, 109, 255, 0.22)"
                  strokeWidth="0.92"
                />
                <ellipse
                  cx={MODEL_STAGE_CENTER.x}
                  cy={MODEL_STAGE_CENTER.y}
                  rx="280"
                  ry="102"
                  stroke="rgba(125, 108, 255, 0.18)"
                  strokeWidth="0.86"
                />

                <path
                  d="M220 306C412 226 571 214 700 248C845 285 974 285 1138 232"
                  stroke="rgba(114,92,255,0.16)"
                  strokeWidth="0.9"
                  strokeDasharray="3 11"
                />
                <path
                  d="M244 618C418 572 550 560 700 588C862 619 1006 610 1172 518"
                  stroke="rgba(108,154,255,0.14)"
                  strokeWidth="0.88"
                  strokeDasharray="3 11"
                />
                <path
                  d="M386 168C559 144 824 144 1008 192"
                  stroke="rgba(166,115,255,0.14)"
                  strokeWidth="0.86"
                  strokeDasharray="3 11"
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
                        opacity: 0.18 + revealProgress * 0.82,
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
                className="absolute z-40 h-[42vw] max-h-[334px] w-[42vw] max-w-[334px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#b99aff]/20 bg-[radial-gradient(circle_at_50%_22%,rgba(255,255,255,0.2),rgba(172,118,255,0.84)_34%,rgba(44,18,82,0.96)_68%,rgba(8,9,18,1)_100%)] md:h-[316px] md:w-[316px]"
                style={{
                  left: `${MODEL_CORE_POSITION.x}%`,
                  top: `${MODEL_CORE_POSITION.y}%`,
                  opacity: 0.36 + revealProgress * 0.64,
                  transform: `translate(-50%, -50%) scale(${0.9 + revealProgress * 0.1})`,
                  animation: prefersReducedMotion
                    ? 'none'
                    : 'corePulse 6.2s ease-in-out infinite',
                }}
              >
                <div className="absolute inset-[18px] rounded-full border border-white/9" />
                <div className="absolute inset-[-22px] rounded-full border border-[#7d65ff]/10" />
                <div className="absolute inset-[-56px] rounded-full bg-[radial-gradient(circle,rgba(134,95,255,0.18),transparent_64%)] blur-2xl" />
                <div className="relative flex h-full flex-col items-center justify-center px-8 text-center">
                  <div className="flex h-18 w-18 items-center justify-center rounded-full border border-white/10 bg-white/8 text-white/94 backdrop-blur-sm">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <p className="mt-6 text-[1.24rem] leading-none font-semibold tracking-tight text-white md:text-[1.52rem]">
                    {SITE_NAME}
                  </p>
                  <p className="mt-3 max-w-[13rem] text-sm leading-6 text-white/64 md:text-[0.96rem] md:leading-7">
                    {modelT('centerBody')}
                  </p>
                </div>
              </div>

              {MODEL_PROVIDERS.map((provider, index) => {
                const tone = MODEL_TONE_STYLES[provider.tone]
                const dimension = MODEL_NODE_DIMENSIONS[provider.size]
                const orbitRadii = MODEL_ORBIT_RADII[provider.orbit]
                const laneOffset = provider.lane ?? 0
                const orbitRadiusX = orbitRadii.x + laneOffset * 26
                const orbitRadiusY = orbitRadii.y + laneOffset * 11
                const orbitAngle =
                  ((provider.angle + visibleOrbitTime * provider.speed) * Math.PI) / 180
                const orbitDepth = (Math.sin(orbitAngle) + 1) / 2
                const depthScale = 0.84 + orbitDepth * 0.24
                const nodeOpacity =
                  (0.24 + revealProgress * 0.76) * (0.72 + orbitDepth * 0.28)
                const currentX =
                  MODEL_CORE_POSITION.x +
                  (Math.cos(orbitAngle) * orbitRadiusX * 100) / MODEL_STAGE.width
                const currentY =
                  MODEL_CORE_POSITION.y +
                  (Math.sin(orbitAngle) * orbitRadiusY * 100) / MODEL_STAGE.height
                const deltaX = currentX - MODEL_CORE_POSITION.x
                const deltaY = currentY - MODEL_CORE_POSITION.y
                const entryOffsetX = deltaX * 0.12
                const entryOffsetY = 18 + deltaY * 0.08
                const labelWidth =
                  provider.size === 'lg'
                    ? '4.6rem'
                    : provider.size === 'md'
                      ? '4.2rem'
                      : '3.85rem'
                const nameSize =
                  provider.size === 'lg'
                    ? '0.66rem'
                    : provider.size === 'md'
                      ? '0.61rem'
                      : '0.56rem'
                const contentGap =
                  provider.size === 'lg'
                    ? '0.38rem'
                    : provider.size === 'md'
                      ? '0.3rem'
                      : '0.22rem'
                const orbPaddingTop =
                  provider.size === 'lg'
                    ? '1rem'
                    : provider.size === 'md'
                      ? '0.84rem'
                      : '0.72rem'

                return (
                  <div
                    key={provider.name}
                    className="absolute transition-[opacity,transform] duration-500 ease-out"
                    style={{
                      left: `${currentX}%`,
                      top: `${currentY}%`,
                      zIndex: 12 + Math.round(orbitDepth * 18),
                      opacity: nodeOpacity,
                      transform: `translate(-50%, -50%) translate(${entryOffsetX * (1 - revealProgress)}px, ${
                        entryOffsetY * (1 - revealProgress)
                      }px) scale(${(0.74 + revealProgress * 0.26) * depthScale})`,
                      transitionDelay: prefersReducedMotion
                        ? '0ms'
                        : `${90 + index * 24}ms`,
                    }}
                  >
                    <div className="flex items-center justify-center">
                      <div
                        className="relative shrink-0 rounded-full border"
                        style={{
                          height: `${dimension.orb}px`,
                          width: `${dimension.orb}px`,
                          borderColor: tone.ring,
                          background: tone.fill,
                          boxShadow: `0 0 0 5px ${tone.glow}, 0 14px 34px rgba(0,0,0,0.28)`,
                        }}
                      >
                        <div className="absolute inset-[7px] rounded-full border border-white/9" />
                        <div
                          className="flex h-full flex-col items-center text-center"
                          style={{ gap: contentGap, paddingTop: orbPaddingTop }}
                        >
                          <ProviderIcon provider={provider} />
                          <div style={{ width: labelWidth }}>
                            <p
                              className="line-clamp-2 leading-tight font-medium text-white/88"
                              style={{ fontSize: nameSize }}
                            >
                              {provider.name}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div
            className="relative z-20 mt-2 xl:mt-0"
            style={{
              opacity: 0.18 + revealProgress * 0.82,
              transform: `translate3d(0, ${24 * (1 - revealProgress)}px, 0)`,
            }}
          >
            <div className="mx-auto flex w-full max-w-[1160px] flex-col gap-5 border-t border-white/8 pt-8 md:flex-row md:flex-wrap md:items-start md:justify-between md:gap-6 xl:flex-nowrap">
              {MODEL_STATS.map((item, index) => {
                const Icon = item.icon

                return (
                  <div
                    key={item.key}
                    className="relative flex min-w-0 flex-1 items-start gap-4 md:max-w-[calc(50%-0.75rem)] xl:max-w-none"
                  >
                    {index > 0 ? (
                      <div className="absolute -left-3 hidden h-14 w-px bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.12),transparent)] xl:block" />
                    ) : null}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/82">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[1.65rem] leading-none font-semibold tracking-tight text-white md:text-[1.95rem]">
                        {item.key === 'vendors'
                          ? modelT('stats.vendors.value', { count: vendorCount })
                          : modelT(`stats.${item.key}.value`)}
                      </p>
                      <p className="mt-2 text-sm font-medium text-white/88">
                        {modelT(`stats.${item.key}.label`)}
                      </p>
                      <p className="mt-1 max-w-[15rem] text-xs leading-6 text-white/46 md:text-sm">
                        {modelT(`stats.${item.key}.body`)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <style jsx>{`
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
