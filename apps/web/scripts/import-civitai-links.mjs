/**
 * [INPUT]: 依赖 Node.js fs/path/process/crypto，依赖全局 fetch，依赖 import-explore-works.mjs，依赖 Civitai 图片页公开接口与页面 JSON
 * [OUTPUT]: 对外提供 Civitai 链接批量导入脚本（读取链接文件 -> 抓取可得元数据 -> 下载原图 -> 生成 manifest -> 可选串联 Explore 导入）
 * [POS]: scripts 的 Civitai 外部图库导入入口，被内容运营用于把仅有链接的 Civitai 图片批量落入本地导入链路
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import process from 'node:process'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const appDir = path.resolve(scriptDir, '..')
const defaultUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'

function parseArgs(argv) {
  const args = {
    linksFile: '',
    outputDir: '',
    manifestPath: '',
    userId: '',
    target: '--local',
    fakeAuthors: false,
    dryRun: false,
    skipImport: false,
    limit: 0,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (token === '--links-file') args.linksFile = argv[++index] ?? ''
    else if (token === '--output-dir') args.outputDir = argv[++index] ?? ''
    else if (token === '--manifest') args.manifestPath = argv[++index] ?? ''
    else if (token === '--user-id') args.userId = argv[++index] ?? ''
    else if (token === '--remote') args.target = '--remote'
    else if (token === '--local') args.target = '--local'
    else if (token === '--fake-authors') args.fakeAuthors = true
    else if (token === '--dry-run') args.dryRun = true
    else if (token === '--skip-import') args.skipImport = true
    else if (token === '--limit') args.limit = Number(argv[++index] ?? '0')
  }

  if (!args.linksFile) {
    throw new Error('Usage: node ./scripts/import-civitai-links.mjs --links-file <file> [--output-dir <dir>] [--manifest <file>] [--user-id <id> | --fake-authors] [--local|--remote] [--dry-run] [--skip-import] [--limit <n>]')
  }

  if (!args.fakeAuthors && !args.userId && !args.skipImport) {
    throw new Error('Import mode requires --user-id or --fake-authors')
  }

  return args
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function slugify(value) {
  const ascii = String(value ?? '')
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/g, '')
  return ascii
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function sanitizeFileStem(value, fallback) {
  const slug = slugify(value)
  return slug || fallback
}

function sanitizeText(value) {
  return String(value ?? '').trim()
}

function readLinks(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function extractImageId(url) {
  const match = String(url).match(/\/images\/(\d+)/i)
  if (!match) {
    throw new Error(`Unsupported Civitai image url: ${url}`)
  }
  return match[1]
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': defaultUserAgent,
      Accept: 'application/json,text/plain,*/*',
    },
  })

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`)
  }

  return response.json()
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': defaultUserAgent,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  })

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`)
  }

  return response.text()
}

function extractNextData(html) {
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i)
  if (!match) return null

  try {
    return JSON.parse(match[1])
  } catch {
    return null
  }
}

function deepFindFirst(node, predicate) {
  if (!node || typeof node !== 'object') return null
  if (predicate(node)) return node

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = deepFindFirst(item, predicate)
      if (found) return found
    }
    return null
  }

  for (const value of Object.values(node)) {
    const found = deepFindFirst(value, predicate)
    if (found) return found
  }

  return null
}

function resolveImageDetailFromNextData(nextData, imageId) {
  const numericId = Number(imageId)
  return deepFindFirst(nextData, (value) => {
    return (
      value &&
      typeof value === 'object' &&
      value.id === numericId &&
      typeof value.url === 'string' &&
      typeof value.type === 'string'
    )
  })
}

function chooseBestPrompt(meta) {
  if (!meta || typeof meta !== 'object') return ''

  const directCandidates = [
    meta.prompt,
    meta.positivePrompt,
    meta.positive_prompt,
    meta.description,
    meta.caption,
  ]

  for (const candidate of directCandidates) {
    const text = sanitizeText(candidate)
    if (text) return text
  }

  const nestedMeta = meta.meta
  if (nestedMeta && typeof nestedMeta === 'object') {
    const nestedCandidates = [
      nestedMeta.prompt,
      nestedMeta.positivePrompt,
      nestedMeta.positive_prompt,
      nestedMeta.description,
      nestedMeta.caption,
      nestedMeta.workflow?.prompt,
    ]

    for (const candidate of nestedCandidates) {
      const text = sanitizeText(candidate)
      if (text) return text
    }
  }

  return ''
}

function pickTitle({ pageDetail, apiItem, imageId }) {
  const candidates = [
    pageDetail?.title,
    pageDetail?.name,
    pageDetail?.meta?.title,
    pageDetail?.meta?.meta?.title,
    apiItem?.title,
    apiItem?.name,
  ]

  for (const candidate of candidates) {
    const text = sanitizeText(candidate)
    if (text) return text
  }

  const username = sanitizeText(pageDetail?.user?.username || apiItem?.username)
  if (username) {
    return `Civitai image ${imageId} by ${username}`
  }

  return `Civitai image ${imageId}`
}

function pickDescription({ pageDetail, apiItem }) {
  const candidates = [
    pageDetail?.description,
    pageDetail?.meta?.description,
    pageDetail?.meta?.meta?.description,
    apiItem?.description,
    apiItem?.meta?.description,
    apiItem?.meta?.meta?.description,
  ]

  for (const candidate of candidates) {
    const text = sanitizeText(candidate)
    if (text) return text
  }

  return ''
}

