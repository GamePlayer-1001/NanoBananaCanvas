/**
 * [INPUT]: 依赖 @xyflow/react 的 ReactFlow + ReactFlowProvider，
 *          依赖 @/components/nodes/registry 的 NODE_TYPES，
 *          依赖 @/components/edges/registry 的 EDGE_TYPES，
 *          依赖 @/services/storage/serializer 的 deserializeWorkflow
 * [OUTPUT]: 对外提供 WorkflowPreview 只读画布预览组件
 * [POS]: explore/detail 的只读预览器，被 explore-detail-content.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useMemo } from 'react'
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
} from '@xyflow/react'

import { NODE_TYPES } from '@/components/nodes/registry'
import { EDGE_TYPES } from '@/components/edges/registry'
import { deserializeWorkflow } from '@/services/storage/serializer'

import '@/styles/reactflow.css'

/* ─── Types ──────────────────────────────────────────── */

interface WorkflowPreviewProps {
  data?: string
}

/* ─── Component ──────────────────────────────────────── */

function PreviewInner({ data }: WorkflowPreviewProps) {
  const { nodes, edges, viewport } = useMemo(() => {
    if (!data || data === '{}') {
      return { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } }
    }
    try {
      return deserializeWorkflow(JSON.parse(data))
    } catch {
      return { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } }
    }
  }, [data])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      defaultViewport={viewport}
      nodeTypes={NODE_TYPES}
      edgeTypes={EDGE_TYPES}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      panOnDrag
      zoomOnScroll
      fitView
      fitViewOptions={{ padding: 0.3 }}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
    </ReactFlow>
  )
}

export function WorkflowPreview({ data }: WorkflowPreviewProps) {
  return (
    <ReactFlowProvider>
      <PreviewInner data={data} />
    </ReactFlowProvider>
  )
}
