/**
 * [INPUT]: 依赖 @xyflow/react 的 NodeProps，依赖 ./base-node，依赖 @/stores/use-flow-store，
 *          依赖 @/services/ai 的 getAllModelGroups，依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 LLMNode 大语言模型节点组件
 * [POS]: components/nodes 的核心 AI 节点，被 registry 注册并在画布中渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import type { NodeProps } from '@xyflow/react'
import { useTranslations } from 'next-intl'
import {
  BrainCircuit,
  ChevronDown,
  ChevronRight,
  Coins,
  KeyRound,
  Loader2,
} from 'lucide-react'

import { getAllModelGroups } from '@/services/ai'
import { useFlowStore } from '@/stores/use-flow-store'
import type { WorkflowNodeData } from '@/types'

import { BaseNode } from './base-node'

const DEFAULT_PROVIDER = 'openrouter'
const DEFAULT_MODEL = 'openai/gpt-4o-mini'
const DEFAULT_TEMPERATURE = 0.7
const DEFAULT_MAX_TOKENS = 1024

const USER_KEY_PROVIDER_OPTIONS = [
  { value: 'llm-openai', label: 'OpenAI Compatible' },
] as const

const SELECT_CLASS =
  'nodrag nowheel border-input bg-background w-full rounded-md border px-2 py-1 text-sm focus:ring-1 focus:ring-[var(--brand-500)] focus:outline-none'

const INPUT_CLASS =
  'nodrag nowheel border-input bg-background w-full rounded-md border px-2 py-1 text-sm focus:ring-1 focus:ring-[var(--brand-500)] focus:outline-none'

export function LLMNode(props: NodeProps) {
  const data = props.data as WorkflowNodeData
  const updateNodeData = useFlowStore((s) => s.updateNodeData)
  const t = useTranslations('nodes')

  const provider = (data.config.provider as string) ?? DEFAULT_PROVIDER
  const model = (data.config.model as string) ?? DEFAULT_MODEL
  const temperature = (data.config.temperature as number) ?? DEFAULT_TEMPERATURE
  const maxTokens = (data.config.maxTokens as number) ?? DEFAULT_MAX_TOKENS
  const executionMode = (data.config.executionMode as string) ?? 'credits'
  const systemPrompt = (data.config.systemPrompt as string) ?? ''
  const output = (data.config.output as string) ?? ''
  const tokenCount = (data.config.tokenCount as number) ?? 0
  const status = data.status ?? 'idle'

  const modelGroups = useMemo(() => getAllModelGroups(), [])
  const currentGroups = useMemo(
    () => modelGroups.filter((g) => g.provider === provider),
    [modelGroups, provider],
  )

  const [showSystemPrompt, setShowSystemPrompt] = useState(!!systemPrompt)
  const outputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  const updateConfig = useCallback(
    (patch: Record<string, unknown>) => {
      updateNodeData(props.id, { config: { ...data.config, ...patch } })
    },
    [props.id, data.config, updateNodeData],
  )

  useEffect(() => {
    if (executionMode === 'user_key' && provider !== 'llm-openai') {
      updateConfig({ provider: 'llm-openai' })
    }
  }, [executionMode, provider, updateConfig])

  const onProviderChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const newProvider = e.target.value
      if (newProvider === 'llm-openai') {
        updateConfig({ provider: newProvider })
        return
      }

      const groups = modelGroups.filter((g) => g.provider === newProvider)
      const firstModel = groups[0]?.models[0]?.value ?? ''
      updateConfig({ provider: newProvider, model: firstModel })
    },
    [modelGroups, updateConfig],
  )

  const onModelChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => updateConfig({ model: e.target.value }),
    [updateConfig],
  )

  const onTemperatureChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) =>
      updateConfig({ temperature: parseFloat(e.target.value) }),
    [updateConfig],
  )

  const onMaxTokensChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const nextValue = parseInt(e.target.value, 10)
      if (!Number.isNaN(nextValue)) {
        updateConfig({ maxTokens: Math.max(1, Math.min(128000, nextValue)) })
      }
    },
    [updateConfig],
  )

  const onSystemPromptChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) =>
      updateConfig({ systemPrompt: e.target.value }),
    [updateConfig],
  )

  const providerOptions = useMemo(() => {
    if (executionMode === 'user_key') {
      return [...USER_KEY_PROVIDER_OPTIONS]
    }

    const seen = new Set<string>()
    return modelGroups
      .filter((g) => {
        if (seen.has(g.provider)) return false
        seen.add(g.provider)
        return true
      })
      .map((g) => ({ value: g.provider, label: g.providerName }))
  }, [executionMode, modelGroups])

  return (
    <BaseNode {...props} data={data} icon={<BrainCircuit size={14} />}>
      <div className="space-y-3">
        <ConfigField label={t('provider')}>
          <select value={provider} onChange={onProviderChange} className={SELECT_CLASS}>
            {providerOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </ConfigField>

        <ConfigField label={t('model')}>
          <select
            value={model}
            onChange={onModelChange}
            className={SELECT_CLASS}
            disabled={executionMode === 'user_key'}
          >
            {executionMode === 'user_key' ? (
              <option value={model}>{model || 'Use profile model config'}</option>
            ) : (
              currentGroups.map((group) => (
                <optgroup key={group.providerName} label={group.providerName}>
                  {group.models.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </optgroup>
              ))
            )}
          </select>
        </ConfigField>

        <ConfigField label={t('executionMode')}>
          <div className="nodrag flex gap-1">
            <ModeButton
              active={executionMode === 'credits'}
              onClick={() =>
                updateConfig({
                  executionMode: 'credits',
                  provider: provider === 'llm-openai' ? DEFAULT_PROVIDER : provider,
                })
              }
              icon={<Coins size={12} />}
              label={t('creditsMode')}
            />
            <ModeButton
              active={executionMode === 'user_key'}
              onClick={() =>
                updateConfig({ executionMode: 'user_key', provider: 'llm-openai' })
              }
              icon={<KeyRound size={12} />}
              label={t('userKeyMode')}
            />
          </div>
        </ConfigField>

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

        <div>
          <button
            type="button"
            onClick={() => setShowSystemPrompt((value) => !value)}
            className="nodrag text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
          >
            {showSystemPrompt ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            {t('systemPrompt')}
          </button>

          {showSystemPrompt ? (
            <textarea
              value={systemPrompt}
              onChange={onSystemPromptChange}
              placeholder={t('systemPromptPlaceholder')}
              rows={3}
              className={`nodrag nowheel mt-1 resize-y ${INPUT_CLASS}`}
            />
          ) : null}
        </div>

        {status === 'running' || output ? (
          <div className="border-border rounded-md border">
            <div className="border-border flex items-center justify-between border-b px-2 py-1">
              <span className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
                {t('output')}
              </span>
              <div className="flex items-center gap-1.5">
                {status === 'running' ? (
                  <Loader2 size={10} className="animate-spin text-[var(--brand-500)]" />
                ) : null}
                {tokenCount > 0 ? (
                  <span className="text-muted-foreground text-[10px]">
                    {t('tokens', { count: tokenCount })}
                  </span>
                ) : null}
              </div>
            </div>

            <div
              ref={outputRef}
              className="max-h-32 overflow-auto p-2 text-xs leading-relaxed whitespace-pre-wrap"
            >
              {output || (
                <span className="text-muted-foreground italic">{t('generating')}</span>
              )}
              {status === 'running' ? (
                <span className="bg-foreground ml-0.5 inline-block h-3 w-1 animate-pulse rounded-sm" />
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </BaseNode>
  )
}

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
