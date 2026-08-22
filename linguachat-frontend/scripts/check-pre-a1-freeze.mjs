/*
 * check-pre-a1-freeze — the level is finished, and finished means fixed.
 *
 * A frozen level is one whose shape cannot drift by accident: six arcs,
 * seventeen episodes, in this order, teaching exactly these capabilities, with
 * no eighteenth episode appearing because somebody had a good idea and no A1
 * content leaking in early.
 *
 * Frozen is not the same as over, though, and the second half of this file says
 * so: a learner who has played everything must still be offered somewhere to go
 * — consolidation, reviews, practice — because a level that ends in an empty
 * screen has not been finished, it has been abandoned.
 *
 * It also holds the line that progress stays on this machine: no Supabase, no
 * cloud, no sync, anywhere in the frontend.
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'

import { ARC, ARCS, getEpisode } from '../src/learning/episodes/index.js'
import { PRE_A1_EXIT_CRITERIA, CAN_DO_INTENT, LEVEL, prerequisiteChain, intentsForEpisode, RECEPTIVE_ITEMS, INCIDENTAL_ITEMS } from '../src/learning/curriculum/preA1Map.js'
import { capabilitiesWithStatus, CAPABILITY_MAP, FIRST_A1_CAPABILITY, LAST_PRE_A1_CAPABILITY } from '../src/learning/curriculum/preA1Audit.js'
import { SEED_VOCAB, SEED_VOCAB_BY_ID } from '../src/data/vocabulary.js'
import { a1ItemIds } from '../src/learning/curriculum/a1Map.js'
import { a2ItemIds } from '../src/learning/curriculum/a2Map.js'
import { b1ItemIds } from '../src/learning/curriculum/b1Map.js'
import { b2ItemIds } from '../src/learning/curriculum/b2Map.js'
import { createLearnerModel } from '../src/learning/engine/learnerModel.js'
import { buildSessionPlan, DURATION_ORDER } from '../src/learning/engine/session.js'
import { derivePreA1Readiness } from '../src/learning/curriculum/readiness.js'
import { playCurriculum, STRONG, ASSISTED, DAY } from './lib/journey.mjs'

let groups = 0
const ok = () => { groups += 1 }

/* The curriculum as it is being frozen. Changing this list is a decision. */
const FROZEN = [
  ['greetings', 'first_greeting', 'introduce_self'],
  ['greetings', 'ask_name', 'ask_name'],
  ['greetings', 'nice_to_meet', 'full_greeting'],
  ['connect', 'how_are_you', 'ask_wellbeing'],
  ['connect', 'where_from', 'ask_origin'],
  ['connect', 'first_conversation', 'full_conversation'],
  ['choose', 'what_you_like', 'express_preferences'],
  ['choose', 'what_you_want', 'express_needs'],
  ['choose', 'make_a_plan', 'make_plan'],
  ['cafe', 'a_coffee_please', 'polite_request'],
  ['cafe', 'anything_else', 'respond_anything_else'],
  ['cafe', 'your_first_order', 'cafe_order'],
  ['repair', 'lost_you', 'ask_for_repair'],
  ['repair', 'say_again', 'ask_for_repair'],
  ['repair', 'we_can_continue', 'close_an_encounter'],
  ['things', 'what_is_this', 'identify_things'],
  ['things', 'how_many', 'use_small_numbers'],
]

/* ---- 1) six arcs, seventeen episodes, this order ---- */
{
  assert.equal(ARC.length, 17, `Pre-A1 is seventeen episodes, found ${ARC.length}`)
  assert.equal(new Set(FROZEN.map(([arc]) => arc)).size, 6, 'and six arcs')
  ARC.forEach((ep, i) => {
    const [arc, id, canDoId] = FROZEN[i]
    assert.equal(ep.id, id, `episode ${i + 1} should be ${id}, found ${ep.id}`)
    assert.equal(ep.arc, arc, `${id} belongs to ${arc}`)
    assert.equal(ep.canDoId, canDoId, `${id} teaches ${canDoId}`)
  })
  assert.equal(new Set(ARC.map(e => e.id)).size, 17, 'no episode may appear twice')
  const declaredArcs = Array.isArray(ARCS) ? ARCS.map(a => a.id || a) : Object.keys(ARCS)
  for (const arcId of new Set(FROZEN.map(([arc]) => arc))) {
    assert.ok(declaredArcs.includes(arcId), `${arcId} should be a declared arc`)
  }
  assert.equal(declaredArcs.length, 6, `six arcs are declared, found ${declaredArcs.length}`)
  ok()
}

