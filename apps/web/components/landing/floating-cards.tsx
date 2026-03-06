/**
 * [INPUT]: 依赖 react, 依赖 next/image
 * [OUTPUT]: 对外提供 FloatingCards 浮动装饰图片卡组件
 * [POS]: landing 的视觉装饰层，被 hero-section.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

/* ─── Card Data ──────────────────────────────────────── */

interface FloatingCard {
  id: string
  label: string
  sublabel?: string
  className: string
  gradient: string
  delay: string
}

const FLOATING_CARDS: FloatingCard[] = [
  {
    id: 'eye',
    label: 'Mood',
    sublabel: 'Midjourney v6',
    className: 'left-[18%] top-[-1%] w-[192px] h-[108px] rotate-[-2deg]',
    gradient: 'from-amber-600/40 to-purple-600/40',
    delay: '0.3s',
  },
  {
    id: 'profile',
    label: 'Mood',
    className: 'left-[-1%] top-[-8%] w-[192px] h-[256px] rotate-[1deg]',
    gradient: 'from-orange-500/40 to-red-600/40',
    delay: '1.1s',
  },
  {
    id: 'necklace',
    label: 'Necklace',
    className: 'left-[8%] bottom-[-5%] w-[192px] h-[192px] rotate-[-3deg]',
    gradient: 'from-emerald-500/40 to-cyan-600/40',
    delay: '0.7s',
  },
  {
    id: 'girl3d',
    label: 'Girl',
    sublabel: 'Flux [dev]',
    className: 'right-[15%] top-[-10%] w-[224px] h-[298px] rotate-[2deg]',
    gradient: 'from-pink-400/40 to-rose-500/40',
    delay: '1.5s',
  },
  {
    id: 'anime',
    label: 'blink',
    className: 'right-[-1%] bottom-[5%] w-[192px] h-[256px] rotate-[-1deg]',
    gradient: 'from-indigo-500/40 to-violet-600/40',
    delay: '0.5s',
  },
]

/* ─── Component ──────────────────────────────────────── */

export function FloatingCards() {
  return (
    <div className="pointer-events-none absolute inset-0">
      {FLOATING_CARDS.map((card) => (
        <div
          key={card.id}
          className={`absolute animate-float rounded-lg border border-white/10 shadow-2xl ${card.className}`}
          style={{ animationDelay: card.delay }}
        >
          {/* 渐变占位图 */}
          <div
            className={`h-full w-full rounded-lg bg-gradient-to-br ${card.gradient}`}
          />
          {/* 标签 */}
          <div className="absolute top-2 left-2 flex items-center gap-1">
            <span className="rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white/80 backdrop-blur-sm">
              {card.label}
            </span>
          </div>
          {card.sublabel && (
            <div className="absolute top-2 right-2">
              <span className="rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white/60 backdrop-blur-sm">
                {card.sublabel}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
