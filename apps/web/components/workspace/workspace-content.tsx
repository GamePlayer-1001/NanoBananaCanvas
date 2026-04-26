/**
 * [INPUT]: 依赖 @/components/workspace/workspace-header，
 *          依赖 @/components/workspace/workspace-grid，
 *          依赖 @/hooks/use-workflows / @/hooks/use-folders，
 *          依赖 @/stores/use-workspace-store，依赖 next/navigation 的 useSearchParams
 * [OUTPUT]: 对外提供 WorkspaceContent 客户端交互容器
 * [POS]: workspace 的客户端组合组件，被 workspace/page.tsx 消费，负责搜索/排序/视图/多选批量管理
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { WorkspaceHeader } from './workspace-header'
import { WorkspaceGrid } from './workspace-grid'
import { NewProjectDialog } from './new-project-dialog'
import { useDeleteWorkflow, useWorkflows } from '@/hooks/use-workflows'
import { useFolders, useMoveWorkflowToFolder } from '@/hooks/use-folders'
import type { ProjectCardData } from './project-card'
import { useWorkspaceStore } from '@/stores/use-workspace-store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

/* ─── Component ──────────────────────────────────────── */

export function WorkspaceContent() {
  const t = useTranslations('workspace')
  const tc = useTranslations('common')
  const [showNewProject, setShowNewProject] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showBulkDelete, setShowBulkDelete] = useState(false)
  const [isBulkActionPending, setIsBulkActionPending] = useState(false)
  const searchParams = useSearchParams()
  const folderId = searchParams.get('folder')
  const { viewMode, sortBy, searchQuery } = useWorkspaceStore()
  const { data, isLoading } = useWorkflows(folderId ? { folder: folderId } : undefined)
  const { data: folders } = useFolders()
  const deleteWorkflow = useDeleteWorkflow()
  const moveWorkflowToFolder = useMoveWorkflowToFolder()

  /* 将 API 数据 (snake_case) 映射为 ProjectCard 格式 (camelCase) */
  interface WorkflowApiItem {
    id: string
    name: string
    thumbnail?: string
    created_at: string
    updated_at: string
    is_public?: number
    folder_id?: string | null
  }

  const response = data as { items?: WorkflowApiItem[] } | undefined
  const projects = useMemo<ProjectCardData[]>(() => (
    response?.items?.map((w) => ({
      id: w.id,
      name: w.name,
      thumbnailUrl: w.thumbnail,
      createdAt: w.created_at,
      updatedAt: w.updated_at,
      isPublic: !!w.is_public,
      folderId: w.folder_id ?? null,
    })) ?? []
  ), [response?.items])

  const filteredProjects = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    const nextProjects = normalizedQuery
      ? projects.filter((project) => project.name.toLowerCase().includes(normalizedQuery))
      : [...projects]

    nextProjects.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      }

      const aTime = new Date(sortBy === 'createdAt' ? a.createdAt : a.updatedAt).getTime()
      const bTime = new Date(sortBy === 'createdAt' ? b.createdAt : b.updatedAt).getTime()
      return bTime - aTime
    })

    return nextProjects
  }, [projects, searchQuery, sortBy])

  const selectableFolders = useMemo(
    () => ((folders as { id: string; name: string }[] | undefined) ?? []),
    [folders],
  )

  const allVisibleSelected =
    filteredProjects.length > 0 && filteredProjects.every((project) => selectedIds.includes(project.id))

  useEffect(() => {
    const validIds = new Set(projects.map((project) => project.id))
    setSelectedIds((prev) => prev.filter((id) => validIds.has(id)))
  }, [projects])

  useEffect(() => {
    if (selectedIds.length === 0) {
      setShowBulkDelete(false)
    }
  }, [selectedIds.length])

  const clearSelection = () => {
    setSelectedIds([])
    setSelectionMode(false)
  }

  const handleToggleSelectionMode = () => {
    if (selectionMode) {
      clearSelection()
      return
    }

    setSelectionMode(true)
  }

  const handleToggleProjectSelection = (projectId: string) => {
    setSelectedIds((prev) => (
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    ))
  }

  const handleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds([])
      return
    }

    setSelectedIds(filteredProjects.map((project) => project.id))
  }

  const handleMoveSelected = async (nextFolderId: string | null) => {
    if (!selectedIds.length) return

    setIsBulkActionPending(true)
    try {
      await Promise.all(
        selectedIds.map((workflowId) =>
          moveWorkflowToFolder.mutateAsync({ workflowId, folderId: nextFolderId }),
        ),
      )
      toast.success(
        nextFolderId ? t('batchMoved') : t('batchMovedToAll'),
      )
      clearSelection()
    } catch (error) {
      const message = error instanceof Error ? error.message : t('batchMoveFailed')
      toast.error(message)
    } finally {
      setIsBulkActionPending(false)
    }
  }

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return

    setIsBulkActionPending(true)
    try {
      await Promise.all(selectedIds.map((workflowId) => deleteWorkflow.mutateAsync(workflowId)))
      toast.success(t('batchDeleted', { count: selectedIds.length }))
      setShowBulkDelete(false)
      clearSelection()
    } catch (error) {
      const message = error instanceof Error ? error.message : t('batchDeleteFailed')
      toast.error(message)
    } finally {
      setIsBulkActionPending(false)
    }
  }

  return (
    <>
      <div className="px-6 py-5">
        <WorkspaceHeader
          onNewProject={() => setShowNewProject(true)}
          selectionMode={selectionMode}
          selectedCount={selectedIds.length}
          allVisibleSelected={allVisibleSelected}
          folders={selectableFolders}
          isBulkActionPending={isBulkActionPending}
          onToggleSelectionMode={handleToggleSelectionMode}
          onSelectAllVisible={handleSelectAllVisible}
          onClearSelection={clearSelection}
          onMoveSelected={handleMoveSelected}
          onDeleteSelected={() => setShowBulkDelete(true)}
        />

        <div className="mt-6">
          <WorkspaceGrid
            projects={filteredProjects}
            isLoading={isLoading}
            viewMode={viewMode}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onToggleProjectSelection={handleToggleProjectSelection}
          />
        </div>

        <NewProjectDialog
          open={showNewProject}
          onClose={() => setShowNewProject(false)}
        />
      </div>

      <Dialog open={showBulkDelete} onOpenChange={setShowBulkDelete}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>{t('deleteSelectedTitle')}</DialogTitle>
            <DialogDescription>
              {t('deleteSelectedDescription', { count: selectedIds.length })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDelete(false)}>
              {tc('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSelected}
              disabled={isBulkActionPending || selectedIds.length === 0}
            >
              {tc('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
