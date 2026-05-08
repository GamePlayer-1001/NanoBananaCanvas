/**
 * [INPUT]: 依赖 ./legal-document-sources.generated 的静态文本常量
 * [OUTPUT]: 对外提供 getLegalDocumentSource 读取器、parseLegalDocument 文本解析器、LegalSection 类型
 * [POS]: lib 的法律文档真相源适配层，供公开 /terms 与 /privacy 页面读取打包进产物的协议原文
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { PRIVACY_SOURCE, TERMS_SOURCE } from './legal-document-sources.generated'

export type LegalSection = {
  heading: string
  paragraphs: string[]
  bullets: string[]
  table?: {
    headers: string[]
    rows: string[][]
  }
}

function isTableLine(line: string) {
  return line.trim().startsWith('|') && line.trim().endsWith('|')
}

function normalizeHeading(line: string) {
  const trimmed = line.trim()

  if (!trimmed) return null
  if (trimmed === 'Terms of Service' || trimmed === 'Privacy Policy') return null
  if (trimmed.startsWith('|') || trimmed.startsWith('`') || trimmed.startsWith('- ')) return null

  if (trimmed.startsWith('#')) {
    return trimmed.replace(/^#+\s*/, '').trim()
  }

  if (trimmed.length > 90) return null
  if (/[.:;!?]$/.test(trimmed)) return null
  if (!/[A-Za-z]/.test(trimmed)) return null

  return trimmed
}

export function getLegalDocumentSource(filename: string) {
  if (filename === '服务条款Terms of Service') {
    return TERMS_SOURCE
  }

  if (filename === '隐私政策Privacy Policy') {
    return PRIVACY_SOURCE
  }

  throw new Error(`Unknown legal document source: ${filename}`)
}

export function parseLegalDocument(source: string) {
  const lines = source.replace(/^\uFEFF/, '').split(/\r?\n/)
  const intro: string[] = []
  const sections: LegalSection[] = []
  let current: LegalSection | null = null

  const ensureSection = (heading = 'General') => {
    if (!current) {
      current = { heading, paragraphs: [], bullets: [] }
      sections.push(current)
    }
    return current
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) continue
    if (trimmed === 'Terms of Service' || trimmed === 'Privacy Policy' || trimmed === '# Privacy Policy') {
      continue
    }

    if (isTableLine(trimmed)) {
      const header = trimmed
        .split('|')
        .map((part) => part.trim())
        .filter(Boolean)
      const divider = lines[i + 1]?.trim() ?? ''

      if (header.length && isTableLine(divider)) {
        const rows: string[][] = []
        i += 2
        while (i < lines.length && isTableLine(lines[i].trim())) {
          rows.push(
            lines[i]
              .trim()
              .split('|')
              .map((part) => part.trim())
              .filter(Boolean),
          )
          i += 1
        }
        i -= 1
        ensureSection().table = { headers: header, rows }
        continue
      }
    }

    const heading = normalizeHeading(trimmed)
    if (heading) {
      current = { heading, paragraphs: [], bullets: [] }
      sections.push(current)
      continue
    }

    if (trimmed.startsWith('- ')) {
      ensureSection().bullets.push(trimmed.slice(2))
      continue
    }

    if (current) {
      current.paragraphs.push(trimmed)
    } else {
      intro.push(trimmed)
    }
  }

  return { intro, sections }
}
