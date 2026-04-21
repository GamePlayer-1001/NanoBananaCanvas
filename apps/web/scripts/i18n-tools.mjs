#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const WEB_ROOT = path.resolve(process.cwd())
const MESSAGES_DIR = path.join(WEB_ROOT, 'messages')
const GENERATED_INDEX_PATH = path.join(WEB_ROOT, 'i18n', 'message-index.ts')
const GENERATED_USAGE_PATH = path.join(WEB_ROOT, 'i18n', 'message-usage.ts')
const BASE_LOCALE = 'en'
const SCAN_ROOTS = ['app', 'components', 'hooks', 'lib']

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`)
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
  const usageIndex = collectUsageIndex()
  const usedLeafKeys = [...new Set(Object.values(usageIndex).flat())].sort()

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
 * [INPUT]: 依赖 app/components/hooks/lib 中的翻译函数调用
 * [OUTPUT]: 对外提供消息 key 使用索引与已消费 key 列表
 * [POS]: i18n 的生成使用索引文件，被运维校验与后续死 key 清理消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 *
 * 此文件由 scripts/i18n-tools.mjs 自动生成，请勿手改。
 */

export const MESSAGE_USAGE_INDEX = ${JSON.stringify(usageIndex, null, 2)} as const

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

  const usageIndex = collectUsageIndex()
  const usedLeafKeys = [...new Set(Object.values(usageIndex).flat())].sort()
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
  default:
    console.error(`Unknown command: ${command}`)
    process.exit(1)
}
