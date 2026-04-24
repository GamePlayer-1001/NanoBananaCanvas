/**
 * [INPUT]: 依赖 react 的 useState/useCallback/useRef/useEffect，
 *          依赖 next-intl 的 useTranslations，依赖 @/i18n/navigation 的 Link，
 *          依赖 @/components/shared/brand-mark
 * [OUTPUT]: 对外提供 HeroSection 交互式画板组件
 * [POS]: landing 的主视觉区域，被 (landing)/page.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

import { BrandMark } from '@/components/shared/brand-mark'
import { Link } from '@/i18n/navigation'

/* ─── Types ──────────────────────────────────────────────── */

type HeroArtwork = 'feature' | 'portrait' | 'merge' | 'landscape' | 'scene' | 'motion'

interface DemoNode {
  id: string
  labelKey: string
  model: string
  artwork: HeroArtwork
  x: number
  y: number
  w: number
  h: number
}

interface Connection {
  from: string
  to: string
  route?: 'rightArc'
}

/* ─── Constants ──────────────────────────────────────────── */

const INITIAL_NODES: DemoNode[] = [
  {
    id: 'a',
    labelKey: 'feature',
    model: 'FLUX Pro',
    artwork: 'feature',
    x: 416,
    y: 28,
    w: 248,
    h: 220,
  },
  {
    id: 'b',
    labelKey: 'portrait',
    model: 'Midjourney',
    artwork: 'portrait',
    x: 76,
    y: 150,
    w: 244,
    h: 320,
  },
  {
    id: 'c',
    labelKey: 'merge',
    model: 'Nano Banana',
    artwork: 'merge',
    x: 820,
    y: 104,
    w: 252,
    h: 320,
  },
  {
    id: 'd',
    labelKey: 'landscape',
    model: 'Runway',
    artwork: 'landscape',
    x: 500,
    y: 404,
    w: 292,
    h: 170,
  },
  {
    id: 'e',
    labelKey: 'scene',
    model: 'Kling 1.6',
    artwork: 'scene',
    x: 1184,
    y: 210,
    w: 252,
    h: 220,
  },
  {
    id: 'f',
    labelKey: 'motion',
    model: 'Vidu Motion',
    artwork: 'motion',
    x: 1538,
    y: 168,
    w: 224,
    h: 284,
  },
]

const CONNECTIONS: Connection[] = [
  { from: 'a', to: 'c' },
  { from: 'b', to: 'c' },
  { from: 'c', to: 'e' },
  { from: 'd', to: 'e', route: 'rightArc' },
  { from: 'e', to: 'f' },
]

/* ─── Bezier Path ────────────────────────────────────────── */

function bezierPath(
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  route?: Connection['route'],
): string {
  if (route === 'rightArc') {
    const cx = Math.max(sx, tx) + 280
    return `M ${sx} ${sy} C ${cx} ${sy}, ${cx} ${ty}, ${tx} ${ty}`
  }

  const dx = Math.abs(tx - sx) * 0.5
  return `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`
}

/* ─── Connection Line ────────────────────────────────────── */

function ConnectionLine({
  from,
  to,
  nodes,
  route,
}: {
  from: string
  to: string
  nodes: DemoNode[]
  route?: Connection['route']
}) {
  const s = nodes.find((node) => node.id === from)
  const t = nodes.find((node) => node.id === to)
  if (!s || !t) return null

  const sx = s.x + s.w
  const sy = s.y + s.h / 2
  const tx = t.x
  const ty = t.y + t.h / 2
  const d = bezierPath(sx, sy, tx, ty, route)

  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke="rgba(255,255,255,0.32)"
        strokeWidth={1.8}
        strokeOpacity={0.95}
      />
      <circle r={3.5} fill="rgba(165,180,252,0.96)" opacity={0.92}>
        <animateMotion dur="4.2s" repeatCount="indefinite" path={d} />
      </circle>
    </g>
  )
}

/* ─── Artwork Nodes ──────────────────────────────────────── */

