import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const releaseScript = join(root, '.github/scripts/release-stale-claim.mjs')
const nextTask = join(root, '.github/scripts/next-task.mjs')

function withQueue(markdown, fn) {
  const dir = mkdtempSync(join(tmpdir(), 'lc-queue-recovery-'))
  const file = join(dir, 'TASKS.md')
  try {
    writeFileSync(file, markdown)
    return fn(file)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

function release(markdown, branchState = 'missing') {
  return withQueue(markdown, file => {
    const id = execFileSync(process.execPath, [releaseScript], {
      encoding: 'utf8',
      env: { ...process.env, TASKS_PATH: file, RELEASE_BRANCH_STATE: branchState },
    }).trim()
    return { id, text: readFileSync(file, 'utf8') }
  })
}

function next(markdown) {
  return withQueue(markdown, file => execFileSync(process.execPath, [nextTask], {
    encoding: 'utf8',
    env: { ...process.env, TASKS_PATH: file },
  }).trim())
}

const malformed = `# TASKS

## IN_PROGRESS

- [LC-PED-001] Stress-test arcs
  owner: claude-action
  branch: qa/lc-ped-001-arc-journeys
  why: active work
  done: prove it

- [LC-I18N-002] Honest language support
  owner: unclaimed
  branch: none
  why: queued work
  done: prove it

- [LC-QA-001] Better linter
  owner: unclaimed
  branch: none
  blocked-on: LC-I18N-002
  why: later work
  done: prove it

## BLOCKED

- [LC-CLOUD-001] Cloud
  owner: unclaimed
  branch: none

## DONE
`

const healed = release(malformed, 'missing')
assert.equal(healed.id, 'LC-PED-001')
assert.equal((healed.text.match(/^## TODO\b/gm) || []).length, 1, 'recovery must restore exactly one TODO heading')
assert.match(healed.text, /## IN_PROGRESS\n\n_\(none — the queue is open\)_/)
assert.match(healed.text, /## TODO[^\n]*\n\n- \[LC-PED-001\][\s\S]*?owner:\s+unclaimed[\s\S]*?branch:\s+none/)
assert.ok(healed.text.indexOf('[LC-PED-001]') < healed.text.indexOf('[LC-I18N-002]'), 'released task must resume before later queued work')
assert.ok(healed.text.indexOf('[LC-I18N-002]') < healed.text.indexOf('[LC-QA-001]'), 'queued order must be preserved')
assert.ok(healed.text.indexOf('## TODO') < healed.text.indexOf('## BLOCKED'), 'TODO must be restored before BLOCKED')
assert.equal(next(healed.text), 'LC-PED-001', 'the healed queue must immediately make the released task claimable again')

const valid = `# TASKS

## IN_PROGRESS

- [LC-PED-001] Active
  owner: claude-action
  branch: qa/lc-ped-001-arc-journeys

## TODO — ordered; take the first unclaimed one you are allowed to do

- [LC-I18N-002] Next
  owner: unclaimed
  branch: none

## BLOCKED

## DONE
`

// A real remote checkpoint must survive claim release. This is the durable
// task -> branch mapping the workflow_run handler needs for immediate resume.
const checkpointRelease = release(valid, 'exists')
assert.equal(checkpointRelease.id, 'LC-PED-001')
assert.equal((checkpointRelease.text.match(/^## TODO\b/gm) || []).length, 1)
assert.match(checkpointRelease.text, /- \[LC-PED-001\][\s\S]*?owner:\s+unclaimed[\s\S]*?branch:\s+qa\/lc-ped-001-arc-journeys/)
assert.equal(next(checkpointRelease.text), 'LC-PED-001')
assert.ok(checkpointRelease.text.indexOf('[LC-PED-001]') < checkpointRelease.text.indexOf('[LC-I18N-002]'))

// No remote checkpoint means the stale mapping is honestly cleared. The task is
// still claimable, but worker-completion must not hot-loop immediately.
const noCheckpointRelease = release(valid, 'missing')
assert.equal(noCheckpointRelease.id, 'LC-PED-001')
assert.match(noCheckpointRelease.text, /- \[LC-PED-001\][\s\S]*?owner:\s+unclaimed[\s\S]*?branch:\s+none/)
assert.equal(next(noCheckpointRelease.text), 'LC-PED-001')

// Infrastructure uncertainty is fail-closed: losing GitHub/network visibility must
// never erase a branch that may contain the only resumable checkpoint.
const uncertainRelease = release(valid, 'error')
assert.equal(uncertainRelease.id, 'LC-PED-001')
assert.match(uncertainRelease.text, /- \[LC-PED-001\][\s\S]*?branch:\s+qa\/lc-ped-001-arc-journeys/)

const missingTodoWithoutLeakedTasks = `# TASKS

## IN_PROGRESS

- [LC-PED-001] Active
  owner: claude-action
  branch: qa/lc-ped-001-arc-journeys

## BLOCKED

## DONE
`
const repairedEmptyTodo = release(missingTodoWithoutLeakedTasks, 'missing')
assert.equal(repairedEmptyTodo.id, 'LC-PED-001')
assert.equal((repairedEmptyTodo.text.match(/^## TODO\b/gm) || []).length, 1)
assert.equal(next(repairedEmptyTodo.text), 'LC-PED-001')

console.log('check-queue-recovery — OK (checkpoint preserved, missing branch cleared, uncertainty fail-closed)')
