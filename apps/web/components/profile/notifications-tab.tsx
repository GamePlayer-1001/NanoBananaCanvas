/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，
 *          依赖 @/hooks/use-notifications 的 useNotifications / useMarkAsRead，
 *          依赖 @/components/ui/button, 依赖 lucide-react 图标
 * [OUTPUT]: 对外提供 NotificationsTab 通知 Tab
 * [POS]: profile 的通知列表 Tab，被 profile-modal.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Bell, CheckCheck, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

import { useNotifications, useMarkAsRead, type Notification } from '@/hooks/use-notifications'
import { Button } from '@/components/ui/button'

/* ─── NotificationItem ───────────────────────────────── */

function NotificationItem({
  item,
  onMarkRead,
}: {
  item: Notification
  onMarkRead: (id: string) => void
}) {
  const isUnread = !item.is_read

  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${
        isUnread ? 'border-brand-200 bg-brand-50/30' : 'border-border'
      }`}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <p className={`text-sm ${isUnread ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
            {item.title}
          </p>
          {item.body && (
            <p className="mt-0.5 text-xs text-muted-foreground">{item.body}</p>
          )}
          <p className="mt-1 text-[10px] text-muted-foreground/60">{item.created_at}</p>
        </div>
        {isUnread && (
          <button
            onClick={() => onMarkRead(item.id)}
            className="mt-0.5 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Mark as read"
          >
            <CheckCheck size={12} />
          </button>
        )}
      </div>
    </div>
  )
}

/* ─── Component ──────────────────────────────────────── */

export function NotificationsTab() {
  const t = useTranslations('notifications')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useNotifications(page)
  const { mutate: markAsRead } = useMarkAsRead()

  const items = data?.items ?? []
  const pagination = data?.pagination
  const unreadCount = data?.unread ?? 0

  return (
    <div className="space-y-4">
      {/* 标题 + 全部已读 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          {t('title')}
          {unreadCount > 0 && (
            <span className="ml-2 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-medium text-white">
              {unreadCount}
            </span>
          )}
        </h3>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAsRead(undefined)}
            className="text-xs"
          >
            <CheckCheck size={14} className="mr-1" />
            {t('markAllAsRead')}
          </Button>
        )}
      </div>

      {/* 列表 */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10">
          <Bell size={24} className="mb-2 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <NotificationItem
              key={item.id}
              item={item}
              onMarkRead={(id) => markAsRead(id)}
            />
          ))}
        </div>
      )}

      {/* 分页 */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft size={14} />
          </Button>
          <span className="text-xs text-muted-foreground">
            {page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight size={14} />
          </Button>
        </div>
      )}
    </div>
  )
}
