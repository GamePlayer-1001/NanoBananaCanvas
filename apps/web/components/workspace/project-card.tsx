/**
 * [INPUT]: 依赖 @/i18n/navigation 的 useRouter，依赖 lucide-react 图标，
 *          依赖 @/components/ui/dropdown-menu，依赖 @/hooks/use-workflows 的 useUnpublishWorkflow，
 *          依赖 @/hooks/use-folders 的 useFolders / useMoveWorkflowToFolder，
 *          依赖 ./rename-dialog, ./delete-dialog, ./publish-dialog 弹窗组件，
 *          依赖 sonner 的 toast
 * [OUTPUT]: 对外提供 ProjectCard 项目卡片组件 (含三点菜单: 重命名/删除/发布/取消发布/移动文件夹)
 * [POS]: workspace 的项目卡片，被 workspace-grid.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

/* eslint-disable @next/next/no-img-element -- 项目缩略图是用户生成内容，来源域名在运行时决定。 */

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Clock, Folder, FolderX, Globe, GlobeLock, Image as ImageIcon, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
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
  updatedAt: string
  isPublic?: boolean
  folderId?: string | null
}

/* ─── Component ──────────────────────────────────────── */

export function ProjectCard({ data }: { data: ProjectCardData }) {
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
    router.push(`/canvas/${data.id}`)
  }

  const handleUnpublish = () => {
    unpublish(undefined, {
      onSuccess: () => toast.success(t('unpublished')),
      onError: () => toast.error(t('unpublishFailed')),
    })
  }

  return (
    <>
      <div className="group">
        {/* 缩略图 (可点击导航) */}
        <div
          className="relative aspect-[246/160] cursor-pointer overflow-hidden rounded-xl border border-border bg-muted transition-shadow group-hover:shadow-md"
          onClick={handleNavigate}
        >
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

          {/* 已发布角标 */}
          {data.isPublic && (
            <span className="absolute top-2 left-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-medium text-white">
              {t('published')}
            </span>
          )}

          {/* 三点菜单 (hover 显示) */}
          <div className="absolute top-1.5 right-1.5 opacity-0 transition-opacity group-hover:opacity-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon-sm"
                  className="h-7 w-7 rounded-lg shadow-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                  <Pencil size={14} className="mr-2" />
                  {t('rename')}
                </DropdownMenuItem>

                {/* 移动到文件夹 */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Folder size={14} className="mr-2" />
                    {ts('moveToFolder')}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-36">
                    {/* 无文件夹 (移出当前文件夹) */}
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

        {/* 名称 + 时间 */}
        <div className="mt-2 cursor-pointer" onClick={handleNavigate}>
          <h3 className="truncate text-sm font-medium text-foreground">
            {data.name}
          </h3>
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
