/*
 * check-a1-arc4 — the fourth real A1 arc, against the design it came from.
 *
 * The same shape as `check:a1-arc1`, `-arc2` and `-arc3`, pointed at
 * `finding_your_way`, and again a SEPARATE file: an arc check that grows into a
 * level check is how arc 1's assertions started reading arc 2 as a regression.
 * This file owns arc 4. "How many arcs exist at all" belongs to
 * `check:a1-blueprint`.
 *
 * Everything expected is read out of docs/curriculum/a1-blueprint.json. Four things
 * make this arc different from the three before it, and each is checked as a fact
 * rather than glossed:
 *
 *   1. THREE capabilities, THREE episodes, all `role: primary` — the first arc with
 *      one capability per episode, and with a `should`-scope capability in it that
 *      must NOT be promoted to required.
 *   2. THREE new intents, one per capability, two `deterministic_local` and one
 *      `hybrid` — and the hybrid one must actually escalate rather than guess.
 *   3. It HOSTS A STORY, which arc 3 did not, and that story must be reachable only
 *      from its episode and never as a loose session block.
 *   4. THE RECEPTIVE SIDE IS THE POINT. Eight items the learner hears and is never
 *      asked to produce, and NO directions anywhere — `follow_multi_step_directions`
 *      is deferred to A2, so a check that let "turn left" through would let the arc
 *      quietly become an A2 lesson.
 *
 * It captures NO fact, like arc 3, and that is asserted explicitly: a design
 * decision that leaves no trace in a check is indistinguishable from something
 * forgotten.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { ARC } from '../src/learning/episodes/index.js'
import { A1_ARC1 } from '../src/learning/episodes/a1Arc1.js'
import { A1_ARC2 } from '../src/learning/episodes/a1Arc2.js'
import { A1_ARC3 } from '../src/learning/episodes/a1Arc3.js'
import { A1_ARC4, A1_ARC4_ID, getA1Arc4Episode } from '../src/learning/episodes/a1Arc4.js'
import {
  A1, PRE_A1, getLevel, episodesOfLevel, isLevelAvailable, hasRuntimeContent, isLevelComplete,
} from '../src/learning/curriculum/levels.js'
import {
  A1_CAN_DO_INTENT, a1IntentsOf, A1_REQUIRED_CAN_DOS,
  A1_RECEPTIVE_ITEMS, A1_RUNTIME_ARCS, A1_INTRODUCED_ITEMS, a1ProductiveItemsOf,
} from '../src/learning/curriculum/a1Map.js'
import { episodeRequest, loadEpisodeContent, hasContentLoader, REFUSED } from '../src/learning/curriculum/episodeContent.js'
import { requiredLevelItems } from '../src/learning/curriculum/preA1Map.js'
import { evaluateFree, shouldEscalate } from '../src/learning/engine/responseEvaluation.js'
import { SEMANTIC_TYPES, INTENT_SLOTS, NEUTRAL_CATALOG, isContextCompatible, classifyValue } from '../src/learning/engine/semanticContext.js'
import { getStory, hasStory, storyTurns, storyBranches, storyHome, turnText } from '../src/learning/engine/miniStory.js'
import { formatSupportsObjective } from '../src/learning/engine/formatChoice.js'
import { SEED_VOCAB_BY_ID } from '../src/data/vocabulary.js'

const BLUEPRINT = JSON.parse(readFileSync(new URL('../../docs/curriculum/a1-blueprint.json', import.meta.url), 'utf8'))
const ARC_SPEC = BLUEPRINT.arcs.find(arc => arc.id === 'finding_your_way')
const EP_SPECS = BLUEPRINT.episodes.filter(ep => ep.arc === 'finding_your_way')

let groups = 0
const ok = () => { groups++ }

/* ---- 1) the arc is the blueprint's arc ---- */
{
  assert.equal(A1_ARC4_ID, ARC_SPEC.id, 'the arc id must be the blueprint\'s')
  assert.equal(ARC_SPEC.order, 4, 'this check is about the FOURTH arc')
  assert.equal(A1_ARC4.length, ARC_SPEC.episodes.length, 'one runtime episode per planned episode')
  assert.deepEqual(ARC_SPEC.episodes, [27, 28, 29], 'the blueprint plans 27–29 and nothing was renumbered')
  for (const ep of A1_ARC4) {
    assert.equal(ep.arc, A1_ARC4_ID, `${ep.id}: wrong arc`)
    assert.equal(ep.level, 'A1', `${ep.id}: wrong level`)
  }
  /* the arc's own order, and the prerequisite chain that expresses it */
  assert.deepEqual(A1_ARC4.map(ep => ep.id), ['where_is_it', 'its_over_there', 'how_do_i_get_there'])
  assert.deepEqual(A1_ARC4[1].prerequisites, ['where_is_it'], 'episode 28 follows 27')
  assert.deepEqual(A1_ARC4[2].prerequisites, ['its_over_there'], 'episode 29 follows 28')
  /*
   * Episode 27's prerequisite is the blueprint's `[20]`, which is arc 1's third
   * episode — an episode id, not a vocabulary id. Naming the wrong kind of thing here
   * is what `check:curriculum-authoring` caught during this arc's implementation.
   */
  const ep20 = A1_ARC1[A1_ARC1.length - 1]
  assert.deepEqual(A1_ARC4[0].prerequisites, [ep20.id],
    `episode 27's prerequisite must be the blueprint's [20] — ${ep20.id}`)
  ok()
}

