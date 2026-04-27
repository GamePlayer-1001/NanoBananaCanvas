/**
 * [INPUT]: 依赖 @/components/canvas/node-entry-config 的节点入口分组，依赖 @/components/nodes/plugin-registry 的端口元数据，依赖 @/types 的 PortType
 * [OUTPUT]: 对外提供 filterNodeEntryGroupsByPort() 拖线建节点候选过滤器
 * [POS]: lib/utils 的菜单筛选工具，被 Canvas 在“拖线到空白处创建节点”场景消费
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

function isStrictPortMatch(left: PortType, right: PortType): boolean {
  return left === right
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
      items: group.items.filter((item) => {
        const candidatePorts = getNodePorts(item.type)
        const comparablePorts =
          context.handleType === 'source' ? candidatePorts.inputs : candidatePorts.outputs

        return comparablePorts.some((port) => isStrictPortMatch(currentPort.type, port.type))
      }),
    }))
    .filter((group) => group.items.length > 0)
}
