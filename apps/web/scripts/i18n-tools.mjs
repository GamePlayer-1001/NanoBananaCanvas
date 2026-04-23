#!/usr/bin/env node

/**
 * [INPUT]: 依赖 messages/*.json、app/components/hooks/lib 源码与少量声明式动态 key 来源
 * [OUTPUT]: 对外提供 i18n 索引生成、引用校验、locale 同步、死 key 清理与新 locale 脚手架命令
 * [POS]: scripts 的 i18n/L10N 运维核心，维护消息字典、源码引用与动态 key 的一致性
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const WEB_ROOT = path.resolve(process.cwd())
const MESSAGES_DIR = path.join(WEB_ROOT, 'messages')
const GENERATED_INDEX_PATH = path.join(WEB_ROOT, 'i18n', 'message-index.ts')
const GENERATED_USAGE_PATH = path.join(WEB_ROOT, 'i18n', 'message-usage.ts')
const USAGE_MANIFEST_PATH = path.join(WEB_ROOT, 'i18n', 'message-usage-manifest.json')
const BASE_LOCALE = 'en'
const SCAN_ROOTS = ['app', 'components', 'hooks', 'lib']

const STATIC_DYNAMIC_KEY_SOURCES = [
  {
    source: 'components/canvas/canvas-toolbar.tsx',
    namespace: 'toolbar',
    mode: 'labelKey',
  },
  {
    source: 'components/nodes/plugin-registry.ts',
    namespace: 'toolbar',
    mode: 'toolbarLabelKey',
  },
  {
    source: 'components/canvas/node-entry-config.ts',
    namespace: 'contextMenu',
    mode: 'labelKey',
  },
  {
    source: 'components/explore/detail/report-dialog.tsx',
    namespace: 'exploreDetail',
    mode: 'stringArray',
    exportName: 'REPORT_REASONS',
    prefix: 'reason_',
  },
]

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

function readSource(relativePath) {
  return fs.readFileSync(path.join(WEB_ROOT, relativePath), 'utf8')
}

function listLocaleFiles() {
  return fs
    .readdirSync(MESSAGES_DIR)
    .filter((name) => name.endsWith('.json'))
    .sort()
}

function listLocales() {
  return listLocaleFiles().map((name) => name.replace(/\.json$/u, ''))
}

function readUsageManifest() {
  if (!fs.existsSync(USAGE_MANIFEST_PATH)) {
    return { dynamicKeys: [] }
  }

  const manifest = readJson(USAGE_MANIFEST_PATH)
  return {
    dynamicKeys: Array.isArray(manifest.dynamicKeys)
      ? manifest.dynamicKeys.filter((key) => typeof key === 'string').sort()
      : [],
  }
}

function toLeafKey(namespace, key) {
  return namespace ? `${namespace}.${key}` : key
}

function collectLabelKeys(source) {
  return [...source.matchAll(/\blabelKey:\s*['"]([^'"]+)['"]/gu)].map((match) => match[1])
}

function collectToolbarLabelKeys(source) {
  return [...source.matchAll(/\btoolbar:\s*\{\s*labelKey:\s*['"]([^'"]+)['"]\s*\}/gu)].map(
    (match) => match[1],
  )
}

function collectStringArrayKeys(source, exportName, prefix = '') {
  const arrayPattern = new RegExp(
    `\\b(?:const|export\\s+const)\\s+${exportName}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s*as\\s+const`,
    'u',
  )
  const match = source.match(arrayPattern)
  if (!match) {
    return []
  }

  return [...match[1].matchAll(/['"]([^'"]+)['"]/gu)].map((item) => `${prefix}${item[1]}`)
}

function collectStaticDynamicKeysFromSource(config) {
  const source = readSource(config.source)
  const keys =
    config.mode === 'labelKey'
      ? collectLabelKeys(source)
      : config.mode === 'toolbarLabelKey'
        ? collectToolbarLabelKeys(source)
        : collectStringArrayKeys(source, config.exportName, config.prefix)

  return [...new Set(keys.map((key) => toLeafKey(config.namespace, key)))].sort()
}

function collectStaticDynamicKeyIndex() {
  return Object.fromEntries(
    STATIC_DYNAMIC_KEY_SOURCES.map((config) => [
      config.source,
      collectStaticDynamicKeysFromSource(config),
    ]).filter(([, keys]) => keys.length > 0),
  )
}

function flattenLeaves(value, prefix = '') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [prefix]
  }

  return Object.entries(value).flatMap(([key, child]) =>
    flattenLeaves(child, prefix ? `${prefix}.${key}` : key),
  )
}

function collectNamespaceIndex(messages) {
  return Object.fromEntries(
    Object.entries(messages).map(([namespace, value]) => [
      namespace,
      flattenLeaves(value).sort(),
    ]),
  )
}

function listSourceFiles() {
  return SCAN_ROOTS.flatMap((relativeRoot) =>
    walkFiles(path.join(WEB_ROOT, relativeRoot)).map((filePath) =>
      path.relative(WEB_ROOT, filePath).replace(/\\/gu, '/'),
    ),
  )
}

function walkFiles(dirPath) {
  return fs.readdirSync(dirPath, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dirPath, entry.name)

    if (entry.isDirectory()) {
      if (['node_modules', '.next', '.turbo'].includes(entry.name)) {
        return []
      }

      return walkFiles(fullPath)
    }

    return /\.(ts|tsx)$/u.test(entry.name) ? [fullPath] : []
  })
}

function collectTranslatorBindings(source) {
  const bindings = new Map()
  const bindingPattern =
    /const\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\((?:['"]([^'"]+)['"]|\{[\s\S]*?namespace:\s*['"]([^'"]+)['"][\s\S]*?\})\)/gu

  for (const match of source.matchAll(bindingPattern)) {
    const [, variableName, directNamespace, objectNamespace] = match
    bindings.set(variableName, directNamespace ?? objectNamespace ?? '')
  }

  return bindings
}

function collectFileUsage(relativePath) {
  const fullPath = path.join(WEB_ROOT, relativePath)
  const source = fs.readFileSync(fullPath, 'utf8')
  const bindings = collectTranslatorBindings(source)
  const keys = new Set()

  for (const [variableName, namespace] of bindings.entries()) {
    const usagePattern = new RegExp(
      `\\b${variableName}(?:\\.(?:rich|markup|has))?\\(\\s*['"]([^'"]+)['"]`,
      'gu',
    )

    for (const match of source.matchAll(usagePattern)) {
      const leafKey = match[1]
      keys.add(namespace ? `${namespace}.${leafKey}` : leafKey)
    }
  }

  return [...keys].sort()
}

function collectUsageIndex() {
  return Object.fromEntries(
    listSourceFiles()
      .map((relativePath) => [relativePath, collectFileUsage(relativePath)])
      .filter(([, keys]) => keys.length > 0),
  )
}

function collectUsedLeafKeys() {
  const usageIndex = collectUsageIndex()
  const usageManifest = readUsageManifest()
  const staticDynamicKeyIndex = collectStaticDynamicKeyIndex()
  const staticDynamicKeys = Object.values(staticDynamicKeyIndex).flat()
  const dynamicLeafKeys = [
    ...new Set([...staticDynamicKeys, ...usageManifest.dynamicKeys]),
  ].sort()
  const usedLeafKeys = [
    ...new Set([...Object.values(usageIndex).flat(), ...dynamicLeafKeys]),
  ].sort()

  return {
    usageIndex,
    usageManifest,
    staticDynamicKeyIndex,
    dynamicLeafKeys,
    usedLeafKeys,
  }
}

function mergeWithBaseShape(base, target) {
  if (!base || typeof base !== 'object' || Array.isArray(base)) {
    return typeof target === 'string' ? target : base
  }

  return Object.fromEntries(
    Object.entries(base).map(([key, value]) => [
      key,
      mergeWithBaseShape(value, target && typeof target === 'object' ? target[key] : undefined),
    ]),
  )
}

function diffLocale(baseLeaves, localeLeaves) {
  const missing = baseLeaves.filter((leaf) => !localeLeaves.includes(leaf))
  const extra = localeLeaves.filter((leaf) => !baseLeaves.includes(leaf))
  return { missing, extra }
}

function generateIndex() {
  const baseMessages = readJson(path.join(MESSAGES_DIR, `${BASE_LOCALE}.json`))
  const localeCodes = listLocales()
  const namespaceIndex = collectNamespaceIndex(baseMessages)
  const leafKeys = flattenLeaves(baseMessages).sort()
  const namespaceNames = Object.keys(baseMessages).sort()
  const { usageIndex, usageManifest, staticDynamicKeyIndex, dynamicLeafKeys, usedLeafKeys } =
    collectUsedLeafKeys()

  const fileContent = `/**
 * [INPUT]: 依赖 messages/*.json 的基准语言结构
 * [OUTPUT]: 对外提供消息命名空间索引、全量 leaf key 索引与 locale 列表
 * [POS]: i18n 的生成索引文件，被校验脚本与未来类型提示/运维工具消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 *
 * 此文件由 scripts/i18n-tools.mjs 自动生成，请勿手改。
 */

