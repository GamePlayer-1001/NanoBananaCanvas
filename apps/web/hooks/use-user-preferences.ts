/**
 * [INPUT]: 依赖 react 的 useEffect/useState
 * [OUTPUT]: 对外提供 useUserPreferences 偏好设置 hook，与新手提示相关本地存储工具
 * [POS]: hooks 的本地用户偏好层，被账户设置页、画布提示与节点引导消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useEffect, useState } from 'react'

export const USER_PREFERENCES_STORAGE_KEY = 'nano-banana.user-preferences'
export const CANVAS_SHORTCUT_HINT_STORAGE_KEY = 'nano-banana.canvas-shortcut-hint-views'
export const CANVAS_SHORTCUT_HINT_MARKER_KEY = 'nano-banana.canvas-shortcut-hint-last-open'
export const USER_KEY_ONBOARDING_STORAGE_KEY = 'nano-banana.user-key-onboarding.clicks'

export interface UserPreferences {
  showOnboardingTips: boolean
}

const DEFAULT_PREFERENCES: UserPreferences = {
  showOnboardingTips: true,
}

function normalizePreferences(value: unknown): UserPreferences {
  if (!value || typeof value !== 'object') {
    return DEFAULT_PREFERENCES
  }

  const next = value as Partial<UserPreferences>
  return {
    showOnboardingTips:
      typeof next.showOnboardingTips === 'boolean'
        ? next.showOnboardingTips
        : DEFAULT_PREFERENCES.showOnboardingTips,
  }
}

export function readUserPreferencesSnapshot(): UserPreferences {
  try {
    const rawValue = window.localStorage.getItem(USER_PREFERENCES_STORAGE_KEY)
    if (!rawValue) return DEFAULT_PREFERENCES
    return normalizePreferences(JSON.parse(rawValue))
  } catch {
    return DEFAULT_PREFERENCES
  }
}

function writeUserPreferences(preferences: UserPreferences) {
  try {
    window.localStorage.setItem(
      USER_PREFERENCES_STORAGE_KEY,
      JSON.stringify(preferences),
    )
  } catch {
    // 忽略浏览器存储异常，降级为会话内设置。
  }
}

export function resetOnboardingProgress() {
  try {
    window.localStorage.removeItem(CANVAS_SHORTCUT_HINT_STORAGE_KEY)
    window.localStorage.removeItem(USER_KEY_ONBOARDING_STORAGE_KEY)
    window.sessionStorage.removeItem(CANVAS_SHORTCUT_HINT_MARKER_KEY)
  } catch {
    // 忽略浏览器存储异常。
  }
}

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES)
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setPreferences(readUserPreferencesSnapshot())
      setHasLoaded(true)
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [])

  const updatePreferences = (patch: Partial<UserPreferences>) => {
    setPreferences((current) => {
      const next = { ...current, ...patch }
      writeUserPreferences(next)
      return next
    })
  }

  return {
    preferences,
    hasLoaded,
    setShowOnboardingTips: (enabled: boolean) =>
      updatePreferences({ showOnboardingTips: enabled }),
    resetOnboardingProgress,
  }
}
