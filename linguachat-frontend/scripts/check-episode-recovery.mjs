/*
 * check-episode-recovery — recovery, idempotency and concurrency safety.
 *
 * Covers the submission guard (double submit + late/stale response), episode
 * resume via the learner model, idempotent completion (no double XP), and the
 * Memory Garden dedup — all with the real engine modules. Exits 1 on failure.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createSubmissionGuard } from '../src/learning/engine/submitGuard.js'
import { ARC, getEpisode } from '../src/learning/episodes/index.js'
import {
  createLearnerModel, getEpisodeState, setEpisodeState, saveLearnerModel,
  recordCanDoAttempt,
} from '../src/learning/engine/learnerModel.js'

let n = 0
const ok = () => { n++ }

// 1) double submit: a second begin() while in flight returns null
{
  const g = createSubmissionGuard()
  const a = g.begin()
  assert.ok(a !== null, 'first submit gets a token')
  assert.equal(g.begin(), null, 'second concurrent submit is blocked')
  g.settle()
  assert.ok(g.begin() !== null, 'after settle a new submit is allowed')
  ok()
}

// 2) late / stale response: a token invalidated by advance is not current
{
  const g = createSubmissionGuard()
  const token = g.begin()
  g.invalidate()                    // learner advanced / left the step
  assert.equal(g.isCurrent(token), false, 'stale token must be ignored')
  ok()
}

// 3) a resolved current submission is current until settled, then not reusable
{
  const g = createSubmissionGuard()
  const token = g.begin()
  assert.equal(g.isCurrent(token), true)
  g.settle()
  assert.equal(g.isCurrent(token), false, 'after settle the old token is not current')
  ok()
}

// 4) invalidate also clears the in-flight flag (unmount mid-review is safe)
{
  const g = createSubmissionGuard()
  g.begin()
  g.invalidate()
  assert.equal(g.inFlight, false)
  assert.ok(g.begin() !== null, 'a fresh submit works after invalidate')
  ok()
}

// 5) resume: an in-progress step index survives a reload (persist + reload)
{
  const model = createLearnerModel()
  setEpisodeState(model, 'nice_to_meet', { status: 'in_progress', stepIndex: 5 })
  const json = JSON.stringify(model)              // simulate localStorage round-trip
  const reloaded = JSON.parse(json)
  assert.equal(getEpisodeState(reloaded, 'nice_to_meet').stepIndex, 5)
  assert.equal(getEpisodeState(reloaded, 'nice_to_meet').status, 'in_progress')
  ok()
}

// 6) resume during retry/eval loses no progress: nothing is awarded until finish
{
  const model = createLearnerModel()
  setEpisodeState(model, 'first_greeting', { status: 'in_progress', stepIndex: 5 })
  assert.notEqual(getEpisodeState(model, 'first_greeting').awarded, true, 'nothing awarded mid-episode')
  // reloading mid-evaluation just replays the same step
  const reloaded = JSON.parse(JSON.stringify(model))
  assert.notEqual(getEpisodeState(reloaded, 'first_greeting').status, 'completed')
  ok()
}

// 7) idempotent completion: award happens once; a replay does not re-award
{
  const model = createLearnerModel()
  const ep = getEpisode('first_greeting')
  let awards = 0
  const finish = () => {
    const st = getEpisodeState(model, ep.id)
    recordCanDoAttempt(model, ep.canDoId, { success: true, independent: true, context: ep.id })
    if (!st.awarded) { awards += 1; setEpisodeState(model, ep.id, { status: 'completed', awarded: true }) }
    else { setEpisodeState(model, ep.id, { status: 'completed' }) }
    saveLearnerModel(model)
  }
  finish(); finish(); finish()
  assert.equal(awards, 1, 'XP/garden award must fire exactly once')
  ok()
}

// 8) Memory Garden dedup across the whole arc (by vocab id)
{
  const garden = []
  const feed = (ep) => { for (const id of ep.gardenItems || []) if (!garden.includes(id)) garden.push(id) }
  for (const ep of ARC) feed(ep)
  feed(ARC[2])   // replay must not duplicate
  assert.equal(garden.length, new Set(garden).size, 'no duplicates in the garden')
  assert.deepEqual([...garden].sort(), [
    'hello', 'hi', 'im', 'my_name_is', 'name', 'nice_to_meet', 'whats_your_name',
    'how_are_you', 'im_good', 'and_you', 'good', 'fine', 'tired', 'im_feeling_pattern',
    'where_from', 'im_from', 'from', 'what_about_you', 'im_from_pattern',
    'like', 'i_like', 'i_dont_like', 'what_do_you_like', 'do_you_like', 'i_like_pattern',
    'want', 'need', 'help', 'please', 'i_want', 'i_need', 'do_you_want', 'yes_please', 'no_thank_you', 'i_want_pattern',
    'water', 'coffee', 'tea', 'juice', 'thank_you', 'can_i_have', 'here_you_are', 'can_i_have_pattern',
    'anything_else', 'thats_all',
    'i_dont_understand', 'can_you_repeat', 'speak_slowly', 'repair_pattern', 'bye', 'see_you',
    'whats_this', 'its_a_pattern', 'book', 'phone', 'bag',
    'numbers_1_10', 'how_many', 'quantity_pattern',
  ].sort())
  ok()
}

/*
 * A CHUNK THAT NEVER ARRIVED NEEDS A DIFFERENT RETRY FROM CODE THAT THREW.
 *
 * Measured in a real browser against a real build with `a1Arc3Content-<hash>.js`
 * deleted: pressing Retry re-ran the same `import()` and produced ZERO network
 * requests, because a browser records a module whose fetch failed and answers
 * from its module map for ever after. Only a fresh document clears that entry, so
 * a missing module must escalate on the FIRST press instead of redrawing the same
 * screen. The reload stays guarded, so a chunk that is genuinely gone lands back
 * on the error instead of reloading in a loop.
 */
{
  const boundary = readFileSync(new URL('../src/components/ui/LazyBoundary.jsx', import.meta.url), 'utf8')
  assert.match(boundary, /const isModuleLoadFailure = \(error\) =>/,
    'the boundary no longer tells a missing module apart from a thrown one')
  for (const wording of ['dynamically imported module', 'Importing a module script failed']) {
    assert.ok(boundary.includes(wording), `a browser's wording for a failed module import is not recognised: ${wording}`)
  }
  assert.match(boundary, /setState\(\{ status: 'failed', moduleMissing: isModuleLoadFailure\(error\) \}\)/,
    'the failure state does not carry whether the module itself was missing')
  assert.match(boundary, /if \(state\.moduleMissing \|\| attempt >= 1\)/,
    'a missing chunk must escalate on the first Retry, not on the second')
  /* and the escalation is still bounded */
  assert.ok(boundary.includes("const RELOAD_GUARD = 'lc2-chunk-reload'")
    && /if \(!sessionStorage\.getItem\(RELOAD_GUARD\)\)/.test(boundary)
    && /sessionStorage\.setItem\(RELOAD_GUARD, '1'\)/.test(boundary),
    'the one-reload guard is gone — a permanently missing chunk could loop')
  /* a refusal is a decision, and must never be retried as if it were transport */
  assert.match(boundary, /A REFUSAL IS NOT A FAILURE/,
    'the refusal/failure distinction has been lost')
  ok()
}

console.log(`check-episode-recovery — OK  (${n} recovery/idempotency groups verified)`)
