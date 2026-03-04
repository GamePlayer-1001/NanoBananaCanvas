/**
 * [INPUT]: 依赖 ./serializer 的序列化能力，依赖 @/lib/logger
 * [OUTPUT]: 对外提供 saveToLocal / loadFromLocal / clearLocal (localStorage 读写)
 * [POS]: services/storage 的本地持久化层，被 useAutoSave hook 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Edge, Node, Viewport } from '@xyflow/react'
import { createLogger } from '@/lib/logger'
import type { WorkflowNodeData } from '@/types'
import { deserializeWorkflow, serializeWorkflow } from './serializer'

const log = createLogger('LocalStorage')

const STORAGE_KEY = 'nb-workflow'

/* ─── Save (DATA-003) ────────────────────────────────── */

export function saveToLocal(
  nodes: Node<WorkflowNodeData>[],
  edges: Edge[],
  viewport: Viewport,
): boolean {
  try {
    const data = serializeWorkflow(nodes, edges, viewport)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    log.debug('Saved to localStorage', { nodes: nodes.length, edges: edges.length })
    return true
  } catch (err) {
    log.warn('Failed to save to localStorage', {
      error: err instanceof Error ? err.message : String(err),
    })
    return false
  }
}

/* ─── Load ───────────────────────────────────────────── */

export function loadFromLocal(): ReturnType<typeof deserializeWorkflow> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    const result = deserializeWorkflow(parsed)
    log.info('Loaded from localStorage', { nodes: result.nodes.length, edges: result.edges.length })
    return result
  } catch (err) {
    log.warn('Failed to load from localStorage', {
      error: err instanceof Error ? err.message : String(err),
    })
    return null
  }
}

/* ─── Clear ──────────────────────────────────────────── */

export function clearLocal(): void {
  localStorage.removeItem(STORAGE_KEY)
  log.info('Cleared localStorage')
}
