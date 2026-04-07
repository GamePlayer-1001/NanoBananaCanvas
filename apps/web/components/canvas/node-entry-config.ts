/**
 * [INPUT]: 依赖 lucide-react 的节点入口图标，依赖 @/stores/use-canvas-tool-store 的 CanvasTool
 * [OUTPUT]: 对外提供 CANVAS_TOOLBAR_NODE_GROUPS / CANVAS_CONTEXT_MENU_GROUPS / flattenNodeEntryGroups()
 * [POS]: components/canvas 的节点入口共享配置，统一描述快捷栏与右键菜单的可见项、顺序、分组语义与入口图标
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { LucideIcon } from 'lucide-react'
import {
  BrainCircuit,
  Combine,
  GitBranch,
  Group,
  ImageIcon,
  ImagePlus,
  Images,
  MonitorPlay,
  Music,
  Repeat,
  StickyNote,
  Type,
  Video,
} from 'lucide-react'

import type { CanvasTool } from '@/stores/use-canvas-tool-store'

type NodeEntryLabelKey =
  | 'addTextInput'
  | 'addImageInput'
  | 'addTextMerge'
  | 'addImageMerge'
  | 'addNote'
  | 'addLLM'
  | 'addImageGen'
  | 'addVideoGen'
  | 'addAudioGen'
  | 'addDisplay'
  | 'addConditional'
  | 'addLoop'
  | 'addGroup'

type NodeEntryGroupLabelKey =
  | 'groupInputs'
  | 'groupText'
  | 'groupImage'
  | 'groupVideo'
  | 'groupAudio'
  | 'groupDisplay'
  | 'groupTools'
  | 'groupMisc'

export interface NodeEntryItem {
  type: CanvasTool
  labelKey: NodeEntryLabelKey
  icon: LucideIcon
}

export interface NodeEntryGroup {
  id: string
  labelKey: NodeEntryGroupLabelKey
  items: NodeEntryItem[]
}

export const CANVAS_TOOLBAR_NODE_GROUPS: NodeEntryGroup[] = [
  {
    id: 'inputs',
    labelKey: 'groupInputs',
    items: [
      { type: 'text-input', labelKey: 'addTextInput', icon: Type },
      { type: 'image-input', labelKey: 'addImageInput', icon: ImagePlus },
    ],
  },
  {
    id: 'llm',
    labelKey: 'groupText',
    items: [
      { type: 'llm', labelKey: 'addLLM', icon: BrainCircuit },
      { type: 'text-merge', labelKey: 'addTextMerge', icon: Combine },
    ],
  },
  {
    id: 'image',
    labelKey: 'groupImage',
    items: [
      { type: 'image-gen', labelKey: 'addImageGen', icon: ImageIcon },
      { type: 'image-merge', labelKey: 'addImageMerge', icon: Images },
    ],
  },
  {
    id: 'video',
    labelKey: 'groupVideo',
    items: [{ type: 'video-gen', labelKey: 'addVideoGen', icon: Video }],
  },
  {
    id: 'audio',
    labelKey: 'groupAudio',
    items: [{ type: 'audio-gen', labelKey: 'addAudioGen', icon: Music }],
  },
  {
    id: 'display',
    labelKey: 'groupDisplay',
    items: [{ type: 'display', labelKey: 'addDisplay', icon: MonitorPlay }],
  },
]

export const CANVAS_CONTEXT_MENU_GROUPS: NodeEntryGroup[] = [
  {
    id: 'inputs',
    labelKey: 'groupInputs',
    items: [
      { type: 'text-input', labelKey: 'addTextInput', icon: Type },
      { type: 'image-input', labelKey: 'addImageInput', icon: ImagePlus },
      { type: 'note', labelKey: 'addNote', icon: StickyNote },
    ],
  },
  {
    id: 'llm',
    labelKey: 'groupText',
    items: [
      { type: 'llm', labelKey: 'addLLM', icon: BrainCircuit },
      { type: 'text-merge', labelKey: 'addTextMerge', icon: Combine },
    ],
  },
  {
    id: 'image',
    labelKey: 'groupImage',
    items: [
      { type: 'image-gen', labelKey: 'addImageGen', icon: ImageIcon },
      { type: 'image-merge', labelKey: 'addImageMerge', icon: Images },
    ],
  },
  {
    id: 'video',
    labelKey: 'groupVideo',
    items: [{ type: 'video-gen', labelKey: 'addVideoGen', icon: Video }],
  },
  {
    id: 'audio',
    labelKey: 'groupAudio',
    items: [{ type: 'audio-gen', labelKey: 'addAudioGen', icon: Music }],
  },
  {
    id: 'display',
    labelKey: 'groupDisplay',
    items: [{ type: 'display', labelKey: 'addDisplay', icon: MonitorPlay }],
  },
  {
    id: 'tools',
    labelKey: 'groupTools',
    items: [
      { type: 'conditional', labelKey: 'addConditional', icon: GitBranch },
      { type: 'loop', labelKey: 'addLoop', icon: Repeat },
    ],
  },
  {
    id: 'misc',
    labelKey: 'groupMisc',
    items: [{ type: 'group', labelKey: 'addGroup', icon: Group }],
  },
]

export function flattenNodeEntryGroups(groups: NodeEntryGroup[]): NodeEntryItem[] {
  return groups.flatMap((group) => group.items)
}
