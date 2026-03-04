/**
 * [INPUT]: 依赖 @xyflow/react 的 ReactFlow 引擎，依赖 @/stores/use-flow-store 的画布状态
 * [OUTPUT]: 对外提供 Canvas 主画布组件
 * [POS]: components/canvas 的核心渲染器，被 workspace/[id] 页面消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, useRef } from 'react'
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  type ReactFlowInstance,
  SelectionMode,
} from '@xyflow/react'
import { useFlowStore } from '@/stores/use-flow-store'
import { ErrorBoundary } from '@/components/error-boundary'
import { CanvasControls } from './canvas-controls'
import { NODE_TYPES } from '../nodes/registry'
import { EDGE_TYPES } from '../edges/registry'

import '@/styles/reactflow.css'

/* ─── Constants ───────────────────────────────────────── */

const SNAP_GRID: [number, number] = [20, 20]
const MIN_ZOOM = 0.1
const MAX_ZOOM = 2

/* ─── Component ───────────────────────────────────────── */

export function Canvas() {
  const rfInstance = useRef<ReactFlowInstance | null>(null)
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setViewport } =
    useFlowStore()

  const onInit = useCallback((instance: ReactFlowInstance) => {
    rfInstance.current = instance
  }, [])

  return (
    <ErrorBoundary>
      <div className="h-full w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={onInit}
          onMoveEnd={(_, viewport) => setViewport(viewport)}
          nodeTypes={NODE_TYPES}
          edgeTypes={EDGE_TYPES}
          /* ── 交互行为 ──────────────────────────────── */
          selectionMode={SelectionMode.Partial}
          panOnScroll={false}
          panOnDrag={[1, 2]}
          selectionOnDrag
          snapToGrid
          snapGrid={SNAP_GRID}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          deleteKeyCode={['Backspace', 'Delete']}
          /* ── 连线默认 ──────────────────────────────── */
          defaultEdgeOptions={{ type: 'custom', animated: false }}
          connectionLineStyle={{ stroke: 'var(--brand-400)', strokeWidth: 2 }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <CanvasControls />
        </ReactFlow>
      </div>
    </ErrorBoundary>
  )
}
