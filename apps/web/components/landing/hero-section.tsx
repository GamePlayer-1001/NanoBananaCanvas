/**
 * [INPUT]: 依赖 react 的 useState/useCallback/useRef/useEffect，
 *          依赖 next/image 的 Image，
 *          依赖 next-intl 的 useTranslations，依赖 @/i18n/navigation 的 Link，
 *          依赖 @/components/shared/brand-mark
 * [OUTPUT]: 对外提供 HeroSection 交互式画板组件
 * [POS]: landing 的主视觉区域，被 (landing)/page.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
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
}

interface StageSize {
  width: number
  height: number
}

interface HeroMediaSpec {
  kind: 'image' | 'video'
  src: string
  objectPosition?: string
  poster?: string
}

/* ─── Constants ──────────────────────────────────────────── */

const DESIGN_STAGE_WIDTH = 1800
const DESIGN_STAGE_HEIGHT = 620

function toResponsiveNode(node: {
  id: string
  labelKey: string
  model: string
  artwork: HeroArtwork
  x: number
  y: number
  w: number
  h: number
}): DemoNode {
  return {
    ...node,
    x: node.x / (DESIGN_STAGE_WIDTH - node.w),
    y: node.y / (DESIGN_STAGE_HEIGHT - node.h),
  }
}

const INITIAL_NODE_BLUEPRINTS: Array<{
  id: string
  labelKey: string
  model: string
  artwork: HeroArtwork
  x: number
  y: number
  w: number
  h: number
}> = [
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
    x: 1482,
    y: 180,
    w: 304,
    h: 212,
  },
]

const INITIAL_NODES: DemoNode[] = INITIAL_NODE_BLUEPRINTS.map(toResponsiveNode)

const CONNECTIONS: Connection[] = [
  { from: 'a', to: 'c' },
  { from: 'b', to: 'c' },
  { from: 'c', to: 'e' },
  { from: 'd', to: 'e' },
  { from: 'e', to: 'f' },
]

const HERO_MIN_STAGE_HEIGHT = 700
const HERO_MEDIA: Record<HeroArtwork, HeroMediaSpec> = {
  feature: {
    kind: 'image',
    src: '/landing/hero/hero-eye.png',
    objectPosition: 'center center',
  },
  portrait: {
    kind: 'image',
    src: '/landing/hero/hero-girl.png',
    objectPosition: 'center 24%',
  },
  merge: {
    kind: 'image',
    src: '/landing/hero/hero-merge.png',
    objectPosition: 'center 20%',
  },
  landscape: {
    kind: 'image',
    src: '/landing/hero/hero-landscape.png',
    objectPosition: 'center center',
  },
  scene: {
    kind: 'image',
    src: '/landing/hero/hero-scene.png',
    objectPosition: 'center center',
  },
  motion: {
    kind: 'video',
    src: '/landing/hero/hero-motion.mp4',
    poster: '/landing/hero/hero-scene.png',
    objectPosition: 'center center',
  },
}

function getNodeScale(stage: StageSize) {
  return Math.min(stage.width / DESIGN_STAGE_WIDTH, stage.height / DESIGN_STAGE_HEIGHT)
}

function resolveNodeRect(node: DemoNode, stage: StageSize) {
  const scale = getNodeScale(stage)
  const w = node.w * scale
  const h = node.h * scale
  const maxX = Math.max(stage.width - w, 0)
  const maxY = Math.max(stage.height - h, 0)

  return {
    x: node.x * maxX,
    y: node.y * maxY,
    w,
    h,
  }
}

/* ─── Bezier Path ────────────────────────────────────────── */

function bezierPath(sx: number, sy: number, tx: number, ty: number): string {
  const dx = Math.abs(tx - sx) * 0.5
  return `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`
}

/* ─── Connection Line ────────────────────────────────────── */

