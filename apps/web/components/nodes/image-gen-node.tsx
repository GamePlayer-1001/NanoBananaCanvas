/**
 * [INPUT]: 依赖 @xyflow/react 的 NodeProps，依赖 ./base-node，依赖 @/stores/use-flow-store，
 *          依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 ImageGenNode 图片生成节点组件
 * [POS]: components/nodes 的图片生成节点，被 registry 注册并在画布中渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

/* eslint-disable @next/next/no-img-element -- 生成结果可能是 data URL 或第三方临时链接，不适合走 Next Image。 */

import { useCallback, useEffect, type ChangeEvent } from 'react'
import type { NodeProps } from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { Coins, ImageIcon, KeyRound, Loader2 } from 'lucide-react'

import { useModelConfigs } from '@/hooks/use-model-configs'
import { getProviderLabel } from '@/lib/model-config-catalog'
import { useFlowStore } from '@/stores/use-flow-store'
import type { WorkflowNodeData } from '@/types'

import { BaseNode } from './base-node'

const DEFAULT_PROVIDER = 'openrouter'
const DEFAULT_MODEL = 'openai/dall-e-3'
const DEFAULT_SIZE = '1024x1024'

const SIZE_OPTIONS = [
  { value: '1024x1024', label: '1024×1024' },
  { value: '1024x1792', label: '1024×1792' },
  { value: '1792x1024', label: '1792×1024' },
]

const PLATFORM_PROVIDERS = [
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'gemini', label: 'Google Gemini' },
] as const

const IMAGE_MODELS: Record<string, Array<{ value: string; label: string }>> = {
  openrouter: [{ value: 'openai/dall-e-3', label: 'DALL-E 3' }],
  gemini: [{ value: 'imagen-3.0-generate-002', label: 'Imagen 3' }],
}

const SELECT_CLASS =
  'nodrag nowheel border-input bg-background w-full rounded-md border px-2 py-1 text-sm focus:ring-1 focus:ring-[var(--brand-500)] focus:outline-none'

