#!/usr/bin/env node
/*
 * check-sealed-private — the sealed evaluation sets never travel with the code.
 *
 * They are kept in their usual paths so the evaluators can read them, but git
 * ignores those paths: a push, a PR or a Vercel build cannot carry them, and
 * export_reports.py only exports documents. A sealed set that becomes public
 * stops measuring anything. The owner's private copy and its hashes live outside
 * the repository (docs/release/2026-11-history-rewrite-plan.md).
 */
import { execFileSync } from 'node:child_process'

export const SEALED = [
  'linguachat-backend/tests/guided_eval/guided_holdout_v1.jsonl',
  'linguachat-backend/tests/guided_eval/guided_holdout_v2.jsonl',
  'linguachat-backend/tests/safety_eval/holdout_v1.jsonl',
  'linguachat-frontend/scripts/fixtures/es-blind-holdout-v2.jsonl',
  'linguachat-frontend/scripts/fixtures/es-blind-holdout.jsonl',
]

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' })
const tracked = git('ls-files').split('\n').filter(path => /holdout[^/]*\.jsonl$/.test(path))
const unignored = SEALED.filter(path => {
  try { git('check-ignore', '-q', path); return false } catch { return true }
})
if (tracked.length || unignored.length) {
  for (const path of tracked) console.error(`tracked, would be published: ${path}`)
  for (const path of unignored) console.error(`not ignored, could be added: ${path}`)
  process.exit(1)
}
console.log(`check-sealed-private: ${SEALED.length} sealed sets ignored by git, none tracked`)