function FeatureArtwork() {
  return (
    <svg viewBox="0 0 248 220" className="h-full w-full">
      <defs>
        <linearGradient id="hero-feature-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0d1330" />
          <stop offset="100%" stopColor="#1a1737" />
        </linearGradient>
        <radialGradient id="hero-feature-glow" cx="52%" cy="44%" r="56%">
          <stop offset="0%" stopColor="#7082ff" />
          <stop offset="55%" stopColor="#ff8a88" />
          <stop offset="100%" stopColor="#0d1020" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="248" height="220" rx="26" fill="url(#hero-feature-bg)" />
      <circle cx="126" cy="112" r="98" fill="url(#hero-feature-glow)" opacity="0.94" />
      <ellipse cx="124" cy="112" rx="62" ry="40" fill="#12172d" opacity="0.94" />
      <ellipse cx="124" cy="112" rx="48" ry="28" fill="#09101e" />
      <circle cx="124" cy="112" r="23" fill="#1a2358" />
      <circle cx="124" cy="112" r="16" fill="#060b19" />
      <circle cx="130" cy="106" r="6" fill="#f6f6ff" />
      <path
        d="M70 112c10-19 31-34 54-34 25 0 46 15 56 34"
        fill="none"
        stroke="#ffc0cb"
        strokeWidth={5}
        strokeLinecap="round"
        opacity="0.72"
      />
    </svg>
  )
}

function PortraitArtwork() {
  return (
    <svg viewBox="0 0 244 320" className="h-full w-full">
      <defs>
        <linearGradient id="hero-portrait-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#071225" />
          <stop offset="100%" stopColor="#130f35" />
        </linearGradient>
        <radialGradient id="hero-portrait-hair" cx="45%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#6f68ff" />
          <stop offset="58%" stopColor="#4f57ff" />
          <stop offset="100%" stopColor="#39d7ff" />
        </radialGradient>
        <linearGradient id="hero-portrait-skin" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#ffb0d8" />
          <stop offset="100%" stopColor="#6ee4ff" />
        </linearGradient>
      </defs>
      <rect width="244" height="320" rx="28" fill="url(#hero-portrait-bg)" />
      <circle cx="92" cy="92" r="58" fill="#2c36aa" opacity="0.42" />
      <ellipse cx="118" cy="118" rx="74" ry="100" fill="url(#hero-portrait-hair)" />
      <ellipse cx="139" cy="144" rx="42" ry="60" fill="url(#hero-portrait-skin)" />
      <path d="M142 201c16 8 32 29 36 73H73c10-37 30-61 69-73Z" fill="#5a48d6" />
      <path d="M137 206c12 8 22 23 29 48" stroke="#63f4ff" strokeWidth={8} strokeLinecap="round" />
      <circle cx="155" cy="140" r="5" fill="#171826" />
      <path d="M156 161c-8 11-17 18-27 22" stroke="#ff8a89" strokeWidth={5} strokeLinecap="round" />
      <circle cx="111" cy="150" r="8" fill="#6ce2ff" opacity="0.95" />
    </svg>
  )
}