/* ---- 2) nothing has been added, and nothing is orphaned ---- */
{
  /*
   * THE LANGUAGE THIS LEVEL SHIPS WITH, pinned so nothing new can slip in quietly.
   *
   * This used to assert `SEED_VOCAB.length === 72`. The number was right and the
   * subject was wrong: the catalogue holds every level's language, so A1's first
   * eight items broke a Pre-A1 freeze without touching one Pre-A1 episode. What is
   * frozen is Pre-A1's share of it, so that is what is counted — everything its
   * own episodes refer to, plus the receptive and incidental items it declares.
   *
   * Adding a seventy-third Pre-A1 item still fails here. Adding an A1 item does
   * not, and must not.
   */
  const preA1Referenced = new Set([
    ...ARC.flatMap(ep => [
      ...(ep.gardenItems || []),
      ...(ep.steps || []).flatMap(step => [
        ...(step.itemIds || []),
        ...(step.itemId ? [step.itemId] : []),
        ...(step.meaningItems || []),
        ...(step.turns || []).flatMap(turn => [...(turn.itemIds || []), ...(turn.itemId ? [turn.itemId] : [])]),
      ]),
    ]),
    ...RECEPTIVE_ITEMS,
    ...INCIDENTAL_ITEMS,
  ])
  /*
   * Thirteen of the seventy-two are seed entries the Garden shows and no episode
   * references — see pre-a1-map.md. So Pre-A1's share is the catalogue minus the
   * levels above it, and an A1 item that were not declared in a1Map would be
   * counted here and fail, which is the failure we want.
   */
  /*
   * A2's, B1's and B2's own catalogue shares are subtracted the same way
   * A1's is, so a level added above A1 cannot inflate Pre-A1's count either
   * — the identical bug class this file's own comment already names for A1.
   */
  const a1Own = new Set([...a1ItemIds()].filter(id => !preA1Referenced.has(id)))
  const a2Own = new Set([...a2ItemIds()].filter(id => !preA1Referenced.has(id) && !a1Own.has(id)))
  const b1Own = new Set([...b1ItemIds()].filter(id => !preA1Referenced.has(id) && !a1Own.has(id) && !a2Own.has(id)))
  const b2Own = new Set([...b2ItemIds()].filter(id => !preA1Referenced.has(id) && !a1Own.has(id) && !a2Own.has(id) && !b1Own.has(id)))
  const preA1Vocab = SEED_VOCAB.filter(v => !a1Own.has(v.id) && !a2Own.has(v.id) && !b1Own.has(v.id) && !b2Own.has(v.id))
  assert.equal(preA1Vocab.length, 72, `the level ships 72 entries of language, found ${preA1Vocab.length}`)
  const byKind = preA1Vocab.reduce((acc, v) => ({ ...acc, [v.kind]: (acc[v.kind] || 0) + 1 }), {})
  assert.deepEqual(byKind, { word: 30, pattern: 12, phrase: 30 },
    `the mix of words, patterns and phrases is frozen too: ${JSON.stringify(byKind)}`)
  /*
   * One row per word. `like` and `need` were each in the catalogue twice — an old
   * entry among the demo words and the one the third arc added when it began
   * teaching them. `SEED_VOCAB_BY_ID` is last-wins, so the duplicates changed
   * nothing except every count taken from the catalogue, which is how "74 items"
   * came to be quoted for a level that has 72.
   */
  const ids = SEED_VOCAB.map(v => v.id)
  const duplicated = ids.filter((id, i) => ids.indexOf(id) !== i)
  assert.deepEqual(duplicated, [], `the catalogue must hold each item once: ${duplicated.join(', ')}`)
  assert.equal(Object.keys(SEED_VOCAB_BY_ID).length, SEED_VOCAB.length,
    'and the lookup must see every entry')
  assert.equal(LEVEL, 'pre_a1')

  // every capability the map talks about is taught by one of the seventeen
  const taught = new Set(ARC.map(e => e.canDoId))
  for (const canDoId of Object.keys(CAN_DO_INTENT)) {
    if (canDoId === FIRST_A1_CAPABILITY) continue
    assert.ok(taught.has(canDoId), `${canDoId} is in the map and no episode teaches it`)
  }
  // and every required capability is one of them
  for (const canDoId of PRE_A1_EXIT_CRITERIA.requiredCanDos) {
    assert.ok(taught.has(canDoId), `${canDoId} is required to leave the level and nothing teaches it`)
  }
  /*
   * The boundary constants name entries in the capability map, and an episode
   * teaches the can-do such an entry covers — so the level's last capability is
   * checked through what it covers rather than by its own id.
   */
  const last = CAPABILITY_MAP.find(c => c.id === LAST_PRE_A1_CAPABILITY)
  assert.ok(last, `${LAST_PRE_A1_CAPABILITY} should be described in the capability map`)
  assert.ok(taught.has(last.covers?.canDo), `the level's last capability (${last.covers?.canDo}) must be taught`)

  /*
   * The level is frozen with its weaknesses declared rather than hidden: two
   * capabilities are `fragile` and two `needs_reuse`, and each says why. Numbers
   * are one of them — taught in episode seventeen and never required again.
   * Every such judgement must keep its explanation, and none may be silently
   * promoted to "covered" to make the level look finished.
   */
  const declared = ['covered', 'fragile', 'needs_reuse', 'optional']
  const statuses = CAPABILITY_MAP.reduce((acc, c) => ({ ...acc, [c.status]: (acc[c.status] || 0) + 1 }), {})
  assert.deepEqual(statuses, { covered: 18, fragile: 2, needs_reuse: 2, optional: 5, defer_a1: 6 },
    `the level's own account of itself is frozen too: ${JSON.stringify(statuses)}`)
  assert.ok(declared.includes(last.status), `the last capability is ${last.status}`)
  for (const capability of [...capabilitiesWithStatus('fragile'), ...capabilitiesWithStatus('needs_reuse')]) {
    assert.ok(capability.note || capability.why, `${capability.id} is not fully covered and does not say why`)
    const canDo = capability.covers?.canDo
    const intent = capability.covers?.intent
    const produced = canDo
      ? taught.has(canDo)
      : ARC.some(ep => (intentsForEpisode(ep.id) || []).includes(intent))
    assert.ok(produced,
      `${capability.id} is declared weak, not absent — something must still teach it`)
  }
  ok()
}

