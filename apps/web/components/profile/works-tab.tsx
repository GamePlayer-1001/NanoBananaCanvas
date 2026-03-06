/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @/hooks/use-workflows 的 useWorkflows，
 *          依赖 @/i18n/navigation 的 Link，依赖 lucide-react 图标
 * [OUTPUT]: 对外提供 WorksTab 我的作品 Tab
 * [POS]: profile 的作品列表 Tab，被 profile-modal.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Globe, Lock, Loader2 } from 'lucide-react'

import { Link } from '@/i18n/navigation'
import { useWorkflows } from '@/hooks/use-workflows'

/* ─── Sub-Tabs ───────────────────────────────────────── */

type SubTab = 'all' | 'shared'

/* ─── Component ──────────────────────────────────────── */

export function WorksTab() {
  const t = useTranslations('profileWorks')
  const [subTab, setSubTab] = useState<SubTab>('all')
  const { data, isLoading } = useWorkflows()

  const response = data as { items?: Array<Record<string, unknown>> } | undefined
  const workflows = response?.items ?? []
  const filtered = subTab === 'shared'
    ? workflows.filter((w) => w.is_public === 1)
    : workflows

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">{t('title')}</h3>

      {/* 子 Tab */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {(['all', 'shared'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              subTab === tab
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t(tab)}
          </button>
        ))}
      </div>

      {/* 列表 */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {t('empty')}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((w) => (
            <Link
              key={w.id as string}
              href={`/workspace/${w.id}`}
              className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
            >
              {/* 图标 */}
              {w.is_public === 1 ? (
                <Globe size={14} className="text-emerald-500" />
              ) : (
                <Lock size={14} className="text-muted-foreground" />
              )}

              {/* 信息 */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {w.name as string}
                </p>
                <p className="text-xs text-muted-foreground">
                  {w.updated_at as string}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
