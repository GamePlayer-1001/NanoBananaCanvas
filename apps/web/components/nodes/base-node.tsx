/**
 * [INPUT]: 依赖 @xyflow/react 的 Handle/Position/NodeProps，依赖 @/types 的 WorkflowNodeData/PortDefinition，
 *          依赖 ./plugin-registry 的 getNodePorts
 * [OUTPUT]: 对外提供 BaseNode 节点基础框架组件 (含 headerRight 插槽与端口标签)
 * [POS]: components/nodes 的基础模板，所有具体节点类型继承此框架
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { Handle, NodeResizer, Position, type NodeProps } from '@xyflow/react'
import type { WorkflowNodeData, PortDefinition } from '@/types'
import { cn } from '@/lib/utils'
import { getNodePorts } from './plugin-registry'

/* ─── Types ───────────────────────────────────────────── */

export interface BaseNodeProps extends NodeProps {
  data: WorkflowNodeData
  icon?: ReactNode
  inputs?: PortDefinition[]
  outputs?: PortDefinition[]
  headerRight?: ReactNode
  children?: ReactNode
  resizable?: boolean
  minWidth?: number
  minHeight?: number
}

/* ─── Status Indicator ────────────────────────────────── */

const STATUS_COLORS = {
  idle: 'bg-muted',
  running: 'bg-brand-500 animate-pulse',
  success: 'bg-green-500',
  error: 'bg-destructive',
  skipped: 'bg-muted-foreground',
} as const

const PORT_TYPE_LABELS: Record<PortDefinition['type'], string> = {
  string: 'string',
  number: 'number',
  boolean: 'bool',
  image: 'img',
  'image-list': 'imgs',
  video: 'video',
  audio: 'audio',
  any: 'any',
}

/* ─── Port Handle ───────────────────────────────────── */

function PortHandle({
  port,
  index,
  total,
  direction,
}: {
  port: PortDefinition
  index: number
  total: number
  direction: 'input' | 'output'
}) {
  const top = `${((index + 1) / (total + 1)) * 100}%`
  const isInput = direction === 'input'

  return (
    <>
      <Handle
        id={port.id}
        type={isInput ? 'target' : 'source'}
        position={isInput ? Position.Left : Position.Right}
        style={{ top }}
        className="!bg-background !z-10 !h-2.5 !w-2.5 !border-2 !border-[var(--brand-500)]"
      />
      <div
        className={cn(
          'pointer-events-none absolute z-10 flex -translate-y-1/2 items-center gap-1',
          'bg-background/95 text-muted-foreground rounded-md border px-1.5 py-0.5 text-[10px] leading-none shadow-sm',
          isInput
            ? 'right-[calc(100%_+_10px)] text-right'
            : 'left-[calc(100%_+_10px)] text-left',
        )}
        style={{ top }}
      >
        <span className="max-w-[96px] truncate">{port.label}</span>
        <span className="text-[var(--brand-500)]">{PORT_TYPE_LABELS[port.type]}</span>
      </div>
    </>
  )
}

/* ─── Component ───────────────────────────────────────── */

export function BaseNode({
  data,
  type,
  selected,
  icon,
  inputs,
  outputs,
  headerRight,
  children,
  resizable = true,
  minWidth = 280,
  minHeight = 100,
}: BaseNodeProps) {
  const status = data.status ?? 'idle'
  const registryPorts = getNodePorts(type)
  const inputPorts = inputs ?? registryPorts.inputs
  const outputPorts = outputs ?? registryPorts.outputs
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [showResizer, setShowResizer] = useState(false)

  const updateResizeHover = useCallback((event: MouseEvent<HTMLDivElement>) => {
    if (!resizable) return

    const bounds = containerRef.current?.getBoundingClientRect()
    if (!bounds) return

    const threshold = 12
    const localX = event.clientX - bounds.left
    const localY = event.clientY - bounds.top
    const nearHorizontal = localX <= threshold || localX >= bounds.width - threshold
    const nearVertical = localY <= threshold || localY >= bounds.height - threshold
    const nextVisible = nearHorizontal || nearVertical

    setShowResizer((current) => (current === nextVisible ? current : nextVisible))
  }, [resizable])

  const hideResizer = useCallback(() => {
    setShowResizer(false)
  }, [])

  return (
    <div
      ref={containerRef}
      onMouseMove={updateResizeHover}
      onMouseLeave={hideResizer}
      style={{ minWidth, minHeight }}
      className={cn(
        'bg-card relative h-full w-full rounded-lg border shadow-sm',
        'transition-shadow duration-150',
        selected ? 'border-[var(--brand-500)] shadow-md' : 'border-border',
      )}
    >
      {resizable ? (
        <NodeResizer
          isVisible={selected || showResizer}
          minWidth={minWidth}
          minHeight={minHeight}
          lineClassName="!border-[var(--brand-500)]/70"
          handleClassName="!bg-[var(--brand-500)] !w-2 !h-2 !rounded-sm"
        />
      ) : null}

      {/* ── Header ───────────────────────────────────── */}
      <div className="border-border flex items-center gap-2 border-b px-3 py-2">
        <div className={cn('h-2 w-2 rounded-full', STATUS_COLORS[status])} />
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{data.label}</span>
        {headerRight}
      </div>

      {/* ── Body ─────────────────────────────────────── */}
      <div className="p-3">{children}</div>

      {/* ── Input Handles ────────────────────────────── */}
      {inputPorts.map((port, i) => (
        <PortHandle
          key={port.id}
          port={port}
          index={i}
          total={inputPorts.length}
          direction="input"
        />
      ))}

      {/* ── Output Handles ───────────────────────────── */}
      {outputPorts.map((port, i) => (
        <PortHandle
          key={port.id}
          port={port}
          index={i}
          total={outputPorts.length}
          direction="output"
        />
      ))}
    </div>
  )
}
