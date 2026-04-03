/**
 * [INPUT]: 依赖 @/components/ui/dialog, @/components/ui/input, @/components/ui/button,
 *          依赖 @/hooks/use-workflows 的 useUpdateWorkflow,
 *          依赖 next-intl 的 useTranslations, 依赖 sonner 的 toast
 * [OUTPUT]: 对外提供 RenameDialog 重命名弹窗组件
 * [POS]: workspace 的重命名交互，被 project-card.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { useUpdateWorkflow } from '@/hooks/use-workflows'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

/* ─── Component ──────────────────────────────────────── */

interface RenameDialogProps {
  workflowId: string
  currentName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RenameDialog({ workflowId, currentName, open, onOpenChange }: RenameDialogProps) {
  const t = useTranslations('workspace')
  const tc = useTranslations('common')
  const [name, setName] = useState(currentName)
  const { mutate, isPending } = useUpdateWorkflow(workflowId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || trimmed === currentName) {
      onOpenChange(false)
      return
    }

    mutate(
      { name: trimmed },
      {
        onSuccess: () => {
          toast.success(t('renamed'))
          onOpenChange(false)
        },
        onError: () => toast.error(t('renameFailed')),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('renameProject')}</DialogTitle>
            <DialogDescription>{t('renameProjectDescription')}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('projectName')}
              maxLength={100}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tc('cancel')}
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {tc('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
