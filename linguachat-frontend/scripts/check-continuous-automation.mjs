import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const qa = readFileSync('../.github/workflows/qa.yml', 'utf8')
const chain = readFileSync('../.github/workflows/claude-chain.yml', 'utf8')
const mention = readFileSync('../.github/workflows/claude-mention.yml', 'utf8')
const task = readFileSync('../.github/workflows/claude-task.yml', 'utf8')
const i18n = readFileSync('../.github/workflows/claude-i18n.yml', 'utf8')

let groups = 0
const ok = () => { groups += 1 }

// Evidence must read the current PR body, never trust the pull_request event snapshot.
assert.match(qa, /pull-requests:\s*read/)
assert.ok(qa.includes('gh api "/repos/$GITHUB_REPOSITORY/pulls/$PR_NUMBER"'),
  'Evidence must fetch the live PR body through GitHub API')
assert.ok(!qa.includes('BODY: ${{ github.event.pull_request.body }}'),
  'stale pull_request.body event snapshots must not drive Evidence')
assert.match(qa, /for attempt in 1 2 3 4 5/)
assert.match(qa, /if \[ "\$valid" != "true" \]/)
ok()

// Successful autonomous worker completion must wake the chain immediately instead
// of waiting for a scheduled watchdog.
assert.match(chain, /workflows:\s*\["QA", "Claude — autonomous task", "Claude — translations"\]/)
assert.match(chain, /github\.event\.workflow_run\.name == 'Claude — autonomous task'/)
assert.match(chain, /github\.event\.workflow_run\.name == 'Claude — translations'/)
assert.match(chain, /github\.event\.workflow_run\.conclusion == 'success'/)
ok()

// The schedule is only a recovery net, but missed/failing events must not leave work
// idle for an hour. Five minutes is the current bounded fallback.
assert.match(chain, /cron:\s*'\*\/5 \* \* \* \*'/)
assert.ok(!chain.includes("cron: '17 * * * *'"), 'hourly watchdog is too slow for continuous recovery')
ok()

// Interactive review is not an implementation writer. It has a separate concurrency
// group and must not be counted by the chain's serial writer busy check.
assert.match(task, /group:\s*linguachat-claude-writer/)
assert.match(i18n, /group:\s*linguachat-claude-writer/)
assert.match(mention, /group:\s*linguachat-claude-review/)
const busyStart = chain.indexOf('id: busy')
const busyEnd = chain.indexOf('Did the completed worker leave a resumable checkpoint?', busyStart)
assert.ok(busyStart > 0 && busyEnd > busyStart, 'writer busy-check block must remain identifiable')
const busyBlock = chain.slice(busyStart, busyEnd)
assert.ok(busyBlock.includes('claude-task.yml') && busyBlock.includes('claude-i18n.yml'))
assert.ok(!busyBlock.includes('claude-mention.yml'), 'interactive review must not freeze autonomous implementation')
ok()

// Immediate worker chaining is allowed only when the previous success left a real
// remote checkpoint. Otherwise the short watchdog retries later, avoiding hot loops.
assert.match(chain, /id:\s*worker_checkpoint/)
assert.match(chain, /git ls-remote --exit-code --heads origin "\$BRANCH"/)
assert.match(chain, /steps\.worker_checkpoint\.outputs\.resumable == 'true'/)
assert.match(chain, /avoiding an immediate retry loop/)
ok()

console.log(`check-continuous-automation — OK (${groups} groups)`)
