/**
 * [INPUT]: 依赖 ./types 的 CanvasSummary/WorkflowOperation/AgentPlanIntent，依赖 ./plan-rules 的节点操作辅助函数，依赖 ./intent-resolver 的 WorkflowReferenceSketch
 * [OUTPUT]: 对外提供 buildWorkflowReferenceOperations / buildIncrementalOperations / buildDiagnoseOperations / shouldBuildFollowUpFromResult
 * [POS]: lib/agent 的操作构建层，把各类 intent 翻译为具体 WorkflowOperation 列表，被 api/agent/plan/route 的 buildPlannerResponse 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { getDefaultPlatformRuntimeModel } from '@/lib/platform-runtime'
import {
  buildCreationOperations,
  buildSelectedNodeOptimizationOperations,
  buildSelectedNodePromptOperations,
  shouldOptimizeSelectedNode,
  shouldPatchSelectedNodePrompt,
} from './plan-rules'
import type { WorkflowReferenceSketch } from './intent-resolver'
import type { AgentPlanIntent, CanvasSummary, CanvasSummaryNode, WorkflowOperation } from './types'

/* ─── Keywords ────────────────────────────────────────── */

const KEYWORDS_MISSING_IMAGE_INPUT = [
  '图片输入', '把图接进去', '接一张图', '参考图', '图生图', '输入图片', '图片输进去',
] as const
const KEYWORDS_FOLLOW_UP = [
  '基于结果继续', '基于这张', '继续扩展', '继续做下去', '下一步',
  '补视频', '加视频', '补标题', '加标题', '正文', '文案变体',
] as const
const KEYWORDS_VIDEO_FOLLOW_UP = ['视频', '动起来', '动态'] as const
const KEYWORDS_COPY_FOLLOW_UP = ['标题', '正文', '文案'] as const
const KEYWORDS_RUN_WORKFLOW = ['运行', '执行'] as const
const KEYWORDS_RUN_FROM_NODE = ['从这个节点', '当前节点', '选中节点'] as const

function matchesAny(str: string, keywords: readonly string[]): boolean {
  return keywords.some((kw) => str.includes(kw))
}

/* ─── Public: Diagnose ────────────────────────────────── */

export function buildDiagnoseOperations(canvas: CanvasSummary): WorkflowOperation[] {
  if (canvas.latestExecution?.failedNodeId) {
    return [{ type: 'focus_nodes', nodeIds: [canvas.latestExecution.failedNodeId] }]
  }
  if (canvas.disconnectedNodeIds.length > 0) {
    return [{ type: 'focus_nodes', nodeIds: canvas.disconnectedNodeIds.slice(0, 3) }]
  }
  return canvas.nodes[0] ? [{ type: 'focus_nodes', nodeIds: [canvas.nodes[0].id] }] : []
}

/* ─── Public: Workflow Reference ──────────────────────── */

export function buildWorkflowReferenceOperations(sketch: WorkflowReferenceSketch): WorkflowOperation[] {
  const normalizedNodes = normalizeWorkflowReferenceNodes(sketch)
  if (normalizedNodes.length === 0) {
    return buildCreationOperations('工作流参考图 图片')
  }

  const operations: WorkflowOperation[] = []
  for (const node of normalizedNodes) {
    operations.push({
      type: 'add_node',
      nodeId: node.id,
      nodeType: node.nodeType,
      initialData: node.label ? { label: node.label } : undefined,
    })
  }
  for (const connection of buildWorkflowReferenceConnections(normalizedNodes)) {
    operations.push({
      type: 'connect',
      source: connection.source.id,
      sourceHandle: connection.sourceHandle,
      target: connection.target.id,
      targetHandle: connection.targetHandle,
    })
  }
  return operations
}

/* ─── Public: Follow-up Predicate ────────────────────── */

export function shouldBuildFollowUpFromResult(normalized: string, canvas: CanvasSummary): boolean {
  if (!canvas.latestSuccessfulAsset) return false
  return matchesAny(normalized, KEYWORDS_FOLLOW_UP)
}

/* ─── Public: Incremental ─────────────────────────────── */

