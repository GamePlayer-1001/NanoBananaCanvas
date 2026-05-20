/**
 * [INPUT]: 依赖 @/lib/api-key-crypto 的 decryptApiKey/encryptApiKey,
 *          依赖 @/lib/errors 的 ErrorCode/TaskError,
 *          依赖 @/lib/image-model-capabilities,
 *          依赖 @/lib/platform-runtime 的 resolvePlatformRuntimeModel,
 *          依赖 @/lib/user-model-config,
 *          依赖 @/lib/ai-node-config 的 NodeCapability,
 *          依赖 @/lib/tasks/service-types 的 TaskServiceRuntime
 * [OUTPUT]: 对外提供用户模型配置解析、平台 API Key 获取与图片能力学习
 * [POS]: lib/tasks 的密钥解析子模块，从 service.ts 拆出的用户/平台密钥与能力发现逻辑
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { AsyncTaskType } from '@nano-banana/shared'

import { decryptApiKey, encryptApiKey } from '@/lib/api-key-crypto'
import { ErrorCode, TaskError } from '@/lib/errors'
import {
  finalizeLearnedImageCapabilities,
  learnImageCapabilitiesFromError,
  mergeImageModelCapabilities,
  type ImageModelCapabilities,
} from '@/lib/image-model-capabilities'
import { resolvePlatformRuntimeModel } from '@/lib/platform-runtime'
import {
  deserializeUserModelConfig,
  serializeUserModelConfig,
  toRuntimeUserModelConfig,
  type UserModelConfigPayload,
  type UserModelRuntimeConfig,
} from '@/lib/user-model-config'
import type { NodeCapability } from '@/lib/ai-node-config'

import type { TaskServiceRuntime } from './service-types'

/* ─── Error Wrapping ─────────────────────────────── */

function toTaskProviderError(
  error: unknown,
  meta: Record<string, unknown>,
  fallbackMessage = 'Task provider request failed',
): TaskError {
  if (error instanceof TaskError) {
    return error
  }

  const message = error instanceof Error ? error.message : fallbackMessage
  return new TaskError(ErrorCode.TASK_PROVIDER_ERROR, message, meta)
}

/* ─── User Config Resolution ─────────────────────── */

export async function getUserTaskRuntimeConfig(
  db: D1Database,
  userId: string,
  capability: NodeCapability,
  configId?: string,
  runtime?: TaskServiceRuntime,
): Promise<UserModelRuntimeConfig> {
  try {
    const keyRow = await findUserConfigRow(db, userId, capability, configId, runtime)

    if (!keyRow) {
      throw new TaskError(
        ErrorCode.TASK_PROVIDER_ERROR,
        `No API key configured for capability: ${capability}`,
        { capability },
      )
    }

    const encryptionKey = await runtime!.requireEnv('ENCRYPTION_KEY')
    const decrypted = await decryptApiKey(keyRow.encrypted_key, encryptionKey)
    const payload = deserializeUserModelConfig(keyRow.configId, decrypted)
    return toRuntimeUserModelConfig(keyRow.configId, payload)
  } catch (error) {
    throw toTaskProviderError(error, { userId, capability, configId })
  }
}

export async function findUserConfigRow(
  db: D1Database,
  userId: string,
  capability: string,
  configId?: string,
  runtime?: TaskServiceRuntime,
): Promise<{ encrypted_key: string; configId: string } | null> {
  if (configId) {
    const row = await db
      .prepare(
        `SELECT encrypted_key FROM user_api_keys
         WHERE user_id = ? AND provider = ? AND is_active = 1`,
      )
      .bind(userId, configId)
      .first<{ encrypted_key: string }>()

    if (row) {
      return { ...row, configId }
    }
    return null
  }

  const encryptionKey = await runtime!.requireEnv('ENCRYPTION_KEY')
  const rows = await db
    .prepare(
      `SELECT provider, encrypted_key FROM user_api_keys
       WHERE user_id = ? AND is_active = 1
       ORDER BY created_at ASC`,
    )
    .bind(userId)
    .all<{ provider: string; encrypted_key: string }>()

  for (const row of rows.results ?? []) {
    const decrypted = await decryptApiKey(String(row.encrypted_key), encryptionKey)
    const payload = deserializeUserModelConfig(String(row.provider), decrypted)
    if (payload.capability === capability) {
      return { encrypted_key: String(row.encrypted_key), configId: String(row.provider) }
    }
  }

  return null
}

/* ─── Platform Key Resolution ────────────────────── */

export function taskTypeToPlatformCategory(
  taskType: AsyncTaskType,
): 'image' | 'video' | 'audio' {
  switch (taskType) {
    case 'image_gen':
      return 'image'
    case 'video_gen':
      return 'video'
    case 'audio_gen':
      return 'audio'
  }
}

export async function getTaskPlatformKey(
  providerHint: string,
  taskType: AsyncTaskType,
  modelId: string,
  runtime: TaskServiceRuntime,
): Promise<string> {
  const provider = resolvePlatformRuntimeModel({
    category: taskTypeToPlatformCategory(taskType),
    modelId,
    supplierHint: providerHint,
  }).supplierId

  try {
    return await runtime.getPlatformSupplierApiKey!(provider)
  } catch (error) {
    throw toTaskProviderError(error, { provider })
  }
}

/* ─── Image Capabilities Learning ────────────────── */

export async function learnUserImageCapabilitiesFromTaskError(
  db: D1Database,
  userId: string,
  runtimeConfig: UserModelRuntimeConfig,
  input: Record<string, unknown>,
  error: unknown,
  runtime?: TaskServiceRuntime,
) {
  const message = error instanceof Error ? error.message : String(error)
  const learned = learnImageCapabilitiesFromError(message)

  if (!learned) {
    return
  }

  const finalized = finalizeLearnedImageCapabilities(
    learned,
    typeof input.size === 'string' ? input.size : 'auto',
    typeof input.aspectRatio === 'string' ? input.aspectRatio : '1:1',
    message,
  )

  await updateStoredUserImageCapabilities(db, userId, runtimeConfig.configId, finalized, runtime)
}

export async function updateStoredUserImageCapabilities(
  db: D1Database,
  userId: string,
  configId: string,
  learned: ImageModelCapabilities,
  runtime?: TaskServiceRuntime,
) {
  const encryptionKey = await runtime!.requireEnv('ENCRYPTION_KEY')
  const row = await db
    .prepare(
      `SELECT encrypted_key
       FROM user_api_keys
       WHERE user_id = ? AND provider = ? AND is_active = 1`,
    )
    .bind(userId, configId)
    .first<{ encrypted_key: string }>()

  if (!row) {
    return
  }

  const decrypted = await decryptApiKey(row.encrypted_key, encryptionKey)
  const payload = deserializeUserModelConfig(configId, decrypted)
  const nextPayload: UserModelConfigPayload = {
    ...payload,
    version: 4,
    imageCapabilities: mergeImageModelCapabilities(payload.imageCapabilities, learned),
  }
  const encrypted = await encryptApiKey(
    serializeUserModelConfig(nextPayload),
    encryptionKey,
  )

  await db
    .prepare(
      `UPDATE user_api_keys
       SET encrypted_key = ?, updated_at = datetime('now')
       WHERE user_id = ? AND provider = ?`,
    )
    .bind(encrypted, userId, configId)
    .run()
}
