/**
 * [INPUT]: 依赖 react 的 ReactNode/useEffect/useRef/useState，依赖 lucide-react 的面板控制图标，
 *          依赖宿主布局传入的 Header / Conversation / Quick Actions / Composer 槽位
 * [OUTPUT]: 对外提供 AgentPanel 组件，作为 Agent 卡片壳，支持「悬浮」与「右侧固定」两种展示方式，
 *          以及右上角小方形对话图标按钮的折叠/唤起入口（与画布工具栏风格统一，避免遮挡 MiniMap）
 * [POS]: components/agent 的顶层容器，被编辑器页接入，用于承载 Agent 各分区但不持有业务编排逻辑
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Minimize2, MessageCircle, PanelRight, Sparkles, X } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type PanelMode = 'floating' | 'docked'

const STORAGE_KEY_MODE = 'nbc:agent-panel-mode'
const STORAGE_KEY_OPEN = 'nbc:agent-panel-open'

/* ── 默认尺寸为原来 75% ────────────────────────────────── */
const DEFAULT_WIDTH = 450
const MIN_WIDTH = 380
const MAX_WIDTH = 630
const DEFAULT_HEIGHT = 855
const MIN_HEIGHT = 390
const MAX_HEIGHT = 960
const DEFAULT_POSITION = { x: -220, y: 0 }

/* ── 右侧固定模式宽度 ─────────────────────────────────── */
const DOCKED_WIDTH = 420
const DOCKED_MIN_WIDTH = 360
const DOCKED_MAX_WIDTH = 560

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function readStoredMode(): PanelMode {
  if (typeof window === 'undefined') return 'floating'
  try {
    const value = window.localStorage.getItem(STORAGE_KEY_MODE)
    return value === 'docked' ? 'docked' : 'floating'
  } catch {
    return 'floating'
  }
}

function readStoredOpen(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem(STORAGE_KEY_OPEN) !== '0'
  } catch {
    return true
  }
}

function getPanelBounds(width: number, height: number) {
  if (typeof window === 'undefined') {
    return {
      minX: DEFAULT_POSITION.x,
      maxX: DEFAULT_POSITION.x,
      minY: DEFAULT_POSITION.y,
      maxY: DEFAULT_POSITION.y,
    }
  }

  const margin = 24
  return {
    minX: -(window.innerWidth - width - margin * 2),
    maxX: 0,
    minY: -(window.innerHeight - height - margin * 2),
    maxY: 0,
  }
}

