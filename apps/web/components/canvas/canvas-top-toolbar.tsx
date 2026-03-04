/**
 * [INPUT]: 依赖 @/hooks/use-workflow-executor 的执行控制，
 *          依赖 @/stores/use-flow-store 的节点/边/视口数据，
 *          依赖 @/services/storage 的导入导出，
 *          依赖 sonner 的 toast 通知，
 *          依赖 ./api-key-dialog 的 API Key 配置
 * [OUTPUT]: 对外提供 CanvasTopToolbar 顶部工具栏组件
 * [POS]: components/canvas 的顶部操作栏，被 Canvas 组件内嵌
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback } from 'react'
import { Download, Loader2, Play, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { useFlowStore } from '@/stores/use-flow-store'
import { useWorkflowExecutor } from '@/hooks/use-workflow-executor'
import { exportWorkflow, importWorkflow } from '@/services/storage'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { ApiKeyDialog } from './api-key-dialog'

/* ─── Component ──────────────────────────────────────── */

export function CanvasTopToolbar() {
  const { execute, abort, isExecuting } = useWorkflowExecutor()
  const nodes = useFlowStore((s) => s.nodes)
  const edges = useFlowStore((s) => s.edges)
  const viewport = useFlowStore((s) => s.viewport)
  const setFlow = useFlowStore((s) => s.setFlow)

  /* ── Execute / Abort ────────────────────────────────── */
  const handleExecute = useCallback(async () => {
    if (isExecuting) {
      abort()
      toast.info('Execution aborted')
      return
    }

    if (nodes.length === 0) {
      toast.warning('Add some nodes first')
      return
    }

    toast.info('Running workflow...')
    await execute()
  }, [isExecuting, nodes.length, execute, abort])

  /* ── Export ──────────────────────────────────────────── */
  const handleExport = useCallback(() => {
    if (nodes.length === 0) {
      toast.warning('Nothing to export')
      return
    }
    exportWorkflow(nodes, edges, viewport)
    toast.success('Workflow exported')
  }, [nodes, edges, viewport])

  /* ── Import ──────────────────────────────────────────── */
  const handleImport = useCallback(async () => {
    try {
      const result = await importWorkflow()
      setFlow(result.nodes, result.edges, result.viewport)
      toast.success(`Imported "${result.name}"`)
    } catch {
      toast.error('Import failed — invalid file')
    }
  }, [setFlow])

  return (
    <TooltipProvider>
      <div
        className={cn(
          'bg-card/95 border-border absolute top-4 left-1/2 z-50 -translate-x-1/2',
          'flex items-center gap-1 rounded-full border px-2 py-1.5 shadow-lg backdrop-blur-sm',
        )}
      >
        {/* ── Execute / Abort ──────────────────────────── */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isExecuting ? 'destructive' : 'default'}
              size="sm"
              className="gap-1.5 rounded-full"
              onClick={handleExecute}
            >
              {isExecuting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span className="hidden sm:inline">Stop</span>
                </>
              ) : (
                <>
                  <Play size={14} />
                  <span className="hidden sm:inline">Run</span>
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8}>
            {isExecuting ? 'Stop execution (Esc)' : 'Run workflow (Ctrl+Enter)'}
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 !h-6" />

        {/* ── Import ──────────────────────────────────── */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              onClick={handleImport}
            >
              <Upload size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8}>
            Import (Ctrl+O)
          </TooltipContent>
        </Tooltip>

        {/* ── Export ──────────────────────────────────── */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              onClick={handleExport}
            >
              <Download size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8}>
            Export (Ctrl+S)
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 !h-6" />

        {/* ── API Key ─────────────────────────────────── */}
        <ApiKeyDialog />
      </div>
    </TooltipProvider>
  )
}
