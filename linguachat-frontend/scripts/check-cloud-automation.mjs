import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = fileURLToPath(new URL('.', import.meta.url))
const root = fileURLToPath(new URL('../../', import.meta.url))
const read = rel => readFileSync(join(root, rel), 'utf8')

const chain = read('.github/workflows/claude-chain.yml')
const task = read('.github/workflows/claude-task.yml')
const i18n = read('.github/workflows/claude-i18n.yml')
const mention = read('.github/workflows/claude-mention.yml')
const qa = read('.github/workflows/qa.yml')
const mergeScript = read('.github/scripts/merge-agent-pr.sh')
const nextTask = join(root, '.github/scripts/next-task.mjs')

let groups = 0
const ok = () => { groups++ }

// 1. The chain, not a worker, owns the scheduler.
assert.match(chain, /schedule:\s*\n\s*#?[\s\S]*?cron:\s*['"]17 \* \* \* \*['"]/) 
assert.doesNotMatch(task, /^\s*schedule:/m)
assert.doesNotMatch(i18n, /^\s*schedule:/m)
ok()

// 2. All Claude writers serialize through the same repository-wide lock.
for (const [name, text] of [['task', task], ['i18n', i18n], ['mention', mention]]) {
  assert.match(text, /group:\s*linguachat-claude-writer\b/, `${name} does not share the writer lock`)
}
assert.match(chain, /for WF in claude-task\.yml claude-i18n\.yml claude-mention\.yml/)
ok()

// 3. There is no Claude push-trigger loop. QA may still gate pushes to main.
for (const [name, text] of [['chain', chain], ['task', task], ['i18n', i18n], ['mention', mention]]) {
  assert.doesNotMatch(text, /^\s*push:\s*$/m, `${name} gained a push trigger`)
}
ok()

// 4. A QA transition from draft -> ready is a first-class trigger.
assert.match(qa, /pull_request:\s*\n\s*types:\s*\[[^\]]*ready_for_review[^\]]*\]/)
ok()

// 5. Same-run advancement is explicit; the workflow does not wait for a second event.
assert.match(chain, /needs:\s*\[merge\]/)
assert.match(chain, /github\.event_name == 'workflow_run' && needs\.merge\.outputs\.merged == 'true'/)
assert.match(chain, /Refresh main after a same-run merge/)
ok()

// 6. Both workers ask the one queue parser and reject the wrong lane/request.
assert.match(task, /node \.github\/scripts\/next-task\.mjs/)
assert.match(i18n, /node \.github\/scripts\/next-task\.mjs/)
assert.match(task, /LC-I18N-\*\)/)
assert.match(i18n, /case "\$NEXT" in[\s\S]*LC-I18N-\*\)/)
assert.match(task, /Requested \$REQUESTED but the only claimable task is \$NEXT/)
assert.match(i18n, /Requested \$REQUESTED but the only claimable task is \$NEXT/)
ok()

// 7. Final bookkeeping is part of the PR merge contract, not a later main commit.
for (const f of ['.ai/TASKS.md', '.ai/STATE.md', '.ai/HANDOFF.md']) {
  assert.ok(mergeScript.includes(f), `merge contract does not require ${f}`)
}
assert.match(mergeScript, /DONE_BLOCK/)
assert.match(task, /final bookkeeping IN THE SAME BRANCH/)
assert.match(i18n, /final bookkeeping IN THIS BRANCH/)
ok()

// 8. Watchdog recovery handles green, red and unfinished work without spawning duplicates.
assert.match(chain, /Recover a green ready PR if an event was missed/)
assert.match(chain, /gh pr ready "\$NUMBER" --undo/)
assert.match(chain, /release-stale-claim\.mjs/)
assert.match(chain, /continue this branch|safe resume|same task can resume/i)
ok()

// 9. The corrected language rule is what autonomous prompts carry.
for (const [name, text] of [['task', task], ['i18n', i18n]]) {
  assert.match(text, /user_language/)
  assert.match(text, /same user choice|same language/i)
  assert.doesNotMatch(text, /interface es \+ native ja|interface=es\/native=ja/,
    `${name} still requires mixed interface/native languages`)
  assert.match(text, /target language.*English|English is the target/i)
}
ok()

// 10. next-task itself: busy means NOTHING can fan out.
function runQueue(markdown) {
  const dir = mkdtempSync(join(tmpdir(), 'lc-queue-'))
  const file = join(dir, 'TASKS.md')
  try {
    writeFileSync(file, markdown)
    return execFileSync(process.execPath, [nextTask], {
      encoding: 'utf8',
      env: { ...process.env, TASKS_PATH: file },
    }).trim()
  } finally { rmSync(dir, { recursive: true, force: true }) }
}

assert.equal(runQueue(`
## IN_PROGRESS
- [LC-OPS-999] busy
  owner: claude-action
  branch: ops/lc-ops-999
## TODO
- [LC-I18N-001] next
  owner: unclaimed
  branch: none
## DONE
`), '')
ok()

// 11. A blocked first TODO is skipped for the first genuinely claimable task.
assert.equal(runQueue(`
## IN_PROGRESS
## TODO
- [LC-I18N-001] blocked
  owner: unclaimed
  branch: none
  blocked-on: LC-OPS-111
- [LC-QA-001] free
  owner: unclaimed
  branch: none
## BLOCKED
## DONE
`), 'LC-QA-001')
ok()

// 12. Once the dependency is DONE, order is respected again.
assert.equal(runQueue(`
## IN_PROGRESS
## TODO
- [LC-I18N-001] now free
  owner: unclaimed
  branch: none
  blocked-on: LC-OPS-111
- [LC-QA-001] second
  owner: unclaimed
  branch: none
## DONE
- [LC-OPS-111] dependency
`), 'LC-I18N-001')
ok()

console.log(`check-cloud-automation — OK (${groups} groups)`)
