/**
 * [INPUT]: 依赖 @xyflow/react 的 BaseEdge/getBezierPath/EdgeProps
 * [OUTPUT]: 对外提供 CustomEdge 自定义连线组件
 * [POS]: components/edges 的默认连线渲染器，被 Canvas 通过 edgeTypes 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react'

export function CustomEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  return (
    <BaseEdge
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        stroke: selected ? 'var(--brand-500)' : 'var(--brand-400)',
        strokeWidth: selected ? 2.5 : 2,
        transition: 'stroke 150ms, stroke-width 150ms',
      }}
    />
  )
}
