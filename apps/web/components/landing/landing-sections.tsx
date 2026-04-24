/**
 * [INPUT]: 依赖 react 的 useEffect/useRef/useState，依赖 next/image 的远程图片渲染，
 *          依赖 next-intl 的 useTranslations，依赖 lucide-react 的图标集合，
 *          依赖 @/components/shared/brand-mark，依赖 @/i18n/navigation 的 Link
 * [OUTPUT]: 对外提供 ModelMindMapSection、FeaturesSection、PricingSection、TestimonialsSection、FaqSection、CtaSection
 * [POS]: components/landing 的首页内容区集合，被 (landing)/page.tsx 按首屏后叙事顺序消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import {
  AudioLines,
  BrainCircuit,
  Check,
  ChevronDown,
  Cuboid,
  Eye,
  ImageIcon,
  Play,
  Sparkles,
  Star,
  Video,
  Workflow,
  Zap,
} from 'lucide-react'
import { useTranslations } from 'next-intl'

import { BrandMark } from '@/components/shared/brand-mark'
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
const FAQ_KEYS = ['what', 'models', 'canvas', 'compare', 'pricing'] as const

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
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
        <p className="text-sm font-medium tracking-[0.24em] text-white/45 uppercase">
          {eyebrow}
        </p>
        <h2
          className={`mt-4 font-semibold text-white ${
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
      <div className="relative w-full">
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

  return (
    <section id="features" className="bg-[#0b0b0f] px-4 py-24 sm:px-6 lg:px-8 xl:px-10">
      <div className="w-full">
        <SectionHeader
          eyebrow={featuresT('eyebrow')}
          title={featuresT('title')}
          body={featuresT('body')}
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
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
    <section id="pricing" className="bg-[#09090d] px-4 py-24 sm:px-6 lg:px-8 xl:px-10">
      <div className="w-full">
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
    <section className="relative overflow-hidden bg-[#0b0b0f] px-4 py-22 sm:px-6 lg:px-8 lg:py-24 xl:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(255,255,255,0.07),transparent_20%),radial-gradient(circle_at_82%_74%,rgba(110,124,255,0.08),transparent_18%),linear-gradient(180deg,#0b0b0f_0%,#08090e_100%)]" />
      <div className="relative w-full">
        <SectionHeader
          eyebrow={testimonialsT('eyebrow')}
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
      <div className="relative mx-auto w-full max-w-[1080px]">
        <div className="mx-auto max-w-[42rem] text-center">
          <p className="text-sm font-medium tracking-[0.24em] text-white/42 uppercase">
            {faqT('eyebrow')}
          </p>
          <h2 className="mt-5 text-[2.8rem] leading-[0.94] font-semibold tracking-tight text-white md:text-[4rem]">
            {faqT('title')}
          </h2>
          <p className="mt-6 text-[1rem] leading-8 text-white/54 md:text-[1.12rem]">
            {faqT('body')}
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-[860px]">
          {FAQ_KEYS.map((key, index) => (
            <details
              key={key}
              open={index === 0}
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

export function CtaSection() {
  const ctaT = useTranslations('landing.sections.cta')

  return (
    <section className="bg-[#0b0b0f] px-4 py-24 sm:px-6 lg:px-8 xl:px-10">
      <div className="w-full">
        <div className="relative overflow-hidden rounded-[44px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_28%),radial-gradient(circle_at_50%_0%,rgba(114,130,255,0.1),transparent_18%),linear-gradient(180deg,#121318_0%,#08090d_100%)] px-6 py-18 text-center shadow-[0_50px_120px_rgba(0,0,0,0.32)] sm:px-10 md:px-16 md:py-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.12),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent_26%)]" />
          <div className="pointer-events-none absolute top-0 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/14" />
          <div className="pointer-events-none absolute top-0 left-1/2 h-28 w-28 -translate-x-1/2 -translate-y-[42%] rounded-full border border-white/10" />

          <div className="relative mx-auto max-w-[48rem]">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))] shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
              <BrandMark
                withLogo
                showText={false}
                className="text-[2.6rem] text-white"
                logoClassName="drop-shadow-[0_6px_16px_rgba(255,255,255,0.16)]"
              />
            </div>

            <p className="mt-8 text-[0.82rem] font-semibold tracking-[0.34em] text-white/42 uppercase">
              {ctaT('eyebrow')}
            </p>
            <h2 className="mt-5 text-[2.7rem] leading-[0.95] font-semibold tracking-tight text-white md:text-[4.5rem]">
              {ctaT('title')}
            </h2>
            <p className="mx-auto mt-6 max-w-[40rem] text-[1.05rem] leading-8 text-white/62 md:text-[1.22rem] md:leading-9">
              {ctaT('body')}
            </p>

            <div className="mt-11 flex flex-col items-center gap-4 md:flex-row md:justify-center">
              <Link
                href="/sign-in"
                className="inline-flex h-15 items-center justify-center rounded-full bg-white px-10 text-[1rem] font-semibold text-black shadow-[0_20px_40px_rgba(255,255,255,0.1)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white/90"
              >
                {ctaT('primary')}
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-15 items-center justify-center rounded-full border border-white/14 px-10 text-[1rem] font-semibold text-white transition-colors duration-200 hover:bg-white/8"
              >
                {ctaT('secondary')}
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-white/42">
              <span>{ctaT('note')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
