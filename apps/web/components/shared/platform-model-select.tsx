/**
 * [INPUT]: 依赖 @/components/ui/select，依赖 @/lib/platform-models 的可视化选项元数据
 * [OUTPUT]: 对外提供 PlatformModelSelect 组件，统一渲染平台模型下拉的 logo + 模型名 + 可选说明
 * [POS]: components/shared 的平台模型选择器，被 Agent 面板与生成类型节点复用，避免重复维护模型展示层
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { cn } from '@/lib/utils'
import type { PlatformModelVisualOption } from '@/lib/platform-models'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
  const selectedSelectionValue = selected?.selectionValue

  return (
    <Select
      value={selectedSelectionValue}
      onValueChange={(selectionValue) => {
        const nextOption = options.find((option) => option.selectionValue === selectionValue)
        if (!nextOption) return
        onValueChange?.(nextOption.value)
      }}
      disabled={disabled}
    >
      <SelectTrigger
        size={size}
        className={cn('w-full justify-between', triggerClassName)}
      >
        {selected ? (
          <ModelOptionContent option={selected} compact />
        ) : (
          <SelectValue placeholder={placeholder} />
        )}
      </SelectTrigger>
      <SelectContent align="start" className={contentClassName}>
        {options.map((option) => (
          <SelectItem
            key={option.selectionValue}
            value={option.selectionValue}
          >
            <ModelOptionContent option={option} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function ModelOptionContent({
  option,
  compact = false,
}: {
  option: PlatformModelVisualOption
  compact?: boolean
}) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span
        className={cn(
          'inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
          option.logoClassName,
        )}
      >
        {option.logoText}
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
