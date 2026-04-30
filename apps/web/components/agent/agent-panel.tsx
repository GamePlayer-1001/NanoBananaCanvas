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
import { GripHorizontal, PanelRightClose, PanelRightOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const DEFAULT_WIDTH = 600
const MIN_WIDTH = 510
const MAX_WIDTH = 840
const DEFAULT_HEIGHT = 1140
const MIN_HEIGHT = 520
const MAX_HEIGHT = 1280
const DEFAULT_POSITION = { x: -220, y: 0 }

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
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [height, setHeight] = useState(DEFAULT_HEIGHT)
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
    mode: 'left' | 'top' | 'corner'
    startX: number
    startY: number
    startWidth: number
    startHeight: number
    originX: number
    originY: number
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
        const deltaY = resizeRef.current.startY - event.clientY
        const nextWidth =
          resizeRef.current.mode === 'top'
            ? resizeRef.current.startWidth
            : Math.min(
                MAX_WIDTH,
                Math.max(MIN_WIDTH, resizeRef.current.startWidth + deltaX),
              )
        const nextHeight =
          resizeRef.current.mode === 'left'
            ? resizeRef.current.startHeight
            : Math.min(
                MAX_HEIGHT,
                Math.max(MIN_HEIGHT, resizeRef.current.startHeight + deltaY),
              )

        setWidth(nextWidth)
        setHeight(nextHeight)
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

  function startResize(
    event: ReactPointerEvent<HTMLButtonElement>,
    mode: 'left' | 'top' | 'corner',
  ) {
    event.preventDefault()
    resizeRef.current = {
      pointerId: event.pointerId,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: width,
      startHeight: height,
      originX: position.x,
      originY: position.y,
    }
  }

  const collapsedWidth = 260
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
          'pointer-events-auto relative overflow-hidden rounded-[28px] border border-black/8 bg-white/96 shadow-[0_28px_90px_rgba(15,23,42,0.14)] backdrop-blur-xl transition-[width,height,box-shadow,transform] duration-200 motion-reduce:transition-none',
        )}
        style={{
          width: isCollapsed ? collapsedWidth : `min(${panelWidth}px, calc(100vw - 48px))`,
          height: isCollapsed ? 80 : `min(${height}px, calc(100vh - 48px))`,
        }}
      >
        <button
          type="button"
          data-agent-panel-action="true"
          aria-label="Resize agent panel width"
          className={cn(
            'absolute inset-y-0 -left-3 hidden w-6 cursor-ew-resize lg:block',
            isCollapsed ? 'pointer-events-none opacity-0' : 'opacity-100',
          )}
          onPointerDown={(event) => startResize(event, 'left')}
        />
        <button
          type="button"
          data-agent-panel-action="true"
          aria-label="Resize agent panel height"
          className={cn(
            'absolute -top-3 inset-x-8 hidden h-6 cursor-ns-resize lg:block',
            isCollapsed ? 'pointer-events-none opacity-0' : 'opacity-100',
          )}
          onPointerDown={(event) => startResize(event, 'top')}
        />
        <button
          type="button"
          data-agent-panel-action="true"
          aria-label="Resize agent panel width and height"
          className={cn(
            'absolute -top-3 -left-3 hidden h-7 w-7 cursor-nwse-resize lg:block',
            isCollapsed ? 'pointer-events-none opacity-0' : 'opacity-100',
          )}
          onPointerDown={(event) => startResize(event, 'corner')}
        />

        <div
          className={cn(
            'border-b border-black/6',
            isCollapsed ? 'px-4 py-3' : 'px-4 py-3',
          )}
          onPointerDown={startDrag}
        >
          {isCollapsed ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600">
                  <GripHorizontal size={16} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">Agent</p>
                  <p className="truncate text-[11px] text-slate-500">悬浮创作助手</p>
                </div>
              </div>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                data-agent-panel-action="true"
                className="shrink-0 rounded-full text-slate-500 hover:text-slate-900"
                onClick={() => setIsCollapsed(false)}
              >
                <PanelRightOpen size={16} />
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
          )}
        </div>

        {isCollapsed ? null : (
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