export function buildIncrementalOperations(
  normalized: string,
  canvas: CanvasSummary,
  intent: AgentPlanIntent,
): WorkflowOperation[] {
  if (canvas.latestSuccessfulAsset && shouldBuildFollowUpFromResult(normalized, canvas)) {
    return buildResultFollowUpOperations(normalized, canvas)
  }

  const selectedNodeId = canvas.selectedNodeId ?? canvas.nodes[0]?.id
  const selectedNode = selectedNodeId
    ? (canvas.nodes.find((node) => node.id === selectedNodeId) ?? null)
    : null

  if (normalized.includes('补') && canvas.displayMissingForNodeIds.length > 0) {
    return [
      { type: 'add_node', nodeId: 'draft-display', nodeType: 'display' },
      {
        type: 'connect',
        source: canvas.displayMissingForNodeIds[0] as string,
        target: 'draft-display',
        targetHandle: 'content-in',
      },
    ]
  }

  if ((normalized.includes('优化') || normalized.includes('整理')) && canvas.disconnectedNodeIds.length > 0) {
    return [{ type: 'focus_nodes', nodeIds: canvas.disconnectedNodeIds.slice(0, 3) }]
  }

  if (selectedNode && shouldPatchSelectedNodePrompt(normalized, selectedNode)) {
    return buildSelectedNodePromptOperations(normalized, selectedNode)
  }

  if (selectedNode && shouldOptimizeSelectedNode(normalized)) {
    return buildSelectedNodeOptimizationOperations(normalized, selectedNode)
  }

  const missingImageInputPatch = buildMissingImageInputOperations(normalized, canvas)
  if (missingImageInputPatch.length > 0) return missingImageInputPatch

  if (intent === 'add_step') {
    const insertTarget = selectedNode ?? findFirstNodeByType(canvas.nodes, 'image-gen') ?? canvas.nodes[0]
    const upstreamNode = insertTarget ? findSingleUpstreamNode(canvas, insertTarget.id) : null
    if (insertTarget && upstreamNode) {
      return [
        {
          type: 'insert_between',
          source: upstreamNode.id,
          target: insertTarget.id,
          sourceHandle: guessPrimaryOutputHandle(upstreamNode),
          targetHandle: guessPrimaryInputHandle(insertTarget),
          nodeId: 'draft-style-analyzer',
          nodeType: 'llm',
          initialData: {
            label: 'Style Analyzer',
            config: { text: '请先分析风格方向，再把结果传给下游生成节点。' },
          },
        },
        {
          type: 'annotate_change',
          nodeId: insertTarget.id,
          note: '在主生成前补入风格分析步骤，保持原主链走向不变。',
        },
        { type: 'focus_nodes', nodeIds: [upstreamNode.id, insertTarget.id] },
      ]
    }
  }

  if (intent === 'split_step' && selectedNode) {
    const downstream = findFirstDownstreamNode(canvas, selectedNode.id)
    return [
      {
        type: 'insert_between',
        source: selectedNode.id,
        target: downstream?.id ?? selectedNode.id,
        sourceHandle: guessPrimaryOutputHandle(selectedNode),
        targetHandle: guessPrimaryInputHandle(downstream ?? selectedNode),
        nodeId: 'draft-secondary-llm',
        nodeType: 'llm',
        initialData: {
          label: 'Body Writer',
          config: { text: '把当前单步产出拆成标题与正文两步。' },
        },
      },
      { type: 'relabel_node', nodeId: selectedNode.id, label: 'Title Writer' },
      { type: 'annotate_change', nodeId: selectedNode.id, note: '原单步已拆成更细的两步，方便后续单独调参。' },
    ]
  }

  if (intent === 'replace_model') {
    const targetNode = selectedNode ?? findFirstAIGenNode(canvas.nodes)
    if (targetNode) {
      return [
        {
          type: 'replace_node',
          nodeId: targetNode.id,
          nextNodeType: targetNode.type,
          configPatch: buildCheaperModelPatch(targetNode),
          preserveConfigKeys: ['aspectRatio', 'size', 'mode', 'duration', 'showPreview'],
        },
        {
          type: 'annotate_change',
          nodeId: targetNode.id,
          note: '替换为更便宜的模型组合，同时保留上下游连接和原链路。',
        },
        { type: 'focus_nodes', nodeIds: [targetNode.id] },
      ]
    }
  }

  if (intent === 'change_output_count') {
    const targetNode = selectedNode ?? findFirstNodeByType(canvas.nodes, 'image-gen')
    if (targetNode) {
      return [
        { type: 'batch_update_node_data', nodeIds: [targetNode.id], patch: { config: { count: 4 } } },
        { type: 'relabel_node', nodeId: targetNode.id, label: `${targetNode.label} x4` },
        { type: 'annotate_change', nodeId: targetNode.id, note: '输出规格已调整为 4 个变体。' },
        { type: 'focus_nodes', nodeIds: [targetNode.id] },
      ]
    }
  }

  if (intent === 'add_branch') {
    const targetNode = selectedNode ?? findFirstNodeByType(canvas.nodes, 'image-gen')
    if (targetNode) {
      return [
        { type: 'duplicate_node_branch', nodeId: targetNode.id, count: 2, strategy: 'style-variants' },
        {
          type: 'annotate_change',
          nodeId: targetNode.id,
          note: '基于当前节点复制出变体分支，保留原主链作为基线。',
        },
        { type: 'focus_nodes', nodeIds: [targetNode.id] },
      ]
    }
  }

  if (matchesAny(normalized, KEYWORDS_RUN_WORKFLOW)) {
    if (selectedNodeId && matchesAny(normalized, KEYWORDS_RUN_FROM_NODE)) {
      return [
        { type: 'focus_nodes', nodeIds: [selectedNodeId] },
        { type: 'run_workflow', scope: 'from-node', nodeId: selectedNodeId },
      ]
    }
    return [{ type: 'run_workflow', scope: 'all' }]
  }

  return selectedNodeId ? [{ type: 'focus_nodes', nodeIds: [selectedNodeId] }] : []
}

