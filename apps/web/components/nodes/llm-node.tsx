/**
 * [INPUT]: 依赖 @xyflow/react 的 NodeProps，依赖 ./base-node，依赖 @/stores/use-flow-store，
 *          依赖 @/services/ai 的 getAllModelGroups，依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 LLMNode 大语言模型节点组件
 * [POS]: components/nodes 的核心 AI 节点，被 registry 注册并在画布中渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import type { NodeProps } from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { BrainCircuit, ChevronDown, ChevronRight, Coins, KeyRound, Loader2 } from 'lucide-react'
import type { WorkflowNodeData } from '@/types'
import { useFlowStore } from '@/stores/use-flow-store'
import { getAllModelGroups } from '@/services/ai'
import { BaseNode } from './base-node'

/* ─── Port Definitions ───────────────────────────────── */

const INPUTS = [
  { id: 'prompt-in', label: 'Prompt', type: 'string' as const, required: true },
]
const OUTPUTS = [
  { id: 'text-out', label: 'Response', type: 'string' as const, required: false },
]

/* ─── Defaults ───────────────────────────────────────── */

const DEFAULT_PROVIDER = 'openrouter'
const DEFAULT_MODEL = 'openai/gpt-4o-mini'
const DEFAULT_TEMPERATURE = 0.7
const DEFAULT_MAX_TOKENS = 1024

/* ─── Shared Styles ──────────────────────────────────── */

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
  const provider = (data.config.provider as string) ?? DEFAULT_PROVIDER
  const model = (data.config.model as string) ?? DEFAULT_MODEL
  const temperature = (data.config.temperature as number) ?? DEFAULT_TEMPERATURE
  const maxTokens = (data.config.maxTokens as number) ?? DEFAULT_MAX_TOKENS
  const executionMode = (data.config.executionMode as string) ?? 'credits'
  const systemPrompt = (data.config.systemPrompt as string) ?? ''
  const output = (data.config.output as string) ?? ''
  const tokenCount = (data.config.tokenCount as number) ?? 0
  const status = data.status ?? 'idle'

  /* ── 从注册表获取模型列表 ─────────────────────────── */
  const modelGroups = useMemo(() => getAllModelGroups(), [])

  /* ── 当前 Provider 下的模型 ────────────────────────── */
  const currentGroups = useMemo(
    () => modelGroups.filter((g) => g.provider === provider),
    [modelGroups, provider],
  )

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

  const onProviderChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const newProvider = e.target.value
      // 切换 Provider 时自动选中该 Provider 的第一个模型
      const groups = modelGroups.filter((g) => g.provider === newProvider)
      const firstModel = groups[0]?.models[0]?.value ?? ''
      updateConfig({ provider: newProvider, model: firstModel })
    },
    [updateConfig, modelGroups],
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

  /* ── 可用的 Provider 列表 (去重) ────────────────────── */
  const providerOptions = useMemo(() => {
    const seen = new Set<string>()
    return modelGroups
      .filter((g) => {
        if (seen.has(g.provider)) return false
        seen.add(g.provider)
        return true
      })
      .map((g) => ({ value: g.provider, label: g.providerName }))
  }, [modelGroups])

  return (
    <BaseNode
      {...props}
      data={data}
      icon={<BrainCircuit size={14} />}
      inputs={INPUTS}
      outputs={OUTPUTS}
    >
      <div className="space-y-3">
        {/* ── Provider selector ────────────────────── */}
        <ConfigField label={t('provider')}>
          <select value={provider} onChange={onProviderChange} className={SELECT_CLASS}>
            {providerOptions.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </ConfigField>

        {/* ── Model selector (按 Provider 分组) ───── */}
        <ConfigField label={t('model')}>
          <select value={model} onChange={onModelChange} className={SELECT_CLASS}>
            {currentGroups.map((group) => (
              <optgroup key={group.providerName} label={group.providerName}>
                {group.models.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </ConfigField>

        {/* ── Execution mode toggle ────────────────── */}
        <ConfigField label={t('executionMode')}>
          <div className="nodrag flex gap-1">
            <ModeButton
              active={executionMode === 'credits'}
              onClick={() => updateConfig({ executionMode: 'credits' })}
              icon={<Coins size={12} />}
              label={t('creditsMode')}
            />
            <ModeButton
              active={executionMode === 'user_key'}
              onClick={() => updateConfig({ executionMode: 'user_key' })}
              icon={<KeyRound size={12} />}
              label={t('userKeyMode')}
            />
          </div>
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

function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors ${
        active
          ? 'border-[var(--brand-500)] bg-[var(--brand-500)]/10 text-[var(--brand-500)]'
          : 'border-input text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
