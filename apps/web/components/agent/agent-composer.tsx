/**
 * [INPUT]: 依赖 react 的 useRef/useState，依赖 shadcn Button/Select，依赖共享 PlatformModelSelect，依赖 lucide-react 的发送/图片图标
 * [OUTPUT]: 对外提供 AgentComposer 组件，承载轻量输入、模型选择、图片附件与平台/API Key 模式切换
 * [POS]: components/agent 的输入区，被 AgentPanel 组合使用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useRef, useState, type ClipboardEvent, type DragEvent } from 'react'
import { ArrowUp, Bot, Coins, ImagePlus, KeyRound, Sparkles, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { PlatformModelSelect } from '@/components/shared/platform-model-select'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUpload } from '@/hooks/use-upload'
import { validateUpload } from '@/lib/validations/upload'
import type { AgentComposerAttachment } from '@/lib/agent/types'
import type { PlatformModelVisualOption } from '@/lib/platform-models'

export type AgentComposerExecutionMode = 'platform' | 'user_key'

export interface AgentComposerModelOption {
  value: string
  label: string
  provider?: string
  logoText?: string
  logoClassName?: string
  description?: string
  credits?: number
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
  onSubmit?: (value: string, attachments: AgentComposerAttachment[]) => void
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
  const [attachments, setAttachments] = useState<AgentComposerAttachment[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { upload, uploading } = useUpload()

  async function handleSubmit() {
    const nextValue = value.trim()
    if ((!nextValue && attachments.length === 0) || disabled || uploading) return
    onSubmit?.(nextValue, attachments)
    setValue('')
    setAttachments([])
  }

  const selectedModelLabel =
    modelOptions.find((item) => item.value === modelValue)?.label ?? t('composerModelFallback')
  const selectedModel =
    modelOptions.find((item) => item.value === modelValue) ?? modelOptions[0]
  const platformModelOptions = modelOptions as PlatformModelVisualOption[]

  const resolvedPlaceholder = placeholder ?? t('composerPlaceholder')
  const resolvedHint = hint ?? t('composerHint')
  const resolvedSubmitLabel = submitLabel ?? t('composerSubmit')

  async function handleFiles(files: FileList | File[]) {
    for (const file of Array.from(files)) {
      const validation = validateUpload(file)
      if (!validation.ok || validation.kind !== 'image') {
        continue
      }

      const result = await upload(file)
      if (!result?.url) {
        continue
      }

      setAttachments((current) => [
        ...current,
        {
          kind: 'image',
          url: result.url,
          name: file.name,
        },
      ])
    }
  }

  async function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const imageFiles = Array.from(event.clipboardData.files).filter((file) =>
      file.type.startsWith('image/'),
    )
    if (imageFiles.length === 0) {
      return
    }

    event.preventDefault()
    await handleFiles(imageFiles)
  }

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    const imageFiles = Array.from(event.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/'),
    )
    if (imageFiles.length === 0) {
      return
    }

    await handleFiles(imageFiles)
  }

  return (
    <div className="space-y-2.5" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
      <div className="overflow-hidden rounded-[28px] border border-black/8 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <div className="flex items-center gap-2 border-b border-black/5 px-3 py-2.5">
          {executionMode === 'platform' ? (
            <div className="min-w-[172px]">
              <PlatformModelSelect
                value={modelValue}
                options={platformModelOptions}
                onValueChange={onModelChange}
                size="sm"
                triggerClassName="h-8 min-w-[172px] rounded-full border-0 bg-slate-100 px-3 text-xs shadow-none"
                contentClassName="min-w-[240px]"
                placeholder={selectedModelLabel}
              />
            </div>
          ) : (
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
          )}

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

        <div className="px-4 py-3">
          {attachments.length > 0 ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachments.map((attachment) => (
                <div
                  key={`${attachment.url}-${attachment.name ?? ''}`}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600"
                >
                  <span className="truncate max-w-[180px]">{attachment.name ?? t('composerImageAttachment')}</span>
                  <button
                    type="button"
                    className="text-slate-400 transition hover:text-slate-700"
                    onClick={() =>
                      setAttachments((current) =>
                        current.filter((item) => item.url !== attachment.url),
                      )
                    }
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex items-end gap-3">
            <div className="relative flex-1">
              <textarea
                value={value}
                disabled={disabled}
                rows={1}
                placeholder={resolvedPlaceholder}
                className="max-h-36 min-h-[72px] w-full resize-none border-0 bg-transparent pr-18 pb-8 text-[15px] leading-7 text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                onChange={(event) => setValue(event.target.value)}
                onPaste={(event) => void handlePaste(event)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    void handleSubmit()
                  }
                }}
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  if (!event.target.files?.length) return
                  void handleFiles(event.target.files)
                  event.target.value = ''
                }}
              />

              <button
                type="button"
                className="absolute left-0 bottom-0 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus size={12} />
                <span>{t('composerAddImage')}</span>
              </button>

              {executionMode === 'platform' ? (
                <span className="pointer-events-none absolute right-0 bottom-1 inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                  <Coins size={11} />
                  <span>{selectedModel?.credits ?? '-'}</span>
                </span>
              ) : null}
            </div>

            <Button
              type="button"
              size="icon-lg"
              className="mb-1 rounded-full"
              disabled={disabled || uploading || (value.trim().length === 0 && attachments.length === 0)}
              onClick={() => void handleSubmit()}
            >
              <ArrowUp size={18} />
              <span className="sr-only">{resolvedSubmitLabel}</span>
            </Button>
          </div>
        </div>
      </div>

      <p className="px-1 text-[11px] leading-5 text-slate-400">{resolvedHint}</p>
    </div>
  )
}