/* ─── Private: Result Follow-up ──────────────────────── */

function buildResultFollowUpOperations(normalized: string, canvas: CanvasSummary): WorkflowOperation[] {
  const asset = canvas.latestSuccessfulAsset
  if (!asset) return []

  if (asset.kind === 'image' && matchesAny(normalized, KEYWORDS_VIDEO_FOLLOW_UP)) {
    return [
      {
        type: 'add_node',
        nodeId: 'draft-followup-video',
        nodeType: 'video-gen',
        initialData: { label: 'Video Follow-up', config: { mode: 'image-to-video' } },
      },
      {
        type: 'add_node',
        nodeId: 'draft-followup-display',
        nodeType: 'display',
        initialData: { label: 'Video Preview' },
      },
      {
        type: 'connect',
        source: asset.sourceNodeId,
        sourceHandle: 'image-out',
        target: 'draft-followup-video',
        targetHandle: 'image-in',
      },
      {
        type: 'connect',
        source: 'draft-followup-video',
        sourceHandle: 'video-out',
        target: 'draft-followup-display',
        targetHandle: 'content-in',
      },
      {
        type: 'annotate_change',
        nodeId: asset.sourceNodeId,
        note: '基于最近图片结果新增了一条补视频分支，原主链保持不动。',
      },
      { type: 'focus_nodes', nodeIds: [asset.sourceNodeId, 'draft-followup-video', 'draft-followup-display'] },
    ]
  }

  if (asset.kind === 'image' && matchesAny(normalized, KEYWORDS_COPY_FOLLOW_UP)) {
    const copyPrompt = normalized.includes('正文')
      ? '基于最新图片结果生成一版正文文案。'
      : normalized.includes('标题')
        ? '基于最新图片结果生成 3 个标题变体。'
        : '基于最新图片结果生成标题和正文文案变体。'
    return [
      {
        type: 'add_node',
        nodeId: 'draft-followup-copy',
        nodeType: 'llm',
        initialData: { label: 'Copy Follow-up', config: { text: copyPrompt } },
      },
      {
        type: 'add_node',
        nodeId: 'draft-followup-display',
        nodeType: 'display',
        initialData: { label: 'Copy Preview' },
      },
      {
        type: 'connect',
        source: asset.sourceNodeId,
        sourceHandle: 'image-out',
        target: 'draft-followup-copy',
        targetHandle: 'image-in',
      },
      {
        type: 'connect',
        source: 'draft-followup-copy',
        sourceHandle: 'text-out',
        target: 'draft-followup-display',
        targetHandle: 'content-in',
      },
      {
        type: 'annotate_change',
        nodeId: asset.sourceNodeId,
        note: '基于最近图片结果补出了一条文案续写分支，方便继续做标题/正文承接。',
      },
      { type: 'focus_nodes', nodeIds: [asset.sourceNodeId, 'draft-followup-copy', 'draft-followup-display'] },
    ]
  }

  if (asset.kind === 'text') {
    return [
      { type: 'duplicate_node_branch', nodeId: asset.sourceNodeId, count: 2, strategy: 'style-variants' },
      {
        type: 'annotate_change',
        nodeId: asset.sourceNodeId,
        note: '基于最近文本结果复制出变体支线，方便继续扩写或改写。',
      },
      { type: 'focus_nodes', nodeIds: [asset.sourceNodeId] },
    ]
  }

  return [{ type: 'focus_nodes', nodeIds: [asset.sourceNodeId] }]
}

