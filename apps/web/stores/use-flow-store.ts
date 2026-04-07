/**
 * [INPUT]: 依赖 zustand 的 create，依赖 @xyflow/react 的 Node/Edge/Connection 类型及工具函数，
 *          依赖 @/stores/use-history-store 的快照入栈 (undo/redo)
 * [OUTPUT]: 对外提供 useFlowStore (nodes/edges/viewport CRUD + ReactFlow 事件处理 + history 集成)
 * [POS]: stores 的画布核心状态，被 Canvas/BaseNode/CustomEdge/CanvasControls 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type Viewport,
} from '@xyflow/react'
import { create } from 'zustand'
import type { WorkflowNodeData } from '@/types'
import { createLogger } from '@/lib/logger'
import { isValidConnection } from '@/lib/utils/validate-connection'
import { debouncedPush, useHistoryStore } from '@/stores/use-history-store'

const log = createLogger('FlowStore')

/* ─── Types ───────────────────────────────────────────── */

export interface FlowState {
  /* ── Data ────────────────────────────────────────────── */
  nodes: Node<WorkflowNodeData>[]
  edges: Edge[]
  viewport: Viewport

  /* ── ReactFlow Event Handlers ────────────────────────── */
  onNodesChange: (changes: NodeChange<Node<WorkflowNodeData>>[]) => void
  onEdgesChange: (changes: EdgeChange<Edge>[]) => void
  onConnect: (connection: Connection) => void
  setViewport: (viewport: Viewport) => void

  /* ── Node CRUD ───────────────────────────────────────── */
  addNode: (node: Node<WorkflowNodeData>) => void
  updateNodeData: (nodeId: string, data: Partial<WorkflowNodeData>) => void
  removeNode: (nodeId: string) => void

  /* ── Edge CRUD ───────────────────────────────────────── */
  removeEdge: (edgeId: string) => void

  /* ── Bulk ─────────────────────────────────────────────── */
  setFlow: (nodes: Node<WorkflowNodeData>[], edges: Edge[], viewport?: Viewport) => void
  clear: () => void
}

/* ─── Initial State ───────────────────────────────────── */

const INITIAL_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 1 }

/* ─── History Helpers ─────────────────────────────────── */

/** 记录当前快照到历史栈（立即） */
function pushSnapshot() {
  const { nodes, edges } = useFlowStore.getState()
  useHistoryStore.getState().push({ nodes, edges })
}

/** 记录当前快照到历史栈（防抖，用于拖拽） */
function pushSnapshotDebounced() {
  const { nodes, edges } = useFlowStore.getState()
  debouncedPush({ nodes, edges })
}

/* ─── Store ───────────────────────────────────────────── */

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  viewport: INITIAL_VIEWPORT,

  /* ── ReactFlow Event Handlers ────────────────────────── */

  onNodesChange: (changes) => {
    /* 拖拽结束时记录快照（dragEnd → position change with dragging=false） */
    const hasDragEnd = changes.some(
      (c) => c.type === 'position' && 'dragging' in c && c.dragging === false,
    )
    if (hasDragEnd) pushSnapshotDebounced()

    /* 删除操作记录快照 */
    const hasRemove = changes.some((c) => c.type === 'remove')
    if (hasRemove) pushSnapshot()

    set({ nodes: applyNodeChanges(changes, get().nodes) })
  },

  onEdgesChange: (changes) => {
    const hasRemove = changes.some((c) => c.type === 'remove')
    if (hasRemove) pushSnapshot()

    set({ edges: applyEdgeChanges(changes, get().edges) })
  },

  onConnect: (connection) => {
    log.debug('Edge connected', { source: connection.source, target: connection.target })
    if (!isValidConnection(connection, get().nodes, get().edges)) {
      log.debug('Rejected invalid edge', {
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
      })
      return
    }
    pushSnapshot()
    set({ edges: addEdge({ ...connection, type: 'custom' }, get().edges) })
  },

  setViewport: (viewport) => set({ viewport }),

  /* ── Node CRUD ───────────────────────────────────────── */

  addNode: (node) => {
    log.debug('Node added', { id: node.id, type: node.type })
    pushSnapshot()
    set((state) => ({ nodes: [...state.nodes, node] }))
  },

  updateNodeData: (nodeId, data) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n,
      ),
    }))
  },

  removeNode: (nodeId) => {
    log.debug('Node removed', { id: nodeId })
    pushSnapshot()
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    }))
  },

  /* ── Edge CRUD ───────────────────────────────────────── */

  removeEdge: (edgeId) => {
    pushSnapshot()
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== edgeId),
    }))
  },

  /* ── Bulk ─────────────────────────────────────────────── */

  setFlow: (nodes, edges, viewport) => {
    log.info('Flow loaded', { nodes: nodes.length, edges: edges.length })
    set({ nodes, edges, viewport: viewport ?? INITIAL_VIEWPORT })
  },

  clear: () => {
    log.info('Flow cleared')
    pushSnapshot()
    set({ nodes: [], edges: [], viewport: INITIAL_VIEWPORT })
  },
}))
