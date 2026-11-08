#!/usr/bin/env node
/*
 * check-line-endings — Windows portability (P5).
 *
 * The repository is LF everywhere. Editing on Windows can silently rewrite a
 * file as CRLF (Python's text mode does it), and some checks read source with
 * '\n' signatures, so a CRLF file breaks them in ways that look unrelated. In
 * P5 this happened to 17 files; this check keeps it from happening again.
 *
 * Run: node scripts/check-line-endings.mjs
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = fileURLToPath(new URL('../..', import.meta.url))
const SKIP = new Set(['node_modules', 'dist', '.venv', '__pycache__', '.pytest_cache', '.git'])
const TEXT = /\.(m?js|jsx|cjs|ts|py|json|md|css|html|ya?ml|toml|txt|svg|sh)$/i

const offenders = []
const walk = dir => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) walk(path)
    else if (TEXT.test(entry.name) && readFileSync(path).includes('\r\n')) offenders.push(relative(REPO, path))
  }
}
walk(REPO)
if (offenders.length) {
  console.log(`check-line-endings — FAIL: ${offenders.length} file(s) with CRLF line endings:\n  ${offenders.join('\n  ')}`)
  process.exit(1)
}
console.log('check-line-endings — OK (every text file is LF)')