function ConnectionLine({
  from,
  to,
  nodes,
  stage,
}: {
  from: string
  to: string
  nodes: DemoNode[]
  stage: StageSize
}) {
  const s = nodes.find((node) => node.id === from)
  const t = nodes.find((node) => node.id === to)
  if (!s || !t) return null

  const source = resolveNodeRect(s, stage)
  const target = resolveNodeRect(t, stage)
  const sx = source.x + source.w
  const sy = source.y + source.h / 2
  const tx = target.x
  const ty = target.y + target.h / 2
  const d = bezierPath(sx, sy, tx, ty)

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

function HeroMedia({ artwork, label }: { artwork: HeroArtwork; label: string }) {
  const media = HERO_MEDIA[artwork]

  if (media.kind === 'video') {
    return (
      <video
        className="pointer-events-none h-full w-full object-cover select-none"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        poster={media.poster}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        style={{ objectPosition: media.objectPosition }}
      >
        <source src={media.src} type="video/mp4" />
      </video>
    )
  }

  return (
    <Image
      src={media.src}
      alt={label}
      fill
      sizes="(max-width: 768px) 40vw, 22vw"
      className="pointer-events-none object-cover select-none"
      draggable={false}
      style={{ objectPosition: media.objectPosition }}
    />
  )
}

/* ─── Demo Node Card ─────────────────────────────────────── */

function DemoNodeCard({
  node,
  stage,
  label,
  mediaLabel,
  onPointerDown,
}: {
  node: DemoNode
  stage: StageSize
  label: string
  mediaLabel: string
  onPointerDown: (e: React.PointerEvent, id: string) => void
}) {
  const rect = resolveNodeRect(node, stage)

  return (
    <div
      className="group absolute cursor-grab touch-none select-none active:cursor-grabbing"
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        e.preventDefault()
        onPointerDown(e, node.id)
      }}
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
        <div className="pointer-events-none absolute inset-0 select-none">
          <HeroMedia artwork={node.artwork} label={label} />
        </div>
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
  const [stageSize, setStageSize] = useState<StageSize>({
    width: DESIGN_STAGE_WIDTH,
    height: HERO_MIN_STAGE_HEIGHT,
  })
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null)
  const nodeScale = getNodeScale(stageSize)

  useEffect(() => {
    if (!containerRef.current) return

    function updateStageSize() {
      if (!containerRef.current) return
      setStageSize({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      })
    }

    const observer = new ResizeObserver(updateStageSize)
    observer.observe(containerRef.current)
    updateStageSize()
    window.addEventListener('resize', updateStageSize)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateStageSize)
    }
  }, [])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, id: string) => {
      if (nodeScale < 0.66) return

      const node = nodes.find((item) => item.id === id)
      if (!node || !containerRef.current) return

      const nodeRect = resolveNodeRect(node, stageSize)
      const rect = containerRef.current.getBoundingClientRect()
      dragRef.current = {
        id,
        offsetX: e.clientX - rect.left - nodeRect.x,
        offsetY: e.clientY - rect.top - nodeRect.y,
      }
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    },
    [nodeScale, nodes, stageSize],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current
      if (!drag || !containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const rawX = e.clientX - rect.left - drag.offsetX
      const rawY = e.clientY - rect.top - drag.offsetY

      setNodes((prev) =>
        prev.map((node) => {
          if (node.id !== drag.id) return node

          const nodeRect = resolveNodeRect(node, stageSize)
          const maxX = Math.max(stageSize.width - nodeRect.w, 0)
          const maxY = Math.max(stageSize.height - nodeRect.h, 0)

          return {
            ...node,
            x: maxX === 0 ? 0 : Math.min(Math.max(rawX, 0), maxX) / maxX,
            y: maxY === 0 ? 0 : Math.min(Math.max(rawY, 0), maxY) / maxY,
          }
        }),
      )
    },
    [stageSize],
  )

  const handlePointerUp = useCallback(() => {
    dragRef.current = null
  }, [])

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
        className="relative h-[calc(100vh-64px)] min-h-[700px] w-full px-4 sm:px-6 lg:px-8 xl:px-10"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div className="absolute inset-0 overflow-visible">
          <svg
            className="pointer-events-none absolute inset-0 overflow-visible"
            width={stageSize.width}
            height={stageSize.height}
            style={{ overflow: 'visible' }}
          >
            {CONNECTIONS.map((connection) => (
              <ConnectionLine
                key={`${connection.from}-${connection.to}`}
                from={connection.from}
                to={connection.to}
                nodes={nodes}
                stage={stageSize}
              />
            ))}
          </svg>

          {nodes.map((node) => (
            <DemoNodeCard
              key={node.id}
              node={node}
              stage={stageSize}
              label={t(`nodes.${node.labelKey}`)}
              mediaLabel={t(node.artwork === 'motion' ? 'badges.video' : 'badges.image')}
              onPointerDown={handlePointerDown}
            />
          ))}
        </div>

        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-6">
          <div className="pointer-events-none mx-auto max-w-[860px] text-center">
            <h2 className="mb-2 md:mb-3">
              <BrandMark
                withLogo
                className="text-4xl text-white/84 drop-shadow-[0_8px_28px_rgba(255,255,255,0.16)] md:text-5xl lg:text-6xl"
              >
                {t('heading')}
              </BrandMark>
            </h2>

            <h1 className="from-brand-300 mb-5 bg-gradient-to-r to-white bg-clip-text text-5xl leading-[0.92] font-bold tracking-tight text-transparent drop-shadow-[0_18px_46px_rgba(169,180,255,0.2)] sm:text-6xl md:mb-6 md:text-7xl lg:text-[84px]">
              {t('tagline')}
            </h1>

            <p className="mx-auto mb-5 max-w-[720px] px-4 text-lg leading-relaxed text-white/72 md:text-[1.35rem]">
              {t('models')}
            </p>

            <p className="mx-auto mb-8 max-w-[760px] px-4 text-base leading-relaxed whitespace-pre-line text-white/56 md:mb-9 md:text-lg">
              {t('description')}
            </p>

            <Link
              href="/sign-in"
              className="pointer-events-auto inline-flex h-14 items-center rounded-2xl bg-white px-9 text-base font-semibold text-black shadow-[0_22px_70px_rgba(255,255,255,0.18)] transition-all hover:bg-white/88 md:h-16 md:px-11 md:text-lg"
            >
              {t('cta')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
