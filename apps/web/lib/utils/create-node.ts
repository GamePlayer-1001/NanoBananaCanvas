/**
 * [INPUT]: 依赖 @xyflow/react 的 Node 类型，依赖 @/types 的 WorkflowNodeData/NodeCategory
 * [OUTPUT]: 对外提供 createNode() 节点工厂函数
 * [POS]: lib/utils 的节点创建工具，被 CanvasToolbar/Canvas (拖放/点击创建) 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Node } from '@xyflow/react'
import type { NodeCategory, WorkflowNodeData } from '@/types'

/* ─── Node Defaults ───────────────────────────────────── */

interface NodeDefaults {
  label: string
  category: NodeCategory
  config: Record<string, unknown>
}

const NODE_DEFAULTS: Record<string, NodeDefaults> = {
  'text-input': {
    label: 'Text Input',
    category: 'input',
    config: { text: '' },
  },
  llm: {
    label: 'LLM',
    category: 'ai-model',
    config: { provider: 'openrouter', model: 'openai/gpt-4o-mini', temperature: 0.7 },
  },
  display: {
    label: 'Display',
    category: 'output',
    config: {},
  },
  'image-gen': {
    label: 'Image Gen',
    category: 'ai-model',
    config: { provider: 'openrouter', model: 'openai/dall-e-3', size: '1024x1024' },
  },
  'video-gen': {
    label: 'Video Gen',
    category: 'ai-model',
    config: { provider: 'kling', model: 'kling-v2-0', duration: '5', aspectRatio: '16:9', mode: 'std' },
  },
  'audio-gen': {
    label: 'Audio Gen',
    category: 'ai-model',
    config: { provider: 'openai', model: 'tts-1', voice: 'alloy', speed: 1.0 },
  },
  note: {
    label: 'Note',
    category: 'transform',
    config: { text: '', bgColor: '#fef9c3' },
  },
  group: {
    label: 'Group',
    category: 'transform',
    config: { bgColor: 'rgba(99,102,241,0.08)' },
  },
}

/* ─── Factory ─────────────────────────────────────────── */

/**
 * 创建一个新的工作流节点
 *
 * @param type    节点类型标识 (对应 NODE_TYPES 注册表)
 * @param position 画布坐标位置
 */
export function createNode(
  type: string,
  position: { x: number; y: number },
): Node<WorkflowNodeData> {
  const defaults = NODE_DEFAULTS[type] ?? {
    label: type,
    category: 'transform' as NodeCategory,
    config: {},
  }

  const node: Node<WorkflowNodeData> = {
    id: crypto.randomUUID(),
    type,
    position,
    data: {
      label: defaults.label,
      type: defaults.category,
      config: defaults.config,
      status: 'idle',
    },
  }

  /* group 节点需要初始尺寸以启用 NodeResizer */
  if (type === 'group') {
    node.style = { width: 400, height: 300 }
  }

  return node
}
