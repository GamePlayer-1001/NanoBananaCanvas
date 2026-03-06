/**
 * [INPUT]: 依赖 @/components/ui/dialog, @/components/ui/button,
 *          依赖 @/hooks/use-workflows 的 useDeleteWorkflow,
 *          依赖 next-intl 的 useTranslations, 依赖 sonner 的 toast
 * [OUTPUT]: 对外提供 DeleteDialog 删除确认弹窗组件
 * [POS]: workspace 的删除交互，被 project-card.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { useDeleteWorkflow } from '@/hooks/use-workflows'
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

interface DeleteDialogProps {
  workflowId: string
  workflowName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteDialog({ workflowId, workflowName, open, onOpenChange }: DeleteDialogProps) {
  const t = useTranslations('workspace')
  const tc = useTranslations('common')
  const { mutate, isPending } = useDeleteWorkflow()

  const handleDelete = () => {
    mutate(workflowId, {
      onSuccess: () => {
        toast.success(t('deleted'))
        onOpenChange(false)
      },
      onError: () => toast.error(t('deleteFailed')),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{t('deleteProject')}</DialogTitle>
          <DialogDescription>
            {t('deleteWarning', { name: workflowName })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tc('cancel')}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {tc('delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
