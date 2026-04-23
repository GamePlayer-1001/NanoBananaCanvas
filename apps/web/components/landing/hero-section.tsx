/**
 * [INPUT]: 依赖 react 的 useEffect/useRef/useState，依赖 next-intl 的 useTranslations，
 *          依赖 @/components/shared/brand-mark，依赖 @/components/ui/button，
 *          依赖 @/i18n/navigation 的 Link
 * [OUTPUT]: 对外提供 HeroSection 黑白电影感图像节点画板组件
 * [POS]: landing 的首屏叙事区，被 (landing)/page.tsx 消费，负责表达 1+1=2 的生成逻辑
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Play } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { BrandMark } from '@/components/shared/brand-mark'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

type VisualTone =
  | 'face'
  | 'portrait'
  | 'fusion'
  | 'landscape'
  | 'scene'
  | 'motion'

interface DemoNode {
  id: string
  eyebrowKey: string
  titleKey: string
  noteKey: string
  tone: VisualTone
  x: number
  y: number
  w: number
  h: number
}

interface Connection {
  from: string
  to: string
  route?: 'downArc'
}

const CANVAS_WIDTH = 1440
const CANVAS_HEIGHT = 760
const DRAG_PADDING = 22

const INITIAL_NODES: DemoNode[] = [
  {
    id: 'face',
    eyebrowKey: 'nodeFaceEyebrow',
    titleKey: 'nodeFaceTitle',
    noteKey: 'nodeFaceNote',
    tone: 'face',
    x: 72,
    y: 84,
    w: 236,
    h: 198,
  },
  {
    id: 'portrait',
    eyebrowKey: 'nodePortraitEyebrow',
    titleKey: 'nodePortraitTitle',
    noteKey: 'nodePortraitNote',
    tone: 'portrait',
    x: 92,
    y: 424,
    w: 252,
    h: 214,
  },
  {
    id: 'fusion',
    eyebrowKey: 'nodeFusionEyebrow',
    titleKey: 'nodeFusionTitle',
    noteKey: 'nodeFusionNote',
    tone: 'fusion',
    x: 468,
    y: 254,
    w: 286,
    h: 234,
  },
  {
    id: 'landscape',
    eyebrowKey: 'nodeLandscapeEyebrow',
    titleKey: 'nodeLandscapeTitle',
    noteKey: 'nodeLandscapeNote',
    tone: 'landscape',
    x: 840,
    y: 86,
    w: 264,
    h: 204,
  },
  {
    id: 'scene',
    eyebrowKey: 'nodeSceneEyebrow',
    titleKey: 'nodeSceneTitle',
    noteKey: 'nodeSceneNote',
    tone: 'scene',
    x: 858,
    y: 394,
    w: 292,
    h: 228,
  },
  {
    id: 'motion',
    eyebrowKey: 'nodeMotionEyebrow',
    titleKey: 'nodeMotionTitle',
    noteKey: 'nodeMotionNote',
    tone: 'motion',
    x: 1186,
    y: 246,
    w: 216,
    h: 242,
  },
]

const CONNECTIONS: Connection[] = [
  { from: 'face', to: 'fusion' },
  { from: 'portrait', to: 'fusion', route: 'downArc' },
  { from: 'fusion', to: 'scene' },
  { from: 'landscape', to: 'scene', route: 'downArc' },
  { from: 'scene', to: 'motion' },
]

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function createBezierPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  route?: Connection['route'],
) {
  if (route === 'downArc') {
    const curveY = Math.max(sourceY, targetY) + 120
    return `M ${sourceX} ${sourceY} C ${sourceX + 120} ${curveY}, ${targetX - 120} ${curveY}, ${targetX} ${targetY}`
  }

  const delta = Math.abs(targetX - sourceX) * 0.52
  return `M ${sourceX} ${sourceY} C ${sourceX + delta} ${sourceY}, ${targetX - delta} ${targetY}, ${targetX} ${targetY}`
}

function NodeBackdrop({ tone }: { tone: VisualTone }) {
  const surfaces: Record<VisualTone, string> = {
    face:
      'radial-gradient(circle at 42% 34%, rgba(255,255,255,0.92), rgba(189,189,189,0.52) 22%, rgba(48,48,48,0.16) 58%, transparent 70%), radial-gradient(circle at 56% 38%, rgba(255,255,255,0.72), transparent 16%), linear-gradient(145deg, #0d0d0d 0%, #232323 46%, #070707 100%)',
    portrait:
      'radial-gradient(circle at 46% 26%, rgba(255,255,255,0.85), transparent 16%), radial-gradient(circle at 44% 48%, rgba(228,228,228,0.46), transparent 24%), linear-gradient(180deg, #0e0e0f 0%, #2a2a2b 52%, #090909 100%)',
    fusion:
      'radial-gradient(circle at 46% 28%, rgba(255,255,255,0.84), transparent 18%), radial-gradient(circle at 46% 54%, rgba(215,215,215,0.5), transparent 32%), linear-gradient(160deg, #070707 0%, #2b2b2e 45%, #090909 100%)',
    landscape:
      'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 18%, rgba(0,0,0,0) 20%), radial-gradient(circle at 72% 18%, rgba(255,255,255,0.46), transparent 18%), linear-gradient(180deg, #131313 0%, #343434 44%, #151515 68%, #060606 100%)',
    scene:
      'radial-gradient(circle at 62% 28%, rgba(255,255,255,0.44), transparent 18%), radial-gradient(circle at 42% 56%, rgba(235,235,235,0.4), transparent 24%), linear-gradient(180deg, #131313 0%, #373737 44%, #151515 76%, #060606 100%)',
    motion:
      'radial-gradient(circle at 70% 24%, rgba(255,255,255,0.48), transparent 18%), linear-gradient(120deg, rgba(255,255,255,0.12) 0%, transparent 22%, rgba(255,255,255,0.05) 40%, transparent 58%), linear-gradient(180deg, #090909 0%, #343434 44%, #111111 82%, #050505 100%)',
  }

  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: surfaces[tone],
      }}
    >
      {tone !== 'landscape' ? (
        <div className="absolute inset-x-[22%] top-[18%] h-[50%] rounded-[46%_46%_42%_42%/40%_40%_56%_56%] border border-white/18 bg-[radial-gradient(circle_at_50%_22%,rgba(255,255,255,0.82),rgba(216,216,216,0.18)_34%,transparent_66%)] opacity-80" />
      ) : null}
      {(tone === 'landscape' || tone === 'scene' || tone === 'motion') ? (
        <>
          <div className="absolute inset-x-0 bottom-0 h-[42%] bg-[linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.18)_26%,rgba(0,0,0,0.68)_100%)]" />
          <div className="absolute bottom-[18%] left-[8%] h-[24%] w-[46%] rounded-[52%] bg-white/8 blur-[10px]" />
          <div className="absolute right-[7%] bottom-[12%] h-[30%] w-[34%] rounded-[52%] bg-white/8 blur-[14px]" />
        </>
      ) : null}
      {tone === 'motion' ? (
        <>
          <div className="absolute inset-y-[24%] left-[22%] w-[10%] rounded-full bg-white/18 blur-[12px]" />
          <div className="absolute inset-y-[30%] right-[14%] w-[14%] rounded-full bg-white/12 blur-[18px]" />
        </>
      ) : null}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(0,0,0,0)_22%,rgba(0,0,0,0.52)_100%)]" />
    </div>
  )
}

function DemoNodeCard({
  node,
  onPointerDown,
  t,
}: {
  node: DemoNode
  onPointerDown: (event: React.PointerEvent<HTMLButtonElement>, id: string) => void
  t: ReturnType<typeof useTranslations<'landing.hero'>>
}) {
  return (
    <button
      type="button"
      className="group absolute cursor-grab overflow-hidden rounded-[26px] border border-white/10 bg-[#080808] text-left shadow-[0_26px_90px_rgba(0,0,0,0.48)] transition-transform duration-300 hover:-translate-y-1 active:cursor-grabbing"
      style={{ left: node.x, top: node.y, width: node.w, height: node.h }}
      onPointerDown={(event) => onPointerDown(event, node.id)}
    >
      <NodeBackdrop tone={node.tone} />
      <div className="absolute inset-0 rounded-[26px] ring-1 ring-white/10 ring-inset" />
      <div className="absolute left-4 top-4 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-white/80" />
        <span className="text-[10px] font-medium tracking-[0.22em] text-white/60 uppercase">
          {t(node.eyebrowKey)}
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 space-y-2 px-4 pb-4">
        <h3 className="text-lg font-semibold tracking-tight text-white">{t(node.titleKey)}</h3>
        <p className="max-w-[90%] text-xs leading-5 text-white/72">{t(node.noteKey)}</p>
      </div>
      <div className="absolute bottom-4 right-4 h-3.5 w-3.5 rounded-full border border-white/35 bg-black/28 backdrop-blur-sm" />
      <div className="absolute left-0 top-0 h-full w-full opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_42%,rgba(255,255,255,0.04)_72%,transparent_100%)]" />
      </div>
    </button>
  )
}

function ConnectionLine({
  connection,
  nodes,
}: {
  connection: Connection
  nodes: DemoNode[]
}) {
  const source = nodes.find((node) => node.id === connection.from)
  const target = nodes.find((node) => node.id === connection.to)

  if (!source || !target) {
    return null
  }

  const sourceX = source.x + source.w
  const sourceY = source.y + source.h / 2
  const targetX = target.x
  const targetY = target.y + target.h / 2
  const path = createBezierPath(sourceX, sourceY, targetX, targetY, connection.route)

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke="rgba(247,244,238,0.22)"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        d={path}
        fill="none"
        stroke="rgba(247,244,238,0.84)"
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeDasharray="8 20"
        className="landing-flow-line"
      />
      <circle r={3.5} fill="rgba(247,244,238,0.92)">
        <animateMotion dur="3.6s" repeatCount="indefinite" path={path} />
      </circle>
    </g>
  )
}

export function HeroSection() {
  const t = useTranslations('landing.hero')
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const dragStateRef = useRef<{
    id: string
    offsetX: number
    offsetY: number
  } | null>(null)

  const [nodes, setNodes] = useState(INITIAL_NODES)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    function updateScale() {
      if (!canvasRef.current) {
        return
      }

      const width = canvasRef.current.clientWidth
      const nextScale = clamp(width / CANVAS_WIDTH, 0.42, 1)
      setScale(nextScale)
    }

    updateScale()
    window.addEventListener('resize', updateScale)

    return () => {
      window.removeEventListener('resize', updateScale)
    }
  }, [])

  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>, id: string) {
    if (!canvasRef.current || scale < 0.72) {
      return
    }

    const activeNode = nodes.find((node) => node.id === id)

    if (!activeNode) {
      return
    }

    const rect = canvasRef.current.getBoundingClientRect()
    dragStateRef.current = {
      id,
      offsetX: event.clientX / scale - rect.left / scale - activeNode.x,
      offsetY: event.clientY / scale - rect.top / scale - activeNode.y,
    }

    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragStateRef.current || !canvasRef.current) {
      return
    }

    const rect = canvasRef.current.getBoundingClientRect()
    const rawX = event.clientX / scale - rect.left / scale - dragStateRef.current.offsetX
    const rawY = event.clientY / scale - rect.top / scale - dragStateRef.current.offsetY

    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (node.id !== dragStateRef.current?.id) {
          return node
        }

        return {
          ...node,
          x: clamp(rawX, DRAG_PADDING, CANVAS_WIDTH - node.w - DRAG_PADDING),
          y: clamp(rawY, DRAG_PADDING, CANVAS_HEIGHT - node.h - DRAG_PADDING),
        }
      }),
    )
  }

  function clearDragState() {
    dragStateRef.current = null
  }

  return (
    <section
      id="hero"
      className="landing-snap-section relative overflow-hidden border-b border-white/6 bg-[var(--landing-bg)] px-5 pb-18 pt-28 sm:pt-32 md:pb-24"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),transparent_28%),linear-gradient(180deg,#030303_0%,#080808_44%,#020202_100%)]" />
        <div className="absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:84px_84px]" />
        <div className="landing-grain absolute inset-0 opacity-40" />
        <div className="absolute left-1/2 top-[18%] h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-white/8 blur-[160px]" />
      </div>

      <div className="relative mx-auto max-w-[1480px]">
        <div className="mb-10 max-w-[760px]">
          <p className="mb-5 text-[11px] tracking-[0.34em] text-[var(--landing-muted)] uppercase">
            {t('eyebrow')}
          </p>
          <BrandMark className="text-4xl text-[var(--landing-ink)] md:text-6xl">
            {t('heading')}
          </BrandMark>
          <h1 className="mt-5 max-w-[900px] text-5xl font-semibold tracking-[-0.04em] text-[var(--landing-ink)] md:text-7xl">
            {t('tagline')}
          </h1>
          <p className="mt-5 max-w-[620px] text-base leading-8 text-[var(--landing-muted)] md:text-lg">
            {t('description')}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full bg-[var(--landing-ink)] px-7 text-sm font-medium text-black shadow-[0_18px_44px_rgba(255,255,255,0.18)] transition hover:bg-white"
            >
              <Link href="/sign-in?redirect_url=/workspace">
                {t('primaryCta')}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-full border-white/16 bg-white/[0.02] px-7 text-sm font-medium text-[var(--landing-ink)] shadow-none hover:bg-white/[0.06]"
            >
              <Link href="/pricing">
                <Play className="size-4 fill-current" />
                {t('secondaryCta')}
              </Link>
            </Button>
          </div>
          <p className="mt-5 text-sm text-[var(--landing-faint)]">{t('models')}</p>
        </div>

        <div
          ref={canvasRef}
          className="relative mx-auto w-full"
          style={{ height: CANVAS_HEIGHT * scale }}
          onPointerMove={handlePointerMove}
          onPointerUp={clearDragState}
          onPointerLeave={clearDragState}
        >
          <div
            className="absolute left-1/2 top-0 origin-top"
            style={{
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
              transform: `translateX(-50%) scale(${scale})`,
            }}
          >
            <div className="absolute inset-0 overflow-visible rounded-[34px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] shadow-[0_40px_140px_rgba(0,0,0,0.55)]" />
            <div className="absolute inset-[18px] rounded-[28px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(0,0,0,0.14))]" />

            <svg
              className="pointer-events-none absolute inset-0 overflow-visible"
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
            >
              {CONNECTIONS.map((connection) => (
                <ConnectionLine key={`${connection.from}-${connection.to}`} connection={connection} nodes={nodes} />
              ))}
            </svg>

            {nodes.map((node) => (
              <DemoNodeCard key={node.id} node={node} onPointerDown={handlePointerDown} t={t} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