/* ─── Private: Missing Image Input ───────────────────── */

function buildMissingImageInputOperations(normalized: string, canvas: CanvasSummary): WorkflowOperation[] {
  if (!matchesAny(normalized, KEYWORDS_MISSING_IMAGE_INPUT)) return []
  const targetNode = findImageGenNodeMissingImageInput(canvas)
  if (!targetNode) return []
  return [
    {
      type: 'add_node',
      nodeId: 'draft-image-input',
      nodeType: 'image-input',
      initialData: { label: '参考图输入' },
    },
    {
      type: 'connect',
      source: 'draft-image-input',
      sourceHandle: 'image-out',
      target: targetNode.id,
      targetHandle: 'image-in',
    },
    {
      type: 'annotate_change',
      nodeId: targetNode.id,
      note: '已补上参考图输入节点，并接到图片生成节点的 image-in 入口。',
    },
    { type: 'focus_nodes', nodeIds: ['draft-image-input', targetNode.id] },
  ]
}

function findImageGenNodeMissingImageInput(canvas: CanvasSummary): CanvasSummaryNode | null {
  return (
    canvas.nodes.find((node) => {
      if (node.type !== 'image-gen') return false
      const hasImageInputPort = node.inputs.some((input) => input.id === 'image-in' || input.type === 'image')
      if (!hasImageInputPort) return false
      return !canvas.nodes.some((candidate) => candidate.type === 'image-input')
    }) ?? null
  )
}

/* ─── Private: Workflow Reference ─────────────────────── */

function normalizeWorkflowReferenceNodes(sketch: WorkflowReferenceSketch) {
  const fallback = [
    { id: 'draft-text-input', nodeType: 'text-input', label: '提示词输入' },
    { id: 'draft-image-gen', nodeType: 'image-gen', label: '图片生成' },
    { id: 'draft-display', nodeType: 'display', label: '结果展示' },
  ] as const

  const nodes = sketch?.nodes?.filter((node) =>
    ['text-input', 'image-input', 'image-gen', 'video-gen', 'audio-gen', 'llm', 'display'].includes(node.nodeType),
  )
  if (!nodes?.length) return [...fallback]

  return nodes.slice(0, 6).map((node, index) => ({
    id: `draft-ref-${index + 1}`,
    nodeType: node.nodeType,
    label: node.label?.trim() || defaultReferenceNodeLabel(node.nodeType),
  }))
}

function buildWorkflowReferenceConnections(nodes: Array<{ id: string; nodeType: string; label: string }>) {
  type ConnEntry = {
    source: { id: string; nodeType: string; label: string }
    target: { id: string; nodeType: string; label: string }
    sourceHandle?: string
    targetHandle?: string
  }
  const connections: ConnEntry[] = []

  const displayNode = nodes.find((n) => n.nodeType === 'display')
  const imageGenNode = nodes.find((n) => n.nodeType === 'image-gen')
  const videoGenNode = nodes.find((n) => n.nodeType === 'video-gen')
  const audioGenNode = nodes.find((n) => n.nodeType === 'audio-gen')
  const llmNode = nodes.find((n) => n.nodeType === 'llm')
  const promptSource = nodes.find((n) => n.nodeType === 'text-input') ?? nodes.find((n) => n.nodeType === 'llm')
  const imageInputNode = nodes.find((n) => n.nodeType === 'image-input')

  if (promptSource && imageGenNode) {
    connections.push({ source: promptSource, target: imageGenNode, sourceHandle: 'text-out', targetHandle: 'prompt-in' })
  }
  if (imageInputNode && imageGenNode) {
    connections.push({ source: imageInputNode, target: imageGenNode, sourceHandle: 'image-out', targetHandle: 'image-in' })
  }
  if (promptSource && videoGenNode) {
    connections.push({ source: promptSource, target: videoGenNode, sourceHandle: 'text-out', targetHandle: 'prompt-in' })
  }
  if (imageInputNode && videoGenNode) {
    connections.push({ source: imageInputNode, target: videoGenNode, sourceHandle: 'image-out', targetHandle: 'image-in' })
  }
  if (promptSource && audioGenNode) {
    connections.push({ source: promptSource, target: audioGenNode, sourceHandle: 'text-out', targetHandle: 'text-in' })
  }
  if (promptSource && llmNode && !imageGenNode && !videoGenNode && !audioGenNode) {
    connections.push({ source: promptSource, target: llmNode, sourceHandle: 'text-out', targetHandle: 'prompt-in' })
  }

  const terminalNode = imageGenNode ?? videoGenNode ?? audioGenNode ?? llmNode
  if (terminalNode && displayNode) {
    const handles = resolveReferenceHandles(terminalNode.nodeType, displayNode.nodeType)
    connections.push({ source: terminalNode, target: displayNode, ...handles })
  }

  if (connections.length > 0) return dedupeConnections(connections)

  const linearConnections: ConnEntry[] = []
  for (let index = 0; index < nodes.length - 1; index += 1) {
    const source = nodes[index]!
    const target = nodes[index + 1]!
    linearConnections.push({ source, target, ...resolveReferenceHandles(source.nodeType, target.nodeType) })
  }
  return dedupeConnections(linearConnections)
}

