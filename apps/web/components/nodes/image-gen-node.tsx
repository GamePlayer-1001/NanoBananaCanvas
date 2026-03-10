/**
 * [INPUT]: 依赖 @xyflow/react 的 NodeProps，依赖 ./base-node，依赖 @/stores/use-flow-store，
 *          依赖 @/services/ai 的 getAllModelGroups，依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 ImageGenNode 图片生成节点组件
 * [POS]: components/nodes 的图片生成节点，被 registry 注册并在画布中渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, useMemo, type ChangeEvent } from 'react'
import type { NodeProps } from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { ImageIcon, Loader2 } from 'lucide-react'
import type { WorkflowNodeData } from '@/types'
import { useFlowStore } from '@/stores/use-flow-store'
import { BaseNode } from './base-node'

/* ─── Port Definitions ───────────────────────────────── */

const INPUTS = [
  { id: 'prompt-in', label: 'Prompt', type: 'string' as const, required: true },
  { id: 'image-in', label: 'Reference Image', type: 'image' as const, required: false },
]
const OUTPUTS = [
  { id: 'image-out', label: 'Image', type: 'image' as const, required: false },
]

/* ─── Defaults ───────────────────────────────────────── */

const DEFAULT_PROVIDER = 'openrouter'
const DEFAULT_MODEL = 'openai/dall-e-3'
const DEFAULT_SIZE = '1024x1024'

/* ─── Size Options ───────────────────────────────────── */

const SIZE_OPTIONS = [
  { value: '1024x1024', label: '1024×1024' },
  { value: '1024x1792', label: '1024×1792' },
  { value: '1792x1024', label: '1792×1024' },
]

/* ─── Provider + Model Catalog ───────────────────────── */

const IMAGE_PROVIDERS = [
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'gemini', label: 'Google Gemini' },
]

const IMAGE_MODELS: Record<string, Array<{ value: string; label: string }>> = {
  openrouter: [
    { value: 'openai/dall-e-3', label: 'DALL-E 3' },
  ],
  gemini: [
    { value: 'imagen-3.0-generate-002', label: 'Imagen 3' },
  ],
}

/* ─── Shared Styles ──────────────────────────────────── */

const SELECT_CLASS =
  'nodrag nowheel border-input bg-background w-full rounded-md border px-2 py-1 text-sm focus:ring-1 focus:ring-[var(--brand-500)] focus:outline-none'

/* ─── Component ──────────────────────────────────────── */

export function ImageGenNode(props: NodeProps) {
  const data = props.data as WorkflowNodeData
  const updateNodeData = useFlowStore((s) => s.updateNodeData)
  const t = useTranslations('nodes')

  /* ── Config values ─────────────────────────────────── */
  const provider = (data.config.provider as string) ?? DEFAULT_PROVIDER
  const model = (data.config.model as string) ?? DEFAULT_MODEL
  const size = (data.config.size as string) ?? DEFAULT_SIZE
  const resultUrl = (data.config.resultUrl as string) ?? ''
  const status = data.status ?? 'idle'

  /* ── Update helpers ────────────────────────────────── */
  const updateConfig = useCallback(
    (patch: Record<string, unknown>) => {
      updateNodeData(props.id, { config: { ...data.config, ...patch } })
    },
    [props.id, data.config, updateNodeData],
  )

  const onProviderChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const newProvider = e.target.value
      const models = IMAGE_MODELS[newProvider] ?? []
      updateConfig({ provider: newProvider, model: models[0]?.value ?? '' })
    },
    [updateConfig],
  )

  const onModelChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => updateConfig({ model: e.target.value }),
    [updateConfig],
  )

  const onSizeChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => updateConfig({ size: e.target.value }),
    [updateConfig],
  )

  /* ── Current provider models ───────────────────────── */
  const currentModels = useMemo(
    () => IMAGE_MODELS[provider] ?? [],
    [provider],
  )

  return (
    <BaseNode
      {...props}
      data={data}
      icon={<ImageIcon size={14} />}
      inputs={INPUTS}
      outputs={OUTPUTS}
    >
      <div className="space-y-3">
        {/* ── Provider selector ────────────────────── */}
        <ConfigField label={t('provider')}>
          <select value={provider} onChange={onProviderChange} className={SELECT_CLASS}>
            {IMAGE_PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </ConfigField>

        {/* ── Model selector ──────────────────────── */}
        <ConfigField label={t('model')}>
          <select value={model} onChange={onModelChange} className={SELECT_CLASS}>
            {currentModels.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </ConfigField>

        {/* ── Size selector ───────────────────────── */}
        <ConfigField label={t('imageSize')}>
          <select value={size} onChange={onSizeChange} className={SELECT_CLASS}>
            {SIZE_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </ConfigField>

        {/* ── Result preview ──────────────────────── */}
        {(status === 'running' || resultUrl) && (
          <div className="border-border rounded-md border">
            <div className="border-border flex items-center justify-between border-b px-2 py-1">
              <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                {t('output')}
              </span>
              {status === 'running' && (
                <Loader2 size={10} className="text-[var(--brand-500)] animate-spin" />
              )}
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
