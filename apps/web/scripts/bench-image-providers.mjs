/**
 * [INPUT]: 依赖 Node.js fetch/process，依赖 apps/web/.env.local 的 DLAPI_API_KEY / COMFLY_API_KEY 及可选 *_BASE_URL
 * [OUTPUT]: 对外提供 dlapi vs comfly 图片直出图延迟基准对比脚本，按相同提示词多轮采样并输出统计（min/avg/p50/max/成功率）
 * [POS]: apps/web/scripts 的供应商速度对比联调脚本，用于验证"同样 API 本地直连"的真实耗时，隔离编排层开销
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

/* ─── 默认参数：与 App 真实图片节点默认一致 ─────────────── */
const DEFAULT_MODEL = 'gpt-image-2'
const DEFAULT_PROMPT = 'A minimal black ink sketch of a cat sitting on white paper'
const DEFAULT_SIZE = '1920x1920' // App 中 1k + 1:1 的解析结果
const DEFAULT_ASPECT = '1:1'
const DEFAULT_RUNS = 3
const DEFAULT_TIMEOUT_MS = 120_000

/* ─── 待测供应商：端点与请求体严格复刻 App 直出图路径 ────── */
const PROVIDERS = [
  {
    id: 'dlapi',
    baseUrlEnv: 'DLAPI_BASE_URL',
    keyEnv: 'DLAPI_API_KEY',
    defaultBaseUrl: 'https://api.dlapi.xyz/v1',
  },
  {
    id: 'comfly',
    baseUrlEnv: 'COMFLY_BASE_URL',
    keyEnv: 'COMFLY_API_KEY',
    defaultBaseUrl: 'https://ai.comfly.chat/v1',
  },
]

