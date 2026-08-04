/*
 * check-curriculum-map — the map must describe the curriculum that exists.
 *
 * A manifest that drifts from the thing it describes is worse than no manifest:
 * it reads like evidence. So almost nothing here trusts the map. Every claim it
 * makes about coverage is re-derived from the episodes and compared, and the
 * few judgements only a human can make (productive vs receptive, what Pre-A1
 * still owes) are checked for internal consistency instead.
 *
 * It also carries the audit's structural findings as assertions, so the things
 * this sprint measured cannot silently regress:
 *   - the Memory Garden may not grant language no episode teaches;
 *   - a can-do must be evaluated by the episode that claims it;
 *   - prerequisites form a chain, not a cycle;
 *   - no intent is declared without an evaluator, or evaluated without use.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ARC, ARCS, getEpisode, episodesInArc } from '../src/learning/episodes/index.js'
import { SEED_VOCAB_BY_ID } from '../src/data/vocabulary.js'
import { practiceKindForItem, practiceKindForCanDo } from '../src/learning/engine/session.js'
import { INTENT_SLOTS } from '../src/learning/engine/semanticContext.js'
import {
  LEVEL, CAPABILITY_MAP, CAN_DO_INTENT, RECEPTIVE_ITEMS, INCIDENTAL_ITEMS,
  PATTERN_COVERAGE, PRE_A1_EXIT_CRITERIA, LAST_PRE_A1_CAPABILITY, FIRST_A1_CAPABILITY,
  episodesForLevel, arcsForLevel, getArcForEpisode, getPrerequisites,
  getCanDoForEpisode, prerequisiteChain, intentsForEpisode, episodesProducing,
  canDoCoverage, capabilitiesWithStatus,
} from '../src/learning/curriculum/preA1Map.js'

let n = 0
const ok = () => { n++ }

/* ------------------------------------------------------- registry answers --*/

// 1) the registry answers the questions the curriculum needs answered
{
  assert.equal(episodesForLevel(LEVEL).length, ARC.length)
  assert.deepEqual(episodesForLevel(LEVEL).map(e => e.id), ARC.map(e => e.id))
  assert.deepEqual(episodesForLevel('a1'), [], 'nothing claims to be A1 yet')
  assert.deepEqual(arcsForLevel(LEVEL), ARCS)

  for (const ep of ARC) {
    assert.ok(getArcForEpisode(ep.id), `${ep.id} belongs to an arc`)
    assert.ok(ARCS.includes(getArcForEpisode(ep.id)), `${ep.id}: unknown arc`)
    assert.deepEqual(getPrerequisites(ep.id), ep.prerequisites || [])
    assert.equal(getCanDoForEpisode(ep.id), ep.canDoId)
  }
  assert.equal(getArcForEpisode('no_such_episode'), null)
  ok()
}

// 2) every arc is non-empty and every episode sits in exactly one arc
{
  const seen = new Set()
  for (const arc of ARCS) {
    const eps = episodesInArc(arc)
    assert.ok(eps.length > 0, `arc ${arc} has no episodes`)
    for (const ep of eps) {
      assert.equal(seen.has(ep.id), false, `${ep.id} is in two arcs`)
      seen.add(ep.id)
    }
  }
  assert.equal(seen.size, ARC.length, 'every episode belongs to an arc')
  ok()
}

// 3) ids are unique and prerequisites resolve
{
  const ids = ARC.map(e => e.id)
  assert.equal(new Set(ids).size, ids.length, 'duplicate episode id')
  for (const ep of ARC) {
    for (const p of ep.prerequisites || []) {
      assert.ok(getEpisode(p), `${ep.id}: prerequisite ${p} does not exist`)
    }
  }
  // exactly one entry point
  const roots = ARC.filter(e => (e.prerequisites || []).length === 0)
  assert.equal(roots.length, 1, 'Pre-A1 must have exactly one starting episode')
  ok()
}

// 4) the prerequisite graph is acyclic and everything is reachable
{
  for (const ep of ARC) {
    const chain = prerequisiteChain(ep.id)
    assert.equal(chain.includes(ep.id), false, `${ep.id} is its own prerequisite`)
  }
  // walking forward from the root must reach every episode
  const reachable = new Set(ARC.filter(e => !(e.prerequisites || []).length).map(e => e.id))
  let grew = true
  while (grew) {
    grew = false
    for (const ep of ARC) {
      if (reachable.has(ep.id)) continue
      if ((ep.prerequisites || []).every(p => reachable.has(p))) { reachable.add(ep.id); grew = true }
    }
  }
  assert.equal(reachable.size, ARC.length, 'an episode can never be unlocked')
  ok()
}

