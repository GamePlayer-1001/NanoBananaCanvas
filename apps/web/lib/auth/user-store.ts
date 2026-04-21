/**
 * [INPUT]: 依赖 @/lib/db，依赖 @/lib/nanoid
 * [OUTPUT]: 对外提供 findUserByIdentityKey/insertUserByIdentityKey/updateUserProfileByIdentityKey/getUsersColumns
 * [POS]: lib/auth 的 users 表兼容访问层，屏蔽新旧 schema 差异，为 session-actor 与 webhook 提供单一真相源
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { getDb } from '@/lib/db'
import { nanoid } from '@/lib/nanoid'

export type UserProfileInput = {
  email: string
  username: string
  firstName: string
  lastName: string
  name: string
  avatarUrl: string
}

export type DbUserRow = {
  id: string
  clerk_id: string
  email: string
  username: string
  first_name: string
  last_name: string
  name: string
  avatar_url: string
  plan: string
  membership_status: string
  created_at: string
}

type TableInfoRow = {
  name?: string
}

let usersColumnsPromise: Promise<Set<string>> | null = null

function hasColumn(columns: Set<string>, column: string) {
  return columns.has(column)
}

function buildSelectList(columns: Set<string>) {
  const planExpr = hasColumn(columns, 'plan') ? 'plan' : "'free' AS plan"
  const membershipExpr = hasColumn(columns, 'membership_status')
    ? 'membership_status'
    : hasColumn(columns, 'plan')
      ? 'plan AS membership_status'
      : "'free' AS membership_status"

  return [
    'id',
    'clerk_id',
    'email',
    hasColumn(columns, 'username') ? 'username' : "'' AS username",
    hasColumn(columns, 'first_name') ? 'first_name' : "'' AS first_name",
    hasColumn(columns, 'last_name') ? 'last_name' : "'' AS last_name",
    hasColumn(columns, 'name') ? 'name' : "'Member' AS name",
    hasColumn(columns, 'avatar_url') ? 'avatar_url' : "'' AS avatar_url",
    planExpr,
    membershipExpr,
    'created_at',
  ].join(', ')
}

function buildInsertStatement(identityKey: string, profile: UserProfileInput, columns: Set<string>) {
  const fieldNames = ['id', 'clerk_id', 'email']
  const values: unknown[] = [nanoid(), identityKey, profile.email]
  const placeholders = ['?', '?', '?']

  if (hasColumn(columns, 'username')) {
    fieldNames.push('username')
    values.push(profile.username)
    placeholders.push('?')
  }

  if (hasColumn(columns, 'first_name')) {
    fieldNames.push('first_name')
    values.push(profile.firstName)
    placeholders.push('?')
  }

  if (hasColumn(columns, 'last_name')) {
    fieldNames.push('last_name')
    values.push(profile.lastName)
    placeholders.push('?')
  }

  if (hasColumn(columns, 'name')) {
    fieldNames.push('name')
    values.push(profile.name)
    placeholders.push('?')
  }

  if (hasColumn(columns, 'avatar_url')) {
    fieldNames.push('avatar_url')
    values.push(profile.avatarUrl)
    placeholders.push('?')
  }

  if (hasColumn(columns, 'plan')) {
    fieldNames.push('plan')
    values.push('free')
    placeholders.push('?')
  }

  if (hasColumn(columns, 'membership_status')) {
    fieldNames.push('membership_status')
    values.push('free')
    placeholders.push('?')
  }

  return {
    sql: `INSERT INTO users (${fieldNames.join(', ')}) VALUES (${placeholders.join(', ')})`,
    values,
  }
}

function buildUpdateStatement(identityKey: string, profile: UserProfileInput, columns: Set<string>) {
  const sets = ['email = ?']
  const values: unknown[] = [profile.email]

  if (hasColumn(columns, 'username')) {
    sets.push('username = ?')
    values.push(profile.username)
  }

  if (hasColumn(columns, 'first_name')) {
    sets.push('first_name = ?')
    values.push(profile.firstName)
  }

  if (hasColumn(columns, 'last_name')) {
    sets.push('last_name = ?')
    values.push(profile.lastName)
  }

  if (hasColumn(columns, 'name')) {
    sets.push('name = ?')
    values.push(profile.name)
  }

  if (hasColumn(columns, 'avatar_url')) {
    sets.push('avatar_url = ?')
    values.push(profile.avatarUrl)
  }

  if (hasColumn(columns, 'updated_at')) {
    sets.push("updated_at = datetime('now')")
  }

  values.push(identityKey)

  return {
    sql: `UPDATE users SET ${sets.join(', ')} WHERE clerk_id = ?`,
    values,
  }
}

export async function getUsersColumns() {
  if (!usersColumnsPromise) {
    usersColumnsPromise = (async () => {
      const db = await getDb()
      const rows = await db.prepare('PRAGMA table_info(users)').all<TableInfoRow>()
      return new Set((rows.results ?? []).map((row) => row.name).filter(Boolean) as string[])
    })().catch((error) => {
      usersColumnsPromise = null
      throw error
    })
  }

  return usersColumnsPromise
}

export async function findUserByIdentityKey(identityKey: string) {
  const db = await getDb()
  const columns = await getUsersColumns()

  return db
    .prepare(`SELECT ${buildSelectList(columns)} FROM users WHERE clerk_id = ?`)
    .bind(identityKey)
    .first<DbUserRow>()
}

export async function insertUserByIdentityKey(identityKey: string, profile: UserProfileInput) {
  const db = await getDb()
  const columns = await getUsersColumns()
  const statement = buildInsertStatement(identityKey, profile, columns)

  await db.prepare(statement.sql).bind(...statement.values).run()
}

export async function updateUserProfileByIdentityKey(
  identityKey: string,
  profile: UserProfileInput,
) {
  const db = await getDb()
  const columns = await getUsersColumns()
  const statement = buildUpdateStatement(identityKey, profile, columns)

  await db.prepare(statement.sql).bind(...statement.values).run()
}
