/**
 * [INPUT]: 依赖 react 的 useState，依赖 shadcn Button/Select，依赖 lucide-react 的发送图标
 * [OUTPUT]: 对外提供 AgentComposer 组件，承载轻量输入、模型选择与平台/API Key 模式切换
 * [POS]: components/agent 的输入区，被 AgentPanel 组合使用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState } from 'react'
import { ArrowUp, Bot, KeyRound, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type AgentComposerExecutionMode = 'platform' | 'user_key'

export interface AgentComposerModelOption {
  value: string
  label: string
  provider?: string
}

interface AgentComposerProps {
  placeholder?: string
  hint?: string
  disabled?: boolean
  submitLabel?: string
  modelOptions?: AgentComposerModelOption[]
  modelValue?: string
  onModelChange?: (value: string) => void
  executionMode?: AgentComposerExecutionMode
  onExecutionModeChange?: (value: AgentComposerExecutionMode) => void
  onSubmit?: (value: string) => void
}

export function AgentComposer({
  placeholder,
  hint,
  disabled = false,
  submitLabel,
  modelOptions = [],
  modelValue,
  onModelChange,
  executionMode = 'platform',
  onExecutionModeChange,
  onSubmit,
}: AgentComposerProps) {
  const t = useTranslations('agentPanel')
  const [value, setValue] = useState('')

  function handleSubmit() {
    const nextValue = value.trim()
    if (!nextValue || disabled) return
    onSubmit?.(nextValue)
    setValue('')
  }

  const selectedModelLabel =
    modelOptions.find((item) => item.value === modelValue)?.label ?? t('composerModelFallback')

  const resolvedPlaceholder = placeholder ?? t('composerPlaceholder')
  const resolvedHint = hint ?? t('composerHint')
  const resolvedSubmitLabel = submitLabel ?? t('composerSubmit')

  return (
    <div className="space-y-2.5">
      <div className="overflow-hidden rounded-[28px] border border-black/8 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <div className="flex items-center gap-2 border-b border-black/5 px-3 py-2.5">
          <Select value={modelValue} onValueChange={onModelChange}>
            <SelectTrigger
              size="sm"
              className="h-8 min-w-[132px] rounded-full border-0 bg-slate-100 px-3 text-xs shadow-none"
            >
              <Bot className="size-3.5 text-slate-500" />
              <SelectValue placeholder={selectedModelLabel} />
            </SelectTrigger>
            <SelectContent align="start">
              {modelOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={executionMode}
            onValueChange={(nextValue) => onExecutionModeChange?.(nextValue as AgentComposerExecutionMode)}
          >
            <SelectTrigger
              size="sm"
              className="h-8 min-w-[116px] rounded-full border-0 bg-slate-100 px-3 text-xs shadow-none"
            >
              {executionMode === 'platform' ? (
                <Sparkles className="size-3.5 text-slate-500" />
              ) : (
                <KeyRound className="size-3.5 text-slate-500" />
              )}
              <SelectValue
                placeholder={
                  executionMode === 'platform'
                    ? t('composerPlatformMode')
                    : t('composerUserKeyMode')
                }
              />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="platform">{t('composerPlatformMode')}</SelectItem>
              <SelectItem value="user_key">{t('composerUserKeyMode')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end gap-3 px-4 py-3">
          <textarea
            value={value}
            disabled={disabled}
            rows={1}
            placeholder={resolvedPlaceholder}
            className="max-h-36 min-h-[72px] flex-1 resize-none border-0 bg-transparent text-[15px] leading-7 text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                handleSubmit()
              }
            }}
          />

          <Button
            type="button"
            size="icon-lg"
            className="mb-1 rounded-full"
            disabled={disabled || value.trim().length === 0}
            onClick={handleSubmit}
          >
            <ArrowUp size={18} />
            <span className="sr-only">{resolvedSubmitLabel}</span>
          </Button>
        </div>
      </div>

      <p className="px-1 text-[11px] leading-5 text-slate-400">
        {resolvedHint}
      </p>
    </div>
  )
}