export const MESSAGE_BASE_LOCALE = ${JSON.stringify(BASE_LOCALE)} as const

export const MESSAGE_LOCALES = ${JSON.stringify(localeCodes, null, 2)} as const

export const MESSAGE_NAMESPACES = ${JSON.stringify(namespaceNames, null, 2)} as const

export const MESSAGE_NAMESPACE_INDEX = ${JSON.stringify(namespaceIndex, null, 2)} as const

export const MESSAGE_LEAF_KEYS = ${JSON.stringify(leafKeys, null, 2)} as const

export type MessageLocale = (typeof MESSAGE_LOCALES)[number]
export type MessageNamespace = (typeof MESSAGE_NAMESPACES)[number]
export type MessageLeafKey = (typeof MESSAGE_LEAF_KEYS)[number]
`

  fs.writeFileSync(GENERATED_INDEX_PATH, fileContent)
  const usageContent = `/**
 * [INPUT]: 依赖 app/components/hooks/lib 中的翻译函数调用与声明式动态 key 来源
 * [OUTPUT]: 对外提供消息 key 使用索引、动态 key 来源索引与已消费 key 列表
 * [POS]: i18n 的生成使用索引文件，被运维校验与后续死 key 清理消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 *
 * 此文件由 scripts/i18n-tools.mjs 自动生成，请勿手改。
 */