/* ---- 3) no A1, no eighteenth episode, no half-built next level ---- */
{
  /*
   * The map records what the level deliberately leaves for A1, with a reason for
   * each. Those must stay deferred: an episode appearing for one of them is the
   * next level starting early, whatever it is called.
   */
  const deferred = capabilitiesWithStatus('defer_a1')
  assert.ok(deferred.length >= 6, `the A1 horizon should still be described, found ${deferred.length}`)
  for (const capability of deferred) {
    assert.ok(capability.why, `${capability.id} is deferred with no reason given`)
    const taughtHere = ARC.some(e => e.canDoId === capability.id || e.canDoId === capability.covers?.canDo)
    assert.equal(taughtHere, false, `${capability.id} is deferred to A1 and something teaches it`)
  }

  // the level knows what comes next without starting it
  assert.ok(FIRST_A1_CAPABILITY, 'the level should know what comes next')
  assert.ok(!ARC.some(e => e.canDoId === FIRST_A1_CAPABILITY), 'but must not teach it yet')

  // every capability the map says is covered really is covered by an episode
  const taughtCanDos = new Set(ARC.map(e => e.canDoId))
  for (const capability of capabilitiesWithStatus('covered')) {
    const canDo = capability.covers?.canDo
    if (!canDo) continue
    assert.ok(taughtCanDos.has(canDo), `${capability.id} claims to cover ${canDo}, which no episode teaches`)
  }

  /*
   * NO EPISODE MAY BE SMUGGLED INTO PRE-A1'S OWN CONTENT.
   *
   * This walked the whole `episodes/` directory, which was the same thing as
   * "Pre-A1's content" until A1 arc 1 put its own file there. It now walks the
   * files Pre-A1's content module is built from, so the freeze still catches an
   * eighteenth Pre-A1 episode and stops calling A1's episodes intruders.
   */
  const PRE_A1_CONTENT_FILES = ['index.js', 'preA1Content.js']
  const ids = new Set(ARC.map(e => e.id))
  for (const file of PRE_A1_CONTENT_FILES) {
    const src = readFileSync(`src/learning/episodes/${file}`, 'utf8')
    for (const [, id] of src.matchAll(/^\s*id:\s*'([a-z0-9_]+)'/gm)) {
      assert.ok(ids.has(id), `${file} defines episode "${id}", which is not part of the frozen level`)
    }
  }
  ok()
}

