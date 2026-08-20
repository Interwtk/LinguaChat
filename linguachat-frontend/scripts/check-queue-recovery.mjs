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

function release(markdown) {
  return withQueue(markdown, file => {
    const id = execFileSync(process.execPath, [releaseScript], {
      encoding: 'utf8',
      env: { ...process.env, TASKS_PATH: file },
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

const healed = release(malformed)
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

const normalRelease = release(valid)
assert.equal(normalRelease.id, 'LC-PED-001')
assert.equal((normalRelease.text.match(/^## TODO\b/gm) || []).length, 1, 'normal recovery must not duplicate TODO')
assert.equal(next(normalRelease.text), 'LC-PED-001')
assert.ok(normalRelease.text.indexOf('[LC-PED-001]') < normalRelease.text.indexOf('[LC-I18N-002]'))

const missingTodoWithoutLeakedTasks = `# TASKS

## IN_PROGRESS

- [LC-PED-001] Active
  owner: claude-action
  branch: qa/lc-ped-001-arc-journeys

## BLOCKED

## DONE
`
const repairedEmptyTodo = release(missingTodoWithoutLeakedTasks)
assert.equal(repairedEmptyTodo.id, 'LC-PED-001')
assert.equal((repairedEmptyTodo.text.match(/^## TODO\b/gm) || []).length, 1)
assert.equal(next(repairedEmptyTodo.text), 'LC-PED-001')

console.log('check-queue-recovery — OK (missing TODO self-heals, ordering preserved)')
