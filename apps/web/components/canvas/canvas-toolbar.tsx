/**
 * [INPUT]: 依赖 @/stores/use-canvas-tool-store 的 activeTool/setActiveTool，
 *          依赖 @/components/canvas/node-entry-config 的 CANVAS_TOOLBAR_ENTRIES，
 *          依赖 @/components/ui 的 Button/Tooltip，依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 CanvasToolbar 底部浮动工具栏组件（含上拉菜单）
 * [POS]: components/canvas 的交互工具栏，被 Canvas 内嵌使用，支持分组上拉菜单与单节点拖拽入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { type DragEvent, forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { LucideIcon } from 'lucide-react'
import { ChevronUp, Hand, MousePointer2 } from 'lucide-react'
import { useReactFlow } from '@xyflow/react'
import { useCanvasToolStore, type CanvasTool } from '@/stores/use-canvas-tool-store'
import { useFlowStore } from '@/stores/use-flow-store'
import { createNode } from '@/lib/utils/create-node'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { CANVAS_TOOLBAR_ENTRIES, type ToolbarEntry } from './node-entry-config'

/* ─── Drag Data Type ──────────────────────────────────── */

export const DRAG_DATA_TYPE = 'application/reactflow'

/* ─── Component ───────────────────────────────────────── */

