/**
 * [INPUT]: 依赖 @/stores/use-canvas-tool-store 的 CanvasTool
 * [OUTPUT]: 对外提供 CANVAS_TOOLBAR_NODE_GROUPS / CANVAS_CONTEXT_MENU_GROUPS / flattenNodeEntryGroups()
 * [POS]: components/canvas 的节点入口共享配置，统一描述快捷栏与右键菜单的可见项、顺序与分组语义
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { CanvasTool } from '@/stores/use-canvas-tool-store'

type NodeEntryLabelKey =
  | 'addTextInput'
  | 'addImageInput'
  | 'addNote'
  | 'addLLM'
  | 'addImageGen'
  | 'addVideoGen'
  | 'addAudioGen'
  | 'addDisplay'
  | 'addConditional'
  | 'addLoop'
  | 'addGroup'

export interface NodeEntryItem {
  type: CanvasTool
  labelKey: NodeEntryLabelKey
}

export interface NodeEntryGroup {
  id: string
  items: NodeEntryItem[]
}

export const CANVAS_TOOLBAR_NODE_GROUPS: NodeEntryGroup[] = [
  {
    id: 'inputs',
    items: [
      { type: 'text-input', labelKey: 'addTextInput' },
      { type: 'image-input', labelKey: 'addImageInput' },
    ],
  },
  {
    id: 'llm',
    items: [{ type: 'llm', labelKey: 'addLLM' }],
  },
  {
    id: 'image',
    items: [{ type: 'image-gen', labelKey: 'addImageGen' }],
  },
  {
    id: 'video',
    items: [{ type: 'video-gen', labelKey: 'addVideoGen' }],
  },
  {
    id: 'audio',
    items: [{ type: 'audio-gen', labelKey: 'addAudioGen' }],
  },
  {
    id: 'display',
    items: [{ type: 'display', labelKey: 'addDisplay' }],
  },
]

export const CANVAS_CONTEXT_MENU_GROUPS: NodeEntryGroup[] = [
  {
    id: 'inputs',
    items: [
      { type: 'text-input', labelKey: 'addTextInput' },
      { type: 'image-input', labelKey: 'addImageInput' },
      { type: 'note', labelKey: 'addNote' },
    ],
  },
  {
    id: 'llm',
    items: [{ type: 'llm', labelKey: 'addLLM' }],
  },
  {
    id: 'image',
    items: [{ type: 'image-gen', labelKey: 'addImageGen' }],
  },
  {
    id: 'video',
    items: [{ type: 'video-gen', labelKey: 'addVideoGen' }],
  },
  {
    id: 'audio',
    items: [{ type: 'audio-gen', labelKey: 'addAudioGen' }],
  },
  {
    id: 'display',
    items: [{ type: 'display', labelKey: 'addDisplay' }],
  },
  {
    id: 'tools',
    items: [
      { type: 'conditional', labelKey: 'addConditional' },
      { type: 'loop', labelKey: 'addLoop' },
    ],
  },
  {
    id: 'misc',
    items: [{ type: 'group', labelKey: 'addGroup' }],
  },
]

export function flattenNodeEntryGroups(groups: NodeEntryGroup[]): NodeEntryItem[] {
  return groups.flatMap((group) => group.items)
}
