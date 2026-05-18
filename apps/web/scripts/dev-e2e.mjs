/**
 * [INPUT]: 依赖 Node.js child_process/path/fs，依赖 wrangler CLI 初始化本地 D1，依赖 next dev 启动 apps/web
 * [OUTPUT]: 对外提供 E2E 专用本地开发启动脚本，统一 D1 初始化与 OpenNext 持久化目录
 * [POS]: apps/web/scripts 的 E2E 启动编排器，避免 Playwright 启动链复用默认 `.wrangler/state` 触发 SQLite 锁冲突
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { existsSync, rmSync } from 'node:fs'
import path from 'node:path'
import { spawn, spawnSync } from 'node:child_process'

/* ─── Shared Persist Path ────────────────────────────── */

const projectRoot = process.cwd()
const persistRoot = path.join(projectRoot, '.wrangler', 'e2e-state')
const stateVersion = 'v3'
const d1PersistPath = path.join(persistRoot, stateVersion, 'd1')

function run(command, args, extraEnv = {}) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    env: { ...process.env, ...extraEnv },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

/* ─── Reset Dedicated Local D1 State ─────────────────── */

if (existsSync(d1PersistPath)) {
  rmSync(d1PersistPath, {
    recursive: true,
    force: true,
    maxRetries: 10,
    retryDelay: 300,
  })
}

run('pnpm', [
  'exec',
  'wrangler',
  'd1',
  'execute',
  'nano-banana-canvas-db',
  '--local',
  `--persist-to=${persistRoot}`,
  '--file=./db/schema.sql',
])

/* ─── Start Next Dev With Matching Cloudflare State ──── */

const server = spawn('next', ['dev', '--turbopack', '--port', '3000'], {
  cwd: projectRoot,
  env: {
    ...process.env,
    NEXT_DEV_CF_PERSIST_PATH: path.join(persistRoot, stateVersion),
  },
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

server.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})
