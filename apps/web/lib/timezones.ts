/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供时区白名单、校验器与常用时区选项
 * [POS]: lib 的时区真相源，被签到账本、用户设置与账户镜像复用，统一约束可接受的 IANA timezone
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export const TIMEZONE_OPTIONS = [
  'UTC',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Asia/Seoul',
  'Australia/Sydney',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Vancouver',
] as const

export const DEFAULT_SIGNIN_TIMEZONE = 'UTC'

export function isValidTimeZone(timeZone: string | null | undefined): timeZone is string {
  if (!timeZone) {
    return false
  }

  try {
    Intl.DateTimeFormat('en-US', { timeZone }).format(new Date())
    return true
  } catch {
    return false
  }
}

export function normalizeTimeZone(timeZone: string | null | undefined) {
  if (!isValidTimeZone(timeZone)) {
    return null
  }

  return timeZone
}
