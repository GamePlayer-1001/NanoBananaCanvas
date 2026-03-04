/**
 * [INPUT]: 依赖 @xyflow/react 的 EdgeTypes，依赖 ./custom-edge
 * [OUTPUT]: 对外提供 EDGE_TYPES 注册表映射
 * [POS]: components/edges 的连线类型注册中心，被 Canvas 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { EdgeTypes } from '@xyflow/react'
import { CustomEdge } from './custom-edge'

export const EDGE_TYPES: EdgeTypes = {
  custom: CustomEdge,
}
