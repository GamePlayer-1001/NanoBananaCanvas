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
    config: { model: 'gpt-4o', temperature: 0.7 },
  },
  display: {
    label: 'Display',
    category: 'output',
    config: {},
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

  return {
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
}
