import { runWithPausedWorkflowFixtures } from '../../.github/scripts/paused-workflow-fixtures.mjs'
await runWithPausedWorkflowFixtures(new URL('./check-cloud-automation-core.mjs', import.meta.url))
