/**
 * [INPUT]: 依赖 next-intl/server 的 getRequestConfig，依赖 next-intl 的 hasLocale，
 *          依赖 ./routing 的 locales 列表
 * [OUTPUT]: 对外提供服务端请求级 i18n 配置 (locale 校验 + messages 加载)
 * [POS]: i18n 的服务端配置入口，被 next-intl 插件自动调用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
