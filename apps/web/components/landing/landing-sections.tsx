/**
 * [INPUT]: 依赖 react 的 useEffect/useRef/useState，依赖 next/image 的远程图片渲染，
 *          依赖 next-intl 的 useTranslations，依赖 lucide-react 的图标集合，
 *          依赖 @/components/shared/brand-mark，依赖 @/i18n/navigation 的 Link
 * [OUTPUT]: 对外提供 ModelMindMapSection、FeaturesSection、PricingSection、TestimonialsSection、FaqSection
 * [POS]: components/landing 的首页内容区集合，被 (landing)/page.tsx 按首屏后叙事顺序消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import {
  AudioLines,
  BadgeDollarSign,
  BrainCircuit,
  ChevronDown,
  Coins,
  Cuboid,
  Eye,
  ImageIcon,
  Play,
  ShieldCheck,
  Sparkles,
  Video,
  Workflow,
  Zap,
} from 'lucide-react'
import { useTranslations } from 'next-intl'

import {
  BILLING_CREDIT_PACK_SNAPSHOTS,
  BILLING_PLAN_SNAPSHOTS,
} from '@/lib/billing/plans'
import { Link } from '@/i18n/navigation'

type ModelProvider = {
  name: string
  logoUrl: string
  x: number
  y: number
  size: 'sm' | 'md' | 'lg'
  tone: 'azure' | 'violet' | 'teal' | 'amber' | 'rose'
  logoScale?: number
  logoFilter?: string
}

type ModelMotionState = {
  progress: number
  reveal: number
  drift: number
}

function buildSimpleIconUrl(slug: string) {
  return `https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/${slug}.svg`
}

function buildVendorFaviconUrl(domain: string) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
}

const MODEL_PROVIDERS: ModelProvider[] = [
  {
    name: 'OpenAI',
    logoUrl: buildSimpleIconUrl('openai'),
    x: 486,
    y: 94,
    size: 'lg',
    tone: 'azure',
    logoFilter:
      'brightness(0) saturate(100%) invert(98%) sepia(6%) saturate(396%) hue-rotate(182deg) brightness(106%) contrast(100%)',
  },
  {
    name: 'Google',
    logoUrl: buildSimpleIconUrl('google'),
    x: 668,
    y: 160,
    size: 'lg',
    tone: 'amber',
  },
  {
    name: 'Anthropic',
    logoUrl: buildSimpleIconUrl('anthropic'),
    x: 774,
    y: 244,
    size: 'lg',
    tone: 'violet',
    logoFilter:
      'brightness(0) saturate(100%) invert(97%) sepia(18%) saturate(329%) hue-rotate(188deg) brightness(102%) contrast(101%)',
  },
  {
    name: 'Gemini',
    logoUrl: buildSimpleIconUrl('googlegemini'),
    x: 846,
    y: 392,
    size: 'md',
    tone: 'violet',
  },
  {
    name: 'Alibaba Wan',
    logoUrl: buildSimpleIconUrl('alibabacloud'),
    x: 838,
    y: 538,
    size: 'md',
    tone: 'amber',
    logoScale: 0.68,
  },
  {
    name: 'Midjourney',
    logoUrl: buildVendorFaviconUrl('midjourney.com'),
    x: 728,
    y: 628,
    size: 'md',
    tone: 'amber',
  },
  {
    name: 'OpenRouter',
    logoUrl: buildSimpleIconUrl('openrouter'),
    x: 542,
    y: 718,
    size: 'md',
    tone: 'violet',
    logoScale: 0.7,
    logoFilter:
      'brightness(0) saturate(100%) invert(99%) sepia(3%) saturate(437%) hue-rotate(183deg) brightness(112%) contrast(100%)',
  },
  {
    name: 'Runway',
    logoUrl: buildVendorFaviconUrl('runwayml.com'),
    x: 168,
    y: 556,
    size: 'md',
    tone: 'azure',
  },
  {
    name: 'Luma',
    logoUrl: buildVendorFaviconUrl('luma.ai'),
    x: 82,
    y: 468,
    size: 'lg',
    tone: 'teal',
  },
  {
    name: 'Vidu',
    logoUrl: buildVendorFaviconUrl('vidu.com'),
    x: 136,
    y: 316,
    size: 'md',
    tone: 'azure',
  },
  {
    name: 'Groq',
    logoUrl: buildVendorFaviconUrl('groq.com'),
    x: 246,
    y: 204,
    size: 'md',
    tone: 'azure',
  },
  {
    name: 'xAI',
    logoUrl: buildVendorFaviconUrl('x.ai'),
    x: 348,
    y: 150,
    size: 'lg',
    tone: 'teal',
  },
  {
    name: 'ByteDance',
    logoUrl: buildSimpleIconUrl('bytedance'),
    x: 684,
    y: 458,
    size: 'md',
    tone: 'violet',
  },
  {
    name: 'Kling',
    logoUrl: buildVendorFaviconUrl('klingai.com'),
    x: 628,
    y: 612,
    size: 'md',
    tone: 'teal',
  },
  {
    name: 'Qwen',
    logoUrl: buildVendorFaviconUrl('chat.qwen.ai'),
    x: 448,
    y: 626,
    size: 'sm',
    tone: 'violet',
  },
  {
    name: 'Black Forest',
    logoUrl: buildVendorFaviconUrl('blackforestlabs.ai'),
    x: 284,
    y: 674,
    size: 'sm',
    tone: 'teal',
  },
  {
    name: 'MiniMax',
    logoUrl: buildSimpleIconUrl('minimax'),
    x: 274,
    y: 444,
    size: 'md',
    tone: 'rose',
  },
  {
    name: 'DeepSeek',
    logoUrl: buildVendorFaviconUrl('deepseek.com'),
    x: 238,
    y: 522,
    size: 'sm',
    tone: 'azure',
  },
]

const MODEL_CANVAS = {
  width: 980,
  height: 790,
  centerX: 490,
  centerY: 398,
} as const

const MODEL_RING_RADII = [146, 234, 324] as const
const MODEL_NODE_SIZES = {
  sm: 84,
  md: 96,
  lg: 110,
} as const
const MODEL_SPARKS = [
  { x: 388, y: 248, tone: 'azure' },
  { x: 672, y: 248, tone: 'rose' },
  { x: 732, y: 332, tone: 'violet' },
  { x: 492, y: 638, tone: 'violet' },
  { x: 316, y: 584, tone: 'azure' },
  { x: 202, y: 362, tone: 'azure' },
  { x: 690, y: 638, tone: 'rose' },
] as const

const MODEL_TONE_STYLES = {
  azure: {
    ring: 'rgba(95, 173, 255, 0.72)',
    glow: 'rgba(95, 173, 255, 0.18)',
    text: '#eef7ff',
    fill: 'radial-gradient(circle at 30% 26%, rgba(80,158,255,0.22), rgba(8,11,18,0.94) 72%)',
  },
  teal: {
    ring: 'rgba(84, 214, 188, 0.68)',
    glow: 'rgba(84, 214, 188, 0.16)',
    text: '#ebfffa',
    fill: 'radial-gradient(circle at 30% 26%, rgba(84,214,188,0.18), rgba(6,12,18,0.94) 72%)',
  },
  amber: {
    ring: 'rgba(255, 162, 75, 0.66)',
    glow: 'rgba(255, 162, 75, 0.16)',
    text: '#fff3e6',
    fill: 'radial-gradient(circle at 30% 26%, rgba(255,162,75,0.18), rgba(19,13,10,0.95) 72%)',
  },
  violet: {
    ring: 'rgba(166, 103, 255, 0.72)',
    glow: 'rgba(166, 103, 255, 0.18)',
    text: '#f3eaff',
    fill: 'radial-gradient(circle at 30% 26%, rgba(166,103,255,0.2), rgba(13,10,22,0.95) 72%)',
  },
  rose: {
    ring: 'rgba(255, 96, 179, 0.68)',
    glow: 'rgba(255, 96, 179, 0.16)',
    text: '#ffeaf4',
    fill: 'radial-gradient(circle at 30% 26%, rgba(255,96,179,0.2), rgba(20,8,17,0.95) 72%)',
  },
} as const

const MODEL_SUMMARY_KEYS = [
  'image',
  'video',
  'threed',
  'text',
  'audio',
  'vision',
] as const
const INITIAL_MODEL_MOTION: ModelMotionState = { progress: 0, reveal: 0, drift: -1 }

const FEATURE_KEYS = ['canvas', 'models', 'outputs'] as const
const FEATURE_VISUALS = {
  canvas: {
    icon: Workflow,
    imageSrc: '/landing/hero/feature-workflow-overview.png',
    accent:
      'from-[#8ea3ff]/34 via-[#4f46e5]/18 to-transparent',
  },
  models: {
    icon: Sparkles,
    imageSrc: '/landing/hero/feature-any-model-image.png',
    accent:
      'from-[#7be6ff]/34 via-[#14b8a6]/18 to-transparent',
  },
  outputs: {
    icon: Zap,
    imageSrc: '/landing/hero/feature-video-everything.png',
    accent:
      'from-[#ffd36b]/32 via-[#f97316]/16 to-transparent',
  },
} as const

const LANDING_BILLING_PLANS = ['standard', 'pro', 'ultimate'] as const
const LANDING_CREDIT_PACKS = ['500', '1200', '3500', '8000'] as const
const LANDING_PLAN_PRICE_AMOUNTS = {
  monthly: {
    standard: 20,
    pro: 50,
    ultimate: 150,
  },
  oneTime: {
    standard: 24,
    pro: 59,
    ultimate: 179,
  },
} as const
const LANDING_CREDIT_PACK_PRICE_AMOUNTS = {
  '500': 5,
  '1200': 10,
  '3500': 25,
  '8000': 50,
} as const
const LANDING_PRICING_MODES = [
  {
    key: 'monthly',
    icon: BadgeDollarSign,
    titleKey: 'toggleMonthly',
    panelTitleKey: 'toggleMonthly',
    className:
      'border-[#6b5cff]/40 bg-[linear-gradient(180deg,rgba(19,18,29,0.98),rgba(13,13,21,0.98))] shadow-[0_24px_72px_rgba(88,76,214,0.16)]',
    badgeClassName:
      'border-[#6b5cff]/28 bg-[#6b5cff]/12 text-[#d0c9ff]',
    chipClassName:
      'border-[#6b5cff]/22 bg-[#6b5cff]/10 text-[#ddd7ff]',
  },
  {
    key: 'oneTime',
    icon: ShieldCheck,
    titleKey: 'toggleOneTime',
    panelTitleKey: 'toggleOneTime',
    className:
      'border-white/10 bg-[linear-gradient(180deg,rgba(23,23,28,0.98),rgba(16,16,20,0.98))] shadow-[0_18px_54px_rgba(0,0,0,0.18)]',
    badgeClassName:
      'border-white/10 bg-white/6 text-white/78',
    chipClassName:
      'border-white/10 bg-white/6 text-white/82',
  },
  {
    key: 'credits',
    icon: Coins,
    titleKey: 'toggleCredits',
    panelTitleKey: 'toggleCredits',
    className:
      'border-[#7f7256]/20 bg-[linear-gradient(180deg,rgba(28,28,26,0.98),rgba(20,20,19,0.98))] shadow-[0_18px_54px_rgba(0,0,0,0.18)]',
    badgeClassName:
      'border-[#8c7a54]/18 bg-[#8c7a54]/10 text-[#ece0c5]',
    chipClassName:
      'border-[#8c7a54]/14 bg-[#8c7a54]/8 text-[#f0e3c8]',
  },
] as const

const TESTIMONIAL_ITEMS = [
  'pixel',
  'lena',
  'prompt',
  'frame',
  'neo',
  'moodboard',
  'indie',
  'workflow',
  'cyber',
  'canvas',
  'vfx',
  'dream',
] as const
const TESTIMONIAL_AVATARS: Record<(typeof TESTIMONIAL_ITEMS)[number], string> = {
  pixel: 'https://randomuser.me/api/portraits/women/68.jpg',
  lena: 'https://randomuser.me/api/portraits/women/44.jpg',
  prompt: 'https://randomuser.me/api/portraits/men/32.jpg',
  frame: 'https://randomuser.me/api/portraits/men/52.jpg',
  neo: 'https://randomuser.me/api/portraits/women/33.jpg',
  moodboard: 'https://randomuser.me/api/portraits/women/63.jpg',
  indie: 'https://randomuser.me/api/portraits/men/75.jpg',
  workflow: 'https://randomuser.me/api/portraits/men/22.jpg',
  cyber: 'https://randomuser.me/api/portraits/women/90.jpg',
  canvas: 'https://randomuser.me/api/portraits/women/17.jpg',
  vfx: 'https://randomuser.me/api/portraits/men/41.jpg',
  dream: 'https://randomuser.me/api/portraits/women/12.jpg',
}
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

function formatLandingUsd(amount: number) {
  return `US$${amount}`
}

function SectionHeader({
  eyebrow,
  title,
  body,
  size = 'default',
}: {
  eyebrow: string
  title: string
  body: string
  size?: 'default' | 'featured'
}) {
  const isFeatured = size === 'featured'

  return (
    <div
      className={`grid w-full text-left lg:items-end ${
        isFeatured
          ? 'gap-8 lg:grid-cols-[0.96fr_1.04fr]'
          : 'gap-6 lg:grid-cols-[0.92fr_1.08fr]'
      }`}
    >
      <div>
        {eyebrow ? (
          <p className="text-sm font-medium tracking-[0.24em] text-white/45 uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h2
          className={`${eyebrow ? 'mt-4' : ''} font-semibold text-white ${
            isFeatured
              ? 'max-w-[13ch] text-[2.75rem] leading-[0.95] tracking-tight md:text-[4.6rem] lg:text-[5.3rem]'
              : 'text-3xl md:text-5xl'
          }`}
        >
          {title}
        </h2>
      </div>
      <p
        className={`text-white/62 ${
          isFeatured
            ? 'max-w-[44rem] text-lg leading-8 md:text-[1.3rem] md:leading-9 lg:pb-2'
            : 'text-base leading-7 md:text-lg lg:pb-1'
        }`}
      >
        {body}
      </p>
    </div>
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
        (rect.bottom - viewportHeight * 0.12) / (viewportHeight * 0.54),
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
      className="relative overflow-hidden bg-[#06080f] px-4 py-18 sm:px-6 lg:min-h-[calc(100vh-64px)] lg:px-8 lg:py-20 xl:px-10"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_76%,rgba(44,146,164,0.16),transparent_24%),radial-gradient(circle_at_57%_48%,rgba(112,84,255,0.2),transparent_24%),radial-gradient(circle_at_81%_53%,rgba(190,58,255,0.14),transparent_18%),linear-gradient(180deg,#090b13_0%,#05070e_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(102,137,255,0.4),transparent)]" />
      <div className="relative mx-auto w-full max-w-[1440px]">
        <div className="grid gap-8 xl:relative xl:block xl:min-h-[820px]">
          <div
            className="max-w-[33rem] pt-3 transition-[opacity,transform] duration-300 ease-out xl:absolute xl:top-[132px] xl:left-0 xl:z-20 xl:w-[600px] xl:max-w-none xl:pt-0"
            style={{
              opacity: 0.24 + revealProgress * 0.76,
              transform: `translate3d(${-42 * (1 - revealProgress)}px, ${
                18 * (1 - revealProgress) - drift * 14
              }px, 0)`,
            }}
          >
            <p className="text-[0.95rem] font-medium tracking-[0.22em] text-[#8b9bb6] uppercase">
              {modelT('eyebrow')}
            </p>
            <h2 className="mt-7 w-max max-w-none text-[3.05rem] leading-[0.9] font-semibold tracking-[-0.1em] text-white md:text-[3.55rem] xl:text-[3.32rem] 2xl:text-[3.55rem]">
              <span className="block whitespace-nowrap">{modelT('title')}</span>
              <span className="mt-2 block origin-left bg-[linear-gradient(90deg,#78b8ff_0%,#6e8cff_36%,#b35cff_100%)] bg-clip-text whitespace-nowrap text-transparent xl:scale-x-[0.82] 2xl:scale-x-[0.86]">
                {modelT('highlight')}
              </span>
            </h2>
            <p className="mt-8 max-w-[31rem] text-[1.04rem] leading-[1.88] text-[#9aa7bc] md:text-[1.16rem] xl:max-w-[40rem]">
              {modelT('body')}
            </p>
            <Link
              href="/contact"
              className="mt-10 inline-flex items-center gap-3 rounded-full border border-[#2a3555] bg-[linear-gradient(180deg,rgba(18,24,44,0.98),rgba(11,16,28,0.96))] px-7 py-4 text-[1rem] font-semibold text-white shadow-[0_18px_50px_rgba(3,8,18,0.34)] transition-transform duration-200 hover:-translate-y-0.5"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#5f69ff]/18 text-[#7b83ff]">
                <Play className="ml-0.5 h-3 w-3 fill-current" />
              </span>
              <span>{modelT('cta')}</span>
            </Link>
            <div className="mt-30 inline-flex max-w-[24rem] items-center gap-3 rounded-[14px] border border-[#14383a] bg-[linear-gradient(135deg,rgba(8,29,29,0.92),rgba(8,13,22,0.96))] px-5 py-3.5 text-sm leading-7 text-[#d3e4de] shadow-[0_18px_60px_rgba(0,0,0,0.22)] md:text-[0.93rem]">
              <span className="text-lg text-[#ffd15f]">⚡</span>
              <span>{modelT('banner')}</span>
            </div>
          </div>

          <div
            className="relative min-h-[34rem] transition-[opacity,transform] duration-300 ease-out md:min-h-[46rem] xl:absolute xl:top-[62px] xl:right-[252px] xl:left-[520px] xl:z-10 xl:min-h-0"
            style={{
              opacity: 0.32 + revealProgress * 0.68,
              transform: `translate3d(0, ${28 * (1 - revealProgress) - drift * 18}px, 0)`,
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_46%,rgba(112,88,255,0.18),transparent_18%),radial-gradient(circle_at_58%_48%,rgba(190,61,255,0.14),transparent_28%),radial-gradient(circle_at_24%_58%,rgba(48,162,255,0.08),transparent_18%)]" />
            <div className="relative flex min-h-[34rem] items-center justify-center md:min-h-[42rem] xl:min-h-[760px] xl:pr-0">
              <div className="relative h-[790px] w-[980px] origin-center scale-[0.44] sm:scale-[0.54] lg:scale-[0.68] xl:translate-x-0 xl:scale-[0.75] 2xl:translate-x-2 2xl:scale-[0.83]">
                <div
                  className="relative h-full w-full transition-[transform,opacity] duration-300 ease-out"
                  style={{
                    opacity: 0.34 + revealProgress * 0.66,
                    transform: `translate3d(0, ${10 * (1 - revealProgress) - drift * 12}px, 0) scale(${
                      0.9 + revealProgress * 0.1
                    }) rotate(${drift * 1.8}deg)`,
                  }}
                >
                  <svg
                    className="absolute inset-0 h-full w-full overflow-visible"
                    viewBox={`0 0 ${MODEL_CANVAS.width} ${MODEL_CANVAS.height}`}
                    fill="none"
                    aria-hidden="true"
                  >
                    {MODEL_RING_RADII.map((radius, index) => (
                      <circle
                        key={radius}
                        cx={MODEL_CANVAS.centerX}
                        cy={MODEL_CANVAS.centerY}
                        r={radius}
                        stroke={
                          index === 0
                            ? 'rgba(112,141,255,0.18)'
                            : 'rgba(118,132,188,0.12)'
                        }
                        strokeWidth={index === 0 ? 1.4 : 1}
                      />
                    ))}

                    {MODEL_SPARKS.map((spark, index) => (
                      <circle
                        key={`${spark.x}-${spark.y}-${index}`}
                        cx={spark.x}
                        cy={spark.y}
                        r={spark.tone === 'rose' ? 8 : 7}
                        fill={MODEL_TONE_STYLES[spark.tone].ring}
                        style={{
                          opacity: 0.28 + revealProgress * 0.72,
                        }}
                      />
                    ))}

                    {MODEL_PROVIDERS.map((provider, index) => {
                      const tone = MODEL_TONE_STYLES[provider.tone]
                      const deltaX = provider.x - MODEL_CANVAS.centerX
                      const deltaY = provider.y - MODEL_CANVAS.centerY
                      const c1x =
                        MODEL_CANVAS.centerX + deltaX * 0.24 + (deltaY > 0 ? 18 : -18)
                      const c1y = MODEL_CANVAS.centerY + deltaY * 0.1
                      const c2x =
                        MODEL_CANVAS.centerX + deltaX * 0.76 - (deltaY > 0 ? 10 : -10)
                      const c2y = MODEL_CANVAS.centerY + deltaY * 0.88

                      return (
                        <g key={provider.name}>
                          <path
                            d={`M${MODEL_CANVAS.centerX} ${MODEL_CANVAS.centerY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${provider.x} ${provider.y}`}
                            stroke={tone.ring}
                            strokeWidth={provider.size === 'lg' ? 1.7 : 1.4}
                            strokeLinecap="round"
                            strokeDasharray="4 11"
                            className="transition-opacity duration-700 ease-out"
                            style={{
                              opacity: 0.16 + revealProgress * 0.72,
                              animation: `dashFlow ${4.8 + (index % 4) * 0.45}s linear infinite`,
                              animationDelay: `${index * 0.12}s`,
                            }}
                          />
                          <circle
                            cx={provider.x}
                            cy={provider.y}
                            r="5.5"
                            fill={tone.ring}
                            style={{
                              opacity: 0.26 + revealProgress * 0.74,
                              transition: prefersReducedMotion
                                ? 'opacity 0ms linear'
                                : 'opacity 280ms ease',
                            }}
                          />
                        </g>
                      )
                    })}
                  </svg>

                  <div
                    className="absolute top-1/2 left-1/2 z-20 h-[336px] w-[336px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#6f59ff]/32 bg-[radial-gradient(circle_at_50%_36%,rgba(101,124,255,0.28),rgba(85,40,172,0.84)_58%,rgba(15,12,33,0.97)_100%)] shadow-[0_0_0_24px_rgba(121,90,255,0.05),0_0_120px_rgba(118,74,255,0.2)]"
                    style={{
                      opacity: 0.42 + revealProgress * 0.58,
                      animation: prefersReducedMotion
                        ? 'none'
                        : 'corePulse 6s ease-in-out infinite',
                      boxShadow: `0 0 0 ${12 + revealProgress * 12}px rgba(118,95,255,${
                        0.03 + revealProgress * 0.03
                      }), 0 0 ${56 + revealProgress * 58}px rgba(125,77,255,${
                        0.12 + revealProgress * 0.1
                      })`,
                    }}
                  >
                    <div className="absolute inset-[20px] rounded-full border border-white/10" />
                    <div className="absolute inset-[-16px] rounded-full border border-[#5b72ff]/12" />
                    <div className="relative flex h-full flex-col items-center justify-center px-10 text-center">
                      <BrainCircuit className="h-[4.4rem] w-[4.4rem] text-[#76a1ff]" />
                      <p className="mt-5 text-[2.35rem] font-semibold tracking-tight text-white">
                        {modelT('centerTitle')}
                      </p>
                      <p className="mt-3 max-w-[12rem] text-[0.96rem] leading-7 text-[#cfd6f4]">
                        {modelT('centerBody')}
                      </p>
                    </div>
                  </div>

                  {MODEL_PROVIDERS.map((provider, index) => {
                    const tone = MODEL_TONE_STYLES[provider.tone]
                    const nodeSize = MODEL_NODE_SIZES[provider.size]
                    const deltaX = provider.x - MODEL_CANVAS.centerX
                    const deltaY = provider.y - MODEL_CANVAS.centerY

                    return (
                      <div
                        key={provider.name}
                        className="absolute z-30 transition-all ease-out"
                        style={{
                          left: `${provider.x}px`,
                          top: `${provider.y}px`,
                          width: `${nodeSize + 36}px`,
                          transform: `translate(-50%, -50%) translate(${
                            deltaX / 36 + drift * (provider.size === 'lg' ? 5 : 3)
                          }px, ${
                            deltaY / 38 -
                            drift * (provider.size === 'lg' ? 4 : 2) +
                            8 * (1 - revealProgress)
                          }px) scale(${0.72 + revealProgress * 0.28})`,
                          opacity: 0.18 + revealProgress * 0.82,
                          transitionDuration: prefersReducedMotion
                            ? '0ms'
                            : `${320 + (provider.size === 'lg' ? 120 : 80)}ms`,
                          transitionDelay: prefersReducedMotion
                            ? '0ms'
                            : `${80 + index * 18}ms`,
                        }}
                      >
                        <div
                          className="flex flex-col items-center text-center"
                          style={{
                            animation: prefersReducedMotion
                              ? 'none'
                              : `providerBob ${5.4 + (index % 5) * 0.42}s ease-in-out infinite`,
                          }}
                        >
                          <div
                            className="relative flex items-center justify-center rounded-full border bg-[#070b12]/92 shadow-[0_24px_64px_rgba(0,0,0,0.34)]"
                            style={{
                              height: `${nodeSize}px`,
                              width: `${nodeSize}px`,
                              borderColor: tone.ring,
                              boxShadow: `0 0 0 ${7 + revealProgress * 5}px ${tone.glow}, 0 ${
                                18 + revealProgress * 12
                              }px ${40 + revealProgress * 26}px rgba(0,0,0,0.36)`,
                              background: tone.fill,
                            }}
                          >
                            <div className="absolute inset-[7px] rounded-full border border-white/6" />
                            <div
                              className="relative flex items-center justify-center rounded-full bg-white/5 p-2"
                              style={{
                                height: `${Math.round(nodeSize * 0.44)}px`,
                                width: `${Math.round(nodeSize * 0.44)}px`,
                              }}
                            >
                              <Image
                                src={provider.logoUrl}
                                alt={`${provider.name} logo`}
                                width={40}
                                height={40}
                                unoptimized
                                className="h-full w-full object-contain"
                                referrerPolicy="no-referrer"
                                style={{
                                  transform: `scale(${provider.logoScale ?? 1})`,
                                  filter: provider.logoFilter,
                                }}
                              />
                            </div>
                          </div>
                          <p className="mt-3 max-w-[8.4rem] text-[0.98rem] leading-tight font-semibold text-white">
                            {provider.name}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <aside
            className="w-[312px] justify-self-end rounded-[22px] border border-white/7 bg-[linear-gradient(180deg,rgba(13,17,25,0.96),rgba(9,12,20,0.98))] p-6 shadow-[0_22px_100px_rgba(0,0,0,0.28)] transition-[opacity,transform] duration-300 ease-out md:p-6 xl:absolute xl:top-[52px] xl:right-0 xl:z-20 xl:w-[262px] xl:px-5"
            style={{
              opacity: 0.22 + revealProgress * 0.78,
              transform: `translate3d(${34 * (1 - revealProgress)}px, ${
                10 * (1 - revealProgress) + drift * 10
              }px, 0)`,
            }}
          >
            <p className="text-[1.62rem] font-semibold tracking-tight text-white">
              {modelT('summaryTitle')}
            </p>
            <div className="mt-5 space-y-3">
              {MODEL_SUMMARY_KEYS.map((key) => {
                const Icon =
                  key === 'image'
                    ? ImageIcon
                    : key === 'video'
                      ? Video
                      : key === 'threed'
                        ? Cuboid
                        : key === 'text'
                          ? Sparkles
                          : key === 'audio'
                            ? AudioLines
                            : Eye

                return (
                  <div
                    key={key}
                    className="flex items-start gap-3 rounded-[18px] border border-white/6 bg-white/[0.025] px-4 py-3"
                  >
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] border border-[#1f3555] bg-[#091321] text-[#4ad7ff]">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-[0.98rem] font-semibold text-white">
                        {modelT(`capabilities.${key}.title`)}
                      </p>
                      <p className="mt-1 text-[0.9rem] leading-6 text-[#9db0c6]">
                        {modelT(`capabilities.${key}.body`)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 border-t border-white/8 pt-6">
              <p className="text-sm tracking-[0.2em] text-[#89a0b8] uppercase">
                {modelT('summaryCountLabel')}
              </p>
              <div className="mt-3 flex items-end gap-3">
                <span className="bg-[linear-gradient(180deg,#ffffff_0%,#9d6fff_100%)] bg-clip-text text-[3.4rem] leading-none font-semibold text-transparent">
                  {modelT('summaryCountValue', { count: vendorCount })}
                </span>
                <span className="pb-2 text-sm text-[#8fb3d2]">
                  {modelT('summaryStatus')}
                </span>
              </div>
            </div>
          </aside>
        </div>

        <style jsx>{`
          @keyframes providerBob {
            0%,
            100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-8px);
            }
          }

          @keyframes dashFlow {
            to {
              stroke-dashoffset: -96;
            }
          }

          @keyframes corePulse {
            0%,
            100% {
              transform: translate(-50%, -50%) scale(1);
            }
            50% {
              transform: translate(-50%, -50%) scale(1.03);
            }
          }
        `}</style>
      </div>
    </section>
  )
}

export function FeaturesSection() {
  const featuresT = useTranslations('landing.sections.features')
  const featureItems = FEATURE_KEYS.map((key, index) => ({
    key,
    index,
    title: featuresT(`items.${key}.title`),
    body: featuresT(`items.${key}.body`),
    imageSrc: FEATURE_VISUALS[key].imageSrc,
    icon: FEATURE_VISUALS[key].icon,
    accent: FEATURE_VISUALS[key].accent,
  }))
  const [activeFeature, setActiveFeature] = useState<(typeof FEATURE_KEYS)[number]>('canvas')
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
      <div className="mx-auto w-full max-w-[1280px]">
        <div
          className="hidden items-start gap-14 xl:grid xl:grid-cols-[0.42fr_0.58fr]"
          onWheel={handleFeatureWheel}
        >
          <div className="sticky top-28 self-start py-8">
            <div className="max-w-[29rem]">
              <p className="text-xs font-medium tracking-[0.24em] text-white/34 uppercase">
                {featuresT('title')}
              </p>
              <p className="mt-5 text-base leading-8 text-white/54">
                {featuresT('body')}
              </p>
            </div>

            <div className="mt-16 space-y-6">
              {featureItems.map((item) => {
                const isActive = item.key === activeFeature

                return (
                  <button
                    key={`feature-nav-${item.key}`}
                    type="button"
                    onClick={() => activateFeature(item.index)}
                    className={`block text-left transition-all duration-300 ${
                      isActive
                        ? 'text-white'
                        : 'text-white/18 hover:text-white/38'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span
                        className={`mt-3 h-14 w-px transition-colors duration-300 ${
                          isActive ? 'bg-white/80' : 'bg-transparent'
                        }`}
                      />
                      <span
                        className={`block max-w-[8.4ch] font-semibold tracking-tight transition-all duration-300 ${
                          isActive
                            ? 'text-[4.25rem] leading-[0.9]'
                            : 'text-[3.2rem] leading-[0.94]'
                        }`}
                      >
                        {item.title}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-14 max-w-[24rem]">
              <p className="text-sm leading-7 text-white/42">
                点击左侧标题，或在这个板块内滚动鼠标滑轮，逐个切换右侧对应的图片与文案。
              </p>
              <div className="mt-6 flex gap-2">
                {featureItems.map((item) => (
                  <button
                    key={`feature-dot-${item.key}`}
                    type="button"
                    onClick={() => activateFeature(item.index)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      item.key === activeFeature ? 'w-10 bg-white' : 'w-2.5 bg-white/18 hover:bg-white/34'
                    }`}
                    aria-label={item.title}
                  />
                ))}
              </div>
              <Link
                href="/features"
                className="mt-8 inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white px-6 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                {featuresT('exploreCta')}
              </Link>
            </div>
          </div>

          <div className="sticky top-24 self-start">
            <article
              key={`feature-panel-${activeFeatureItem.key}`}
              className="overflow-hidden rounded-[38px] border border-white/10 bg-[linear-gradient(180deg,rgba(16,17,24,0.98),rgba(10,10,14,0.98))] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.28)]"
            >
              <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#0b0c12]">
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
                  width={1280}
                  height={980}
                  className="h-[520px] w-full object-cover object-center brightness-[1.08] contrast-[1.03] saturate-[1.06]"
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
                    <h3 className="mt-2 text-[2rem] leading-[1.02] font-semibold tracking-tight text-white">
                      {activeFeatureItem.title}
                    </h3>
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
          <SectionHeader eyebrow="" title={featuresT('title')} body={featuresT('body')} />

          {featureItems.map((item) => {
            const Icon = item.icon
            return (
              <article
                key={`feature-mobile-${item.key}`}
                className="overflow-hidden rounded-[28px] border border-white/8 bg-white/[0.035] p-5 shadow-[0_18px_54px_rgba(0,0,0,0.14)]"
              >
                <div className="relative overflow-hidden rounded-[22px] border border-white/8 bg-[#07080d]">
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${item.accent}`} />
                  <Image
                    src={item.imageSrc}
                    alt={item.title}
                    width={860}
                    height={620}
                    className="h-52 w-full object-cover brightness-[1.12] contrast-[1.05] saturate-[1.16]"
                  />
                </div>

                <div className="mt-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-black">
                  <Icon className="h-5 w-5" />
                </div>

                <h3 className="mt-5 text-xl font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-white/62">{item.body}</p>
              </article>
            )
          })}

          <Link
            href="/features"
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white px-6 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            {featuresT('exploreCta')}
          </Link>
        </div>
      </div>
    </section>
  )
}

export function PricingSection() {
  const pricingT = useTranslations('landing.sections.pricing')
  const billingT = useTranslations('pricing')
  const [selectedMode, setSelectedMode] = useState<
    (typeof LANDING_PRICING_MODES)[number]['key']
  >('monthly')

  const planDescriptions = {
    standard: billingT('standardDescription'),
    pro: billingT('proDescription'),
    ultimate: billingT('ultimateDescription'),
  } as const
  const selectedModeConfig =
    LANDING_PRICING_MODES.find((mode) => mode.key === selectedMode) ??
    LANDING_PRICING_MODES[0]

  return (
    <section id="pricing" className="bg-[#09090d] px-4 py-24 sm:px-6 lg:px-8 xl:px-10">
      <div className="mx-auto w-full max-w-[1240px]">
        <div className="mx-auto max-w-[980px] text-center">
          <h2 className="text-[2.8rem] leading-[0.95] font-semibold tracking-tight text-white md:text-[4.4rem]">
            {pricingT('title')}
          </h2>
          <p className="mx-auto mt-6 max-w-[48rem] text-base leading-8 text-white/62 md:text-[1.12rem]">
            {pricingT('body')}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {LANDING_PRICING_MODES.map((mode) => (
              <button
                key={mode.key}
                type="button"
                onClick={() => setSelectedMode(mode.key)}
                className={`inline-flex min-w-[120px] items-center justify-center rounded-full border px-5 py-3 text-sm font-semibold transition ${
                  selectedMode === mode.key
                    ? 'border-white bg-white text-black'
                    : 'border-white/10 bg-white/[0.04] text-white/72 hover:border-white/20 hover:text-white'
                }`}
              >
                {billingT(mode.titleKey)}
              </button>
            ))}
          </div>

          <p className="mx-auto mt-5 max-w-[46rem] text-sm leading-7 text-white/48 md:text-base">
            {pricingT(`groups.${selectedMode}.body`)}
          </p>
        </div>

        <div
          className={`mt-14 rounded-[32px] border p-6 md:p-8 ${selectedModeConfig.className}`}
        >
          <div className="flex flex-col gap-4 border-b border-white/8 pb-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03] text-white/82">
                <selectedModeConfig.icon className="h-5.5 w-5.5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-[0.72rem] font-semibold tracking-[0.18em] uppercase ${selectedModeConfig.badgeClassName}`}
                  >
                    {pricingT(`groups.${selectedMode}.badge`)}
                  </span>
                  {selectedMode === 'monthly' ? (
                    <span className="rounded-full border border-[#6b5cff]/30 bg-[#6b5cff]/12 px-3 py-1 text-xs font-medium text-[#d3ccff]">
                      {pricingT('popular')}
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-4 text-[1.9rem] font-semibold tracking-tight text-white md:text-[2.3rem]">
                  {billingT(selectedModeConfig.panelTitleKey)}
                </h3>
                <p className="mt-2 max-w-[42rem] text-sm leading-7 text-white/58 md:text-base">
                  {pricingT('summaryNote')}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`mt-8 grid gap-4 ${
              selectedMode === 'credits' ? 'xl:grid-cols-4 md:grid-cols-2' : 'xl:grid-cols-3'
            }`}
          >
            {selectedMode === 'credits'
              ? LANDING_CREDIT_PACKS.map((packageId) => {
                  const pack = BILLING_CREDIT_PACK_SNAPSHOTS[packageId]
                  return (
                    <article
                      key={packageId}
                      className={`flex h-full flex-col rounded-[26px] border p-5 ${
                        packageId === '3500'
                          ? 'border-[#6b5cff]/28 bg-[#6b5cff]/[0.06]'
                          : 'border-white/8 bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[1.8rem] font-semibold tracking-tight text-white">
                            {billingT('creditsValue', {
                              value: pack.totalCredits.toLocaleString(),
                            })}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-white/55">
                            {pack.bonusCredits > 0
                              ? billingT('creditsBonus', {
                                  base: pack.credits.toLocaleString(),
                                  bonus: pack.bonusCredits.toLocaleString(),
                                })
                              : billingT('creditsBaseOnly', {
                                  base: pack.credits.toLocaleString(),
                                })}
                          </p>
                        </div>
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${selectedModeConfig.chipClassName}`}
                        >
                          {billingT('toggleCredits')}
                        </span>
                      </div>

                      <div className="mt-5 border-t border-white/8 pt-5">
                        <p className="text-[2.35rem] leading-none font-semibold tracking-tight text-white">
                          {formatLandingUsd(LANDING_CREDIT_PACK_PRICE_AMOUNTS[packageId])}
                        </p>
                        <p className="mt-2 text-sm text-white/45">{billingT('billedOneTime')}</p>
                      </div>

                      <div className="mt-5 space-y-2 text-sm leading-6 text-white/62">
                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3.5 py-3">
                          {billingT('creditsIncluded')} · {pack.credits.toLocaleString()}
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3.5 py-3">
                          {billingT('creditsBonusLabel')} · +{pack.bonusCredits.toLocaleString()}
                        </div>
                      </div>

                      <Link
                        href="/pricing"
                        className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-2xl border border-white/10 bg-white text-sm font-semibold text-black transition hover:bg-white/90"
                      >
                        {billingT('buyCredits')}
                      </Link>
                    </article>
                  )
                })
              : LANDING_BILLING_PLANS.map((planKey) => {
                  const snapshot = BILLING_PLAN_SNAPSHOTS[planKey]
                  const creditsLabel =
                    selectedMode === 'monthly'
                      ? billingT('monthlyCredits')
                      : billingT('permanentCredits')
                  const planPrice =
                    selectedMode === 'monthly'
                      ? LANDING_PLAN_PRICE_AMOUNTS.monthly[planKey]
                      : LANDING_PLAN_PRICE_AMOUNTS.oneTime[planKey]
                  const ctaLabel =
                    selectedMode === 'monthly'
                      ? `${billingT('startSubscription')} ${billingT(`${planKey}Name`)}`
                      : `${billingT('buyOneTime')} ${billingT(`${planKey}Name`)}`

                  return (
                    <article
                      key={`${selectedMode}-${planKey}`}
                      className={`flex h-full flex-col rounded-[26px] border p-5 ${
                        planKey === 'pro'
                          ? 'border-[#6b5cff]/28 bg-[#6b5cff]/[0.06]'
                          : 'border-white/8 bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[1.8rem] font-semibold tracking-tight text-white">
                              {billingT(`${planKey}Name`)}
                            </p>
                            {planKey === 'pro' ? (
                              <span className="rounded-full border border-[#6b5cff]/30 bg-[#6b5cff]/12 px-2.5 py-0.5 text-[0.68rem] font-medium tracking-[0.14em] text-[#d3ccff] uppercase">
                                {pricingT('popular')}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-3 text-sm leading-6 text-white/55">
                            {planDescriptions[planKey]}
                          </p>
                        </div>
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${selectedModeConfig.chipClassName}`}
                        >
                          {selectedMode === 'monthly'
                            ? pricingT(`plans.${planKey}.period`)
                            : billingT('billedOneTime')}
                        </span>
                      </div>

                      <div className="mt-5 border-t border-white/8 pt-5">
                        <p className="text-[2.35rem] leading-none font-semibold tracking-tight text-white">
                          {formatLandingUsd(planPrice)}
                        </p>
                        <p className="mt-2 text-sm text-white/45">
                          {selectedMode === 'monthly'
                            ? billingT('billedMonthly')
                            : billingT('billedOneTime')}
                        </p>
                      </div>

                      <div className="mt-5 space-y-2 text-sm leading-6 text-white/62">
                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3.5 py-3">
                          {creditsLabel} · {snapshot.monthlyCredits.toLocaleString()}
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3.5 py-3">
                          {billingT('storageIncluded')} ·{' '}
                          {billingT('storageValue', {
                            value: snapshot.storageGB,
                          })}
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3.5 py-3">
                          {pricingT(`plans.${planKey}.note`)}
                        </div>
                      </div>

                      <Link
                        href="/pricing"
                        className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-2xl border border-white/10 bg-white text-sm font-semibold text-black transition hover:bg-white/90"
                      >
                        {ctaLabel}
                      </Link>
                    </article>
                  )
                })}
          </div>
        </div>
      </div>
    </section>
  )
}

export function TestimonialsSection() {
  const testimonialsT = useTranslations('landing.sections.testimonials')

  return (
    <section className="relative overflow-hidden bg-[#0b0b0f] px-4 py-22 sm:px-6 lg:px-8 lg:py-24 xl:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(255,255,255,0.07),transparent_20%),radial-gradient(circle_at_82%_74%,rgba(110,124,255,0.08),transparent_18%),linear-gradient(180deg,#0b0b0f_0%,#08090e_100%)]" />
      <div className="relative mx-auto w-full max-w-[1240px]">
        <SectionHeader
          eyebrow=""
          title={testimonialsT('title')}
          body={testimonialsT('body')}
        />

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
                <Image
                  src={TESTIMONIAL_AVATARS[key]}
                  alt={`${testimonialsT(`${key}.handle`)} avatar`}
                  width={48}
                  height={48}
                  unoptimized
                  className="h-12 w-12 rounded-full border border-white/12 bg-white/8 object-cover"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <p className="text-[0.98rem] font-semibold text-white">
                    {testimonialsT(`${key}.handle`)}
                  </p>
                  <p className="mt-0.5 text-xs tracking-[0.16em] text-white/38 uppercase">
                    {testimonialsT(`${key}.role`)}
                  </p>
                </div>
              </div>

              <p className="mt-5 text-[0.94rem] leading-7 text-white/74">
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
            <details
              key={key}
              className="group border-b border-white/8 first:border-t"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-7 text-left text-[1.18rem] font-semibold tracking-tight text-white marker:content-none">
                <span>{faqT(`${key}.question`)}</span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/58 transition-colors duration-200 group-open:text-white group-hover:text-white">
                  <ChevronDown className="h-4.5 w-4.5 transition-transform duration-200 group-open:rotate-180" />
                </span>
              </summary>
              <div className="pb-7">
                <p className="max-w-[48rem] text-[1rem] leading-8 text-white/62 md:text-[1.05rem]">
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
