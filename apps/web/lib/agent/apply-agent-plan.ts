/**
 * [INPUT]: 依赖 @xyflow/react 的边工具，依赖 @/lib/utils/create-node 的节点工厂，依赖 @/lib/utils/validate-connection 的连线校验，
 *          依赖 @/stores/use-flow-store 与 @/stores/use-history-store 的真相源，依赖 explain-agent-change 的用户可读摘要
 * [OUTPUT]: 对外提供 applyAgentPlan()，把结构化 operation 安全映射到现有画布 store，并在失败时尝试回滚
 * [POS]: lib/agent 的落图应用器，被 use-agent-session 调用，作为右侧 Agent 真正修改左侧画布的唯一入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { addEdge, type Connection, type Edge, type Node, type Viewport } from '@xyflow/react'
import { createNode } from '@/lib/utils/create-node'
import { isValidConnection } from '@/lib/utils/validate-connection'
import { useHistoryStore } from '@/stores/use-history-store'
import { useFlowStore } from '@/stores/use-flow-store'
import type { WorkflowNodeData } from '@/types'
import { explainAgentChange } from './explain-agent-change'
import { validateAgentPlan } from './validate-agent-plan'
import type { AgentPlan, WorkflowOperation } from './types'

type FlowNode = Node<WorkflowNodeData>

interface ApplyAgentPlanOptions {
  workflowId: string
  runWorkflow?: (scope?: 'all' | 'from-node', nodeId?: string) => Promise<void> | void
}

interface ApplyAgentPlanResult {
  ok: boolean
  appliedOperations: WorkflowOperation[]
  summary: string
  rolledBack: boolean
  error?: string
}

interface WorkingFlow {
  nodes: FlowNode[]
  edges: Edge[]
  viewport: Viewport
  idMap: Map<string, string>
}

export async function applyAgentPlan(
  plan: AgentPlan,
  {
    runWorkflow,
  }: ApplyAgentPlanOptions,
): Promise<ApplyAgentPlanResult> {
  const flowStore = useFlowStore.getState()
  const snapshot = {
    nodes: flowStore.nodes,
    edges: flowStore.edges,
    viewport: flowStore.viewport,
  }

  const validation = validateAgentPlan(plan)
  if (!validation.ok) {
    return {
      ok: false,
      appliedOperations: [],
      summary: validation.errors.join('；'),
      rolledBack: false,
      error: validation.errors.join('；'),
    }
  }

  useHistoryStore.getState().push({
    nodes: snapshot.nodes,
    edges: snapshot.edges,
  })

  const working: WorkingFlow = {
    nodes: structuredClone(snapshot.nodes),
    edges: structuredClone(snapshot.edges),
    viewport: snapshot.viewport,
    idMap: new Map<string, string>(),
  }
  const appliedOperations: WorkflowOperation[] = []
  const queuedRunOperations: Extract<WorkflowOperation, { type: 'run_workflow' }>[] = []

  try {
    for (const operation of plan.operations) {
      if (operation.type === 'run_workflow') {
        queuedRunOperations.push(operation)
        appliedOperations.push(operation)
        continue
      }

      await applyOperation(operation, working)
      appliedOperations.push(operation)
    }

    useFlowStore.getState().setFlow(working.nodes, working.edges, working.viewport)

    for (const operation of queuedRunOperations) {
      if (runWorkflow) {
        await runWorkflow(operation.scope, operation.nodeId)
      }
    }

    const explanation = explainAgentChange({ plan, appliedOperations })

    return {
      ok: true,
      appliedOperations,
      summary: explanation.summary,
      rolledBack: false,
    }
  } catch (error) {
    useFlowStore.getState().setFlow(snapshot.nodes, snapshot.edges, snapshot.viewport)

    return {
      ok: false,
      appliedOperations,
      summary: error instanceof Error ? error.message : '落图失败，已尝试回滚。',
      rolledBack: true,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function applyOperation(
  operation: WorkflowOperation,
  working: WorkingFlow,
) {
  switch (operation.type) {
    case 'add_node':
      applyAddNode(operation, working)
      return
    case 'update_node_data':
      applyUpdateNodeData(operation, working)
      return
    case 'remove_node':
      applyRemoveNode(operation, working)
      return
    case 'connect':
      applyConnect(operation, working)
      return
    case 'disconnect':
      applyDisconnect(operation, working)
      return
    case 'focus_nodes':
      applyFocusNodes(operation, working)
      return
    case 'request_prompt_confirmation':
      return
    case 'run_workflow':
      return
  }
}

function applyAddNode(
  operation: Extract<WorkflowOperation, { type: 'add_node' }>,
  working: WorkingFlow,
) {
  const position =
    operation.position ??
    getDefaultPosition(working.nodes.length)
  const node = createNode(operation.nodeType, position)

  if (operation.initialData) {
    node.data = {
      ...node.data,
      ...operation.initialData,
      config: {
        ...node.data.config,
        ...(isRecord(operation.initialData.config) ? operation.initialData.config : {}),
      },
    }
  }

  working.nodes.push(node)

  if (operation.nodeId) {
    working.idMap.set(operation.nodeId, node.id)
  }
}

function applyUpdateNodeData(
  operation: Extract<WorkflowOperation, { type: 'update_node_data' }>,
  working: WorkingFlow,
) {
  const targetNodeId = resolveNodeId(operation.nodeId, working.idMap)
  const node = working.nodes.find((item) => item.id === targetNodeId)
  if (!node) {
    throw new Error(`无法更新节点，目标不存在：${operation.nodeId}`)
  }

  node.data = {
    ...node.data,
    ...operation.patch,
  }

  if (isRecord(operation.patch.config)) {
    node.data.config = {
      ...node.data.config,
      ...operation.patch.config,
    }
  }
}

function applyRemoveNode(
  operation: Extract<WorkflowOperation, { type: 'remove_node' }>,
  working: WorkingFlow,
) {
  const targetNodeId = resolveNodeId(operation.nodeId, working.idMap)
  const nextNodes = working.nodes.filter((item) => item.id !== targetNodeId)
  if (nextNodes.length === working.nodes.length) {
    throw new Error(`无法删除节点，目标不存在：${operation.nodeId}`)
  }

  working.nodes = nextNodes
  working.edges = working.edges.filter((edge) => edge.source !== targetNodeId && edge.target !== targetNodeId)
}

function applyConnect(
  operation: Extract<WorkflowOperation, { type: 'connect' }>,
  working: WorkingFlow,
) {
  const source = resolveNodeId(operation.source, working.idMap)
  const target = resolveNodeId(operation.target, working.idMap)
  const connection: Connection = {
    source,
    target,
      sourceHandle: operation.sourceHandle,
      targetHandle: operation.targetHandle,
  }

  if (!isValidConnection(connection, working.nodes, working.edges)) {
    throw new Error(`无法创建连线：${operation.source} -> ${operation.target}`)
  }

  working.edges = addEdge(
    { ...connection, type: 'custom' },
    replaceInputEdge(working.edges, connection),
  )
}

function applyDisconnect(
  operation: Extract<WorkflowOperation, { type: 'disconnect' }>,
  working: WorkingFlow,
) {
  const nextEdges = working.edges.filter((edge) => edge.id !== operation.edgeId)
  if (nextEdges.length === working.edges.length) {
    throw new Error(`无法移除连线，目标不存在：${operation.edgeId}`)
  }
  working.edges = nextEdges
}

function applyFocusNodes(
  operation: Extract<WorkflowOperation, { type: 'focus_nodes' }>,
  working: WorkingFlow,
) {
  const nodeIds = operation.nodeIds.map((nodeId) => resolveNodeId(nodeId, working.idMap))
  const focusedNodes = working.nodes.filter((node) => nodeIds.includes(node.id))

  working.nodes = working.nodes.map((node) => ({
    ...node,
    selected: nodeIds.includes(node.id),
  }))

  if (focusedNodes.length > 0) {
    working.viewport = buildViewportForNodes(focusedNodes)
  }
}

function resolveNodeId(nodeId: string, idMap: Map<string, string>) {
  return idMap.get(nodeId) ?? nodeId
}

function normalizeHandleId(handleId: string | null | undefined): string | null {
  return handleId ?? null
}

function hasSameTargetHandle(edge: Edge, connection: Connection | Edge): boolean {
  return (
    edge.target === connection.target &&
    normalizeHandleId(edge.targetHandle) === normalizeHandleId(connection.targetHandle)
  )
}

function replaceInputEdge(edges: Edge[], nextEdge: Connection | Edge): Edge[] {
  return edges.filter((edge) => !hasSameTargetHandle(edge, nextEdge))
}

function getDefaultPosition(index: number) {
  const column = index % 3
  const row = Math.floor(index / 3)
  return {
    x: 120 + column * 260,
    y: 140 + row * 180,
  }
}

function buildViewportForNodes(nodes: FlowNode[]): Viewport {
  const bounds = nodes.reduce(
    (acc, node) => {
      const width = typeof node.measured?.width === 'number' ? node.measured.width : 220
      const height = typeof node.measured?.height === 'number' ? node.measured.height : 140

      return {
        minX: Math.min(acc.minX, node.position.x),
        minY: Math.min(acc.minY, node.position.y),
        maxX: Math.max(acc.maxX, node.position.x + width),
        maxY: Math.max(acc.maxY, node.position.y + height),
      }
    },
    {
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    },
  )

  const width = Math.max(bounds.maxX - bounds.minX, 280)
  const height = Math.max(bounds.maxY - bounds.minY, 180)
  const padding = 120
  const zoom = Math.max(0.65, Math.min(1.15, Math.min(1080 / (width + padding), 760 / (height + padding))))

  return {
    x: -(bounds.minX + width / 2) * zoom + 540,
    y: -(bounds.minY + height / 2) * zoom + 380,
    zoom,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
