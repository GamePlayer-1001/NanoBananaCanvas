/**
 * [INPUT]: 依赖 lucide-react 的节点入口图标，依赖 @/stores/use-canvas-tool-store 的 CanvasTool
 * [OUTPUT]: 对外提供 CANVAS_TOOLBAR_ENTRIES / CANVAS_CONTEXT_MENU_GROUPS / flattenNodeEntryGroups()
 * [POS]: components/canvas 的节点入口共享配置，统一描述快捷栏与右键菜单的可见项、顺序、分组语义与入口图标
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { LucideIcon } from 'lucide-react'
import {
  BrainCircuit,
  Columns2,
  Combine,
  GitBranch,
  Group,
  ImageIcon,
  ImagePlus,
  Images,
  MonitorPlay,
  Music,
  PenLine,
  Repeat,
  StickyNote,
  Type,
  Video,
  Wrench,
} from 'lucide-react'

import type { CanvasTool } from '@/stores/use-canvas-tool-store'

/* ─── Sub-item Types ─────────────────────────────────── */

type NodeEntryLabelKey =
  | 'addTextInput'
  | 'addImageInput'
  | 'addTextMerge'
  | 'addImageMerge'
  | 'addImageCompare'
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
  icon: LucideIcon
}

/* ─── Context Menu Group Types ───────────────────────── */

type NodeEntryGroupLabelKey =
  | 'groupInputs'
  | 'groupTextGen'
  | 'groupImageGen'
  | 'groupVideoGen'
  | 'groupAudioGen'
  | 'groupDisplay'
  | 'groupTools'
  | 'groupGroup'

export interface NodeEntryGroup {
  id: string
  labelKey: NodeEntryGroupLabelKey
  items: NodeEntryItem[]
}

/* ─── Toolbar Entry Types ────────────────────────────── */

type ToolbarLabelKey =
  | 'groupInputs'
  | 'textGen'
  | 'imageGen'
  | 'videoGen'
  | 'audioGen'
  | 'display'
  | 'groupTools'
  | 'group'

export interface ToolbarEntry {
  id: string
  labelKey: ToolbarLabelKey
  icon: LucideIcon
  /** 直接节点类型 — 点击/拖拽创建此节点 */
  nodeType?: string
  /** 子项 — 点击时展开上拉菜单 */
  items?: NodeEntryItem[]
}

/* ─── Toolbar Config ─────────────────────────────────── */

export const CANVAS_TOOLBAR_ENTRIES: ToolbarEntry[] = [
  {
    id: 'inputs',
    labelKey: 'groupInputs',
    icon: PenLine,
    items: [
      { type: 'text-input', labelKey: 'addTextInput', icon: Type },
      { type: 'image-input', labelKey: 'addImageInput', icon: ImagePlus },
    ],
  },
  { id: 'llm', labelKey: 'textGen', icon: BrainCircuit, nodeType: 'llm' },
  { id: 'image-gen', labelKey: 'imageGen', icon: ImageIcon, nodeType: 'image-gen' },
  { id: 'video-gen', labelKey: 'videoGen', icon: Video, nodeType: 'video-gen' },
  { id: 'audio-gen', labelKey: 'audioGen', icon: Music, nodeType: 'audio-gen' },
  { id: 'display', labelKey: 'display', icon: MonitorPlay, nodeType: 'display' },
  {
    id: 'tools',
    labelKey: 'groupTools',
    icon: Wrench,
    items: [
      { type: 'text-merge', labelKey: 'addTextMerge', icon: Combine },
      { type: 'image-merge', labelKey: 'addImageMerge', icon: Images },
      { type: 'image-compare', labelKey: 'addImageCompare', icon: Columns2 },
      { type: 'conditional', labelKey: 'addConditional', icon: GitBranch },
      { type: 'loop', labelKey: 'addLoop', icon: Repeat },
    ],
  },
  { id: 'group', labelKey: 'group', icon: Group, nodeType: 'group' },
]

/* ─── Context Menu Config ────────────────────────────── */

export const CANVAS_CONTEXT_MENU_GROUPS: NodeEntryGroup[] = [
  {
    id: 'inputs',
    labelKey: 'groupInputs',
    items: [
      { type: 'text-input', labelKey: 'addTextInput', icon: Type },
      { type: 'image-input', labelKey: 'addImageInput', icon: ImagePlus },
    ],
  },
  {
    id: 'text-gen',
    labelKey: 'groupTextGen',
    items: [{ type: 'llm', labelKey: 'addLLM', icon: BrainCircuit }],
  },
  {
    id: 'image-gen',
    labelKey: 'groupImageGen',
    items: [{ type: 'image-gen', labelKey: 'addImageGen', icon: ImageIcon }],
  },
  {
    id: 'video-gen',
    labelKey: 'groupVideoGen',
    items: [{ type: 'video-gen', labelKey: 'addVideoGen', icon: Video }],
  },
  {
    id: 'audio-gen',
    labelKey: 'groupAudioGen',
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
      { type: 'text-merge', labelKey: 'addTextMerge', icon: Combine },
      { type: 'image-merge', labelKey: 'addImageMerge', icon: Images },
      { type: 'image-compare', labelKey: 'addImageCompare', icon: Columns2 },
      { type: 'conditional', labelKey: 'addConditional', icon: GitBranch },
      { type: 'loop', labelKey: 'addLoop', icon: Repeat },
      { type: 'note', labelKey: 'addNote', icon: StickyNote },
    ],
  },
  {
    id: 'group',
    labelKey: 'groupGroup',
    items: [{ type: 'group', labelKey: 'addGroup', icon: Group }],
  },
]

/* ─── Helpers ────────────────────────────────────────── */

export function flattenNodeEntryGroups(groups: NodeEntryGroup[]): NodeEntryItem[] {
  return groups.flatMap((group) => group.items)
}
