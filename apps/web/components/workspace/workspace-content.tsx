/**
 * [INPUT]: 依赖 @/components/workspace/workspace-header，
 *          依赖 @/components/workspace/workspace-grid，
 *          依赖 @/hooks/use-workflows，依赖 next/navigation 的 useSearchParams
 * [OUTPUT]: 对外提供 WorkspaceContent 客户端交互容器
 * [POS]: workspace 的客户端组合组件，被 workspace/page.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

import { WorkspaceHeader } from './workspace-header'
import { WorkspaceGrid } from './workspace-grid'
import { NewProjectDialog } from './new-project-dialog'
import { useWorkflows } from '@/hooks/use-workflows'
import type { ProjectCardData } from './project-card'

/* ─── Component ──────────────────────────────────────── */

export function WorkspaceContent() {
  const [showNewProject, setShowNewProject] = useState(false)
  const searchParams = useSearchParams()
  const folderId = searchParams.get('folder')
  const { data, isLoading } = useWorkflows(folderId ? { folder: folderId } : undefined)

  /* 将 API 数据 (snake_case) 映射为 ProjectCard 格式 (camelCase) */
  interface WorkflowApiItem {
    id: string
    name: string
    thumbnail?: string
    updated_at: string
    is_public?: number
    folder_id?: string | null
  }
  const response = data as { items?: WorkflowApiItem[] } | undefined
  const projects: ProjectCardData[] | undefined = response?.items?.map((w) => ({
    id: w.id,
    name: w.name,
    thumbnailUrl: w.thumbnail,
    updatedAt: w.updated_at,
    isPublic: !!w.is_public,
    folderId: w.folder_id ?? null,
  }))

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-5">
      <WorkspaceHeader onNewProject={() => setShowNewProject(true)} />

      <div className="mt-6">
        <WorkspaceGrid projects={projects} isLoading={isLoading} />
      </div>

      <NewProjectDialog
        open={showNewProject}
        onClose={() => setShowNewProject(false)}
      />
    </div>
  )
}
