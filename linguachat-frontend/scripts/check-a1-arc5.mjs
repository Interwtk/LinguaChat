/*
 * check-a1-arc5 — the fifth real A1 arc, against the design it came from.
 *
 * The same shape as `check:a1-arc1` through `-arc4`, pointed at `paying_and_choosing`,
 * and again a SEPARATE file for the reason arc 4's own check names: an arc check that
 * grows into a level check is how arc 1's assertions started reading arc 2 as a
 * regression. This file owns arc 5. Six things make it different from every arc
 * before it, and each is checked as a fact rather than glossed:
 *
 *   1. FOUR episodes, not three — the blueprint's own risk note: "a number system, a
 *      question form and a transaction", and episode 32 is this level's first
 *      REINFORCEMENT episode: same can-do as 31, no new intent.
 *   2. ONE new intent, not three. `use_bigger_numbers` reuses `use_quantity` with its
 *      taught range extended; `buy_something`'s headline is Pre-A1's
 *      `cafe_order_conversation`, reused; only `ask_the_price` is genuinely new.
 *   3. THE VOCABULARY BUDGET IS A CEILING, NOT A QUOTA — arc 1's own precedent
 *      (`assert.ok(... <= budget)`), and this arc is the first case that actually
 *      needs it: it ships 7 productive items and 1 receptive against a 10/8 budget,
 *      because `numbers_11_100` is deliberately one Garden entry, not ninety.
 *   4. THREE capabilities are ALL required, no should-have among them — the inverse of
 *      arc 4, which is worth asserting explicitly rather than leaving unstated.
 *   5. `buy_something` IS hybrid, and it is the first hybrid capability whose headline
 *      evaluator is a REUSED Pre-A1 one (`cafe_order_conversation`) rather than a new
 *      A1 evaluator — so the hybrid property has to be proven on borrowed code.
 *   6. IT HOSTS A STORY, at episode 33 only, exactly like arc 4's — episode-hosted,
 *      never a loose session block.
 *
 * It captures NO fact, like arc 3 and arc 4, and that is asserted explicitly.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { ARC } from '../src/learning/episodes/index.js'
import { A1_ARC1 } from '../src/learning/episodes/a1Arc1.js'
import { A1_ARC2 } from '../src/learning/episodes/a1Arc2.js'
import { A1_ARC3 } from '../src/learning/episodes/a1Arc3.js'
import { A1_ARC4 } from '../src/learning/episodes/a1Arc4.js'
import { A1_ARC5, A1_ARC5_ID, getA1Arc5Episode } from '../src/learning/episodes/a1Arc5.js'
import {
  A1, PRE_A1, getLevel, episodesOfLevel, isLevelAvailable, hasRuntimeContent, isLevelComplete,
} from '../src/learning/curriculum/levels.js'
import {
  A1_CAN_DO_INTENT, a1IntentsOf, A1_REQUIRED_CAN_DOS,
  A1_RECEPTIVE_ITEMS, A1_RUNTIME_ARCS, A1_INTRODUCED_ITEMS,
} from '../src/learning/curriculum/a1Map.js'
import { episodeRequest, loadEpisodeContent, hasContentLoader, REFUSED } from '../src/learning/curriculum/episodeContent.js'
import { requiredLevelItems } from '../src/learning/curriculum/preA1Map.js'
import { evaluateFree, shouldEscalate } from '../src/learning/engine/responseEvaluation.js'
import { SEMANTIC_TYPES, INTENT_SLOTS, isContextCompatible } from '../src/learning/engine/semanticContext.js'
import { getStory, hasStory, storyTurns, storyHome, storyBranches, STORY_BRANCHES } from '../src/learning/engine/miniStory.js'
import { formatSupportsObjective } from '../src/learning/engine/formatChoice.js'
import { SEED_VOCAB_BY_ID } from '../src/data/vocabulary.js'

const BLUEPRINT = JSON.parse(readFileSync(new URL('../../docs/curriculum/a1-blueprint.json', import.meta.url), 'utf8'))
const ARC_SPEC = BLUEPRINT.arcs.find(arc => arc.id === 'paying_and_choosing')
const EP_SPECS = BLUEPRINT.episodes.filter(ep => ep.arc === 'paying_and_choosing')

let groups = 0
const ok = () => { groups++ }

/* ---- 1) the arc is the blueprint's arc ---- */
{
  assert.equal(A1_ARC5_ID, ARC_SPEC.id, 'the arc id must be the blueprint\'s')
  assert.equal(ARC_SPEC.order, 5, 'this check is about the FIFTH arc')
  assert.equal(A1_ARC5.length, ARC_SPEC.episodes.length, 'one runtime episode per planned episode')
  assert.deepEqual(ARC_SPEC.episodes, [30, 31, 32, 33], 'the blueprint plans 30–33 and nothing was renumbered')
  for (const ep of A1_ARC5) {
    assert.equal(ep.arc, A1_ARC5_ID, `${ep.id}: wrong arc`)
    assert.equal(ep.level, 'A1', `${ep.id}: wrong level`)
  }
  /* the arc's own order, chained end to end */
  assert.deepEqual(A1_ARC5.map(ep => ep.id), ['more_than_ten', 'how_much_is_it', 'this_one_or_that_one', 'buying_it'])
  assert.deepEqual(A1_ARC5[1].prerequisites, ['more_than_ten'], 'episode 31 follows 30')
  assert.deepEqual(A1_ARC5[2].prerequisites, ['how_much_is_it'], 'episode 32 follows 31')
  assert.deepEqual(A1_ARC5[3].prerequisites, ['this_one_or_that_one'], 'episode 33 follows 32')
  /*
   * The blueprint plans arc 5's prerequisite as the arc `finding_your_way`, whose
   * last episode is arc 4's own final one — the same cross-arc link arc 4 proved
   * against arc 1's tail.
   */
  const ep29 = A1_ARC4[A1_ARC4.length - 1]
  assert.deepEqual(A1_ARC5[0].prerequisites, [ep29.id],
    `episode 30's prerequisite must be arc 4's last episode — ${ep29.id}`)
  ok()
}

