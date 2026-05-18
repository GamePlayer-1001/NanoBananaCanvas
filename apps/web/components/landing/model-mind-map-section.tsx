/**
 * [INPUT]: 依赖 react 的 useEffect/useState，依赖 next-intl 的 useTranslations，
 *          依赖 lucide-react 的 Sparkles/ShieldCheck/Workflow/Zap
 * [OUTPUT]: 对外提供 ModelMindMapSection 模型生态云图展示区
 * [POS]: components/landing 的模型展示主视觉区，被 landing-sections.tsx 转发给首页使用；独立 `/models` 内容页已下线，模型入口统一回落到首页锚点，并负责星云/轨道/主星球的统一舞台居中与稳定首帧呈现
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { Sparkles, ShieldCheck, Workflow, Zap } from 'lucide-react'
import { useTranslations } from 'next-intl'

type ProviderTone = 'azure' | 'violet' | 'teal' | 'amber' | 'rose'
type ProviderSize = 'sm' | 'md' | 'lg'
type ProviderOrbit = 'inner' | 'middle' | 'outer'

type ModelProvider = {
  name: string
  vendor?: string
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

const MODEL_STAGE = {
  width: 1400,
  height: 820,
} as const

const MODEL_STAGE_CENTER = {
  x: MODEL_STAGE.width / 2,
  y: MODEL_STAGE.height / 2,
} as const

const MODEL_CORE_POSITION = {
  x: (MODEL_STAGE_CENTER.x / MODEL_STAGE.width) * 100,
  y: (MODEL_STAGE_CENTER.y / MODEL_STAGE.height) * 100,
} as const

const MODEL_CORE_OFFSET_X = 0

const MODEL_ORBIT_RADII: Record<ProviderOrbit, { x: number; y: number }> = {
  inner: { x: 312, y: 120 },
  middle: { x: 448, y: 170 },
  outer: { x: 606, y: 236 },
}

const MODEL_PROVIDERS: ModelProvider[] = [
  {
    name: 'Google',
    fallback: 'G',
    orbit: 'outer',
    angle: 236,
    speed: 3.68,
    lane: -1,
    size: 'md',
    tone: 'amber',
  },
  {
    name: 'OpenAI',
    fallback: 'O',
    orbit: 'outer',
    angle: 272,
    speed: 3.92,
    lane: 0,
    size: 'lg',
    tone: 'violet',
    iconFilter:
      'brightness(0) saturate(100%) invert(99%) sepia(6%) saturate(283%) hue-rotate(184deg) brightness(105%) contrast(100%)',
  },
  {
    name: 'GPT Image',
    vendor: 'OpenAI',
    fallback: 'GI',
    orbit: 'inner',
    angle: 306,
    speed: 6.16,
    lane: 0,
    size: 'sm',
    tone: 'violet',
    iconScale: 0.88,
    iconFilter:
      'brightness(0) saturate(100%) invert(99%) sepia(6%) saturate(283%) hue-rotate(184deg) brightness(105%) contrast(100%)',
  },
  {
    name: 'Black Forest',
    fallback: 'BF',
    orbit: 'outer',
    angle: 334,
    speed: 4.16,
    lane: 1,
    size: 'md',
    tone: 'azure',
    iconScale: 0.86,
    iconFilter:
      'brightness(0) saturate(100%) invert(96%) sepia(5%) saturate(624%) hue-rotate(180deg) brightness(106%) contrast(98%)',
  },
  {
    name: 'OpenRouter',
    fallback: 'OR',
    orbit: 'middle',
    angle: 22,
    speed: 5.28,
    lane: 1,
    size: 'md',
    tone: 'violet',
    iconScale: 0.84,
    iconFilter:
      'brightness(0) saturate(100%) invert(98%) sepia(5%) saturate(312%) hue-rotate(181deg) brightness(107%) contrast(102%)',
  },
  {
    name: 'ByteDance',
    fallback: 'BD',
    orbit: 'middle',
    angle: 344,
    speed: 5.28,
    lane: 1,
    size: 'md',
    tone: 'azure',
  },
  {
    name: 'Anthropic',
    fallback: 'AI',
    orbit: 'outer',
    angle: 32,
    speed: 3.68,
    lane: -1,
    size: 'md',
    tone: 'amber',
    iconFilter:
      'brightness(0) saturate(100%) invert(97%) sepia(4%) saturate(295%) hue-rotate(190deg) brightness(102%) contrast(99%)',
  },
  {
    name: 'Gemini',
    fallback: '✦',
    orbit: 'outer',
    angle: 124,
    speed: 4.16,
    lane: 1,
    size: 'sm',
    tone: 'azure',
  },
  {
    name: 'Alibaba Wan',
    fallback: 'AW',
    orbit: 'outer',
    angle: 98,
    speed: 3.92,
    lane: 0,
    size: 'sm',
    tone: 'violet',
    iconScale: 0.8,
  },
  {
    name: 'Kling',
    fallback: 'KL',
    orbit: 'outer',
    angle: 160,
    speed: 4.16,
    lane: 1,
    size: 'sm',
    tone: 'teal',
  },
  {
    name: 'Runway',
    fallback: 'RW',
    orbit: 'middle',
    angle: 150,
    speed: 4.72,
    lane: -1,
    size: 'sm',
    tone: 'violet',
  },
  {
    name: 'Luma',
    fallback: 'LU',
    orbit: 'outer',
    angle: 206,
    speed: 4.16,
    lane: 1,
    size: 'sm',
    tone: 'azure',
  },
  {
    name: 'Vidu',
    fallback: 'V',
    orbit: 'outer',
    angle: 190,
    speed: 3.92,
    lane: 0,
    size: 'sm',
    tone: 'azure',
  },
  {
    name: 'MiniMax',
    fallback: 'MM',
    orbit: 'middle',
    angle: 228,
    speed: 4.72,
    lane: -1,
    size: 'sm',
    tone: 'rose',
  },
  {
    name: 'Groq',
    fallback: 'GQ',
    orbit: 'inner',
    angle: 26,
    speed: 5.92,
    lane: -1,
    size: 'sm',
    tone: 'violet',
    iconFilter:
      'brightness(0) saturate(100%) invert(98%) sepia(6%) saturate(283%) hue-rotate(181deg) brightness(108%) contrast(99%)',
  },
  {
    name: 'xAI',
    fallback: 'xI',
    orbit: 'inner',
    angle: 164,
    speed: 6.4,
    lane: 1,
    size: 'md',
    tone: 'violet',
    iconFilter:
      'brightness(0) saturate(100%) invert(99%) sepia(3%) saturate(237%) hue-rotate(178deg) brightness(108%) contrast(98%)',
  },
  {
    name: 'Qwen',
    fallback: 'Q',
    orbit: 'middle',
    angle: 88,
    speed: 5,
    lane: 0,
    size: 'sm',
    tone: 'violet',
    iconFilter:
      'brightness(0) saturate(100%) invert(99%) sepia(7%) saturate(155%) hue-rotate(194deg) brightness(103%) contrast(99%)',
  },
  {
    name: 'Midjourney',
    fallback: 'MJ',
    orbit: 'outer',
    angle: 8,
    speed: 3.92,
    lane: 0,
    size: 'sm',
    tone: 'violet',
    iconScale: 0.9,
    iconFilter:
      'brightness(0) saturate(100%) invert(98%) sepia(5%) saturate(419%) hue-rotate(183deg) brightness(107%) contrast(99%)',
  },
]

const MODEL_NODE_DIMENSIONS = {
  sm: { orb: 108, icon: 46 },
  md: { orb: 130, icon: 56 },
  lg: { orb: 156, icon: 68 },
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

const MODEL_STATS = [
  { key: 'vendors', icon: Workflow },
  { key: 'coverage', icon: Sparkles },
  { key: 'routing', icon: Zap },
  { key: 'team', icon: ShieldCheck },
] as const

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

function renderBrandSvg(name: string, color: string, size: number) {
  switch (name) {
    case 'Google':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
      )
    case 'OpenAI':
    case 'GPT Image':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill={color}>
          <path d="M22.28 9.82a6 6 0 00-.52-4.91 6.05 6.05 0 00-6.51-2.9A6.07 6.07 0 004.98 4.18a6 6 0 00-4 2.9 6.05 6.05 0 00.74 7.1 6 6 0 00.51 4.91 6.05 6.05 0 006.51 2.9A6 6 0 0013.26 24a6.06 6.06 0 005.77-4.21 6 6 0 004-2.9 6.06 6.06 0 00-.75-7.07zM13.26 22.5a4.48 4.48 0 01-2.88-1.04l.14-.08 4.78-2.76a.8.8 0 00.39-.68v-6.74l2.02 1.17a.07.07 0 01.04.05v5.58a4.5 4.5 0 01-4.49 4.5zm-9.66-4.13a4.47 4.47 0 01-.53-3.01l.14.08 4.78 2.76a.77.77 0 00.78 0l5.84-3.37v2.33a.08.08 0 01-.03.06l-4.84 2.79a4.5 4.5 0 01-6.14-1.64zM2.34 7.9a4.49 4.49 0 012.37-1.97v5.71a.77.77 0 00.39.68l5.81 3.35-2.02 1.17a.08.08 0 01-.07 0L3.99 14.1A4.5 4.5 0 012.34 7.9zm16.6 3.86l-5.84-3.37 2.02-1.17a.08.08 0 01.07 0l4.83 2.79a4.49 4.49 0 01-.68 8.1v-5.67a.79.79 0 00-.4-.68zm2.01-3.02l-.14-.09-4.77-2.78a.78.78 0 00-.79 0L9.41 9.23V6.9a.07.07 0 01.03-.06L14.26 4.1a4.5 4.5 0 016.68 4.66zM8.31 12.86l-2.02-1.16a.08.08 0 01-.04-.06V6.07a4.5 4.5 0 017.38-3.45l-.14.08-4.78 2.76a.8.8 0 00-.39.68l-.01 6.72zm1.1-2.37l2.6-1.5 2.61 1.5v3l-2.6 1.5-2.61-1.5V10.5z" />
        </svg>
      )
    case 'Anthropic':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill={color}>
          <path d="M13.83 4.5h-3.66L3.5 19.5h3.2l1.56-4.5h7.48l1.56 4.5H20.5L13.83 4.5zm-4.24 8.4L12 5.94l2.41 6.96H9.59z" />
        </svg>
      )
    case 'Gemini':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill={color}>
          <path d="M12 2C12 7.52 7.52 12 2 12c5.52 0 10 4.48 10 10 0-5.52 4.48-10 10-10-5.52 0-10-4.48-10-10z" />
        </svg>
      )
    case 'xAI':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill={color}>
          <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24H16.17l-5.21-6.82-5.97 6.82H1.68l7.73-8.84L1.25 2.25H8.08l4.71 6.23 5.45-6.23zm-1.16 17.52h1.83L7.08 4.13H5.12z" />
        </svg>
      )
    case 'ByteDance':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill={color}>
          <rect x="3" y="9" width="3.5" height="12" rx="1.75" />
          <rect x="10.25" y="4" width="3.5" height="17" rx="1.75" />
          <rect x="17.5" y="2" width="3.5" height="19" rx="1.75" />
        </svg>
      )
    case 'MiniMax':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill={color}>
          <rect x="1.5" y="11" width="3" height="4" rx="1.5" />
          <rect x="6" y="7.5" width="3" height="11" rx="1.5" />
          <rect x="10.5" y="4" width="3" height="17" rx="1.5" />
          <rect x="15" y="7.5" width="3" height="11" rx="1.5" />
          <rect x="19.5" y="11" width="3" height="4" rx="1.5" />
        </svg>
      )
    case 'Black Forest':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill={color}>
          <path d="M12 2L5.5 13.5h4V21h5v-7.5h4.5L12 2zm0 4.5l3.8 6H14v7h-4v-7H8.2L12 6.5z" />
        </svg>
      )
    case 'Kling':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill={color}>
          <path d="M17.65 6.35A7.96 7.96 0 0012 4c-4.42 0-7.99 3.58-8 8-.01 4.43 3.58 8 8 8 3.73 0 6.84-2.56 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
        </svg>
      )
    case 'Runway':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill={color}>
          <path d="M4 3h8.5A5.5 5.5 0 0118 8.5c0 2.3-1.41 4.27-3.44 5.09L18 21h-3.5l-3.28-7H7v7H4V3zm3 3v5h5.5a2.5 2.5 0 000-5H7z" />
        </svg>
      )
    default:
      return null
  }
}

function ProviderIcon({ provider }: { provider: ModelProvider }) {
  const tone = MODEL_TONE_STYLES[provider.tone]
  const dimension = MODEL_NODE_DIMENSIONS[provider.size]
  const iconSize = Math.round(dimension.orb * 0.46)

  const brandSvg = renderBrandSvg(provider.name, tone.text, iconSize)
  if (brandSvg) {
    return (
      <span aria-hidden="true" className="flex items-center justify-center">
        {brandSvg}
      </span>
    )
  }

  return (
    <span
      aria-hidden="true"
      className="flex items-center justify-center font-bold leading-none tracking-[-0.02em]"
      style={{
        color: tone.text,
        fontSize:
          provider.size === 'lg'
            ? '2.4rem'
            : provider.size === 'md'
              ? '1.9rem'
              : '1.5rem',
        textShadow: `0 0 20px ${tone.ring}, 0 0 40px ${tone.glow}`,
      }}
    >
      {provider.fallback}
    </span>
  )
}

export function ModelMindMapSection() {
  const modelT = useTranslations('landing.sections.models')
  const visibleOrbitTime = 0
  const vendorCount = new Set(
    MODEL_PROVIDERS.map((provider) => provider.vendor ?? provider.name),
  ).size

  return (
    <section
      id="models"
      className="relative overflow-hidden bg-[#05070d] px-4 py-14 sm:px-6 lg:px-8 lg:py-16 xl:px-10"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(102,92,255,0.18),transparent_18%),radial-gradient(circle_at_83%_22%,rgba(76,164,255,0.12),transparent_18%),radial-gradient(circle_at_50%_72%,rgba(166,90,255,0.16),transparent_24%),linear-gradient(180deg,#05070d_0%,#04060b_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(136,118,255,0.22),transparent)]" />

      <div className="relative mx-auto w-full max-w-[1440px]">
        <div className="relative px-1 sm:px-2 lg:px-0">
          <div className="pointer-events-none absolute inset-x-[11%] top-[6%] h-[26rem] rounded-full bg-[radial-gradient(circle,rgba(101,78,255,0.12),transparent_62%)] blur-3xl" />
          <div className="pointer-events-none absolute right-[7%] bottom-[10%] h-[14rem] w-[22rem] rounded-full bg-[radial-gradient(circle,rgba(52,110,255,0.08),transparent_68%)] blur-3xl" />

          <div className="relative mx-auto w-full max-w-[1100px]">
            <div className="relative z-10">
              <div className="relative mx-auto aspect-[1400/820] w-full max-w-[1100px]">

              {/* Title overlay — top-left */}
              <div className="absolute top-[6%] left-[3%] z-50 hidden max-w-[26%] lg:block">
                <h2 className="text-[clamp(1.4rem,2.6vw,2.9rem)] font-semibold leading-[1.02] tracking-[-0.05em] text-white">
                  {modelT('title')}
                </h2>
                <p className="mt-3 text-[clamp(0.64rem,0.82vw,0.84rem)] leading-[1.68] text-white/54">
                  {modelT('body')}
                </p>
                <a
                  href="#models"
                  className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-white/14 bg-white/6 px-4 py-2 text-[0.72rem] font-medium text-white/80 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Sparkles size={11} />
                  {modelT('cta')}
                </a>
              </div>
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox={`0 0 ${MODEL_STAGE.width} ${MODEL_STAGE.height}`}
                fill="none"
                aria-hidden="true"
                style={{ opacity: 0.95 }}
              >
                <defs>
                  <filter id="orbit-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <ellipse
                  cx={MODEL_STAGE_CENTER.x}
                  cy={MODEL_STAGE_CENTER.y}
                  rx={MODEL_ORBIT_RADII.outer.x + 34}
                  ry={MODEL_ORBIT_RADII.outer.y + 14}
                  stroke="rgba(88, 108, 220, 0.55)"
                  strokeWidth="1.5"
                  filter="url(#orbit-glow)"
                />
                <ellipse
                  cx={MODEL_STAGE_CENTER.x}
                  cy={MODEL_STAGE_CENTER.y}
                  rx={MODEL_ORBIT_RADII.outer.x}
                  ry={MODEL_ORBIT_RADII.outer.y}
                  stroke="rgba(120, 86, 255, 0.60)"
                  strokeWidth="1.5"
                  filter="url(#orbit-glow)"
                />
                <ellipse
                  cx={MODEL_STAGE_CENTER.x}
                  cy={MODEL_STAGE_CENTER.y}
                  rx={MODEL_ORBIT_RADII.middle.x}
                  ry={MODEL_ORBIT_RADII.middle.y}
                  stroke="rgba(148, 110, 255, 0.52)"
                  strokeWidth="1.3"
                  filter="url(#orbit-glow)"
                />
                <ellipse
                  cx={MODEL_STAGE_CENTER.x}
                  cy={MODEL_STAGE_CENTER.y}
                  rx={MODEL_ORBIT_RADII.inner.x}
                  ry={MODEL_ORBIT_RADII.inner.y}
                  stroke="rgba(140, 112, 255, 0.44)"
                  strokeWidth="1.1"
                  filter="url(#orbit-glow)"
                />

                <path
                  d="M286 312C498 236 660 226 788 264C944 308 1082 306 1248 246"
                  stroke="rgba(114,92,255,0.16)"
                  strokeWidth="0.9"
                  strokeDasharray="3 11"
                />
                <path
                  d="M316 632C500 588 646 578 788 604C956 634 1112 624 1280 526"
                  stroke="rgba(108,154,255,0.14)"
                  strokeWidth="0.88"
                  strokeDasharray="3 11"
                />
                <path
                  d="M452 176C628 152 904 152 1088 202"
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
                      style={{ opacity: 0.65 }}
                    />
                  )
                })}
              </svg>

              <div
                className="absolute z-40 h-[37vw] max-h-[292px] w-[37vw] max-w-[292px] rounded-full border border-[#c590ff]/30 bg-[radial-gradient(circle_at_50%_18%,#fff5ff,#d388ff_30%,#914aff_56%,#4e18b6_78%,#0e0824_100%)] md:h-[272px] md:w-[272px]"
                style={{
                  left: `calc(${MODEL_CORE_POSITION.x}% + ${MODEL_CORE_OFFSET_X}px)`,
                  top: `${MODEL_CORE_POSITION.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="absolute inset-[16px] rounded-full border border-white/12" />
                <div className="absolute inset-[-18px] rounded-full border border-[#9567ff]/16" />
                <div className="absolute inset-[-52px] rounded-full bg-[radial-gradient(circle,rgba(162,101,255,0.34),transparent_62%)] blur-2xl" />
                <div className="relative flex h-full flex-col items-center justify-center px-5 text-center">
                  <svg className="mb-1.5 h-8 w-8 text-white/72" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
                  </svg>
                  <p className="text-[1.05rem] leading-[1.02] font-semibold tracking-[-0.04em] text-white md:text-[1.26rem]">
                    Nano Banana
                  </p>
                  <p className="mt-0.5 text-[1.05rem] leading-[1.02] font-semibold tracking-[-0.04em] text-white/94 md:text-[1.26rem]">
                    Canvas
                  </p>
                  <p className="mt-2 text-[0.58rem] font-medium tracking-[0.12em] text-white/55 uppercase">
                    {modelT('centerBody')}
                  </p>
                </div>
              </div>

              {MODEL_PROVIDERS.map((provider) => {
                const tone = MODEL_TONE_STYLES[provider.tone]
                const dimension = MODEL_NODE_DIMENSIONS[provider.size]
                const orbitRadii = MODEL_ORBIT_RADII[provider.orbit]
                const laneOffset = provider.lane ?? 0
                const orbitRadiusX = orbitRadii.x + laneOffset * 44
                const orbitRadiusY = orbitRadii.y + laneOffset * 18
                const orbitAngle =
                  ((provider.angle + visibleOrbitTime * provider.speed) * Math.PI) / 180
                const orbitDepth = (Math.sin(orbitAngle) + 1) / 2
                const depthScale = 0.84 + orbitDepth * 0.24
                const nodeOpacity = 0.78 + orbitDepth * 0.22
                const nodeZIndex =
                  orbitDepth > 0.52
                    ? 42 + Math.round((orbitDepth - 0.52) * 28)
                    : 14 + Math.round(orbitDepth * 26)
                const nodeDepthFilter = `brightness(${0.74 + orbitDepth * 0.26}) saturate(${
                  0.86 + orbitDepth * 0.14
                }) blur(${(1 - orbitDepth) * 0.45}px)`
                const currentX =
                  MODEL_CORE_POSITION.x +
                  (Math.cos(orbitAngle) * orbitRadiusX * 100) / MODEL_STAGE.width
                const currentY =
                  MODEL_CORE_POSITION.y +
                  (Math.sin(orbitAngle) * orbitRadiusY * 100) / MODEL_STAGE.height
                return (
                  <div
                    key={provider.name}
                    className="absolute"
                    style={{
                      left: `${currentX}%`,
                      top: `${currentY}%`,
                      zIndex: nodeZIndex,
                      opacity: nodeOpacity,
                      filter: nodeDepthFilter,
                      transform: `translate(-50%, -50%) scale(${depthScale})`,
                    }}
                  >
                    <div className="relative flex flex-col items-center">
                      <div
                        className="relative shrink-0 rounded-full border"
                        style={{
                          height: `${dimension.orb}px`,
                          width: `${dimension.orb}px`,
                          borderColor: tone.ring,
                          background: tone.fill,
                          boxShadow: `0 0 0 8px ${tone.glow}, 0 18px 44px rgba(0,0,0,0.32)`,
                        }}
                      >
                        <div className="absolute inset-[8px] rounded-full border border-white/10" />
                        <div className="flex h-full items-center justify-center">
                          <ProviderIcon provider={provider} />
                        </div>
                      </div>
                      <p
                        className="mt-2 whitespace-nowrap text-center font-medium text-white/90"
                        style={{ fontSize: provider.size === 'lg' ? '0.74rem' : '0.66rem' }}
                      >
                        {provider.name}
                      </p>
                    </div>
                  </div>
                )
              })}
              </div>
            </div>

            {/* Mobile title — shown below canvas on small screens */}
            <div className="relative z-30 px-4 pb-4 pt-6 lg:hidden">
              <h2 className="text-[2rem] font-semibold leading-[1.02] tracking-[-0.05em] text-white">
                {modelT('title')}
              </h2>
              <p className="mt-3 text-[0.9rem] leading-7 text-white/54">
                {modelT('body')}
              </p>
            </div>
          </div>

          <div
            className="relative z-20 mt-1 xl:mt-0"
          >
            <div className="mx-auto flex w-full max-w-[980px] flex-col gap-4 border-t border-white/8 pt-6 md:flex-row md:flex-wrap md:items-start md:justify-between md:gap-5 xl:flex-nowrap">
              {MODEL_STATS.map((item, index) => {
                const Icon = item.icon

                return (
                  <div
                    key={item.key}
                    className="relative flex min-w-0 flex-1 items-start gap-3 md:max-w-[calc(50%-0.75rem)] xl:max-w-none"
                  >
                    {index > 0 ? (
                      <div className="absolute -left-2.5 hidden h-12 w-px bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.12),transparent)] xl:block" />
                    ) : null}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/82">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-[1.4rem] leading-none font-semibold tracking-tight text-white md:text-[1.62rem]">
                        {item.key === 'vendors'
                          ? modelT('stats.vendors.value', { count: vendorCount })
                          : modelT(`stats.${item.key}.value`)}
                      </p>
                      <p className="mt-1.5 text-sm font-medium text-white/88">
                        {modelT(`stats.${item.key}.label`)}
                      </p>
                      <p className="mt-1 max-w-[13rem] text-xs leading-5 text-white/46 md:text-[0.9rem] md:leading-6">
                        {modelT(`stats.${item.key}.body`)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