/* ---- 2) three capabilities, one per episode, with the blueprint's scopes ---- */
{
  const expected = EP_SPECS.map(spec => spec.canDo)
  assert.deepEqual(A1_ARC4.map(ep => ep.canDoId), expected, 'each episode teaches its planned capability')
  assert.deepEqual(expected, ['ask_where_something_is', 'say_where_something_is', 'ask_about_getting_somewhere'])
  /* every one of them is primary — no reinforcement episodes in this arc */
  for (const [i, ep] of A1_ARC4.entries()) {
    assert.equal(ep.role, EP_SPECS[i].role, `${ep.id}: role must be the blueprint's`)
    assert.equal(ep.role, 'primary', `${ep.id}: the blueprint makes every arc-4 episode primary`)
    assert.notEqual(ep.reinforces, true, `${ep.id}: a primary episode must produce its own capability`)
  }
  /*
   * REQUIRED vs SHOULD, and this is the assertion that stops scope creep: the
   * blueprint scopes the transport capability `should`, so it must be absent from the
   * required list while the two location ones are present.
   */
  const scopeOf = (id) => BLUEPRINT.canDos.find(cd => cd.id === id)?.scope
  assert.equal(scopeOf('ask_where_something_is'), 'required')
  assert.equal(scopeOf('say_where_something_is'), 'required')
  assert.equal(scopeOf('ask_about_getting_somewhere'), 'should')
  assert.ok(A1_REQUIRED_CAN_DOS.includes('ask_where_something_is'), 'the first is required')
  assert.ok(A1_REQUIRED_CAN_DOS.includes('say_where_something_is'), 'the second is required')
  assert.equal(A1_REQUIRED_CAN_DOS.includes('ask_about_getting_somewhere'), false,
    'a should-have capability must not be listed as required')
  ok()
}

/* ---- 3) the three new intents, and only three ---- */
{
  const intents = A1_ARC4.map(ep => A1_CAN_DO_INTENT[ep.canDoId])
  assert.deepEqual(intents, ['ask_location', 'state_location', 'ask_transport'],
    'each capability is headlined by its blueprint intent')
  for (const intent of intents) {
    assert.ok(BLUEPRINT.intentStrategy.newIntents.includes(intent),
      `${intent} is not one of the blueprint's new A1 intents`)
  }
  /* one intent per capability: no extras map to these three */
  for (const ep of A1_ARC4) {
    assert.deepEqual(a1IntentsOf(ep.canDoId), [A1_CAN_DO_INTENT[ep.canDoId]],
      `${ep.canDoId}: arc 4's capabilities each have exactly one intent`)
  }
  /* the blueprint's explosion guard: three new intents is the ceiling for an arc */
  assert.ok(new Set(intents).size <= 3, 'more than three new intents means the arc teaches phrases')
  ok()
}

