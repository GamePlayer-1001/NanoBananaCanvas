/**
 * [INPUT]: 依赖 react 的 useEffect/useState/useRef，依赖 next-intl 的 useTranslations，
 *          依赖 lucide-react 的 Heart/Play/Eye，依赖 @/i18n/navigation 的 Link
 * [OUTPUT]: 对外提供 ShowcaseContent 暗色调瀑布流展示组件（静态缓存 + 原生懒加载，无需认证）
 * [POS]: landing 的公开探索展示页，被 (landing)/showcase/page.tsx 消费；不含侧边栏，不触发用户交互 mutation
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

/* eslint-disable @next/next/no-img-element -- 缩略图来自动态远程地址，不适合 Next Image 域名约束 */

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Heart, Play, Eye } from 'lucide-react'

import { Link } from '@/i18n/navigation'

/* ─── Types ──────────────────────────────────────────── */

interface ShowcaseItem {
  entity_type?: 'workflow' | 'output'
  id: string
  name: string
  description?: string
  thumbnail?: string
  media_url?: string
  like_count: number
  view_count: number
  favorite_count?: number
  author_name?: string | null
  author_avatar?: string
  content_type?: 'video' | 'image' | 'workflow'
}

/* ─── Cache Layer ────────────────────────────────────── */

const CACHE_KEY = 'nbc_showcase_cache'
const CACHE_TTL = 30 * 60 * 1000 // 30 分钟客户端缓存

interface CacheEntry {
  items: ShowcaseItem[]
  ts: number
}

function readCache(): ShowcaseItem[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const entry: CacheEntry = JSON.parse(raw)
    if (Date.now() - entry.ts > CACHE_TTL) return null
    return entry.items
  } catch {
    return null
  }
}

function writeCache(items: ShowcaseItem[]) {
  try {
    const entry: CacheEntry = { items, ts: Date.now() }
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry))
  } catch {
    // ignore
  }
}

/* ─── Banner ─────────────────────────────────────────── */

const BANNERS = [
  { image: '/explore/banners/01.png', altKey: 'bannerAlt1' as const, ratio: 1915 / 821 },
  { image: '/explore/banners/02.png', altKey: 'bannerAlt2' as const, ratio: 1915 / 821 },
  { image: '/explore/banners/03.png', altKey: 'bannerAlt3' as const, ratio: 1915 / 821 },
  { image: '/explore/banners/04.png', altKey: 'bannerAlt4' as const, ratio: 1915 / 821 },
  { image: '/explore/banners/05.png', altKey: 'bannerAlt5' as const, ratio: 1915 / 821 },
  { image: '/explore/banners/06.png', altKey: 'bannerAlt6' as const, ratio: 1915 / 821 },
] as const

function getCarouselOffset(index: number, activeIndex: number, total: number) {
  const rawOffset = index - activeIndex
  if (rawOffset > total / 2) return rawOffset - total
  if (rawOffset < -total / 2) return rawOffset + total
  return rawOffset
}

/* ─── Helpers ────────────────────────────────────────── */

function formatMetric(n?: number): string {
  if (!n) return '0'
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function getInitial(name?: string): string {
  return (name?.trim() || '?').charAt(0).toUpperCase()
}

/* ─── Skeleton ───────────────────────────────────────── */

function CardSkeleton() {
  return (
    <div className="mb-5 break-inside-avoid overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.04]">
      <div className="aspect-[4/3] animate-pulse bg-white/[0.06]" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 rounded bg-white/[0.06]" />
        <div className="h-3 w-1/2 rounded bg-white/[0.04]" />
      </div>
    </div>
  )
}

/* ─── Card ───────────────────────────────────────────── */

function ShowcaseCard({ item, unknownCreator }: { item: ShowcaseItem; unknownCreator: string }) {
  const authorName = item.author_name?.trim() || unknownCreator
  const previewUrl = item.content_type === 'video' && item.thumbnail === item.media_url
    ? undefined
    : item.thumbnail

  return (
    <Link
      href="/sign-in"
      className="group relative mb-5 block break-inside-avoid overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.04] transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.06] hover:shadow-[0_20px_64px_-20px_rgba(99,102,241,0.18)]"
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-white/[0.03]">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex min-h-[200px] items-center justify-center">
            <span className="text-[11px] font-medium tracking-[0.18em] uppercase text-white/30">
              {item.content_type ?? 'workflow'}
            </span>
          </div>
        )}

        {item.content_type === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-black/50 text-white backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
              <Play size={16} className="ml-0.5 fill-current" />
            </div>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_50%,rgba(0,0,0,0.6)_100%)]" />

        {/* Bottom overlay: author + stats */}
        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="h-6 w-6 flex-shrink-0 overflow-hidden rounded-full border border-white/20 bg-white/10 backdrop-blur-md">
              {item.author_avatar ? (
                <img src={item.author_avatar} alt={authorName} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-white/80">
                  {getInitial(authorName)}
                </div>
              )}
            </div>
            <span className="min-w-0 truncate text-xs font-medium text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
              {authorName}
            </span>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            <span className="flex items-center gap-1 text-[11px] text-white/70">
              <Heart size={11} />
              {formatMetric(item.like_count)}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-white/70">
              <Eye size={11} />
              {formatMetric(item.view_count)}
            </span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3.5">
        <h3 className="truncate text-sm font-medium text-white/90">{item.name}</h3>
        {item.description && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/45">{item.description}</p>
        )}
      </div>
    </Link>
  )
}

