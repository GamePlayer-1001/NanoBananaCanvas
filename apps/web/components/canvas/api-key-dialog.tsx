/**
 * [INPUT]: 依赖 shadcn/ui 的 Dialog/Input/Button/Label，依赖 @/stores/use-settings-store，依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 ApiKeyDialog 组件 (OpenRouter API Key 配置对话框)
 * [POS]: components/canvas 的辅助对话框，被画布工具栏或 LLMNode 触发
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react'
import { useSettingsStore } from '@/stores/use-settings-store'
import { getProvider } from '@/services/ai'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

/* ─── Component ──────────────────────────────────────── */

export function ApiKeyDialog() {
  const t = useTranslations('apiKey')
  const storedKey = useSettingsStore((s) => s.apiKey)
  const setApiKey = useSettingsStore((s) => s.setApiKey)

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle')

  /* 打开对话框时将已保存的 key 加载到 draft */
  const onOpenChange = useCallback(
    (next: boolean) => {
      if (next) {
        setDraft(storedKey)
        setTestResult('idle')
        setShowKey(false)
      }
      setOpen(next)
    },
    [storedKey],
  )

  /* 保存 */
  const onSave = useCallback(() => {
    setApiKey(draft.trim())
    setOpen(false)
  }, [draft, setApiKey])

  /* 测试连通性 */
  const onTest = useCallback(async () => {
    const key = draft.trim()
    if (!key) return

    setTesting(true)
    setTestResult('idle')
    try {
      const ok = await getProvider('openrouter').validateKey(key)
      setTestResult(ok ? 'success' : 'error')
    } catch {
      setTestResult('error')
    } finally {
      setTesting(false)
    }
  }, [draft])

  /* ── Status badge ─────────────────────────────────── */
  const hasKey = storedKey.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <KeyRound size={14} />
          <span className="hidden sm:inline">{hasKey ? t('apiKeySet') : t('setApiKey')}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('dialogTitle')}</DialogTitle>
          <DialogDescription>
            {t('dialogDescription')}
          </DialogDescription>
        </DialogHeader>

        {/* ── Key input ──────────────────────────────── */}
        <div className="space-y-2">
          <Label htmlFor="api-key">{t('label')}</Label>
          <div className="relative">
            <Input
              id="api-key"
              type={showKey ? 'text' : 'password'}
              placeholder={t('placeholder')}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value)
                setTestResult('idle')
              }}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
            >
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {/* 测试结果 */}
          {testResult === 'success' && (
            <p className="text-xs text-green-600 dark:text-green-400">
              {t('keyValid')}
            </p>
          )}
          {testResult === 'error' && (
            <p className="text-destructive text-xs">
              {t('keyInvalid')}
            </p>
          )}
        </div>

        {/* ── Actions ────────────────────────────────── */}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onTest} disabled={testing || !draft.trim()}>
            {testing && <Loader2 size={14} className="mr-1.5 animate-spin" />}
            {t('test')}
          </Button>
          <Button onClick={onSave} disabled={!draft.trim()}>
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
