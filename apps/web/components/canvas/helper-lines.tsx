/**
 * [INPUT]: 依赖 @xyflow/react 的 useViewport (viewport 坐标转换)
 * [OUTPUT]: 对外提供 HelperLines 对齐辅助线 SVG 叠层组件
 * [POS]: components/canvas 的辅助可视化，被 Canvas 内嵌使用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useViewport } from '@xyflow/react'

/* ─── Types ───────────────────────────────────────────── */

interface HelperLinesProps {
  horizontal?: number
  vertical?: number
}

/* ─── Constants ───────────────────────────────────────── */

const LINE_COLOR = 'var(--brand-500)'
const LINE_OPACITY = 0.5
const STROKE_DASHARRAY = '6 3'

/* ─── Component ───────────────────────────────────────── */

export function HelperLines({ horizontal, vertical }: HelperLinesProps) {
  const { x, y, zoom } = useViewport()

  if (horizontal == null && vertical == null) return null

  return (
    <svg className="react-flow__helper-lines pointer-events-none absolute inset-0 z-50 h-full w-full overflow-visible">
      {horizontal != null && (
        <line
          x1={0}
          x2="100%"
          y1={horizontal * zoom + y}
          y2={horizontal * zoom + y}
          stroke={LINE_COLOR}
          strokeWidth={1}
          strokeDasharray={STROKE_DASHARRAY}
          opacity={LINE_OPACITY}
        />
      )}
      {vertical != null && (
        <line
          x1={vertical * zoom + x}
          x2={vertical * zoom + x}
          y1={0}
          y2="100%"
          stroke={LINE_COLOR}
          strokeWidth={1}
          strokeDasharray={STROKE_DASHARRAY}
          opacity={LINE_OPACITY}
        />
      )}
    </svg>
  )
}