/* ─── Main Component ─────────────────────────────────── */

const GRID_CLASS = 'columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4'

export function ShowcaseContent() {
  const t = useTranslations('landing.showcase')
  const tExplore = useTranslations('explore')
  const [items, setItems] = useState<ShowcaseItem[]>(() => readCache() ?? [])
  const [loading, setLoading] = useState(() => !readCache())
  const [activeBanner, setActiveBanner] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveBanner((c) => (c + 1) % BANNERS.length)
    }, 4800)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const cached = readCache()
    if (cached) return

    fetch('/api/explore?limit=60&sort=popular')
      .then((res) => res.json())
      .then((json) => {
        const data = (json.data?.items ?? []) as ShowcaseItem[]
        setItems(data)
        writeCache(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {t('title')}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-white/50">
            {t('subtitle')}
          </p>
        </div>

        {/* Banner Carousel */}
        <section className="relative mb-10 px-1 sm:px-2 lg:px-3">
          <div className="relative h-[200px] overflow-visible sm:h-[264px] lg:h-[340px]">
            {BANNERS.map((banner, index) => {
              const offset = getCarouselOffset(index, activeBanner, BANNERS.length)
              const isActive = offset === 0
              const isSideCard = Math.abs(offset) === 1
              const hidden = Math.abs(offset) > 1

              return (
                <button
                  key={banner.image}
                  type="button"
                  onClick={() => setActiveBanner(index)}
                  aria-label={`${tExplore('switchBanner')} ${index + 1}`}
                  className={`absolute left-1/2 top-1/2 block h-[88%] max-w-[84%] -translate-y-1/2 overflow-hidden rounded-[24px] shadow-[0_24px_55px_-36px_rgba(0,0,0,0.6)] transition-all duration-500 ease-out sm:h-[90%] sm:max-w-[72%] lg:max-w-[60%] ${
                    hidden ? 'pointer-events-none opacity-0' : ''
                  }`}
                  style={{
                    zIndex: isActive ? 30 : isSideCard ? 20 : 10,
                    aspectRatio: String(banner.ratio),
                    transform: `translate(-50%, -50%) perspective(1400px) translateX(${offset * 34}%) scale(${
                      isActive ? 1 : 0.86
                    }) rotateY(${offset * -24}deg)`,
                    opacity: isActive ? 1 : isSideCard ? 0.72 : 0,
                    filter: isActive ? 'none' : 'saturate(0.9) brightness(0.82)',
                  }}
                >
                  <div className="relative h-full w-full bg-[radial-gradient(circle_at_top,#1a1a2e_0%,#16162a_26%,#0f0f1a_100%)]">
                    <Image
                      src={banner.image}
                      alt={tExplore(banner.altKey)}
                      fill
                      sizes="(max-width: 1024px) 88vw, 980px"
                      className="object-contain object-center"
                      priority={isActive}
                    />
                  </div>
                </button>
              )
            })}

            <div className="absolute inset-x-0 bottom-2 z-40 flex justify-center gap-2">
              {BANNERS.map((banner, dotIndex) => (
                <button
                  key={banner.image}
                  type="button"
                  onClick={() => setActiveBanner(dotIndex)}
                  className={`h-2.5 rounded-full transition-all ${
                    dotIndex === activeBanner ? 'w-8 bg-white/80' : 'w-2.5 bg-white/25'
                  }`}
                  aria-label={`${tExplore('switchBanner')} ${dotIndex + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Grid */}
        {loading ? (
          <div className={GRID_CLASS}>
            {Array.from({ length: 12 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32">
            <p className="text-sm text-white/40">{t('noResults')}</p>
          </div>
        ) : (
          <div className={GRID_CLASS}>
            {items.map((item) => (
              <ShowcaseCard key={`${item.entity_type}-${item.id}`} item={item} unknownCreator={t('unknownCreator')} />
            ))}
          </div>
        )}

        {/* CTA */}
        {!loading && items.length > 0 && (
          <div className="mt-16 flex justify-center">
            <Link
              href="/sign-in"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-8 text-sm font-semibold text-black transition-all hover:bg-white/90 hover:shadow-[0_12px_40px_-12px_rgba(255,255,255,0.25)]"
            >
              {t('cta')}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
