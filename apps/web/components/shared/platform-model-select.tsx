/**
 * [INPUT]: 依赖 @/components/ui/select，依赖 @/lib/platform-models 的可视化选项元数据
 * [OUTPUT]: 对外提供 PlatformModelSelect 组件，统一渲染平台模型下拉的 logo + 模型名 + 可选说明
 * [POS]: components/shared 的平台模型选择器，被 Agent 面板与生成类型节点复用，避免重复维护模型展示层
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState } from 'react'
import { AudioLines, Bot, BrainCircuit, Check, ChevronDown, ImageIcon, Sparkles } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { PlatformModelVisualOption } from '@/lib/platform-models'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const PLATFORM_OPTION_ICONS = {
  image: ImageIcon,
  bot: Bot,
  brain: BrainCircuit,
  audio: AudioLines,
  sparkles: Sparkles,
} as const

interface PlatformModelSelectProps {
  value?: string
  options: PlatformModelVisualOption[]
  onValueChange?: (value: string) => void
  disabled?: boolean
  placeholder?: string
  triggerClassName?: string
  contentClassName?: string
  size?: 'sm' | 'default'
}

export function PlatformModelSelect({
  value,
  options,
  onValueChange,
  disabled = false,
  placeholder,
  triggerClassName,
  contentClassName,
  size = 'default',
}: PlatformModelSelectProps) {
  const selected = options.find((option) => option.value === value) ?? options[0]
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          type="button"
          className={cn(
            'flex w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
            size === 'sm' ? 'h-8' : 'h-9',
            triggerClassName,
          )}
        >
          {selected ? (
            <ModelOptionContent option={selected} compact />
          ) : (
            <span className="text-muted-foreground truncate">{placeholder}</span>
          )}
          <ChevronDown className="size-4 shrink-0 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className={cn('min-w-[240px]', contentClassName)}
      >
        {options.map((option) => {
          const active = option.selectionValue === selected?.selectionValue
          return (
            <DropdownMenuItem
              key={option.selectionValue}
              onSelect={() => {
                onValueChange?.(option.value)
                setOpen(false)
              }}
              className="flex items-center justify-between gap-3"
            >
              <ModelOptionContent option={option} />
              {active ? <Check className="size-4 text-[var(--brand-500)]" /> : null}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ModelOptionContent({
  option,
  compact = false,
}: {
  option: PlatformModelVisualOption
  compact?: boolean
}) {
  const Icon = PLATFORM_OPTION_ICONS[option.logoName]

  return (
    <span className="flex min-w-0 items-center gap-2">
      <span
        className={cn(
          'inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
          option.logoClassName,
        )}
      >
        <Icon className="size-3" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-left">{option.label}</span>
        {!compact && option.description ? (
          <span className="text-muted-foreground truncate text-[11px]">
            {option.description}
          </span>
        ) : null}
      </span>
    </span>
  )
}
