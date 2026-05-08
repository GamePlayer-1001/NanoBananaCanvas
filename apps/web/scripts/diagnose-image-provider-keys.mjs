/**
 * [INPUT]: 依赖 Node.js 运行时的 fetch/process，依赖 apps/web/.env.local 的 DLAPI_API_KEY 与 COMFLY_API_KEY
 * [OUTPUT]: 对外提供可执行的图片供应商鉴权诊断脚本，验证正确/错误 key 在 DLAPI 与 Comfly 图片接口上的响应差异
 * [POS]: apps/web/scripts 的图片接口排障工具，被开发者手工执行，用于快速区分 key 问题、供应商错配与网络超时
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const DEFAULT_TIMEOUT_MS = 20_000
const DEFAULT_PROMPT = 'A minimal line sketch of a cat'
const DEFAULT_SIZE = '1024x1024'

async function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env.local')
  const content = await readFile(envPath, 'utf8')
  const env = {}

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const separatorIndex = line.indexOf('=')
    if (separatorIndex === -1) continue

    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim()
    env[key] = stripWrappingQuotes(value)
  }

  return env
}

function stripWrappingQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }

  return value
}

function redactKey(value) {
  if (!value) return '(missing)'
  if (value.length <= 10) return `${value.slice(0, 2)}***${value.slice(-2)}`
  return `${value.slice(0, 6)}***${value.slice(-4)}`
}

function sanitizeText(text) {
  return text
    .replace(/sk-[A-Za-z0-9_-]{8,}/g, '[redacted-key]')
    .replace(/\s+/g, ' ')
    .trim()
}

function summarizeBody(text, maxLength = 240) {
  const normalized = sanitizeText(text)
  if (!normalized) return '(empty response body)'
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength)}...`
    : normalized
}

async function probe({ label, url, apiKey, model, timeoutMs }) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const startedAt = Date.now()

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        prompt: DEFAULT_PROMPT,
        size: DEFAULT_SIZE,
        aspect_ratio: '1:1',
        n: 1,
      }),
      signal: controller.signal,
    })

    const bodyText = await response.text().catch(() => '')
    return {
      label,
      ok: response.ok,
      status: response.status,
      elapsedMs: Date.now() - startedAt,
      keyFingerprint: redactKey(apiKey),
      model,
      url,
      responsePreview: summarizeBody(bodyText),
    }
  } catch (error) {
    return {
      label,
      ok: false,
      elapsedMs: Date.now() - startedAt,
      keyFingerprint: redactKey(apiKey),
      model,
      url,
      error: error instanceof Error ? error.message : String(error),
    }
  } finally {
    clearTimeout(timer)
  }
}

async function main() {
  const env = await loadEnvFile()
  const dlapiKey = env.DLAPI_API_KEY || process.env.DLAPI_API_KEY
  const comflyKey = env.COMFLY_API_KEY || process.env.COMFLY_API_KEY

  if (!dlapiKey || !comflyKey) {
    throw new Error('Missing DLAPI_API_KEY or COMFLY_API_KEY in apps/web/.env.local')
  }

  const probes = [
    {
      label: 'dlapi-with-dlapi-key',
      url: 'https://api.dlapi.xyz/v1/images/generations',
      apiKey: dlapiKey,
      model: 'gpt-image-2',
    },
    {
      label: 'comfly-with-comfly-key',
      url: 'https://ai.comfly.chat/v1/images/generations',
      apiKey: comflyKey,
      model: 'gpt-image-2-all',
    },
    {
      label: 'comfly-with-dlapi-key',
      url: 'https://ai.comfly.chat/v1/images/generations',
      apiKey: dlapiKey,
      model: 'gpt-image-2-all',
    },
    {
      label: 'dlapi-with-comfly-key',
      url: 'https://api.dlapi.xyz/v1/images/generations',
      apiKey: comflyKey,
      model: 'gpt-image-2',
    },
  ]

  const results = []
  for (const current of probes) {
    results.push(await probe({ ...current, timeoutMs: DEFAULT_TIMEOUT_MS }))
  }

  console.log(
    JSON.stringify(
      {
        startedAt: new Date().toISOString(),
        timeoutMs: DEFAULT_TIMEOUT_MS,
        probes: results,
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  )
  process.exit(1)
})
