/**
 * [INPUT]: 依赖 @nano-banana/shared 的 TASK_CONFIG，消费 async_tasks / credit_balances / credit_transactions
 * [OUTPUT]: 对外提供 markTimedOutTasks — 批量标记 legacy queue 超时任务为失败，并为平台模式退回冻结 credits
 * [POS]: cron 的超时扫描任务，按 TASK_CONFIG.timeoutMs 判定，并接住漏过前端轮询的 legacy queue 超时退款/解冻
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { TASK_CONFIG } from '@nano-banana/shared'
import type { AsyncTaskType } from '@nano-banana/shared'

interface StaleTask {
  id: string
  user_id: string
  task_type: AsyncTaskType
  provider: string
  model_id: string
  execution_mode: 'platform' | 'user_key'
  input_data: string
  external_task_id: string | null
  created_at: string
}

function isWorkflowManagedTask(inputData: string): boolean {
  try {
    const parsed = JSON.parse(inputData) as {
      __taskRuntime?: { orchestrator?: unknown }
    }
    return parsed.__taskRuntime?.orchestrator === 'workflow'
  } catch {
    return false
  }
}

function createTxnId(): string {
  return crypto.randomUUID().replace(/-/g, '')
}

function getReservedTaskCredits(inputData: string): number {
  try {
    const parsed = JSON.parse(inputData) as {
      billingDraft?: { estimatedCredits?: unknown }
    }
    const estimatedCredits = parsed.billingDraft?.estimatedCredits

    if (typeof estimatedCredits !== 'number' || !Number.isFinite(estimatedCredits) || estimatedCredits <= 0) {
      return 0
    }

    return Math.round(estimatedCredits)
  } catch {
    return 0
  }
}

async function refundTimedOutTaskCredits(
  db: D1Database,
  task: StaleTask,
): Promise<boolean> {
  if (task.execution_mode !== 'platform') {
    return false
  }

  const reservedCredits = getReservedTaskCredits(task.input_data)
  if (reservedCredits <= 0) {
    return false
  }

  await db
    .prepare(
      `INSERT OR IGNORE INTO credit_balances (
         user_id, monthly_balance, permanent_balance, frozen_credits, total_earned, total_spent
       ) VALUES (?, 0, 0, 0, 0, 0)`,
    )
    .bind(task.user_id)
    .run()

  const { results } = await db
    .prepare(
      `SELECT
         pool,
         SUM(CASE WHEN type = 'freeze' THEN ABS(amount) ELSE 0 END) AS frozen_amount,
         SUM(CASE WHEN type IN ('spend', 'refund', 'unfreeze') THEN ABS(amount) ELSE 0 END) AS settled_amount
       FROM credit_transactions
       WHERE user_id = ?
         AND reference_id = ?
       GROUP BY pool`,
    )
    .bind(task.user_id, task.id)
    .all<{
      pool: 'monthly' | 'permanent'
      frozen_amount: number | null
      settled_amount: number | null
    }>()

  let monthlyRemaining = 0
  let permanentRemaining = 0

  for (const row of results ?? []) {
    const remaining = Math.max(0, (row.frozen_amount ?? 0) - (row.settled_amount ?? 0))
    if (row.pool === 'monthly') {
      monthlyRemaining = remaining
    } else {
      permanentRemaining = remaining
    }
  }

  const totalRemaining = monthlyRemaining + permanentRemaining
  if (totalRemaining <= 0) {
    return false
  }

  const balance = await db
    .prepare(
      `SELECT monthly_balance, permanent_balance, frozen_credits
       FROM credit_balances
       WHERE user_id = ?`,
    )
    .bind(task.user_id)
    .first<{
      monthly_balance: number | null
      permanent_balance: number | null
      frozen_credits: number | null
    }>()

  const nextMonthlyBalance = (balance?.monthly_balance ?? 0) + monthlyRemaining
  const nextPermanentBalance = (balance?.permanent_balance ?? 0) + permanentRemaining
  const nextFrozenCredits = Math.max(0, (balance?.frozen_credits ?? 0) - totalRemaining)
  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `UPDATE credit_balances
         SET monthly_balance = ?,
             permanent_balance = ?,
             frozen_credits = ?,
             updated_at = datetime('now')
         WHERE user_id = ?`,
      )
      .bind(nextMonthlyBalance, nextPermanentBalance, nextFrozenCredits, task.user_id),
  ]

  let runningAvailable = (balance?.monthly_balance ?? 0) + (balance?.permanent_balance ?? 0)
  if (monthlyRemaining > 0) {
    runningAvailable += monthlyRemaining
    statements.push(
      db
        .prepare(
          `INSERT INTO credit_transactions (
             id, user_id, type, pool, amount, balance_after, source, reference_id, description
           ) VALUES (?, ?, 'refund', 'monthly', ?, ?, ?, ?, ?)`,
        )
        .bind(
          createTxnId(),
          task.user_id,
          monthlyRemaining,
          runningAvailable,
          'worker_timeout_refund',
          task.id,
          `Refund timed out async task ${task.task_type} ${task.provider}/${task.model_id}`,
        ),
    )
  }

  if (permanentRemaining > 0) {
    runningAvailable += permanentRemaining
    statements.push(
      db
        .prepare(
          `INSERT INTO credit_transactions (
             id, user_id, type, pool, amount, balance_after, source, reference_id, description
           ) VALUES (?, ?, 'refund', 'permanent', ?, ?, ?, ?, ?)`,
        )
        .bind(
          createTxnId(),
          task.user_id,
          permanentRemaining,
          runningAvailable,
          'worker_timeout_refund',
          task.id,
          `Refund timed out async task ${task.task_type} ${task.provider}/${task.model_id}`,
        ),
    )
  }

  await db.batch(statements)
  return true
}

/** 扫描所有超时的 pending/running 任务，标记 failed */
export async function markTimedOutTasks(db: D1Database): Promise<{ timedOut: number; refunded: number }> {
  const now = Date.now()
  let total = 0
  let refunded = 0

  for (const [taskType, config] of Object.entries(TASK_CONFIG)) {
    const cutoff = new Date(now - config.timeoutMs).toISOString()

    const { results } = await db
      .prepare(
        `SELECT id, user_id, task_type, provider, model_id, execution_mode, input_data, external_task_id, created_at
         FROM async_tasks
         WHERE task_type = ?
           AND status IN ('pending', 'running')
           AND created_at < ?
         LIMIT 100`,
      )
      .bind(taskType, cutoff)
      .all<StaleTask>()

    if (!results || results.length === 0) continue

    for (const task of results) {
      if (isWorkflowManagedTask(task.input_data)) {
        continue
      }

      const nowIso = new Date().toISOString()
      const didRefund = await refundTimedOutTaskCredits(db, task)

      /* 标记失败 */
      await db
        .prepare(
          `UPDATE async_tasks
           SET status = 'failed',
               output_data = ?,
               completed_at = ?,
               updated_at = ?
           WHERE id = ? AND status IN ('pending', 'running')`,
        )
        .bind(
          JSON.stringify({ error: `Cron: task timed out after ${config.timeoutMs / 1000}s` }),
          nowIso,
          nowIso,
          task.id,
        )
        .run()

      total++
      if (didRefund) {
        refunded++
      }
    }
  }

  return { timedOut: total, refunded }
}
