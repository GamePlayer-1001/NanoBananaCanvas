/**
 * [INPUT]: 依赖 Node.js fs/path/child_process，依赖 wrangler CLI，依赖 apps/web/db 下的 D1 迁移脚本
 * [OUTPUT]: 对外提供可重复执行的 D1 迁移入口，支持 `--local` 与 `--remote`，按固定顺序把生产运行时需要的 schema 补齐
 * [POS]: scripts 的数据库迁移编排器，被 CI/CD 与本地运维复用，负责把“代码要求的 schema”同步到 Cloudflare D1 真相源
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

const orderedMigrations = [
  'migration-008-media-runtime.sql',
  'migration-009-user-account-profile.sql',
  'migration-010-category-i18n.sql',
  'migration-011-billing-rebuild.sql',
  'migration-012-billing-metering.sql',
  'migration-013-daily-signin-credits.sql',
  'migration-013-video-analysis-history.sql',
  'migration-014-agent-audit.sql',
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

function runWranglerD1Execute(targetFlag, fileName) {
  const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
  const args = [
    'exec',
    'wrangler',
    'd1',
    'execute',
    databaseName,
    targetFlag,
    '--file',
    `./db/${fileName}`,
  ]

  const result = spawnSync(command, args, {
    cwd: appDir,
    stdio: 'inherit',
    env: process.env,
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function main() {
  const targetFlag = resolveTargetFlag(process.argv.slice(2))
  ensureMigrationFilesExist()

  for (const fileName of orderedMigrations) {
    console.log(`\n==> Applying ${fileName} (${targetFlag.slice(2)})`)
    runWranglerD1Execute(targetFlag, fileName)
  }
}

main()
