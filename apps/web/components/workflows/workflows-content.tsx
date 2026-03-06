/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，
 *          依赖 @/components/shared/category-badge，
 *          依赖 @/components/shared/workflow-card，
 *          依赖 @/hooks/use-workflows，
 *          依赖 @/components/ui/skeleton，
 *          依赖 lucide-react 图标
 * [OUTPUT]: 对外提供 WorkflowsContent 客户端交互容器
 * [POS]: workflows 的客户端组合组件，被 workflows/page.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Search, Upload } from 'lucide-react'

import { CategoryBar } from '@/components/shared/category-badge'
import { WorkflowCard, type WorkflowCardData } from '@/components/shared/workflow-card'
import { Skeleton } from '@/components/ui/skeleton'
import { useWorkflows } from '@/hooks/use-workflows'

/* ─── Tabs ───────────────────────────────────────────── */

type WorkflowTab = 'community' | 'myWorkflows'

/* ─── Skeleton ───────────────────────────────────────── */

function WorkflowCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <Skeleton className="aspect-[16/10] w-full" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  )
}

/* ─── Component ──────────────────────────────────────── */

const CATEGORIES = ['all', 'featured', 'categories'] as const

export function WorkflowsContent() {
  const t = useTranslations('workflows')
  const [tab, setTab] = useState<WorkflowTab>('community')
  const [category, setCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { data, isLoading } = useWorkflows()
  const workflows = (data as WorkflowCardData[] | undefined) ?? []

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-5">
      {/* 标题区 */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
      </div>

      {/* Tab + 搜索 + 发布 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-1">
          <button
            onClick={() => setTab('community')}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              tab === 'community'
                ? 'bg-brand-500 font-medium text-white'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {t('community')}
          </button>
          <button
            onClick={() => setTab('myWorkflows')}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              tab === 'myWorkflows'
                ? 'bg-brand-500 font-medium text-white'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {t('myWorkflows')}
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* 搜索框 */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-[220px] rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-500 focus:outline-none"
            />
          </div>

          {/* 发布按钮 */}
          <button className="flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-600">
            <Upload size={14} />
            {t('publishWorkflow')}
          </button>
        </div>
      </div>

      {/* 分类标签栏 */}
      <div className="mt-4">
        <CategoryBar
          categories={CATEGORIES.map((c) => t(c))}
          active={t(category as (typeof CATEGORIES)[number])}
          onChange={(label) => {
            const found = CATEGORIES.find((c) => t(c) === label)
            if (found) setCategory(found)
          }}
        />
      </div>

      {/* 工作流网格 */}
      <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {isLoading
          ? Array.from({ length: 10 }).map((_, i) => <WorkflowCardSkeleton key={i} />)
          : workflows.length > 0
            ? workflows.map((wf) => <WorkflowCard key={wf.id} data={wf} />)
            : (
                <div className="col-span-full flex flex-col items-center py-20">
                  <p className="text-sm text-muted-foreground">{t('searchPlaceholder')}</p>
                </div>
              )}
      </div>
    </div>
  )
}