function MergeArtwork() {
  return (
    <svg viewBox="0 0 252 320" className="h-full w-full">
      <defs>
        <linearGradient id="hero-merge-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#041315" />
          <stop offset="100%" stopColor="#0b1228" />
        </linearGradient>
        <radialGradient id="hero-merge-hair" cx="48%" cy="18%" r="72%">
          <stop offset="0%" stopColor="#6d6bff" />
          <stop offset="62%" stopColor="#4058ff" />
          <stop offset="100%" stopColor="#6be6ff" />
        </radialGradient>
        <linearGradient id="hero-merge-skin" x1="20%" y1="12%" x2="84%" y2="88%">
          <stop offset="0%" stopColor="#ffc1e0" />
          <stop offset="100%" stopColor="#84dcff" />
        </linearGradient>
      </defs>
      <rect width="252" height="320" rx="28" fill="url(#hero-merge-bg)" />
      <ellipse cx="126" cy="108" rx="80" ry="84" fill="url(#hero-merge-hair)" />
      <ellipse cx="126" cy="156" rx="54" ry="66" fill="url(#hero-merge-skin)" />
      <path
        d="M96 214c17 10 45 12 60 0 27 13 42 34 47 69H49c9-33 26-56 47-69Z"
        fill="#5548d3"
      />
      <path d="M105 240c19 10 42 10 61 0" stroke="#65f0ff" strokeWidth={9} strokeLinecap="round" />
      <circle cx="108" cy="150" r="10" fill="#0d1630" />
      <circle cx="144" cy="150" r="10" fill="#0d1630" />
      <circle cx="111" cy="149" r="4" fill="#fff" />
      <circle cx="147" cy="149" r="4" fill="#fff" />
      <path d="M109 182c14 14 25 14 34 0" stroke="#ff8d92" strokeWidth={6} strokeLinecap="round" />
      <circle cx="92" cy="174" r="12" fill="#ff8ba0" opacity="0.45" />
      <circle cx="160" cy="174" r="12" fill="#ff8ba0" opacity="0.45" />
    </svg>
  )
}

function LandscapeArtwork() {
  return (
    <svg viewBox="0 0 292 170" className="h-full w-full">
      <defs>
        <linearGradient id="hero-landscape-sky" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#050b1e" />
          <stop offset="55%" stopColor="#1c1c4d" />
          <stop offset="100%" stopColor="#0c2731" />
        </linearGradient>
        <linearGradient id="hero-landscape-ground" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#172d45" />
          <stop offset="100%" stopColor="#10211f" />
        </linearGradient>
      </defs>
      <rect width="292" height="170" rx="28" fill="url(#hero-landscape-sky)" />
      <circle cx="220" cy="40" r="18" fill="#ffe8ad" opacity="0.88" />
      <g fill="#fff" opacity="0.66">
        <circle cx="48" cy="34" r="1.5" />
        <circle cx="68" cy="56" r="1.2" />
        <circle cx="100" cy="42" r="1.8" />
        <circle cx="142" cy="32" r="1.3" />
        <circle cx="176" cy="60" r="1.4" />
        <circle cx="244" cy="70" r="1.2" />
      </g>
      <path
        d="M0 112c33-28 64-32 98-12 30 18 54 19 82 6 37-17 69-16 112 16v48H0Z"
        fill="url(#hero-landscape-ground)"
      />
      <path
        d="M0 130c44-19 77-21 110-6 31 14 64 14 98-3 29-15 56-15 84 7v42H0Z"
        fill="#0d171f"
        opacity="0.9"
      />
      <path
        d="M204 77 219 53l14 24"
        stroke="#b1fff4"
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  )
}

function SceneArtwork() {
  return (
    <svg viewBox="0 0 252 220" className="h-full w-full">
      <defs>
        <linearGradient id="hero-scene-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06131f" />
          <stop offset="55%" stopColor="#14234d" />
          <stop offset="100%" stopColor="#08221e" />
        </linearGradient>
        <radialGradient id="hero-scene-hair" cx="40%" cy="26%" r="68%">
          <stop offset="0%" stopColor="#6f69ff" />
          <stop offset="60%" stopColor="#4d57ff" />
          <stop offset="100%" stopColor="#48d8ff" />
        </radialGradient>
      </defs>
      <rect width="252" height="220" rx="28" fill="url(#hero-scene-bg)" />
      <circle cx="208" cy="34" r="12" fill="#ffe7a6" opacity="0.76" />
      <path
        d="M0 150c42-28 79-30 117-9 30 16 57 16 82 3 18-9 35-10 53 4v76H0Z"
        fill="#122534"
      />
      <ellipse cx="103" cy="72" rx="50" ry="50" fill="url(#hero-scene-hair)" />
      <ellipse cx="106" cy="109" rx="35" ry="44" fill="#ffbfdc" />
      <path d="M84 147c11 6 28 8 42 0 15 8 24 23 28 44H47c7-21 18-36 37-44Z" fill="#5c4dd6" />
      <path d="M98 164c14 8 30 8 44 0" stroke="#68f0ff" strokeWidth={7} strokeLinecap="round" />
      <circle cx="115" cy="105" r="5" fill="#13182b" />
      <path d="M118 123c-8 8-15 12-24 16" stroke="#ff8e95" strokeWidth={4} strokeLinecap="round" />
    </svg>
  )
}

