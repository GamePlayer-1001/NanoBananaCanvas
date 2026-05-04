/**
 * [INPUT]: 依赖 Node.js process argv，依赖 child_process 执行 wrangler d1，依赖本目录现有运维脚本约定
 * [OUTPUT]: 对外提供 grant-user-entitlements.mjs，可按 email 向 D1 远端或本地授予套餐镜像与永久积分
 * [POS]: apps/web/scripts 的账户运维脚本，负责把指定用户提升为指定 plan 并补齐订阅/积分镜像
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const DEFAULT_DB_NAME = 'nano-banana-canvas-db'
const UNLIMITED_PERMANENT_BALANCE = 2147483647
const APPS_WEB_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PLAN_SNAPSHOTS = {
  standard: { monthlyCredits: 1600, storageGB: 10 },
  pro: { monthlyCredits: 5400, storageGB: 50 },
  ultimate: { monthlyCredits: 17000, storageGB: 200 },
}

function parseArgs(argv) {
  const parsed = {
    email: '',
    plan: 'ultimate',
    dbName: DEFAULT_DB_NAME,
    local: false,
    dryRun: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]

    if (token === '--email') {
      parsed.email = argv[index + 1] ?? ''
      index += 1
      continue
    }

    if (token === '--plan') {
      parsed.plan = argv[index + 1] ?? parsed.plan
      index += 1
      continue
    }

    if (token === '--db') {
      parsed.dbName = argv[index + 1] ?? parsed.dbName
      index += 1
      continue
    }

    if (token === '--local') {
      parsed.local = true
      continue
    }

    if (token === '--dry-run') {
      parsed.dryRun = true
    }
  }

  return parsed
}

function assertArgs(args) {
  if (!args.email) {
    throw new Error('Missing required --email')
  }

  if (!Object.hasOwn(PLAN_SNAPSHOTS, args.plan)) {
    throw new Error(`Unsupported --plan "${args.plan}"`)
  }
}

function escapeSql(value) {
  return String(value).replaceAll("'", "''")
}

function runPnpmCommand(args) {
  if (process.platform === 'win32') {
    return execFileSync('cmd.exe', ['/d', '/s', '/c', 'pnpm', ...args], {
      cwd: APPS_WEB_DIR,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  }

  return execFileSync('pnpm', args, {
    cwd: APPS_WEB_DIR,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function runWranglerD1({ dbName, local, sql }) {
  const args = ['exec', 'wrangler', 'd1', 'execute', dbName]

  if (!local) {
    args.push('--remote')
  }

  args.push('--command', sql)
  return runPnpmCommand(args)
}

function parseWranglerJson(output) {
  const match = output.match(/\[\s*\{[\s\S]*\}\s*\]\s*$/)
  if (!match) {
    throw new Error('Failed to parse wrangler JSON output')
  }

  return JSON.parse(match[0])
}

function readColumnSet(output) {
  const payload = parseWranglerJson(output)
  const rows = payload[0]?.results ?? []
  return new Set(rows.map((row) => row.name).filter(Boolean))
}

function readSchemaInfo({ dbName, local }) {
  return {
    subscriptions: readColumnSet(
      runWranglerD1({
        dbName,
        local,
        sql: "PRAGMA table_info('subscriptions');",
      }),
    ),
    creditBalances: readColumnSet(
      runWranglerD1({
        dbName,
        local,
        sql: "PRAGMA table_info('credit_balances');",
      }),
    ),
  }
}

function buildSubscriptionSql({ plan, schemaInfo }) {
  const snapshot = PLAN_SNAPSHOTS[plan]
  const subscriptionColumns = schemaInfo.subscriptions
  const billingPeriod = subscriptionColumns.has('purchase_mode') ? 'one_time' : 'yearly'
  const insertColumns = [
    'id',
    'user_id',
    'plan',
    ...(subscriptionColumns.has('purchase_mode') ? ['purchase_mode'] : []),
    'billing_period',
    'status',
    'current_period_start',
    'current_period_end',
    'monthly_credits',
    ...(subscriptionColumns.has('storage_gb') ? ['storage_gb'] : []),
    'cancel_at_period_end',
    'created_at',
    'updated_at',
  ]
  const insertValues = [
    "'manual_entitlement_' || id",
    'id',
    `'${escapeSql(plan)}'`,
    ...(subscriptionColumns.has('purchase_mode') ? ["'one_time'"] : []),
    `'${billingPeriod}'`,
    "'active'",
    "datetime('now')",
    'NULL',
    `${snapshot.monthlyCredits}`,
    ...(subscriptionColumns.has('storage_gb') ? [`${snapshot.storageGB}`] : []),
    '0',
    "datetime('now')",
    "datetime('now')",
  ]
  const updateAssignments = [
    'plan = excluded.plan',
    ...(subscriptionColumns.has('purchase_mode') ? ['purchase_mode = excluded.purchase_mode'] : []),
    'billing_period = excluded.billing_period',
    'status = excluded.status',
    'current_period_start = excluded.current_period_start',
    'current_period_end = excluded.current_period_end',
    'monthly_credits = excluded.monthly_credits',
    ...(subscriptionColumns.has('storage_gb') ? ['storage_gb = excluded.storage_gb'] : []),
    'cancel_at_period_end = excluded.cancel_at_period_end',
    "updated_at = datetime('now')",
  ]

  return `
INSERT INTO subscriptions (
  ${insertColumns.join(',\n  ')}
)
SELECT
  ${insertValues.join(',\n  ')}
FROM target_user
ON CONFLICT(user_id) DO UPDATE SET
  ${updateAssignments.join(',\n  ')};
`.trim()
}

function buildCreditBalanceSql({ schemaInfo }) {
  const creditBalanceColumns = schemaInfo.creditBalances
  const insertColumns = [
    'user_id',
    ...(creditBalanceColumns.has('trial_balance') ? ['trial_balance'] : []),
    ...(creditBalanceColumns.has('trial_expires_at') ? ['trial_expires_at'] : []),
    'monthly_balance',
    'permanent_balance',
    ...(creditBalanceColumns.has('frozen') ? ['frozen'] : []),
    'total_earned',
    'total_spent',
    'created_at',
    'updated_at',
    ...(creditBalanceColumns.has('frozen_credits') ? ['frozen_credits'] : []),
  ]
  const insertValues = [
    'id',
    ...(creditBalanceColumns.has('trial_balance') ? ['0'] : []),
    ...(creditBalanceColumns.has('trial_expires_at') ? ['NULL'] : []),
    '0',
    `${UNLIMITED_PERMANENT_BALANCE}`,
    ...(creditBalanceColumns.has('frozen') ? ['0'] : []),
    `${UNLIMITED_PERMANENT_BALANCE}`,
    '0',
    "datetime('now')",
    "datetime('now')",
    ...(creditBalanceColumns.has('frozen_credits') ? ['0'] : []),
  ]
  const updateAssignments = [
    ...(creditBalanceColumns.has('trial_balance') ? ['trial_balance = 0'] : []),
    ...(creditBalanceColumns.has('trial_expires_at') ? ['trial_expires_at = NULL'] : []),
    'monthly_balance = 0',
    `permanent_balance = ${UNLIMITED_PERMANENT_BALANCE}`,
    ...(creditBalanceColumns.has('frozen') ? ['frozen = 0'] : []),
    ...(creditBalanceColumns.has('frozen_credits') ? ['frozen_credits = 0'] : []),
    `total_earned = CASE
    WHEN total_earned < ${UNLIMITED_PERMANENT_BALANCE} THEN ${UNLIMITED_PERMANENT_BALANCE}
    ELSE total_earned
  END`,
    "updated_at = datetime('now')",
  ]

  return `
INSERT INTO credit_balances (
  ${insertColumns.join(',\n  ')}
)
SELECT
  ${insertValues.join(',\n  ')}
FROM target_user
ON CONFLICT(user_id) DO UPDATE SET
  ${updateAssignments.join(',\n  ')};
`.trim()
}

function buildMutationSql({ email, plan, schemaInfo }) {
  const safeEmail = escapeSql(email)
  const subscriptionColumns = schemaInfo.subscriptions
  const creditBalanceColumns = schemaInfo.creditBalances

  return `
WITH target_user AS (
  SELECT id
  FROM users
  WHERE email = '${safeEmail}'
  LIMIT 1
)
UPDATE users
SET plan = '${escapeSql(plan)}',
    membership_status = '${escapeSql(plan)}',
    updated_at = datetime('now')
WHERE id IN (SELECT id FROM target_user);

${buildSubscriptionSql({ plan, schemaInfo })}

${buildCreditBalanceSql({ schemaInfo })}

SELECT id, email, plan, membership_status
FROM users
WHERE email = '${safeEmail}';

SELECT user_id, plan${
    subscriptionColumns.has('purchase_mode') ? ', purchase_mode' : ''
  }, billing_period, status, monthly_credits${
    subscriptionColumns.has('storage_gb') ? ', storage_gb' : ''
  }, cancel_at_period_end
FROM subscriptions
WHERE user_id IN (SELECT id FROM target_user);

SELECT user_id${
    creditBalanceColumns.has('trial_balance') ? ', trial_balance' : ''
  }, monthly_balance, permanent_balance${
    creditBalanceColumns.has('frozen') ? ', frozen' : ''
  }${
    creditBalanceColumns.has('frozen_credits') ? ', frozen_credits' : ''
  }, total_earned, total_spent
FROM credit_balances
WHERE user_id IN (SELECT id FROM target_user);
`.trim()
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  assertArgs(args)

  const schemaInfo = readSchemaInfo(args)
  const sql = buildMutationSql({
    email: args.email,
    plan: args.plan,
    schemaInfo,
  })

  if (args.dryRun) {
    console.log(sql)
    return
  }

  const output = runWranglerD1({
    dbName: args.dbName,
    local: args.local,
    sql,
  })

  console.log(output)
}

main()
