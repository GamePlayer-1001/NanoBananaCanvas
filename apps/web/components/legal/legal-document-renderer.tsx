/**
 * [INPUT]: 依赖 @/lib/legal-documents 的 LegalSection 契约
 * [OUTPUT]: 对外提供 LegalDocumentRenderer 通用法律文档渲染组件
 * [POS]: legal 的基础渲染器，被 terms-content.tsx 与 privacy-content.tsx 复用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { LegalSection } from '@/lib/legal-documents'

type Props = {
  title: string
  updatedAt: string
  intro: string[]
  sections: LegalSection[]
}

export function LegalDocumentRenderer({ title, updatedAt, intro, sections }: Props) {
  return (
    <div className="bg-[#09090d] px-4 pb-24 pt-8 sm:px-6 sm:pt-10 lg:px-8 xl:px-10">
      <div className="mx-auto max-w-[880px]">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-white/50">Last updated: {updatedAt}</p>

        <div className="mt-6 space-y-4 text-sm leading-7 text-white/72 sm:text-[15px]">
          {intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-10 space-y-8 text-sm leading-7 text-white/72 sm:text-[15px]">
          {sections.map((section) => (
            <section key={section.heading} className="space-y-4">
              <h2 className="text-xl font-semibold text-white sm:text-2xl">{section.heading}</h2>

              {section.paragraphs.map((paragraph) => (
                <p key={`${section.heading}-${paragraph}`}>{paragraph}</p>
              ))}

              {section.bullets.length > 0 ? (
                <ul className="list-disc space-y-3 pl-5 marker:text-white/45">
                  {section.bullets.map((item) => (
                    <li key={`${section.heading}-${item}`}>{item}</li>
                  ))}
                </ul>
              ) : null}

              {section.table ? (
                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
                  <table className="min-w-full border-collapse text-left text-sm text-white/72">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.04] text-white/88">
                        {section.table.headers.map((header) => (
                          <th key={`${section.heading}-${header}`} className="px-4 py-3 font-medium">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.table.rows.map((row, rowIndex) => (
                        <tr key={`${section.heading}-row-${rowIndex}`} className="border-b border-white/6 last:border-b-0">
                          {row.map((cell, cellIndex) => (
                            <td key={`${section.heading}-${rowIndex}-${cellIndex}`} className="px-4 py-3 align-top">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