function dedupeConnections<T extends { source: { id: string }; target: { id: string }; sourceHandle?: string; targetHandle?: string }>(
  connections: T[],
): T[] {
  const seen = new Set<string>()
  return connections.filter((c) => {
    const key = [c.source.id, c.sourceHandle ?? '', c.target.id, c.targetHandle ?? ''].join(':')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function defaultReferenceNodeLabel(nodeType: string): string {
  if (nodeType === 'text-input') return '提示词输入'
  if (nodeType === 'image-input') return '参考图输入'
  if (nodeType === 'image-gen') return '图片生成'
  if (nodeType === 'video-gen') return '视频生成'
  if (nodeType === 'audio-gen') return '音频生成'
  if (nodeType === 'llm') return '文本处理'
  return '结果展示'
}

function resolveReferenceHandles(sourceType: string, targetType: string) {
  if (sourceType === 'text-input' && ['image-gen', 'video-gen', 'llm'].includes(targetType)) {
    return { sourceHandle: 'text-out', targetHandle: 'prompt-in' }
  }
  if (sourceType === 'text-input' && targetType === 'audio-gen') {
    return { sourceHandle: 'text-out', targetHandle: 'text-in' }
  }
  if (sourceType === 'image-input' && ['image-gen', 'video-gen', 'llm'].includes(targetType)) {
    return { sourceHandle: 'image-out', targetHandle: 'image-in' }
  }
  if (sourceType === 'image-gen') return { sourceHandle: 'image-out', targetHandle: 'content-in' }
  if (sourceType === 'video-gen') return { sourceHandle: 'video-out', targetHandle: 'content-in' }
  if (sourceType === 'audio-gen') return { sourceHandle: 'audio-out', targetHandle: 'content-in' }
  return { sourceHandle: 'text-out', targetHandle: 'content-in' }
}

/* ─── Private: Canvas Helpers ─────────────────────────── */

function findFirstNodeByType(nodes: CanvasSummaryNode[], type: string): CanvasSummaryNode | null {
  return nodes.find((node) => node.type === type) ?? null
}

function findFirstAIGenNode(nodes: CanvasSummaryNode[]): CanvasSummaryNode | null {
  return nodes.find((node) => ['image-gen', 'video-gen', 'audio-gen', 'llm'].includes(node.type)) ?? null
}

function findSingleUpstreamNode(canvas: CanvasSummary, targetId: string): CanvasSummaryNode | null {
  const index = canvas.nodes.findIndex((node) => node.id === targetId)
  if (index <= 0) return null
  return canvas.nodes[index - 1] ?? null
}

function findFirstDownstreamNode(canvas: CanvasSummary, sourceId: string): CanvasSummaryNode | null {
  const index = canvas.nodes.findIndex((node) => node.id === sourceId)
  if (index < 0 || index >= canvas.nodes.length - 1) return null
  return canvas.nodes[index + 1] ?? null
}

function guessPrimaryInputHandle(node: CanvasSummaryNode | null): string | undefined {
  return node?.inputs[0]?.id
}

function guessPrimaryOutputHandle(node: CanvasSummaryNode | null): string | undefined {
  return node?.outputs[0]?.id
}

function buildCheaperModelPatch(node: CanvasSummaryNode): Record<string, unknown> {
  if (node.type === 'image-gen') {
    const model = getDefaultPlatformRuntimeModel('image')
    return { platformProvider: model.supplierId, platformModel: model.modelId }
  }
  if (node.type === 'video-gen') {
    return { platformProvider: 'kling', platformModel: 'kling-v1-6' }
  }
  if (node.type === 'llm') {
    const model = getDefaultPlatformRuntimeModel('text')
    return { platformProvider: model.supplierId, platformModel: model.modelId }
  }
  return {}
}
