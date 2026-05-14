/**
 * [INPUT]: 依赖 Node.js process/path/child_process，依赖同目录 Python 导出器解析 Excel 嵌入图片与文本列
 * [OUTPUT]: 对外提供 Excel 嵌入图片导出与 Explore manifest 生成脚本 (Node 包装器 -> Python 真正执行)
 * [POS]: scripts 的 Excel→Explore 资产预处理入口，被内容迁移与运营导入复用，负责调用稳定导出器完成图片与 manifest 生成
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import path from 'node:path'
import process from 'node:process'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const pythonScriptPath = path.join(scriptDir, 'export-explore-images-from-excel.py')

function main() {
  const python = process.env.PYTHON || 'python'
  const result = spawnSync(python, [pythonScriptPath, ...process.argv.slice(2)], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: process.env,
    encoding: 'utf8',
  })

  if (result.error) {
    throw result.error
  }

  process.exit(result.status ?? 0)
}

main()
