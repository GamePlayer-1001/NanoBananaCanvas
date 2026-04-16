/**
 * [INPUT]: 依赖 next 核心配置，依赖 @opennextjs/cloudflare 的 initOpenNextCloudflareForDev，
 *          依赖 next-intl/plugin 的 createNextIntlPlugin
 * [OUTPUT]: 对外提供 Next.js 构建配置（含 i18n 插件）
 * [POS]: apps/web 的 Next.js 配置文件，本地开发时初始化 OpenNext Cloudflare 上下文
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

initOpenNextCloudflareForDev()

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {}

export default withNextIntl(nextConfig)