function clampPosition(position: { x: number; y: number }, width: number, height: number) {
  const bounds = getPanelBounds(width, height)
  return {
    x: clamp(position.x, Math.min(bounds.minX, bounds.maxX), Math.max(bounds.minX, bounds.maxX)),
    y: clamp(position.y, Math.min(bounds.minY, bounds.maxY), Math.max(bounds.minY, bounds.maxY)),
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
  const [mode, setMode] = useState<PanelMode>(() => readStoredMode())
  const [isOpen, setIsOpen] = useState<boolean>(() => readStoredOpen())
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [height, setHeight] = useState(DEFAULT_HEIGHT)
  const [dockedWidth, setDockedWidth] = useState(DOCKED_WIDTH)
  const [position, setPosition] = useState(DEFAULT_POSITION)

  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
  } | null>(null)
  const resizeRef = useRef<{
    pointerId: number
    target: 'left' | 'top' | 'corner' | 'docked-left'
    startX: number
    startY: number
    startWidth: number
    startHeight: number
  } | null>(null)

  /* ── 写入持久化偏好 ──────────────────────────────────── */
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY_MODE, mode)
    } catch {
      /* ignore */
    }
  }, [mode])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY_OPEN, isOpen ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [isOpen])

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
        if (resizeRef.current.target === 'docked-left') {
          const delta = resizeRef.current.startX - event.clientX
          const next = clamp(
            resizeRef.current.startWidth + delta,
            DOCKED_MIN_WIDTH,
            DOCKED_MAX_WIDTH,
          )
          setDockedWidth(next)
          return
        }

        const deltaX = resizeRef.current.startX - event.clientX
        const deltaY = resizeRef.current.startY - event.clientY
        const nextWidth =
          resizeRef.current.target === 'top'
            ? resizeRef.current.startWidth
            : clamp(resizeRef.current.startWidth + deltaX, MIN_WIDTH, MAX_WIDTH)
        const nextHeight =
          resizeRef.current.target === 'left'
            ? resizeRef.current.startHeight
            : clamp(resizeRef.current.startHeight + deltaY, MIN_HEIGHT, MAX_HEIGHT)

        setWidth(nextWidth)
        setHeight(nextHeight)
        setPosition((current) => clampPosition(current, nextWidth, nextHeight))
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
  }, [height, mode, width])

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

  function startResize(
    event: ReactPointerEvent<HTMLButtonElement>,
    target: 'left' | 'top' | 'corner' | 'docked-left',
  ) {
    event.preventDefault()
    resizeRef.current = {
      pointerId: event.pointerId,
      target,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: target === 'docked-left' ? dockedWidth : width,
      startHeight: height,
    }
  }

  /* ── 折叠：渲染右下角对话图标 ──────────────────────── */
  if (!isOpen) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Open agent assistant"
              onClick={() => setIsOpen(true)}
              className={cn(
                'fixed top-4 right-4 z-50 hidden h-8 w-8 items-center justify-center rounded-lg border border-border bg-card/95 text-slate-600 shadow-sm backdrop-blur-sm transition-colors hover:bg-accent hover:text-slate-900 lg:flex',
                className,
              )}
            >
              <MessageCircle size={15} strokeWidth={2} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" sideOffset={6}>
            打开 Agent 助手
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
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
            className="absolute inset-y-0 -left-1.5 z-10 hidden w-3 cursor-ew-resize lg:block"
            onPointerDown={(event) => startResize(event, 'docked-left')}
          />

          <div className="border-b border-black/6">
            <PanelHeader
              mode={mode}
              onToggleMode={() => setMode('floating')}
              onCollapse={() => setIsOpen(false)}
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
        'pointer-events-none absolute right-6 bottom-6 z-40 hidden lg:block',
        className,
      )}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
      <div
        data-testid="agent-panel"
        data-agent-panel-mode="floating"
        className="pointer-events-auto relative flex flex-col overflow-hidden rounded-[28px] border border-black/8 bg-white/96 shadow-[0_28px_90px_rgba(15,23,42,0.14)] backdrop-blur-xl transition-[width,height,box-shadow,transform] duration-200 motion-reduce:transition-none"
        style={{
          width: `min(${width}px, calc(100vw - 48px))`,
          height: `min(${height}px, calc(100vh - 48px))`,
        }}
      >
        <button
          type="button"
          data-agent-panel-action="true"
          aria-label="Resize agent panel width"
          className="absolute inset-y-0 -left-3 hidden w-6 cursor-ew-resize lg:block"
          onPointerDown={(event) => startResize(event, 'left')}
        />
        <button
          type="button"
          data-agent-panel-action="true"
          aria-label="Resize agent panel height"
          className="absolute -top-3 inset-x-8 hidden h-6 cursor-ns-resize lg:block"
          onPointerDown={(event) => startResize(event, 'top')}
        />
        <button
          type="button"
          data-agent-panel-action="true"
          aria-label="Resize agent panel width and height"
          className="absolute -top-3 -left-3 hidden h-7 w-7 cursor-nwse-resize lg:block"
          onPointerDown={(event) => startResize(event, 'corner')}
        />

        <div
          className="cursor-grab border-b border-black/6 active:cursor-grabbing"
          onPointerDown={startDrag}
        >
          <PanelHeader
            mode={mode}
            onToggleMode={() => setMode('docked')}
            onCollapse={() => setIsOpen(false)}
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