export function ImageGenNode(props: NodeProps) {
  const data = props.data as WorkflowNodeData
  const updateNodeData = useFlowStore((s) => s.updateNodeData)
  const t = useTranslations('nodes')

  const provider = (data.config.provider as string) ?? DEFAULT_PROVIDER
  const model = (data.config.model as string) ?? DEFAULT_MODEL
  const size = (data.config.size as string) ?? DEFAULT_SIZE
  const executionMode = (data.config.executionMode as string) ?? 'platform'
  const resultUrl = (data.config.resultUrl as string) ?? ''
  const status = data.status ?? 'idle'
  const {
    getConfigByCapability,
    getConfigById,
    getConfigsByCapability,
    isLoading: isModelConfigLoading,
  } = useModelConfigs()
  const savedImageConfigs = getConfigsByCapability('image')
  const selectedUserConfigId =
    ((data.config.userKeyConfigId as string | undefined) ?? savedImageConfigs[0]?.configId) || ''
  const savedImageConfig =
    getConfigById(selectedUserConfigId) ?? getConfigByCapability('image')
  const userKeyProviderLabel = getProviderLabel('image', savedImageConfig?.providerId)
  const userKeyModelLabel =
    savedImageConfig?.modelId?.trim() ||
    (isModelConfigLoading ? 'Loading API config...' : 'Use account API config')

  const updateConfig = useCallback(
    (patch: Record<string, unknown>) => {
      updateNodeData(props.id, { config: { ...data.config, ...patch } })
    },
    [props.id, data.config, updateNodeData],
  )

  useEffect(() => {
    if (
      executionMode === 'user_key' &&
      provider !== 'image'
    ) {
      updateConfig({ provider: 'image', userKeyConfigId: savedImageConfig?.configId ?? '' })
    }
    if (
      executionMode === 'platform' &&
      !PLATFORM_PROVIDERS.some((item) => item.value === provider)
    ) {
      updateConfig({ provider: DEFAULT_PROVIDER, model: DEFAULT_MODEL })
    }
  }, [executionMode, provider, savedImageConfig?.configId, updateConfig])

  const onProviderChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const nextProvider = e.target.value
      if (executionMode === 'user_key') {
        updateConfig({ provider: nextProvider })
        return
      }

      const nextModels = IMAGE_MODELS[nextProvider] ?? []
      updateConfig({
        provider: nextProvider,
        model: nextModels[0]?.value ?? model,
      })
    },
    [executionMode, model, updateConfig],
  )

  const onModelChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => updateConfig({ model: e.target.value }),
    [updateConfig],
  )

  const onSizeChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => updateConfig({ size: e.target.value }),
    [updateConfig],
  )

  const providerOptions =
    executionMode === 'user_key'
      ? [{ value: 'image', label: userKeyProviderLabel }]
      : [...PLATFORM_PROVIDERS]

  const currentModels = executionMode === 'user_key' ? [] : (IMAGE_MODELS[provider] ?? [])

  return (
    <BaseNode {...props} data={data} icon={<ImageIcon size={14} />}>
      <div className="space-y-3">
        <ConfigField label={t('executionMode')}>
          <div className="nodrag flex gap-1">
            <ModeButton
              active={executionMode === 'platform'}
              onClick={() =>
                updateConfig({
                  executionMode: 'platform',
                  provider: DEFAULT_PROVIDER,
                  model: DEFAULT_MODEL,
                })
              }
              icon={<Coins size={12} />}
              label={t('platformMode')}
            />
            <ModeButton
              active={executionMode === 'user_key'}
              onClick={() => updateConfig({ executionMode: 'user_key', provider: 'image' })}
              icon={<KeyRound size={12} />}
              label={t('userKeyMode')}
            />
          </div>
        </ConfigField>

        <ConfigField label={t('provider')}>
          <select value={provider} onChange={onProviderChange} className={SELECT_CLASS}>
            {providerOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </ConfigField>

        {executionMode === 'user_key' ? (
          <ConfigField label={t('accountConfigLabel')}>
            <select
              value={selectedUserConfigId}
              onChange={(e) => updateConfig({ userKeyConfigId: e.target.value, provider: 'image' })}
              className={SELECT_CLASS}
            >
              {savedImageConfigs.length === 0 ? (
                <option value="">{t('noApiConfigs')}</option>
              ) : (
                savedImageConfigs.map((item) => (
                  <option key={item.configId} value={item.configId}>
                    {item.label || item.configId}
                  </option>
                ))
              )}
            </select>
          </ConfigField>
        ) : null}

        <ConfigField label={t('model')}>
          <select
            value={executionMode === 'user_key' ? userKeyModelLabel : model}
            onChange={onModelChange}
            className={SELECT_CLASS}
            disabled={executionMode === 'user_key'}
          >
            {executionMode === 'user_key' ? (
              <option value={userKeyModelLabel}>{userKeyModelLabel}</option>
            ) : (
              currentModels.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))
            )}
          </select>
        </ConfigField>

        <ConfigField label={t('imageSize')}>
          <select value={size} onChange={onSizeChange} className={SELECT_CLASS}>
            {SIZE_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </ConfigField>

        {status === 'running' || resultUrl ? (
          <div className="border-border rounded-md border">
            <div className="border-border flex items-center justify-between border-b px-2 py-1">
              <span className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
                {t('output')}
              </span>
              {status === 'running' ? (
                <Loader2 size={10} className="animate-spin text-[var(--brand-500)]" />
              ) : null}
            </div>

            <div className="flex items-center justify-center p-2">
              {resultUrl ? (
                <img
                  src={resultUrl}
                  alt="Generated"
                  className="max-h-40 max-w-full rounded object-contain"
                />
              ) : (
                <span className="text-muted-foreground text-xs italic">
                  {t('generating')}
                </span>
              )}
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
