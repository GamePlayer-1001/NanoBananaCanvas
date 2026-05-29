/**
 * [INPUT]: 依赖 @xyflow/react 的 useReactFlow/useStore，依赖 @/components/ui/button 与 lucide-react 图标，
 *          依赖 @/stores/use-agent-panel-store 的 Agent 面板模式 / 折叠 / docked 宽度
 * [OUTPUT]: 对外提供 CanvasControls 缩放/居中控制栏，按胶囊样式呈现 -/百分比/+/Fit View/Agent；
 *          docked 模式下胶囊整体左移面板宽度，避免被遮挡；Agent 折叠态浮标内嵌于胶囊尾部，紧跟 Fit View
 * [POS]: components/canvas 的辅助控件，被 Canvas 内嵌使用，作为画布右下角浮动操作条
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback } from 'react'
import { Maximize, MessageCircle, Minus, Plus } from 'lucide-react'
import { useReactFlow, useViewport } from '@xyflow/react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useAgentPanelStore } from '@/stores/use-agent-panel-store'

const ZOOM_DURATION = 180

export function CanvasControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const { zoom } = useViewport()
  const agentMode = useAgentPanelStore((state) => state.mode)
  const agentOpen = useAgentPanelStore((state) => state.isOpen)
  const dockedWidth = useAgentPanelStore((state) => state.dockedWidth)
  const setAgentOpen = useAgentPanelStore((state) => state.setOpen)

  const handleZoomIn = useCallback(() => {
    void zoomIn({ duration: ZOOM_DURATION })
  }, [zoomIn])

  const handleZoomOut = useCallback(() => {
    void zoomOut({ duration: ZOOM_DURATION })
  }, [zoomOut])

  const handleReset = useCallback(() => {
    void fitView({ padding: 0.2, duration: ZOOM_DURATION })
  }, [fitView])

  const percentage = Math.round((zoom ?? 1) * 100)
  const rightOffset = agentOpen && agentMode === 'docked' ? dockedWidth + 16 : 16

  return (
    <TooltipProvider delayDuration={200}>
      <div
        style={{ right: rightOffset }}
        className={cn(
          'absolute bottom-4 z-50 transition-[right] duration-200 ease-out',
          'flex items-center gap-0.5 rounded-full border border-border bg-card/95 px-1.5 py-1 shadow-lg backdrop-blur-sm',
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8 rounded-full text-slate-600 hover:text-slate-900"
              onClick={handleZoomOut}
              aria-label="Zoom out"
            >
              <Minus size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={6}>
            Zoom out
          </TooltipContent>
        </Tooltip>

        <button
          type="button"
          onClick={handleReset}
          className="min-w-[3.25rem] rounded-full px-2 py-1 text-center text-xs font-medium tabular-nums text-slate-700 transition-colors hover:bg-accent hover:text-slate-900"
          aria-label="Reset zoom and fit view"
        >
          {percentage}%
        </button>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8 rounded-full text-slate-600 hover:text-slate-900"
              onClick={handleZoomIn}
              aria-label="Zoom in"
            >
              <Plus size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={6}>
            Zoom in
          </TooltipContent>
        </Tooltip>

        <span className="mx-0.5 h-5 w-px bg-border" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8 rounded-full text-slate-600 hover:text-slate-900"
              onClick={handleReset}
              aria-label="Fit view"
            >
              <Maximize size={15} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={6}>
            Fit view
          </TooltipContent>
        </Tooltip>

        {!agentOpen ? (
          <>
            <span className="mx-0.5 h-5 w-px bg-border" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-8 w-8 rounded-full text-slate-600 hover:text-slate-900"
                  onClick={() => setAgentOpen(true)}
                  aria-label="Open agent assistant"
                >
                  <MessageCircle size={15} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={6}>
                Agent 助手
              </TooltipContent>
            </Tooltip>
          </>
        ) : null}
      </div>
    </TooltipProvider>
  )
}
