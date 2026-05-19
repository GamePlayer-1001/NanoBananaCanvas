/**
 * [INPUT]: 依赖 @xyflow/react 的 NodeProps，依赖 ./base-node，依赖 @/stores/use-flow-store，
 *          依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 ImageCompareNode 图片对比节点
 * [POS]: components/nodes 的工具型图片对比节点，被 registry 注册并在画布中渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, useRef, useState, type ChangeEvent, type MouseEvent } from 'react'
import type { NodeProps } from '@xyflow/react'
import { useTranslations } from 'next-intl'

import { useFlowStore } from '@/stores/use-flow-store'
import type { WorkflowNodeData } from '@/types'

import { BaseNode } from './base-node'

/* ─── Types ───────────────────────────────────────────── */

type CompareMode = 'slider' | 'side-by-side'

/* ─── SVG Icon ────────────────────────────────────────── */

function ImageCompareIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <line x1="12" y1="3" x2="12" y2="21" />
      <polyline points="8 10 6 12 8 14" />
      <polyline points="16 10 18 12 16 14" />
    </svg>
  )
}

/* ─── Slider Compare Widget ──────────────────────────── */

interface SliderCompareProps {
  imageA: string | null
  imageB: string | null
  labelA?: string
  labelB?: string
}

function SliderCompare({ imageA, imageB, labelA = 'A', labelB = 'B' }: SliderCompareProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const x = clientX - rect.left
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setPosition(pct)
  }, [])

  const onMouseDown = useCallback((e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    updatePosition(e.clientX)

    const onMove = (ev: globalThis.MouseEvent) => {
      updatePosition(ev.clientX)
    }
    const onUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [updatePosition])

  const hasImages = imageA && imageB

  if (!hasImages) {
    return (
      <div className="bg-muted/50 flex h-36 items-center justify-center rounded-md border border-dashed">
        <span className="text-muted-foreground text-xs">
          {!imageA && !imageB
            ? 'Connect Image A & Image B'
            : !imageA
              ? 'Connect Image A'
              : 'Connect Image B'}
        </span>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="nodrag nowheel relative h-44 w-full cursor-col-resize select-none overflow-hidden rounded-md border"
      onMouseDown={onMouseDown}
    >
      {/* Image B (full background) */}
      <img
        src={imageB}
        alt="B"
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />

      {/* Image A (clipped by slider position) */}
      <img
        src={imageA}
        alt="A"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        draggable={false}
      />

      {/* Slider Line */}
      <div
        className="absolute top-0 bottom-0 z-10 w-0.5 bg-white shadow-[0_0_4px_rgba(0,0,0,0.5)]"
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
      >
        {/* Slider Handle */}
        <div
          className={`absolute top-1/2 left-1/2 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-black/60 shadow-md transition-transform ${isDragging ? 'scale-110' : ''}`}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 4L1 6L3 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 4L11 6L9 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-1.5 left-1.5 z-10 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white">
        {labelA}
      </div>
      <div className="absolute top-1.5 right-1.5 z-10 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white">
        {labelB}
      </div>
    </div>
  )
}

/* ─── Side by Side Compare Widget ────────────────────── */

function SideBySideCompare({ imageA, imageB, labelA = 'A', labelB = 'B' }: SliderCompareProps) {
  const hasImages = imageA && imageB

  if (!hasImages) {
    return (
      <div className="bg-muted/50 flex h-36 items-center justify-center rounded-md border border-dashed">
        <span className="text-muted-foreground text-xs">
          {!imageA && !imageB
            ? 'Connect Image A & Image B'
            : !imageA
              ? 'Connect Image A'
              : 'Connect Image B'}
        </span>
      </div>
    )
  }

  return (
    <div className="flex h-36 gap-1 overflow-hidden rounded-md border">
      <div className="relative flex-1 overflow-hidden">
        <img src={imageA} alt="A" className="h-full w-full object-cover" draggable={false} />
        <div className="absolute top-1.5 left-1.5 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white">
          {labelA}
        </div>
      </div>
      <div className="bg-border w-px" />
      <div className="relative flex-1 overflow-hidden">
        <img src={imageB} alt="B" className="h-full w-full object-cover" draggable={false} />
        <div className="absolute top-1.5 right-1.5 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white">
          {labelB}
        </div>
      </div>
    </div>
  )
}

/* ─── Mode Toggle ────────────────────────────────────── */

function ModeToggle({ mode, onChange }: { mode: CompareMode; onChange: (m: CompareMode) => void }) {
  return (
    <div className="bg-muted flex gap-0.5 rounded-md p-0.5">
      <button
        type="button"
        className={`flex-1 rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
          mode === 'slider'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        onClick={() => onChange('slider')}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="mr-0.5 inline-block align-[-1px]">
          <rect x="1" y="2" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <line x1="6" y1="2" x2="6" y2="10" stroke="currentColor" strokeWidth="1.2" />
        </svg>
        Slider
      </button>
      <button
        type="button"
        className={`flex-1 rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
          mode === 'side-by-side'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        onClick={() => onChange('side-by-side')}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="mr-0.5 inline-block align-[-1px]">
          <rect x="1" y="2" width="4" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <rect x="7" y="2" width="4" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
        </svg>
        Side
      </button>
    </div>
  )
}

/* ─── Main Node Component ────────────────────────────── */

export function ImageCompareNode(props: NodeProps) {
  const data = props.data as WorkflowNodeData
  const updateNodeData = useFlowStore((s) => s.updateNodeData)
  const t = useTranslations('nodes')

  const mode = (data.config.compareMode as CompareMode) ?? 'slider'
  const imageA = (data.config.imageA as string) || null
  const imageB = (data.config.imageB as string) || null

  const onModeChange = useCallback(
    (newMode: CompareMode) => {
      updateNodeData(props.id, { config: { ...data.config, compareMode: newMode } })
    },
    [props.id, data.config, updateNodeData],
  )

  return (
    <BaseNode {...props} data={data} icon={<ImageCompareIcon size={14} />} heightMode="content">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-xs">{t('imageCompareHint')}</p>
        </div>

        <ModeToggle mode={mode} onChange={onModeChange} />

        {mode === 'slider' ? (
          <SliderCompare imageA={imageA} imageB={imageB} labelA="A" labelB="B" />
        ) : (
          <SideBySideCompare imageA={imageA} imageB={imageB} labelA="A" labelB="B" />
        )}
      </div>
    </BaseNode>
  )
}
