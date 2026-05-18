/**
 * [INPUT]: 依赖 react 的 useRef/useState，依赖 shadcn Button/Select，依赖共享 PlatformModelSelect，依赖 lucide-react 的发送/图片图标
 * [OUTPUT]: 对外提供 AgentComposer 组件，承载轻量输入、模型选择、图片附件与平台/API Key 模式切换
 * [POS]: components/agent 的输入区，被 AgentPanel 组合使用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, useMemo, useRef, useState, type ChangeEvent, type ClipboardEvent, type DragEvent, type KeyboardEvent } from 'react'
import { ArrowUp, Bot, Coins, ExternalLink, ImagePlus, KeyRound, Sparkles, X } from 'lucide-react'
import Image from 'next/image'
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
import { AgentSlashCommandMenu, type SlashCommand } from './agent-slash-command-menu'

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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const { upload, uploading } = useUpload()

  const [slashMenuOpen, setSlashMenuOpen] = useState(false)
  const [slashMenuIndex, setSlashMenuIndex] = useState(0)
  const [slashStartIndex, setSlashStartIndex] = useState(0)
  const [slashQuery, setSlashQuery] = useState('')

  const allSlashCommands = useMemo<SlashCommand[]>(
    () => [
      {
        command: '/Workflow',
        label: t('slashWorkflowLabel'),
        description: t('slashWorkflowDesc'),
      },
      {
        command: '/Prompt',
        label: t('slashPromptLabel'),
        description: t('slashPromptDesc'),
      },
    ],
    [t],
  )

  const filteredSlashCommands = useMemo(() => {
    if (!slashQuery) return allSlashCommands
    const q = slashQuery.toLowerCase()
    return allSlashCommands.filter((cmd) => cmd.command.toLowerCase().slice(1).startsWith(q))
  }, [allSlashCommands, slashQuery])

  function getSlashContext(
    text: string,
    cursorPos: number,
  ): { startIndex: number; query: string } | null {
    const before = text.slice(0, cursorPos)
    const match = /(^|[\s\n])(\/\w*)$/.exec(before)
    if (!match) return null
    const startIndex = match.index + match[1].length
    return { startIndex, query: match[2].slice(1) }
  }

  const handleSlashSelect = useCallback(
    (cmd: SlashCommand) => {
      const after = value.slice(slashStartIndex)
      const wordEnd = after.search(/[\s\n]/)
      const rest = wordEnd === -1 ? '' : after.slice(wordEnd)
      const before = value.slice(0, slashStartIndex)
      const nextValue = before + cmd.command + (rest.startsWith(' ') || rest === '' ? rest || ' ' : ' ' + rest)
      setValue(nextValue)
      setSlashMenuOpen(false)
      const newCursor = before.length + cmd.command.length + 1
      setTimeout(() => {
        if (!textareaRef.current) return
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newCursor, newCursor)
      }, 0)
    },
    [value, slashStartIndex],
  )

  async function handleSubmit() {
    const nextValue = value.trim()
    if ((!nextValue && attachments.length === 0) || disabled || uploading) return
    onSubmit?.(nextValue, attachments)
    setValue('')
    setAttachments([])
    setSlashMenuOpen(false)
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
      <div className="relative">
        {slashMenuOpen && filteredSlashCommands.length > 0 ? (
          <AgentSlashCommandMenu
            commands={filteredSlashCommands}
            activeIndex={slashMenuIndex}
            onSelect={handleSlashSelect}
            onDismiss={() => setSlashMenuOpen(false)}
          />
        ) : null}
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
                  className="group w-[96px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm"
                >
                  <button
                    type="button"
                    className="block h-[72px] w-full overflow-hidden bg-slate-100"
                    onDoubleClick={() => window.open(attachment.url, '_blank', 'noopener,noreferrer')}
                    title={t('composerOpenImage')}
                  >
                    <Image
                      src={attachment.url}
                      alt={attachment.name ?? t('composerImageAttachment')}
                      width={96}
                      height={72}
                      className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
                    />
                  </button>
                  <div className="space-y-1 px-2 py-2">
                    <p className="truncate text-[11px] font-medium text-slate-600">
                      {attachment.name ?? t('composerImageAttachment')}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                        onClick={() => window.open(attachment.url, '_blank', 'noopener,noreferrer')}
                        title={t('composerOpenImage')}
                      >
                        <ExternalLink size={10} />
                      </button>
                      <button
                        type="button"
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-500 transition hover:border-rose-200 hover:text-rose-600"
                        onClick={() =>
                          setAttachments((current) =>
                            current.filter((item) => item.url !== attachment.url),
                          )
                        }
                        title={t('composerRemoveImage')}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex items-end gap-3">
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                value={value}
                disabled={disabled}
                rows={1}
                placeholder={resolvedPlaceholder}
                className="max-h-36 min-h-[72px] w-full resize-none border-0 bg-transparent pr-18 pb-8 text-[15px] leading-7 text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
                  const nextValue = event.target.value
                  setValue(nextValue)
                  const cursorPos = event.target.selectionStart ?? nextValue.length
                  const slashCtx = getSlashContext(nextValue, cursorPos)
                  if (slashCtx) {
                    setSlashStartIndex(slashCtx.startIndex)
                    setSlashQuery(slashCtx.query)
                    setSlashMenuOpen(true)
                    setSlashMenuIndex(0)
                  } else {
                    setSlashMenuOpen(false)
                  }
                }}
                onPaste={(event) => void handlePaste(event)}
                onBlur={() => setSlashMenuOpen(false)}
                onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
                  if (slashMenuOpen && filteredSlashCommands.length > 0) {
                    if (event.key === 'ArrowDown') {
                      event.preventDefault()
                      setSlashMenuIndex((i) => (i + 1) % filteredSlashCommands.length)
                      return
                    }
                    if (event.key === 'ArrowUp') {
                      event.preventDefault()
                      setSlashMenuIndex(
                        (i) => (i - 1 + filteredSlashCommands.length) % filteredSlashCommands.length,
                      )
                      return
                    }
                    if (event.key === 'Tab' || (event.key === 'Enter' && !event.shiftKey)) {
                      event.preventDefault()
                      handleSlashSelect(filteredSlashCommands[slashMenuIndex])
                      return
                    }
                    if (event.key === 'Escape') {
                      event.preventDefault()
                      setSlashMenuOpen(false)
                      return
                    }
                  }
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

      </div>
      <p className="px-1 text-[11px] leading-5 text-slate-400">{resolvedHint}</p>
    </div>
  )
}
