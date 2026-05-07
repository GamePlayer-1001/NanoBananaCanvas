/**
 * [INPUT]: 依赖 Node.js fs/os/path/child_process，依赖 wrangler CLI，依赖远端/本地 D1 与 R2，依赖 agent_audit_logs 旧 JSON 正文
 * [OUTPUT]: 对外提供 Agent 审计历史回填脚本，把大 JSON 上传到 R2，并把 D1 记录回写成指针/摘要/存在性索引
 * [POS]: scripts 的一次性数据库瘦身工具，被手工运维复用，负责把历史 agent_audit_logs 从 D1 正文迁到 R2
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const appDir = path.resolve(scriptDir, '..')
const databaseName = 'nano-banana-canvas-db'
const bucketName = 'nano-banana-uploads'
const batchSize = 20

function resolveTargetFlag(args) {
  if (args.includes('--remote')) return '--remote'
  if (args.includes('--local')) return '--local'
  return '--remote'
}

function getCommand() {
  return process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
}

function runWrangler(args, options = {}) {
  const result = spawnSync(getCommand(), ['exec', 'wrangler', ...args], {
    cwd: appDir,
    encoding: 'utf8',
    stdio: 'pipe',
    env: process.env,
    ...options,
  })

  if (result.status !== 0) {
    const message = [
      `wrangler ${args.join(' ')} failed with status ${result.status}`,
      result.stdout ?? '',
      result.stderr ?? '',
    ]
      .join('\n')
      .trim()
    throw new Error(message || `wrangler ${args.join(' ')} failed`)
  }

  return result.stdout
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

function escapeSqlString(value) {
  return String(value).replaceAll("'", "''")
}

function parseStoredJson(value) {
  if (typeof value !== 'string' || value.length === 0) {
    return undefined
  }

  try {
    return JSON.parse(value)
  } catch {
    return undefined
  }
}

function hasValue(value) {
  if (value == null) return false
  if (typeof value === 'string') return value.length > 0
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value).length > 0
  return true
}

function toFlag(value) {
  return hasValue(value) ? 1 : 0
}

function summarizePayload(payload) {
  const summary = {}

  if (payload.plan && typeof payload.plan === 'object' && typeof payload.plan.summary === 'string') {
    summary.planSummary = payload.plan.summary
  }
  if (Array.isArray(payload.alternatives)) {
    summary.alternativeCount = payload.alternatives.length
  }
  if (payload.result && typeof payload.result === 'object' && !Array.isArray(payload.result)) {
    summary.resultKeyCount = Object.keys(payload.result).length
  }
  if (
    payload.replaySnapshot &&
    typeof payload.replaySnapshot === 'object' &&
    typeof payload.replaySnapshot.changeSummary === 'string'
  ) {
    summary.replayChangeSummary = payload.replaySnapshot.changeSummary
  }
  if (
    payload.canvasSummary &&
    typeof payload.canvasSummary === 'object' &&
    typeof payload.canvasSummary.nodeCount === 'number'
  ) {
    summary.canvasNodeCount = payload.canvasSummary.nodeCount
  }

  return summary
}

function buildPayloadKey(row) {
  return `agent-audit/${row.user_id}/${row.workflow_id}/${row.id}.json`
}

function putObject(key, body) {
  const tempFile = path.join(os.tmpdir(), `nb-agent-audit-${Date.now()}-${Math.random()}.json`)
  fs.writeFileSync(tempFile, body, 'utf8')
  try {
    const targetArgs = process.argv.includes('--local') ? ['--local'] : ['--remote']
    runWrangler([
      'r2',
      'object',
      'put',
      `${bucketName}/${key}`,
      '--file',
      tempFile,
      '--content-type',
      'application/json',
      ...targetArgs,
    ])
  } finally {
    fs.rmSync(tempFile, { force: true })
  }
}

function backfillRows(targetFlag, rows) {
  let migrated = 0

  for (const row of rows) {
    const payload = {
      canvasSummary: parseStoredJson(row.canvas_summary),
      plan: parseStoredJson(row.plan_json),
      alternatives: parseStoredJson(row.alternatives_json),
      result: parseStoredJson(row.result_json),
      replaySnapshot: parseStoredJson(row.replay_snapshot),
      metadata: parseStoredJson(row.metadata_json),
    }

    const key = buildPayloadKey(row)
    putObject(key, JSON.stringify(payload))

    const summaryJson = JSON.stringify(summarizePayload(payload))
    const sql = `
      UPDATE agent_audit_logs
      SET payload_r2_key = '${escapeSqlString(key)}',
          payload_summary_json = '${escapeSqlString(summaryJson)}',
          has_canvas_summary = ${toFlag(payload.canvasSummary)},
          has_plan = ${toFlag(payload.plan)},
          has_alternatives = ${toFlag(payload.alternatives)},
          has_result = ${toFlag(payload.result)},
          has_replay_snapshot = ${toFlag(payload.replaySnapshot)},
          has_metadata = ${toFlag(payload.metadata)},
          canvas_summary = NULL,
          plan_json = NULL,
          alternatives_json = NULL,
          result_json = NULL,
          replay_snapshot = NULL,
          metadata_json = NULL
      WHERE id = '${escapeSqlString(row.id)}'
    `

    runD1Json(targetFlag, sql)
    migrated += 1
  }

  return migrated
}

function main() {
  const targetFlag = resolveTargetFlag(process.argv.slice(2))
  let totalMigrated = 0

  while (true) {
    const query = `
      SELECT id, user_id, workflow_id, canvas_summary, plan_json, alternatives_json, result_json, replay_snapshot, metadata_json
      FROM agent_audit_logs
      WHERE payload_r2_key IS NULL
        AND (
          plan_json IS NOT NULL OR
          alternatives_json IS NOT NULL OR
          result_json IS NOT NULL OR
          replay_snapshot IS NOT NULL OR
          canvas_summary IS NOT NULL OR
          metadata_json IS NOT NULL
        )
      ORDER BY created_at ASC
      LIMIT ${batchSize}
    `

    const result = runD1Json(targetFlag, query)
    const rows = result?.[0]?.results ?? []

    if (!rows.length) {
      break
    }

    totalMigrated += backfillRows(targetFlag, rows)
  }

  if (totalMigrated === 0) {
    console.log('No agent audit rows need backfill.')
    return
  }

  console.log(`Backfilled ${totalMigrated} agent audit rows to R2.`)
}

main()
