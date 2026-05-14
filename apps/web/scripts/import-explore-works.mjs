/**
 * [INPUT]: 依赖 Node.js fs/path/process/crypto，依赖 wrangler CLI，依赖 apps/web/db schema 与 manifest 文件
 * [OUTPUT]: 对外提供 Explore 批量导入脚本 (CSV/JSON manifest -> R2 上传 -> published_outputs upsert，并支持 categoryId/categorySlug 分类映射)
 * [POS]: scripts 的 Explore 导入运维入口，被内容运营与数据迁移复用，负责把本地/外部作品安全导入为公开作品实体并落入可筛选分类
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
const wranglerCliPath = path.resolve(appDir, 'node_modules', 'wrangler', 'bin', 'wrangler.js')

const ALLOWED_SOURCE_TYPES = new Set(['civitai', 'manual', 'other'])
const ALLOWED_MEDIA_TYPES = new Set(['image', 'video'])

function parseArgs(argv) {
  const args = {
    manifest: '',
    userId: '',
    target: '--local',
    dryRun: false,
    fakeAuthors: false,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (token === '--manifest') args.manifest = argv[++i] ?? ''
    else if (token === '--user-id') args.userId = argv[++i] ?? ''
    else if (token === '--remote') args.target = '--remote'
    else if (token === '--local') args.target = '--local'
    else if (token === '--dry-run') args.dryRun = true
    else if (token === '--fake-authors') args.fakeAuthors = true
  }

  if (!args.manifest || (!args.userId && !args.fakeAuthors)) {
    throw new Error('Usage: node ./scripts/import-explore-works.mjs --manifest <file> [--user-id <userId>] [--local|--remote] [--dry-run] [--fake-authors]')
  }

  return args
}

function parseCsvRows(raw) {
  const rows = []
  let currentCell = ''
  let currentRow = []
  let inQuotes = false

  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i]
    const next = raw[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        currentCell += '"'
        i += 1
        continue
      }

      inQuotes = !inQuotes
      continue
    }

    if (char === ',' && !inQuotes) {
      currentRow.push(currentCell.trim())
      currentCell = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        i += 1
      }

      currentRow.push(currentCell.trim())
      currentCell = ''

      const hasContent = currentRow.some((cell) => cell.length > 0)
      if (hasContent) {
        rows.push(currentRow)
      }

      currentRow = []
      continue
    }

    currentCell += char
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim())
    const hasContent = currentRow.some((cell) => cell.length > 0)
    if (hasContent) {
      rows.push(currentRow)
    }
  }

  return rows
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

  const rows = parseCsvRows(raw)
  if (rows.length < 2) {
    return []
  }

  const headers = rows[0]
  return rows.slice(1).map((values) => {
    return headers.reduce((acc, header, index) => {
      acc[header] = values[index] ?? ''
      return acc
    }, {})
  })
}

function normalizeOptionalText(value) {
  const normalized = String(value ?? '').trim()
  if (!normalized) return ''
  if (['（空）', '(空)', '空', 'N/A', 'n/a', 'null', 'NULL'].includes(normalized)) {
    return ''
  }
  return normalized
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

function slugifyAuthorName(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function randomSuffix(length = 6) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'
  return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
}

function quoteSql(value) {
  if (value === null || value === undefined) return 'NULL'
  return `'${String(value).replaceAll("'", "''")}'`
}

function spawnCommand(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: appDir,
    encoding: 'utf8',
    stdio: 'pipe',
    env: process.env,
    ...options,
  })
}

function run(command, args, options = {}) {
  const result = spawnCommand(command, args, options)

  if (result.error) {
    throw result.error
  }

  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`)
  }
}

function runAndCapture(command, args, options = {}) {
  const result = spawnCommand(command, args, options)

  if (result.error) {
    throw result.error
  }

  return result
}

function getWranglerArgs(commandArgs) {
  return [
    '--no-warnings',
    '--experimental-vm-modules',
    wranglerCliPath,
    ...commandArgs,
  ]
}

function uploadFile(target, localPath, r2Key) {
  run(process.execPath, getWranglerArgs([
    'r2',
    'object',
    'put',
    `nano-banana-uploads/${r2Key}`,
    '--file',
    localPath,
    target,
  ]))
}

function executeSql(target, sql) {
  run(process.execPath, getWranglerArgs([
    'd1',
    'execute',
    databaseName,
    target,
    '--command',
    sql,
  ]))
}

function fetchUserExists(target, userId) {
  const rows = fetchJsonResults(
    target,
    `SELECT id FROM users WHERE id = ${quoteSql(userId)} LIMIT 1`,
  )
  return rows.some((row) => row.id === userId)
}

function fetchJsonResults(target, sql) {
  const result = runAndCapture(process.execPath, getWranglerArgs([
    'd1',
    'execute',
    databaseName,
    target,
    '--command',
    sql,
    '--json',
  ]))

  if (result.stderr) process.stderr.write(result.stderr)

  if (result.status !== 0) {
    throw new Error(`Failed to query D1 JSON: ${sql}`)
  }

  const raw = result.stdout || '[]'
  const jsonStart = raw.indexOf('[')
  if (jsonStart === -1) {
    throw new Error(`Unexpected D1 JSON output: ${raw}`)
  }
  const payload = JSON.parse(raw.slice(jsonStart))
  return payload?.[0]?.results ?? []
}

function fetchExistingPublishedOutputId(target, importKey) {
  if (!importKey) return ''
  const rows = fetchJsonResults(
    target,
    `SELECT id FROM published_outputs WHERE import_key = ${quoteSql(importKey)} LIMIT 1`,
  )
  return rows[0]?.id ?? ''
}

function fetchCategoryIdBySlug(target, slug) {
  if (!slug) return ''

  const rows = fetchJsonResults(
    target,
    `SELECT id FROM categories WHERE slug = ${quoteSql(slug)} LIMIT 1`,
  )

  return rows[0]?.id ?? ''
}

function buildFakeAuthorIdentity(authorName) {
  const normalizedName = String(authorName || '').trim()
  if (!normalizedName) {
    throw new Error('Fake author mode requires sourceAuthorName')
  }

  return {
    normalizedName,
    slug: slugifyAuthorName(normalizedName) || randomSuffix(8),
  }
}

function ensureFakeAuthorUser(target, authorName, avatarUrl = '', dryRun = false) {
  const { normalizedName, slug } = buildFakeAuthorIdentity(authorName)
  const identityKey = `import:author:${slug}`
  const existingRows = fetchJsonResults(
    target,
    `SELECT id FROM users WHERE clerk_id = ${quoteSql(identityKey)} LIMIT 1`,
  )
  if (existingRows.length > 0) {
    return existingRows[0].id
  }

  if (dryRun) {
    return `dryrun-${slug}`.slice(0, 21)
  }

  const email = `${slug}@${randomSuffix(6)}.com`
  const userId = crypto.randomBytes(10).toString('hex').slice(0, 21)
  const safeDisplayName = normalizedName.replaceAll("'", "''")
  const safeAvatar = String(avatarUrl || '').replaceAll("'", "''")
  const safeIdentity = identityKey.replaceAll("'", "''")
  const safeEmail = email.replaceAll("'", "''")

  executeSql(
    target,
    `INSERT INTO users (
      id, clerk_id, email, username, first_name, last_name, name, avatar_url, plan, membership_status, created_at, updated_at
    ) VALUES (
      '${userId}',
      '${safeIdentity}',
      '${safeEmail}',
      '',
      '',
      '',
      '${safeDisplayName}',
      '${safeAvatar}',
      'free',
      'free',
      datetime('now'),
      datetime('now')
    )`,
  )

  return userId
}

function resolveOwnerUserId(target, item, args) {
  if (!args.fakeAuthors) {
    return args.userId
  }

  return ensureFakeAuthorUser(
    target,
    item.sourceAuthorName,
    item.sourceAuthorAvatar,
    args.dryRun,
  )
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
  const mediaPathValue = normalizeOptionalText(entry.mediaPath || entry.local_video || entry.video)
  const thumbnailPathValue = normalizeOptionalText(entry.thumbnailPath || entry.cover_image || entry.thumbnail)
  const workflowJsonPathValue = normalizeOptionalText(entry.workflowJsonPath || entry.local_workflow || entry.workflow)
  const mediaPath = path.resolve(manifestDir, mediaPathValue)
  const inferredMediaType = normalizeMediaType(entry.mediaType || entry.media_type || '', mediaPath)
  const thumbnailPath = thumbnailPathValue
    ? path.resolve(manifestDir, thumbnailPathValue)
    : inferredMediaType === 'image'
      ? mediaPath
      : ''
  const workflowJsonPath = workflowJsonPathValue
    ? path.resolve(manifestDir, workflowJsonPathValue)
    : ''

  ensureFileExists(mediaPath, 'mediaPath')
  if (thumbnailPath) ensureFileExists(thumbnailPath, 'thumbnailPath')
  if (workflowJsonPath) ensureFileExists(workflowJsonPath, 'workflowJsonPath')

  const sourceUrl = normalizeOptionalText(entry.sourceUrl || entry.source_url || '')
  const importKey = normalizeOptionalText(entry.importKey || entry.import_key || '') || buildImportKey(sourceUrl, mediaPath)

  return {
    importKey,
    title: normalizeOptionalText(entry.title || entry.name || path.parse(mediaPath).name),
    description: normalizeOptionalText(entry.description || ''),
    prompt: normalizeOptionalText(entry.prompt || ''),
    sourceUrl,
    sourceType: normalizeSourceType(entry.sourceType || entry.source_type || ''),
    sourceAuthorName: normalizeOptionalText(entry.sourceAuthorName || entry.author_name || entry.author || ''),
    sourceAuthorAvatar: normalizeOptionalText(entry.sourceAuthorAvatar || entry.author_avatar || ''),
    mediaPath,
    thumbnailPath,
    workflowJsonPath,
    mediaType: inferredMediaType,
    workflowId: normalizeOptionalText(entry.workflowId || entry.workflow_id || ''),
    categoryId: normalizeOptionalText(entry.categoryId || entry.category_id || ''),
    categorySlug: normalizeOptionalText(entry.categorySlug || entry.category_slug || ''),
    publishedAt: normalizeOptionalText(entry.publishedAt || entry.published_at || ''),
    isPublic: normalizeBoolean(entry.isPublic || entry.is_public, true),
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const manifestPath = path.resolve(process.cwd(), args.manifest)
  const manifestDir = path.dirname(manifestPath)
  if (args.userId && !fetchUserExists(args.target, args.userId)) {
    throw new Error(`User not found in D1: ${args.userId}`)
  }
  const items = parseManifest(manifestPath).map((entry) => normalizeEntry(entry, manifestDir))

  console.log(`Loaded ${items.length} manifest items`)

  for (const item of items) {
    const ownerUserId = resolveOwnerUserId(args.target, item, args)
    const existingPublishedOutputId = fetchExistingPublishedOutputId(args.target, item.importKey)
    const resolvedCategoryId =
      item.categoryId || fetchCategoryIdBySlug(args.target, item.categorySlug)

    const mediaKey = buildR2Key('uploads', ownerUserId, item.mediaPath)
    const thumbnailKey = item.thumbnailPath
      ? buildR2Key('uploads', ownerUserId, item.thumbnailPath)
      : ''
    const workflowJsonKey = item.workflowJsonPath
      ? buildR2Key('uploads', ownerUserId, item.workflowJsonPath)
      : ''

    const mediaUrl = buildInternalFileUrl(mediaKey)
    const thumbnailUrl = thumbnailKey ? buildInternalFileUrl(thumbnailKey) : ''
    const workflowJsonUrl = workflowJsonKey ? buildInternalFileUrl(workflowJsonKey) : ''

    console.log(`\n==> Importing ${item.title}`)
    console.log(`    import_key: ${item.importKey}`)
    console.log(`    owner_user_id: ${ownerUserId}`)
    if (existingPublishedOutputId) {
      console.log(`    existing_output_id: ${existingPublishedOutputId}`)
    }

    if (!args.dryRun) {
      uploadFile(args.target, item.mediaPath, mediaKey)
      if (item.thumbnailPath && thumbnailKey) {
        uploadFile(args.target, item.thumbnailPath, thumbnailKey)
      }
      if (item.workflowJsonPath) {
        uploadFile(args.target, item.workflowJsonPath, workflowJsonKey)
      }
    }

    const publishedAt = quoteSql(item.publishedAt || new Date().toISOString())
    const sql = existingPublishedOutputId
      ? `
        UPDATE published_outputs
        SET
          user_id = ${quoteSql(ownerUserId)},
          workflow_id = ${quoteSql(item.workflowId || null)},
          source_mode = 'import',
          source_type = ${quoteSql(item.sourceType)},
          source_author_name = ${quoteSql(item.sourceAuthorName)},
          source_author_avatar = ${quoteSql(item.sourceAuthorAvatar)},
          workflow_json_url = ${quoteSql(workflowJsonUrl)},
          title = ${quoteSql(item.title)},
          description = ${quoteSql(item.description)},
          prompt = ${quoteSql(item.prompt)},
          category_id = ${quoteSql(resolvedCategoryId || null)},
          source_url = ${quoteSql(item.sourceUrl)},
          thumbnail = ${quoteSql(thumbnailUrl || null)},
          media_url = ${quoteSql(mediaUrl)},
          media_type = ${quoteSql(item.mediaType)},
          is_public = ${item.isPublic ? 1 : 0},
          published_at = ${publishedAt},
          updated_at = datetime('now')
        WHERE id = ${quoteSql(existingPublishedOutputId)};
      `
      : `
        INSERT INTO published_outputs (
          id, user_id, workflow_id, source_mode, source_type, source_author_name,
          source_author_avatar, import_key, workflow_json_url, title, description, category_id,
          prompt, source_url, thumbnail, media_url, media_type, is_public,
          published_at, created_at, updated_at
        ) VALUES (
          lower(hex(randomblob(16))),
          ${quoteSql(ownerUserId)},
          ${quoteSql(item.workflowId || null)},
          'import',
          ${quoteSql(item.sourceType)},
          ${quoteSql(item.sourceAuthorName)},
          ${quoteSql(item.sourceAuthorAvatar)},
          ${quoteSql(item.importKey)},
          ${quoteSql(workflowJsonUrl)},
          ${quoteSql(item.title)},
          ${quoteSql(item.description)},
          ${quoteSql(resolvedCategoryId || null)},
          ${quoteSql(item.prompt)},
          ${quoteSql(item.sourceUrl)},
          ${quoteSql(thumbnailUrl || null)},
          ${quoteSql(mediaUrl)},
          ${quoteSql(item.mediaType)},
          ${item.isPublic ? 1 : 0},
          ${publishedAt},
          datetime('now'),
          datetime('now')
        );
      `

    if (args.dryRun) {
      console.log('    dry-run: skipping upload and D1 write')
      continue
    }

    executeSql(args.target, sql)
  }
}

main()
