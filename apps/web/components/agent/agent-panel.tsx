/**
 * [INPUT]: 依赖 react 的 ReactNode/useEffect/useRef/useState，依赖 lucide-react 的面板控制图标，
 *          依赖 @/stores/use-agent-panel-store 的共享面板状态 (mode/open/dockedWidth)，
 *          依赖宿主布局传入的 Header / Conversation / Quick Actions / Composer 槽位
 * [OUTPUT]: 对外提供 AgentPanel 组件，作为 Agent 卡片壳，支持「悬浮」与「右侧固定」两种展示方式；
 *          折叠态不再单独渲染浮标，由 CanvasControls 胶囊接管 (置于 Fit View 之后)，避免遮挡 MiniMap
 * [POS]: components/agent 的顶层容器，被编辑器页接入，用于承载 Agent 各分区但不持有业务编排逻辑
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Minimize2, PanelRight, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  AGENT_PANEL_DOCKED_MAX_WIDTH,
  AGENT_PANEL_DOCKED_MIN_WIDTH,
  useAgentPanelStore,
} from '@/stores/use-agent-panel-store'

type PanelMode = 'floating' | 'docked'
type ResizeTarget =
  | 'docked-left'
  | 'n'
  | 's'
  | 'e'
  | 'w'
  | 'ne'
  | 'nw'
  | 'se'
  | 'sw'

/* ── 默认尺寸为原来 75% ─────────────────────────────── */
const DEFAULT_WIDTH = 450
const MIN_WIDTH = 380
const MAX_WIDTH = 630
const DEFAULT_HEIGHT = 855
const MIN_HEIGHT = 390
const MAX_HEIGHT = 960

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getDefaultPosition(width: number, height: number) {
  if (typeof window === 'undefined') return { x: 24, y: 24 }
  const margin = 24
  return {
    x: Math.max(margin, window.innerWidth - width - margin),
    y: Math.max(margin, Math.round((window.innerHeight - height) / 2)),
  }
}

function getPanelBounds(width: number, height: number) {
  if (typeof window === 'undefined') {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 }
  }
  const margin = 8
  return {
    minX: margin,
    maxX: Math.max(margin, window.innerWidth - width - margin),
    minY: margin,
    maxY: Math.max(margin, window.innerHeight - height - margin),
  }
}

function clampPosition(position: { x: number; y: number }, width: number, height: number) {
  const bounds = getPanelBounds(width, height)
  return {
    x: clamp(position.x, bounds.minX, bounds.maxX),
    y: clamp(position.y, bounds.minY, bounds.maxY),
  }
}

interface AgentPanelProps {
  header?: ReactNode
  conversation?: ReactNode
  quickActions?: ReactNode
  composer?: ReactNode
  className?: string
}