/* ------------------------------------------------------------- can-dos ----*/

// 5) every episode claims a can-do, and evaluates it
{
  for (const ep of ARC) {
    assert.ok(ep.canDoId, `${ep.id} has no can-do`)
    const intent = CAN_DO_INTENT[ep.canDoId]
    assert.ok(intent, `${ep.canDoId} does not say which intent stands for it`)
    assert.ok(intentsForEpisode(ep.id).includes(intent),
      `${ep.id} claims "${ep.canDoId}" but never evaluates ${intent}`)
    assert.ok(practiceKindForCanDo(ep.canDoId), `${ep.canDoId} cannot be practised in a session`)
  }
  /*
   * A can-do has exactly ONE primary episode — the one that teaches it — and any
   * number of later episodes that reinforce it, marked `reinforces: true`.
   *
   * The old rule was "no two episodes share a can-do", which forced one invented
   * capability per episode. Episode 14 practises the same capability as 13 with a
   * different strategy; giving it a can-do of its own would put a capability on
   * the Pre-A1 exit criteria that the curriculum audit never declared required.
   * This rule is narrower than the old one, not looser: a shared can-do is only
   * legal when exactly one of the episodes claims to be the one that teaches it,
   * and the reinforcement comes after it.
   */
  const byCanDo = {}
  for (const ep of ARC) (byCanDo[ep.canDoId] ||= []).push(ep)
  for (const [canDoId, episodes] of Object.entries(byCanDo)) {
    const primary = episodes.filter(e => !e.reinforces)
    assert.equal(primary.length, 1, `${canDoId} must have exactly one primary episode, found ${primary.length}`)
    for (const ep of episodes.filter(e => e.reinforces)) {
      assert.ok(ARC.indexOf(ep) > ARC.indexOf(primary[0]),
        `${ep.id} reinforces ${canDoId} but comes before ${primary[0].id} teaches it`)
    }
  }
  ok()
}

// 6) the map's coverage claims match what the episodes actually do
{
  for (const cap of CAPABILITY_MAP) {
    if (!cap.covers) continue
    if (cap.covers.canDo) {
      const cov = canDoCoverage(cap.covers.canDo)
      assert.ok(cov, `${cap.id} claims can-do ${cap.covers.canDo}, which no episode teaches`)
      if (cap.status === 'covered') {
        assert.ok(cov.reusedIn.length > 0 || cov.intent.endsWith('_conversation'),
          `${cap.id} is called covered but ${cov.intent} appears in one episode only`)
      }
    }
    if (cap.covers.intent) {
      const eps = ARC.filter(e => intentsForEpisode(e.id).includes(cap.covers.intent))
      assert.ok(eps.length > 0, `${cap.id} claims intent ${cap.covers.intent}, which nothing evaluates`)
      if (cap.status === 'fragile') {
        const producedIn = new Set(eps.map(e => e.id))
        assert.equal(producedIn.size, 1,
          `${cap.id} is called fragile but ${cap.covers.intent} appears in ${producedIn.size} episodes`)
      }
    }
  }
  ok()
}

// 7) a capability is exactly one thing, and the statuses are the agreed set
{
  const STATUSES = ['covered', 'fragile', 'needs_reuse', 'missing_required', 'optional', 'defer_a1']
  const ids = CAPABILITY_MAP.map(c => c.id)
  assert.equal(new Set(ids).size, ids.length, 'duplicate capability id')
  for (const cap of CAPABILITY_MAP) {
    assert.ok(STATUSES.includes(cap.status), `${cap.id}: unknown status ${cap.status}`)
    if (cap.status === 'missing_required') {
      assert.ok(cap.priority && cap.why && cap.canDo, `${cap.id} must say why it is required and what it would teach`)
      assert.ok(typeof cap.vocabularyBudget === 'number' && cap.vocabularyBudget <= 15,
        `${cap.id}: Pre-A1 cannot absorb ${cap.vocabularyBudget} new words`)
      for (const p of cap.prerequisites || []) {
        assert.ok(ARC.some(e => e.canDoId === p), `${cap.id}: prerequisite can-do ${p} does not exist yet`)
      }
      // it must not already exist
      assert.equal(ARC.some(e => e.canDoId === cap.canDo), false,
        `${cap.id} is listed as missing but ${cap.canDo} is already taught`)
    }
    if (cap.status === 'defer_a1') assert.ok(cap.why, `${cap.id} must say why it is not Pre-A1`)
  }
  // the level boundary points at real entries on the right side of the line
  const last = CAPABILITY_MAP.find(c => c.id === LAST_PRE_A1_CAPABILITY)
  const first = CAPABILITY_MAP.find(c => c.id === FIRST_A1_CAPABILITY)
  assert.ok(last && last.status !== 'defer_a1', 'the last Pre-A1 capability cannot be deferred')
  assert.ok(first && first.status === 'defer_a1', 'the first A1 capability must be deferred')
  ok()
}

