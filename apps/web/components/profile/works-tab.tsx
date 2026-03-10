/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @/hooks/use-workflows 的 useWorkflows，
 *          依赖 @tanstack/react-query 的 useQuery，依赖 @/lib/query/keys，
 *          依赖 @/i18n/navigation 的 Link，依赖 lucide-react 图标
 * [OUTPUT]: 对外提供 WorksTab 我的作品 Tab (含收藏列表)
 * [POS]: profile 的作品列表 Tab，被 profile-modal.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Globe, Heart, Lock, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { Link } from '@/i18n/navigation'
import { useWorkflows } from '@/hooks/use-workflows'
import { queryKeys } from '@/lib/query/keys'

/* ─── Sub-Tabs ───────────────────────────────────────────── */

type SubTab = 'all' | 'shared' | 'favorites'

/* ─── Favorites Fetcher ──────────────────────────────────── */

function useFavorites() {
  return useQuery({
    queryKey: [...queryKeys.workflows.all, 'favorites'] as const,
    queryFn: async () => {
      const res = await fetch('/api/workflows/favorites')
      if (!res.ok) throw new Error('Failed to fetch favorites')
      const json = await res.json()
      return json.data as { items: Array<Record<string, unknown>> }
    },
  })
}

/* ─── Workflow Item ──────────────────────────────────────── */

function WorkflowItem({ w, isFav }: { w: Record<string, unknown>; isFav?: boolean }) {
  return (
    <Link
      href={isFav ? `/explore/${w.id}` : `/workspace/${w.id}`}
      className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
    >
      {isFav ? (
        <Heart size={14} className="text-rose-500" />
      ) : w.is_public === 1 ? (
        <Globe size={14} className="text-emerald-500" />
      ) : (
        <Lock size={14} className="text-muted-foreground" />
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {w.name as string}
        </p>
        <p className="text-xs text-muted-foreground">
          {isFav && w.author_name
            ? (w.author_name as string)
            : (w.updated_at as string)}
        </p>
      </div>
    </Link>
  )
}

/* ─── Component ──────────────────────────────────────────── */

export function WorksTab() {
  const t = useTranslations('profileWorks')
  const [subTab, setSubTab] = useState<SubTab>('all')
  const { data, isLoading } = useWorkflows()
  const { data: favData, isLoading: favLoading } = useFavorites()

  const response = data as { items?: Array<Record<string, unknown>> } | undefined
  const workflows = response?.items ?? []

  const filtered = subTab === 'shared'
    ? workflows.filter((w) => w.is_public === 1)
    : subTab === 'favorites'
      ? (favData?.items ?? [])
      : workflows

  const loading = subTab === 'favorites' ? favLoading : isLoading

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">{t('title')}</h3>

      {/* 子 Tab */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {(['all', 'shared', 'favorites'] as const).map((tab) => (
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
      {loading ? (
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
            <WorkflowItem
              key={w.id as string}
              w={w}
              isFav={subTab === 'favorites'}
            />
          ))}
        </div>
      )}
    </div>
  )
}
