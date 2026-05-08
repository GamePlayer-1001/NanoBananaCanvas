/**
 * [INPUT]: 依赖 next-intl 的 NextIntlClientProvider / hasLocale，
 *          依赖 next-intl/server 的 getMessages / setRequestLocale，
 *          依赖 @/i18n/routing 的 routing 配置，依赖 @/i18n/config 的 locale 元数据，
 *          依赖 @/components/ui/sonner 的 Toaster，
 *          依赖 @/components/ui/tooltip 的 TooltipProvider，
 *          依赖 @/lib/query/provider 的 QueryProvider
 * [OUTPUT]: 对外提供带 locale 参数的语言布局 (i18n/Query Provider + locale side effects)
 * [POS]: [locale] 动态路由布局，包裹所有语言相关页面，是 next-intl 与 Query 的枢纽；Clerk 下沉到受保护路由组；文档骨架由 app/layout.tsx 提供
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NextIntlClientProvider, hasLocale } from 'next-intl'
import Script from 'next/script'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryProvider } from '@/lib/query/provider'
import { routing } from '@/i18n/routing'

/* ─── Static Params ─────────────────────────────────────── */

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

/* ─── Layout ────────────────────────────────────────────── */

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  setRequestLocale(locale)
  const messages = await getMessages()

  const appTree = (
    <TooltipProvider>
      <NextIntlClientProvider messages={messages}>
        <QueryProvider>{children}</QueryProvider>
      </NextIntlClientProvider>
    </TooltipProvider>
  )

  return (
    <>
      <Script id="scrollbar-visibility" strategy="afterInteractive">
        {`
          (() => {
            if (typeof window === 'undefined') return;
            const mediaQuery = window.matchMedia('(pointer: fine)');
            if (!mediaQuery.matches) return;

            const root = document.documentElement;
            root.lang = ${JSON.stringify(locale)};
            let hideTimer = 0;

            const setVisible = (visible) => {
              if (visible) {
                root.setAttribute('data-scrollbars-visible', 'true');
              } else {
                root.removeAttribute('data-scrollbars-visible');
              }
            };

            const scheduleHide = (delay = 900) => {
              window.clearTimeout(hideTimer);
              hideTimer = window.setTimeout(() => setVisible(false), delay);
            };

            const showForAWhile = (delay = 900) => {
              setVisible(true);
              scheduleHide(delay);
            };

            const syncPointer = (event) => {
              const nearRightEdge = window.innerWidth - event.clientX <= 28;
              const nearBottomEdge = window.innerHeight - event.clientY <= 28;

              if (nearRightEdge || nearBottomEdge) {
                showForAWhile(1200);
                return;
              }

              scheduleHide(180);
            };

            const handlePointerLeave = () => {
              scheduleHide(120);
            };

            const handleKeyboardScroll = (event) => {
              if (
                ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', 'Space'].includes(
                  event.code,
                )
              ) {
                showForAWhile(1100);
              }
            };

            document.addEventListener('pointermove', syncPointer, { passive: true });
            document.addEventListener('wheel', () => showForAWhile(1100), { passive: true });
            document.addEventListener('scroll', () => showForAWhile(950), {
              passive: true,
              capture: true,
            });
            window.addEventListener('keydown', handleKeyboardScroll, { passive: true });
            document.addEventListener('mouseleave', handlePointerLeave);
          })();
        `}
      </Script>
      {appTree}
      <Toaster position="bottom-right" richColors />
    </>
  )
}
