// ChatGPT レビュー用バンドル自動生成（Node 18+）
// - git ls-files + globs で自動収集
// - .chatgpt-bundle.json で制御
// - 大きいファイルは末尾を省略
// - Raw URL: https://raw.githubusercontent.com/<owner>/<repo>/main/_chatgpt/bundle.md
// - 目次（TOC）を自動挿入

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, posix as path } from 'node:path'
import { execSync } from 'node:child_process'

// --- util: glob matcher (あれば micromatch、無ければ包括許可にフォールバック)
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
let micromatch
try { micromatch = require('micromatch') } catch {
  micromatch = { matcher: () => () => true }
}

const CFG_PATH = '.chatgpt-bundle.json'
const OUT_PATH = '_chatgpt/bundle.md'

// default config
const DEFAULT_CFG = {
  title: 'ChatGPT Review Bundle',
  always_include: ['README.md'],
  include_globs: ['src/**/*.{ts,tsx,js,jsx,vue}', 'docs/**/*.md'],
  exclude_globs: [
    '**/node_modules/**', '**/.git/**', '**/.github/workflows/**',
    '**/dist/**', '**/build/**', '**/coverage/**', '**/.supabase/**',
    '**/*.key', '**/*.pem', '**/*secret*'
    // .env 系は .chatgpt-bundle.json 側で個別に除外推奨
  ],
  max_files: 200,
  max_bytes_per_file: 200_000,
  sort: 'path'
}

function loadConfig() {
  if (!existsSync(CFG_PATH)) return DEFAULT_CFG
  try {
    const raw = execSync(`cat ${CFG_PATH}`, { encoding: 'utf8' })
    const cfg = JSON.parse(raw)
    return { ...DEFAULT_CFG, ...cfg }
  } catch (e) {
    console.warn(`[bundle] failed to read ${CFG_PATH}, fallback to default`, e.message)
    return DEFAULT_CFG
  }
}

function gitLsFiles() {
  // Git 管理下のファイルのみ対象（未追跡・巨大生成物を避ける）
  const out = execSync('git ls-files', { encoding: 'utf8' })
  return out.split('\n').filter(Boolean)
}

function filterFiles(files, include, exclude) {
  const isIncluded = micromatch.matcher(include.length ? include : ['**/*'])
  const isExcluded = micromatch.matcher(exclude.length ? exclude : [])
  return files.filter(f => isIncluded(f) && !isExcluded(f))
}

function sortFiles(files, sort, sizeMap) {
  if (sort === 'size') {
    return files.sort((a,b) => (sizeMap.get(b)||0)-(sizeMap.get(a)||0))
  }
  // default path
  return files.sort((a, b) => a.localeCompare(b))
}

async function safeRead(p, maxBytes) {
  try {
    let content = await readFile(p, 'utf8')
    if (Buffer.byteLength(content, 'utf8') > maxBytes) {
      // 末尾省略（最後に注記）
      const sliceBytes = Math.max(1000, maxBytes - 200)
      let buf = Buffer.from(content, 'utf8').subarray(0, sliceBytes).toString('utf8')
      buf += `\n\n---\n[truncated at ~${sliceBytes} bytes]\n`
      return buf
    }
    return content
  } catch (e) {
    return `/* failed to read: ${p} (${e.message}) */\n`
  }
}

// GitHub の見出しアンカーに準拠して生成
function toAnchor(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\-_\s/\.]/g, '')  // 記号を削る（ほどほど）
    .replace(/\s+/g, '-')               // 空白→-
    .replace(/[/.]+/g, '-')             // / . → -
    .replace(/-+/g, '-')                // 連続ハイフン圧縮
    .replace(/^-+|-+$/g, '')            // 先頭末尾ハイフン除去
}

function langFromExt(p) {
  const ext = path.extname(p).slice(1).toLowerCase()
  if (!ext) return ''
  // よくある拡張子を素直に言語名にする
  const map = { js:'js', mjs:'js', cjs:'js', ts:'ts', tsx:'tsx', jsx:'jsx', vue:'vue', json:'json', md:'md', yml:'yml', yaml:'yaml', sql:'sql', sh:'sh', css:'css', scss:'scss', html:'html' }
  return map[ext] || ''
}

function codeBlockHeader(p) {
  const lang = langFromExt(p)
  return `\n---\n\n## ${p}\n\n\`\`\`${lang}\n`
}
const codeBlockFooter = `\n\`\`\`\n`

function buildToc(paths) {
  return paths.map(p => `- [${p}](#${toAnchor(p)})`).join('\n')
}

async function main() {
  const cfg = loadConfig()
  const all = gitLsFiles()

  const includeList = Array.isArray(cfg.include_globs) ? cfg.include_globs : [cfg.include_globs]
  const excludeList = Array.isArray(cfg.exclude_globs) ? cfg.exclude_globs : [cfg.exclude_globs]
  const always = Array.isArray(cfg.always_include) ? cfg.always_include : []

  // always_include は存在するものだけ
  const alwaysFiles = always.filter(f => all.includes(f))

  // 残りを自動選定
  const candidates = filterFiles(all, includeList, excludeList)
    .filter(f => !alwaysFiles.includes(f))

  // サイズ情報（sort=size用）
  const sizeMap = new Map()
  for (const f of candidates) {
    try {
      const txt = execSync(`wc -c < "${f}"`).toString().trim()
      sizeMap.set(f, parseInt(txt, 10) || 0)
    } catch { sizeMap.set(f, 0) }
  }

  let selected = sortFiles(candidates, cfg.sort, sizeMap)
  if (selected.length > cfg.max_files) selected = selected.slice(0, cfg.max_files)

  // 目次対象の順序（always → selected）
  const ordered = [...alwaysFiles, ...selected]

  // 出力
  let out = `<!-- auto-generated -->\n# ${cfg.title}\n\n`
  if (ordered.length) {
    out += `## 目次\n\n${buildToc(ordered)}\n`
  }
  // always を先頭に
  for (const p of alwaysFiles) {
    const body = await safeRead(p, cfg.max_bytes_per_file)
    out += codeBlockHeader(p) + body + codeBlockFooter
  }
  // 自動選定
  for (const p of selected) {
    const body = await safeRead(p, cfg.max_bytes_per_file)
    out += codeBlockHeader(p) + body + codeBlockFooter
  }

  await mkdir(dirname(OUT_PATH), { recursive: true })
  await writeFile(OUT_PATH, out, 'utf8')
  console.log(`[bundle] wrote ${OUT_PATH} (${Buffer.byteLength(out, 'utf8')} bytes)`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})