function parseArgs(argv) {
  const parsed = {
    model: DEFAULT_MODEL,
    prompt: DEFAULT_PROMPT,
    size: DEFAULT_SIZE,
    aspect: DEFAULT_ASPECT,
    runs: DEFAULT_RUNS,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    only: null,
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
      case '--aspect':
        parsed.aspect = next ?? parsed.aspect
        i += 1
        break
      case '--runs':
        parsed.runs = Number.parseInt(next ?? '', 10) || parsed.runs
        i += 1
        break
      case '--timeout':
        parsed.timeoutMs = Number.parseInt(next ?? '', 10) || parsed.timeoutMs
        i += 1
        break
      case '--only':
        parsed.only = next ?? null
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
  node ./scripts/bench-image-providers.mjs [options]

Options:
  --model <name>     默认 ${DEFAULT_MODEL}
  --prompt <text>    默认 "${DEFAULT_PROMPT}"
  --size <value>     默认 ${DEFAULT_SIZE} (App 中 1k+1:1 的解析值)
  --aspect <ratio>   默认 ${DEFAULT_ASPECT}
  --runs <n>         每个供应商采样轮数，默认 ${DEFAULT_RUNS}
  --timeout <ms>     单次请求超时，默认 ${DEFAULT_TIMEOUT_MS}
  --only <id>        只测某个供应商 (dlapi | comfly)
  --help             显示帮助
`)
}

async function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env.local')
  const env = {}
  try {
    const content = await readFile(envPath, 'utf8')
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) continue
      const idx = line.indexOf('=')
      if (idx === -1) continue
      const key = line.slice(0, idx).trim()
      env[key] = stripQuotes(line.slice(idx + 1).trim())
    }
  } catch {
    /* 文件不存在时回落到 process.env */
  }
  return env
}

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }
  return value
}

/* 只展示 key 指纹，绝不回显明文 */
function fingerprint(value) {
  if (!value) return null
  if (value.length <= 10) return `${value.slice(0, 2)}***${value.slice(-2)}`
  return `${value.slice(0, 6)}***${value.slice(-4)}`
}

function hasUsableImagePayload(body) {
  if (!body || typeof body !== 'object') return false
  const data = body.data
  if (!Array.isArray(data) || data.length === 0) return false
  const first = data[0]
  return Boolean(first && (first.url || first.b64_json))
}

function summarizeBody(body, status, ok) {
  if (ok && hasUsableImagePayload(body)) {
    const first = body.data[0]
    return first.url ? `url(${String(first.url).slice(0, 48)}...)` : 'base64'
  }
  if (body && typeof body === 'object') {
    const msg = body.error?.message ?? body.message ?? JSON.stringify(body).slice(0, 160)
    return `status=${status} ${msg}`
  }
  return `status=${status}`
}

async function singleRun({ provider, apiKey, baseUrl, args }) {
  const url = `${baseUrl.replace(/\/$/, '')}/images/generations`
  const startedAt = Date.now()
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: args.model,
        prompt: args.prompt,
        size: args.size,
        aspect_ratio: args.aspect,
        n: 1,
      }),
      signal: AbortSignal.timeout(args.timeoutMs),
    })
    const elapsedMs = Date.now() - startedAt
    const text = await res.text()
    let body = null
    try {
      body = text ? JSON.parse(text) : null
    } catch {
      body = { parseError: true, rawText: text.slice(0, 200) }
    }
    const usable = res.ok && hasUsableImagePayload(body)
    return {
      provider: provider.id,
      elapsedMs,
      status: res.status,
      ok: res.ok,
      usable,
      detail: summarizeBody(body, res.status, res.ok),
    }
  } catch (error) {
    const elapsedMs = Date.now() - startedAt
    const name = error instanceof Error ? error.name : 'Error'
    const msg = error instanceof Error ? error.message : String(error)
    return {
      provider: provider.id,
      elapsedMs,
      status: name === 'TimeoutError' ? 'timeout' : 'network_error',
      ok: false,
      usable: false,
      detail: `${name}: ${msg}`,
    }
  }
}

function stats(samples) {
  const usable = samples.filter((s) => s.usable).map((s) => s.elapsedMs).sort((a, b) => a - b)
  if (usable.length === 0) {
    return { count: 0, min: null, avg: null, p50: null, max: null }
  }
  const sum = usable.reduce((acc, n) => acc + n, 0)
  return {
    count: usable.length,
    min: usable[0],
    avg: Math.round(sum / usable.length),
    p50: usable[Math.floor(usable.length / 2)],
    max: usable[usable.length - 1],
  }
}

function fmtMs(ms) {
  if (ms == null) return '   -  '
  return `${(ms / 1000).toFixed(2)}s`
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const env = await loadEnvFile()
  const targets = PROVIDERS.filter((p) => !args.only || p.id === args.only)

  console.log('═══════════════════════════════════════════════════')
  console.log(' 图片供应商速度基准 (本地直连，隔离编排层)')
  console.log('═══════════════════════════════════════════════════')
  console.log(` model=${args.model}  size=${args.size}  aspect=${args.aspect}  runs=${args.runs}`)
  console.log(` prompt="${args.prompt}"`)
  console.log('───────────────────────────────────────────────────')

  const allStats = []

  for (const provider of targets) {
    const apiKey = env[provider.keyEnv] || process.env[provider.keyEnv]
    const baseUrl =
      env[provider.baseUrlEnv] || process.env[provider.baseUrlEnv] || provider.defaultBaseUrl

    if (!apiKey) {
      console.log(`\n[${provider.id}] 跳过：缺少 ${provider.keyEnv}`)
      continue
    }

    console.log(`\n[${provider.id}] base=${baseUrl}  key=${fingerprint(apiKey)}`)
    const samples = []
    for (let run = 1; run <= args.runs; run += 1) {
      const result = await singleRun({ provider, apiKey, baseUrl, args })
      samples.push(result)
      const flag = result.usable ? 'OK ' : 'ERR'
      console.log(
        `  run ${run}/${args.runs}  ${flag}  ${fmtMs(result.elapsedMs)}  ${result.detail}`,
      )
    }
    const s = stats(samples)
    allStats.push({ provider: provider.id, ...s, total: samples.length })
  }

  console.log('\n═══════════════════════════════════════════════════')
  console.log(' 汇总 (仅统计成功出图的样本)')
  console.log('───────────────────────────────────────────────────')
  console.log(' provider    成功率      min     avg     p50     max')
  for (const s of allStats) {
    const rate = `${s.count}/${s.total}`
    console.log(
      `  ${s.provider.padEnd(10)} ${rate.padEnd(10)} ${fmtMs(s.min)}  ${fmtMs(s.avg)}  ${fmtMs(s.p50)}  ${fmtMs(s.max)}`,
    )
  }
  console.log('═══════════════════════════════════════════════════')
}

main().catch((error) => {
  console.error(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }, null, 2))
  process.exit(1)
})