/* ---- 2) three capabilities, ALL required, across FOUR episodes ---- */
{
  const expected = EP_SPECS.map(spec => spec.canDo)
  assert.deepEqual(A1_ARC5.map(ep => ep.canDoId), expected, 'each episode teaches its planned capability')
  assert.deepEqual(expected, ['use_bigger_numbers', 'ask_the_price', 'ask_the_price', 'buy_something'])
  /* the blueprint's own roles, including the level's first reinforcement episode */
  for (const [i, ep] of A1_ARC5.entries()) {
    assert.equal(ep.role, EP_SPECS[i].role, `${ep.id}: role must be the blueprint's`)
  }
  assert.deepEqual(A1_ARC5.map(ep => ep.role), ['primary', 'primary', 'reinforcement', 'primary'])
  /*
   * Reinforcement here means "the same can-do again", not "exempt from teaching
   * it" — `reinforces: true` is a different, stronger declaration (no productive
   * turn required at all) that episode 32 does NOT make, so it must still
   * produce `ask_price` itself. Group 12 below proves that.
   */
  for (const ep of A1_ARC5) assert.notEqual(ep.reinforces, true, `${ep.id}: no episode declares itself exempt`)
  /*
   * ALL THREE REQUIRED — unlike arc 4, which scoped one capability `should`.
   * Asserted explicitly so a later arc that DOES have a should-have cannot make
   * this arc's silence look like a rule.
   */
  const scopeOf = (id) => BLUEPRINT.canDos.find(cd => cd.id === id)?.scope
  for (const id of ['use_bigger_numbers', 'ask_the_price', 'buy_something']) {
    assert.equal(scopeOf(id), 'required', `${id}: the blueprint scopes it required`)
    assert.ok(A1_REQUIRED_CAN_DOS.includes(id), `${id} must be listed as required`)
  }
  ok()
}

