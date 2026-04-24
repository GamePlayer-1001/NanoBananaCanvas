/**
 * [INPUT]: 依赖 react 的 useEffect/useRef/useState，依赖 next/image 的远程图片渲染，
 *          依赖 next-intl 的 useTranslations，依赖 lucide-react 的图标集合，依赖 @/i18n/navigation 的 Link
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
  CircleHelp,
  ImageIcon,
  Play,
  Route,
  Sparkles,
  Star,
  Video,
  Workflow,
  Zap,
} from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'

type ModelProvider = {
  name: string
  logoUrl: string
  orbit: 1 | 2 | 3
  angle: number
  tone: 'ice' | 'teal' | 'amber' | 'coral'
  logoScale?: number
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
    logoUrl: buildVendorFaviconUrl('openai.com'),
    orbit: 3,
    angle: -88,
    tone: 'ice',
  },
  {
    name: 'Google',
    logoUrl: buildSimpleIconUrl('google'),
    orbit: 3,
    angle: -38,
    tone: 'amber',
  },
  {
    name: 'Anthropic',
    logoUrl: buildSimpleIconUrl('anthropic'),
    orbit: 3,
    angle: -2,
    tone: 'coral',
  },
  {
    name: 'Gemini',
    logoUrl: buildSimpleIconUrl('googlegemini'),
    orbit: 3,
    angle: 28,
    tone: 'ice',
  },
  {
    name: 'Alibaba Wan',
    logoUrl: buildSimpleIconUrl('alibabacloud'),
    orbit: 3,
    angle: 48,
    tone: 'amber',
    logoScale: 0.68,
  },
  {
    name: 'Midjourney',
    logoUrl: buildVendorFaviconUrl('midjourney.com'),
    orbit: 3,
    angle: 76,
    tone: 'amber',
  },
  {
    name: 'OpenRouter',
    logoUrl: buildSimpleIconUrl('openrouter'),
    orbit: 3,
    angle: 112,
    tone: 'ice',
    logoScale: 0.7,
  },
  {
    name: 'Runway',
    logoUrl: buildVendorFaviconUrl('runwayml.com'),
    orbit: 3,
    angle: 166,
    tone: 'teal',
  },
  {
    name: 'Luma',
    logoUrl: buildVendorFaviconUrl('luma.ai'),
    orbit: 3,
    angle: 198,
    tone: 'teal',
  },
  {
    name: 'Vidu',
    logoUrl: buildVendorFaviconUrl('vidu.com'),
    orbit: 3,
    angle: 232,
    tone: 'ice',
  },
  {
    name: 'Groq',
    logoUrl: buildVendorFaviconUrl('groq.com'),
    orbit: 3,
    angle: 258,
    tone: 'ice',
  },
  {
    name: 'xAI',
    logoUrl: buildVendorFaviconUrl('x.ai'),
    orbit: 3,
    angle: 300,
    tone: 'teal',
  },
  {
    name: 'ByteDance',
    logoUrl: buildSimpleIconUrl('bytedance'),
    orbit: 2,
    angle: 18,
    tone: 'ice',
  },
  {
    name: 'Kling',
    logoUrl: buildVendorFaviconUrl('klingai.com'),
    orbit: 2,
    angle: 66,
    tone: 'teal',
  },
  {
    name: 'Qwen',
    logoUrl: buildVendorFaviconUrl('chat.qwen.ai'),
    orbit: 2,
    angle: 136,
    tone: 'coral',
  },
  {
    name: 'Black Forest',
    logoUrl: buildVendorFaviconUrl('blackforestlabs.ai'),
    orbit: 2,
    angle: 154,
    tone: 'teal',
  },
  {
    name: 'MiniMax',
    logoUrl: buildSimpleIconUrl('minimax'),
    orbit: 2,
    angle: 214,
    tone: 'coral',
  },
  {
    name: 'DeepSeek',
    logoUrl: buildVendorFaviconUrl('deepseek.com'),
    orbit: 1,
    angle: 150,
    tone: 'ice',
  },
]

const MODEL_CANVAS = {
  width: 1180,
  height: 860,
  centerX: 590,
  centerY: 420,
} as const

const MODEL_RING_RADII = [168, 272, 384] as const

const MODEL_ORBITS = {
  1: { x: 236, y: 182 },
  2: { x: 344, y: 262 },
  3: { x: 438, y: 332 },
} as const

const MODEL_TONE_STYLES = {
  ice: {
    ring: 'rgba(117, 207, 255, 0.42)',
    glow: 'rgba(117, 207, 255, 0.22)',
    text: '#dff4ff',
    fill: 'radial-gradient(circle at 30% 25%, rgba(117,207,255,0.18), rgba(7,14,24,0.96) 72%)',
  },
  teal: {
    ring: 'rgba(96, 214, 193, 0.4)',
    glow: 'rgba(96, 214, 193, 0.2)',
    text: '#dcfff6',
    fill: 'radial-gradient(circle at 32% 28%, rgba(96,214,193,0.18), rgba(6,14,18,0.96) 72%)',
  },
  amber: {
    ring: 'rgba(245, 187, 102, 0.42)',
    glow: 'rgba(245, 187, 102, 0.2)',
    text: '#fff3d8',
    fill: 'radial-gradient(circle at 34% 26%, rgba(245,187,102,0.17), rgba(18,14,10,0.96) 72%)',
  },
  coral: {
    ring: 'rgba(255, 152, 122, 0.38)',
    glow: 'rgba(255, 152, 122, 0.18)',
    text: '#ffe7df',
    fill: 'radial-gradient(circle at 34% 26%, rgba(255,152,122,0.16), rgba(20,12,13,0.96) 72%)',
  },
} as const

const MODEL_SUMMARY_KEYS = ['text', 'image', 'video', 'audio', 'routing'] as const
const INITIAL_MODEL_MOTION: ModelMotionState = { progress: 0, reveal: 0, drift: -1 }

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
      className="relative overflow-hidden bg-[#080b11] px-4 py-28 sm:px-6 lg:px-8 lg:py-32 xl:px-10"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_58%_44%,rgba(70,122,205,0.16),transparent_26%),radial-gradient(circle_at_18%_88%,rgba(74,179,162,0.14),transparent_28%),linear-gradient(180deg,rgba(5,8,13,0.12),rgba(5,8,13,0.72))]" />
      <div className="relative w-full">
        <div className="grid gap-8 xl:grid-cols-[0.82fr_1.2fr_0.62fr] xl:items-start">
          <div
            className="max-w-[37rem] pt-4 transition-[opacity,transform] duration-300 ease-out"
            style={{
              opacity: 0.14 + revealProgress * 0.86,
              transform: `translate3d(${-68 * (1 - revealProgress)}px, ${
                30 * (1 - revealProgress) - drift * 18
              }px, 0)`,
            }}
          >
            <p className="text-[0.95rem] font-medium tracking-[0.22em] text-[#7f92a8] uppercase">
              {modelT('eyebrow')}
            </p>
            <h2 className="mt-7 max-w-[37rem] text-[3rem] leading-[0.92] font-semibold tracking-[-0.04em] text-white md:text-[4.6rem] xl:text-[5.2rem]">
              <span className="block xl:whitespace-nowrap">{modelT('title')}</span>
              <span className="mt-2 block bg-[linear-gradient(90deg,#78b8ff_0%,#7fd9d7_42%,#cdd997_74%,#b55cff_100%)] bg-clip-text text-transparent xl:whitespace-nowrap">
                {modelT('highlight')}
              </span>
            </h2>
            <p className="mt-8 max-w-[32rem] text-[1rem] leading-[1.82] text-[#98a4b6] md:text-[1.13rem] md:leading-[1.84]">
              {modelT('body')}
            </p>
            <Link
              href="/contact"
              className="mt-10 inline-flex items-center gap-3 rounded-full border border-[#2d3858] bg-[linear-gradient(180deg,rgba(26,34,58,0.96),rgba(16,23,38,0.96))] px-6 py-4 text-[1rem] font-semibold text-white shadow-[0_14px_42px_rgba(10,16,36,0.28)] transition-transform duration-200 hover:-translate-y-0.5"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#5f69ff]/18 text-[#7b83ff]">
                <Play className="ml-0.5 h-3 w-3 fill-current" />
              </span>
              <span>{modelT('cta')}</span>
            </Link>
            <div className="mt-36 inline-flex max-w-[25rem] items-center gap-3 rounded-[14px] border border-[#1b3d3a] bg-[linear-gradient(135deg,rgba(12,27,29,0.92),rgba(10,15,24,0.94))] px-5 py-3.5 text-sm leading-7 text-[#d2e5dd] shadow-[0_18px_60px_rgba(0,0,0,0.18)] md:text-[0.93rem]">
              <span className="text-lg text-[#f8c46f]">✦</span>
              <span>{modelT('banner')}</span>
            </div>
          </div>

          <div
            className="relative min-h-[36rem] overflow-hidden rounded-[36px] border border-white/8 bg-[linear-gradient(180deg,rgba(8,12,18,0.98),rgba(6,9,14,0.94))] px-3 py-4 shadow-[0_36px_140px_rgba(0,0,0,0.36)] transition-[opacity,transform] duration-300 ease-out md:min-h-[46rem] md:px-5 md:py-6"
            style={{
              opacity: 0.18 + revealProgress * 0.82,
              transform: `translate3d(0, ${56 * (1 - revealProgress) - drift * 24}px, 0)`,
            }}
          >
            <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:42px_42px] opacity-40" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(70,122,205,0.16),transparent_25%),radial-gradient(circle_at_26%_76%,rgba(74,179,162,0.13),transparent_22%),radial-gradient(circle_at_78%_72%,rgba(245,187,102,0.12),transparent_21%)]" />
            <div className="relative flex min-h-[33rem] items-center justify-center md:min-h-[42rem]">
              <div className="relative h-[860px] w-[1180px] origin-center scale-[0.45] sm:scale-[0.55] lg:scale-[0.68] xl:scale-[0.8] 2xl:scale-[0.92]">
                <div
                  className="relative h-full w-full transition-[transform,opacity] duration-300 ease-out"
                  style={{
                    opacity: 0.18 + revealProgress * 0.82,
                    transform: `translate3d(0, ${18 * (1 - revealProgress) - drift * 18}px, 0) scale(${
                      0.88 + revealProgress * 0.12
                    }) rotate(${drift * 2.8}deg)`,
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
                        stroke="rgba(163,189,217,0.13)"
                        strokeWidth={index === 0 ? 1.4 : 1}
                      />
                    ))}

                    {MODEL_PROVIDERS.map((provider, index) => {
                      const angle = (provider.angle * Math.PI) / 180
                      const orbit = MODEL_ORBITS[provider.orbit]
                      const tone = MODEL_TONE_STYLES[provider.tone]
                      const x = MODEL_CANVAS.centerX + Math.cos(angle) * orbit.x
                      const y = MODEL_CANVAS.centerY + Math.sin(angle) * orbit.y
                      const c1x = MODEL_CANVAS.centerX + Math.cos(angle) * orbit.x * 0.28
                      const c1y = MODEL_CANVAS.centerY + Math.sin(angle) * orbit.y * 0.12
                      const c2x = MODEL_CANVAS.centerX + Math.cos(angle) * orbit.x * 0.78
                      const c2y = MODEL_CANVAS.centerY + Math.sin(angle) * orbit.y * 0.88

                      return (
                        <g key={provider.name}>
                          <path
                            d={`M${MODEL_CANVAS.centerX} ${MODEL_CANVAS.centerY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x} ${y}`}
                            stroke={tone.ring}
                            strokeWidth={provider.orbit === 3 ? 1.8 : 1.45}
                            strokeLinecap="round"
                            strokeDasharray="5 11"
                            className="transition-opacity duration-700 ease-out"
                            style={{
                              opacity: 0.12 + revealProgress * 0.74,
                              animation: `dashFlow ${4.6 + provider.orbit * 0.5}s linear infinite`,
                              animationDelay: `${index * 0.12}s`,
                            }}
                          />
                          <circle
                            cx={x}
                            cy={y}
                            r="4.8"
                            fill={tone.ring}
                            style={{
                              opacity: 0.2 + revealProgress * 0.8,
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
                    className="absolute top-1/2 left-1/2 z-20 h-[268px] w-[268px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-[radial-gradient(circle_at_40%_34%,rgba(110,156,239,0.36),rgba(26,33,64,0.95)_58%,rgba(8,10,18,0.98)_100%)] shadow-[0_0_0_18px_rgba(129,150,208,0.05),0_0_90px_rgba(77,121,214,0.18)]"
                    style={{
                      opacity: 0.24 + revealProgress * 0.76,
                      animation: prefersReducedMotion
                        ? 'none'
                        : 'corePulse 6s ease-in-out infinite',
                      boxShadow: `0 0 0 ${8 + revealProgress * 10}px rgba(129,150,208,${
                        0.02 + revealProgress * 0.03
                      }), 0 0 ${48 + revealProgress * 46}px rgba(77,121,214,${
                        0.1 + revealProgress * 0.1
                      })`,
                    }}
                  >
                    <div className="absolute inset-[18px] rounded-full border border-white/10" />
                    <div className="relative flex h-full flex-col items-center justify-center px-10 text-center">
                      <BrainCircuit className="h-14 w-14 text-[#cfe2ff]" />
                      <p className="mt-5 text-[2rem] font-semibold tracking-tight text-white">
                        {modelT('centerTitle')}
                      </p>
                      <p className="mt-3 max-w-[12rem] text-[0.96rem] leading-7 text-[#c8d3df]">
                        {modelT('centerBody')}
                      </p>
                    </div>
                  </div>

                  {MODEL_PROVIDERS.map((provider, index) => {
                    const angle = (provider.angle * Math.PI) / 180
                    const orbit = MODEL_ORBITS[provider.orbit]
                    const tone = MODEL_TONE_STYLES[provider.tone]
                    const x = MODEL_CANVAS.centerX + Math.cos(angle) * orbit.x
                    const y = MODEL_CANVAS.centerY + Math.sin(angle) * orbit.y

                    return (
                      <div
                        key={provider.name}
                        className="absolute z-30 transition-all ease-out"
                        style={{
                          left: `${x}px`,
                          top: `${y}px`,
                          width:
                            provider.orbit === 3
                              ? '138px'
                              : provider.orbit === 2
                                ? '126px'
                                : '118px',
                          transform: `translate(-50%, -50%) translate(${
                            Math.cos(angle) * (42 * (1 - revealProgress) + drift * 12)
                          }px, ${
                            Math.sin(angle) * (42 * (1 - revealProgress) - drift * 10) +
                            16 * (1 - revealProgress)
                          }px) scale(${0.72 + revealProgress * 0.28})`,
                          opacity: 0.08 + revealProgress * 0.92,
                          transitionDuration: prefersReducedMotion
                            ? '0ms'
                            : `${280 + provider.orbit * 80}ms`,
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
                              : `providerBob ${5.2 + (index % 5) * 0.45}s ease-in-out infinite`,
                          }}
                        >
                          <div
                            className="flex h-[88px] w-[88px] items-center justify-center rounded-full border bg-[#070b12]/92 shadow-[0_22px_60px_rgba(0,0,0,0.34)]"
                            style={{
                              borderColor: tone.ring,
                              boxShadow: `0 0 0 ${6 + revealProgress * 4}px ${tone.glow}, 0 ${
                                16 + revealProgress * 10
                              }px ${36 + revealProgress * 24}px rgba(0,0,0,0.34)`,
                              background: tone.fill,
                            }}
                          >
                            <div className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-white/5 p-2">
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
                                }}
                              />
                            </div>
                          </div>
                          <p className="mt-3 max-w-[9rem] text-[0.98rem] leading-tight font-semibold text-white">
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
            className="rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(13,17,25,0.96),rgba(8,11,17,0.98))] p-6 shadow-[0_22px_100px_rgba(0,0,0,0.28)] transition-[opacity,transform] duration-300 ease-out md:p-7 xl:mt-1"
            style={{
              opacity: 0.12 + revealProgress * 0.88,
              transform: `translate3d(${58 * (1 - revealProgress)}px, ${
                18 * (1 - revealProgress) + drift * 14
              }px, 0)`,
            }}
          >
            <p className="text-[1.65rem] font-semibold tracking-tight text-white">
              {modelT('summaryTitle')}
            </p>
            <div className="mt-6 space-y-3">
              {MODEL_SUMMARY_KEYS.map((key) => {
                const Icon =
                  key === 'text'
                    ? Sparkles
                    : key === 'image'
                      ? ImageIcon
                      : key === 'video'
                        ? Video
                        : key === 'audio'
                          ? AudioLines
                          : Route

                return (
                  <div
                    key={key}
                    className="flex items-start gap-3 rounded-[22px] border border-white/6 bg-white/[0.025] px-4 py-3.5"
                  >
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] border border-[#243446] bg-[#0b1320] text-[#8cc4ff]">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-[1rem] font-semibold text-white">
                        {modelT(`capabilities.${key}.title`)}
                      </p>
                      <p className="mt-1 text-[0.92rem] leading-6 text-[#9db0c6]">
                        {modelT(`capabilities.${key}.body`)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-7 border-t border-white/8 pt-6">
              <p className="text-sm tracking-[0.2em] text-[#89a0b8] uppercase">
                {modelT('summaryCountLabel')}
              </p>
              <div className="mt-3 flex items-end gap-3">
                <span className="text-[3.2rem] leading-none font-semibold text-white">
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
              transform: translate(-50%, -50%) scale(1.025);
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
    <section className="bg-[#0b0b0f] px-4 py-24 sm:px-6 lg:px-8 xl:px-10">
      <div className="w-full">
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
    <section id="faq" className="bg-[#09090d] px-4 py-24 sm:px-6 lg:px-8 xl:px-10">
      <div className="w-full">
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
    <section className="bg-[#0b0b0f] px-4 py-24 sm:px-6 lg:px-8 xl:px-10">
      <div className="grid w-full gap-8 text-left lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm font-medium tracking-[0.24em] text-white/45 uppercase">
            {ctaT('eyebrow')}
          </p>
          <h2 className="mt-5 text-4xl font-semibold text-white md:text-6xl">
            {ctaT('title')}
          </h2>
          <p className="mt-6 text-base leading-7 text-white/62 md:text-lg">
            {ctaT('body')}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
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