// 8) the exit criteria name can-dos, not screens
{
  const c = PRE_A1_EXIT_CRITERIA
  assert.ok(c.requiredCanDos.length > 0)
  assert.ok(c.independentEvidencePerCanDo >= 2, 'one unaided success is luck, not evidence')
  const taught = new Set(ARC.map(e => e.canDoId))
  const planned = new Set(CAPABILITY_MAP.filter(x => x.status === 'missing_required').map(x => x.canDo))
  for (const id of c.requiredCanDos) {
    assert.ok(taught.has(id) || planned.has(id),
      `exit criteria require ${id}, which is neither taught nor planned`)
  }
  // completing every episode must NOT be sufficient on its own
  const notYetTaught = c.requiredCanDos.filter(id => !taught.has(id))
  assert.ok(notYetTaught.length > 0,
    'if every required can-do were already taught, "finished all episodes" would mean "ready for A1"')
  ok()
}

/* ------------------------------------------------- garden and vocabulary --*/

// 9) the Memory Garden may not grant language no episode teaches
{
  /*
   * This is the audit's central finding, kept as a rule. An item may enter the
   * Garden only if the learner produced it, or it is declared receptive, or it
   * is declared incidental — a word inside a phrase that is tracked whole.
   * Anything else is the Garden claiming credit for teaching that never happened.
   */
  for (const ep of ARC) {
    for (const id of ep.gardenItems || []) {
      assert.ok(SEED_VOCAB_BY_ID[id], `${ep.id}: garden item ${id} is not real vocabulary`)
      const produced = episodesProducing(id).length > 0
      const declared = RECEPTIVE_ITEMS.includes(id) || INCIDENTAL_ITEMS.includes(id)
      assert.ok(produced || declared,
        `${ep.id}: the garden grants ${id}, but no episode produces it and it is not declared receptive or incidental`)
    }
  }
  ok()
}

// 10) receptive means receptive: nothing declared receptive is also produced
{
  for (const id of RECEPTIVE_ITEMS) {
    assert.ok(SEED_VOCAB_BY_ID[id], `${id} is not real vocabulary`)
    assert.deepEqual(episodesProducing(id), [],
      `${id} is declared receptive but the learner is asked to produce it`)
  }
  for (const id of INCIDENTAL_ITEMS) {
    assert.ok(SEED_VOCAB_BY_ID[id], `${id} is not real vocabulary`)
    assert.deepEqual(episodesProducing(id), [],
      `${id} is declared incidental but has become a tracked target — move it out of the list`)
  }
  assert.equal(RECEPTIVE_ITEMS.filter(id => INCIDENTAL_ITEMS.includes(id)).length, 0,
    'an item is either heard or said, not both')
  ok()
}

// 11) anything the learner produces is tracked, reviewable and in the Garden
{
  const gardenAll = new Set(ARC.flatMap(e => e.gardenItems || []))
  const produced = new Set()
  for (const ep of ARC) {
    for (const s of ep.steps) {
      if (s.type === 'free_reply' || s.type === 'recall') (s.itemIds || []).forEach(i => produced.add(i))
      else if (['word_order', 'fill_blank', 'choice'].includes(s.type) && s.itemId) produced.add(s.itemId)
    }
  }
  for (const id of produced) {
    assert.ok(SEED_VOCAB_BY_ID[id], `produced item ${id} is not real vocabulary`)
    assert.ok(practiceKindForItem(id), `${id} is produced but can never be scheduled for review`)
    assert.ok(gardenAll.has(id), `${id} is produced but never reaches the Memory Garden`)
  }
  ok()
}

