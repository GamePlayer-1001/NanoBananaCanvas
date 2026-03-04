/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供所有共享类型和常量的统一入口
 * [POS]: packages/shared 的入口文件，被 apps/web 和 apps/worker 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export * from './types'
export * from './constants'