export function AgentPanel({
  header,
  conversation,
  quickActions,
  composer,
  className,
}: AgentPanelProps) {
  const mode = useAgentPanelStore((state) => state.mode)
  const isOpen = useAgentPanelStore((state) => state.isOpen)
  const dockedWidth = useAgentPanelStore((state) => state.dockedWidth)
  const setMode = useAgentPanelStore((state) => state.setMode)
  const setOpen = useAgentPanelStore((state) => state.setOpen)
  const setDockedWidth = useAgentPanelStore((state) => state.setDockedWidth)

  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [height, setHeight] = useState(DEFAULT_HEIGHT)
  const [position, setPosition] = useState<{ x: number; y: number }>(() =>
    typeof window === 'undefined' ? { x: 0, y: 0 } : getDefaultPosition(DEFAULT_WIDTH, DEFAULT_HEIGHT),
  )

  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
  } | null>(null)
  const resizeRef = useRef<{
    pointerId: number
    target: ResizeTarget
    startX: number
    startY: number
    startWidth: number
    startHeight: number
    startPosX: number
    startPosY: number
  } | null>(null)

  /* ── 拖拽 / 调整尺寸 ─────────────────────────────────── */
  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      if (dragRef.current && mode === 'floating') {
        const deltaX = event.clientX - dragRef.current.startX
        const deltaY = event.clientY - dragRef.current.startY
        setPosition(
          clampPosition(
            {
              x: dragRef.current.originX + deltaX,
              y: dragRef.current.originY + deltaY,
            },
            width,
            height,
          ),
        )
      }

      if (resizeRef.current) {
        const r = resizeRef.current

        if (r.target === 'docked-left') {
          const delta = r.startX - event.clientX
          const next = clamp(
            r.startWidth + delta,
            AGENT_PANEL_DOCKED_MIN_WIDTH,
            AGENT_PANEL_DOCKED_MAX_WIDTH,
          )
          setDockedWidth(next)
          return
        }

        const dx = event.clientX - r.startX
        const dy = event.clientY - r.startY
        const target = r.target

        let nextWidth = r.startWidth
        let nextHeight = r.startHeight
        let nextX = r.startPosX
        let nextY = r.startPosY

        if (target === 'e' || target === 'ne' || target === 'se') {
          nextWidth = clamp(r.startWidth + dx, MIN_WIDTH, MAX_WIDTH)
        }
        if (target === 'w' || target === 'nw' || target === 'sw') {
          nextWidth = clamp(r.startWidth - dx, MIN_WIDTH, MAX_WIDTH)
          nextX = r.startPosX + (r.startWidth - nextWidth)
        }
        if (target === 's' || target === 'se' || target === 'sw') {
          nextHeight = clamp(r.startHeight + dy, MIN_HEIGHT, MAX_HEIGHT)
        }
        if (target === 'n' || target === 'ne' || target === 'nw') {
          nextHeight = clamp(r.startHeight - dy, MIN_HEIGHT, MAX_HEIGHT)
          nextY = r.startPosY + (r.startHeight - nextHeight)
        }

        setWidth(nextWidth)
        setHeight(nextHeight)
        setPosition(clampPosition({ x: nextX, y: nextY }, nextWidth, nextHeight))
      }
    }

    function handlePointerUp(event: PointerEvent) {
      if (dragRef.current?.pointerId === event.pointerId) {
        dragRef.current = null
      }
      if (resizeRef.current?.pointerId === event.pointerId) {
        resizeRef.current = null
      }
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [height, mode, setDockedWidth, width])

  useEffect(() => {
    function handleWindowResize() {
      setPosition((current) => clampPosition(current, width, height))
    }

    handleWindowResize()
    window.addEventListener('resize', handleWindowResize)

    return () => {
      window.removeEventListener('resize', handleWindowResize)
    }
  }, [height, width])

  function startDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (mode !== 'floating') return
    if (!(event.target instanceof HTMLElement)) return
    if (event.target.closest('[data-agent-panel-action="true"]')) return
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
    }
  }

  function startResize(event: ReactPointerEvent<HTMLButtonElement>, target: ResizeTarget) {
    event.preventDefault()
    event.stopPropagation()
    resizeRef.current = {
      pointerId: event.pointerId,
      target,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: target === 'docked-left' ? dockedWidth : width,
      startHeight: height,
      startPosX: position.x,
      startPosY: position.y,
    }
  }

  /* ── 折叠态：浮标交给 CanvasControls 胶囊渲染 ────────── */
  if (!isOpen) {
    return null
  }

  /* ── 右侧固定展示 ────────────────────────────────────── */
  if (mode === 'docked') {
    return (
      <div
        className={cn(
          'pointer-events-none absolute top-0 right-0 bottom-0 z-40 hidden lg:block',
          className,
        )}
      >
        <div
          data-testid="agent-panel"
          data-agent-panel-mode="docked"
          className="pointer-events-auto relative flex h-full flex-col overflow-hidden border-l border-black/8 bg-white shadow-[-8px_0_30px_rgba(15,23,42,0.06)]"
          style={{ width: dockedWidth }}
        >
          <button
            type="button"
            data-agent-panel-action="true"
            aria-label="Resize agent panel"
            className="group absolute inset-y-0 -left-1 z-10 hidden w-2 cursor-ew-resize lg:block"
            onPointerDown={(event) => startResize(event, 'docked-left')}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-2 left-1/2 w-0.5 -translate-x-1/2 rounded-full bg-transparent transition-colors group-hover:bg-indigo-500/60 group-active:bg-indigo-500"
            />
          </button>

          <div className="border-b border-black/6">
            <PanelHeader
              mode={mode}
              onToggleMode={() => setMode('floating')}
              onCollapse={() => setOpen(false)}
            />
          </div>

          <PanelBody
            header={header}
            conversation={conversation}
            quickActions={quickActions}
            composer={composer}
          />
        </div>
      </div>
    )
  }

  /* ── 浮动卡片展示 ────────────────────────────────────── */
  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-0 z-40 hidden lg:block',
        className,
      )}
    >
      <div
        data-testid="agent-panel"
        data-agent-panel-mode="floating"
        className="pointer-events-auto absolute flex flex-col overflow-visible rounded-[28px] border border-black/8 bg-white/96 shadow-[0_28px_90px_rgba(15,23,42,0.14)] backdrop-blur-xl"
        style={{
          left: position.x,
          top: position.y,
          width,
          height,
        }}
      >
        {/* 4 边 handles */}
        <button
          type="button"
          data-agent-panel-action="true"
          aria-label="向上调整高度"
          className="group absolute -top-1.5 left-6 right-6 h-3 cursor-ns-resize"
          onPointerDown={(event) => startResize(event, 'n')}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-6 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-transparent transition-colors group-hover:bg-indigo-500/60 group-active:bg-indigo-500"
          />
        </button>
        <button
          type="button"
          data-agent-panel-action="true"
          aria-label="向下调整高度"
          className="group absolute -bottom-1.5 left-6 right-6 h-3 cursor-ns-resize"
          onPointerDown={(event) => startResize(event, 's')}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-6 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-transparent transition-colors group-hover:bg-indigo-500/60 group-active:bg-indigo-500"
          />
        </button>
        <button
          type="button"
          data-agent-panel-action="true"
          aria-label="向左调整宽度"
          className="group absolute -left-1.5 top-6 bottom-6 w-3 cursor-ew-resize"
          onPointerDown={(event) => startResize(event, 'w')}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-6 left-1/2 w-0.5 -translate-x-1/2 rounded-full bg-transparent transition-colors group-hover:bg-indigo-500/60 group-active:bg-indigo-500"
          />
        </button>
        <button
          type="button"
          data-agent-panel-action="true"
          aria-label="向右调整宽度"
          className="group absolute -right-1.5 top-6 bottom-6 w-3 cursor-ew-resize"
          onPointerDown={(event) => startResize(event, 'e')}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-6 left-1/2 w-0.5 -translate-x-1/2 rounded-full bg-transparent transition-colors group-hover:bg-indigo-500/60 group-active:bg-indigo-500"
          />
        </button>

        {/* 4 角 handles */}
        <button
          type="button"
          data-agent-panel-action="true"
          aria-label="左上角调整"
          className="absolute -top-1.5 -left-1.5 z-[1] h-4 w-4 cursor-nwse-resize"
          onPointerDown={(event) => startResize(event, 'nw')}
        />
        <button
          type="button"
          data-agent-panel-action="true"
          aria-label="右上角调整"
          className="absolute -top-1.5 -right-1.5 z-[1] h-4 w-4 cursor-nesw-resize"
          onPointerDown={(event) => startResize(event, 'ne')}
        />
        <button
          type="button"
          data-agent-panel-action="true"
          aria-label="左下角调整"
          className="absolute -bottom-1.5 -left-1.5 z-[1] h-4 w-4 cursor-nesw-resize"
          onPointerDown={(event) => startResize(event, 'sw')}
        />
        <button
          type="button"
          data-agent-panel-action="true"
          aria-label="右下角调整"
          className="absolute -bottom-1.5 -right-1.5 z-[1] h-4 w-4 cursor-nwse-resize"
          onPointerDown={(event) => startResize(event, 'se')}
        />

        <div
          className="cursor-grab rounded-t-[28px] border-b border-black/6 active:cursor-grabbing"
          onPointerDown={startDrag}
        >
          <PanelHeader
            mode={mode}
            onToggleMode={() => setMode('docked')}
            onCollapse={() => setOpen(false)}
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-b-[28px]">
          <PanelBody
            header={header}
            conversation={conversation}
            quickActions={quickActions}
            composer={composer}
          />
        </div>
      </div>
    </div>
  )
}