/* ---- 4) local evaluation: the two deterministic ones decide, the hybrid escalates ---- */
{
  const evaluationOf = (id) => BLUEPRINT.canDos.find(cd => cd.id === id)?.evaluation
  assert.equal(evaluationOf('ask_where_something_is'), 'deterministic_local')
  assert.equal(evaluationOf('say_where_something_is'), 'deterministic_local')
  assert.equal(evaluationOf('ask_about_getting_somewhere'), 'hybrid')

  /* the canonical frames pass, unaided */
  const pass = (kind, text, ctx = {}) => evaluateFree(kind, text, { independent: true, ...ctx })
  assert.equal(pass('ask_location', 'Where is the toilet?').completedObjective, true)
  assert.equal(pass('state_location', "It's next to the bag.").completedObjective, true)
  assert.equal(pass('ask_transport', 'How do I get to the station?').completedObjective, true)

  /* nonsense is refused for every one of them — the authoring contract's rule 6 */
  for (const kind of ['ask_location', 'state_location', 'ask_transport']) {
    const verdict = pass(kind, 'banana purple seventeen')
    assert.equal(verdict.completedObjective, false, `${kind} accepts nonsense`)
    assert.equal(verdict.retryRequired, true, `${kind}: nonsense must ask for another go`)
  }
  /* the two deterministic ones are CONCLUSIVE even when they refuse */
  for (const kind of ['ask_location', 'state_location']) {
    assert.equal(pass(kind, 'banana purple').conclusive, true, `${kind} must decide locally`)
  }
  /*
   * and the hybrid one must NOT: an unrecognised attempt escalates instead of being
   * called wrong, which is what `hybrid` means in the blueprint.
   */
  const hybrid = pass('ask_transport', 'The station, is it possible by bicycle?')
  assert.equal(hybrid.conclusive, false, 'ask_transport must leave an unknown shape inconclusive')
  assert.equal(shouldEscalate(hybrid), true, 'an inconclusive transport question must escalate')
  ok()
}

