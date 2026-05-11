/**
 * [INPUT]: 依赖 Node.js fs/path/process/crypto，依赖 wrangler CLI，依赖 apps/web/db schema 与 manifest 文件
 * [OUTPUT]: 对外提供 Explore 批量导入脚本 (CSV/JSON manifest -> R2 上传 -> published_outputs upsert)
 * [POS]: scripts 的 Explore 导入运维入口，被内容运营与数据迁移复用，负责把本地/外部作品安全导入为公开作品实体
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
const databaseName = 'nano-banana-canvas-db'

const ALLOWED_SOURCE_TYPES = new Set(['civitai', 'manual', 'other'])
const ALLOWED_MEDIA_TYPES = new Set(['image', 'video'])

function parseArgs(argv) {
  const args = {
    manifest: '',
    userId: '',
    target: '--local',
    dryRun: false,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (token === '--manifest') args.manifest = argv[++i] ?? ''
    else if (token === '--user-id') args.userId = argv[++i] ?? ''
    else if (token === '--remote') args.target = '--remote'
    else if (token === '--local') args.target = '--local'
    else if (token === '--dry-run') args.dryRun = true
  }

  if (!args.manifest || !args.userId) {
    throw new Error('Usage: node ./scripts/import-explore-works.mjs --manifest <file> --user-id <userId> [--local|--remote] [--dry-run]')
  }

  return args
}

function parseCsvLine(line) {
  const cells = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"' && inQuotes && next === '"') {
      current += '"'
      i += 1
      continue
    }

    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }

    if (char === ',' && !inQuotes) {
      cells.push(current)
      current = ''
      continue
    }

    current += char
  }

  cells.push(current)
  return cells.map((cell) => cell.trim())
}

function parseManifest(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  if (filePath.toLowerCase().endsWith('.json')) {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      throw new Error('JSON manifest must be an array')
    }
    return parsed
  }

  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    return []
  }

  const headers = parseCsvLine(lines[0])
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line)
    return headers.reduce((acc, header, index) => {
      acc[header] = values[index] ?? ''
      return acc
    }, {})
  })
}

function normalizeBoolean(value, fallback = true) {
  if (typeof value === 'boolean') return value
  if (typeof value !== 'string') return fallback
  const normalized = value.trim().toLowerCase()
  if (!normalized) return fallback
  return ['1', 'true', 'yes', 'y'].includes(normalized)
}

function normalizeSourceType(value) {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (!normalized) return 'manual'
  if (!ALLOWED_SOURCE_TYPES.has(normalized)) {
    throw new Error(`Unsupported sourceType: ${normalized}`)
  }
  return normalized
}

function normalizeMediaType(value, filePath) {
  const explicit = String(value ?? '').trim().toLowerCase()
  if (explicit) {
    if (!ALLOWED_MEDIA_TYPES.has(explicit)) {
      throw new Error(`Unsupported mediaType: ${explicit}`)
    }
    return explicit
  }

  const ext = path.extname(filePath).toLowerCase()
  if (['.mp4', '.mov', '.webm', '.m4v'].includes(ext)) return 'video'
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) return 'image'
  throw new Error(`Cannot infer mediaType from ${filePath}`)
}

function buildImportKey(sourceUrl, mediaPath) {
  const seed = sourceUrl?.trim() || path.basename(mediaPath)
  return crypto.createHash('sha1').update(seed).digest('hex')
}

function buildR2Key(kind, userId, sourcePath) {
  const ext = path.extname(sourcePath).replace(/^\./, '').toLowerCase() || 'bin'
  return `${kind}/${userId}/imports/${crypto.randomUUID()}.${ext}`
}

function buildInternalFileUrl(key) {
  return `/api/files/${key}`
}

function quoteSql(value) {
  if (value === null || value === undefined) return 'NULL'
  return `'${String(value).replaceAll("'", "''")}'`
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: appDir,
    encoding: 'utf8',
    stdio: 'pipe',
    env: process.env,
    ...options,
  })

  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`)
  }
}

function uploadFile(target, localPath, r2Key) {
  const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
  run(command, [
    'exec',
    'wrangler',
    'r2',
    'object',
    'put',
    `nano-banana-uploads/${r2Key}`,
    '--file',
    localPath,
    target,
  ])
}

function executeSql(target, sql) {
  const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
  run(command, [
    'exec',
    'wrangler',
    'd1',
    'execute',
    databaseName,
    target,
    '--command',
    sql,
  ])
}

function fetchUserExists(target, userId) {
  const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
  const result = spawnSync(command, [
    'exec',
    'wrangler',
    'd1',
    'execute',
    databaseName,
    target,
    '--command',
    `SELECT id FROM users WHERE id = ${quoteSql(userId)} LIMIT 1`,
  ], {
    cwd: appDir,
    encoding: 'utf8',
    stdio: 'pipe',
    env: process.env,
  })

  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)

  if (result.status !== 0) {
    throw new Error('Failed to validate user id')
  }

  return result.stdout.includes(`"id": "${userId}"`)
}

function ensureFileExists(filePath, label) {
  if (!filePath) {
    throw new Error(`${label} is required`)
  }
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} not found: ${filePath}`)
  }
}

function normalizeEntry(entry, manifestDir) {
  const mediaPath = path.resolve(manifestDir, entry.mediaPath || entry.local_video || entry.video || '')
  const thumbnailPath = path.resolve(manifestDir, entry.thumbnailPath || entry.cover_image || entry.thumbnail || mediaPath)
  const workflowJsonPathValue = entry.workflowJsonPath || entry.local_workflow || entry.workflow || ''
  const workflowJsonPath = workflowJsonPathValue
    ? path.resolve(manifestDir, workflowJsonPathValue)
    : ''

  ensureFileExists(mediaPath, 'mediaPath')
  ensureFileExists(thumbnailPath, 'thumbnailPath')
  if (workflowJsonPath) ensureFileExists(workflowJsonPath, 'workflowJsonPath')

  const sourceUrl = String(entry.sourceUrl || entry.source_url || '').trim()
  const importKey = String(entry.importKey || entry.import_key || '').trim() || buildImportKey(sourceUrl, mediaPath)

  return {
    importKey,
    title: String(entry.title || entry.name || path.parse(mediaPath).name).trim(),
    description: String(entry.description || '').trim(),
    prompt: String(entry.prompt || '').trim(),
    sourceUrl,
    sourceType: normalizeSourceType(entry.sourceType || entry.source_type || ''),
    sourceAuthorName: String(entry.sourceAuthorName || entry.author_name || entry.author || '').trim(),
    sourceAuthorAvatar: String(entry.sourceAuthorAvatar || entry.author_avatar || '').trim(),
    mediaPath,
    thumbnailPath,
    workflowJsonPath,
    mediaType: normalizeMediaType(entry.mediaType || entry.media_type || '', mediaPath),
    workflowId: String(entry.workflowId || entry.workflow_id || '').trim(),
    publishedAt: String(entry.publishedAt || entry.published_at || '').trim(),
    isPublic: normalizeBoolean(entry.isPublic || entry.is_public, true),
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const manifestPath = path.resolve(process.cwd(), args.manifest)
  const manifestDir = path.dirname(manifestPath)
  if (!fetchUserExists(args.target, args.userId)) {
    throw new Error(`User not found in D1: ${args.userId}`)
  }
  const items = parseManifest(manifestPath).map((entry) => normalizeEntry(entry, manifestDir))

  console.log(`Loaded ${items.length} manifest items`)

  for (const item of items) {
    const mediaKey = buildR2Key('uploads', args.userId, item.mediaPath)
    const thumbnailKey = buildR2Key('uploads', args.userId, item.thumbnailPath)
    const workflowJsonKey = item.workflowJsonPath
      ? buildR2Key('uploads', args.userId, item.workflowJsonPath)
      : ''

    const mediaUrl = buildInternalFileUrl(mediaKey)
    const thumbnailUrl = buildInternalFileUrl(thumbnailKey)
    const workflowJsonUrl = workflowJsonKey ? buildInternalFileUrl(workflowJsonKey) : ''

    console.log(`\n==> Importing ${item.title}`)
    console.log(`    import_key: ${item.importKey}`)

    if (!args.dryRun) {
      uploadFile(args.target, item.mediaPath, mediaKey)
      uploadFile(args.target, item.thumbnailPath, thumbnailKey)
      if (item.workflowJsonPath) {
        uploadFile(args.target, item.workflowJsonPath, workflowJsonKey)
      }
    }

    const sql = `
      INSERT INTO published_outputs (
        id, user_id, workflow_id, source_mode, source_type, source_author_name,
        source_author_avatar, import_key, workflow_json_url, title, description,
        prompt, source_url, thumbnail, media_url, media_type, is_public,
        published_at, created_at, updated_at
      ) VALUES (
        lower(hex(randomblob(16))),
        ${quoteSql(args.userId)},
        ${quoteSql(item.workflowId || null)},
        'import',
        ${quoteSql(item.sourceType)},
        ${quoteSql(item.sourceAuthorName)},
        ${quoteSql(item.sourceAuthorAvatar)},
        ${quoteSql(item.importKey)},
        ${quoteSql(workflowJsonUrl)},
        ${quoteSql(item.title)},
        ${quoteSql(item.description)},
        ${quoteSql(item.prompt)},
        ${quoteSql(item.sourceUrl)},
        ${quoteSql(thumbnailUrl)},
        ${quoteSql(mediaUrl)},
        ${quoteSql(item.mediaType)},
        ${item.isPublic ? 1 : 0},
        ${quoteSql(item.publishedAt || new Date().toISOString())},
        datetime('now'),
        datetime('now')
      )
      ON CONFLICT(import_key) DO UPDATE SET
        workflow_id = excluded.workflow_id,
        source_mode = 'import',
        source_type = excluded.source_type,
        source_author_name = excluded.source_author_name,
        source_author_avatar = excluded.source_author_avatar,
        workflow_json_url = excluded.workflow_json_url,
        title = excluded.title,
        description = excluded.description,
        prompt = excluded.prompt,
        source_url = excluded.source_url,
        thumbnail = excluded.thumbnail,
        media_url = excluded.media_url,
        media_type = excluded.media_type,
        is_public = excluded.is_public,
        published_at = excluded.published_at,
        updated_at = datetime('now');
    `

    if (args.dryRun) {
      console.log('    dry-run: skipping upload and D1 write')
      continue
    }

    executeSql(args.target, sql)
  }
}

main()
