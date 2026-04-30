/**
 * [INPUT]: 依赖 react 的 useState，依赖 @/components/ui/button 与原生 textarea
 * [OUTPUT]: 对外提供 AgentComposer 组件，承载输入、发送与最小影响提示
 * [POS]: components/agent 的输入区，被 AgentPanel 组合使用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface AgentComposerProps {
  placeholder?: string
  hint?: string
  disabled?: boolean
  onSubmit?: (value: string) => void
}

export function AgentComposer({
  placeholder = '描述你想搭建或修改的工作流...',
  hint = '右侧输入只负责提案，最终结构仍会落到左侧画板。',
  disabled = false,
  onSubmit,
}: AgentComposerProps) {
  const [value, setValue] = useState('')

  function handleSubmit() {
    const nextValue = value.trim()
    if (!nextValue || disabled) return
    onSubmit?.(nextValue)
    setValue('')
  }

  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-black/10 bg-white p-3 shadow-sm">
        <textarea
          value={value}
          disabled={disabled}
          rows={4}
          placeholder={placeholder}
          className="min-h-[88px] w-full resize-none border-0 bg-transparent text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              handleSubmit()
            }
          }}
        />

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[11px] leading-5 text-slate-500">{hint}</p>
          <Button
            type="button"
            size="sm"
            className="rounded-full px-4"
            disabled={disabled || value.trim().length === 0}
            onClick={handleSubmit}
          >
            发送
          </Button>
        </div>
      </div>
    </div>
  )
}
