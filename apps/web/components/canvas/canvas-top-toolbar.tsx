/**
 * [INPUT]: 依赖 @/hooks/use-workflow-executor 的执行控制，
 *          依赖 @/stores/use-flow-store 的节点/边/视口数据，
 *          依赖 @/services/storage 的导入导出，
 *          依赖 @/hooks/use-auto-save 的 useCloudSaveStatus 保存状态，
 *          依赖 sonner 的 toast 通知，
 *          依赖 next-intl 的 useTranslations，
 *          依赖 @clerk/nextjs 的 UserButton，
 *          依赖 ./api-key-dialog 的 API Key 配置，
 *          依赖 @/components/locale-switcher 的语言切换，
 *          依赖 @/i18n/navigation 的 Link
 * [OUTPUT]: 对外提供 CanvasTopToolbar 顶部工具栏组件
 * [POS]: components/canvas 的顶部操作栏，被 Canvas 组件内嵌，支持返回导航和云端保存状态
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback } from 'react'
import { UserButton } from '@clerk/nextjs'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Check, Cloud, CloudOff, Download, Loader2, Play, Redo2, Undo2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { useFlowStore } from '@/stores/use-flow-store'
import { useHistoryStore } from '@/stores/use-history-store'
import { useWorkflowExecutor } from '@/hooks/use-workflow-executor'
import { useCloudSaveStatus } from '@/hooks/use-auto-save'
import { exportWorkflow, importWorkflow } from '@/services/storage'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { LocaleSwitcher } from '@/components/locale-switcher'
import { ApiKeyDialog } from './api-key-dialog'

/* ─── Save Status Indicator ───────────────────────────── */

function CloudSaveIndicator() {
  const t = useTranslations('canvas')
  const status = useCloudSaveStatus((s) => s.status)

  if (status === 'idle') return null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1 px-1.5">
          {status === 'saving' && <Cloud size={13} className="text-muted-foreground animate-pulse" />}
          {status === 'saved' && <Check size={13} className="text-emerald-500" />}
          {status === 'error' && <CloudOff size={13} className="text-destructive" />}
          <span className="text-muted-foreground text-[11px]">
            {status === 'saving' && t('saving')}
            {status === 'saved' && t('saved')}
            {status === 'error' && t('saveFailed')}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={8}>
        {status === 'saving' && t('saving')}
        {status === 'saved' && t('saved')}
        {status === 'error' && t('saveFailed')}
      </TooltipContent>
    </Tooltip>
  )
}

/* ─── Component ──────────────────────────────────────── */

interface CanvasTopToolbarProps {
  workflowId?: string
}

export function CanvasTopToolbar({ workflowId }: CanvasTopToolbarProps) {
  const t = useTranslations('canvas')
  const { execute, abort, isExecuting } = useWorkflowExecutor()
  const nodes = useFlowStore((s) => s.nodes)
  const edges = useFlowStore((s) => s.edges)
  const viewport = useFlowStore((s) => s.viewport)
  const setFlow = useFlowStore((s) => s.setFlow)
  const canUndo = useHistoryStore((s) => s.canUndo)
  const canRedo = useHistoryStore((s) => s.canRedo)

  /* ── Execute / Abort ────────────────────────────────── */
  const handleExecute = useCallback(async () => {
    if (isExecuting) {
      abort()
      toast.info(t('executionAborted'))
      return
    }

    if (nodes.length === 0) {
      toast.warning(t('addNodesFirst'))
      return
    }

    toast.info(t('runningWorkflow'))
    await execute()
  }, [isExecuting, nodes.length, execute, abort, t])

  /* ── Export ──────────────────────────────────────────── */
  const handleExport = useCallback(() => {
    if (nodes.length === 0) {
      toast.warning(t('nothingToExport'))
      return
    }
    exportWorkflow(nodes, edges, viewport)
    toast.success(t('workflowExported'))
  }, [nodes, edges, viewport, t])

  /* ── Undo / Redo ────────────────────────────────────── */
  const handleUndo = useCallback(() => {
    const snapshot = useHistoryStore.getState().undo()
    if (snapshot) {
      useHistoryStore.setState((s) => ({
        future: [...s.future, { nodes, edges }],
      }))
      setFlow(snapshot.nodes, snapshot.edges)
    }
  }, [nodes, edges, setFlow])

  const handleRedo = useCallback(() => {
    const snapshot = useHistoryStore.getState().redo()
    if (snapshot) {
      useHistoryStore.setState((s) => ({
        past: [...s.past, { nodes, edges }],
      }))
      setFlow(snapshot.nodes, snapshot.edges)
    }
  }, [nodes, edges, setFlow])

  /* ── Import ──────────────────────────────────────────── */
  const handleImport = useCallback(async () => {
    try {
      const result = await importWorkflow()
      setFlow(result.nodes, result.edges, result.viewport)
      toast.success(t('importedName', { name: result.name }))
    } catch {
      toast.error(t('importFailed'))
    }
  }, [setFlow, t])

  return (
    <TooltipProvider>
      <div
        className={cn(
          'bg-card/95 border-border absolute top-4 left-1/2 z-50 -translate-x-1/2',
          'flex items-center gap-1 rounded-full border px-2 py-1.5 shadow-lg backdrop-blur-sm',
        )}
      >
        {/* ── Back to Workspace ───────────────────────── */}
        {workflowId && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="rounded-full" asChild>
                  <Link href="/workspace">
                    <ArrowLeft size={14} />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8}>
                {t('backToWorkspace')}
              </TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="mx-1 !h-6" />
          </>
        )}

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
                  <span className="hidden sm:inline">{t('stop')}</span>
                </>
              ) : (
                <>
                  <Play size={14} />
                  <span className="hidden sm:inline">{t('run')}</span>
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8}>
            {isExecuting ? t('stopTooltip') : t('runTooltip')}
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 !h-6" />

        {/* ── Undo / Redo ─────────────────────────────── */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              onClick={handleUndo}
              disabled={!canUndo}
            >
              <Undo2 size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8}>
            {t('undo')} (Ctrl+Z)
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              onClick={handleRedo}
              disabled={!canRedo}
            >
              <Redo2 size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8}>
            {t('redo')} (Ctrl+Shift+Z)
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
            {t('importTooltip')}
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
            {t('exportTooltip')}
          </TooltipContent>
        </Tooltip>

        {/* ── Cloud Save Status ───────────────────────── */}
        {workflowId && <CloudSaveIndicator />}

        <Separator orientation="vertical" className="mx-1 !h-6" />

        {/* ── Locale ──────────────────────────────────── */}
        <LocaleSwitcher />

        {/* ── API Key ─────────────────────────────────── */}
        <ApiKeyDialog />

        <Separator orientation="vertical" className="mx-1 !h-6" />

        {/* ── User ───────────────────────────────────── */}
        <UserButton
          appearance={{
            elements: { avatarBox: 'w-7 h-7' },
          }}
        />
      </div>
    </TooltipProvider>
  )
}