/* ---- 3) ONE new intent, not three — the blueprint's own reuse notes, applied ---- */
{
  assert.equal(A1_CAN_DO_INTENT.use_bigger_numbers, 'use_quantity',
    'use_bigger_numbers reuses use_quantity with its taught range extended, per the blueprint\'s intentReuse note')
  assert.equal(A1_CAN_DO_INTENT.ask_the_price, 'ask_price', 'ask_the_price is the arc\'s one new intent')
  assert.equal(A1_CAN_DO_INTENT.buy_something, 'cafe_order_conversation',
    'buy_something\'s headline reuses the café shape, per the blueprint\'s own words for the capability')
  assert.deepEqual(a1IntentsOf('buy_something'), ['cafe_order_conversation', 'ask_price'],
    'buy_something is evidenced by two intents, café headline first, price second')
  assert.ok(BLUEPRINT.intentStrategy.newIntents.includes('ask_price'),
    'ask_price is not one of the blueprint\'s new A1 intents')
  /* and only one — use_quantity and cafe_order_conversation predate this arc */
  const trulyNew = [...new Set(A1_ARC5.map(ep => A1_CAN_DO_INTENT[ep.canDoId]))]
    .filter(intent => BLUEPRINT.intentStrategy.newIntents.includes(intent))
  assert.deepEqual(trulyNew, ['ask_price'], 'exactly one genuinely new intent headlines this arc')
  ok()
}

/* ---- 4) local evaluation: deterministic decides and stays conclusive; hybrid may not ---- */
{
  const evaluationOf = (id) => BLUEPRINT.canDos.find(cd => cd.id === id)?.evaluation
  assert.equal(evaluationOf('use_bigger_numbers'), 'deterministic_local')
  assert.equal(evaluationOf('ask_the_price'), 'deterministic_local')
  assert.equal(evaluationOf('buy_something'), 'hybrid')

  /* the canonical frames pass, unaided */
  const pass = (kind, text, ctx = {}) => evaluateFree(kind, text, { independent: true, ...ctx })
  assert.equal(pass('use_quantity', 'Forty-five.', { quantityForm: 'bare' }).completedObjective, true)
  assert.equal(pass('ask_price', 'How much is it?').completedObjective, true)
  assert.equal(pass('cafe_order_conversation', 'Can I have a ticket, please? That’s all, thanks.').completedObjective, true)

  /*
   * Nonsense is refused for every one of them. `use_quantity` in its `bare`
   * form accepts ANY recognised number word — that is the objective, not a
   * bug — so its own nonsense probe must not smuggle one in.
   */
  for (const kind of ['ask_price', 'cafe_order_conversation']) {
    const verdict = pass(kind, 'banana purple seventeen')
    assert.equal(verdict.completedObjective, false, `${kind} accepts nonsense`)
    assert.equal(verdict.retryRequired, true, `${kind}: nonsense must ask for another go`)
  }
  const quantityNonsense = pass('use_quantity', 'banana purple asdf', { quantityForm: 'bare' })
  assert.equal(quantityNonsense.completedObjective, false, 'use_quantity accepts nonsense with no number in it')
  assert.equal(quantityNonsense.retryRequired, true, 'use_quantity: nonsense must ask for another go')
  /* ask_price is deterministic_local and must be CONCLUSIVE even when it refuses */
  assert.equal(pass('ask_price', 'It costs a lot.').conclusive, true, 'ask_price must decide locally')
  assert.equal(shouldEscalate(pass('ask_price', 'It costs a lot.')), false, 'a deterministic refusal must never escalate')

  /* cafe_order_conversation is the hybrid one, on borrowed Pre-A1 code */
  const hybrid = pass('cafe_order_conversation', 'I am thinking about maybe getting something here today')
  assert.equal(hybrid.conclusive, false, 'an unrecognised long attempt must stay inconclusive')
  assert.equal(shouldEscalate(hybrid), true, 'an inconclusive purchase attempt must escalate')
  /* short nonsense is still refused conclusively, so a one-word slip never escalates */
  assert.equal(pass('cafe_order_conversation', 'qq').conclusive, true, 'short nonsense must still decide locally')
  ok()
}

/* ---- 5) numbers arrive as prices and times, never as counting in a void ---- */
{
  assert.match(ARC_SPEC.risk, /numbers arrive as prices/, 'the arc must still carry its risk note')
  /* the level still teaches one to ten; recognising further is not teaching it */
  const { TAUGHT_NUMBERS } = await import('../src/learning/engine/responseEvaluation.js')
  assert.deepEqual(TAUGHT_NUMBERS, ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
    'the taught range is still one to ten; the arc extends recognition, not the taught set')
  /* a number above ten is recognised, unaided, with no suggestion on screen */
  assert.equal(evaluateFree('use_quantity', '45', { independent: true, quantityForm: 'bare' }).completedObjective, true)
  assert.equal(evaluateFree('use_quantity', 'twenty-one', { independent: true, quantityForm: 'bare' }).completedObjective, true)
  ok()
}

