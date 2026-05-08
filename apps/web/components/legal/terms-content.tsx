/**
 * [INPUT]: 依赖 @/lib/legal-documents 的 readLegalDocument/parseLegalDocument，依赖 ./legal-document-renderer
 * [OUTPUT]: 对外提供 TermsContent 服务条款内容组件
 * [POS]: legal 的条款页面真相源，被 terms/page.tsx 消费并承接 landing footer 的 /terms 链接
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { LegalDocumentRenderer } from './legal-document-renderer'

import { parseLegalDocument, readLegalDocument } from '@/lib/legal-documents'

export async function TermsContent() {
  const source = await readLegalDocument('服务条款Terms of Service')
  const { intro, sections } = parseLegalDocument(source)

  return (
    <LegalDocumentRenderer
      title="Terms of Service"
      updatedAt="May 8, 2026"
      intro={intro}
      sections={sections}
    />
  )
}