export function CanvasToolbar() {
  const { activeTool, setActiveTool } = useCanvasToolStore()
  const [openGroupId, setOpenGroupId] = useState<string | null>(null)
  const [popoverOffset, setPopoverOffset] = useState<number | undefined>(undefined)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const groupButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  const onDragStart = useCallback(
    (e: DragEvent<HTMLButtonElement>, nodeType: string) => {
      e.dataTransfer.setData(DRAG_DATA_TYPE, nodeType)
      e.dataTransfer.effectAllowed = 'move'
      setOpenGroupId(null)
    },
    [],
  )

  const handleGroupToggle = useCallback((id: string) => {
    setOpenGroupId((prev) => {
      if (prev === id) return null
      // 读 ref 在事件回调中合法
      const btn = groupButtonRefs.current.get(id)
      const toolbar = btn?.closest('[data-toolbar-bar]') as HTMLElement | null
      if (btn && toolbar) {
        const toolbarRect = toolbar.getBoundingClientRect()
        const btnRect = btn.getBoundingClientRect()
        setPopoverOffset(btnRect.left + btnRect.width / 2 - toolbarRect.left)
      } else {
        setPopoverOffset(undefined)
      }
      return id
    })
  }, [])

  const { getViewport } = useReactFlow()
  const addNode = useFlowStore((s) => s.addNode)

  const addNodeToCenter = useCallback(
    (nodeType: string) => {
      const { x, y, zoom } = getViewport()
      const centerX = (-x + window.innerWidth / 2) / zoom
      const centerY = (-y + window.innerHeight / 2) / zoom
      const node = createNode(nodeType, { x: centerX, y: centerY })
      addNode(node)
      setOpenGroupId(null)
    },
    [getViewport, addNode],
  )

  const handleDirectClick = useCallback(
    (nodeType: string) => {
      addNodeToCenter(nodeType)
    },
    [addNodeToCenter],
  )

  const handleSubItemClick = useCallback(
    (nodeType: string) => {
      addNodeToCenter(nodeType)
    },
    [addNodeToCenter],
  )

  useEffect(() => {
    if (!openGroupId) return
    const onClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as HTMLElement)) {
        setOpenGroupId(null)
      }
    }
    window.addEventListener('mousedown', onClickOutside)
    return () => window.removeEventListener('mousedown', onClickOutside)
  }, [openGroupId])

  return (
    <TooltipProvider>
      <div ref={toolbarRef} className="absolute bottom-4 left-1/2 z-50 -translate-x-1/2">
        {/* ── 上拉菜单 ────────────────────────────────── */}
        {CANVAS_TOOLBAR_ENTRIES.map((entry) =>
          entry.items && openGroupId === entry.id ? (
            <PopoverMenu
              key={entry.id}
              entry={entry}
              onSelect={handleSubItemClick}
              onDragStart={onDragStart}
              activeTool={activeTool}
              anchorOffset={popoverOffset}
            />
          ) : null,
        )}

        {/* ── 主工具栏 ────────────────────────────────── */}
        <div
          data-toolbar-bar
          className={cn(
            'bg-card/95 border-border relative',
            'flex items-center gap-1 rounded-full border px-2 py-1.5 shadow-lg backdrop-blur-sm',
          )}
        >
          <ToolButton
            icon={MousePointer2}
            labelKey="select"
            isActive={activeTool === 'select'}
            onClick={() => { setActiveTool('select'); setOpenGroupId(null) }}
          />
          <ToolButton
            icon={Hand}
            labelKey="hand"
            isActive={activeTool === 'hand'}
            onClick={() => { setActiveTool('hand'); setOpenGroupId(null) }}
          />

          <Separator orientation="vertical" className="mx-1 !h-6" />

          {CANVAS_TOOLBAR_ENTRIES.map((entry) =>
            entry.items ? (
              <GroupButton
                key={entry.id}
                entry={entry}
                isOpen={openGroupId === entry.id}
                isActive={entry.items.some((item) => activeTool === item.type)}
                onClick={() => handleGroupToggle(entry.id)}
                ref={(el) => {
                  if (el) groupButtonRefs.current.set(entry.id, el)
                  else groupButtonRefs.current.delete(entry.id)
                }}
              />
            ) : (
              <ToolButton
                key={entry.id}
                icon={entry.icon}
                labelKey={entry.labelKey}
                isActive={activeTool === entry.nodeType}
                onClick={() => handleDirectClick(entry.nodeType!)}
                draggable
                onDragStart={(e) => onDragStart(e, entry.nodeType!)}
              />
            ),
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

/* ─── PopoverMenu (上拉菜单) ──────────────────────────── */

interface PopoverMenuProps {
  entry: ToolbarEntry
  onSelect: (nodeType: string) => void
  onDragStart: (e: DragEvent<HTMLButtonElement>, nodeType: string) => void
  activeTool: CanvasTool
  anchorOffset?: number
}

function PopoverMenu({ entry, onSelect, onDragStart, activeTool, anchorOffset }: PopoverMenuProps) {
  const tCtx = useTranslations('contextMenu')

  return (
    <div
      className={cn(
        'bg-card/95 border-border absolute bottom-full mb-2',
        'min-w-[160px] rounded-xl border py-1.5 shadow-xl backdrop-blur-sm',
        'animate-in fade-in-0 slide-in-from-bottom-2 duration-150',
      )}
      style={
        anchorOffset != null
          ? { left: anchorOffset, transform: 'translateX(-50%)' }
          : { left: '50%', transform: 'translateX(-50%)' }
      }
    >
      {entry.items!.map(({ type, labelKey, icon: Icon }) => (
        <button
          key={type}
          className={cn(
            'flex w-full items-center gap-2.5 px-3 py-2 text-sm',
            'hover:bg-accent hover:text-accent-foreground',
            'cursor-pointer transition-colors',
            activeTool === type && 'bg-accent text-accent-foreground',
          )}
          onClick={() => onSelect(type)}
          draggable
          onDragStart={(e) => onDragStart(e, type)}
        >
          <Icon className="h-4 w-4 opacity-60" />
          <span>{tCtx(labelKey)}</span>
        </button>
      ))}
    </div>
  )
}

/* ─── GroupButton (展开按钮) ──────────────────────────── */

interface GroupButtonProps {
  entry: ToolbarEntry
  isOpen: boolean
  isActive: boolean
  onClick: () => void
}

const GroupButton = forwardRef<HTMLButtonElement, GroupButtonProps>(
  function GroupButton({ entry, isOpen, isActive, onClick }, ref) {
    const t = useTranslations('toolbar')
    const Icon = entry.icon

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            ref={ref}
            variant="ghost"
            size="icon-sm"
            className={cn(
              'relative rounded-full transition-colors',
              (isOpen || isActive) && 'bg-[var(--brand-500)] text-white hover:bg-[var(--brand-500)]/90 hover:text-white',
            )}
            onClick={onClick}
          >
            <Icon size={16} />
            <ChevronUp
              size={8}
              className={cn(
                'absolute -top-0.5 right-0 transition-transform',
                isOpen ? 'rotate-0' : 'rotate-180',
              )}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={8}>
          {t(entry.labelKey)}
        </TooltipContent>
      </Tooltip>
    )
  },
)

/* ─── ToolButton ──────────────────────────────────────── */

interface ToolButtonProps {
  icon: LucideIcon
  labelKey: string
  isActive: boolean
  onClick: () => void
  draggable?: boolean
  onDragStart?: (e: DragEvent<HTMLButtonElement>) => void
}

function ToolButton({ icon: Icon, labelKey, isActive, onClick, draggable, onDragStart }: ToolButtonProps) {
  const t = useTranslations('toolbar')

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
        {t(labelKey)}
      </TooltipContent>
    </Tooltip>
  )
}
