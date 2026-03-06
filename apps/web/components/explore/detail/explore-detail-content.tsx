/**
 * [INPUT]: 依赖 @/hooks/use-explore 的 useExploreDetail，
 *          依赖 next-intl 的 useTranslations，依赖 @/i18n/navigation 的 Link，
 *          依赖 ./workflow-preview, ./author-info, ./action-buttons
 * [OUTPUT]: 对外提供 ExploreDetailContent 客户端交互容器
 * [POS]: explore/detail 的主容器，被 explore/[id]/page.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2 } from 'lucide-react'

import { Link } from '@/i18n/navigation'
import { useExploreDetail } from '@/hooks/use-explore'
import { WorkflowPreview } from './workflow-preview'
import { AuthorInfo } from './author-info'
import { ActionButtons } from './action-buttons'

/* ─── Types ──────────────────────────────────────────── */

interface ExploreDetailContentProps {
  workflowId: string
}

/* ─── Component ──────────────────────────────────────── */

export function ExploreDetailContent({ workflowId }: ExploreDetailContentProps) {
  const t = useTranslations('exploreDetail')
  const { data, isLoading } = useExploreDetail(workflowId)

  /* 加载态 */
  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  /* 数据缺失 */
  if (!data) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">{t('notFound')}</p>
        <Link href="/explore" className="text-sm text-brand-600 hover:underline">
          {t('backToExplore')}
        </Link>
      </div>
    )
  }

  const workflow = data as Record<string, unknown>

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-5">
      {/* 返回链接 */}
      <Link
        href="/explore"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={14} />
        {t('backToExplore')}
      </Link>

      {/* 标题区 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          {workflow.name as string}
        </h1>
        {workflow.description && (
          <p className="mt-2 text-sm text-muted-foreground">
            {workflow.description as string}
          </p>
        )}
      </div>

      {/* 主内容区: 预览 + 侧栏 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        {/* 左: 只读画布预览 */}
        <div className="aspect-[16/10] overflow-hidden rounded-xl border border-border bg-muted">
          <WorkflowPreview data={workflow.data as string | undefined} />
        </div>

        {/* 右: 作者 + 统计 + 操作 */}
        <div className="space-y-4">
          <AuthorInfo
            name={workflow.author_name as string}
            avatar={workflow.author_avatar as string | undefined}
            publishedAt={workflow.published_at as string | undefined}
          />

          {/* 统计数据 */}
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>{t('views', { count: (workflow.view_count as number) ?? 0 })}</span>
            <span>{t('likes', { count: (workflow.like_count as number) ?? 0 })}</span>
            <span>{t('clones', { count: (workflow.clone_count as number) ?? 0 })}</span>
          </div>

          <ActionButtons
            workflowId={workflowId}
            liked={(workflow.liked as boolean) ?? false}
            favorited={(workflow.favorited as boolean) ?? false}
          />
        </div>
      </div>
    </div>
  )
}
