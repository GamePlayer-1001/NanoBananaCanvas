/**
 * [INPUT]: 依赖 react 的 ReactNode/createElement
 * [OUTPUT]: 对外提供 renderSimpleMarkdown() 将 Markdown 文本转换为 React 元素
 * [POS]: lib/utils 的轻量 Markdown 渲染器，被 DisplayNode 消费，零外部依赖
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { type ReactNode } from 'react'

/* ─── Inline Patterns ────────────────────────────────── */

const INLINE_RULES: { pattern: RegExp; render: (match: RegExpExecArray, key: string) => ReactNode }[] = [
  /* code (must be before bold/italic to avoid conflicts) */
  {
    pattern: /`([^`]+)`/,
    render: (m, k) => (
      <code key={k} className="bg-muted rounded px-1 font-mono text-xs">
        {m[1]}
      </code>
    ),
  },
  /* bold */
  {
    pattern: /\*\*(.+?)\*\*/,
    render: (m, k) => <strong key={k}>{parseInline(m[1], k)}</strong>,
  },
  /* italic */
  {
    pattern: /\*(.+?)\*/,
    render: (m, k) => <em key={k}>{parseInline(m[1], k)}</em>,
  },
  /* link */
  {
    pattern: /\[([^\]]+)\]\(([^)]+)\)/,
    render: (m, k) => (
      <a
        key={k}
        href={m[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[var(--brand-500)] underline"
      >
        {m[1]}
      </a>
    ),
  },
]

/* ─── Inline Parser ──────────────────────────────────── */

/**
 * 递归解析行内 Markdown 语法 (bold/italic/code/link)
 */
function parseInline(text: string, prefix: string = ''): ReactNode[] {
  const nodes: ReactNode[] = []
  let remaining = text
  let idx = 0

  while (remaining.length > 0) {
    let earliest: { rule: (typeof INLINE_RULES)[number]; match: RegExpExecArray; index: number } | null = null

    for (const rule of INLINE_RULES) {
      const match = rule.pattern.exec(remaining)
      if (match && (!earliest || match.index < earliest.index)) {
        earliest = { rule, match, index: match.index }
      }
    }

    if (!earliest) {
      nodes.push(remaining)
      break
    }

    /* 匹配前的纯文本 */
    if (earliest.index > 0) {
      nodes.push(remaining.slice(0, earliest.index))
    }

    nodes.push(earliest.rule.render(earliest.match, `${prefix}-${idx}`))
    remaining = remaining.slice(earliest.index + earliest.match[0].length)
    idx++
  }

  return nodes
}

/* ─── Block Parser ───────────────────────────────────── */

/**
 * 将 Markdown 文本转换为 React 元素树
 *
 * 支持: # 标题, **粗体**, *斜体*, `行内代码`,
 *       ```代码块```, - 列表, > 引用, [链接](url)
 */
export function renderSimpleMarkdown(text: string): ReactNode {
  const lines = text.split('\n')
  const elements: ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    /* ── 代码块 (```) ───────────────────────────────── */
    if (line.trimStart().startsWith('```')) {
      const codeLines: string[] = []
      const lang = line.trimStart().slice(3).trim()
      i++
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++ // skip closing ```
      elements.push(
        <pre
          key={key++}
          className="bg-muted my-1 overflow-x-auto rounded px-2 py-1.5 font-mono text-xs"
          data-lang={lang || undefined}
        >
          <code>{codeLines.join('\n')}</code>
        </pre>,
      )
      continue
    }

    /* ── 空行 ───────────────────────────────────────── */
    if (line.trim() === '') {
      i++
      continue
    }

    /* ── 标题 (# ~ ###) ────────────────────────────── */
    const headingMatch = /^(#{1,3})\s+(.+)$/.exec(line)
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3
      const sizes = { 1: 'text-base font-bold', 2: 'text-sm font-bold', 3: 'text-sm font-semibold' }
      elements.push(
        <div key={key++} className={`${sizes[level]} mt-1`}>
          {parseInline(headingMatch[2], `h-${key}`)}
        </div>,
      )
      i++
      continue
    }

    /* ── 引用 (> ) ──────────────────────────────────── */
    if (line.trimStart().startsWith('> ')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].trimStart().startsWith('> ')) {
        quoteLines.push(lines[i].trimStart().slice(2))
        i++
      }
      elements.push(
        <blockquote
          key={key++}
          className="text-muted-foreground my-1 border-l-2 border-[var(--brand-500)] pl-2 text-xs italic"
        >
          {quoteLines.map((ql, qi) => (
            <span key={qi}>
              {parseInline(ql, `bq-${key}-${qi}`)}
              {qi < quoteLines.length - 1 && <br />}
            </span>
          ))}
        </blockquote>,
      )
      continue
    }

    /* ── 无序列表 (- / * ) ──────────────────────────── */
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''))
        i++
      }
      elements.push(
        <ul key={key++} className="my-1 list-inside list-disc space-y-0.5 text-xs">
          {items.map((item, ii) => (
            <li key={ii}>{parseInline(item, `li-${key}-${ii}`)}</li>
          ))}
        </ul>,
      )
      continue
    }

    /* ── 普通段落 ───────────────────────────────────── */
    elements.push(
      <p key={key++} className="text-sm leading-relaxed">
        {parseInline(line, `p-${key}`)}
      </p>,
    )
    i++
  }

  return <div className="space-y-1">{elements}</div>
}
