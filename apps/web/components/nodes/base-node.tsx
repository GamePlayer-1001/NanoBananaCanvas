/**
 * [INPUT]: 依赖 @xyflow/react 的 Handle/Position/NodeProps，依赖 @/types 的 WorkflowNodeData/PortDefinition，
 *          依赖 ./plugin-registry 的 getNodePorts
 * [OUTPUT]: 对外提供 BaseNode 节点基础框架组件 (含 headerRight 插槽、端口标签与稳定默认尺寸)
 * [POS]: components/nodes 的基础模板，所有具体节点类型继承此框架，默认锁定自动尺寸并允许用户手动缩放
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
  bodyClassName?: string
  heightMode?: 'fixed' | 'content'
}

/* ─── Status Indicator ────────────────────────────────── */

const STATUS_COLORS = {
  idle: 'bg-muted',
  queued: 'bg-amber-500 animate-pulse',
  running: 'bg-brand-500 animate-pulse',
  finalizing: 'bg-sky-500 animate-pulse',
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

const RESIZER_LINE_CLASS =
  '!border-[var(--brand-500)]/80 !border-[1.5px] !shadow-[0_0_0_1px_rgba(99,102,241,0.08)]'
const RESIZER_HANDLE_CLASS =
  '!h-4 !w-4 !rounded-full !border-0 !bg-transparent !opacity-0'
const SELECTED_NODE_CLASS =
  'border-[var(--brand-500)] shadow-[0_0_0_1px_rgba(99,102,241,0.92),0_10px_24px_rgba(99,102,241,0.12)]'

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
          'opacity-0 transition-opacity duration-150',
          'group-hover/node:opacity-100 group-[.selected]/node:opacity-100',
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
  width,
  height,
  selected,
  icon,
  inputs,
  outputs,
  headerRight,
  children,
  resizable = true,
  minWidth = 280,
  minHeight = 100,
  bodyClassName,
  heightMode = 'fixed',
}: BaseNodeProps) {
  const status = data.status ?? 'idle'
  const registryPorts = getNodePorts(type)
  const inputPorts = inputs ?? registryPorts.inputs
  const outputPorts = outputs ?? registryPorts.outputs
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [hoverEdge, setHoverEdge] = useState(false)

  const updateResizeHover = useCallback((event: MouseEvent<HTMLDivElement>) => {
    if (!resizable) return

    const bounds = containerRef.current?.getBoundingClientRect()
    if (!bounds) return

    const threshold = selected ? 24 : 12
    const localX = event.clientX - bounds.left
    const localY = event.clientY - bounds.top
    const nearHorizontal = localX <= threshold || localX >= bounds.width - threshold
    const nearVertical = localY <= threshold || localY >= bounds.height - threshold
    const nextVisible = nearHorizontal || nearVertical

    setHoverEdge((current) => (current === nextVisible ? current : nextVisible))
  }, [resizable, selected])

  const hideResizer = useCallback(() => {
    setHoverEdge(false)
  }, [])

  /* 选中即显示缩放手柄（更易发现/拖动）；未选中时 hover 边缘才显示 */
  const showResizer = resizable && (selected || hoverEdge)

  const resolvedWidth = Math.max(typeof width === 'number' && Number.isFinite(width) ? width : minWidth, minWidth)
  const resolvedHeight = typeof height === 'number' ? height : minHeight
  const isContentHeight = heightMode === 'content'
  const containerStyle =
    isContentHeight
      ? {
          width: resolvedWidth,
          minWidth,
          minHeight: typeof height === 'number' ? Math.max(height, minHeight) : minHeight,
        }
      : { width: resolvedWidth, height: resolvedHeight, minWidth, minHeight }

  return (
    <div
      ref={containerRef}
      onMouseMove={updateResizeHover}
      onMouseLeave={hideResizer}
      style={containerStyle}
      className={cn('group/node relative flex flex-col', selected && 'selected')}
    >
      {resizable ? (
        <NodeResizer
          isVisible={showResizer}
          minWidth={minWidth}
          minHeight={minHeight}
          lineClassName={RESIZER_LINE_CLASS}
          handleClassName={RESIZER_HANDLE_CLASS}
        />
      ) : null}

      <div
        className={cn(
          'bg-card relative flex w-full flex-1 flex-col overflow-hidden rounded-lg border shadow-sm',
          'transition-shadow duration-150',
          selected ? SELECTED_NODE_CLASS : 'border-border',
        )}
      >
        {/* ── Header ───────────────────────────────────── */}
        <div className="border-border flex items-center gap-2 border-b px-3 py-2">
          <div className={cn('h-2 w-2 rounded-full', STATUS_COLORS[status])} />
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{data.label}</span>
          {headerRight}
        </div>

        {/* ── Body ─────────────────────────────────────── */}
        <div
          className={cn(
            'flex min-h-0 flex-1 flex-col p-3',
            bodyClassName,
          )}
        >
          {children}
        </div>
      </div>

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