// 12) patterns: the map may not overstate how far one gets
{
  for (const [id, p] of Object.entries(PATTERN_COVERAGE)) {
    assert.ok(SEED_VOCAB_BY_ID[id], `${id} is not real vocabulary`)
    assert.equal(SEED_VOCAB_BY_ID[id].kind, 'pattern', `${id} is described as a pattern but is a ${SEED_VOCAB_BY_ID[id].kind}`)
    assert.ok(['comprehension', 'guided_production', 'independent'].includes(p.reaches))
    const tracked = p.trackedAs
    assert.ok(SEED_VOCAB_BY_ID[tracked], `${id}: trackedAs ${tracked} is not real vocabulary`)
    const eps = episodesProducing(tracked)
    assert.ok(eps.length > 0, `${id} claims to reach ${p.reaches} but ${tracked} is never produced`)
    if (p.reaches === 'independent') {
      const free = ARC.some(ep => (ep.steps || []).some(s =>
        (s.type === 'free_reply' || s.type === 'recall') && (s.itemIds || []).includes(tracked)))
      assert.ok(free, `${id} claims independent production but ${tracked} only ever appears in a guided step`)
    }
  }
  ok()
}

/* ------------------------------------------------------------- intents ----*/

// 13) no dead evaluator, no unevaluated intent, no undeclared slot
{
  const src = readFileSync(new URL('../src/learning/engine/responseEvaluation.js', import.meta.url), 'utf8')
  const dispatched = [...src.matchAll(/case '([a-z_]+)': return evaluate/g)].map(m => m[1])
  const used = new Set(ARC.flatMap(e => intentsForEpisode(e.id)))

  for (const intent of used) {
    assert.ok(dispatched.includes(intent), `${intent} is used by an episode but has no evaluator`)
    assert.ok(Object.prototype.hasOwnProperty.call(INTENT_SLOTS, intent),
      `${intent} does not declare which values it accepts`)
  }
  for (const intent of dispatched) {
    assert.ok(used.has(intent), `${intent} has an evaluator no episode uses — dead code`)
  }
  assert.equal(new Set(dispatched).size, dispatched.length, 'an intent is dispatched twice')
  ok()
}

/* ----------------------------------------------------- pedagogical load ---*/

// 14) load is reported, and only the indefensible fails
{
  const stats = ARC.map(ep => {
    const s = ep.steps
    const productive = s.filter(x => x.type === 'free_reply' || x.type === 'recall')
    const newTargets = (ep.gardenItems || []).filter(id => {
      // first episode in the arc order that grants this item
      const first = ARC.find(e => (e.gardenItems || []).includes(id))
      return first && first.id === ep.id
    })
    return {
      id: ep.id,
      steps: s.length,
      productive: productive.length,
      unaided: productive.filter(x => !x.suggestionEn).length,
      newItems: newTargets.length,
      intents: intentsForEpisode(ep.id).length,
    }
  })

  for (const st of stats) {
    // an episode that asks the learner to say nothing is not an episode
    assert.ok(st.productive >= 1, `${st.id} has no productive turn`)
    // ...and one that never lets them try without the answer on screen is a demo
    assert.ok(st.unaided >= 1, `${st.id} never asks for an unaided production`)
    // a Pre-A1 episode introducing more than a dozen new items is not Pre-A1
    assert.ok(st.newItems <= 12, `${st.id} introduces ${st.newItems} new items`)
  }
  const avgNew = stats.reduce((a, s) => a + s.newItems, 0) / stats.length
  assert.ok(avgNew <= 6, `Pre-A1 averages ${avgNew.toFixed(1)} new items per episode`)
  ok()
}

// 15) skills introduced and then abandoned are named, not discovered later
{
  const producedIn = {}
  for (const ep of ARC) {
    for (const intent of intentsForEpisode(ep.id)) (producedIn[intent] ||= []).push(ep.id)
  }
  const singleUse = Object.entries(producedIn).filter(([, eps]) => eps.length === 1).map(([i]) => i)
  // a one-arc-finale intent is single-use by design; anything else must be
  // declared fragile or needing reuse, so the map cannot quietly lose it
  const declared = new Set(CAPABILITY_MAP
    .filter(c => c.status === 'fragile' || c.status === 'needs_reuse')
    .map(c => c.covers?.intent).filter(Boolean))
  for (const intent of singleUse) {
    if (intent.endsWith('_conversation')) continue     // an arc finale, by design
    assert.ok(declared.has(intent),
      `${intent} is taught in one episode and never returns, and the map does not say so`)
  }
  ok()
}

console.log(`check-curriculum-map — OK  (${n} curriculum groups verified)`)
