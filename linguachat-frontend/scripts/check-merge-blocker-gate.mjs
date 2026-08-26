import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const mergeAgent = readFileSync('../.github/scripts/merge-agent-pr.sh', 'utf8')
const mentionWorkflow = readFileSync('../.github/workflows/claude-mention.yml', 'utf8')

let groups = 0
const ok = () => { groups += 1 }

// Formal GitHub review blockers must fail closed.
assert.match(mergeAgent, /reviewDecision/)
assert.match(mergeAgent, /CHANGES_REQUESTED/)
assert.match(mergeAgent, /Could not verify PR review decision; failing closed/)
ok()

// Every API read used to prove "no blocker" must distinguish a failed lookup from
// a successful empty result. A transient GitHub/auth failure must delay merge, not
// be interpreted as permission to merge.
assert.match(mergeAgent, /comments_status=\$\?/)
assert.match(mergeAgent, /Could not verify PR validation comments; failing closed/)
assert.match(mergeAgent, /query_status=\$\?/)
assert.match(mergeAgent, /unresolved_status=\$\?/)
assert.match(mergeAgent, /has_more_status=\$\?/)
assert.match(mergeAgent, /Could not parse PR review-thread state; failing closed/)
ok()

// Unresolved inline review threads must be queried, and inability to prove their
// state must block rather than silently permitting a merge.
assert.match(mergeAgent, /reviewThreads\(first:100\)/)
assert.match(mergeAgent, /isResolved/)
assert.match(mergeAgent, /Could not verify PR review threads; failing closed/)
assert.match(mergeAgent, /has more than 100 review threads/)
ok()

// Interactive validation gets a machine-readable blocker marker. The merge agent
// must honor it and the mention lane must explicitly remove it only after proof.
const marker = '<!-- linguachat-merge-blocker -->'
assert.ok(mergeAgent.includes(marker), 'merge-agent must refuse an active validation blocker marker')
assert.ok(mentionWorkflow.includes(marker), 'Claude mention must know the canonical blocker marker')
assert.match(mentionWorkflow, /Remove it only after your\s+own observed validation proves the blocker is cleared/)
ok()

// Protect both dangerous transitions: requesting the explicit second exact-head QA
// cycle and the final merge. There is also an early check, so three calls is the
// minimum contract. The second cycle intentionally uses workflow_dispatch instead
// of a GITHUB_TOKEN-authored Draft->Ready transition, which GitHub may suppress.
const gateCalls = [...mergeAgent.matchAll(/merge_blockers_clear/g)].length
assert.ok(gateCalls >= 4, `expected function + at least 3 blocker checks, found ${gateCalls}`)
const secondCycle = mergeAgent.indexOf('gh workflow run qa.yml --ref "$BRANCH"')
const finalMerge = mergeAgent.indexOf('gh pr merge "$NUMBER" --merge --delete-branch')
assert.ok(secondCycle > 0 && finalMerge > secondCycle, 'second-cycle and merge transitions must exist in order')
assert.ok(mergeAgent.lastIndexOf('merge_blockers_clear', secondCycle) > 0,
  'blockers must be rechecked immediately before the second-cycle QA dispatch')
assert.ok(mergeAgent.lastIndexOf('merge_blockers_clear', finalMerge) > secondCycle,
  'blockers must be rechecked after QA and before the final merge')
assert.doesNotMatch(mergeAgent, /gh pr ready "\$NUMBER" --undo && gh pr ready "\$NUMBER"/)
ok()

// Blocker-comment deduplication is best-effort and must not turn a blocked PR into a
// red orchestrator loop when GitHub comment reads/writes are temporarily unavailable.
assert.match(mergeAgent, /Could not read PR #\$NUMBER comments; not posting a possibly duplicate blocker comment/)
assert.match(mergeAgent, /merge remains blocked by the caller/)
ok()

// The exact-head two-clean-cycle gate must remain intact; this fix supplements it.
assert.match(mergeAgent, /check-two-clean-qa-cycles\.mjs --repo "\$REPO" --head "\$HEAD_SHA" --required 2/)
assert.match(mergeAgent, /CYCLE_STATUS/)
ok()

console.log(`check-merge-blocker-gate — OK (${groups} groups)`)
