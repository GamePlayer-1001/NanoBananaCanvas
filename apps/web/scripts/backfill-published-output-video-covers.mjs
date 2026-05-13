/**
 * [INPUT]: 依赖 Node.js fs/os/path/process/child_process，依赖 wrangler CLI，依赖 ffmpeg，
 *          依赖远端/本地 D1 published_outputs 与 R2 媒体对象
 * [OUTPUT]: 对外提供已发布视频封面批量回填脚本（扫描缺失 thumbnail 或误把视频写成 thumbnail 的公开视频 -> 从 R2 下载原视频 -> ffmpeg 抽帧 -> 上传封面图 -> 回写 D1）
 * [POS]: scripts 的历史数据修复工具，被手工运维复用，负责一次性补齐旧 published_outputs 的视频封面
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const appDir = path.resolve(scriptDir, '..')
const databaseName = 'nano-banana-canvas-db'
const bucketName = 'nano-banana-uploads'
const defaultBatchSize = 20
const internalFilePrefix = '/api/files/'
const wranglerCliPath = path.resolve(appDir, 'node_modules', 'wrangler', 'bin', 'wrangler.js')

function parseArgs(argv) {
  const args = {
    targetFlag: '--remote',
    dryRun: false,
    limit: 0,
    batchSize: defaultBatchSize,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (token === '--local') args.targetFlag = '--local'
    else if (token === '--remote') args.targetFlag = '--remote'
    else if (token === '--dry-run') args.dryRun = true
    else if (token === '--limit') args.limit = Number(argv[++i] ?? 0)
    else if (token === '--batch-size') args.batchSize = Number(argv[++i] ?? defaultBatchSize)
  }

  if (!Number.isFinite(args.limit) || args.limit < 0) {
    throw new Error('`--limit` must be a non-negative number')
  }

  if (!Number.isFinite(args.batchSize) || args.batchSize <= 0) {
    throw new Error('`--batch-size` must be a positive number')
  }

  return args
}

function runProcess(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: appDir,
    encoding: 'utf8',
    stdio: 'pipe',
    env: process.env,
    ...options,
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    const message = [
      `${command} ${args.join(' ')} failed with status ${result.status}`,
      result.stdout ?? '',
      result.stderr ?? '',
    ]
      .join('\n')
      .trim()
    throw new Error(message)
  }

  return result.stdout ?? ''
}

function runWrangler(args) {
  return runProcess(process.execPath, ['--no-warnings', wranglerCliPath, ...args])
}

function compactSql(sql) {
  return sql.replace(/\s+/g, ' ').trim()
}

function runD1Json(targetFlag, sql) {
  const output = runWrangler([
    'd1',
    'execute',
    databaseName,
    targetFlag,
    '--json',
    '--command',
    compactSql(sql),
  ])

  return JSON.parse(output)
}

function runD1(targetFlag, sql) {
  runWrangler([
    'd1',
    'execute',
    databaseName,
    targetFlag,
    '--command',
    compactSql(sql),
  ])
}

function escapeSqlString(value) {
  return String(value).replaceAll("'", "''")
}

function quoteSql(value) {
  if (value == null) return 'NULL'
  return `'${escapeSqlString(value)}'`
}

function extractR2KeyFromFileUrl(url) {
  if (typeof url !== 'string') return null
  if (!url.startsWith(internalFilePrefix)) return null
  return url.slice(internalFilePrefix.length).split('?')[0] || null
}

function buildInternalFileUrl(key) {
  return `${internalFilePrefix}${key}`
}

function isVideoLikeThumbnail(url) {
  const key = extractR2KeyFromFileUrl(url)
  if (!key) return false
  return /\.(mp4|mov|webm|m4v)$/i.test(key)
}

function downloadR2Object(targetFlag, key, outputPath) {
  runWrangler([
    'r2',
    'object',
    'get',
    `${bucketName}/${key}`,
    '--file',
    outputPath,
    targetFlag,
  ])
}

function uploadR2Object(targetFlag, key, inputPath) {
  runWrangler([
    'r2',
    'object',
    'put',
    `${bucketName}/${key}`,
    '--file',
    inputPath,
    '--content-type',
    'image/jpeg',
    targetFlag,
  ])
}

function runFfmpeg(inputPath, outputPath) {
  runProcess('ffmpeg', [
    '-y',
    '-ss',
    '00:00:00.200',
    '-i',
    inputPath,
    '-frames:v',
    '1',
    '-q:v',
    '2',
    outputPath,
  ])
}

function buildBackfillCoverKey(userId, outputId) {
  return `uploads/${userId}/published-output-covers/${outputId}.jpg`
}

function getCandidateRows(targetFlag, batchSize) {
  const result = runD1Json(
    targetFlag,
    `
      SELECT id, user_id, media_url, thumbnail
      FROM published_outputs
      WHERE is_public = 1
        AND media_type = 'video'
        AND (
          thumbnail IS NULL OR
          TRIM(thumbnail) = '' OR
          thumbnail = media_url OR
          thumbnail LIKE '%.mp4' OR
          thumbnail LIKE '%.mov' OR
          thumbnail LIKE '%.webm' OR
          thumbnail LIKE '%.m4v'
        )
      ORDER BY published_at DESC, created_at DESC
      LIMIT ${batchSize}
    `,
  )

  return result?.[0]?.results ?? []
}

function updateThumbnail(targetFlag, outputId, thumbnailUrl) {
  runD1(
    targetFlag,
    `
      UPDATE published_outputs
      SET thumbnail = ${quoteSql(thumbnailUrl)},
          updated_at = datetime('now')
      WHERE id = ${quoteSql(outputId)}
    `,
  )
}

function removeIfExists(filePath) {
  try {
    fs.rmSync(filePath, { force: true })
  } catch {
    // noop
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nb-video-cover-backfill-'))
  let processed = 0
  let updated = 0
  let skipped = 0

  try {
    while (true) {
      const remainingLimit = args.limit > 0 ? Math.max(args.limit - processed, 0) : args.batchSize
      if (args.limit > 0 && remainingLimit === 0) {
        break
      }

      const batchSize = Math.min(args.batchSize, remainingLimit || args.batchSize)
      const rows = getCandidateRows(args.targetFlag, batchSize)

      if (!rows.length) {
        break
      }

      for (const row of rows) {
        if (args.limit > 0 && processed >= args.limit) {
          break
        }

        processed += 1

        const mediaKey = extractR2KeyFromFileUrl(row.media_url)
        if (!mediaKey) {
          skipped += 1
          console.warn(`[skip] ${row.id} has non-internal media_url: ${row.media_url}`)
          continue
        }

        if (row.thumbnail && !isVideoLikeThumbnail(row.thumbnail) && row.thumbnail !== row.media_url) {
          skipped += 1
          console.warn(`[skip] ${row.id} already has usable thumbnail: ${row.thumbnail}`)
          continue
        }

        const inputPath = path.join(tempDir, `${row.id}.video`)
        const outputPath = path.join(tempDir, `${row.id}.jpg`)
        const thumbnailKey = buildBackfillCoverKey(row.user_id, row.id)
        const thumbnailUrl = buildInternalFileUrl(thumbnailKey)

        try {
          console.log(`[process] ${row.id}`)

          if (!args.dryRun) {
            downloadR2Object(args.targetFlag, mediaKey, inputPath)
            runFfmpeg(inputPath, outputPath)
            uploadR2Object(args.targetFlag, thumbnailKey, outputPath)
            updateThumbnail(args.targetFlag, row.id, thumbnailUrl)
          }

          updated += 1
          console.log(`  -> ${args.dryRun ? '[dry-run] ' : ''}${thumbnailUrl}`)
        } catch (error) {
          skipped += 1
          console.warn(`  -> skip ${row.id}: ${error instanceof Error ? error.message : String(error)}`)
        } finally {
          removeIfExists(inputPath)
          removeIfExists(outputPath)
        }
      }

      if (rows.length < batchSize) {
        break
      }
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }

  console.log(
    `Video cover backfill done. processed=${processed} updated=${updated} skipped=${skipped} dryRun=${args.dryRun}`,
  )
}

main()
