/**
 * [INPUT]: 依赖 @testing-library/jest-dom
 * [OUTPUT]: 对外提供 Vitest 全局 setup (DOM matchers)
 * [POS]: vitest.config.ts 的 setupFiles 入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import '@testing-library/jest-dom/vitest'
