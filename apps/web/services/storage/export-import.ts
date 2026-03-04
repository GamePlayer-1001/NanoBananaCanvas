/**
 * [INPUT]: 依赖 ./serializer 的序列化能力，依赖 @/lib/logger
 * [OUTPUT]: 对外提供 exportWorkflow / importWorkflow (JSON 文件导出导入)
 * [POS]: services/storage 的文件 I/O 层，被 Toolbar 导入导出按钮消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Edge, Node, Viewport } from '@xyflow/react'
import { createLogger } from '@/lib/logger'
import type { WorkflowNodeData } from '@/types'
import { deserializeWorkflow, serializeWorkflow } from './serializer'

const log = createLogger('ExportImport')

/* ─── Export (DATA-004) ──────────────────────────────── */

export function exportWorkflow(
  nodes: Node<WorkflowNodeData>[],
  edges: Edge[],
  viewport: Viewport,
  name = 'workflow',
): void {
  const data = serializeWorkflow(nodes, edges, viewport, name)
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${sanitizeFilename(name)}.json`
  a.click()
  URL.revokeObjectURL(url)

  log.info('Exported workflow', { name, nodes: nodes.length })
}

/* ─── Import (DATA-005) ──────────────────────────────── */

export function importWorkflow(): Promise<ReturnType<typeof deserializeWorkflow>> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'

    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) {
        reject(new Error('No file selected'))
        return
      }

      try {
        const text = await file.text()
        const parsed = JSON.parse(text)
        const result = deserializeWorkflow(parsed)
        log.info('Imported workflow', { name: result.name, nodes: result.nodes.length })
        resolve(result)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to parse file'
        log.error('Import failed', { error: msg })
        reject(new Error(msg))
      }
    }

    input.click()
  })
}

/* ─── Internal ───────────────────────────────────────── */

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]/g, '_').slice(0, 50) || 'workflow'
}
