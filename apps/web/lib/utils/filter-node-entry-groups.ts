/**
 * [INPUT]: 依赖 @/components/canvas/node-entry-config 的节点入口分组，依赖 @/components/nodes/plugin-registry 的端口元数据，依赖 @/types 的 PortType
 * [OUTPUT]: 对外提供 filterNodeEntryGroupsByPort() 拖线建节点候选过滤器
 * [POS]: lib/utils 的菜单筛选工具，被 Canvas 在“拖线到空白处创建节点”场景消费，按强匹配优先 + any 兜底兼容收口候选
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { NodeEntryGroup } from '@/components/canvas/node-entry-config'
import { getNodePorts } from '@/components/nodes/plugin-registry'
import type { PortType } from '@/types'

type ConnectionHandleType = 'source' | 'target'

export interface NodeEntryFilterContext {
  nodeType: string
  handleId: string | null
  handleType: ConnectionHandleType
}

function getPortMatchRank(left: PortType, right: PortType): number | null {
  if (left === right) return 0
  if (left === 'any' || right === 'any') return 1
  return null
}

export function filterNodeEntryGroupsByPort(
  groups: NodeEntryGroup[],
  context: NodeEntryFilterContext | null,
): NodeEntryGroup[] {
  if (!context?.handleId) return groups

  const currentPorts = getNodePorts(context.nodeType)
  const currentPort =
    context.handleType === 'source'
      ? currentPorts.outputs.find((port) => port.id === context.handleId)
      : currentPorts.inputs.find((port) => port.id === context.handleId)

  if (!currentPort) return groups

  return groups
    .map((group) => ({
      ...group,
      items: group.items
        .map((item, index) => {
        const candidatePorts = getNodePorts(item.type)
        const comparablePorts =
          context.handleType === 'source' ? candidatePorts.inputs : candidatePorts.outputs

          const ranks = comparablePorts
            .map((port) => getPortMatchRank(currentPort.type, port.type))
            .filter((rank): rank is number => rank != null)

          if (ranks.length === 0) return null

          return {
            item,
            index,
            rank: Math.min(...ranks),
          }
        })
        .filter((entry): entry is { item: NodeEntryGroup['items'][number]; index: number; rank: number } => entry != null)
        .sort((left, right) => left.rank - right.rank || left.index - right.index)
        .map((entry) => entry.item),
    }))
    .filter((group) => group.items.length > 0)
}
