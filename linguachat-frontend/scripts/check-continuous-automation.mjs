import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const qa = readFileSync('../.github/workflows/qa.yml', 'utf8')
const chain = readFileSync('../.github/workflows/claude-chain.yml', 'utf8')
const mention = readFileSync('../.github/workflows/claude-mention.yml', 'utf8')
const task = readFileSync('../.github/workflows/claude-task.yml', 'utf8')
const i18n = readFileSync('../.github/workflows/claude-i18n.yml', 'utf8')
const release = readFileSync('../.github/scripts/release-stale-claim.mjs', 'utf8')
const mergeScript = readFileSync('../.github/scripts/merge-agent-pr.sh', 'utf8')
const cycleVerifier = readFileSync('../.github/scripts/check-two-clean-qa-cycles.mjs', 'utf8')
const mergeHandoff = readFileSync('../.github/workflows/qa-merge-handoff.yml', 'utf8')
const permanentContract = readFileSync('../CLAUDE.md', 'utf8')

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

// A released task must keep a real remote checkpoint branch instead of erasing the
// task->branch mapping. Only a proven missing ref is cleared; git/network uncertainty
// preserves the mapping fail-closed.
assert.match(release, /git', \['ls-remote', '--exit-code', '--heads', 'origin', name\]/)
assert.match(release, /error\?\.status === 2/)
assert.match(release, /return true\s*\/\/ fail closed/)
assert.match(release, /if \(!preserveBranch\)/)
ok()

// Immediate worker chaining must resolve both states that can exist when workflow_run
// arrives: a still-claimed IN_PROGRESS task or the exact released TODO task chosen by
// next-task.mjs. A branch alone is insufficient; require an open Draft PR as durable
// checkpoint proof before allowing the one dispatch step to fire.
assert.match(chain, /SOURCE=IN_PROGRESS/)
assert.match(chain, /TASK_ID=\$\(node \.github\/scripts\/next-task\.mjs \|\| true\)/)
assert.match(chain, /SOURCE=TODO/)
assert.match(chain, /awk -v id="\$TASK_ID"/)
assert.match(chain, /git ls-remote --exit-code --heads origin "\$BRANCH"/)
assert.match(chain, /gh pr list --head "\$BRANCH" --state open --json number,isDraft/)
assert.match(chain, /select\(\.isDraft == true\)/)
assert.match(chain, /steps\.worker_checkpoint\.outputs\.resumable == 'true'/)
assert.match(chain, /avoiding an immediate retry loop/)
ok()

// There is exactly one autonomous implementation dispatch site, so a successful
// checkpoint event cannot fan out into duplicate workers. The serial queue and busy
// guard remain the second line of defense.
assert.equal((chain.match(/gh workflow run "\$WORKFLOW"/g) || []).length, 1,
  'continuous recovery must have exactly one autonomous implementation dispatch site')
assert.match(chain, /steps\.busy\.outputs\.running == '0'/)
assert.match(chain, /steps\.next\.outputs\.id != ''/)
ok()

// The second clean cycle must not rely on a GITHUB_TOKEN-authored Draft->Ready event:
// GitHub suppresses recursive workflow creation. The merge gate explicitly dispatches
// QA on the same branch/SHA; qa.yml re-attests live PR Ready state + exact head before
// emitting its sentinel, and the verifier counts that attested dispatch.
assert.match(qa, /workflow_dispatch:[\s\S]*pr_number:[\s\S]*expected_head_sha:/)
assert.match(qa, /LIVE_SHA=.*\.head\.sha/)
assert.match(qa, /LIVE_DRAFT=.*\.draft/)
assert.match(qa, /"\$GITHUB_SHA" != "\$EXPECTED_HEAD_SHA"/)
assert.match(mergeScript, /gh workflow run qa\.yml --ref "\$BRANCH" -f pr_number="\$NUMBER" -f expected_head_sha="\$HEAD_SHA"/)
assert.doesNotMatch(mergeScript, /gh pr ready "\$NUMBER" --undo && gh pr ready "\$NUMBER"/)
assert.match(cycleVerifier, /CLEAN_CYCLE_EVENTS = new Set\(\['pull_request', 'workflow_dispatch'\]\)/)
assert.match(chain, /github\.event\.workflow_run\.name == 'QA'/)
assert.match(chain, /github\.event\.workflow_run\.event == 'workflow_dispatch'/)
ok()

// A successful explicitly-dispatched second QA must actively hand back to the
// main-controlled receiver instead of hoping GitHub emits another workflow_run.
// The sender is gated on the clean-cycle sentinel, carries only the attested PR/head,
// has narrowly-scoped Actions write permission, targets main, and retries transient
// dispatch failures without ever firing from an ordinary pull_request run.
const senderStart = qa.indexOf('  merge_handoff:')
assert.ok(senderStart > 0, 'QA must contain the explicit main merge-handoff sender')
const senderBlock = qa.slice(senderStart)
assert.match(senderBlock, /github\.event_name == 'workflow_dispatch'/)
assert.match(senderBlock, /inputs\.pr_number != ''/)
assert.match(senderBlock, /inputs\.expected_head_sha != ''/)
assert.match(senderBlock, /needs\.clean_cycle\.result == 'success'/)
assert.match(senderBlock, /needs:\s*\[clean_cycle\]/)
assert.match(senderBlock, /permissions:[\s\S]*actions:\s*write/)
assert.match(senderBlock, /gh workflow run qa-merge-handoff\.yml --ref main/)
assert.match(senderBlock, /-f pr_number="\$PR_NUMBER"/)
assert.match(senderBlock, /-f expected_head_sha="\$EXPECTED_HEAD_SHA"/)
assert.match(senderBlock, /for attempt in 1 2 3 4 5/)
ok()

// A main-controlled receiver exists for the explicit post-QA handoff. It accepts only
// PR number + expected source SHA, re-reads the live PR, proves open/Ready/exact-head,
// and then reuses merge-agent-pr.sh. It advances the queue only after a real merge.
// This makes duplicate/manual dispatches fail closed rather than trusting caller data.
assert.match(mergeHandoff, /workflow_dispatch:[\s\S]*pr_number:[\s\S]*expected_head_sha:/)
assert.match(mergeHandoff, /group:\s*claude-chain/)
assert.ok(mergeHandoff.includes('gh api "/repos/$GITHUB_REPOSITORY/pulls/$PR_NUMBER"'))
assert.match(mergeHandoff, /STATE=.*\.state/)
assert.match(mergeHandoff, /DRAFT=.*\.draft/)
assert.match(mergeHandoff, /LIVE_SHA=.*\.head\.sha/)
assert.match(mergeHandoff, /"\$LIVE_SHA" != "\$EXPECTED_HEAD_SHA"/)
assert.match(mergeHandoff, /bash \.github\/scripts\/merge-agent-pr\.sh "\$HEAD_BRANCH"/)
assert.match(mergeHandoff, /if:\s*steps\.merge_pr\.outputs\.merged == 'true'/)
assert.match(mergeHandoff, /gh workflow run claude-chain\.yml --ref main/)
ok()

// The permanent operator contract must describe the deployed concurrency/recovery
// model, otherwise future workers can restore the exact deadlocks this suite forbids.
assert.match(permanentContract, /linguachat-claude-writer/)
assert.match(permanentContract, /linguachat-claude-review/)
assert.match(permanentContract, /five-minute scheduled watchdog/)
assert.match(permanentContract, /main-\s*controlled merge handoff/)
assert.doesNotMatch(permanentContract, /hourly watchdog as recovery/)
ok()

console.log(`check-continuous-automation — OK (${groups} groups)`)