/* ---- 6) vocabulary: the blueprint's budget is a CEILING, per arc 1's own precedent ---- */
{
  const PRODUCTIVE = ['numbers_11_100', 'how_much_pattern', 'ticket', 'price_pattern', 'this_one', 'that_one', 'dollars']
  const RECEPTIVE = ['banana']
  /*
   * Arc 1's own check treats the budget as `<=`, not `===` — "budgeted, not
   * listed" is `a1-map.md`'s own phrase for it. This arc is the first one that
   * actually needs the ceiling reading rather than matching it exactly: seven
   * productive items and one receptive against a budget of ten and eight,
   * because `numbers_11_100` stays a single Garden entry by design (the arc's
   * own risk note: "not ninety").
   */
  assert.ok(PRODUCTIVE.length <= ARC_SPEC.vocabularyBudget.newProductive,
    `the arc introduces ${PRODUCTIVE.length} productive items, budget ${ARC_SPEC.vocabularyBudget.newProductive}`)
  assert.ok(RECEPTIVE.length <= ARC_SPEC.vocabularyBudget.newReceptive,
    `the arc introduces ${RECEPTIVE.length} receptive items, budget ${ARC_SPEC.vocabularyBudget.newReceptive}`)

  /* every one of them is a real catalogue entry, translated everywhere */
  for (const id of [...PRODUCTIVE, ...RECEPTIVE]) {
    const entry = SEED_VOCAB_BY_ID[id]
    assert.ok(entry, `${id} is not in the vocabulary catalogue`)
    for (const lang of ['en', 'es', 'pt', 'fr', 'it', 'de', 'ja', 'ar']) {
      assert.ok(entry.meaning?.[lang], `${id}: no ${lang} meaning`)
    }
  }
  /* the productive ones are what the arc GRANTS, once each */
  const granted = A1_ARC5.flatMap(ep => ep.gardenItems || [])
  assert.deepEqual([...granted].sort(), [...PRODUCTIVE].sort(), 'the arc grants exactly its productive share')
  assert.equal(new Set(granted).size, granted.length, 'no item is granted twice')
  /* the receptive one is declared receptive, and granted by nobody */
  for (const id of RECEPTIVE) {
    assert.ok(A1_RECEPTIVE_ITEMS.includes(id), `${id} must be declared receptive`)
    assert.equal(granted.includes(id), false, `${id} is receptive and must not be granted`)
  }
  /* and the whole lot belongs to A1's share of the catalogue */
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
  assert.equal(episodesOfLevel(PRE_A1).length, ARC.length, 'Pre-A1 must not gain or lose an episode')
  ok()
}

/* ---- 8) the patterns the blueprint names ---- */
{
  for (const id of ARC_SPEC.newPatterns) {
    const pattern = BLUEPRINT.patterns.find(p => p.id === id)
    assert.ok(pattern, `${id} is not a blueprint pattern`)
    assert.equal(pattern.firstArc, 'paying_and_choosing', `${id} belongs to another arc`)
    assert.ok(SEED_VOCAB_BY_ID[id], `${id} must exist as a catalogue entry so the Garden can hold it`)
  }
  assert.deepEqual(ARC_SPEC.newPatterns, ['numbers_11_100', 'how_much_pattern', 'price_pattern'])
  /* the arc introduces no others */
  const introducedPatterns = A1_ARC5.flatMap(ep => ep.gardenItems || [])
    .filter(id => SEED_VOCAB_BY_ID[id]?.kind === 'pattern')
  assert.deepEqual(introducedPatterns.sort(), [...ARC_SPEC.newPatterns].sort(),
    'the arc grants exactly the patterns the blueprint gives it')
  ok()
}

/* ---- 9) semantic types: NO new type, and the slots the new intent accepts ---- */
{
  for (const type of ARC_SPEC.semanticNeeds) {
    assert.ok(SEMANTIC_TYPES.includes(type), `${type} is needed by arc 5 and not registered`)
  }
  assert.deepEqual(ARC_SPEC.semanticNeeds, ['generic_object', 'food', 'time_point'])
  /* all three predate this arc — asserted so a real new type cannot slip in unnoticed */
  const preExisting = ['generic_object', 'food', 'time_point']
  assert.deepEqual([...ARC_SPEC.semanticNeeds].sort(), preExisting.sort(), 'arc 5 needs no semantic type of its own')
  assert.deepEqual(INTENT_SLOTS.ask_price, ['generic_object', 'food', 'consumable'])
  /* a place is not a priced thing: "How much is the toilet?" is a different arc */
  assert.equal(isContextCompatible('ask_price', { semanticType: 'place', value: 'the station' }), false,
    'a place must not fill a price slot')
  ok()
}

