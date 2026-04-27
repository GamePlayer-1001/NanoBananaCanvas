/**
 * [INPUT]: 依赖 @xyflow/react 的 BaseEdge/EdgeLabelRenderer/getBezierPath/EdgeProps/useStore，依赖 @/stores/use-flow-store 的删边能力，依赖 @/types 的 WorkflowNodeData
 * [OUTPUT]: 对外提供 CustomEdge 自定义连线组件 (含执行动画与选中态删除按钮)
 * [POS]: components/edges 的默认连线渲染器，被 Canvas 通过 edgeTypes 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps, useStore } from '@xyflow/react'
import { X } from 'lucide-react'
import { useFlowStore } from '@/stores/use-flow-store'
import type { WorkflowNodeData } from '@/types'

/* ─── Component ───────────────────────────────────────── */

export function CustomEdge({
  id,
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
  const removeEdge = useFlowStore((state) => state.removeEdge)
  const [edgePath, labelX, labelY] = getBezierPath({
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

      {selected && (
        <EdgeLabelRenderer>
          <button
            type="button"
            className="bg-background border-border text-muted-foreground hover:border-destructive hover:text-destructive absolute flex h-6 w-6 items-center justify-center rounded-full border shadow-sm transition-colors"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            onClick={(event) => {
              event.stopPropagation()
              removeEdge(id)
            }}
            aria-label="Delete connection"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </EdgeLabelRenderer>
      )}
    </g>
  )
}
