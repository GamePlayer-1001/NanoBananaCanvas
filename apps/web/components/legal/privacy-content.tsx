/**
 * [INPUT]: 依赖 @/lib/legal-documents 的 getLegalDocumentSource/parseLegalDocument，依赖 ./legal-document-renderer
 * [OUTPUT]: 对外提供 PrivacyContent 隐私政策内容组件
 * [POS]: legal 的隐私页面真相源，被 privacy/page.tsx 消费并承接 landing footer 的 /privacy 链接
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { LegalDocumentRenderer } from './legal-document-renderer'

import { getLegalDocumentSource, parseLegalDocument } from '@/lib/legal-documents'

export async function PrivacyContent() {
  const source = getLegalDocumentSource('隐私政策Privacy Policy')
  const { intro, sections } = parseLegalDocument(source)

  return (
    <LegalDocumentRenderer
      title="Privacy Policy"
      updatedAt="May 8, 2026"
      intro={intro}
      sections={sections}
    />
  )
}
