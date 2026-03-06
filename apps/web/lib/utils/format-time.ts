/**
 * [INPUT]: 无外部依赖 (使用 Intl.RelativeTimeFormat)
 * [OUTPUT]: 对外提供 formatRelativeTime
 * [POS]: lib/utils 的时间格式化工具，被 video-card/project-card 等列表项消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: 'second' },
  { amount: 60, unit: 'minute' },
  { amount: 24, unit: 'hour' },
  { amount: 7, unit: 'day' },
  { amount: 4.34524, unit: 'week' },
  { amount: 12, unit: 'month' },
  { amount: Number.POSITIVE_INFINITY, unit: 'year' },
]

export function formatRelativeTime(
  dateStr: string,
  locale: string = 'en',
): string {
  const date = new Date(dateStr)
  const now = new Date()
  let duration = (date.getTime() - now.getTime()) / 1000

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return rtf.format(Math.round(duration), division.unit)
    }
    duration /= division.amount
  }

  return rtf.format(Math.round(duration), 'year')
}
