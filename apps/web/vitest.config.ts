/**
 * [INPUT]: 依赖 vitest/config, @vitejs/plugin-react
 * [OUTPUT]: 对外提供 Vitest 测试配置
 * [POS]: apps/web 的单元测试入口配置
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
})
