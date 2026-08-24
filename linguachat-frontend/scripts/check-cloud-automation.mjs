import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readyTasks as foundryReadyTasks } from '../../.github/scripts/foundry-next.mjs'

const root = fileURLToPath(new URL('../../', import.meta.url))
const read = rel => readFileSync(join(root, rel), 'utf8')

const chain = read('.github/workflows/claude-chain.yml')
const task = read('.github/workflows/claude-task.yml')
const i18n = read('.github/workflows/claude-i18n.yml')
const mention = read('.github/workflows/claude-mention.yml')
const qa = read('.github/workflows/qa.yml')
const mergeScript = read('.github/scripts/merge-agent-pr.sh')
const foundryScope = read('.github/scripts/check-foundry-scope.mjs')
const evidenceScript = read('.github/scripts/check-supervisor-evidence.mjs')
const foundryWorker = read('.github/workflows/claude-foundry-worker.yml')
const foundryCycle = read('.github/scripts/run-foundry-cycle.sh')
const evidenceValidator = join(root, '.github/scripts/check-supervisor-evidence.mjs')
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

// 4. Interactive @claude is triage/review only, never the long-running implementation lane.
assert.doesNotMatch(mention, /^\s*issues:\s*$/m, 'mention lane must not auto-run from issue assignment')
assert.match(mention, /TRIAGE\/REVIEW lane|triage\/review lane/i)
assert.match(mention, /never edit\s+`?\.github\/workflows|NEVER take ownership of a queue-sized implementation/i)
assert.match(mention, /--allowedTools\s+Read,Glob,Grep,Bash,TodoWrite\b/,
  'interactive mention lane must expose only read/diagnostic tools plus TodoWrite')
assert.match(mention, /--max-turns 80/)
ok()

// 5. A QA transition from draft -> ready is a first-class trigger.
assert.match(qa, /pull_request:\s*\n\s*types:\s*\[[^\]]*ready_for_review[^\]]*\]/)
ok()

// 6. Same-run advancement is explicit; the workflow does not wait for a second event.
assert.match(chain, /needs:\s*\[merge\]/)
assert.match(chain, /github\.event_name == 'workflow_run' && needs\.merge\.outputs\.merged == 'true'/)
assert.match(chain, /Refresh main after a same-run merge/)
ok()

// 7. Both workers ask the one queue parser and reject the wrong lane/request.
assert.match(task, /node \.github\/scripts\/next-task\.mjs/)
assert.match(i18n, /node \.github\/scripts\/next-task\.mjs/)
assert.match(task, /LC-I18N-\*\)/)
assert.match(i18n, /case "\$NEXT" in[\s\S]*LC-I18N-\*\)/)
assert.match(task, /Requested \$REQUESTED but the only claimable task is \$NEXT/)
assert.match(i18n, /Requested \$REQUESTED but the only claimable task is \$NEXT/)
ok()

// 8. Final bookkeeping is part of the PR merge contract, not a later main commit.
for (const f of ['.ai/TASKS.md', '.ai/STATE.md', '.ai/HANDOFF.md']) {
  assert.ok(mergeScript.includes(f), `merge contract does not require ${f}`)
}
assert.match(mergeScript, /DONE_BLOCK/)
assert.match(task, /final bookkeeping IN THE SAME BRANCH/)
assert.match(i18n, /final bookkeeping IN THIS BRANCH/)
ok()

// 9. Watchdog recovery handles green, red and unfinished work without spawning duplicates.
assert.match(chain, /Recover a green ready PR if an event was missed/)
assert.match(chain, /gh pr ready "\$NUMBER" --undo/)
assert.match(chain, /release-stale-claim\.mjs/)
assert.match(chain, /continue this branch|safe resume|same task can resume/i)
ok()

// 10. The corrected language rule is what autonomous prompts carry. Reject the old
// POSITIVE contract, not text that explicitly says the old combination is forbidden.
const oldPositiveMixedRule = /(?:case|requirement)\s+that\s+must\s+always\s+work[^\n]*(?:interface[^\n]*es[^\n]*native[^\n]*ja|native[^\n]*ja[^\n]*interface[^\n]*es)/i
for (const [name, text] of [['task', task], ['i18n', i18n]]) {
  assert.match(text, /user_language/)
  assert.match(text, /same user choice|same language/i)
  assert.doesNotMatch(text, oldPositiveMixedRule,
    `${name} still positively requires independent interface/native languages`)
  assert.match(text, /target language.*English|English is the target/i)
}
ok()

// 11. next-task itself: busy means NOTHING can fan out.
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

// 12. A blocked first TODO is skipped for the first genuinely claimable task.
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

// 13. Once the dependency is DONE, order is respected again.
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

// 14. Docs agent branches are first-class and normal merges preserve their evidenced
// final trees instead of replaying merge-history commits through a forced rebase.
// Explicit ops/coord-* branches are the only exception to the task-DONE requirement:
// they are queue/state/handoff maintenance and must be limited to exactly those files.
assert.match(mergeScript, /curr\/\*\|i18n\/\*\|qa\/\*\|ops\/\*\|docs\/\*\|fix\/\*/)
assert.match(mergeScript, /curr\/\*\|i18n\/\*\|qa\/\*\|ops\/\*\|docs\/\*\)/)
assert.match(mergeScript, /ops\/coord-\*\) COORDINATION_ONLY=true/)
assert.match(mergeScript, /coordination-only and may change only \.ai\/TASKS\.md/)
assert.match(mergeScript, /if \[ "\$COORDINATION_ONLY" = "true" \]/)
assert.match(mergeScript, /comment_once\(\)/)
assert.match(mergeScript, /gh pr view "\$NUMBER" --json comments/)
assert.match(mergeScript, /gh pr merge "\$NUMBER" --merge --delete-branch/)
assert.doesNotMatch(mergeScript, /gh pr merge "\$NUMBER" --rebase/)
ok()

// 15. Foundry completion and evidence must both be evaluated from the same candidate
// head. This pins the wiring so future refactors cannot silently drop --ref again.
assert.match(foundryScope, /evidenceScript, '--partial', domain, '--ref', head/)
assert.match(foundryScope, /evidenceScript, '--ref', head/)
assert.match(evidenceScript, /git', \['show', `\$\{ref\}:\$\{spec\.path\}`\]/)
assert.match(evidenceScript, /missing \$\{spec\.path\} at \$\{ref\}/)
ok()

// 16. Functional checkout-vs-candidate regression. The validator process runs from a
// physical main checkout that has no corpus, while a separate candidate ref owns the
// evidence. Valid candidate evidence must pass; missing/invalid candidate evidence
// must still fail closed; and the full gate must read BOTH corpora from the candidate.
const evidenceRepo = mkdtempSync(join(tmpdir(), 'lc-foundry-evidence-ref-'))
const git = args => execFileSync('git', args, {
  cwd: evidenceRepo,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
})
const runEvidence = args => execFileSync(process.execPath, [evidenceValidator, ...args], {
  cwd: evidenceRepo,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
})
const topics = ['retrieval','spacing','feedback','transfer','motivation','cognitive-load','interaction','vocabulary','assessment','self-regulation']
const makeCorpus = prefix => Array.from({ length: 100 }, (_, i) => ({
  id: `${prefix}-${String(i + 1).padStart(3, '0')}`,
  title: `${prefix} candidate-head study ${i + 1}`,
  authors: [`Researcher ${i + 1}`],
  year: 2020,
  design: 'randomized controlled experiment',
  sampleSize: 80 + i,
  population: 'adult language learners',
  venue: 'Peer-reviewed journal',
  institution: 'Accredited university',
  topic: topics[i % topics.length],
  outcome: 'measured learning outcome',
  limitations: 'synthetic deterministic regression fixture only',
  sourceUrl: `https://publisher.example/${prefix.toLowerCase()}-${i + 1}`,
  persistentId: `doi:10.4321/${prefix.toLowerCase()}.${i + 1}`,
  verificationSources: [
    `https://doi.org/10.4321/${prefix.toLowerCase()}.${i + 1}`,
    `https://publisher.example/${prefix.toLowerCase()}-${i + 1}`,
  ],
  verifiedAt: '2026-08-21',
  qualityGrade: 'A',
  qualityRationale: 'synthetic complete record for candidate-head gate regression',
  sourceType: 'primary',
  verified: true,
}))

