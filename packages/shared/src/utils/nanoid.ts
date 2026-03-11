/**
 * [INPUT]: 无外部依赖 (crypto.getRandomValues 由运行时提供)
 * [OUTPUT]: 对外提供 nanoid() ID 生成器
 * [POS]: packages/shared/utils 的 ID 生成工具，被 apps/web 和 apps/worker 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz'
const DEFAULT_SIZE = 21

export function nanoid(size: number = DEFAULT_SIZE): string {
  const bytes = crypto.getRandomValues(new Uint8Array(size))
  let id = ''
  for (let i = 0; i < size; i++) {
    id += ALPHABET[bytes[i] % ALPHABET.length]
  }
  return id
}
