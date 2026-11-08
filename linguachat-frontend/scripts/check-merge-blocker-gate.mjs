/*
 * GitHub-integration check: runs the real merge workflow scripts against a fake
 * `gh`. Those scripts need bash and jq, as on the GitHub runner. Without them
 * the scripts stop half-way and the core reports a confusing mismatch, so say
 * what is missing instead — and fail, never skip: CI runs this as its own step
 * (`npm run check:github-integration`), outside the portable check:all.
 */
import { spawnSync } from 'node:child_process'
import { runWithPausedWorkflowFixtures } from '../../.github/scripts/paused-workflow-fixtures.mjs'

const missing = ['bash', 'jq'].filter(tool => spawnSync(tool, ['--version'], { stdio: 'ignore' }).status !== 0)
if (missing.length) {
  console.error(`check-merge-blocker-gate — cannot run here: needs ${missing.join(' and ')} (GitHub-integration check; runs in CI)`)
  process.exit(1)
}
await runWithPausedWorkflowFixtures(new URL('./check-merge-blocker-gate-core.mjs', import.meta.url))
