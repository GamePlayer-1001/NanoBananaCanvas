/**
 * [INPUT]: 依赖 @xyflow/react 的 Handle/Position/NodeProps，依赖 @/types 的 WorkflowNodeData
 * [OUTPUT]: 对外提供 BaseNode 节点基础框架组件
 * [POS]: components/nodes 的基础模板，所有具体节点类型继承此框架
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { type ReactNode } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { WorkflowNodeData, PortDefinition } from '@/types'
import { cn } from '@/lib/utils'

/* ─── Types ───────────────────────────────────────────── */

export interface BaseNodeProps extends NodeProps {
  data: WorkflowNodeData
  icon?: ReactNode
  inputs?: PortDefinition[]
  outputs?: PortDefinition[]
  children?: ReactNode
}

/* ─── Status Indicator ────────────────────────────────── */

const STATUS_COLORS = {
  idle: 'bg-muted',
  running: 'bg-brand-500 animate-pulse',
  success: 'bg-green-500',
  error: 'bg-destructive',
  skipped: 'bg-muted-foreground',
} as const

/* ─── Component ───────────────────────────────────────── */

export function BaseNode({
  data,
  selected,
  icon,
  inputs,
  outputs,
  children,
}: BaseNodeProps) {
  const status = data.status ?? 'idle'

  return (
    <div
      className={cn(
        'bg-card relative min-h-[100px] w-[280px] rounded-lg border shadow-sm',
        'transition-shadow duration-150',
        selected ? 'border-[var(--brand-500)] shadow-md' : 'border-border',
      )}
    >
      {/* ── Header ───────────────────────────────────── */}
      <div className="border-border flex items-center gap-2 border-b px-3 py-2">
        <div className={cn('h-2 w-2 rounded-full', STATUS_COLORS[status])} />
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <span className="truncate text-sm font-medium">{data.label}</span>
      </div>

      {/* ── Body ─────────────────────────────────────── */}
      <div className="p-3">{children}</div>

      {/* ── Input Handles ────────────────────────────── */}
      {inputs?.map((port, i) => (
        <Handle
          key={port.id}
          id={port.id}
          type="target"
          position={Position.Left}
          style={{ top: `${((i + 1) / (inputs.length + 1)) * 100}%` }}
          className="!bg-background !h-2.5 !w-2.5 !border-2 !border-[var(--brand-500)]"
        />
      ))}

      {/* ── Output Handles ───────────────────────────── */}
      {outputs?.map((port, i) => (
        <Handle
          key={port.id}
          id={port.id}
          type="source"
          position={Position.Right}
          style={{ top: `${((i + 1) / (outputs.length + 1)) * 100}%` }}
          className="!bg-background !h-2.5 !w-2.5 !border-2 !border-[var(--brand-500)]"
        />
      ))}
    </div>
  )
}
