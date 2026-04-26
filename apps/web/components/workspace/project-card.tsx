/**
 * [INPUT]: 依赖 @/i18n/navigation 的 useRouter，依赖 lucide-react 图标，
 *          依赖 @/components/ui/dropdown-menu，依赖 @/hooks/use-workflows 的 useUnpublishWorkflow，
 *          依赖 @/hooks/use-folders 的 useFolders / useMoveWorkflowToFolder，
 *          依赖 ./rename-dialog, ./delete-dialog, ./publish-dialog 弹窗组件，
 *          依赖 sonner 的 toast
 * [OUTPUT]: 对外提供 ProjectCard 项目卡片组件 (含三点菜单: 重命名/删除/发布/取消发布/移动文件夹)
 * [POS]: workspace 的项目卡片，被 workspace-grid.tsx 消费，支持网格/列表展示和多选管理
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

/* eslint-disable @next/next/no-img-element -- 项目缩略图是用户生成内容，来源域名在运行时决定。 */

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CheckSquare2, Clock, Folder, FolderX, Globe, GlobeLock, Image as ImageIcon, MoreHorizontal, Pencil, Square, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from '@/i18n/navigation'
import { useUnpublishWorkflow } from '@/hooks/use-workflows'
import { useFolders, useMoveWorkflowToFolder } from '@/hooks/use-folders'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { RenameDialog } from './rename-dialog'
import { DeleteDialog } from './delete-dialog'
import { PublishDialog } from './publish-dialog'

/* ─── Types ──────────────────────────────────────────── */

export interface ProjectCardData {
  id: string
  name: string
  thumbnailUrl?: string
  createdAt: string
  updatedAt: string
  isPublic?: boolean
  folderId?: string | null
}

/* ─── Component ──────────────────────────────────────── */

export function ProjectCard({
  data,
  viewMode,
  selectionMode,
  selected,
  onToggleSelection,
}: {
  data: ProjectCardData
  viewMode: 'grid' | 'list'
  selectionMode: boolean
  selected: boolean
  onToggleSelection: (projectId: string) => void
}) {
  const t = useTranslations('workspace')
  const ts = useTranslations('sidebar')
  const router = useRouter()
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const { mutate: unpublish } = useUnpublishWorkflow(data.id)
  const { data: folders } = useFolders()
  const moveToFolder = useMoveWorkflowToFolder()

  const handleNavigate = () => {
    if (selectionMode) {
      onToggleSelection(data.id)
      return
    }

    router.push(`/canvas/${data.id}`)
  }

  const selectionIcon = selected ? (
    <CheckSquare2 size={16} className="text-brand-600" />
  ) : (
    <Square size={16} className="text-muted-foreground" />
  )

  const selectionButton = selectionMode ? (
    <button
      type="button"
      onClick={() => onToggleSelection(data.id)}
      className="flex items-center gap-2 rounded-lg border border-border bg-background/90 px-2 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm"
    >
      {selectionIcon}
      <span>{t('selectAction')}</span>
    </button>
  ) : null

  const cardSurfaceClassName = selected
    ? 'border-brand-300 ring-brand-100 shadow-sm ring-2'
    : 'border-border'

  const handleUnpublish = () => {
    unpublish(undefined, {
      onSuccess: () => toast.success(t('unpublished')),
      onError: () => toast.error(t('unpublishFailed')),
    })
  }

  return (
    <>
      <div
        className={`group rounded-2xl border bg-card transition-shadow hover:shadow-md ${cardSurfaceClassName} ${
          viewMode === 'list' ? 'flex items-center gap-4 p-3' : 'p-2'
        }`}
      >
        <div className={`relative ${viewMode === 'list' ? 'w-52 shrink-0' : ''}`}>
          <button
            type="button"
            className="relative block w-full overflow-hidden rounded-xl"
            onClick={handleNavigate}
          >
            <div className="aspect-[246/160] overflow-hidden rounded-xl border border-border bg-muted">
              {data.thumbnailUrl ? (
                <img
                  src={data.thumbnailUrl}
                  alt={data.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ImageIcon size={28} className="text-muted-foreground/30" />
                </div>
              )}
            </div>
          </button>

          {data.isPublic && (
            <span className="absolute top-2 left-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-medium text-white">
              {t('published')}
            </span>
          )}

          {selectionMode && (
            <div className="absolute bottom-2 left-2">
              {selectionButton}
            </div>
          )}

          <div className="absolute top-2 right-2 z-10 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon-sm"
                  className="h-8 w-8 rounded-lg shadow-sm"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                  <Pencil size={14} className="mr-2" />
                  {t('rename')}
                </DropdownMenuItem>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Folder size={14} className="mr-2" />
                    {ts('moveToFolder')}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-36">
                    {data.folderId && (
                      <DropdownMenuItem
                        onClick={() => moveToFolder.mutate({ workflowId: data.id, folderId: null })}
                      >
                        <FolderX size={14} className="mr-2" />
                        {ts('noFolder')}
                      </DropdownMenuItem>
                    )}
                    {(folders as { id: string; name: string }[] | undefined)
                      ?.filter((f) => f.id !== data.folderId)
                      .map((f) => (
                        <DropdownMenuItem
                          key={f.id}
                          onClick={() => moveToFolder.mutate({ workflowId: data.id, folderId: f.id })}
                        >
                          <Folder size={14} className="mr-2" />
                          <span className="truncate">{f.name}</span>
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                {data.isPublic ? (
                  <DropdownMenuItem onClick={handleUnpublish}>
                    <GlobeLock size={14} className="mr-2" />
                    {t('unpublish')}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => setPublishOpen(true)}>
                    <Globe size={14} className="mr-2" />
                    {t('publish')}
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => setDeleteOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 size={14} className="mr-2" />
                  {t('deleteProject')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className={`${viewMode === 'list' ? 'min-w-0 flex-1' : 'mt-2'}`}>
          <button
            type="button"
            onClick={handleNavigate}
            className="block w-full text-left"
          >
            <h3 className="truncate text-sm font-medium text-foreground">
              {data.name}
            </h3>
          </button>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock size={11} />
            {data.updatedAt}
          </p>
        </div>
      </div>

      {/* ── Dialogs ───────────────────────────────────── */}
      <RenameDialog
        workflowId={data.id}
        currentName={data.name}
        open={renameOpen}
        onOpenChange={setRenameOpen}
      />
      <DeleteDialog
        workflowId={data.id}
        workflowName={data.name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
      <PublishDialog
        workflowId={data.id}
        open={publishOpen}
        onOpenChange={setPublishOpen}
      />
    </>
  )
}
