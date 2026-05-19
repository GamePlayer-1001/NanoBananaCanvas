/**
 * [INPUT]: 依赖 react 的 useEffect/useRef，依赖 @/lib/utils 的 cn
 * [OUTPUT]: 对外提供 AgentSlashCommandMenu 组件，在 Composer 输入框上方展示可选 slash 指令列表
 * [POS]: components/agent，被 AgentComposer 组合使用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

export interface SlashCommand {
  command: string
  label: string
  description?: string
}

interface AgentSlashCommandMenuProps {
  commands: SlashCommand[]
  activeIndex: number
  onSelect: (command: SlashCommand) => void
  onDismiss: () => void
}

export function AgentSlashCommandMenu(props: AgentSlashCommandMenuProps) {
  const { commands, activeIndex, onSelect } = props
  const activeRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  if (commands.length === 0) return null

  return (
    <div
      className="absolute bottom-full left-0 right-0 z-50 mb-2 overflow-hidden rounded-2xl border border-black/8 bg-white shadow-[0_8px_32px_rgba(15,23,42,0.14)]"
      onMouseLeave={() => {}}
    >
      <div className="flex items-center gap-2 border-b border-black/5 px-4 py-2">
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className="shrink-0 text-slate-400"
          aria-hidden="true"
        >
          <path
            d="M2 6h8M6 2l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-[11px] font-medium tracking-[0.08em] text-slate-400 uppercase">
          指令
        </span>
        <span className="ml-auto text-[11px] text-slate-300">
          ↑↓ 导航 · Enter 选择 · Esc 关闭
        </span>
      </div>
      <div className="p-1.5">
        {commands.map((cmd, index) => (
          <button
            key={cmd.command}
            ref={index === activeIndex ? activeRef : undefined}
            type="button"
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
              index === activeIndex
                ? 'bg-indigo-50'
                : 'hover:bg-slate-50',
            )}
            onMouseDown={(event) => {
              event.preventDefault()
              onSelect(cmd)
            }}
          >
            <span
              className={cn(
                'shrink-0 rounded-lg px-2.5 py-0.5 font-mono text-[13px] font-semibold tabular-nums',
                index === activeIndex
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-slate-100 text-slate-600',
              )}
            >
              {cmd.command}
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  'text-[13px] font-medium',
                  index === activeIndex ? 'text-indigo-900' : 'text-slate-700',
                )}
              >
                {cmd.label}
              </p>
              {cmd.description ? (
                <p className="truncate text-[11px] text-slate-400">{cmd.description}</p>
              ) : null}
            </div>
            {index === activeIndex ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="shrink-0 text-indigo-400"
                aria-hidden="true"
              >
                <path
                  d="M3 7h8M7 4l3 3-3 3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  )
}