/* ---- 10) the arc captures NO fact ---- */
{
  assert.deepEqual(ARC_SPEC.factsCaptured, [], 'the blueprint gives arc 5 no facts')
  const source = readFileSync(new URL('../src/learning/episodes/a1Arc5.js', import.meta.url), 'utf8')
  for (const forbidden of ['captureFact', 'factId', 'storeFact', 'learnerFact']) {
    assert.equal(source.includes(forbidden), false, `arc 5 must capture nothing, and mentions ${forbidden}`)
  }
  ok()
}

/* ---- 11) the story exists, is hosted by its episode, and is never a loose block ---- */
{
  assert.equal(ARC_SPEC.miniStory.use, true, 'the blueprint asks arc 5 for a story')
  assert.equal(hasStory('cafe_order_conversation'), true, 'the purchase story must exist')
  const story = getStory('cafe_order_conversation')
  assert.equal(storyHome(story), 'episode', 'the story is hosted by episode 33')
  /* the blueprint declares no branch of its own, so the default pair applies */
  assert.deepEqual(storyBranches(story), STORY_BRANCHES, 'no branch is named, so the default accept/decline pair applies')
  /* the episode reaches it; the planner must not */
  const ep33 = getA1Arc5Episode('buying_it')
  assert.ok((ep33.steps || []).some(s => s.type === 'mini_story' && s.storyObjective === 'cafe_order_conversation'),
    'episode 33 must host the story as a step')
  assert.equal(formatSupportsObjective('mini_story', 'cafe_order_conversation'), false,
    'an episode-hosted story must never be offered as a loose session block')
  /* the two objectives WITHOUT a story must never be planned into one */
  for (const objective of ['use_quantity', 'ask_price']) {
    assert.equal(formatSupportsObjective('mini_story', objective), false,
      `${objective} has no story of its own here and must not be planned as one`)
  }
  ok()
}

/* ---- 12) every episode produces its own capability in an OPEN turn, INCLUDING episode 32 ---- */
{
  for (const [i, ep] of A1_ARC5.entries()) {
    const intent = A1_CAN_DO_INTENT[ep.canDoId]
    const openTurns = (ep.steps || []).filter(s => (s.type === 'free_reply' || s.type === 'recall') && s.evalKind === intent)
    assert.ok(openTurns.length >= 1, `${ep.id}: no open turn produces ${intent}`)
    /* at least one of them with NOTHING on screen */
    const unaided = openTurns.filter(s => !s.suggestionEn)
    assert.ok(unaided.length >= 1, `${ep.id}: every episode needs one turn with no model`)
    /* the blueprint's open-production count for this episode is met */
    const allOpen = (ep.steps || []).filter(s => s.type === 'free_reply').length
      + (ep.steps || []).filter(s => s.type === 'mini_story').length
    assert.ok(allOpen >= EP_SPECS[i].openProductions,
      `${ep.id}: the blueprint asks for ${EP_SPECS[i].openProductions} open productions, found ${allOpen}`)
  }
  /*
   * The arc's evidence target: "two unaided price questions, one unaided number
   * above ten, one whole purchase held unaided". Episode 30 carries the numbers,
   * episode 31 carries the price question, and episode 33's story plus recall
   * carry the whole purchase.
   */
  assert.match(ARC_SPEC.evidenceTarget, /two unaided price questions/)
  const ep30Unaided = (getA1Arc5Episode('more_than_ten').steps || [])
    .filter(s => (s.type === 'free_reply' || s.type === 'recall') && s.evalKind === 'use_quantity' && !s.suggestionEn)
  assert.ok(ep30Unaided.length >= 2, `more_than_ten: the blueprint wants two unaided numbers, found ${ep30Unaided.length}`)
  const ep31Unaided = (getA1Arc5Episode('how_much_is_it').steps || [])
    .filter(s => (s.type === 'free_reply' || s.type === 'recall') && s.evalKind === 'ask_price' && !s.suggestionEn)
  assert.ok(ep31Unaided.length >= 2, `how_much_is_it: the blueprint wants two unaided price questions, found ${ep31Unaided.length}`)
  ok()
}

