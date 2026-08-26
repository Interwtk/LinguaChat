import assert from 'node:assert/strict'
import {
  CLEAN_CYCLE_JOB,
  evaluateCycleHistory,
} from '../../.github/scripts/check-two-clean-qa-cycles.mjs'

let groups = 0
const ok = () => { groups += 1 }
const run = (id, head, minute, event = 'pull_request') => ({
  id,
  head_sha: head,
  event,
  created_at: `2026-08-24T17:${String(minute).padStart(2, '0')}:00Z`,
})
const job = (conclusion, status = 'completed') => ({
  name: CLEAN_CYCLE_JOB,
  status,
  conclusion,
})
const history = (workflowRuns, entries, headSha) => evaluateCycleHistory({
  workflowRuns,
  jobsByRun: Object.fromEntries(entries.map(([id, sentinel]) => [String(id), { jobs: [sentinel] }])),
  headSha,
  required: 2,
})

// 1. Two complete clean non-draft PR cycles on the exact same head allow merge.
{
  const result = history(
    [run(2, 'B', 2), run(1, 'B', 1)],
    [[1, job('success')], [2, job('success')]],
    'B',
  )
  assert.equal(result.ok, true)
  assert.equal(result.clean, 2)
  ok()
}

// 2. The normal autonomous shape also counts: first pull_request proof + an
// explicitly attested workflow_dispatch second cycle on the exact same source head.
{
  const result = history(
    [run(2, 'B', 2, 'workflow_dispatch'), run(1, 'B', 1)],
    [[1, job('success')], [2, job('success')]],
    'B',
  )
  assert.equal(result.ok, true)
  assert.equal(result.clean, 2)
  assert.equal(result.considered[0].event, 'workflow_dispatch')
  ok()
}

// 3. Two greens on an old SHA cannot be reused after a new commit; SHA B has one.
{
  const result = history(
    [run(4, 'B', 4), run(3, 'A', 3, 'workflow_dispatch'), run(2, 'A', 2)],
    [[2, job('success')], [3, job('success')], [4, job('success')]],
    'B',
  )
  assert.equal(result.ok, false)
  assert.equal(result.code, 'needs-more')
  assert.equal(result.clean, 1)
  ok()
}

// 4. A red eligible cycle breaks the consecutive streak even if an older green exists.
{
  const result = history(
    [run(6, 'B', 6, 'workflow_dispatch'), run(5, 'B', 5), run(4, 'B', 4)],
    [[4, job('success')], [5, job('failure')], [6, job('success')]],
    'B',
  )
  assert.equal(result.ok, false)
  assert.equal(result.code, 'not-clean')
  assert.equal(result.clean, 1)
  ok()
}

// 5. Draft PR runs / unattested dispatches are represented by a skipped sentinel
// and never count.
{
  const result = history(
    [run(7, 'B', 7, 'workflow_dispatch'), run(6, 'B', 6), run(5, 'B', 5)],
    [[5, job('skipped')], [6, job('success')], [7, job('success')]],
    'B',
  )
  assert.equal(result.ok, true)
  assert.equal(result.clean, 2)
  ok()
}

// 6. A still-running eligible cycle blocks merge rather than being ignored.
{
  const result = history(
    [run(9, 'B', 9, 'workflow_dispatch'), run(8, 'B', 8), run(7, 'B', 7)],
    [[7, job('success')], [8, job('success')], [9, job(null, 'in_progress')]],
    'B',
  )
  assert.equal(result.ok, false)
  assert.equal(result.code, 'incomplete')
  assert.equal(result.clean, 0)
  ok()
}

// 7. One clean cycle is a distinct recoverable state: request exactly one more.
{
  const result = history(
    [run(10, 'B', 10)],
    [[10, job('success')]],
    'B',
  )
  assert.equal(result.ok, false)
  assert.equal(result.code, 'needs-more')
  assert.equal(result.clean, 1)
  ok()
}

// 8. Cancelled/non-success eligible cycles never count as clean.
{
  const result = history(
    [run(12, 'B', 12, 'workflow_dispatch'), run(11, 'B', 11)],
    [[11, job('success')], [12, job('cancelled')]],
    'B',
  )
  assert.equal(result.ok, false)
  assert.equal(result.code, 'not-clean')
  ok()
}

// 9. Other events cannot masquerade as clean cycles even with a forged sentinel.
{
  const result = history(
    [run(14, 'B', 14, 'push'), run(13, 'B', 13)],
    [[13, job('success')], [14, job('success')]],
    'B',
  )
  assert.equal(result.ok, false)
  assert.equal(result.code, 'needs-more')
  assert.equal(result.clean, 1)
  ok()
}

console.log(`check-two-clean-cycles — OK (${groups} groups)`)
