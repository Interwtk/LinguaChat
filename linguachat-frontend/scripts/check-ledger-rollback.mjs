#!/usr/bin/env node
/*
 * check-ledger-rollback — the 30th integrity scenario, reproducible anywhere.
 *
 * check-ledger-integrity runs "a v1 record plus P3-written copies migrate
 * exactly; … a rollback reads them back" only when the P3 implementation sits
 * next to the project (../_snapshot-p3), so a fresh clone or CI reports 29/29
 * plus NOT_TESTED. This extracts the P3 tree from the repository's own history
 * (commit a9f5bac, "P3: tutor and curriculum") into a temporary folder — with
 * git alone, no tar — and runs the full suite against it. Needs the commit in
 * the clone (CI: actions/checkout with fetch-depth: 0). `--require` fails when
 * the commit is missing instead of reporting NOT_TESTED.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const P3_COMMIT = 'a9f5bac'
const TREE = 'linguachat-frontend/src'
const here = dirname(fileURLToPath(import.meta.url))
const repo = resolve(here, '../..')
const git = (args, input) => execFileSync('git', args, { cwd: repo, input, maxBuffer: 512 * 1024 * 1024 })

try {
  git(['cat-file', '-e', `${P3_COMMIT}^{commit}`])
} catch {
  console.log(`check-ledger-rollback: NOT_TESTED — commit ${P3_COMMIT} is not in this clone (CI: fetch-depth: 0)`)
  process.exit(process.argv.includes('--require') ? 1 : 0)
}

const dir = mkdtempSync(join(tmpdir(), 'lc-p3-'))
try {
  const paths = git(['ls-tree', '-r', '--name-only', P3_COMMIT, TREE]).toString('utf8').split('\n').filter(Boolean)
  // one process for every blob: "<sha> blob <size>\n<bytes>\n" per requested path
  const out = git(['cat-file', '--batch'], paths.map(p => `${P3_COMMIT}:${p}`).join('\n') + '\n')
  let at = 0
  for (const path of paths) {
    const eol = out.indexOf(0x0a, at)
    const [, type, size] = out.subarray(at, eol).toString('utf8').split(' ')
    if (type !== 'blob') throw new Error(`unexpected object for ${path}`)
    const body = out.subarray(eol + 1, eol + 1 + Number(size))
    at = eol + 1 + Number(size) + 1
    mkdirSync(dirname(join(dir, path)), { recursive: true })
    writeFileSync(join(dir, path), body)
  }
  console.log(`check-ledger-rollback: P3 tree extracted from ${P3_COMMIT} (${paths.length} files)`)
  execFileSync(process.execPath, ['--max-old-space-size=4096', join(here, 'check-ledger-integrity.mjs')], {
    stdio: 'inherit', env: { ...process.env, LINGUACHAT_P3_TREE: dir },
  })
} finally {
  rmSync(dir, { recursive: true, force: true })
}
