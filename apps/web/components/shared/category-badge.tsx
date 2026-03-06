/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供 CategoryBadge 分类标签组件 + CategoryBar 水平滚动栏
 * [POS]: shared 的通用分类筛选组件，被 workflows 页面消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

/* ─── CategoryBadge ──────────────────────────────────── */

export function CategoryBadge({
  label,
  active,
  onClick,
}: {
  label: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-sm transition-colors ${
        active
          ? 'bg-brand-500 font-medium text-white'
          : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
      }`}
    >
      {label}
    </button>
  )
}

/* ─── CategoryBar ────────────────────────────────────── */

export function CategoryBar({
  categories,
  active,
  onChange,
}: {
  categories: string[]
  active: string
  onChange: (category: string) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {categories.map((cat) => (
        <CategoryBadge
          key={cat}
          label={cat}
          active={active === cat}
          onClick={() => onChange(cat)}
        />
      ))}
    </div>
  )
}
