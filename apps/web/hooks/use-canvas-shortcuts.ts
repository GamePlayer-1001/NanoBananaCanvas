/**
 * [INPUT]: 依赖 @/hooks/use-workflow-executor 的执行控制，
 *          依赖 @/stores/use-flow-store 的节点/边/视口，
 *          依赖 @/stores/use-history-store 的撤销/重做，
 *          依赖 @/services/storage 的导入导出，
 *          依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 useCanvasShortcuts hook (画布全局快捷键 含 Ctrl+Z/Ctrl+Shift+Z)
 * [POS]: hooks 的快捷键桥梁，在 Canvas 组件中激活
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { useFlowStore } from '@/stores/use-flow-store'
import { useHistoryStore } from '@/stores/use-history-store'
import { useWorkflowExecutor } from '@/hooks/use-workflow-executor'
import { exportWorkflow, importWorkflow } from '@/services/storage'

/* ─── Hook ───────────────────────────────────────────── */

export function useCanvasShortcuts(workflowId?: string) {
  const { execute, abort, isExecuting } = useWorkflowExecutor(workflowId)
  const t = useTranslations('canvas')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey

      /* Ctrl+Z → 撤销 */
      if (ctrl && !e.shiftKey && e.key === 'z') {
        e.preventDefault()
        const snapshot = useHistoryStore.getState().undo()
        if (snapshot) {
          const { nodes: curNodes, edges: curEdges } = useFlowStore.getState()
          /* 把当前状态推入 future 栈 */
          useHistoryStore.setState((s) => ({
            future: [...s.future, { nodes: curNodes, edges: curEdges }],
          }))
          useFlowStore.getState().setFlow(snapshot.nodes, snapshot.edges)
        }
        return
      }

      /* Ctrl+Shift+Z → 重做 */
      if (ctrl && e.shiftKey && e.key === 'z') {
        e.preventDefault()
        const snapshot = useHistoryStore.getState().redo()
        if (snapshot) {
          const { nodes: curNodes, edges: curEdges } = useFlowStore.getState()
          /* 把当前状态推入 past 栈 */
          useHistoryStore.setState((s) => ({
            past: [...s.past, { nodes: curNodes, edges: curEdges }],
          }))
          useFlowStore.getState().setFlow(snapshot.nodes, snapshot.edges)
        }
        return
      }

      /* Ctrl+Enter → 执行工作流 */
      if (ctrl && e.key === 'Enter') {
        e.preventDefault()
        if (isExecuting) return
        execute()
        return
      }

      /* Escape → 中断执行 */
      if (e.key === 'Escape' && isExecuting) {
        e.preventDefault()
        abort()
        toast.info(t('executionAborted'))
        return
      }

      /* Ctrl+S → 导出 */
      if (ctrl && e.key === 's') {
        e.preventDefault()
        const { nodes, edges, viewport } = useFlowStore.getState()
        if (nodes.length === 0) {
          toast.warning(t('nothingToExport'))
          return
        }
        exportWorkflow(nodes, edges, viewport)
        toast.success(t('workflowExported'))
        return
      }

      /* Ctrl+O → 导入 */
      if (ctrl && e.key === 'o') {
        e.preventDefault()
        importWorkflow()
          .then((result) => {
            useFlowStore.getState().setFlow(result.nodes, result.edges, result.viewport)
            toast.success(t('importedName', { name: result.name }))
          })
          .catch(() => {
            toast.error(t('importFailed'))
          })
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [execute, abort, isExecuting, t])
}