/* ---- 4) every episode is reachable, in order, from nothing ---- */
{
  for (const ep of ARC) {
    const chain = prerequisiteChain(ep.id) || []
    for (const priorId of chain) {
      const prior = getEpisode(priorId)
      assert.ok(prior, `${ep.id} requires "${priorId}", which does not exist`)
      assert.ok(ARC.indexOf(prior) < ARC.indexOf(ep), `${ep.id} requires ${priorId}, which comes later`)
    }
  }
  ok()
}

/* ---- 5) frozen is not over: a finished learner still has somewhere to go ---- */
{
  const finished = createLearnerModel()
  const played = playCurriculum(finished, { profile: ASSISTED, startMs: Date.now() - 60 * DAY })
  const readiness = derivePreA1Readiness(finished, { atMs: played.endedAt })
  assert.equal(readiness.curriculumComplete, true, 'the journey should have finished the curriculum')

  for (const mode of DURATION_ORDER) {
    const plan = buildSessionPlan(finished, ARC, {
      durationMode: mode, atMs: played.endedAt, learnerKey: 'freeze',
    })
    const real = plan.blocks.filter(b => b.objective)
    assert.ok(real.length >= 1, `a ${mode} session after the last episode offered nothing to do`)
    assert.ok(!plan.blocks.some(b => b.type === 'start_episode'),
      `a ${mode} session offered a new episode in a finished level`)
  }
  ok()
}

/* ---- 6) and a graduate is not shown a locked door either ---- */
{
  const graduate = createLearnerModel()
  const played = playCurriculum(graduate, { profile: STRONG, startMs: Date.now() - 60 * DAY })
  const plan = buildSessionPlan(graduate, ARC, {
    durationMode: 'standard', atMs: played.endedAt, learnerKey: 'freeze',
  })
  assert.ok(plan.blocks.filter(b => b.objective).length >= 1,
    'a learner who has everything must still be offered practice')
  ok()
}

/* ---- 7) progress stays on this machine ---- */
{
  const forbidden = /supabase|createClient\(|postgrest|pgvector|SUPABASE_/i
  const offenders = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue
      const path = `${dir}/${entry.name}`
      if (entry.isDirectory()) walk(path)
      else if (/\.(jsx?|mjs|json|ts|tsx)$/.test(entry.name) && forbidden.test(readFileSync(path, 'utf8'))) {
        offenders.push(path)
      }
    }
  }
  walk('src')
  assert.deepEqual(offenders, [], `progress must stay local: ${offenders.join(', ')}`)

  const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  const cloud = Object.keys(deps).filter(d => /supabase|firebase|amplify/i.test(d))
  assert.deepEqual(cloud, [], `no cloud dependency belongs here yet: ${cloud.join(', ')}`)

  for (const path of ['supabase', 'supabase/config.toml', 'supabase/migrations', '.env.supabase']) {
    assert.equal(existsSync(path), false, `${path} should not exist`)
  }
  ok()
}

console.log(`\ncheck-pre-a1-freeze — OK  (${groups} freeze groups verified)`)
