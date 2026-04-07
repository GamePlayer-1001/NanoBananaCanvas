/**
 * [INPUT]: 依赖 @xyflow/react 的 NodeProps，依赖 ./base-node，依赖 @/stores/use-flow-store，
 *          依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 VideoGenNode 视频生成节点组件
 * [POS]: components/nodes 的视频生成节点，被 registry 注册并在画布中渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, useMemo, type ChangeEvent } from 'react'
import type { NodeProps } from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { Loader2, Video } from 'lucide-react'
import type { WorkflowNodeData } from '@/types'
import { useFlowStore } from '@/stores/use-flow-store'
import { BaseNode } from './base-node'

/* ─── Defaults ───────────────────────────────────────── */

const DEFAULT_PROVIDER = 'kling'
const DEFAULT_MODEL = 'kling-v2-0'
const DEFAULT_DURATION = '5'
const DEFAULT_ASPECT = '16:9'
const DEFAULT_MODE = 'std'

/* ─── Provider + Model Catalog ───────────────────────── */

const VIDEO_PROVIDERS = [
  { value: 'kling', label: '可灵 (Kling)', disabled: false },
  { value: 'jimeng', label: '即梦 (Jimeng) — Coming Soon', disabled: true },
]

const VIDEO_MODELS: Record<string, Array<{ value: string; label: string }>> = {
  kling: [
    { value: 'kling-v2-0', label: 'Kling V2.0' },
    { value: 'kling-v1-6', label: 'Kling V1.6' },
  ],
  jimeng: [{ value: 'seedance-2.0', label: 'Seedance 2.0' }],
}

const DURATION_OPTIONS = [
  { value: '5', label: '5s' },
  { value: '10', label: '10s' },
]

const ASPECT_OPTIONS = [
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '1:1', label: '1:1' },
]

const MODE_OPTIONS = [
  { value: 'std', label: 'Standard' },
  { value: 'pro', label: 'Professional' },
]

/* ─── Shared Styles ──────────────────────────────────── */

const SELECT_CLASS =
  'nodrag nowheel border-input bg-background w-full rounded-md border px-2 py-1 text-sm focus:ring-1 focus:ring-[var(--brand-500)] focus:outline-none'

/* ─── Component ──────────────────────────────────────── */

export function VideoGenNode(props: NodeProps) {
  const data = props.data as WorkflowNodeData
  const updateNodeData = useFlowStore((s) => s.updateNodeData)
  const t = useTranslations('nodes')

  /* ── Config values ─────────────────────────────────── */
  const provider = (data.config.provider as string) ?? DEFAULT_PROVIDER
  const model = (data.config.model as string) ?? DEFAULT_MODEL
  const duration = (data.config.duration as string) ?? DEFAULT_DURATION
  const aspectRatio = (data.config.aspectRatio as string) ?? DEFAULT_ASPECT
  const mode = (data.config.mode as string) ?? DEFAULT_MODE
  const resultUrl = (data.config.resultUrl as string) ?? ''
  const progress = (data.config.progress as number) ?? 0
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
      const models = VIDEO_MODELS[newProvider] ?? []
      updateConfig({ provider: newProvider, model: models[0]?.value ?? '' })
    },
    [updateConfig],
  )

  const onModelChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => updateConfig({ model: e.target.value }),
    [updateConfig],
  )

  const onDurationChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => updateConfig({ duration: e.target.value }),
    [updateConfig],
  )

  const onAspectChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => updateConfig({ aspectRatio: e.target.value }),
    [updateConfig],
  )

  const onModeChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => updateConfig({ mode: e.target.value }),
    [updateConfig],
  )

  const currentModels = useMemo(() => VIDEO_MODELS[provider] ?? [], [provider])

  return (
    <BaseNode {...props} data={data} icon={<Video size={14} />}>
      <div className="space-y-3">
        {/* ── Provider selector ────────────────────── */}
        <ConfigField label={t('provider')}>
          <select value={provider} onChange={onProviderChange} className={SELECT_CLASS}>
            {VIDEO_PROVIDERS.map((p) => (
              <option key={p.value} value={p.value} disabled={p.disabled}>
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

        {/* ── Duration ────────────────────────────── */}
        <ConfigField label={t('videoDuration')}>
          <select value={duration} onChange={onDurationChange} className={SELECT_CLASS}>
            {DURATION_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </ConfigField>

        {/* ── Aspect Ratio ────────────────────────── */}
        <ConfigField label={t('videoAspect')}>
          <select value={aspectRatio} onChange={onAspectChange} className={SELECT_CLASS}>
            {ASPECT_OPTIONS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </ConfigField>

        {/* ── Quality Mode (Kling only) ───────────── */}
        {provider === 'kling' && (
          <ConfigField label={t('videoMode')}>
            <select value={mode} onChange={onModeChange} className={SELECT_CLASS}>
              {MODE_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </ConfigField>
        )}

        {/* ── Result area ─────────────────────────── */}
        {(status === 'running' || resultUrl) && (
          <div className="border-border rounded-md border">
            <div className="border-border flex items-center justify-between border-b px-2 py-1">
              <span className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
                {t('output')}
              </span>
              {status === 'running' && (
                <div className="flex items-center gap-1.5">
                  <Loader2 size={10} className="animate-spin text-[var(--brand-500)]" />
                  {progress > 0 && (
                    <span className="text-muted-foreground text-[10px]">{progress}%</span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-center p-2">
              {resultUrl ? (
                <video src={resultUrl} controls className="max-h-40 max-w-full rounded" />
              ) : (
                <span className="text-muted-foreground text-xs italic">
                  {t('generating')}
                </span>
              )}
            </div>

            {/* ── Progress bar ──────────────────────── */}
            {status === 'running' && progress > 0 && (
              <div className="px-2 pb-2">
                <div className="bg-muted h-1 w-full overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full bg-[var(--brand-500)] transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
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
