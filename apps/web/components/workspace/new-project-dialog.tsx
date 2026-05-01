/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，
 *          依赖 @/i18n/navigation 的 useRouter，
 *          依赖 @/hooks/use-workflows 的 useCreateWorkflow，
 *          依赖 @/lib/agent/template-catalog 的系统模板目录
 * [OUTPUT]: 对外提供 NewProjectDialog 创建项目弹窗
 * [POS]: workspace 的创建入口，被 workspace-content.tsx 消费，创建后跳转全屏画布
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { X } from 'lucide-react'

import { useRouter } from '@/i18n/navigation'
import { useCreateWorkflow } from '@/hooks/use-workflows'
import { listWorkflowTemplates } from '@/lib/agent/template-catalog'

/* ─── Component ──────────────────────────────────────── */

export function NewProjectDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const t = useTranslations('workspace')
  const tc = useTranslations('common')
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const createWorkflow = useCreateWorkflow()
  const templates = listWorkflowTemplates()

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    createWorkflow.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        template: templates.find((item) => item.id === selectedTemplateId),
      },
      {
        onSuccess: (data) => {
          setName('')
          setDescription('')
          setSelectedTemplateId('')
          onClose()
          router.push(`/canvas/${data.id}`)
        },
      },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-xl">
        {/* 头部 */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {t('createProject')}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">
              {t('projectName')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('untitledProject')}
              className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-brand-500 focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">
              {t('projectDescription')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1.5 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">
              {t('templateLabel')}
            </label>
            <div className="mt-2 grid gap-2">
              <button
                type="button"
                onClick={() => setSelectedTemplateId('')}
                className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                  selectedTemplateId === ''
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-border hover:border-brand-300'
                }`}
              >
                <p className="text-sm font-medium text-foreground">{t('templateEmptyTitle')}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{t('templateEmptyBody')}</p>
              </button>
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(template.id)}
                  className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                    selectedTemplateId === template.id
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-border hover:border-brand-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">{template.name}</p>
                    <span className="text-[11px] text-muted-foreground">{template.category}</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{template.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
            >
              {tc('cancel')}
            </button>
            <button
              type="submit"
              disabled={!name.trim() || createWorkflow.isPending}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
            >
              {t('createProject')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
