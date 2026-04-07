/**
 * [INPUT]: 依赖 react 的 useState/useCallback/useRef/useEffect，
 *          依赖 next-intl 的 useTranslations，依赖 @/i18n/navigation 的 Link
 * [OUTPUT]: 对外提供 HeroSection 交互式画板组件
 * [POS]: landing 的主视觉区域，被 (landing)/page.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'

/* ─── Types ──────────────────────────────────────────────── */

interface DemoNode {
  id: string
  label: string
  model: string
  x: number
  y: number
  gradient: string
  w: number
  h: number
}

interface Connection {
  from: string
  to: string
}

/* ─── Constants ──────────────────────────────────────────── */

const INITIAL_NODES: DemoNode[] = [
  {
    id: 'a',
    label: 'Text Prompt',
    model: 'GPT-4o',
    x: 80,
    y: 80,
    gradient: 'from-indigo-600/50 to-violet-600/50',
    w: 152,
    h: 80,
  },
  {
    id: 'b',
    label: 'Style Guide',
    model: 'Claude',
    x: 60,
    y: 320,
    gradient: 'from-amber-500/50 to-orange-600/50',
    w: 152,
    h: 80,
  },
  {
    id: 'c',
    label: 'LLM Compose',
    model: 'Gemini 2.5',
    x: 380,
    y: 160,
    gradient: 'from-cyan-500/50 to-blue-600/50',
    w: 160,
    h: 80,
  },
  {
    id: 'd',
    label: 'Image Gen',
    model: 'FLUX Pro',
    x: 680,
    y: 100,
    gradient: 'from-pink-500/50 to-rose-600/50',
    w: 152,
    h: 80,
  },
  {
    id: 'e',
    label: 'Enhance',
    model: 'DALL-E 3',
    x: 660,
    y: 330,
    gradient: 'from-emerald-500/50 to-teal-600/50',
    w: 152,
    h: 80,
  },
  {
    id: 'f',
    label: 'Output',
    model: 'Display',
    x: 920,
    y: 210,
    gradient: 'from-purple-500/50 to-fuchsia-600/50',
    w: 140,
    h: 80,
  },
]

const CONNECTIONS: Connection[] = [
  { from: 'a', to: 'c' },
  { from: 'b', to: 'c' },
  { from: 'c', to: 'd' },
  { from: 'c', to: 'e' },
  { from: 'd', to: 'f' },
  { from: 'e', to: 'f' },
]

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
}: {
  from: string
  to: string
  nodes: DemoNode[]
}) {
  const s = nodes.find((n) => n.id === from)
  const t = nodes.find((n) => n.id === to)
  if (!s || !t) return null

  const sx = s.x + s.w
  const sy = s.y + s.h / 2
  const tx = t.x
  const ty = t.y + t.h / 2

  const d = bezierPath(sx, sy, tx, ty)

  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke="var(--brand-400)"
        strokeWidth={2}
        strokeOpacity={0.4}
      />
      {/* 流动光点 */}
      <circle r={3} fill="var(--brand-400)" opacity={0.8}>
        <animateMotion dur="3s" repeatCount="indefinite" path={d} />
      </circle>
    </g>
  )
}

/* ─── Demo Node Card ─────────────────────────────────────── */