/* ─── Sub Components ─────────────────────────────────── */

interface PanelHeaderProps {
  mode: PanelMode
  onToggleMode: () => void
  onCollapse: () => void
}

function PanelHeader({ mode, onToggleMode, onCollapse }: PanelHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600">
          <Sparkles size={14} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">Agent</p>
          <p className="truncate text-[11px] text-slate-500">
            {mode === 'docked' ? '固定到右侧' : '悬浮创作助手'}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          data-agent-panel-action="true"
          aria-label={mode === 'docked' ? '切换为悬浮窗口' : '固定到右侧'}
          title={mode === 'docked' ? '切换为悬浮窗口' : '固定到右侧'}
          className="rounded-full text-slate-500 hover:text-slate-900"
          onClick={onToggleMode}
        >
          {mode === 'docked' ? <Minimize2 size={15} /> : <PanelRight size={15} />}
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          data-agent-panel-action="true"
          aria-label="折叠到右下角"
          title="折叠到右下角"
          className="rounded-full text-slate-500 hover:text-slate-900"
          onClick={onCollapse}
        >
          <X size={15} />
        </Button>
      </div>
    </div>
  )
}

interface PanelBodyProps {
  header?: ReactNode
  conversation?: ReactNode
  quickActions?: ReactNode
  composer?: ReactNode
}

function PanelBody({ header, conversation, quickActions, composer }: PanelBodyProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-4 py-3">{header}</div>
      <div className="min-h-0 flex-1 px-4">{conversation}</div>
      <div className="shrink-0 px-4 pb-3">{quickActions}</div>
      <div className="shrink-0 border-t border-black/6 px-4 py-3">{composer}</div>
    </div>
  )
}
