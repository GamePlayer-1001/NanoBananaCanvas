/**
 * [INPUT]: 依赖 @xyflow/react 的 NodeProps，依赖 @/stores/use-flow-store，
 *          依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 NoteNode 备注节点组件
 * [POS]: components/nodes 的纯视觉备注节点，不参与执行引擎
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, type ChangeEvent } from 'react'
import type { NodeProps } from '@xyflow/react'
import { StickyNote } from 'lucide-react'
import type { WorkflowNodeData } from '@/types'
import { useFlowStore } from '@/stores/use-flow-store'
import { cn } from '@/lib/utils'

/* ─── Color Palette ─────────────────────────────────── */

const BG_COLORS = [
  { value: '#fef9c3', label: 'Yellow' },
  { value: '#dcfce7', label: 'Green' },
  { value: '#dbeafe', label: 'Blue' },
  { value: '#fce7f3', label: 'Pink' },
  { value: '#f3e8ff', label: 'Purple' },
  { value: '#fed7aa', label: 'Orange' },
] as const

/* ─── Component ──────────────────────────────────────── */

export function NoteNode(props: NodeProps) {
  const data = props.data as WorkflowNodeData
  const updateNodeData = useFlowStore((s) => s.updateNodeData)

  const text = (data.config.text as string) ?? ''
  const bgColor = (data.config.bgColor as string) ?? BG_COLORS[0].value

  const onTextChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      updateNodeData(props.id, { config: { ...data.config, text: e.target.value } })
    },
    [props.id, data.config, updateNodeData],
  )

  const onColorChange = useCallback(
    (color: string) => {
      updateNodeData(props.id, { config: { ...data.config, bgColor: color } })
    },
    [props.id, data.config, updateNodeData],
  )

  return (
    <div
      className={cn(
        'relative min-h-[120px] w-[240px] rounded-lg border shadow-sm',
        'transition-shadow duration-150',
        props.selected ? 'border-[var(--brand-500)] shadow-md' : 'border-border',
      )}
      style={{ backgroundColor: bgColor }}
    >
      {/* ── Header ─────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-black/10 px-3 py-2">
        <StickyNote size={14} className="text-muted-foreground" />
        <span className="text-sm font-medium">{data.label}</span>
      </div>

      {/* ── Body ───────────────────────────────────── */}
      <div className="p-2">
        <textarea
          value={text}
          onChange={onTextChange}
          placeholder="Write a note..."
          className="nodrag nowheel w-full resize-none border-none bg-transparent text-sm outline-none placeholder:text-black/30"
          rows={4}
        />
      </div>

      {/* ── Color Picker ───────────────────────────── */}
      <div className="flex gap-1 px-3 pb-2">
        {BG_COLORS.map((c) => (
          <button
            key={c.value}
            className={cn(
              'nodrag h-4 w-4 rounded-full border transition-transform',
              bgColor === c.value ? 'scale-125 border-black/40' : 'border-black/15 hover:scale-110',
            )}
            style={{ backgroundColor: c.value }}
            onClick={() => onColorChange(c.value)}
            title={c.label}
          />
        ))}
      </div>
    </div>
  )
}
