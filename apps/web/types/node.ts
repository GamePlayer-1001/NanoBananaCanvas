/**
 * [INPUT]: 依赖 ./workflow 的 NodeCategory
 * [OUTPUT]: 对外提供 NodeDefinition/PortDefinition/NodeRegistry
 * [POS]: types 的节点注册表类型，被节点工厂和属性面板消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { NodeCategory } from './workflow'

/* ─── Port (输入输出端口) ───────────────────────────────── */

export type PortType = 'string' | 'number' | 'boolean' | 'image' | 'video' | 'any'

export interface PortDefinition {
  id: string
  label: string
  type: PortType
  required?: boolean
}

/* ─── Node Definition (节点蓝图) ────────────────────────── */

export interface NodeDefinition {
  type: string
  category: NodeCategory
  label: string
  description: string
  icon: string
  inputs: PortDefinition[]
  outputs: PortDefinition[]
  configSchema?: Record<string, unknown>
}

/* ─── Registry ──────────────────────────────────────────── */

export type NodeRegistry = Map<string, NodeDefinition>
