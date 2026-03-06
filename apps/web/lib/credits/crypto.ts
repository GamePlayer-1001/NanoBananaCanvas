/**
 * [INPUT]: 依赖 Web Crypto API (AES-256-GCM)
 * [OUTPUT]: 对外提供 encryptApiKey / decryptApiKey (服务端 API Key 加解密)
 * [POS]: lib/credits 的服务端加密层，被 api-keys 路由消费。与前端 services/storage/crypto.ts 独立
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

/* ─── Encrypt ────────────────────────────────────────── */

/** 加密 API Key，返回 `iv_hex:ciphertext_hex` 格式 */
export async function encryptApiKey(plainKey: string, encryptionKey: string): Promise<string> {
  const key = await importKey(encryptionKey)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plainKey)

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    encoded as BufferSource,
  )

  return bufToHex(iv) + ':' + bufToHex(new Uint8Array(encrypted))
}

/* ─── Decrypt ────────────────────────────────────────── */

/** 解密 `iv_hex:ciphertext_hex` 格式的密文 */
export async function decryptApiKey(encrypted: string, encryptionKey: string): Promise<string> {
  const [ivHex, cipherHex] = encrypted.split(':')
  if (!ivHex || !cipherHex) throw new Error('Invalid encrypted key format')

  const key = await importKey(encryptionKey)
  const iv = hexToBuf(ivHex)
  const ciphertext = hexToBuf(cipherHex)

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    ciphertext as BufferSource,
  )

  return new TextDecoder().decode(decrypted)
}

/* ─── Mask ───────────────────────────────────────────── */

/** 掩码展示: `sk-or-v1-xxxx****abcd` */
export function maskApiKey(key: string): string {
  if (key.length <= 8) return '****'
  return key.slice(0, 8) + '****' + key.slice(-4)
}

/* ─── Internal ───────────────────────────────────────── */

async function importKey(hexKey: string): Promise<CryptoKey> {
  const raw = hexToBuf(hexKey)
  return crypto.subtle.importKey('raw', raw as BufferSource, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

function bufToHex(buf: Uint8Array): string {
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function hexToBuf(hex: string): Uint8Array {
  const bytes = hex.match(/.{1,2}/g)
  if (!bytes) throw new Error('Invalid hex string')
  return new Uint8Array(bytes.map((b) => parseInt(b, 16)))
}
