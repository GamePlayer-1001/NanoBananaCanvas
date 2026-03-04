/**
 * [INPUT]: 依赖 @/hooks/use-workflow-executor 的执行控制，
 *          依赖 @/stores/use-flow-store 的节点/边/视口，
 *          依赖 @/services/storage 的导入导出
 * [OUTPUT]: 对外提供 useCanvasShortcuts hook (画布全局快捷键)
 * [POS]: hooks 的快捷键桥梁，在 Canvas 组件中激活
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { useFlowStore } from '@/stores/use-flow-store'
import { useWorkflowExecutor } from '@/hooks/use-workflow-executor'
import { exportWorkflow, importWorkflow } from '@/services/storage'

/* ─── Hook ───────────────────────────────────────────── */

export function useCanvasShortcuts() {
  const { execute, abort, isExecuting } = useWorkflowExecutor()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey

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
        toast.info('Execution aborted')
        return
      }

      /* Ctrl+S → 导出 */
      if (ctrl && e.key === 's') {
        e.preventDefault()
        const { nodes, edges, viewport } = useFlowStore.getState()
        if (nodes.length === 0) {
          toast.warning('Nothing to export')
          return
        }
        exportWorkflow(nodes, edges, viewport)
        toast.success('Workflow exported')
        return
      }

      /* Ctrl+O → 导入 */
      if (ctrl && e.key === 'o') {
        e.preventDefault()
        importWorkflow()
          .then((result) => {
            useFlowStore.getState().setFlow(result.nodes, result.edges, result.viewport)
            toast.success(`Imported "${result.name}"`)
          })
          .catch(() => {
            toast.error('Import failed — invalid file')
          })
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [execute, abort, isExecuting])
}
