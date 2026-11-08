#!/usr/bin/env node
/*
 * check-ledger-rollback — the 30th integrity scenario, reproducible anywhere.
 *
 * check-ledger-integrity runs "a v1 record plus P3-written copies migrate
 * exactly; … a rollback reads them back" only when the P3 implementation sits
 * next to the project (../_snapshot-p3), so a fresh clone or CI reports 29/29
 * plus NOT_TESTED. This extracts the P3 tree from the repository's own history
 * (the commit "P3: tutor and curriculum") into a temporary folder — with git
 * alone, no tar — and runs the full suite against it. Needs that commit in the
 * clone (CI: actions/checkout with fetch-depth: 0). `--require` fails when it
 * is missing instead of reporting NOT_TESTED.
 *
 * P3 is pinned by the tree id of linguachat-frontend/src, not by a commit hash.
 * Git names a tree by its bytes, so author or history rewrites leave it alone:
 * the authorized rewrite of 2026-11-07 moved the P3 commit from a9f5bac to
 * 6836e5c, and a clean GitHub clone no longer had a9f5bac (PR #139, run
 * 42439562663). The commit is still looked up in HEAD's own history, and its
 * tree must equal the pin, so the code under test is the code this branch had.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const P3_SUBJECT = 'P3: tutor and curriculum'
const P3_SRC_TREE = '299133bc60e49160902337d4d07b58f0a4e2f7a8'
const TREE = 'linguachat-frontend/src'
const here = dirname(fileURLToPath(import.meta.url))
const repo = resolve(here, '../..')
const git = (args, input) => execFileSync('git', args, { cwd: repo, input, maxBuffer: 512 * 1024 * 1024 })

const notTested = (why) => {
  console.log(`check-ledger-rollback: NOT_TESTED — ${why} (CI: fetch-depth: 0)`)
  process.exit(process.argv.includes('--require') ? 1 : 0)
}

const candidates = git(['log', '--format=%H', '--fixed-strings', `--grep=${P3_SUBJECT}`, 'HEAD']).toString('utf8').split('\n').filter(Boolean)
const tree = (commit) => { try { return git(['rev-parse', `${commit}:${TREE}`]).toString('utf8').trim() } catch { return '' } }
const P3_COMMIT = candidates.find(c => tree(c) === P3_SRC_TREE)
if (!P3_COMMIT) {
  if (candidates.length) {
    console.error(`check-ledger-rollback: "${P3_SUBJECT}" is in history but its ${TREE} is not ${P3_SRC_TREE}`)
    process.exit(1)
  }
  notTested(`no "${P3_SUBJECT}" commit in HEAD's history`)
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
  console.log(`check-ledger-rollback: P3 tree extracted from ${P3_COMMIT.slice(0, 7)}, ${TREE} ${P3_SRC_TREE.slice(0, 7)} (${paths.length} files)`)
  execFileSync(process.execPath, ['--max-old-space-size=4096', join(here, 'check-ledger-integrity.mjs')], {
    stdio: 'inherit', env: { ...process.env, LINGUACHAT_P3_TREE: dir },
  })
} finally {
  rmSync(dir, { recursive: true, force: true })
}
