/**
 * [INPUT]: 依赖 Node.js fs/path/child_process，依赖 wrangler CLI，依赖 apps/web/db 下的 D1 迁移脚本
 * [OUTPUT]: 对外提供可重复执行的 D1 迁移入口，支持 `--local` 与 `--remote`，按固定顺序把生产运行时需要的 schema 补齐，并记录迁移历史
 * [POS]: scripts 的数据库迁移编排器，被 CI/CD 与本地运维复用，负责把“代码要求的 schema”同步到 Cloudflare D1 真相源，同时避免远端 import 权限导致部署中断
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const appDir = path.resolve(scriptDir, '..')
const dbDir = path.join(appDir, 'db')
const databaseName = 'nano-banana-canvas-db'
const migrationsTableName = 'schema_migrations'

const orderedMigrations = [
  'migration-008-media-runtime.sql',
  'migration-009-user-account-profile.sql',
  'migration-010-category-i18n.sql',
  'migration-011-billing-rebuild.sql',
  'migration-012-billing-metering.sql',
  'migration-013-daily-signin-credits.sql',
  'migration-013-video-analysis-history.sql',
  'migration-014-agent-audit.sql',
  'migration-015-model-pricing-credits-per-1k-units.sql',
  'migration-async-tasks.sql',
  'migration-execution-history.sql',
]

function resolveTargetFlag(args) {
  if (args.includes('--local')) {
    return '--local'
  }

  if (args.includes('--remote')) {
    return '--remote'
  }

  return '--local'
}

function ensureMigrationFilesExist() {
  const missing = orderedMigrations.filter(
    (fileName) => !fs.existsSync(path.join(dbDir, fileName)),
  )

  if (missing.length === 0) {
    return
  }

  throw new Error(`Missing migration files: ${missing.join(', ')}`)
}

function runWranglerD1Execute(targetFlag, sql) {
  const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
  const args = [
    'exec',
    'wrangler',
    'd1',
    'execute',
    databaseName,
    targetFlag,
    '--command',
    sql,
  ]

  const result = spawnSync(command, args, {
    cwd: appDir,
    encoding: 'utf8',
    stdio: 'pipe',
    env: process.env,
  })

  if (result.stdout) {
    process.stdout.write(result.stdout)
  }

  if (result.stderr) {
    process.stderr.write(result.stderr)
  }

  return result
}

function escapeSqlString(value) {
  return value.replaceAll("'", "''")
}

function stripSqlComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*--.*$/gm, '')
}

function splitSqlStatements(source) {
  return stripSqlComments(source)
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean)
}

function ensureMigrationsTable(targetFlag) {
  const sql = `
    CREATE TABLE IF NOT EXISTS ${migrationsTableName} (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `

  const result = runWranglerD1Execute(targetFlag, sql)
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function hasAppliedMigration(targetFlag, fileName) {
  const sql = `SELECT id FROM ${migrationsTableName} WHERE id = '${escapeSqlString(fileName)}' LIMIT 1`
  const result = runWranglerD1Execute(targetFlag, sql)
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }

  return result.stdout.includes(`"id": "${fileName}"`)
}

function markMigrationApplied(targetFlag, fileName) {
  const sql = `
    INSERT OR REPLACE INTO ${migrationsTableName} (id, applied_at)
    VALUES ('${escapeSqlString(fileName)}', datetime('now'))
  `

  const result = runWranglerD1Execute(targetFlag, sql)
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function isSafeDuplicateError(output) {
  return [
    'duplicate column name',
    'already exists',
    'UNIQUE constraint failed: schema_migrations.id',
  ].some((pattern) => output.includes(pattern))
}

function applyMigrationStatements(targetFlag, fileName) {
  const filePath = path.join(dbDir, fileName)
  const statements = splitSqlStatements(fs.readFileSync(filePath, 'utf8'))

  for (const statement of statements) {
    const result = runWranglerD1Execute(targetFlag, statement)

    if (result.status === 0) {
      continue
    }

    const combinedOutput = `${result.stdout ?? ''}\n${result.stderr ?? ''}`
    if (isSafeDuplicateError(combinedOutput)) {
      console.warn(`Skipping already-applied statement in ${fileName}`)
      continue
    }

    process.exit(result.status ?? 1)
  }
}

function main() {
  const targetFlag = resolveTargetFlag(process.argv.slice(2))
  ensureMigrationFilesExist()
  ensureMigrationsTable(targetFlag)

  for (const fileName of orderedMigrations) {
    if (hasAppliedMigration(targetFlag, fileName)) {
      console.log(`\n==> Skipping ${fileName} (${targetFlag.slice(2)})`)
      continue
    }

    console.log(`\n==> Applying ${fileName} (${targetFlag.slice(2)})`)
    applyMigrationStatements(targetFlag, fileName)
    markMigrationApplied(targetFlag, fileName)
  }
}

main()