try {
  git(['init', '-b', 'main'])
  git(['config', 'user.email', 'qa@linguachat.invalid'])
  git(['config', 'user.name', 'LinguaChat QA'])
  writeFileSync(join(evidenceRepo, 'README.md'), 'physical main intentionally has no supervisor corpus\n')
  git(['add', 'README.md'])
  git(['commit', '-m', 'fixture: main without evidence'])

  git(['switch', '-c', 'candidate'])
  const evidenceDir = join(evidenceRepo, 'docs/research/supervisors')
  mkdirSync(evidenceDir, { recursive: true })
  writeFileSync(join(evidenceDir, 'pedagogical-primary.json'), JSON.stringify(makeCorpus('PED')))
  writeFileSync(join(evidenceDir, 'psychology-primary.json'), JSON.stringify(makeCorpus('PSY')))
  git(['add', 'docs/research/supervisors'])
  git(['commit', '-m', 'fixture: candidate owns valid evidence'])

  git(['switch', 'main'])
  const partial = runEvidence(['--partial', 'psychology', '--ref', 'candidate'])
  assert.match(partial, /psychology: 100 unique primary studies; 10 topics/)
  const full = runEvidence(['--ref', 'candidate'])
  assert.match(full, /pedagogical: 100\/100 unique primary studies; 10 topics/)
  assert.match(full, /psychology: 100\/100 unique primary studies; 10 topics/)
  assert.match(full, /Supervisor evidence gate: READY/)

  assert.throws(
    () => runEvidence(['--partial', 'psychology', '--ref', 'main']),
    'missing corpus on the candidate ref must fail closed',
  )

  git(['switch', '-c', 'invalid'])
  mkdirSync(evidenceDir, { recursive: true })
  writeFileSync(join(evidenceDir, 'psychology-primary.json'), '{ definitely-not-json')
  git(['add', 'docs/research/supervisors/psychology-primary.json'])
  git(['commit', '-m', 'fixture: invalid candidate evidence'])
  git(['switch', 'main'])
  assert.throws(
    () => runEvidence(['--partial', 'psychology', '--ref', 'invalid']),
    'invalid candidate JSON must fail closed',
  )
} finally {
  rmSync(evidenceRepo, { recursive: true, force: true })
}
ok()

