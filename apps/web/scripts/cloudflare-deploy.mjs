/**
 * [INPUT]: 依赖 @opennextjs/cloudflare 的内部 build API，依赖 wrangler CLI 执行 Cloudflare Worker 部署
 * [OUTPUT]: 对外提供 Cloudflare OpenNext 构建与部署命令入口，补齐 Windows 下 edge config 丢失兜底
 * [POS]: apps/web/scripts 的生产部署包装器，替代直接调用 opennextjs-cloudflare CLI
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

/* ─── Paths ──────────────────────────────────────────── */

const require = createRequire(import.meta.url)
const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const appDir = path.resolve(scriptDir, '..')
const cloudflareEntry = require.resolve('@opennextjs/cloudflare')
const cloudflarePackageDir = path.resolve(path.dirname(cloudflareEntry), '..', '..')
const awsPackageDir = path.resolve(cloudflarePackageDir, '..', 'aws')

/* ─── Dynamic Imports ────────────────────────────────── */

const importCloudflareModule = async (relativePath) =>
  import(pathToFileURL(path.join(cloudflarePackageDir, relativePath)).href)

async function loadCloudflareBuildModules() {
  const [{ build: buildImpl }, utilsModule] = await Promise.all([
    importCloudflareModule('dist/cli/build/build.js'),
    importCloudflareModule('dist/cli/commands/utils/utils.js'),
  ])

  return {
    buildImpl,
    compileConfig: utilsModule.compileConfig,
    getNormalizedOptions: utilsModule.getNormalizedOptions,
    printHeaders: utilsModule.printHeaders,
    readWranglerConfig: utilsModule.readWranglerConfig,
  }
}

/* ─── Windows Patch ──────────────────────────────────── */

function ensureEdgeConfig(buildDir, sourceDir) {
  const edgeConfigPath = path.join(buildDir, 'open-next.config.edge.mjs')
  if (fs.existsSync(edgeConfigPath)) {
    return
  }

  const sourceCandidates = [
    path.join(sourceDir, 'open-next.config.edge.mjs'),
    path.join(sourceDir, 'open-next.config.mjs'),
  ]

  const sourcePath = sourceCandidates.find((candidate) => fs.existsSync(candidate))
  if (sourcePath) {
    fs.copyFileSync(sourcePath, edgeConfigPath)
    return
  }

  const tsConfigPath = path.join(appDir, 'open-next.config.ts')
  if (!fs.existsSync(tsConfigPath)) {
    return
  }

  const source = fs.readFileSync(tsConfigPath, 'utf8')
  const transpiled = source
    .replace(/^import type .*$/gm, '')
    .replace(
      /const config\s*:\s*OpenNextConfig\s*=/g,
      'const config =',
    )

  fs.writeFileSync(edgeConfigPath, transpiled)
}

function copyTreeSync(source, destination) {
  const stats = fs.statSync(source)
  if (stats.isDirectory()) {
    fs.mkdirSync(destination, { recursive: true })
    for (const entry of fs.readdirSync(source)) {
      copyTreeSync(path.join(source, entry), path.join(destination, entry))
    }
    return
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true })
  fs.copyFileSync(source, destination)
}

function installWindowsOpenNextPatch() {
  if (process.platform !== 'win32') {
    return
  }

  const originalCpSync = fs.cpSync
  fs.cpSync = function patchedCpSync(source, destination, options) {
    const shouldUseSafeRecursiveCopy =
      typeof options === 'object' &&
      options !== null &&
      options.recursive === true &&
      typeof source === 'string' &&
      typeof destination === 'string'

    if (shouldUseSafeRecursiveCopy) {
      copyTreeSync(source, destination)
      if (destination.endsWith(path.join('.open-next', '.build'))) {
        ensureEdgeConfig(destination, source)
      }
      return
    }

    const result = originalCpSync.call(fs, source, destination, options)
    if (
      typeof source === 'string' &&
      typeof destination === 'string' &&
      destination.endsWith(path.join('.open-next', '.build'))
    ) {
      ensureEdgeConfig(destination, source)
    }
    return result
  }

  const originalCopyFileSync = fs.copyFileSync
  fs.copyFileSync = function patchedCopyFileSync(source, destination, mode) {
    if (
      typeof source === 'string' &&
      source.endsWith('open-next.config.edge.mjs') &&
      !fs.existsSync(source)
    ) {
      const buildDir = path.dirname(source)
      ensureEdgeConfig(buildDir, buildDir)
    }

    return mode === undefined
      ? originalCopyFileSync.call(fs, source, destination)
      : originalCopyFileSync.call(fs, source, destination, mode)
  }

}

function applyWindowsOpenNextSourcePatch() {
  if (process.platform !== 'win32') {
    return
  }

  const copyTracedFilesPath = path.join(awsPackageDir, 'dist', 'build', 'copyTracedFiles.js')
  const source = fs.readFileSync(copyTracedFilesPath, 'utf8')
  if (source.includes('windows-symlink-fallback')) {
    return
  }

  const patchedSource = source.replace(
    '                symlinkSync(symlink, to);',
    `                try {
                    symlinkSync(symlink, to);
                }
                catch (e) {
                    if (e.code !== "EPERM") {
                        throw e;
                    }
                    const resolvedSymlink = path.isAbsolute(symlink)
                        ? symlink
                        : path.resolve(path.dirname(from), symlink);
                    const symlinkStats = statSync(resolvedSymlink);
                    // windows-symlink-fallback
                    if (symlinkStats.isDirectory()) {
                        cpSync(resolvedSymlink, to, { recursive: true });
                    }
                    else {
                        copyFileAndMakeOwnerWritable(resolvedSymlink, to);
                    }
                }`
  )

  fs.writeFileSync(copyTracedFilesPath, patchedSource)
}

/* ─── Commands ───────────────────────────────────────── */

async function buildCloudflare() {
  installWindowsOpenNextPatch()
  applyWindowsOpenNextSourcePatch()

  const {
    buildImpl,
    compileConfig,
    getNormalizedOptions,
    printHeaders,
    readWranglerConfig,
  } = await loadCloudflareBuildModules()

  printHeaders('build')

  const { config, buildDir } = await compileConfig(path.join(appDir, 'open-next.config.ts'))
  if (process.platform === 'win32' && config.functions) {
    for (const functionConfig of Object.values(config.functions)) {
      functionConfig.routes = functionConfig.routes.map((route) =>
        route.startsWith('app/')
          ? `app/${route.slice(4).replaceAll('/', path.win32.sep)}`
          : route.startsWith('pages/')
            ? `pages/${route.slice(6).replaceAll('/', path.win32.sep)}`
            : route
      )
    }
  }
  const options = getNormalizedOptions(config, buildDir)
  const projectOptions = {
    args: [],
    minify: true,
    noMinify: false,
    skipNextBuild: false,
    skipWranglerConfigCheck: true,
    sourceDir: appDir,
    wranglerConfigPath: undefined,
  }
  const wranglerConfig = await readWranglerConfig({})

  await buildImpl(options, config, projectOptions, wranglerConfig, false)
}

function runWranglerDeploy(extraArgs) {
  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx'
  const result = spawnSync(command, ['wrangler', 'deploy', ...extraArgs], {
    cwd: appDir,
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

async function main() {
  const [command = 'build', ...args] = process.argv.slice(2)

  if (command === 'build') {
    await buildCloudflare()
    return
  }

  if (command === 'deploy') {
    await buildCloudflare()
    runWranglerDeploy(args)
    return
  }

  console.error(`Unsupported command: ${command}`)
  process.exit(1)
}

await main()
