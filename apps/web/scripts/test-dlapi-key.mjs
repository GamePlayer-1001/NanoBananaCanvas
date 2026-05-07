/**
 * [INPUT]: 依赖 Node.js 运行时的 fetch/process，依赖 apps/web/.env.local 的 DLAPI_API_KEY 与可选 DLAPI_BASE_URL
 * [OUTPUT]: 对外提供可执行的 DLAPI key 联调脚本，提交直出图请求并输出去除 base64 后的完整响应
 * [POS]: apps/web/scripts 的联调脚本，用于验证本地网络环境下 DLAPI 图片接口与项目现有直出图协议是否可用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const DEFAULT_MODEL = 'gpt-image-2'
const DEFAULT_PROMPT = 'A minimal black ink sketch of a cat on white paper'
const DEFAULT_SIZE = '1024x1024'

function parseArgs(argv) {
  const parsed = {
    model: DEFAULT_MODEL,
    prompt: DEFAULT_PROMPT,
    size: DEFAULT_SIZE,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    const next = argv[i + 1]

    switch (arg) {
      case '--model':
        parsed.model = next ?? parsed.model
        i += 1
        break
      case '--prompt':
        parsed.prompt = next ?? parsed.prompt
        i += 1
        break
      case '--size':
        parsed.size = next ?? parsed.size
        i += 1
        break
      case '--help':
        printHelp()
        process.exit(0)
        break
      default:
        break
    }
  }

  return parsed
}

function printHelp() {
  console.log(`Usage:
  node ./scripts/test-dlapi-key.mjs [options]

Options:
  --model <name>          默认 ${DEFAULT_MODEL}
  --prompt <text>         默认 "${DEFAULT_PROMPT}"
  --size <value>          默认 ${DEFAULT_SIZE}
  --help                  显示帮助
`)
}

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

function sanitizeJson(value) {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeJson(item))
  }

  if (value && typeof value === 'object') {
    const next = {}
    for (const [key, currentValue] of Object.entries(value)) {
      if (key === 'b64_json' && typeof currentValue === 'string') {
        next[key] = `[omitted base64, length=${currentValue.length}]`
        continue
      }

      if (
        typeof currentValue === 'string' &&
        currentValue.startsWith('data:') &&
        currentValue.includes(';base64,')
      ) {
        const [prefix, base64 = ''] = currentValue.split(',', 2)
        next[key] = `${prefix},[omitted base64, length=${base64.length}]`
        continue
      }

      next[key] = sanitizeJson(currentValue)
    }
    return next
  }

  return value
}

async function parseResponseJson(response) {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch (error) {
    return {
      parseError: error instanceof Error ? error.message : String(error),
      rawText: text,
    }
  }
}

async function submitTask({ apiKey, baseUrl, model, prompt, size }) {
  const response = await fetch(`${baseUrl}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt,
      size,
      aspect_ratio: '1:1',
      n: 1,
    }),
  })

  const body = await parseResponseJson(response)
  return {
    status: response.status,
    ok: response.ok,
    body,
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const env = await loadEnvFile()
  const apiKey = env.DLAPI_API_KEY || process.env.DLAPI_API_KEY
  const baseUrl = env.DLAPI_BASE_URL || process.env.DLAPI_BASE_URL || 'https://api.dlapi.xyz/v1'

  if (!apiKey) {
    throw new Error('Missing DLAPI_API_KEY in apps/web/.env.local or process env')
  }

  const startedAt = new Date().toISOString()
  const submitResult = await submitTask({
    apiKey,
    baseUrl,
    model: args.model,
    prompt: args.prompt,
    size: args.size,
  })

  const output = {
    startedAt,
    request: {
      baseUrl,
      model: args.model,
      prompt: args.prompt,
      size: args.size,
      aspect_ratio: '1:1',
      n: 1,
    },
    submit: sanitizeJson(submitResult),
  }

  console.log(JSON.stringify(output, null, 2))

  if (!submitResult.ok) {
    process.exit(1)
  }
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
