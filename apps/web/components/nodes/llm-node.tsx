/**
 * [INPUT]: 依赖 @xyflow/react 的 NodeProps，依赖 ./base-node，依赖 @/stores/use-flow-store，
 *          依赖 @/stores/use-settings-store (apiKey)，依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 LLMNode 大语言模型节点组件
 * [POS]: components/nodes 的核心 AI 节点，被 registry 注册并在画布中渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import type { NodeProps } from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { BrainCircuit, ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import type { WorkflowNodeData } from '@/types'
import { useFlowStore } from '@/stores/use-flow-store'
import { BaseNode } from './base-node'

/* ─── Model Registry ─────────────────────────────────── */

interface ModelOption {
  value: string
  label: string
}

interface ModelGroup {
  provider: string
  models: ModelOption[]
}

const MODEL_GROUPS: ModelGroup[] = [
  {
    provider: 'OpenAI',
    models: [
      { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
      { value: 'openai/gpt-4o', label: 'GPT-4o' },
    ],
  },
  {
    provider: 'Anthropic',
    models: [
      { value: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet' },
      { value: 'anthropic/claude-haiku-4-5', label: 'Claude Haiku' },
    ],
  },
  {
    provider: 'Google',
    models: [
      { value: 'google/gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
      { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    ],
  },
  {
    provider: 'DeepSeek',
    models: [
      { value: 'deepseek/deepseek-chat', label: 'DeepSeek Chat' },
      { value: 'deepseek/deepseek-reasoner', label: 'DeepSeek Reasoner' },
    ],
  },
]

/* ─── Port Definitions ───────────────────────────────── */

const INPUTS = [
  { id: 'prompt-in', label: 'Prompt', type: 'string' as const, required: true },
]
const OUTPUTS = [
  { id: 'text-out', label: 'Response', type: 'string' as const, required: false },
]

/* ─── Defaults ───────────────────────────────────────── */

const DEFAULT_MODEL = 'openai/gpt-4o-mini'
const DEFAULT_TEMPERATURE = 0.7
const DEFAULT_MAX_TOKENS = 1024

/* ─── Shared Select Styles ───────────────────────────── */

const SELECT_CLASS =
  'nodrag nowheel border-input bg-background w-full rounded-md border px-2 py-1 text-sm focus:ring-1 focus:ring-[var(--brand-500)] focus:outline-none'

const INPUT_CLASS =
  'nodrag nowheel border-input bg-background w-full rounded-md border px-2 py-1 text-sm focus:ring-1 focus:ring-[var(--brand-500)] focus:outline-none'

/* ─── Component ──────────────────────────────────────── */

export function LLMNode(props: NodeProps) {
  const data = props.data as WorkflowNodeData
  const updateNodeData = useFlowStore((s) => s.updateNodeData)
  const t = useTranslations('nodes')

  /* ── Config values with defaults ──────────────────── */
  const model = (data.config.model as string) ?? DEFAULT_MODEL
  const temperature = (data.config.temperature as number) ?? DEFAULT_TEMPERATURE
  const maxTokens = (data.config.maxTokens as number) ?? DEFAULT_MAX_TOKENS
  const systemPrompt = (data.config.systemPrompt as string) ?? ''
  const output = (data.config.output as string) ?? ''
  const tokenCount = (data.config.tokenCount as number) ?? 0
  const status = data.status ?? 'idle'

  /* ── Local UI state ───────────────────────────────── */
  const [showSystemPrompt, setShowSystemPrompt] = useState(!!systemPrompt)
  const outputRef = useRef<HTMLDivElement>(null)

  /* ── Auto-scroll output to bottom ─────────────────── */
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  /* ── Update helpers ───────────────────────────────── */
  const updateConfig = useCallback(
    (patch: Record<string, unknown>) => {
      updateNodeData(props.id, { config: { ...data.config, ...patch } })
    },
    [props.id, data.config, updateNodeData],
  )

  const onModelChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => updateConfig({ model: e.target.value }),
    [updateConfig],
  )

  const onTemperatureChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => updateConfig({ temperature: parseFloat(e.target.value) }),
    [updateConfig],
  )

  const onMaxTokensChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const v = parseInt(e.target.value, 10)
      if (!isNaN(v)) updateConfig({ maxTokens: Math.max(1, Math.min(128000, v)) })
    },
    [updateConfig],
  )

  const onSystemPromptChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => updateConfig({ systemPrompt: e.target.value }),
    [updateConfig],
  )

  return (
    <BaseNode
      {...props}
      data={data}
      icon={<BrainCircuit size={14} />}
      inputs={INPUTS}
      outputs={OUTPUTS}
    >
      <div className="space-y-3">
        {/* ── Model selector (grouped) ──────────────── */}
        <ConfigField label={t('model')}>
          <select value={model} onChange={onModelChange} className={SELECT_CLASS}>
            {MODEL_GROUPS.map((group) => (
              <optgroup key={group.provider} label={group.provider}>
                {group.models.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </ConfigField>

        {/* ── Temperature slider ────────────────────── */}
        <ConfigField label={t('temperature', { value: temperature.toFixed(1) })}>
          <input
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={temperature}
            onChange={onTemperatureChange}
            className="nodrag nowheel w-full accent-[var(--brand-500)]"
          />
          <div className="text-muted-foreground flex justify-between text-[10px]">
            <span>{t('precise')}</span>
            <span>{t('creative')}</span>
          </div>
        </ConfigField>

        {/* ── Max tokens input ──────────────────────── */}
        <ConfigField label={t('maxTokens')}>
          <input
            type="number"
            min={1}
            max={128000}
            value={maxTokens}
            onChange={onMaxTokensChange}
            className={INPUT_CLASS}
          />
        </ConfigField>

        {/* ── System prompt (collapsible) ────────────── */}
        <div>
          <button
            type="button"
            onClick={() => setShowSystemPrompt((v) => !v)}
            className="nodrag text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
          >
            {showSystemPrompt ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            {t('systemPrompt')}
          </button>

          {showSystemPrompt && (
            <textarea
              value={systemPrompt}
              onChange={onSystemPromptChange}
              placeholder={t('systemPromptPlaceholder')}
              rows={3}
              className={`nodrag nowheel mt-1 resize-y ${INPUT_CLASS}`}
            />
          )}
        </div>

        {/* ── Output area (streaming) ────────────────── */}
        {(status === 'running' || output) && (
          <div className="border-border rounded-md border">
            {/* Header */}
            <div className="border-border flex items-center justify-between border-b px-2 py-1">
              <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                {t('output')}
              </span>
              <div className="flex items-center gap-1.5">
                {status === 'running' && (
                  <Loader2 size={10} className="text-[var(--brand-500)] animate-spin" />
                )}
                {tokenCount > 0 && (
                  <span className="text-muted-foreground text-[10px]">{t('tokens', { count: tokenCount })}</span>
                )}
              </div>
            </div>

            {/* Content */}
            <div
              ref={outputRef}
              className="max-h-32 overflow-auto p-2 text-xs leading-relaxed whitespace-pre-wrap"
            >
              {output || (
                <span className="text-muted-foreground italic">{t('generating')}</span>
              )}
              {status === 'running' && (
                <span className="bg-foreground ml-0.5 inline-block h-3 w-1 animate-pulse rounded-sm" />
              )}
            </div>
          </div>
        )}
      </div>
    </BaseNode>
  )
}

/* ─── Internal Components ────────────────────────────── */

function ConfigField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-muted-foreground mb-1 block text-xs">{label}</label>
      {children}
    </div>
  )
}
