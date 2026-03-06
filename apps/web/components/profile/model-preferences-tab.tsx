/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @/stores/use-settings-store
 * [OUTPUT]: 对外提供 ModelPreferencesTab 模型偏好设置面板
 * [POS]: profile 的模型偏好 Tab，被 profile-modal.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'
import { Key } from 'lucide-react'

import { useSettingsStore } from '@/stores/use-settings-store'

/* ─── Component ──────────────────────────────────────── */

export function ModelPreferencesTab() {
  const t = useTranslations('profile')
  const { apiKey, setApiKey } = useSettingsStore()

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-foreground">{t('modelPreferences')}</h3>

      {/* API Key */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Key size={14} />
          OpenRouter API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-or-v1-..."
          className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-brand-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Your key is stored encrypted locally and never sent to our servers.
        </p>
      </div>

      {/* 默认模型 */}
      <div>
        <label className="text-sm font-medium text-foreground">Default Model</label>
        <select className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-brand-500 focus:outline-none">
          <option value="openai/gpt-4o">GPT-4o</option>
          <option value="anthropic/claude-sonnet-4">Claude Sonnet 4</option>
          <option value="google/gemini-2.5-flash">Gemini 2.5 Flash</option>
        </select>
      </div>
    </div>
  )
}