export const MESSAGE_USAGE_INDEX = ${JSON.stringify(usageIndex, null, 2)} as const

export const MESSAGE_STATIC_DYNAMIC_KEY_INDEX = ${JSON.stringify(staticDynamicKeyIndex, null, 2)} as const

export const MESSAGE_MANIFEST_LEAF_KEYS = ${JSON.stringify(usageManifest.dynamicKeys, null, 2)} as const

export const MESSAGE_DYNAMIC_LEAF_KEYS = ${JSON.stringify(dynamicLeafKeys, null, 2)} as const

export const USED_MESSAGE_LEAF_KEYS = ${JSON.stringify(usedLeafKeys, null, 2)} as const

export type UsedMessageLeafKey = (typeof USED_MESSAGE_LEAF_KEYS)[number]
`

  fs.writeFileSync(GENERATED_USAGE_PATH, usageContent)
  console.log(`Generated message index -> ${path.relative(WEB_ROOT, GENERATED_INDEX_PATH)}`)
  console.log(`Generated message usage -> ${path.relative(WEB_ROOT, GENERATED_USAGE_PATH)}`)
}

function validateMessages() {
  const baseMessages = readJson(path.join(MESSAGES_DIR, `${BASE_LOCALE}.json`))
  const baseLeaves = flattenLeaves(baseMessages).sort()
  const locales = listLocales()
  let hasError = false

  for (const locale of locales) {
    const localeMessages = readJson(path.join(MESSAGES_DIR, `${locale}.json`))
    const localeLeaves = flattenLeaves(localeMessages).sort()
    const { missing, extra } = diffLocale(baseLeaves, localeLeaves)

    if (missing.length || extra.length) {
      hasError = true
      console.error(`\n[${locale}] key mismatch`)
      if (missing.length) {
        console.error(`  missing (${missing.length}): ${missing.slice(0, 20).join(', ')}`)
      }
      if (extra.length) {
        console.error(`  extra (${extra.length}): ${extra.slice(0, 20).join(', ')}`)
      }
      continue
    }

    console.log(`[${locale}] OK (${localeLeaves.length} keys)`)
  }

  if (hasError) {
    process.exitCode = 1
    return
  }

  const { usedLeafKeys } = collectUsedLeafKeys()
  const missingReferences = usedLeafKeys.filter((leafKey) => !baseLeaves.includes(leafKey))
  const unusedLeafKeys = baseLeaves.filter((leafKey) => !usedLeafKeys.includes(leafKey))

  if (missingReferences.length) {
    process.exitCode = 1
    console.error(
      `\nMissing referenced keys (${missingReferences.length}): ${missingReferences
        .slice(0, 20)
        .join(', ')}`,
    )
    return
  }

  console.log('\nAll locale files are symmetric with the base locale.')
  console.log(`Referenced keys: ${usedLeafKeys.length}`)
  console.log(`Unused base-locale keys: ${unusedLeafKeys.length}`)
}

function pruneNode(value, usedLeafKeySet, prefix = '') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return usedLeafKeySet.has(prefix) ? value : undefined
  }

  const nextEntries = Object.entries(value)
    .map(([key, child]) => [key, pruneNode(child, usedLeafKeySet, prefix ? `${prefix}.${key}` : key)])
    .filter(([, child]) => child !== undefined)

  if (nextEntries.length === 0) {
    return undefined
  }

  return Object.fromEntries(nextEntries)
}

function pruneUnusedMessages() {
  const baseMessages = readJson(path.join(MESSAGES_DIR, `${BASE_LOCALE}.json`))
  const { usedLeafKeys } = collectUsedLeafKeys()
  const usedLeafKeySet = new Set(usedLeafKeys)
  const locales = listLocales()
  const prunedBaseMessages = pruneNode(baseMessages, usedLeafKeySet) ?? {}

  writeJson(path.join(MESSAGES_DIR, `${BASE_LOCALE}.json`), prunedBaseMessages)
  console.log(`Pruned locale file -> messages/${BASE_LOCALE}.json`)

  for (const locale of locales.filter((candidate) => candidate !== BASE_LOCALE)) {
    const localePath = path.join(MESSAGES_DIR, `${locale}.json`)
    const localeMessages = readJson(localePath)
    const merged = mergeWithBaseShape(prunedBaseMessages, localeMessages)
    writeJson(localePath, merged)
    console.log(`Pruned locale file -> messages/${locale}.json`)
  }

  generateIndex()
  validateMessages()
}

function syncMessages(targetLocale) {
  const baseMessages = readJson(path.join(MESSAGES_DIR, `${BASE_LOCALE}.json`))
  const locales = targetLocale ? [targetLocale] : listLocales().filter((locale) => locale !== BASE_LOCALE)

  for (const locale of locales) {
    const targetPath = path.join(MESSAGES_DIR, `${locale}.json`)
    const current = fs.existsSync(targetPath) ? readJson(targetPath) : {}
    const merged = mergeWithBaseShape(baseMessages, current)
    writeJson(targetPath, merged)
    console.log(`Synced locale file -> messages/${locale}.json`)
  }
}

function addLocale(locale) {
  if (!locale) {
    console.error('Usage: node ./scripts/i18n-tools.mjs add-locale <locale>')
    process.exit(1)
  }

  const targetPath = path.join(MESSAGES_DIR, `${locale}.json`)
  if (fs.existsSync(targetPath)) {
    console.error(`Locale file already exists: messages/${locale}.json`)
    process.exit(1)
  }

  const baseMessages = readJson(path.join(MESSAGES_DIR, `${BASE_LOCALE}.json`))
  writeJson(targetPath, baseMessages)

  console.log(`Created locale scaffold -> messages/${locale}.json`)
  console.log(`Next step: add ${locale} to apps/web/i18n/config.ts when translations are ready.`)
}

const command = process.argv[2] ?? 'check'
const argument = process.argv[3]

switch (command) {
  case 'generate':
    generateIndex()
    break
  case 'validate':
    validateMessages()
    break
  case 'sync':
    syncMessages(argument)
    break
  case 'add-locale':
    addLocale(argument)
    break
  case 'check':
    generateIndex()
    validateMessages()
    break
  case 'prune-unused':
    pruneUnusedMessages()
    break
  default:
    console.error(`Unknown command: ${command}`)
    process.exit(1)
}
