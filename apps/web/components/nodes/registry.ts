/**
 * [INPUT]: 依赖 @xyflow/react 的 NodeTypes，依赖同目录下具体节点组件
 * [OUTPUT]: 对外提供 NODE_TYPES 注册表映射
 * [POS]: components/nodes 的节点类型注册中心，被 Canvas 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { NodeTypes } from '@xyflow/react'
import { TextInputNode } from './text-input-node'
import { LLMNode } from './llm-node'
import { DisplayNode } from './display-node'
import { ImageGenNode } from './image-gen-node'
import { VideoGenNode } from './video-gen-node'
import { AudioGenNode } from './audio-gen-node'

export const NODE_TYPES: NodeTypes = {
  'text-input': TextInputNode,
  llm: LLMNode,
  display: DisplayNode,
  'image-gen': ImageGenNode,
  'video-gen': VideoGenNode,
  'audio-gen': AudioGenNode,
}
