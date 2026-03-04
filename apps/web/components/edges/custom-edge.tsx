/**
 * [INPUT]: 依赖 @xyflow/react 的 BaseEdge/getBezierPath/EdgeProps/useStore，依赖 @/types 的 WorkflowNodeData
 * [OUTPUT]: 对外提供 CustomEdge 自定义连线组件 (含执行动画)
 * [POS]: components/edges 的默认连线渲染器，被 Canvas 通过 edgeTypes 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { BaseEdge, getBezierPath, type EdgeProps, useStore } from '@xyflow/react'
import type { WorkflowNodeData } from '@/types'

/* ─── Component ───────────────────────────────────────── */

export function CustomEdge({
  source,
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

  /* 读取源节点的执行状态 */
  const isSourceRunning = useStore((state) => {
    const sourceNode = state.nodeLookup.get(source)
    if (!sourceNode) return false
    const data = sourceNode.data as WorkflowNodeData
    return data.status === 'running'
  })

  return (
    <g>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: isSourceRunning
            ? 'var(--brand-500)'
            : selected
              ? 'var(--brand-500)'
              : 'var(--brand-400)',
          strokeWidth: selected || isSourceRunning ? 2.5 : 2,
          transition: 'stroke 150ms, stroke-width 150ms',
        }}
      />

      {/* ── 执行动画：沿路径运动的圆点 ──────────────── */}
      {isSourceRunning && (
        <circle r={3} fill="var(--brand-500)">
          <animateMotion dur="1.5s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}
    </g>
  )
}
