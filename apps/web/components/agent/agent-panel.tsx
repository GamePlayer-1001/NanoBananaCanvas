/**
 * [INPUT]: 依赖 react 的 ReactNode/useEffect/useRef/useState，依赖 lucide-react 的面板控制图标，
 *          依赖宿主布局传入的 Header / Conversation / Quick Actions / Composer 槽位
 * [OUTPUT]: 对外提供 AgentPanel 组件，作为右下角悬浮 Agent 卡片壳，支持折叠、拖拽与宽度调整
 * [POS]: components/agent 的顶层容器，被编辑器页接入，用于承载 Agent 各分区但不持有业务编排逻辑
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import {
  GripHorizontal,
  Maximize2,
  Minimize2,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const DEFAULT_WIDTH = 600
const MIN_WIDTH = 510
const MAX_WIDTH = 840
const DEFAULT_POSITION = { x: 0, y: 0 }

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
  const shellRef = useRef<HTMLDivElement | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [width, setWidth] = useState(DEFAULT_WIDTH)
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
    startX: number
    startWidth: number
  } | null>(null)

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      if (dragRef.current) {
        const deltaX = event.clientX - dragRef.current.startX
        const deltaY = event.clientY - dragRef.current.startY
        setPosition({
          x: dragRef.current.originX + deltaX,
          y: dragRef.current.originY + deltaY,
        })
      }

      if (resizeRef.current) {
        const deltaX = resizeRef.current.startX - event.clientX
        const nextWidth = Math.min(
          MAX_WIDTH,
          Math.max(MIN_WIDTH, resizeRef.current.startWidth + deltaX),
        )
        setWidth(nextWidth)
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
  }, [])

  function startDrag(event: ReactPointerEvent<HTMLDivElement>) {
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

  function startResize(event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault()
    resizeRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: width,
    }
  }

  const collapsedWidth = 132
  const panelWidth = isCollapsed ? collapsedWidth : width

  return (
    <div
      ref={shellRef}
      className={cn(
        'pointer-events-none absolute right-6 bottom-6 z-40 hidden lg:block',
        className,
      )}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
      <div
        className={cn(
          'pointer-events-auto relative overflow-hidden rounded-[28px] border border-black/8 bg-white/96 shadow-[0_28px_90px_rgba(15,23,42,0.14)] backdrop-blur-xl transition-[width,height,box-shadow] duration-200 motion-reduce:transition-none',
          isExpanded ? 'h-[min(82vh,760px)]' : 'h-[72px]',
        )}
        style={{ width: panelWidth }}
      >
        <div className="absolute inset-y-6 left-0 w-3">
          <button
            type="button"
            data-agent-panel-action="true"
            aria-label="Resize agent panel"
            className={cn(
              'absolute inset-y-0 left-0 hidden w-3 cursor-col-resize rounded-full bg-transparent transition hover:bg-indigo-500/10 lg:block',
              isCollapsed ? 'pointer-events-none opacity-0' : 'opacity-100',
            )}
            onPointerDown={startResize}
          />
        </div>

        <div
          className={cn(
            'border-b border-black/6',
            isCollapsed ? 'px-3 py-3' : 'px-4 py-3',
          )}
          onPointerDown={startDrag}
        >
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600">
                <GripHorizontal size={16} />
              </div>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                data-agent-panel-action="true"
                className="rounded-full text-slate-500 hover:text-slate-900"
                onClick={() => setIsCollapsed(false)}
              >
                <PanelRightOpen size={16} />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                data-agent-panel-action="true"
                className="rounded-full text-slate-500 hover:text-slate-900"
                onClick={() => setIsExpanded((current) => !current)}
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600">
                  <GripHorizontal size={16} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">Agent</p>
                  <p className="truncate text-[11px] text-slate-500">悬浮创作助手</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  data-agent-panel-action="true"
                  className="rounded-full text-slate-500 hover:text-slate-900"
                  onClick={() => setIsExpanded((current) => !current)}
                >
                  {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  data-agent-panel-action="true"
                  className="rounded-full text-slate-500 hover:text-slate-900"
                  onClick={() => setIsCollapsed(true)}
                >
                  <PanelRightClose size={16} />
                </Button>
              </div>
            </div>
          )}
        </div>

        {!isExpanded ? null : isCollapsed ? (
          <div className="flex h-[calc(100%-73px)] items-center justify-center px-3">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="h-10 w-1 rounded-full bg-indigo-500/30" />
              <p className="text-[11px] tracking-[0.18em] text-slate-400 [writing-mode:vertical-rl]">
                AGENT
              </p>
            </div>
          </div>
        ) : (
          <div className="flex h-[calc(100%-73px)] min-h-0 flex-col">
            <div className="shrink-0 px-4 py-3">
              {header}
            </div>
            <div className="min-h-0 flex-1 px-4">
              {conversation}
            </div>
            <div className="shrink-0 px-4 pb-3">
              {quickActions}
            </div>
            <div className="shrink-0 border-t border-black/6 px-4 py-3">
              {composer}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
