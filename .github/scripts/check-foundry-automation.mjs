import { runWithPausedWorkflowFixtures } from './paused-workflow-fixtures.mjs'
await runWithPausedWorkflowFixtures(new URL('./check-foundry-automation-core.mjs', import.meta.url))
