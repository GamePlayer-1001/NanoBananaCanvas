/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，
 *          依赖 @/components/workspace/project-card，
 *          依赖 @/components/ui/skeleton，
 *          依赖 @/components/shared/empty-state
 * [OUTPUT]: 对外提供 WorkspaceGrid 项目网格组件
 * [POS]: workspace 的内容网格区域，被 workspace-content.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'
import { FolderOpen } from 'lucide-react'

import { ProjectCard, type ProjectCardData } from './project-card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/empty-state'

/* ─── Skeleton ───────────────────────────────────────── */

function ProjectCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[246/160] w-full rounded-xl" />
      <div className="mt-2 space-y-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

/* ─── Component ──────────────────────────────────────── */

export function WorkspaceGrid({
  projects,
  isLoading,
}: {
  projects?: ProjectCardData[]
  isLoading: boolean
}) {
  const t = useTranslations('workspace')

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!projects?.length) {
    return (
      <EmptyState
        icon={FolderOpen}
        title={t('noProjects')}
        description={t('noProjectsDesc')}
      />
    )
  }

  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {projects.map((project) => (
        <ProjectCard key={project.id} data={project} />
      ))}
    </div>
  )
}