// 17. Foundry next-batch and bootstrap regression. Once P01/Y01 are complete, the
// selector must choose P02/Y02 exactly once (one per independent lane), and every
// dispatched worker must publish a resumable branch before Claude starts. Draft PR
// bootstrap is attempted early but must never block Claude if GITHUB_TOKEN cannot create it.
const syntheticFoundry = [
  { id:'LC-RES-P01', lane:'research-ped', branch:'foundry/research-ped/lc-res-p01', dependsOn:[], writeScopes:[] },
  { id:'LC-RES-P02', lane:'research-ped', branch:'foundry/research-ped/lc-res-p02', dependsOn:['LC-RES-P01'], writeScopes:[] },
  { id:'LC-RES-P03', lane:'research-ped', branch:'foundry/research-ped/lc-res-p03', dependsOn:['LC-RES-P02'], writeScopes:[] },
  { id:'LC-RES-Y01', lane:'research-psy', branch:'foundry/research-psy/lc-res-y01', dependsOn:[], writeScopes:[] },
  { id:'LC-RES-Y02', lane:'research-psy', branch:'foundry/research-psy/lc-res-y02', dependsOn:['LC-RES-Y01'], writeScopes:[] },
  { id:'LC-RES-Y03', lane:'research-psy', branch:'foundry/research-psy/lc-res-y03', dependsOn:['LC-RES-Y02'], writeScopes:[] },
]
const nextBatches = foundryReadyTasks(syntheticFoundry, new Set(['LC-RES-P01', 'LC-RES-Y01']))
assert.deepEqual(nextBatches.map(t => t.id), ['LC-RES-P02', 'LC-RES-Y02'])
assert.equal(new Set(nextBatches.map(t => t.lane)).size, nextBatches.length)
assert.match(foundryCycle, /gh run list --workflow=claude-foundry-worker\.yml/)
assert.match(foundryCycle, /worker already queued\/running/)
assert.match(foundryWorker, /Bootstrap exact resumable branch and draft PR/)
assert.match(foundryWorker, /git commit --allow-empty -m "chore\(foundry\): bootstrap \$TASK_ID"/)
assert.match(foundryWorker, /git push -u origin "\$BRANCH"/)
assert.match(foundryWorker, /if ! gh pr create --draft --base main --head "\$BRANCH"/)
assert.match(foundryWorker, /Could not create bootstrap Draft PR with GITHUB_TOKEN/)
assert.match(foundryWorker, /The exact branch above is already checked out and published/)
assert.match(foundryWorker, /If no Draft PR exists yet, create it immediately on this exact branch/)
ok()

console.log(`check-cloud-automation — OK (${groups} groups)`)