/**
 * [INPUT]: 依赖 @opennextjs/cloudflare 的 defineCloudflareConfig / OpenNextConfig
 * [OUTPUT]: 对外提供 OpenNext Cloudflare 适配配置，拆分独立 edge function
 * [POS]: apps/web 的 Cloudflare Pages 部署适配层，声明 middleware 与 edge 路由的运行边界
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { defineCloudflareConfig } from '@opennextjs/cloudflare'
import type { OpenNextConfig } from '@opennextjs/cloudflare/config'

const baseConfig = defineCloudflareConfig({})

const config: OpenNextConfig = {
  ...baseConfig,
  functions: {
    ogImage: {
      runtime: 'edge',
      routes: ['app/api/og/route'],
      patterns: ['/api/og'],
    },
  },
}

export default config