function DemoNodeCard({
  node,
  onPointerDown,
}: {
  node: DemoNode
  onPointerDown: (e: React.PointerEvent, id: string) => void
}) {
  return (
    <div
      className="group absolute cursor-grab select-none active:cursor-grabbing"
      style={{ left: node.x, top: node.y, width: node.w, height: node.h }}
      onPointerDown={(e) => onPointerDown(e, node.id)}
    >
      {/* 卡片主体 */}
      <div
        className={`relative h-full w-full rounded-lg border border-white/10 bg-gradient-to-br shadow-lg transition-shadow group-hover:shadow-xl ${node.gradient}`}
      >
        {/* 左侧输入端口 */}
        <div className="absolute top-1/2 -left-1.5 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white/20 bg-white/10" />

        {/* 右侧输出端口 */}
        <div className="bg-brand-500/40 absolute top-1/2 -right-1.5 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white/30" />

        {/* 标签 */}
        <div className="flex h-full flex-col justify-center px-3">
          <span className="text-xs font-medium text-white/90">{node.label}</span>
          <span className="mt-0.5 text-[10px] text-white/50">{node.model}</span>
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

  /* ── 响应式缩放 ──────────────────────────────────────── */
  useEffect(() => {
    function updateScale() {
      if (!containerRef.current) return
      const w = containerRef.current.clientWidth
      setScale(Math.min(1, w / 1100))
    }
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  /* ── 拖拽 ────────────────────────────────────────────── */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent, id: string) => {
      if (scale < 0.6) return // 移动端禁用拖拽
      const node = nodes.find((n) => n.id === id)
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

      setNodes((prev) => prev.map((n) => (n.id === drag.id ? { ...n, x, y } : n)))
    },
    [scale],
  )

  const handlePointerUp = useCallback(() => {
    dragRef.current = null
  }, [])

  /* ── Canvas 画板尺寸 ─────────────────────────────────── */
  const canvasW = 1100
  const canvasH = 460

  return (
    <section className="relative flex min-h-[calc(100vh-64px)] items-center justify-center overflow-hidden bg-[#0a0a0a] pt-16">
      {/* ── 背景点阵 ───────────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* ── 中央辉光 ───────────────────────────────────── */}
      <div className="bg-brand-500/8 pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[150px]" />

      {/* ── 画板容器 ───────────────────────────────────── */}
      <div
        ref={containerRef}
        className="relative mx-auto w-full max-w-[1100px] px-4"
        style={{ height: canvasH * scale }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* 缩放层 */}
        <div
          className="origin-top-center absolute left-1/2"
          style={{
            width: canvasW,
            height: canvasH,
            transform: `translateX(-50%) scale(${scale})`,
          }}
        >
          {/* ── SVG 连线层 ──────────────────────────────── */}
          <svg
            className="pointer-events-none absolute inset-0"
            width={canvasW}
            height={canvasH}
          >
            {CONNECTIONS.map((conn) => (
              <ConnectionLine
                key={`${conn.from}-${conn.to}`}
                from={conn.from}
                to={conn.to}
                nodes={nodes}
              />
            ))}
          </svg>

          {/* ── 节点层 ─────────────────────────────────── */}
          {nodes.map((node) => (
            <DemoNodeCard key={node.id} node={node} onPointerDown={handlePointerDown} />
          ))}
        </div>

        {/* ── 标题覆盖层 (位于画板中央) ────────────────── */}
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div className="pointer-events-none text-center">
            {/* 品牌名 */}
            <h2 className="mb-1 font-serif text-2xl tracking-wide text-white/80 italic md:text-3xl">
              {t('heading')}
            </h2>

            {/* 主标语 */}
            <h1 className="from-brand-300 mb-4 bg-gradient-to-r to-white bg-clip-text text-3xl font-bold text-transparent md:text-5xl">
              {t('tagline')}
            </h1>

            {/* 描述 */}
            <p className="mx-auto mb-6 max-w-md text-xs leading-relaxed whitespace-pre-line text-white/40 md:text-sm">
              {t('description')}
            </p>

            {/* CTA */}
            <Link
              href="/sign-up"
              className="border-brand-500/50 bg-brand-500/15 hover:bg-brand-500/25 pointer-events-auto inline-flex h-11 items-center rounded-lg border px-7 text-sm font-medium text-white backdrop-blur-sm transition-all"
            >
              {t('cta')}
            </Link>

            {/* 模型标签 */}
            <p className="mt-3 text-[11px] tracking-wide text-white/25">{t('models')}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
