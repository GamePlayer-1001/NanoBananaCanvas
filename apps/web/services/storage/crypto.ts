/**
 * [INPUT]: 依赖 Web Crypto API (AES-GCM)，依赖 @/lib/logger
 * [OUTPUT]: 对外提供 encryptApiKey / decryptApiKey (AES-GCM 加解密)
 * [POS]: services/storage 的加密层，被 useSettingsStore 消费以保护 API Key
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { createLogger } from '@/lib/logger'

const log = createLogger('Crypto')

/* ─── Constants ──────────────────────────────────────── */

const STORAGE_KEY = 'nb-api-key-enc'
const SALT = 'nano-banana-canvas-v1'

/* ─── Encrypt & Store ────────────────────────────────── */

export async function encryptAndStoreApiKey(apiKey: string): Promise<void> {
  if (!apiKey) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }

  try {
    const key = await deriveKey()
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encoded = new TextEncoder().encode(apiKey)

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded,
    )

    // 存储格式: base64(iv) + '.' + base64(ciphertext)
    const payload = btoa(String.fromCharCode(...iv)) + '.' + btoa(String.fromCharCode(...new Uint8Array(encrypted)))
    localStorage.setItem(STORAGE_KEY, payload)
    log.debug('API key encrypted and stored')
  } catch (err) {
    log.warn('Encryption failed, storing as-is', {
      error: err instanceof Error ? err.message : String(err),
    })
    // 回退：crypto 不可用时（如 HTTP 环境），直接存储
    localStorage.setItem(STORAGE_KEY, apiKey)
  }
}

/* ─── Load & Decrypt ─────────────────────────────────── */

export async function loadAndDecryptApiKey(): Promise<string> {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return ''

  // 非加密格式 (回退兼容)
  if (!raw.includes('.')) return raw

  try {
    const [ivB64, cipherB64] = raw.split('.')
    const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0))
    const ciphertext = Uint8Array.from(atob(cipherB64), (c) => c.charCodeAt(0))
    const key = await deriveKey()

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext,
    )

    return new TextDecoder().decode(decrypted)
  } catch (err) {
    log.warn('Decryption failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    return ''
  }
}

/* ─── Internal ───────────────────────────────────────── */

async function deriveKey(): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SALT),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode(SALT),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}
