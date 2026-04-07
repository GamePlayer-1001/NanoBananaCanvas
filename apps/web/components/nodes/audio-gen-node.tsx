/**
 * [INPUT]: 依赖 @xyflow/react 的 NodeProps，依赖 ./base-node，依赖 @/stores/use-flow-store，
 *          依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 AudioGenNode 音频生成节点组件
 * [POS]: components/nodes 的 TTS 节点，被 registry 注册并在画布中渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, useMemo, type ChangeEvent } from 'react'
import type { NodeProps } from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { Loader2, Music } from 'lucide-react'
import type { WorkflowNodeData } from '@/types'
import { useFlowStore } from '@/stores/use-flow-store'
import { BaseNode } from './base-node'

/* ─── Defaults ───────────────────────────────────────── */

const DEFAULT_MODEL = 'tts-1'
const DEFAULT_VOICE = 'alloy'
const DEFAULT_SPEED = 1.0

/* ─── Options ────────────────────────────────────────── */

const VOICE_OPTIONS = [
  { value: 'alloy', label: 'Alloy' },
  { value: 'echo', label: 'Echo' },
  { value: 'fable', label: 'Fable' },
  { value: 'onyx', label: 'Onyx' },
  { value: 'nova', label: 'Nova' },
  { value: 'shimmer', label: 'Shimmer' },
]

const MODEL_OPTIONS = [
  { value: 'tts-1', label: 'TTS-1' },
  { value: 'tts-1-hd', label: 'TTS-1 HD' },
]

/* ─── Shared Styles ──────────────────────────────────── */

const SELECT_CLASS =
  'nodrag nowheel border-input bg-background w-full rounded-md border px-2 py-1 text-sm focus:ring-1 focus:ring-[var(--brand-500)] focus:outline-none'

/* ─── Component ──────────────────────────────────────── */

export function AudioGenNode(props: NodeProps) {
  const data = props.data as WorkflowNodeData
  const updateNodeData = useFlowStore((s) => s.updateNodeData)
  const t = useTranslations('nodes')

  /* ── Config values ─────────────────────────────────── */
  const model = (data.config.model as string) ?? DEFAULT_MODEL
  const voice = (data.config.voice as string) ?? DEFAULT_VOICE
  const speed = (data.config.speed as number) ?? DEFAULT_SPEED
  const resultUrl = (data.config.resultUrl as string) ?? ''
  const status = data.status ?? 'idle'

  /* ── Update helpers ────────────────────────────────── */
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

  const onVoiceChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => updateConfig({ voice: e.target.value }),
    [updateConfig],
  )

  const onSpeedChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) =>
      updateConfig({ speed: parseFloat(e.target.value) }),
    [updateConfig],
  )

  /* ── Speed display ─────────────────────────────────── */
  const speedLabel = useMemo(() => `${speed.toFixed(1)}x`, [speed])

  return (
    <BaseNode {...props} data={data} icon={<Music size={14} />}>
      <div className="space-y-3">
        {/* ── Model selector ──────────────────────── */}
        <ConfigField label={t('model')}>
          <select value={model} onChange={onModelChange} className={SELECT_CLASS}>
            {MODEL_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </ConfigField>

        {/* ── Voice selector ─────────────────────── */}
        <ConfigField label={t('audioVoice')}>
          <select value={voice} onChange={onVoiceChange} className={SELECT_CLASS}>
            {VOICE_OPTIONS.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </ConfigField>

        {/* ── Speed slider ───────────────────────── */}
        <ConfigField label={t('audioSpeed', { value: speedLabel })}>
          <input
            type="range"
            min={0.25}
            max={4.0}
            step={0.25}
            value={speed}
            onChange={onSpeedChange}
            className="nodrag nowheel w-full accent-[var(--brand-500)]"
          />
        </ConfigField>

        {/* ── Result preview ──────────────────────── */}
        {(status === 'running' || resultUrl) && (
          <div className="border-border rounded-md border">
            <div className="border-border flex items-center justify-between border-b px-2 py-1">
              <span className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
                {t('output')}
              </span>
              {status === 'running' && (
                <Loader2 size={10} className="animate-spin text-[var(--brand-500)]" />
              )}
            </div>
            <div className="flex items-center justify-center p-2">
              {resultUrl ? (
                <audio src={resultUrl} controls className="nodrag nowheel w-full" />
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
