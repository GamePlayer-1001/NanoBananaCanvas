/**
 * [INPUT]: 依赖 Node.js process argv/fs，依赖 stripe SDK 与 wrangler remote D1 执行能力，依赖本地 .env.local 的 Stripe Live secret
 * [OUTPUT]: 对外提供 reconcile-stripe-trial-subscription.mjs，可按 email 认领真实 Stripe trial 订阅并回填生产 subscriptions/users/credit_balances
 * [POS]: apps/web/scripts 的生产账单修复脚本，用于修复“Stripe 已有 trial 订阅但本地镜像仍停留在 Free”的历史脏数据
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Stripe from 'stripe'

const APPS_WEB_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DEFAULT_DB_NAME = 'nano-banana-canvas-db'

function parseArgs(argv) {
  const parsed = {
    email: '',
    userId: '',
    dbName: DEFAULT_DB_NAME,
    dryRun: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]

    if (token === '--email') {
      parsed.email = argv[index + 1] ?? ''
      index += 1
      continue
    }

    if (token === '--user-id') {
      parsed.userId = argv[index + 1] ?? ''
      index += 1
      continue
    }

    if (token === '--db') {
      parsed.dbName = argv[index + 1] ?? parsed.dbName
      index += 1
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

  if (!args.userId) {
    throw new Error('Missing required --user-id')
  }
}

function loadDotEnv() {
  const envPath = path.join(APPS_WEB_DIR, '.env.local')
  const text = fs.readFileSync(envPath, 'utf8')

  for (const line of text.split(/\r?\n/u)) {
    if (!line || line.trim().startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')
    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim()

    if (!(key in process.env)) {
      process.env[key] = value
    }
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

function runWranglerD1({ dbName, sql }) {
  const tempSqlPath = path.join(APPS_WEB_DIR, '.tmp-reconcile-stripe-trial.sql')
  fs.writeFileSync(tempSqlPath, sql, 'utf8')

  try {
    return runPnpmCommand([
      'exec',
      'wrangler',
      'd1',
      'execute',
      dbName,
      '--remote',
      '--file',
      tempSqlPath,
    ])
  } finally {
    fs.rmSync(tempSqlPath, { force: true })
  }
}

function toSqliteDateTime(value) {
  if (!value) {
    return 'NULL'
  }

  return `'${new Date(value * 1000).toISOString().replace('T', ' ').replace('.000Z', '')}'`
}

async function resolveStripeTrial({ email, userId }) {
  loadDotEnv()

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY in .env.local')
  }

  const stripe = new Stripe(secretKey, {
    apiVersion: '2026-03-25.dahlia',
  })

  const customers = await stripe.customers.list({ email, limit: 20 })
  const matchedCustomers = customers.data.filter(
    (customer) => customer.metadata?.userId === userId,
  )

  for (const customer of matchedCustomers) {
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 20,
    })

    const trialSubscription = subscriptions.data.find(
      (subscription) =>
        subscription.metadata?.userId === userId &&
        subscription.metadata?.purchaseMode === 'plan_trial_standard' &&
        (subscription.status === 'trialing' || subscription.status === 'active'),
    )

    if (trialSubscription) {
      return {
        customerId: customer.id,
        subscriptionId: trialSubscription.id,
        plan: trialSubscription.metadata.plan ?? 'standard',
        purchaseMode: 'plan_trial_standard',
        status: trialSubscription.status,
        monthlyCredits: Number(trialSubscription.metadata.monthlyCredits ?? '1600'),
        storageGB: Number(trialSubscription.metadata.storageGB ?? '10'),
        currentPeriodStart: trialSubscription.items.data[0]?.current_period_start ?? null,
        currentPeriodEnd: trialSubscription.items.data[0]?.current_period_end ?? null,
        cancelAtPeriodEnd: trialSubscription.cancel_at_period_end ? 1 : 0,
      }
    }
  }

  throw new Error(`No matching Stripe standard trial subscription found for ${email} / ${userId}`)
}

function buildReconcileSql({ email, userId, stripeTrial }) {
  const safeEmail = escapeSql(email)
  const safeUserId = escapeSql(userId)
  const safeCustomerId = escapeSql(stripeTrial.customerId)
  const safeSubscriptionId = escapeSql(stripeTrial.subscriptionId)
  const safePlan = escapeSql(stripeTrial.plan)
  const safeStatus = escapeSql(stripeTrial.status)
  const safeMonthlyCredits = Number(stripeTrial.monthlyCredits)
  const safeStorageGB = Number(stripeTrial.storageGB)
  const userSelector = `SELECT id FROM users WHERE id = '${safeUserId}' AND email = '${safeEmail}'`

  return `
UPDATE users
SET plan = '${safePlan}',
    membership_status = '${safePlan}',
    standard_trial_used_at = COALESCE(standard_trial_used_at, datetime('now')),
    updated_at = datetime('now')
WHERE id IN (${userSelector});

INSERT INTO subscriptions (
  id,
  user_id,
  stripe_subscription_id,
  stripe_customer_id,
  plan,
  purchase_mode,
  billing_period,
  status,
  current_period_start,
  current_period_end,
  monthly_credits,
  storage_gb,
  cancel_at_period_end,
  created_at,
  updated_at
)
SELECT
  'reconcile_' || id,
  id,
  '${safeSubscriptionId}',
  '${safeCustomerId}',
  '${safePlan}',
  'auto_monthly',
  'monthly',
  '${safeStatus}',
  ${toSqliteDateTime(stripeTrial.currentPeriodStart)},
  ${toSqliteDateTime(stripeTrial.currentPeriodEnd)},
  ${safeMonthlyCredits},
  ${safeStorageGB},
  ${stripeTrial.cancelAtPeriodEnd},
  datetime('now'),
  datetime('now')
FROM (${userSelector})
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions WHERE user_id = '${safeUserId}'
);

UPDATE subscriptions
SET stripe_subscription_id = '${safeSubscriptionId}',
    stripe_customer_id = '${safeCustomerId}',
    plan = '${safePlan}',
    purchase_mode = 'auto_monthly',
    billing_period = 'monthly',
    status = '${safeStatus}',
    current_period_start = ${toSqliteDateTime(stripeTrial.currentPeriodStart)},
    current_period_end = ${toSqliteDateTime(stripeTrial.currentPeriodEnd)},
    monthly_credits = ${safeMonthlyCredits},
    storage_gb = ${safeStorageGB},
    cancel_at_period_end = ${stripeTrial.cancelAtPeriodEnd},
    updated_at = datetime('now')
WHERE user_id = '${safeUserId}';

INSERT INTO credit_balances (
  user_id,
  monthly_balance,
  permanent_balance,
  frozen,
  total_earned,
  total_spent,
  trial_balance,
  trial_expires_at,
  frozen_credits,
  created_at,
  updated_at
)
SELECT
  id,
  ${safeMonthlyCredits},
  0,
  0,
  ${safeMonthlyCredits},
  0,
  0,
  NULL,
  0,
  datetime('now'),
  datetime('now')
FROM (${userSelector})
WHERE NOT EXISTS (
  SELECT 1 FROM credit_balances WHERE user_id = '${safeUserId}'
);

UPDATE credit_balances
SET monthly_balance = CASE
      WHEN monthly_balance < ${safeMonthlyCredits} THEN ${safeMonthlyCredits}
      ELSE monthly_balance
    END,
    frozen = 0,
    frozen_credits = 0,
    updated_at = datetime('now')
WHERE user_id = '${safeUserId}';

SELECT id, email, plan, membership_status, standard_trial_used_at
FROM users
WHERE id = '${safeUserId}';

SELECT user_id, stripe_customer_id, stripe_subscription_id, plan, purchase_mode, status, monthly_credits, storage_gb, current_period_start, current_period_end
FROM subscriptions
WHERE user_id = '${safeUserId}';

SELECT user_id, monthly_balance, permanent_balance, trial_balance, total_earned, total_spent, updated_at
FROM credit_balances
WHERE user_id = '${safeUserId}';
`.trim()
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  assertArgs(args)

  const stripeTrial = await resolveStripeTrial(args)
  const sql = buildReconcileSql({
    email: args.email,
    userId: args.userId,
    stripeTrial,
  })

  if (args.dryRun) {
    console.log(sql)
    return
  }

  const output = runWranglerD1({
    dbName: args.dbName,
    sql,
  })

  console.log(output)
}

await main()
