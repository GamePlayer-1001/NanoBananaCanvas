/**
 * [INPUT]: 依赖 react 的 useEffect/useMemo，依赖 @/lib/agent/summarize-canvas 的节点语境压缩，
 *          依赖 @/stores/use-flow-store / use-agent-store / use-workflow-metadata-store 的真相源
 * [OUTPUT]: 对外提供 useAgentSelectionContext()，同步当前选中节点的 Agent 语境快照
 * [POS]: hooks 的节点语境桥接层，被编辑器页与 Agent 会话消费，负责把选中节点状态稳定映射到 AgentStore
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useEffect, useMemo } from 'react'
import type { AgentSelectionContext } from '@/lib/agent/types'
import { summarizeCanvas } from '@/lib/agent/summarize-canvas'
import { useAgentStore } from '@/stores/use-agent-store'
import { useFlowStore } from '@/stores/use-flow-store'
import { useWorkflowMetadataStore } from '@/stores/use-workflow-metadata-store'

interface UseAgentSelectionContextOptions {
  workflowId: string
  workflowName?: string
}

export function useAgentSelectionContext({
  workflowId,
  workflowName,
}: UseAgentSelectionContextOptions): AgentSelectionContext | null {
  const nodes = useFlowStore((state) => state.nodes)
  const edges = useFlowStore((state) => state.edges)
  const template = useWorkflowMetadataStore((state) => state.template)
  const auditTrail = useWorkflowMetadataStore((state) => state.auditTrail)
  const setSelectionContext = useAgentStore((state) => state.setSelectionContext)

  const selectionContext = useMemo(() => {
    const summary = summarizeCanvas({
      workflowId,
      workflowName,
      nodes,
      edges,
      template: template ?? undefined,
      auditTrail,
    })

    return summary.selectionContext ?? null
  }, [auditTrail, edges, nodes, template, workflowId, workflowName])

  useEffect(() => {
    setSelectionContext(selectionContext)
    return () => {
      setSelectionContext(null)
    }
  }, [selectionContext, setSelectionContext])

  return selectionContext
}