function MotionArtwork() {
  return (
    <svg viewBox="0 0 224 284" className="h-full w-full">
      <defs>
        <linearGradient id="hero-motion-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#091120" />
          <stop offset="55%" stopColor="#101b44" />
          <stop offset="100%" stopColor="#0a2420" />
        </linearGradient>
        <linearGradient id="hero-motion-trail" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6e69ff" stopOpacity="0" />
          <stop offset="100%" stopColor="#78e4ff" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <rect width="224" height="284" rx="28" fill="url(#hero-motion-bg)" />
      <path d="M0 214c43-24 80-24 118-7 29 13 63 15 106-5v82H0Z" fill="#112132" />
      <g opacity="0.28">
        <ellipse cx="86" cy="86" rx="42" ry="44" fill="#5b63ff" />
        <ellipse cx="88" cy="120" rx="29" ry="38" fill="#ffbfdc" />
      </g>
      <g opacity="0.52">
        <ellipse cx="102" cy="80" rx="44" ry="46" fill="#5f65ff" />
        <ellipse cx="104" cy="118" rx="30" ry="39" fill="#ffc2dd" />
      </g>
      <g>
        <ellipse cx="120" cy="74" rx="46" ry="48" fill="#6467ff" />
        <ellipse cx="120" cy="116" rx="32" ry="41" fill="#ffc3de" />
        <path
          d="M100 156c9 6 27 6 40 0 16 10 24 28 27 52H63c5-23 18-42 37-52Z"
          fill="#5d4fd6"
        />
        <path d="M111 178c11 8 25 8 36 0" stroke="#68f0ff" strokeWidth={7} strokeLinecap="round" />
        <circle cx="129" cy="111" r="5" fill="#13192d" />
      </g>
      <path d="M22 188h72" stroke="url(#hero-motion-trail)" strokeWidth={7} strokeLinecap="round">
        <animate attributeName="opacity" values="0.2;0.8;0.2" dur="2.2s" repeatCount="indefinite" />
      </path>
      <circle cx="174" cy="70" r="7" fill="#fff1b1" opacity="0.9">
        <animate attributeName="cy" values="70;66;70" dur="2.4s" repeatCount="indefinite" />
      </circle>
    </svg>
  )
}

function NodeArtwork({ artwork }: { artwork: HeroArtwork }) {
  if (artwork === 'feature') return <FeatureArtwork />
  if (artwork === 'portrait') return <PortraitArtwork />
  if (artwork === 'merge') return <MergeArtwork />
  if (artwork === 'landscape') return <LandscapeArtwork />
  if (artwork === 'scene') return <SceneArtwork />
  return <MotionArtwork />
}

/* ─── Demo Node Card ─────────────────────────────────────── */

function DemoNodeCard({
  node,
  label,
  mediaLabel,
  onPointerDown,
}: {
  node: DemoNode
  label: string
  mediaLabel: string
  onPointerDown: (e: React.PointerEvent, id: string) => void
}) {
  return (
    <div
      className="group absolute cursor-grab select-none active:cursor-grabbing"
      style={{ left: node.x, top: node.y, width: node.w, height: node.h }}
      onPointerDown={(e) => onPointerDown(e, node.id)}
    >
      <div className="pointer-events-none absolute -top-5 left-1 text-[11px] text-white/42">
        {label}
      </div>
      <div className="pointer-events-none absolute -top-5 right-1 text-[11px] text-white/42">
        {node.model}
      </div>

      <div className="relative h-full w-full overflow-hidden rounded-[26px] border border-white/10 bg-[#090b14] shadow-[0_24px_80px_rgba(0,0,0,0.28)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_30px_96px_rgba(0,0,0,0.38)]">
        <div className="absolute top-1/2 -left-1.5 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white/20 bg-white/10" />
        <div className="bg-brand-500/40 absolute top-1/2 -right-1.5 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white/30" />
        <NodeArtwork artwork={node.artwork} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="pointer-events-none absolute right-3 bottom-3 rounded-full border border-white/14 bg-black/28 px-2.5 py-1 text-[10px] tracking-[0.18em] text-white/76 uppercase backdrop-blur-sm">
          {mediaLabel}
        </div>
      </div>
    </div>
  )
}

