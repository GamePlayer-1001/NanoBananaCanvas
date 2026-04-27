/**
 * [INPUT]: 依赖 react 的状态与回调能力，依赖 next-intl 的 useTranslations，
 *          依赖 @/hooks/use-model-configs 的账号配置读取，依赖 @/hooks/use-auto-save 的显式保存，
 *          依赖 @/i18n/navigation 的 useRouter，依赖 @/components/ui/dialog 与 sonner
 * [OUTPUT]: 对外提供 useUserKeyOnboarding 节点级自有 API Key 引导 hook
 * [POS]: hooks 的节点引导层，被生成类节点消费，负责前三次缺少自有配置时的提示、保存与跳转
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { triggerCloudSave } from '@/hooks/use-auto-save'
import { useModelConfigs } from '@/hooks/use-model-configs'
import { useRouter } from '@/i18n/navigation'
import type { CapabilityId } from '@/lib/model-config-catalog'

const USER_KEY_ONBOARDING_STORAGE_KEY = 'nano-banana.user-key-onboarding.clicks'
const MAX_USER_KEY_ONBOARDING_CLICKS = 3

type SupportedCapability = Extract<CapabilityId, 'text' | 'image' | 'video' | 'audio'>

function readOnboardingClicks(): number {
  try {
    const rawValue = window.localStorage.getItem(USER_KEY_ONBOARDING_STORAGE_KEY)
    const parsed = Number.parseInt(rawValue ?? '0', 10)
    return Number.isNaN(parsed) ? 0 : parsed
  } catch {
    return 0
  }
}

function writeOnboardingClicks(nextValue: number) {
  try {
    window.localStorage.setItem(USER_KEY_ONBOARDING_STORAGE_KEY, String(nextValue))
  } catch {
    // 忽略浏览器存储异常，降级为单次提示。
  }
}

export function useUserKeyOnboarding(workflowId?: string) {
  const params = useParams<{ id?: string }>()
  const router = useRouter()
  const tCommon = useTranslations('common')
  const tNodes = useTranslations('nodes')
  const tProfile = useTranslations('profile')
  const { getConfigsByCapability } = useModelConfigs()
  const [open, setOpen] = useState(false)
  const [pendingCapability, setPendingCapability] = useState<SupportedCapability | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const resolvedWorkflowId = workflowId ?? params?.id

  const capabilityLabelMap = useMemo(
    () => ({
      text: tProfile('capability_text'),
      image: tProfile('capability_image'),
      video: tProfile('capability_video'),
      audio: tProfile('capability_audio'),
    }),
    [tProfile],
  )

  const handleUserKeyIntent = useCallback(
    (capability: SupportedCapability, onEnable: () => void) => {
      const savedConfigs = getConfigsByCapability(capability)
      if (savedConfigs.length > 0) {
        onEnable()
        return
      }

      const currentClicks = readOnboardingClicks()
      if (currentClicks >= MAX_USER_KEY_ONBOARDING_CLICKS) {
        onEnable()
        return
      }

      writeOnboardingClicks(currentClicks + 1)
      setPendingCapability(capability)
      setOpen(true)
    },
    [getConfigsByCapability],
  )

  const handleClose = useCallback(() => {
    if (isSubmitting) return
    setOpen(false)
    setPendingCapability(null)
  }, [isSubmitting])

  const handleConfirm = useCallback(async () => {
    try {
      setIsSubmitting(true)
      if (resolvedWorkflowId) {
        await triggerCloudSave(resolvedWorkflowId)
      }
      setOpen(false)
      setPendingCapability(null)
      router.push('/account?tab=modelPreferences')
    } catch {
      toast.error(tNodes('userKeyOnboardingSaveFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }, [resolvedWorkflowId, router, tNodes])

  const capabilityLabel = pendingCapability ? capabilityLabelMap[pendingCapability] : ''

  const dialog = (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleClose()
        }
      }}
    >
      <DialogContent showCloseButton={!isSubmitting}>
        <DialogHeader>
          <DialogTitle>{tNodes('userKeyOnboardingTitle')}</DialogTitle>
          <DialogDescription>
            {tNodes('userKeyOnboardingDescription', {
              capability: capabilityLabel,
              settings: tProfile('modelPreferences'),
            })}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            {tCommon('cancel')}
          </Button>
          <Button onClick={() => void handleConfirm()} disabled={isSubmitting}>
            {isSubmitting
              ? tNodes('userKeyOnboardingSaving')
              : tNodes('userKeyOnboardingConfirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  return {
    dialog,
    handleUserKeyIntent,
  }
}
