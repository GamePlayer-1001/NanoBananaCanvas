/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @/i18n/navigation 的 Link / usePathname，
 *          依赖 lucide-react 图标，依赖 @clerk/nextjs 的 UserButton，
 *          依赖 @/components/profile/profile-modal
 * [OUTPUT]: 对外提供 AppSidebar 核心侧边栏组件 (含 ProfileModal)
 * [POS]: layout 的核心导航组件，被 (app)/layout.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { UserButton } from '@clerk/nextjs'
import {
  LayoutGrid,
  CircleDot,
  Workflow,
  Video,
  Plus,
  ChevronRight,
  Play,
  UserPlus,
  MessageCircle,
} from 'lucide-react'

import { Link, usePathname } from '@/i18n/navigation'
import { ProfileModal } from '@/components/profile/profile-modal'

/* ─── Types ──────────────────────────────────────────── */

interface NavItem {
  href: string
  icon: React.ElementType
  labelKey: string
  badge?: string
}

/* ─── Nav Config ─────────────────────────────────────── */

const NAV_ITEMS: NavItem[] = [
  { href: '/explore', icon: LayoutGrid, labelKey: 'explore' },
  { href: '/elements', icon: CircleDot, labelKey: 'elements' },
  { href: '/workflows', icon: Workflow, labelKey: 'workflows' },
  { href: '/video-analysis', icon: Video, labelKey: 'videoAnalysis', badge: 'alpha' },
]

const WORKSPACE_ITEMS: NavItem[] = [
  { href: '/workspace', icon: LayoutGrid, labelKey: 'all' },
]

/* ─── Discord Icon ───────────────────────────────────── */

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
    </svg>
  )
}

/* ─── SidebarNavItem ─────────────────────────────────── */

function SidebarNavItem({
  href,
  icon: Icon,
  label,
  badge,
  active,
}: {
  href: string
  icon: React.ElementType
  label: string
  badge?: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
        active
          ? 'bg-brand-50 text-brand-600 font-medium'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <Icon size={16} />
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="rounded border border-brand-200 bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium uppercase text-brand-600">
          {badge}
        </span>
      )}
    </Link>
  )
}

/* ─── Component ──────────────────────────────────────── */

export function AppSidebar() {
  const t = useTranslations('sidebar')
  const pathname = usePathname()
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <>
    <aside className="flex h-screen w-[200px] flex-col border-r border-border bg-background">
      {/* ── Header ────────────────────────────────────── */}
      <div className="px-4 pt-5 pb-2">
        <Link href="/explore" className="block">
          <h1 className="font-serif text-lg italic tracking-wide text-foreground">
            Nano Banana Canvas
          </h1>
        </Link>
        <p className="mt-0.5 text-xs text-muted-foreground">{t('personal')}</p>
      </div>

      {/* ── Main Nav ──────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-2 pt-2">
        {/* 导航项 */}
        <div className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <SidebarNavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={t(item.labelKey)}
              badge={item.badge ? t(item.badge) : undefined}
              active={pathname.startsWith(item.href)}
            />
          ))}
        </div>

        {/* 工作区 */}
        <div className="mt-6">
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-xs font-medium text-muted-foreground">
              {t('workspace')}
            </span>
            <button className="text-muted-foreground transition-colors hover:text-foreground">
              <Plus size={14} />
            </button>
          </div>

          <div className="mt-1 space-y-0.5">
            {WORKSPACE_ITEMS.map((item) => (
              <SidebarNavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={t(item.labelKey)}
                active={pathname === item.href}
              />
            ))}
          </div>

          {/* 空文件夹提示 */}
          <p className="mt-2 px-3 text-xs text-muted-foreground/60">
            {t('noFolders')}
          </p>
        </div>
      </nav>

      {/* ── Bottom Links ──────────────────────────────── */}
      <div className="border-t border-border px-2 py-3 space-y-0.5">
        {/* 交流群 */}
        <button className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <span>{t('community')}</span>
          <ChevronRight size={14} />
        </button>

        {/* 观看教程 */}
        <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <Play size={14} />
          <span>{t('watchTutorial')}</span>
        </button>

        {/* 邀请 */}
        <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <UserPlus size={14} />
          <span>{t('invite')}</span>
        </button>

        {/* Discord */}
        <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <DiscordIcon className="h-3.5 w-3.5" />
          <span>{t('joinDiscord')}</span>
        </button>
      </div>

      {/* ── Footer ────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-t border-border px-4 py-3">
        <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {t('freePlan')}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <MessageCircle size={12} />
          100
        </span>
        <button
          onClick={() => setProfileOpen(true)}
          className="ml-auto"
        >
          <UserButton
            appearance={{
              elements: {
                avatarBox: { width: '28px', height: '28px' },
              },
            }}
          />
        </button>
      </div>
    </aside>

    <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  )
}
