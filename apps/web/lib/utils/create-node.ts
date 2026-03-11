/**
 * [INPUT]: 依赖 @xyflow/react 的 Node 类型，依赖 @/types 的 WorkflowNodeData，
 *          依赖 @/components/nodes/plugin-registry 的 getNodeDefaults/getNodeMeta
 * [OUTPUT]: 对外提供 createNode() 节点工厂函数
 * [POS]: lib/utils 的节点创建工具，被 CanvasToolbar/Canvas (拖放/点击创建) 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Node } from '@xyflow/react'
import type { WorkflowNodeData } from '@/types'
import { getNodeDefaults, getNodeMeta } from '@/components/nodes/plugin-registry'

/* ─── Factory ─────────────────────────────────────────── */

/**
 * 创建一个新的工作流节点
 *
 * @param type    节点类型标识 (对应 plugin-registry 注册表)
 * @param position 画布坐标位置
 */
export function createNode(
  type: string,
  position: { x: number; y: number },
): Node<WorkflowNodeData> {
  const defaults = getNodeDefaults(type)
  const meta = getNodeMeta(type)

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

  if (meta?.style) {
    node.style = meta.style
  }

  return node
}
