import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const mergeAgent = readFileSync('../.github/scripts/merge-agent-pr.sh', 'utf8')
const mentionWorkflow = readFileSync('../.github/workflows/claude-mention.yml', 'utf8')
const mergeAgentPath = resolve('../.github/scripts/merge-agent-pr.sh')

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
assert.match(mergeAgent, /--match-head-commit "\$HEAD_SHA"/)
ok()

// Exact-identity mode must never degrade back to branch lookup. The trusted handoff
// pins all three values and the helper re-reads the PR BY NUMBER before doing any
// merge work. A partial identity is rejected instead of silently taking normal mode.
assert.match(mergeAgent, /EXPECTED_NUMBER="\$\{2:-\}"/)
assert.match(mergeAgent, /EXPECTED_HEAD_SHA="\$\{3:-\}"/)
assert.match(mergeAgent, /gh pr view "\$EXPECTED_NUMBER" --json number,state,isDraft,headRefName,headRefOid/)
assert.match(mergeAgent, /\.headRefName == \$expected_branch/)
assert.match(mergeAgent, /\.headRefOid == \$expected_sha/)
assert.match(mergeAgent, /invalid-exact-identity/)
ok()

function runExactScenario({ expectedNumber = '101', expectedSha, liveNumber = '101', liveSha, branch = 'fix/exact-identity-test' }) {
  const root = mkdtempSync(join(tmpdir(), 'linguachat-exact-pr-'))
  const bin = join(root, 'bin')
  const trace = join(root, 'trace.log')
  const output = join(root, 'github-output.txt')
  spawnSync('mkdir', ['-p', bin], { encoding: 'utf8' })
  writeFileSync(trace, '')
  writeFileSync(output, '')

  const gh = join(bin, 'gh')
  writeFileSync(gh, `#!/usr/bin/env bash
set -euo pipefail
printf '%s\\n' "$*" >> "$TRACE_FILE"

if [ "${'$'}{1:-}" = "pr" ] && [ "${'$'}{2:-}" = "list" ]; then
  # Deliberate decoy: exact mode must never use this branch-name lookup.
  printf '[{"number":202}]\\n'
  exit 0
fi

if [ "${'$'}{1:-}" = "pr" ] && [ "${'$'}{2:-}" = "view" ]; then
  args="$*"
  if [[ "$args" == *"number,state,isDraft,headRefName,headRefOid"* ]]; then
    printf '{"number":%s,"state":"OPEN","isDraft":false,"headRefName":"%s","headRefOid":"%s"}\\n' \
      "$FAKE_LIVE_NUMBER" "$FAKE_LIVE_BRANCH" "$FAKE_LIVE_SHA"
    exit 0
  fi
  if [[ "$args" == *"--json isDraft"* ]]; then printf 'false\\n'; exit 0; fi
  if [[ "$args" == *"--json reviewDecision"* ]]; then printf '\\n'; exit 0; fi
  if [[ "$args" == *"--json comments"* ]]; then printf '\\n'; exit 0; fi
  if [[ "$args" == *"--json body"* ]]; then printf '## Evidence\\ncheck:all build pytest\\n'; exit 0; fi
  if [[ "$args" == *"--json headRefOid"* ]]; then printf '%s\\n' "$FAKE_LIVE_SHA"; exit 0; fi
  echo "unexpected gh pr view: $args" >&2
  exit 41
fi

if [ "${'$'}{1:-}" = "pr" ] && [ "${'$'}{2:-}" = "checks" ]; then
  printf 'qa-cycle\\tpass\\n'
  exit 0
fi

if [ "${'$'}{1:-}" = "api" ] && [ "${'$'}{2:-}" = "graphql" ]; then
  printf '{"data":{"repository":{"pullRequest":{"reviewThreads":{"nodes":[],"pageInfo":{"hasNextPage":false}}}}}}\\n'
  exit 0
fi

if [ "${'$'}{1:-}" = "pr" ] && [ "${'$'}{2:-}" = "merge" ]; then
  printf 'merged\\n'
  exit 0
fi

if [ "${'$'}{1:-}" = "pr" ] && [ "${'$'}{2:-}" = "comment" ]; then exit 0; fi
if [ "${'$'}{1:-}" = "workflow" ] && [ "${'$'}{2:-}" = "run" ]; then exit 0; fi

echo "unexpected gh command: $*" >&2
exit 42
`)
  chmodSync(gh, 0o755)

  const fakeNode = join(bin, 'node')
  writeFileSync(fakeNode, `#!/usr/bin/env bash
set -euo pipefail
printf 'node %s\\n' "$*" >> "$TRACE_FILE"
printf 'clean QA cycles on %s: 2/2 (ready)\\n' "$FAKE_LIVE_SHA"
exit 0
`)
  chmodSync(fakeNode, 0o755)

  const result = spawnSync('bash', [mergeAgentPath, branch, expectedNumber, expectedSha], {
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${bin}:${process.env.PATH}`,
      TRACE_FILE: trace,
      FAKE_LIVE_NUMBER: liveNumber,
      FAKE_LIVE_BRANCH: branch,
      FAKE_LIVE_SHA: liveSha,
      GITHUB_REPOSITORY: 'Interwtk/LinguaChat',
      GITHUB_OUTPUT: output,
    },
  })

  const observed = {
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    trace: readFileSync(trace, 'utf8'),
    output: readFileSync(output, 'utf8'),
  }
  rmSync(root, { recursive: true, force: true })
  return observed
}

const liveSha = 'a'.repeat(40)

// A same-ref decoy PR must be irrelevant: exact mode never calls `pr list`, keeps
// NUMBER=101, traverses review/Evidence/two-cycle gates, and atomically merges only
// that exact PR at the attested source SHA.
const exact = runExactScenario({ expectedSha: liveSha, liveSha })
assert.equal(exact.status, 0, exact.stderr || exact.stdout)
assert.doesNotMatch(exact.trace, /pr list --head/)
assert.match(exact.trace, /pr view 101 --json number,state,isDraft,headRefName,headRefOid/)
assert.match(exact.trace, /pr checks 101/)
assert.ok((exact.trace.match(/--json reviewDecision/g) || []).length >= 2,
  'exact success must still traverse the existing blocker gate before final merge')
assert.match(exact.trace, /node \.github\/scripts\/check-two-clean-qa-cycles\.mjs/)
assert.match(exact.trace, new RegExp(`pr merge 101 --merge --delete-branch --match-head-commit ${liveSha}`))
assert.doesNotMatch(exact.trace, /pr merge 202/)
assert.match(exact.output, /merged=true/)
assert.match(exact.output, /reason=merged/)
ok()

// A stale SHA is not allowed to borrow green cycles from the live PR. It fails before
// checks/merge and never falls back to the same-named decoy returned by `pr list`.
const stale = runExactScenario({ expectedSha: 'b'.repeat(40), liveSha })
assert.equal(stale.status, 0)
assert.match(stale.output, /reason=exact-identity-mismatch/)
assert.doesNotMatch(stale.trace, /pr checks|pr merge|pr list --head/)
ok()

// A wrong PR number is also fail-closed even when branch + SHA happen to match. The
// payload intentionally returns PR 101 while the trusted caller asks for 999.
const wrongNumber = runExactScenario({ expectedNumber: '999', expectedSha: liveSha, liveSha })
assert.equal(wrongNumber.status, 0)
assert.match(wrongNumber.output, /reason=exact-identity-mismatch/)
assert.doesNotMatch(wrongNumber.trace, /pr checks|pr merge|pr list --head/)
ok()

console.log(`check-merge-blocker-gate — OK (${groups} groups)`)