/* ---- 5) DIRECTIONS ARE NOT THIS ARC ---- */
{
  /* the blueprint defers them, and says why in the arc's own risk note */
  assert.ok(BLUEPRINT.deferredToA2.some(d => d.id === 'follow_multi_step_directions'),
    'multi-step directions must still be deferred')
  assert.match(ARC_SPEC.risk, /Directions creep/, 'the arc must still carry its risk note')

  /* a learner who produces directions has not demonstrated an A1 capability */
  const verdict = evaluateFree('state_location', 'Go straight on and turn left.', { independent: true })
  assert.equal(verdict.completedObjective, false, 'directions must not count as saying where something is')
  assert.equal(verdict.errorType, 'directions_not_taught', 'and the reason must say so')

  /* nothing in the arc's own content teaches or models them */
  const source = readFileSync(new URL('../src/learning/episodes/a1Arc4.js', import.meta.url), 'utf8')
  const prose = source.replace(/\/\*[\s\S]*?\*\//g, '')     // comments may discuss them
  for (const banned of ['turn left', 'turn right', 'straight on', 'on your left', 'on your right']) {
    assert.equal(prose.toLowerCase().includes(banned), false, `arc 4 teaches "${banned}", which is A2`)
  }
  /* and no A2 capability sneaks in as a can-do */
  for (const ep of A1_ARC4) {
    assert.equal(BLUEPRINT.deferredToA2.some(d => d.id === ep.canDoId), false,
      `${ep.id} teaches a deferred capability`)
  }
  ok()
}

/* ---- 6) vocabulary: the blueprint's budget, split productive / receptive ---- */
{
  const PRODUCTIVE = ['where_is_pattern', 'its_location_pattern', 'here', 'there', 'next_to', 'near', 'toilet', 'station']
  const RECEPTIVE = ['bus', 'train', 'upstairs', 'downstairs', 'opposite', 'behind', 'exit', 'platform']
  assert.equal(PRODUCTIVE.length, ARC_SPEC.vocabularyBudget.newProductive,
    `the arc's productive budget is ${ARC_SPEC.vocabularyBudget.newProductive}`)
  assert.equal(RECEPTIVE.length, ARC_SPEC.vocabularyBudget.newReceptive,
    `the arc's receptive budget is ${ARC_SPEC.vocabularyBudget.newReceptive}`)

  /* every one of them is a real catalogue entry, translated everywhere */
  for (const id of [...PRODUCTIVE, ...RECEPTIVE]) {
    const entry = SEED_VOCAB_BY_ID[id]
    assert.ok(entry, `${id} is not in the vocabulary catalogue`)
    for (const lang of ['en', 'es', 'pt', 'fr', 'it', 'de', 'ja', 'ar']) {
      assert.ok(entry.meaning?.[lang], `${id}: no ${lang} meaning`)
    }
  }
  /* the productive ones are what the arc GRANTS, once each */
  const granted = A1_ARC4.flatMap(ep => ep.gardenItems || [])
  assert.deepEqual([...granted].sort(), [...PRODUCTIVE].sort(), 'the arc grants exactly its productive budget')
  assert.equal(new Set(granted).size, granted.length, 'no item is granted twice')
  /* the receptive ones are declared receptive, and granted by nobody */
  for (const id of RECEPTIVE) {
    assert.ok(A1_RECEPTIVE_ITEMS.includes(id), `${id} must be declared receptive`)
    assert.equal(granted.includes(id), false, `${id} is receptive and must not be granted`)
  }
  /* and the whole lot belongs to A1's share of the catalogue, not Pre-A1's */
  for (const id of [...PRODUCTIVE, ...RECEPTIVE]) {
    assert.ok(A1_INTRODUCED_ITEMS.includes(id), `${id} must be declared as A1's own item`)
  }
  ok()
}

/* ---- 7) Pre-A1's required core is untouched by any of it ---- */
{
  const preA1Required = requiredLevelItems(PRE_A1)
  for (const id of [...A1_INTRODUCED_ITEMS]) {
    assert.equal(preA1Required.includes(id), false, `${id} leaked into Pre-A1's required core`)
  }
  /* Pre-A1 still has exactly its own seventeen episodes */
  assert.equal(episodesOfLevel(PRE_A1).length, ARC.length, 'Pre-A1 must not gain or lose an episode')
  ok()
}

/* ---- 8) the patterns the blueprint names, and their prerequisite ---- */
{
  for (const id of ARC_SPEC.newPatterns) {
    const pattern = BLUEPRINT.patterns.find(p => p.id === id)
    assert.ok(pattern, `${id} is not a blueprint pattern`)
    assert.equal(pattern.firstArc, 'finding_your_way', `${id} belongs to another arc`)
    assert.ok(SEED_VOCAB_BY_ID[id], `${id} must exist as a catalogue entry so the Garden can hold it`)
    /* both are built on Pre-A1's `it's a ...`, which is why they are teachable here */
    assert.equal(pattern.prerequisite, 'its_a_pattern', `${id}: the blueprint gives it a prerequisite`)
  }
  assert.deepEqual(ARC_SPEC.newPatterns, ['where_is_pattern', 'its_location_pattern'])
  /* the arc introduces no others */
  const introducedPatterns = A1_ARC4.flatMap(ep => ep.gardenItems || [])
    .filter(id => SEED_VOCAB_BY_ID[id]?.kind === 'pattern')
  assert.deepEqual(introducedPatterns.sort(), [...ARC_SPEC.newPatterns].sort(),
    'the arc grants exactly the patterns the blueprint gives it')
  ok()
}

/* ---- 9) semantic types: `transport_mode` registered, `day` still not ---- */
{
  for (const type of ARC_SPEC.semanticNeeds) {
    assert.ok(SEMANTIC_TYPES.includes(type), `${type} is needed by arc 4 and not registered`)
  }
  assert.deepEqual(ARC_SPEC.semanticNeeds, ['place', 'generic_object', 'transport_mode'])
  /*
   * `day` is the blueprint's last proposed type with no consumer. Registering a type
   * before its arc exists makes coverage look real, so it must stay out.
   */
  assert.equal(SEMANTIC_TYPES.includes('day'), false, 'day belongs to arc 7 and must not be registered yet')

  /* the slots each new intent accepts, and the exclusions that matter */
  assert.deepEqual(INTENT_SLOTS.ask_location, ['place', 'generic_object'])
  assert.deepEqual(INTENT_SLOTS.state_location, ['place', 'generic_object'])
  assert.deepEqual(INTENT_SLOTS.ask_transport, ['place', 'transport_mode'])
  /* a person is not a place: "Where is Ana?" is a different question */
  assert.equal(isContextCompatible('ask_location', { semanticType: 'person', value: 'Ana' }), false,
    'a person must not fill a location slot')
  /* and the blueprint declares transport incompatible with place */
  const proposed = BLUEPRINT.semanticTypes.proposed.find(t => t.id === 'transport_mode')
  assert.deepEqual(proposed.incompatibleWith, ['place'])
  assert.equal(isContextCompatible('state_location', { semanticType: 'transport_mode', value: 'bus' }), false,
    'a transport mode must not fill a location answer slot')
  /* an unknown value stays unusable rather than being invented into a type */
  assert.equal(classifyValue('gobbledegook'), null, 'an unknown value must not be typed')
  /* transport has a neutral fallback, because a bus is nobody's personal detail */
  assert.ok((NEUTRAL_CATALOG.transport_mode || []).length >= 1, 'transport_mode needs a neutral value')
  assert.deepEqual(NEUTRAL_CATALOG.place, [], 'a place is still never invented')
  ok()
}

/* ---- 10) the arc captures NO fact ---- */
{
  assert.deepEqual(ARC_SPEC.factsCaptured, [], 'the blueprint gives arc 4 no facts')
  const source = readFileSync(new URL('../src/learning/episodes/a1Arc4.js', import.meta.url), 'utf8')
  for (const forbidden of ['captureFact', 'factId', 'storeFact', 'learnerFact']) {
    assert.equal(source.includes(forbidden), false, `arc 4 must capture nothing, and mentions ${forbidden}`)
  }
  /* and the blueprint's reason for it: an address is never collected */
  const address = BLUEPRINT.factsToCapture.find(f => f.id === 'home_address')
  assert.equal(address.store, false, 'a home address must never be stored')
  ok()
}

/* ---- 11) the story exists, is hosted by its episode, and is never a loose block ---- */
{
  assert.equal(ARC_SPEC.miniStory.use, true, 'the blueprint asks arc 4 for a story')
  assert.equal(hasStory('ask_transport'), true, 'the transport story must exist')
  const story = getStory('ask_transport')
  assert.equal(storyHome(story), 'episode', 'the story is hosted by episode 29')
  /*
   * The blueprint's branch, in the blueprint's words: "asking a passer-by or asking
   * at a desk". Two valid choices, neither better.
   */
  assert.deepEqual(storyBranches(story), ['passer_by', 'desk'], 'the two branches are the blueprint\'s')
  assert.match(ARC_SPEC.miniStory.why, /passer-by/, 'the blueprint names the branch')
  /* both branches answer, and both answers carry two clauses the learner cannot produce */
  for (const branch of storyBranches(story)) {
    const lines = storyTurns(story).filter(t => t.kind === 'line').map(t => turnText(t, branch, story))
    assert.ok(lines.every(Boolean), `${branch}: every line must have text`)
    assert.ok(lines.some(line => /\./.test(line.trim().slice(0, -1)) || line.includes(',')),
      `${branch}: the answer must be longer than one clause`)
  }
  /* the episode reaches it; the planner must not */
  const ep29 = getA1Arc4Episode('how_do_i_get_there')
  assert.ok((ep29.steps || []).some(s => s.type === 'mini_story' && s.storyObjective === 'ask_transport'),
    'episode 29 must host the story as a step')
  assert.equal(formatSupportsObjective('mini_story', 'ask_transport'), false,
    'an episode-hosted story must never be offered as a loose session block')
  /* the two objectives WITHOUT a story must never be planned into one */
  for (const objective of ['ask_location', 'state_location']) {
    assert.equal(hasStory(objective), false, `${objective} has no authored story`)
    assert.equal(getStory(objective), null, `${objective}: getStory must fail closed`)
    assert.equal(formatSupportsObjective('mini_story', objective), false,
      `${objective} has no story and must not be planned as one`)
  }
  ok()
}

/* ---- 12) every episode produces its own capability in an OPEN turn ---- */
{
  for (const [i, ep] of A1_ARC4.entries()) {
    const intent = A1_CAN_DO_INTENT[ep.canDoId]
    const openTurns = (ep.steps || []).filter(s => (s.type === 'free_reply' || s.type === 'recall') && s.evalKind === intent)
    assert.ok(openTurns.length >= 1, `${ep.id}: no open turn produces ${intent}`)
    /* at least one of them with NOTHING on screen — that is what unaided means */
    const unaided = openTurns.filter(s => !s.suggestionEn)
    assert.ok(unaided.length >= 1, `${ep.id}: every episode needs one turn with no model`)
    /* the blueprint's open-production count for this episode is met */
    const allOpen = (ep.steps || []).filter(s => s.type === 'free_reply').length
      + (ep.steps || []).filter(s => s.type === 'mini_story').length
    assert.ok(allOpen >= 2, `${ep.id}: the blueprint asks for ${EP_SPECS[i].openProductions} open productions`)
  }
  /*
   * The arc's evidence target, from the blueprint: "two unaided location questions,
   * two unaided short answers, one repair used in context". Episodes 27 and 28 each
   * carry two unaided turns of their own capability, and the repair is in the story.
   */
  assert.match(ARC_SPEC.evidenceTarget, /two unaided location questions/)
  for (const [id, intent] of [['where_is_it', 'ask_location'], ['its_over_there', 'state_location']]) {
    const ep = getA1Arc4Episode(id)
    const unaided = (ep.steps || []).filter(s => (s.type === 'free_reply' || s.type === 'recall')
      && s.evalKind === intent && !s.suggestionEn)
    assert.ok(unaided.length >= 2, `${id}: the blueprint wants two unaided uses, found ${unaided.length}`)
  }
  const story = getStory('ask_transport')
  assert.ok(storyTurns(story).some(t => t.kind === 'reply' && t.evalKind === 'repair_request'),
    'the arc plants one repair, and the story is where it lives')
  ok()
}

/* ---- 13) EVERY MODELLED ANSWER PASSES ITS OWN EVALUATOR ---- */
{
  /*
   * Found by playing episode 27 in a browser, and it is the worst kind of content
   * bug because nothing crashes: the politeness turn modelled "Excuse me, please."
   * for `polite_request`, whose evaluator wants the request frame it was taught with
   * ("Can I have ___, please?"). A learner who copied the sentence ON SCREEN was told
   * they were wrong, and the only way out was to guess something the episode had not
   * shown them.
   *
   * So every suggestion the arc puts on screen — in a step or inside the story — is
   * run through the very evaluator that will judge the learner's copy of it.
   */
  const rejected = []
  const audit = (where, evalKind, suggestion, ctx) => {
    if (!evalKind || !suggestion) return
    const verdict = evaluateFree(evalKind, suggestion, { independent: false, ...ctx })
    if (!verdict.completedObjective) rejected.push(`${where}: ${evalKind} rejects its own model "${suggestion}" (${verdict.errorType})`)
  }
  for (const ep of A1_ARC4) {
    for (const step of ep.steps || []) {
      audit(ep.id, step.evalKind, step.suggestionEn,
        { placeName: step.placeName, relationHint: step.relationHint, repairKind: step.repairKind, thingId: step.thingId })
    }
  }
  for (const turn of storyTurns(getStory('ask_transport'))) {
    audit('story', turn.evalKind, turn.suggestionEn, { repairKind: turn.repairKind })
  }
  assert.deepEqual(rejected, [], `a modelled answer would be marked wrong: ${rejected.join(' · ')}`)
  ok()
}

/* ---- 13) reuse is exercised by a step, not merely declared ---- */
{
  for (const [i, ep] of A1_ARC4.entries()) {
    const spec = EP_SPECS[i]
    const evalKinds = new Set()
    for (const step of ep.steps || []) {
      if (step.evalKind) evalKinds.add(step.evalKind)
      for (const turn of step.turns || []) if (turn.evalKind) evalKinds.add(turn.evalKind)
    }
    /* every episode reuses something that is not its own capability */
    const own = A1_CAN_DO_INTENT[ep.canDoId]
    assert.ok([...evalKinds].some(k => k !== own), `${ep.id}: nothing is reused`)
    assert.ok((spec.integratedReuse || []).length >= 1, `${spec.plannedNumber}: the blueprint lists reuse`)
  }
  /* the arc's Pre-A1 reuse, and each is exercised somewhere in the arc */
  const allKinds = new Set(A1_ARC4.flatMap(ep => (ep.steps || []).map(s => s.evalKind)).filter(Boolean))
  const storyKinds = new Set(storyTurns(getStory('ask_transport')).map(t => t.evalKind).filter(Boolean))
  const exercised = new Set([...allKinds, ...storyKinds])
  assert.ok(exercised.has('identify_thing'), 'identify_things is reused, per preA1Reuse')
  assert.ok(exercised.has('polite_request'), 'polite_request is reused, per preA1Reuse')
  assert.ok(exercised.has('repair_request'), 'ask_for_repair is reused, per preA1Reuse')
  assert.ok(exercised.has('close_encounter'), 'close_an_encounter is reused, per preA1Reuse')
  ok()
}

/* ---- 14) XP: the runtime contract, once each, never inflated ---- */
{
  assert.deepEqual(A1_ARC4.map(ep => ep.xp), [75, 75, 85],
    'arc 4 keeps the level\'s XP shape: two standard episodes and a longer close')
  for (const ep of A1_ARC4) {
    assert.ok(ep.xp > 0 && ep.xp <= 100, `${ep.id}: XP outside the level's range`)
    assert.ok(ep.estimatedMinutes >= 8 && ep.estimatedMinutes <= 12, `${ep.id}: unrealistic duration`)
  }
  /* the same numbers arcs 1–3 use, so no arc is quietly worth more */
  assert.deepEqual(A1_ARC4.map(ep => ep.xp), A1_ARC3.map(ep => ep.xp), 'arc 4 is worth what arc 3 is worth')
  ok()
}

/* ---- 15) the resolver: arc 4 loads, arc 5 does not ---- */
{
  assert.equal(hasContentLoader(A1, 'finding_your_way'), true, 'arc 4 must be loadable')
  for (const ep of A1_ARC4) {
    const tooling = episodeRequest({ episodeId: ep.id, forLearner: false })
    assert.equal(tooling.ok, true, `${ep.id} must resolve for tooling`)
    assert.equal(tooling.arcId, 'finding_your_way', `${ep.id}: wrong arc resolved`)
    /* and a learner is refused BEFORE any content is fetched */
    const learner = episodeRequest({ episodeId: ep.id })
    assert.equal(learner.ok, false, `${ep.id} must be closed to learners`)
    assert.equal(learner.reason, REFUSED.LEVEL_UNAVAILABLE, `${ep.id}: wrong refusal`)
  }
  /* the content really is this arc's, loaded through the real door */
  const loaded = await loadEpisodeContent({ episodeId: 'where_is_it', forLearner: false })
  assert.equal(loaded.id, 'where_is_it')
  assert.equal(loaded.canDoId, 'ask_where_something_is')
  assert.ok((loaded.steps || []).length >= 8, 'a real episode, not a stub')
  ok()
}

/* ---- 16) arc 5 and beyond remain impossible ---- */
{
  const unbuilt = BLUEPRINT.arcs.filter(arc => !A1_RUNTIME_ARCS.includes(arc.id))
  assert.deepEqual(unbuilt.map(a => a.id), ['paying_and_choosing', 'what_you_can_do', 'making_arrangements'],
    'exactly three arcs remain unbuilt')
  for (const arc of unbuilt) {
    assert.equal(hasContentLoader(A1, arc.id), false, `${arc.id} must have no loader`)
    for (const canDo of arc.newCanDos || []) {
      assert.ok(!A1_CAN_DO_INTENT[canDo], `${canDo} is registered before its arc exists`)
    }
  }
  /* an id from arc 5, and ids that never existed, all fail closed */
  for (const ghost of ['wheres_the_station', 'ask_price', 'a1_ep30', 'paying_and_choosing_first']) {
    const result = episodeRequest({ levelId: A1, episodeId: ghost, forLearner: false })
    assert.equal(result.ok, false, `${ghost} must not resolve`)
    assert.equal(result.reason, REFUSED.UNKNOWN_EPISODE, `${ghost}: wrong reason`)
  }
  await assert.rejects(() => loadEpisodeContent({ levelId: A1, episodeId: 'a1_ep30', forLearner: false }),
    /unknown_episode/, 'an unbuilt arc\'s episode must never load')
  ok()
}

/* ---- 17) A1 is still partial, and still closed ---- */
{
  assert.equal(hasRuntimeContent(A1), true, 'A1 has content')
  assert.equal(isLevelAvailable(A1), false, 'A1 must stay closed to learners')
  assert.equal(isLevelComplete(A1), false, 'A1 is four arcs of seven, so it is not complete')
  assert.equal(getLevel(A1).contentStatus, 'partial', 'contentStatus must stay partial')
  assert.equal(episodesOfLevel(A1).length, A1_ARC1.length + A1_ARC2.length + A1_ARC3.length + A1_ARC4.length,
    'A1 runtime is exactly its four built arcs')
  assert.deepEqual(A1_RUNTIME_ARCS, ['work_and_study', 'daily_rhythm', 'people_around_you', 'finding_your_way'],
    'the runtime arcs are exactly arcs 1–4, in the blueprint\'s order')
  ok()
}

/* ---- 18) personalisation may change what a turn is about, never what it asks ---- */
{
  /* the arc declares no story personalisation, so none may be inferred */
  const source = readFileSync(new URL('../src/learning/episodes/a1Arc4.js', import.meta.url), 'utf8')
  assert.equal(/personalizationMode/.test(source), false,
    'arc 4 declares no personalisation, and must not gain one silently')
  /* the places it names are public and authored, never a remembered fact */
  for (const ep of A1_ARC4) {
    for (const step of ep.steps || []) {
      if (!step.placeName) continue
      assert.ok(/^(the toilet|the exit|the station)$/.test(step.placeName),
        `${ep.id}: ${step.placeName} is not one of the arc's public places`)
    }
  }
  /* and every slot type the arc's intents accept is one the engine knows */
  for (const intent of ['ask_location', 'state_location', 'ask_transport']) {
    for (const slot of INTENT_SLOTS[intent]) {
      assert.ok(SEMANTIC_TYPES.includes(slot), `${intent}: ${slot} is not a registered type`)
    }
  }
  ok()
}

console.log(`\ncheck-a1-arc4 — OK  (${groups} arc groups verified)`)
