/**
 * [INPUT]: 依赖 next-intl (P1 阶段接入)
 * [OUTPUT]: 对外提供带 locale 参数的语言布局
 * [POS]: [locale] 动态路由布局，包裹所有语言相关页面
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export default async function LocaleLayout({ children }: { children: React.ReactNode }) {
  // TODO: P1 阶段接入 NextIntlClientProvider
  return children
}