function pickAuthorAvatar({ pageDetail, apiItem }) {
  const candidates = [
    pageDetail?.user?.image,
    pageDetail?.user?.profilePicture?.url,
    apiItem?.user?.image,
    apiItem?.user?.profilePicture?.url,
  ]

  for (const candidate of candidates) {
    const text = sanitizeText(candidate)
    if (!text) continue
    if (text.startsWith('http://') || text.startsWith('https://')) return text
    return `https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/${text}/width=96/${text}.jpeg`
  }

  return ''
}

async function downloadToFile(url, filePath) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': defaultUserAgent,
      Accept: 'image/*,*/*;q=0.8',
    },
  })

  if (!response.ok) {
    throw new Error(`Download failed (${response.status}) for ${url}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  fs.writeFileSync(filePath, Buffer.from(arrayBuffer))
}

function inferExtension(url, contentType = '') {
  const cleanUrl = url.split('?')[0]
  const ext = path.extname(cleanUrl).toLowerCase()
  if (ext) return ext

  if (contentType.includes('png')) return '.png'
  if (contentType.includes('webp')) return '.webp'
  if (contentType.includes('gif')) return '.gif'
  return '.jpg'
}

async function buildManifestItem(linkUrl, directories) {
  const imageId = extractImageId(linkUrl)
  const apiPayload = await fetchJson(`https://civitai.com/api/v1/images?imageId=${imageId}`)
  const apiItem = apiPayload?.items?.[0]

  if (!apiItem?.url) {
    throw new Error(`Image url missing for ${linkUrl}`)
  }

  const pageHtml = await fetchText(linkUrl)
  const nextData = extractNextData(pageHtml)
  const pageDetail = resolveImageDetailFromNextData(nextData, imageId)

  const title = pickTitle({ pageDetail, apiItem, imageId })
  const description = pickDescription({ pageDetail, apiItem })
  const prompt = chooseBestPrompt(pageDetail?.meta ?? apiItem?.meta ?? {})
  const sourceAuthorName = sanitizeText(pageDetail?.user?.username || apiItem?.username)
  const sourceAuthorAvatar = pickAuthorAvatar({ pageDetail, apiItem })
  const publishedAt = sanitizeText(
    pageDetail?.publishedAt ||
      pageDetail?.createdAt ||
      apiItem?.createdAt ||
      new Date().toISOString(),
  )

  const fileStem = `${imageId}-${sanitizeFileStem(title, 'civitai-image')}`
  const fileExt = inferExtension(apiItem.url, '')
  const localFilePath = path.join(directories.mediaDir, `${fileStem}${fileExt}`)

  await downloadToFile(apiItem.url, localFilePath)

  return {
    title,
    description,
    prompt,
    sourceUrl: linkUrl,
    sourceType: 'civitai',
    sourceAuthorName,
    sourceAuthorAvatar,
    mediaPath: path.relative(directories.manifestDir, localFilePath),
    thumbnailPath: path.relative(directories.manifestDir, localFilePath),
    workflowJsonPath: '',
    mediaType: 'image',
    workflowId: '',
    publishedAt,
    isPublic: true,
    importKey: crypto.createHash('sha1').update(linkUrl).digest('hex'),
  }
}

function runImport(manifestPath, args) {
  const command = process.platform === 'win32' ? 'node.exe' : 'node'
  const scriptPath = path.join(scriptDir, 'import-explore-works.mjs')
  const commandArgs = [scriptPath, '--manifest', manifestPath, args.target]

  if (args.fakeAuthors) {
    commandArgs.push('--fake-authors')
  } else if (args.userId) {
    commandArgs.push('--user-id', args.userId)
  }

  if (args.dryRun) {
    commandArgs.push('--dry-run')
  }

  const result = spawnSync(command, commandArgs, {
    cwd: appDir,
    stdio: 'inherit',
    env: process.env,
  })

  if (result.status !== 0) {
    throw new Error('import-explore-works.mjs failed')
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const linksFile = path.resolve(process.cwd(), args.linksFile)
  const outputDir = path.resolve(
    process.cwd(),
    args.outputDir || path.join('.tmp', 'civitai-import'),
  )
  const mediaDir = path.join(outputDir, 'media')
  const manifestPath = path.resolve(
    process.cwd(),
    args.manifestPath || path.join(outputDir, 'manifest.json'),
  )
  const manifestDir = path.dirname(manifestPath)

  ensureDir(outputDir)
  ensureDir(mediaDir)
  ensureDir(manifestDir)

  const links = readLinks(linksFile)
  const selectedLinks = args.limit > 0 ? links.slice(0, args.limit) : links
  const items = []

  for (const linkUrl of selectedLinks) {
    console.log(`Fetching ${linkUrl}`)
    try {
      const item = await buildManifestItem(linkUrl, { mediaDir, manifestDir })
      items.push(item)
      console.log(`  -> ok: ${item.title}`)
    } catch (error) {
      console.error(`  -> failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  fs.writeFileSync(manifestPath, `${JSON.stringify(items, null, 2)}\n`, 'utf8')
  console.log(`Manifest written: ${manifestPath}`)
  console.log(`Prepared items: ${items.length}/${selectedLinks.length}`)

  if (!args.skipImport && items.length > 0) {
    runImport(manifestPath, args)
  }
}

await main()