/* ─── Main Component ─────────────────────────────────────── */

export function HeroSection() {
  const t = useTranslations('landing.hero')
  const containerRef = useRef<HTMLDivElement>(null)
  const [nodes, setNodes] = useState<DemoNode[]>(INITIAL_NODES)
  const [scale, setScale] = useState(1)
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null)

  useEffect(() => {
    function updateScale() {
      if (!containerRef.current) return
      const width = containerRef.current.clientWidth
      setScale(Math.min(1, width / 1500))
    }

    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, id: string) => {
      if (scale < 0.66) return

      const node = nodes.find((item) => item.id === id)
      if (!node || !containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      dragRef.current = {
        id,
        offsetX: e.clientX / scale - rect.left / scale - node.x,
        offsetY: e.clientY / scale - rect.top / scale - node.y,
      }
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    },
    [nodes, scale],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current
      if (!drag || !containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX / scale - rect.left / scale - drag.offsetX
      const y = e.clientY / scale - rect.top / scale - drag.offsetY

      setNodes((prev) => prev.map((node) => (node.id === drag.id ? { ...node, x, y } : node)))
    },
    [scale],
  )

  const handlePointerUp = useCallback(() => {
    dragRef.current = null
  }, [])

  const canvasW = 1800
  const canvasH = 620

  return (
    <section className="relative flex min-h-[calc(100vh-64px)] items-center justify-center overflow-hidden bg-[#0a0a0a] pt-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="bg-brand-500/8 pointer-events-none absolute top-1/2 left-1/2 h-[680px] w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[170px]" />

      <div
        ref={containerRef}
        className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-10"
        style={{ height: canvasH * scale }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div
          className="origin-top-center absolute left-1/2"
          style={{
            width: canvasW,
            height: canvasH,
            transform: `translateX(-50%) scale(${scale})`,
          }}
        >
          <svg
            className="pointer-events-none absolute inset-0"
            width={canvasW}
            height={canvasH}
          >
            {CONNECTIONS.map((connection) => (
              <ConnectionLine
                key={`${connection.from}-${connection.to}`}
                from={connection.from}
                to={connection.to}
                nodes={nodes}
                route={connection.route}
              />
            ))}
          </svg>

          {nodes.map((node) => (
            <DemoNodeCard
              key={node.id}
              node={node}
              label={t(`nodes.${node.labelKey}`)}
              mediaLabel={t(node.artwork === 'motion' ? 'badges.video' : 'badges.image')}
              onPointerDown={handlePointerDown}
            />
          ))}
        </div>

        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div className="pointer-events-none text-center">
            <h2 className="mb-1">
              <BrandMark className="text-3xl text-white/82 md:text-4xl">
                {t('heading')}
              </BrandMark>
            </h2>

            <h1 className="from-brand-300 mb-4 bg-gradient-to-r to-white bg-clip-text text-3xl font-bold text-transparent md:text-5xl">
              {t('tagline')}
            </h1>

            <p className="mb-6 px-4 text-xs leading-relaxed whitespace-pre-line text-white/40 md:text-sm">
              {t('description')}
            </p>

            <Link
              href="/sign-in"
              className="pointer-events-auto inline-flex h-11 items-center rounded-lg bg-white px-7 text-sm font-medium text-black shadow-[0_18px_60px_rgba(255,255,255,0.14)] transition-all hover:bg-white/88"
            >
              {t('cta')}
            </Link>

            <p className="mt-3 text-[11px] tracking-wide text-white/25">{t('models')}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
