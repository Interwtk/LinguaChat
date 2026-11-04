/*
 * GitHub-integration check: runs the real merge workflow scripts against a fake
 * `gh`. Those scripts need bash and jq, as on the GitHub runner. Without them
 * the scripts stop half-way and the core reports a confusing mismatch, so say
 * what is missing instead — and fail, never skip: CI runs this as its own step
 * (`npm run check:github-integration`), outside the portable check:all.
 */
import { spawnSync } from 'node:child_process'
import { delimiter } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runWithPausedWorkflowFixtures } from '../../.github/scripts/paused-workflow-fixtures.mjs'

// LINGUACHAT_JQ_LITE=1 (local only, never CI): jq-lite stands in for jq on Windows
if (process.env.LINGUACHAT_JQ_LITE === '1' && !process.env.CI) {
  process.env.PATH = `${fileURLToPath(new URL('./tools/jq-bin', import.meta.url))}${delimiter}${process.env.PATH}`
  process.env.JQ_LITE_NODE = process.execPath
  console.log('check-merge-blocker-gate — using jq-lite (local subset); CI with real jq stays the authority')
}
const available = (tool) => spawnSync('bash', ['-c', `command -v ${tool}`], { stdio: 'ignore' }).status === 0
const missing = spawnSync('bash', ['--version'], { stdio: 'ignore' }).status !== 0 ? ['bash', 'jq'] : available('jq') ? [] : ['jq']
if (missing.length) {
  console.error(`check-merge-blocker-gate — cannot run here: needs ${missing.join(' and ')} (GitHub-integration check; runs in CI)`)
  process.exit(1)
}
await runWithPausedWorkflowFixtures(new URL('./check-merge-blocker-gate-core.mjs', import.meta.url))
