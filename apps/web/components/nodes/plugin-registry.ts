/**
 * [INPUT]: 依赖 lucide-react 的图标组件，依赖 @/types 的 NodeCategory/PortDefinition
 * [OUTPUT]: 对外提供 NodePluginMeta 接口 + getNodeMeta/getAllNodeMetas/getNodeDefaults/getNodePorts/getToolbarNodes
 * [POS]: components/nodes 的节点元数据注册中心 (单一真相源)，被 create-node/validate-connection/canvas-toolbar 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { CSSProperties } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  BrainCircuit,
  GitBranch,
  Group,
  ImageIcon,
  MonitorPlay,
  Music,
  Repeat,
  StickyNote,
  Type,
  Video,
} from 'lucide-react'
import type { NodeCategory, PortDefinition } from '@/types'

/* ─── Types ──────────────────────────────────────────── */

export interface NodePluginMeta {
  type: string
  category: NodeCategory
  label: string
  icon: LucideIcon
  ports: { inputs: PortDefinition[]; outputs: PortDefinition[] }
  defaults: Record<string, unknown>
  toolbar: { labelKey: string }
  /** 节点初始样式 (如 group 的尺寸) */
  style?: CSSProperties
}

/* ─── Registry ───────────────────────────────────────── */

const registry = new Map<string, NodePluginMeta>()

function register(meta: NodePluginMeta) {
  registry.set(meta.type, meta)
}

export function getNodeMeta(type: string): NodePluginMeta | undefined {
  return registry.get(type)
}

export function getAllNodeMetas(): NodePluginMeta[] {
  return Array.from(registry.values())
}

/* ─── Derived Helpers ────────────────────────────────── */

export function getNodeDefaults(type: string) {
  const meta = registry.get(type)
  if (!meta) return { label: type, category: 'transform' as NodeCategory, config: {} }
  return { label: meta.label, category: meta.category, config: { ...meta.defaults } }
}

export function getNodePorts(type: string) {
  return registry.get(type)?.ports ?? { inputs: [], outputs: [] }
}

/* ─── Node Definitions ───────────────────────────────── */

register({
  type: 'text-input',
  category: 'input',
  label: 'Text Input',
  icon: Type,
  ports: {
    inputs: [],
    outputs: [{ id: 'text-out', label: 'Text', type: 'string' }],
  },
  defaults: { text: '' },
  toolbar: { labelKey: 'textInput' },
})

register({
  type: 'llm',
  category: 'ai-model',
  label: 'LLM',
  icon: BrainCircuit,
  ports: {
    inputs: [
      { id: 'prompt-in', label: 'Prompt', type: 'string', required: true },
      { id: 'image-in', label: 'Image', type: 'image' },
    ],
    outputs: [{ id: 'text-out', label: 'Response', type: 'string' }],
  },
  defaults: { provider: 'openrouter', model: 'openai/gpt-4o-mini', temperature: 0.7 },
  toolbar: { labelKey: 'llm' },
})

register({
  type: 'display',
  category: 'output',
  label: 'Display',
  icon: MonitorPlay,
  ports: {
    inputs: [{ id: 'content-in', label: 'Content', type: 'any', required: true }],
    outputs: [],
  },
  defaults: {},
  toolbar: { labelKey: 'display' },
})

register({
  type: 'image-gen',
  category: 'ai-model',
  label: 'Image Gen',
  icon: ImageIcon,
  ports: {
    inputs: [{ id: 'prompt-in', label: 'Prompt', type: 'string', required: true }],
    outputs: [{ id: 'image-out', label: 'Image', type: 'image' }],
  },
  defaults: { provider: 'openrouter', model: 'openai/dall-e-3', size: '1024x1024' },
  toolbar: { labelKey: 'imageGen' },
})

register({
  type: 'video-gen',
  category: 'ai-model',
  label: 'Video Gen',
  icon: Video,
  ports: {
    inputs: [
      { id: 'prompt-in', label: 'Prompt', type: 'string', required: true },
      { id: 'image-in', label: 'Image', type: 'image' },
    ],
    outputs: [{ id: 'video-out', label: 'Video', type: 'video' }],
  },
  defaults: { provider: 'kling', model: 'kling-v2-0', duration: '5', aspectRatio: '16:9', mode: 'std' },
  toolbar: { labelKey: 'videoGen' },
})

register({
  type: 'audio-gen',
  category: 'ai-model',
  label: 'Audio Gen',
  icon: Music,
  ports: {
    inputs: [{ id: 'text-in', label: 'Text', type: 'string', required: true }],
    outputs: [{ id: 'audio-out', label: 'Audio', type: 'audio' }],
  },
  defaults: { provider: 'openai', model: 'tts-1', voice: 'alloy', speed: 1.0 },
  toolbar: { labelKey: 'audioGen' },
})

register({
  type: 'note',
  category: 'transform',
  label: 'Note',
  icon: StickyNote,
  ports: { inputs: [], outputs: [] },
  defaults: { text: '', bgColor: '#fef9c3' },
  toolbar: { labelKey: 'note' },
})

register({
  type: 'group',
  category: 'transform',
  label: 'Group',
  icon: Group,
  ports: { inputs: [], outputs: [] },
  defaults: { bgColor: 'rgba(99,102,241,0.08)' },
  toolbar: { labelKey: 'group' },
  style: { width: 400, height: 300 },
})

register({
  type: 'conditional',
  category: 'condition',
  label: 'Conditional',
  icon: GitBranch,
  ports: {
    inputs: [{ id: 'value-in', label: 'Value', type: 'any', required: true }],
    outputs: [
      { id: 'true-out', label: 'True', type: 'any' },
      { id: 'false-out', label: 'False', type: 'any' },
    ],
  },
  defaults: { operator: '==', compareValue: '' },
  toolbar: { labelKey: 'conditional' },
})

register({
  type: 'loop',
  category: 'loop',
  label: 'Loop',
  icon: Repeat,
  ports: {
    inputs: [{ id: 'items-in', label: 'Items', type: 'any', required: true }],
    outputs: [
      { id: 'item-out', label: 'Item', type: 'any' },
      { id: 'index-out', label: 'Index', type: 'number' },
      { id: 'results-out', label: 'Results', type: 'any' },
    ],
  },
  defaults: { mode: 'forEach', iterations: 3, separator: '\\n' },
  toolbar: { labelKey: 'loop' },
})
