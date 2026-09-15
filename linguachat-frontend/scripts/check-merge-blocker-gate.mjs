import { runWithPausedWorkflowFixtures } from '../../.github/scripts/paused-workflow-fixtures.mjs'
await runWithPausedWorkflowFixtures(new URL('./check-merge-blocker-gate-core.mjs', import.meta.url))