/* ---- 13) EVERY MODELLED ANSWER PASSES ITS OWN EVALUATOR ---- */
{
  /*
   * The rule arc 4's check learned the hard way, applied here before any of this
   * arc reaches a browser: every suggestion put on screen — in a step or inside
   * the story — must be accepted by the very evaluator that will judge the
   * learner's copy of it.
   */
  const rejected = []
  const audit = (where, evalKind, suggestion, ctx) => {
    if (!evalKind || !suggestion) return
    const verdict = evaluateFree(evalKind, suggestion, { independent: false, ...ctx })
    if (!verdict.completedObjective) rejected.push(`${where}: ${evalKind} rejects its own model "${suggestion}" (${verdict.errorType})`)
  }
  for (const ep of A1_ARC5) {
    for (const step of ep.steps || []) {
      audit(ep.id, step.evalKind, step.suggestionEn,
        { placeName: step.placeName, quantityForm: step.quantityForm, repairKind: step.repairKind })
    }
  }
  for (const turn of storyTurns(getStory('cafe_order_conversation'))) {
    audit('story', turn.evalKind, turn.suggestionEn, {})
  }
  assert.deepEqual(rejected, [], `a modelled answer would be marked wrong: ${rejected.join(' · ')}`)
  ok()
}

/* ---- 14) reuse is exercised by a step, not merely declared ---- */
{
  for (const [i, ep] of A1_ARC5.entries()) {
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
  /*
   * The arc's Pre-A1 reuse, per the blueprint's own `preA1Reuse` list, each
   * exercised somewhere in the arc. `respond_anything_else` is episode 33's own
   * `integratedReuse` entry and is the one this check's first draft found
   * undeclared by any step — fixed by giving the shopkeeper's "anything else?"
   * a real produced answer rather than leaving it a comprehension-only phrase.
   */
  const allKinds = new Set(A1_ARC5.flatMap(ep => (ep.steps || []).map(s => s.evalKind)).filter(Boolean))
  const storyKinds = new Set(storyTurns(getStory('cafe_order_conversation')).map(t => t.evalKind).filter(Boolean))
  const exercised = new Set([...allKinds, ...storyKinds])
  for (const canDoId of ARC_SPEC.preA1Reuse) {
    const intent = { polite_request: 'polite_request', cafe_order: 'cafe_order_conversation',
      use_small_numbers: 'use_quantity', respond_anything_else: 'respond_anything_else',
      close_an_encounter: 'close_encounter' }[canDoId]
    assert.ok(intent, `${canDoId}: this check does not know which intent evidences it`)
    assert.ok(exercised.has(intent), `${canDoId} (${intent}) is reused per the blueprint and must be exercised`)
  }
  /* the arc's own new price question is reused inside episode 32 and 33 too */
  assert.ok(exercised.has('ask_price'), 'ask_price is the arc\'s own headline and must recur')
  ok()
}

/* ---- 15) XP: the runtime contract, once each, never inflated ---- */
{
  assert.deepEqual(A1_ARC5.map(ep => ep.xp), [75, 75, 75, 85],
    'arc 5 keeps the level\'s XP shape: three standard episodes and a longer close')
  for (const ep of A1_ARC5) {
    assert.ok(ep.xp > 0 && ep.xp <= 100, `${ep.id}: XP outside the level's range`)
    assert.ok(ep.estimatedMinutes >= 8 && ep.estimatedMinutes <= 12, `${ep.id}: unrealistic duration`)
  }
  /*
   * The same per-episode worth arc 4 uses, so a four-episode arc is not worth
   * more per episode than a three-episode one — it simply has one more of them.
   */
  for (const ep of A1_ARC5) {
    assert.ok(A1_ARC4.some(e => e.xp === ep.xp), `${ep.id}: XP ${ep.xp} is not one of arc 4's established values`)
  }
  ok()
}

/* ---- 16) the resolver: arc 5 loads, arc 6 does not ---- */
{
  assert.equal(hasContentLoader(A1, 'paying_and_choosing'), true, 'arc 5 must be loadable')
  for (const ep of A1_ARC5) {
    const tooling = episodeRequest({ episodeId: ep.id, forLearner: false })
    assert.equal(tooling.ok, true, `${ep.id} must resolve for tooling`)
    assert.equal(tooling.arcId, 'paying_and_choosing', `${ep.id}: wrong arc resolved`)
    /* and a learner is refused BEFORE any content is fetched */
    const learner = episodeRequest({ episodeId: ep.id })
    assert.equal(learner.ok, false, `${ep.id} must be closed to learners`)
    assert.equal(learner.reason, REFUSED.LEVEL_UNAVAILABLE, `${ep.id}: wrong refusal`)
  }
  /* the content really is this arc's, loaded through the real door */
  const loaded = await loadEpisodeContent({ episodeId: 'more_than_ten', forLearner: false })
  assert.equal(loaded.id, 'more_than_ten')
  assert.equal(loaded.canDoId, 'use_bigger_numbers')
  assert.ok((loaded.steps || []).length >= 8, 'a real episode, not a stub')
  ok()
}

/* ---- 17) beyond arc 5 remains impossible ---- */
{
  const unbuilt = BLUEPRINT.arcs.filter(arc => !A1_RUNTIME_ARCS.includes(arc.id))
  assert.ok(!unbuilt.some(a => a.id === 'paying_and_choosing'), 'arc 5 must not read as unbuilt from its own check')
  assert.ok(unbuilt.some(a => a.id === 'what_you_can_do') && unbuilt.some(a => a.id === 'making_arrangements'),
    'the two arcs after arc 5 remain unbuilt')
  for (const arc of unbuilt) {
    assert.equal(hasContentLoader(A1, arc.id), false, `${arc.id} must have no loader`)
    for (const canDo of arc.newCanDos || []) {
      assert.ok(!A1_CAN_DO_INTENT[canDo], `${canDo} is registered before its arc exists`)
    }
  }
  /* an id from arc 6, and ids that never existed, all fail closed */
  for (const ghost of ['what_can_you_do', 'arrange_a_meeting', 'a1_ep34', 'what_you_can_do_first']) {
    const result = episodeRequest({ levelId: A1, episodeId: ghost, forLearner: false })
    assert.equal(result.ok, false, `${ghost} must not resolve`)
    assert.equal(result.reason, REFUSED.UNKNOWN_EPISODE, `${ghost}: wrong reason`)
  }
  await assert.rejects(() => loadEpisodeContent({ levelId: A1, episodeId: 'a1_ep34', forLearner: false }),
    /unknown_episode/, 'an unbuilt arc\'s episode must never load')
  ok()
}

/* ---- 18) A1 is still partial, and still closed ---- */
{
  assert.equal(hasRuntimeContent(A1), true, 'A1 has content')
  assert.equal(isLevelAvailable(A1), false, 'A1 must stay closed to learners')
  assert.equal(isLevelComplete(A1), false, 'A1 is not yet seven arcs, so it is not complete')
  assert.equal(getLevel(A1).contentStatus, 'partial', 'contentStatus must stay partial')
  /*
   * "A1's runtime holds at least its first five built arcs, in the blueprint's
   * order" — the exact same claim shape arc 4's own check makes, one arc later,
   * for the same reason: the exact total is `check:a1-blueprint`'s fact to state.
   */
  assert.ok(episodesOfLevel(A1).length >= A1_ARC1.length + A1_ARC2.length + A1_ARC3.length + A1_ARC4.length + A1_ARC5.length,
    'A1 runtime holds at least its first five built arcs')
  assert.deepEqual(A1_RUNTIME_ARCS.slice(0, 5),
    ['work_and_study', 'daily_rhythm', 'people_around_you', 'finding_your_way', 'paying_and_choosing'],
    'the first five runtime arcs are exactly arcs 1–5, in the blueprint\'s order')
  ok()
}

/* ---- 19) personalisation may change what a turn is about, never what it asks ---- */
{
  const source = readFileSync(new URL('../src/learning/episodes/a1Arc5.js', import.meta.url), 'utf8')
  assert.equal(/personalizationMode/.test(source), false,
    'arc 5 declares no personalisation, and must not gain one silently')
  /* every slot type the arc's new intent accepts is one the engine knows */
  for (const slot of INTENT_SLOTS.ask_price) {
    assert.ok(SEMANTIC_TYPES.includes(slot), `ask_price: ${slot} is not a registered type`)
  }
  ok()
}

console.log(`\ncheck-a1-arc5 — OK  (${groups} arc groups verified)`)
