/**
 * [INPUT]: 依赖 @/stores/use-canvas-tool-store 的 activeTool/setActiveTool，
 *          依赖 @/components/nodes/plugin-registry 的 getAllNodeMetas，
 *          依赖 @/components/ui 的 Button/Tooltip，依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 CanvasToolbar 底部浮动工具栏组件
 * [POS]: components/canvas 的交互工具栏，被 Canvas 内嵌使用，支持点击切换工具和拖拽创建节点
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { type DragEvent, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import type { LucideIcon } from 'lucide-react'
import { Hand, MousePointer2 } from 'lucide-react'
import { getAllNodeMetas } from '@/components/nodes/plugin-registry'
import { useCanvasToolStore, type CanvasTool } from '@/stores/use-canvas-tool-store'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

/* ─── Types ───────────────────────────────────────────── */

interface ToolDef {
  id: CanvasTool
  labelKey: string
  icon: LucideIcon
  /** 是否为节点工具 (支持拖拽创建) */
  nodeType?: string
}

/* ─── Tool Definitions ────────────────────────────────── */

const POINTER_TOOLS: ToolDef[] = [
  { id: 'select', labelKey: 'select', icon: MousePointer2 },
  { id: 'hand', labelKey: 'hand', icon: Hand },
]

/* 节点工具从 plugin-registry 派生 (单一真相源) */
const NODE_TOOLS: ToolDef[] = getAllNodeMetas().map((meta) => ({
  id: meta.type as CanvasTool,
  labelKey: meta.toolbar.labelKey,
  icon: meta.icon,
  nodeType: meta.type,
}))

/* ─── Drag Data Type ──────────────────────────────────── */

export const DRAG_DATA_TYPE = 'application/reactflow'

/* ─── Component ───────────────────────────────────────── */

export function CanvasToolbar() {
  const { activeTool, setActiveTool } = useCanvasToolStore()

  const onDragStart = useCallback(
    (e: DragEvent<HTMLButtonElement>, nodeType: string) => {
      e.dataTransfer.setData(DRAG_DATA_TYPE, nodeType)
      e.dataTransfer.effectAllowed = 'move'
    },
    [],
  )

  return (
    <TooltipProvider>
      <div
        className={cn(
          'bg-card/95 border-border absolute bottom-4 left-1/2 z-50 -translate-x-1/2',
          'flex items-center gap-1 rounded-full border px-2 py-1.5 shadow-lg backdrop-blur-sm',
        )}
      >
        {/* ── Pointer Tools ────────────────────────────── */}
        {POINTER_TOOLS.map((tool) => (
          <ToolButton
            key={tool.id}
            tool={tool}
            isActive={activeTool === tool.id}
            onClick={() => setActiveTool(tool.id)}
          />
        ))}

        <Separator orientation="vertical" className="mx-1 !h-6" />

        {/* ── Node Tools (支持拖拽) ────────────────────── */}
        {NODE_TOOLS.map((tool) => (
          <ToolButton
            key={tool.id}
            tool={tool}
            isActive={activeTool === tool.id}
            onClick={() => setActiveTool(tool.id)}
            draggable
            onDragStart={(e) => onDragStart(e, tool.nodeType!)}
          />
        ))}
      </div>
    </TooltipProvider>
  )
}

/* ─── ToolButton ──────────────────────────────────────── */

interface ToolButtonProps {
  tool: ToolDef
  isActive: boolean
  onClick: () => void
  draggable?: boolean
  onDragStart?: (e: DragEvent<HTMLButtonElement>) => void
}

function ToolButton({ tool, isActive, onClick, draggable, onDragStart }: ToolButtonProps) {
  const t = useTranslations('toolbar')
  const Icon = tool.icon

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn(
            'rounded-full transition-colors',
            isActive && 'bg-[var(--brand-500)] text-white hover:bg-[var(--brand-500)]/90 hover:text-white',
          )}
          onClick={onClick}
          draggable={draggable}
          onDragStart={onDragStart}
        >
          <Icon size={16} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8}>
        {t(tool.labelKey)}
      </TooltipContent>
    </Tooltip>
  )
}
