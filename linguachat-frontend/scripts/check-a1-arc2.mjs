/*
 * check-a1-arc2 — the second real A1 arc, against the design it came from.
 *
 * The same shape as `check:a1-arc1`, pointed at `daily_rhythm`, and deliberately a
 * SEPARATE file: an arc check that grows into a level check is how arc 1's
 * assertions started claiming arc 2 was a regression. This file owns arc 2. What
 * "how many arcs exist at all" means belongs to `check:a1-blueprint`.
 *
 * Everything expected is read out of docs/curriculum/a1-blueprint.json — episode
 * ids come from the runtime, but their count, order, capabilities, roles, scope,
 * prerequisites, budgets, facts and reuse are the blueprint's. If the design says
 * three episodes and seven arcs, three must exist and five must still be missing.
 *
 * It also plays the arc — alone, and after arc 1 — because a curriculum that only
 * type-checks has not been shown to teach anything, and because "A1 is cumulative"
 * is a claim that has to survive being executed.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { ARC } from '../src/learning/episodes/index.js'
import { A1_ARC1 } from '../src/learning/episodes/a1Arc1.js'
import { A1_ARC2, A1_ARC2_ID, getA1Arc2Episode } from '../src/learning/episodes/a1Arc2.js'
import {
  A1, PRE_A1, getLevel, episodesOfLevel, isLevelComplete, isLevelAvailable,
  contentStatusOf, hasRuntimeContent,
} from '../src/learning/curriculum/levels.js'
import {
  A1_CAN_DO_INTENT, A1_REQUIRED_CAN_DOS, A1_RECEPTIVE_ITEMS, A1_RUNTIME_ARCS,
  A1_INTRODUCED_ITEMS, a1ProductiveItemsOf,
} from '../src/learning/curriculum/a1Map.js'
import { episodeRequest, loadEpisodeContent, hasContentLoader, REFUSED } from '../src/learning/curriculum/episodeContent.js'
import {
  requiredLevelItems, intentsForEpisode, personalisesOf, CAN_DO_INTENT as PRE_A1_CAN_DO_INTENT,
} from '../src/learning/curriculum/preA1Map.js'
import { derivePreA1Readiness } from '../src/learning/curriculum/readiness.js'
import { evaluateFree, REPAIR_KINDS } from '../src/learning/engine/responseEvaluation.js'
import {
  INTENT_SLOTS, slotsFor, SEMANTIC_TYPES, classifyValue, isContextCompatible, taughtHourIn,
} from '../src/learning/engine/semanticContext.js'
import { getStory, storyTurns, storyBranches, storyHome } from '../src/learning/engine/miniStory.js'
import { SEED_VOCAB_BY_ID } from '../src/data/vocabulary.js'
import {
  createLearnerModel, MODEL_VERSION, MILESTONE_LEVELS, FACT_TYPES, sanitizeLearnerFacts,
} from '../src/learning/engine/learnerModel.js'
import { captureStatedUsualTime, factsOfType } from '../src/learning/engine/learnerFacts.js'
import { hasGraduatedPreA1 } from '../src/learning/curriculum/graduation.js'
import { playEpisode, STRONG, ASSISTED } from './lib/journey.mjs'

const BLUEPRINT = JSON.parse(readFileSync(new URL('../../docs/curriculum/a1-blueprint.json', import.meta.url), 'utf8'))
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const LOCALES = ['es', 'pt', 'fr', 'it', 'de', 'ja', 'ar']
const baseLocale = read('src/i18n/translations.js')
const localeSources = Object.fromEntries(LOCALES.map(code => [code, read(`src/i18n/locales/${code}.js`)]))
const localeKeyPresent = (key) => baseLocale.includes(`${key}:`) && LOCALES.every(c => localeSources[c].includes(`${key}:`))

let groups = 0
const ok = () => { groups += 1 }

const arc2 = BLUEPRINT.arcs.find(a => a.order === 2)
/* arc 2's own required capabilities, derived — never the level's growing list */
const ARC2_REQUIRED = [...new Set(A1_ARC2.map(ep => ep.canDoId))]
  .filter(id => A1_REQUIRED_CAN_DOS.includes(id))
const granted = A1_ARC2.flatMap(ep => ep.gardenItems || [])
const AT = new Date('2026-08-12T09:00:00Z').getTime()

/* ---- 1) the blueprint's arc 2, and the runtime's, are the same arc ---- */
{
  assert.ok(arc2, 'the blueprint must describe an arc 2')
  assert.equal(arc2.id, A1_ARC2_ID, "the runtime arc id must be the blueprint's")
  assert.ok(A1_RUNTIME_ARCS.includes(arc2.id), 'arc 2 must be declared as implemented')
  assert.equal(A1_RUNTIME_ARCS[1], arc2.id, 'and it must come after arc 1, in the blueprint order')

  const planned = BLUEPRINT.episodes
    .filter(ep => ep.arc === arc2.id)
    .sort((a, b) => a.plannedNumber - b.plannedNumber)
  assert.deepEqual(planned.map(ep => ep.plannedNumber), arc2.episodes,
    'the blueprint must agree with itself about which episodes are in the arc')
  assert.equal(A1_ARC2.length, planned.length,
    `arc 2 plans ${planned.length} episodes and the runtime has ${A1_ARC2.length}`)

  /*
   * Every runtime episode traces to exactly one planned episode, in order, and the
   * curriculum prerequisites are the plan's numbers translated to ids — never
   * assumed from the numbering. Episode 21 requires 20, which is arc 1's last, so
   * this also proves the arcs are chained rather than parallel.
   */
  planned.forEach((plan, index) => {
    const episode = A1_ARC2[index]
    assert.equal(episode.canDoId, plan.canDo,
      `runtime episode ${index + 1} teaches ${episode.canDoId}, the plan says ${plan.canDo}`)
    assert.equal(episode.role, plan.role, `${episode.id}: role must match the plan`)
    assert.equal(episode.arc, arc2.id, `${episode.id}: arc`)
    assert.equal(episode.level, 'A1', `${episode.id}: level`)
    const allRuntime = [...A1_ARC1, ...A1_ARC2]
    const expected = (plan.prerequisites || []).map((number) => {
      const other = BLUEPRINT.episodes.find(e => e.plannedNumber === number)
      const arcEpisodes = other.arc === arc2.id ? A1_ARC2 : A1_ARC1
      const order = BLUEPRINT.episodes
        .filter(e => e.arc === other.arc)
        .sort((a, b) => a.plannedNumber - b.plannedNumber)
        .findIndex(e => e.plannedNumber === number)
      return arcEpisodes[order].id
    })
    assert.deepEqual(episode.prerequisites, expected,
      `${episode.id}: prerequisites must be the plan's, not the numbering's`)
    for (const prerequisite of episode.prerequisites) {
      assert.ok(allRuntime.some(e => e.id === prerequisite),
        `${episode.id} requires ${prerequisite}, which is not a runtime episode`)
    }
  })
  console.log(`\n  arc 2 "${arc2.id}": ${A1_ARC2.length} episodes, traced to the blueprint`)
  ok()
}

/* ---- 2) and nothing from an unbuilt arc exists ---- */
{
  const plannedOnly = BLUEPRINT.arcs.map(a => a.id).filter(id => !A1_RUNTIME_ARCS.includes(id))
  assert.equal(plannedOnly.length, 5, 'five arcs remain planned after this one')
  const runtimeArcs = new Set(episodesOfLevel(A1).map(ep => ep.arc))
  for (const arcId of plannedOnly) {
    assert.ok(!runtimeArcs.has(arcId), `${arcId} has runtime content and was not authorised`)
    assert.equal(hasContentLoader(A1, arcId), false, `${arcId} must have no content loader`)
  }
  /* the design totals still come from the design, never from what is built */
  assert.equal(BLUEPRINT.arcs.length, 7)
  assert.equal(BLUEPRINT.episodes.length, 21, 'twenty-one planned stays twenty-one')
  assert.equal(episodesOfLevel(A1).length, A1_ARC1.length + A1_ARC2.length,
    'the level holds exactly the two implemented arcs')
  ok()
}

/* ---- 3) still partially built, still closed, and loaded per arc ---- */
{
  assert.equal(contentStatusOf(A1), 'partial', 'six of twenty-one is not a finished level')
  assert.equal(hasRuntimeContent(A1), true)
  assert.equal(isLevelComplete(A1), false)
  assert.equal(isLevelAvailable(A1), false, 'A1 must not be open to learners')

  /* every learner-facing request for arc 2 is refused, whatever they ask for */
  for (const episode of A1_ARC2) {
    const asLearner = episodeRequest({ episodeId: episode.id })
    assert.equal(asLearner.ok, false, `${episode.id} must be closed to learners`)
    assert.equal(asLearner.reason, REFUSED.LEVEL_UNAVAILABLE)
  }
  await assert.rejects(() => loadEpisodeContent({ episodeId: A1_ARC2[0].id }),
    (error) => error.reason === REFUSED.LEVEL_UNAVAILABLE,
    'and loading it as a learner must be refused before any import')

  /* and every one of them resolves for tooling, from arc 2's own loader */
  assert.equal(hasContentLoader(A1, arc2.id), true, 'arc 2 must have its own loader')
  assert.equal(hasContentLoader(A1), false, 'and the level must still have no catch-all')
  for (const episode of A1_ARC2) {
    const loaded = await loadEpisodeContent({ episodeId: episode.id, forLearner: false })
    assert.equal(loaded.id, episode.id)
    assert.equal(loaded.arc, arc2.id)
    assert.ok(loaded.steps.length > 0, `${episode.id} must arrive with its content`)
  }
  /* the one door, and it is still used only by tooling */
  const productFiles = [
    'src/context/AppContext.jsx', 'src/components/layout/ConversationRoom.jsx',
    'src/components/episode/EpisodeShell.jsx', 'src/components/session/SessionRunner.jsx',
    'src/components/today/TodayView.jsx', 'src/components/episode/CompletedEpisodes.jsx',
    'src/learning/engine/session.js', 'src/learning/curriculum/readiness.js',
  ]
  for (const path of productFiles) {
    assert.ok(!/forLearner:\s*false|forLearner=\{false\}/.test(read(path)),
      `${path} bypasses the availability gate — only tooling may`)
  }
  ok()
}

/* ---- 4) an episode of an unbuilt arc fails closed ---- */
{
  const futureCanDos = BLUEPRINT.episodes
    .filter(ep => !A1_RUNTIME_ARCS.includes(ep.arc))
    .map(ep => ep.canDo)
  assert.ok(futureCanDos.length >= 8, 'there should be plenty of unbuilt design left')
  for (const canDo of new Set(futureCanDos)) {
    assert.ok(!A1_CAN_DO_INTENT[canDo], `${canDo} is registered before its arc exists`)
  }
  for (const ghost of ['introduce_someone_else', 'episode24', 'a1_arc3_first', 'my_week']) {
    const result = episodeRequest({ levelId: A1, episodeId: ghost, forLearner: false })
    assert.equal(result.ok, false, `${ghost} must not resolve`)
    assert.equal(result.reason, REFUSED.UNKNOWN_EPISODE, `${ghost}: wrong reason`)
  }
  assert.equal(episodeRequest({ levelId: 'a2', episodeId: 'anything', forLearner: false }).reason,
    REFUSED.UNKNOWN_LEVEL, 'an unknown level fails closed even for tooling')
  ok()
}

/* ---- 5) the capabilities are the blueprint's, with its scope ---- */
{
  const planned = arc2.newCanDos
  assert.deepEqual([...new Set(A1_ARC2.map(ep => ep.canDoId))].sort(), [...planned].sort(),
    'the arc must teach exactly the capabilities it declares')
  for (const canDoId of planned) {
    const spec = BLUEPRINT.canDos.find(c => c.id === canDoId)
    assert.ok(spec, `${canDoId} is taught and not designed`)
    /* scope is the blueprint's word, never widened or narrowed by the runtime */
    if (spec.scope === 'required') {
      assert.ok(A1_REQUIRED_CAN_DOS.includes(canDoId), `${canDoId} is required and not registered as such`)
    } else {
      assert.ok(!A1_REQUIRED_CAN_DOS.includes(canDoId), `${canDoId} is ${spec.scope} and was promoted to required`)
    }
    /* the capability's own prerequisites must be capabilities that exist by now */
    const known = { ...PRE_A1_CAN_DO_INTENT, ...A1_CAN_DO_INTENT }
    for (const prerequisite of spec.prerequisites || []) {
      assert.ok(known[prerequisite],
        `${canDoId} requires ${prerequisite}, which no implemented level teaches`)
    }
    /* and it must be evaluated by the episode that claims it */
    const episode = A1_ARC2.find(ep => ep.canDoId === canDoId)
    assert.ok(intentsForEpisode(episode.id).includes(A1_CAN_DO_INTENT[canDoId]),
      `${canDoId} is taught by an episode that never evaluates its intent`)
  }
  /*
   * Pre-A1's capability map is untouched by any of it — sixteen capabilities, and A1
   * registers its own in `a1Map`. A shared map would let one level's capability
   * satisfy another's coverage.
   */
  assert.equal(Object.keys(PRE_A1_CAN_DO_INTENT).length, 16, "Pre-A1's intent map must not grow")
  for (const canDoId of arc2.newCanDos) {
    assert.ok(!PRE_A1_CAN_DO_INTENT[canDoId], `${canDoId} was registered in Pre-A1's map`)
  }
  ok()
}

/* ---- 6) one new intent, one new subtype, and both really work ---- */
{
  /*
   * THE EXPLOSION GUARD, applied. The blueprint's rule is "one intent per
   * communicative function; variants travel as a subtype on the step payload", and
   * its own guard is three new intents per arc. Arc 2 adds ONE — `state_routine` —
   * and reuses `repair_request` with the `ask_meaning` kind the can-do prescribes.
   */
  const intents = new Set(A1_ARC2.flatMap(ep => intentsForEpisode(ep.id)))
  const before = new Set([...Object.keys(PRE_A1_CAN_DO_INTENT), 'state_life_fact', 'ask_life_fact',
    'express_like', 'use_quantity', 'repair_request', 'ask_name', 'ask_origin', 'close_encounter'])
  const introduced = [...intents].filter(i => !before.has(i))
  assert.deepEqual(introduced, ['state_routine'], `arc 2 introduces ${introduced.join(', ')}`)
  assert.ok(introduced.length <= 3, "the blueprint's explosion guard is three new intents per arc")

  /* the can-do that reuses repair says so, and the subtype exists */
  const meaningSpec = BLUEPRINT.canDos.find(c => c.id === 'ask_what_something_means')
  assert.match(meaningSpec.intentReuse, /repair_request/,
    'the blueprint prescribes reuse rather than a new intent')
  assert.ok(REPAIR_KINDS.includes('ask_meaning'), 'the new repair strategy must be registered')

  /* deterministic, exactly as the blueprint's evaluation strategy says */
  for (const canDoId of arc2.newCanDos) {
    assert.equal(BLUEPRINT.canDos.find(c => c.id === canDoId).evaluation, 'deterministic_local',
      `${canDoId} is designed to be judged locally`)
  }
  assert.ok(BLUEPRINT.evaluationStrategy.deterministic_local.includes('state_routine'))

  /* canonical successes */
  const cases = [
    ['I usually get up at seven.', { timeForm: 'clock' }, true],
    ['I get up at 7.', { timeForm: 'clock' }, true],
    ['I usually work in the morning.', { timeForm: 'part_of_day' }, true],
    ['I sometimes study.', {}, true],
    /* near misses: the frame is there and the turn asked for more */
    ['I usually get up.', { timeForm: 'clock' }, false],
    ['I work.', { timeForm: 'part_of_day' }, false],
    /* and reaches that are not the frame */
    ['get up', {}, false],
    ['at seven', {}, false],
    ['She gets up at seven.', {}, false],
    ['hmm', {}, false],
    ['', {}, false],
  ]
  for (const [text, ctx, expected] of cases) {
    const verdict = evaluateFree('state_routine', text, ctx)
    assert.equal(verdict.completedObjective, expected,
      `state_routine ${JSON.stringify(text)} (${ctx.timeForm || 'no subtype'}) → ${verdict.errorType}`)
    if (!expected) {
      assert.ok(verdict.retryRequired, `${JSON.stringify(text)} must offer another try`)
      /*
       * An empty box is prompted rather than explained — there is no attempt to
       * explain — which is the convention every Pre-A1 evaluator follows. Anything
       * the learner actually wrote must be told what was missing.
       */
      assert.ok(verdict.explanation || verdict.priorityCorrection || verdict.retryPrompt,
        `${JSON.stringify(text)} must be explained, not just refused`)
      if (text.trim()) {
        assert.ok(verdict.explanation || verdict.priorityCorrection,
          `${JSON.stringify(text)} is a real attempt and needs a real correction`)
      }
    }
  }
  /* the meaning question, and the strategies staying distinguishable */
  assert.equal(evaluateFree('repair_request', 'What does “late” mean?',
    { repairKind: 'ask_meaning', meaningWord: 'late' }).completedObjective, true)
  assert.equal(evaluateFree('repair_request', 'Can you repeat, please?',
    { repairKind: 'ask_meaning', meaningWord: 'late' }).errorType, 'other_repair',
  'a different repair is understood and is not this turn')
  assert.equal(evaluateFree('repair_request', 'Mean?',
    { repairKind: 'ask_meaning', meaningWord: 'late' }).errorType, 'incomplete_meaning_question')

  /* the session can present every one of them, with no generic fallback */
  const runner = read('src/components/session/SessionRunner.jsx')
  const table = (name) => {
    const start = runner.indexOf(`const ${name} = {`)
    return new Set([...runner.slice(start, runner.indexOf('\n}', start)).matchAll(/^\s{2}([a-z_]+):/gm)].map(m => m[1]))
  }
  const prompts = table('PROMPT')
  const answers = table('MODEL_ANSWER')
  for (const intent of intents) {
    assert.ok(prompts.has(intent), `${intent} has no prompt in the session runner`)
    assert.ok(answers.has(intent), `${intent} has no model answer in the session runner`)
  }
  assert.ok(!/state_routine:.*Hi there/.test(runner), 'a routine turn must not open with a greeting')
  ok()
}

/* ---- 7) semantics: the slot takes times, and refuses everything else ---- */
{
  /*
   * ONLY the type this arc needs. The blueprint proposes four A1 types; `day`,
   * `relation` and `transport_mode` belong to arcs that do not exist, and a type
   * with no consumer makes coverage look real.
   */
  assert.ok(SEMANTIC_TYPES.includes('time_point'), 'the arc needs a time type')
  for (const premature of ['day', 'relation', 'transport_mode']) {
    assert.ok(!SEMANTIC_TYPES.includes(premature), `${premature} belongs to an arc that does not exist`)
  }
  const proposed = BLUEPRINT.semanticTypes.proposed.find(t => t.id === 'time_point')
  assert.ok(proposed, 'time_point must be the blueprint\'s type, not an invention')
  assert.deepEqual(arc2.semanticNeeds.filter(t => !SEMANTIC_TYPES.includes(t)), [],
    'every type the arc declares it needs must exist')

  assert.deepEqual(slotsFor('state_routine'), ['time_point'],
    'a routine statement takes a time and nothing else')
  assert.deepEqual(INTENT_SLOTS.repair_request, [], 'repair still takes no personalised value')

  /* the new values are typed, and the nonsense the type exists to stop is stopped */
  for (const value of ['seven', 'in the morning', 'in the evening', 'ten']) {
    assert.equal(classifyValue(value)?.semanticType, 'time_point', `${value} must be a time`)
    assert.ok(isContextCompatible('state_routine', classifyValue(value)), `${value} must fit the slot`)
  }
  for (const nonsense of ['water', 'coffee', 'music', 'tired', 'home', 'the office']) {
    const typed = classifyValue(nonsense)
    assert.ok(!typed || !isContextCompatible('state_routine', typed),
      `"I get up at ${nonsense}" must be impossible to build`)
  }
  /* and the blueprint's own incompatibilities hold */
  for (const type of proposed.incompatibleWith) {
    assert.ok(!slotsFor('state_routine').includes(type),
      `the time slot must refuse ${type}, which is what the type is for`)
  }
  /* an hour beyond the level's numbers is not a taught time */
  assert.equal(taughtHourIn('I get up at seven.'), 'seven')
  assert.equal(taughtHourIn('I get up at eleven.'), null, 'eleven arrives in arc 5')
  ok()
}

/* ---- 8) the Garden: real language, granted once, within the arc's budget ---- */
{
  assert.deepEqual(granted.filter((id, i) => granted.indexOf(id) !== i), [],
    'no item may be granted twice in the arc')
  for (const id of granted) {
    assert.ok(SEED_VOCAB_BY_ID[id], `${id} is granted and is not in the vocabulary catalogue`)
  }
  /* THIS ARC's budget, from the blueprint, measured on what this arc grants */
  const receptive = A1_ARC2.flatMap(ep => (ep.steps || [])
    .flatMap(step => [...(step.meaningItems || []), step.itemId].filter(Boolean)))
    .filter(id => A1_RECEPTIVE_ITEMS.includes(id))
  const productive = granted.filter(id => !A1_RECEPTIVE_ITEMS.includes(id))
  assert.equal(productive.length, arc2.vocabularyBudget.newProductive,
    `the arc grants ${productive.length} productive items, budget ${arc2.vocabularyBudget.newProductive}`)
  assert.ok(new Set(receptive).size <= arc2.vocabularyBudget.newReceptive,
    'the receptive budget must be respected too')
  /* the risk note's ceiling: two frequency adverbs, and no verb list */
  assert.ok(productive.filter(id => ['usually', 'sometimes', 'always', 'never', 'often'].includes(id)).length <= 2,
    "the blueprint's frequency set is two adverbs")
  /* everything the arc teaches is declared as A1's share */
  for (const id of productive) {
    assert.ok(A1_INTRODUCED_ITEMS.includes(id), `${id} is taught by arc 2 and not declared as A1's`)
  }
  /* receptive items are never counted as production */
  const produced = new Set(ARC2_REQUIRED.flatMap(id => a1ProductiveItemsOf(id)))
  for (const id of A1_RECEPTIVE_ITEMS) {
    assert.ok(!produced.has(id), `${id} is receptive and is being counted as produced`)
  }
  /* and Pre-A1's required core has not moved */
  assert.equal(requiredLevelItems().length, 24, "Pre-A1's required core must not change")
  ok()
}

/* ---- 9) every key the arc renders exists in all eight locales ---- */
{
  const keys = new Set()
  for (const ep of A1_ARC2) {
    for (const field of ['titleKey', 'goalKey', 'canDoNameKey', 'durationKey']) {
      if (ep[field]) keys.add(ep[field])
    }
    for (const step of ep.steps || []) {
      for (const field of ['instructionKey', 'titleKey', 'bodyKey', 'ctaKey', 'explainKey',
        'hintKey', 'placeholderKey', 'canDoNameKey']) {
        if (step[field]) keys.add(step[field])
      }
      for (const option of step.options || []) if (option.key) keys.add(option.key)
    }
  }
  /* the hosted story's own keys, and the evaluator's, read out of the source */
  const story = getStory('state_routine')
  for (const turn of storyTurns(story)) {
    for (const field of ['noteKey', 'promptKey', 'instructionKey']) if (turn[field]) keys.add(turn[field])
  }
  const evaluator = read('src/learning/engine/responseEvaluation.js')
  const arcSection = evaluator.slice(evaluator.indexOf('A1 ARC 2'), evaluator.indexOf('Do you work?'))
  for (const [, key] of arcSection.matchAll(/'(ep2[123][A-Za-z]+)'/g)) keys.add(key)

  assert.ok(keys.size >= 60, `the arc should render plenty of text, found ${keys.size} keys`)
  for (const key of keys) {
    assert.ok(localeKeyPresent(key), `${key} is missing from at least one locale`)
  }
  console.log(`  ${keys.size} keys present in all eight locales`)
  ok()
}

/* ---- 10) personalisation: derived, safe, and never load-bearing ---- */
{
  /*
   * ARC 2 DOES NOT CONSUME THE STORY PERSONALISATION CONTRACT, and that is a
   * finding rather than an omission: the blueprint declares no `personalizationMode`
   * anywhere, and episode 23's story carries two words the learner must ask about —
   * letting a topic change them would change what the learner has to DO, which the
   * contract refuses. So the story is neutral for everybody.
   */
  const storySource = read('src/learning/engine/miniStory.js')
  const arcStory = storySource.slice(storySource.indexOf('state_routine: {'), storySource.indexOf('introduction: {'))
  assert.ok(!/personalizationMode/.test(arcStory), 'arc 2 declares no story personalisation mode')
  assert.equal(storyHome(getStory('state_routine')), 'episode',
    "the arc's story is hosted by an episode, not offered as a loose block")

  /* what it DOES personalise is derived from its prose, exactly as Pre-A1's is */
  for (const ep of A1_ARC2) {
    for (const step of ep.steps || []) {
      for (const dead of ['personalizes', 'personalises']) {
        assert.ok(!(dead in step),
          `${ep.id}: personalisation is read from the prose, not declared in \`${dead}\``)
      }
    }
  }
  const personalised = new Set(A1_ARC2.flatMap(ep => personalisesOf(ep.id)))
  for (const slot of personalised) {
    const name = slot.replace(/^fact:/, '')
    assert.ok(BLUEPRINT.personalization.safeSlots.includes(name) || name === 'semantic' || name === 'noun',
      `${slot} is not one of the blueprint's safe slots`)
  }
  /*
   * AND EVERY PLACEHOLDER MUST ALWAYS RESOLVE. The engine leaves an unfilled
   * placeholder in place rather than printing "undefined", so `{something}` reaching
   * a learner is a visible bug. `{name}` cannot: the shell falls back to a neutral
   * name. `{noun}` cannot either: the semantic layer always has a neutral value.
   */
  const SAFE_PLACEHOLDERS = ['name', 'noun']
  const PROSE = ['promptEn', 'sceneEn', 'suggestionEn', 'target', 'response']
  for (const ep of A1_ARC2) {
    for (const step of ep.steps || []) {
      const text = [...PROSE.map(f => step[f]), ...(step.tokens || []),
        ...(step.options || []).map(o => o.textEn), step.before, step.after].filter(Boolean).join(' ')
      for (const [, placeholder] of text.matchAll(/\{(\w+)\}/g)) {
        assert.ok(SAFE_PLACEHOLDERS.includes(placeholder),
          `${ep.id}: {${placeholder}} has no guaranteed value, so it could reach the learner unfilled`)
      }
    }
  }
  ok()
}

/* ---- 11) the reuse matrix, exercised rather than declared ---- */
{
  /*
   * A1 MUST FEEL CUMULATIVE, and the blueprint says exactly which capabilities come
   * back in this column of its reuse matrix. A capability marked `R` here must be
   * EVALUATED by a step of this arc — a mention in a metadata list is how a "review
   * unit" gets built by accident.
   */
  const column = BLUEPRINT.reuseMatrix.arcOrder.indexOf(arc2.id)
  assert.ok(column >= 0, 'the reuse matrix must have a column for this arc')
  const returning = Object.entries(BLUEPRINT.reuseMatrix.rows)
    .filter(([, marks]) => marks[column] === 'R')
    .map(([canDoId]) => canDoId)
  assert.ok(returning.length >= 5, `the blueprint schedules ${returning.length} capabilities to return`)

  const evaluated = new Set(A1_ARC2.flatMap(ep => intentsForEpisode(ep.id)))
  const known = { ...PRE_A1_CAN_DO_INTENT, ...A1_CAN_DO_INTENT }
  const missed = returning.filter((canDoId) => {
    const intent = known[canDoId]
    /* a capability no implemented level teaches cannot be reused yet */
    if (!intent) return false
    return !evaluated.has(intent)
  })
  assert.deepEqual(missed, [],
    `the blueprint schedules these to return in this arc and no step evaluates them: ${missed.join(', ')}`)

  /* and the arc's own declared reuse is exercised too, in both directions */
  for (const ep of A1_ARC2) {
    for (const skill of ep.reuseSkills || []) {
      const intent = known[skill] || skill
      assert.ok(intentsForEpisode(ep.id).includes(intent),
        `${ep.id} declares reuse of ${skill} and no step evaluates it`)
    }
  }
  /* no episode is a review unit: every one of them teaches something of its own */
  for (const ep of A1_ARC2) {
    assert.ok(intentsForEpisode(ep.id).includes(A1_CAN_DO_INTENT[ep.canDoId]),
      `${ep.id} reuses and never teaches`)
  }
  console.log(`  ${returning.length} older capabilities return inside the arc`)
  ok()
}

/* ---- 12) the arc is playable, and teaches what it claims ---- */
{
  const model = createLearnerModel()
  let xp = 0
  A1_ARC2.forEach((ep, index) => {
    const result = playEpisode(model, ep.id, { profile: STRONG, atMs: AT + index * 1000 })
    xp += result.xp
    assert.equal(model.episodes[ep.id].status, 'completed', `${ep.id} must be completable`)
  })
  assert.equal(xp, A1_ARC2.reduce((sum, ep) => sum + ep.xp, 0), 'the arc awards exactly its own XP')

  for (const canDo of ARC2_REQUIRED) {
    const record = model.canDo[canDo]
    assert.ok(record, `${canDo} has no evidence after playing the arc`)
    assert.ok(record.successes >= 1, `${canDo} was never achieved`)
    assert.ok(record.independentSuccesses >= 1,
      `${canDo} was only ever achieved with help — that is not evidence of the capability`)
  }
  /* the language is learned, not merely seen */
  for (const id of granted.filter(i => !A1_RECEPTIVE_ITEMS.includes(i))) {
    assert.ok(model.languageItems[id], `${id} was taught and not recorded`)
  }

  /*
   * EVIDENCE TARGETS, SCOPED — the ambiguity arc 1 had to resolve, stated up front
   * this time. On a can-do, `evidence.independent` is the capability's LIFETIME
   * target, read at A1 readiness (which does not exist, and whose threshold the
   * blueprint deliberately leaves unchosen). On an episode, `evidence` is a sentence
   * about that episode. The engine records a can-do once per episode RUN, so one
   * pass of a three-episode arc that teaches three capabilities gives each of them
   * exactly one unaided use — and the second arrives from a later run.
   */
  for (const canDo of ARC2_REQUIRED) {
    assert.equal(BLUEPRINT.canDos.find(c => c.id === canDo).evidence.independent, 2,
      `${canDo}'s lifetime target is two unaided uses`)
    assert.equal(model.canDo[canDo].independentSuccesses, 1,
      `${canDo} gets one unaided use per pass of the arc; the second is a later run`)
    assert.equal(model.canDo[canDo].status, 'learning',
      `${canDo} is still learning at the end of the arc, and that is correct`)
  }
  const readinessNote = BLUEPRINT.exitCriteria.readinessDimensionsForA2
    .find(d => d.dimension === 'required capabilities produced unaided')
  assert.match(readinessNote.note, /the number is chosen when there is evidence from real journeys, not now/,
    'the threshold is deliberately unchosen; a check must not invent one')

  /* a second run reaches the target, wherever that run comes from */
  const again = createLearnerModel()
  A1_ARC2.forEach((ep, index) => playEpisode(again, ep.id, { profile: STRONG, atMs: AT + index * 1000 }))
  playEpisode(again, A1_ARC2[0].id, { profile: STRONG, atMs: AT + 4 * 86400000 })
  assert.equal(again.canDo[A1_ARC2[0].canDoId].independentSuccesses, 2)
  assert.equal(again.canDo[A1_ARC2[0].canDoId].status, 'can_do')

  /* replaying grants no second reward */
  const replay = playEpisode(model, A1_ARC2[0].id, { profile: STRONG, atMs: AT + 10_000 })
  assert.equal(replay.xp, 0, 'a replay must not pay the base reward twice')
  const gardenAfterReplay = Object.keys(model.languageItems).length
  playEpisode(model, A1_ARC2[0].id, { profile: STRONG, atMs: AT + 20_000 })
  assert.equal(Object.keys(model.languageItems).length, gardenAfterReplay,
    'a replay must not grant new items')

  /* an assisted learner can finish it, with weaker evidence */
  const assisted = createLearnerModel()
  A1_ARC2.forEach((ep, index) => {
    playEpisode(assisted, ep.id, { profile: ASSISTED, atMs: AT + index * 1000 })
    assert.equal(assisted.episodes[ep.id].status, 'completed', `${ep.id} must be finishable with help`)
  })
  for (const canDo of ARC2_REQUIRED) {
    assert.ok(assisted.canDo[canDo], `${canDo} must still record something for an assisted learner`)
  }
  console.log(`  the arc plays: ${xp} XP, ${A1_ARC2.length} episodes, ${ARC2_REQUIRED.length} capabilities evidenced`)
  ok()
}

/* ---- 13) the fact the blueprint says to store is stored ---- */
{
  const declared = arc2.factsCaptured || []
  assert.ok(declared.length > 0, 'arc 2 is designed to capture at least one fact')

  const played = createLearnerModel()
  A1_ARC2.forEach((ep, i) => playEpisode(played, ep.id, { profile: STRONG, atMs: AT + i * 1000 }))

  for (const factId of declared) {
    const spec = BLUEPRINT.factsToCapture.find(f => f.id === factId)
    assert.ok(spec, `${factId} is captured by an arc but not described in factsToCapture`)
    assert.equal(spec.store, true, `${factId} is declared by the arc and marked not to store`)
    assert.ok(FACT_TYPES.includes(factId),
      `${factId} is marked store:true and the learner model cannot hold it`)
    assert.ok(BLUEPRINT.personalization.safeSlots.includes(factId),
      `${factId} is stored but is not one of the blueprint's safe slots`)

    /* playing the arc must produce it */
    const stored = factsOfType(played, factId)
    assert.equal(stored.length, 1, `playing the arc stored ${stored.length} ${factId} facts, expected one`)

    /* and the value must be what the design asked for */
    assert.equal(spec.semanticType, 'time_point', 'the value this check validates is a time')
    assert.equal(classifyValue(stored[0].value)?.semanticType, 'time_point',
      `${stored[0].value} is not a typed time`)
    assert.ok(stored[0].value.split(' ').length === 1 && !/[.?!]/.test(stored[0].value),
      'a fact is a value, not a sentence')
  }

  /* the conditions: wrong intent, empty, no hour, an untaught hour, a copied model */
  const probe = createLearnerModel()
  const attempt = (payload) => captureStatedUsualTime(probe, { sourceEpisodeId: 'at_seven', ...payload })
  assert.equal(attempt({ evalKind: 'state_life_fact', reply: 'I get up at eight.' }), null,
    'a life-fact turn says nothing about when the day starts')
  assert.equal(attempt({ evalKind: 'state_routine', reply: '' }), null)
  assert.equal(attempt({ evalKind: 'state_routine', reply: 'I work in the morning.' }), null,
    'a part of the day cannot become a meeting time')
  assert.equal(attempt({ evalKind: 'state_routine', reply: 'I get up at eleven.' }), null,
    'an hour the level has not taught is not stored')
  assert.equal(attempt({
    evalKind: 'state_routine', reply: 'I usually get up at seven.', modelAnswer: 'I usually get up at seven.',
  }), null, "copying Lingua's sentence is not the learner stating a fact")
  assert.deepEqual(probe.learnerFacts, [], 'and none of those left anything behind')
  /* the learner's own words DO count, even with help on screen */
  assert.equal(attempt({
    evalKind: 'state_routine', reply: 'I get up at eight.', modelAnswer: 'I usually get up at seven.',
  })?.value, 'eight')

  /* A FACT IS NOT MASTERY, and it is not an interest either */
  const capturedOnly = createLearnerModel()
  captureStatedUsualTime(capturedOnly, { evalKind: 'state_routine', reply: 'I get up at six.', sourceEpisodeId: 'at_seven' })
  assert.deepEqual(capturedOnly.canDo, {}, 'storing a fact must not credit a capability')
  assert.deepEqual(capturedOnly.languageItems, {}, 'nor an item')
  assert.deepEqual(capturedOnly.episodes, {}, 'nor progress')
  assert.equal(capturedOnly.version, MODEL_VERSION, 'and it needs no new model version')
  assert.ok(!('interests' in capturedOnly), 'an hour is not an interest')
  assert.equal(factsOfType(capturedOnly, 'work_or_study').length, 0,
    "and it must not land in arc 1's fact, which is a place")

  /* it survives being written and read back */
  const revived = sanitizeLearnerFacts(JSON.parse(JSON.stringify(played.learnerFacts)))
  assert.deepEqual(revived, played.learnerFacts, 'the fact must survive a reload')
  console.log(`  ${declared.join(', ')} captured: ${factsOfType(played, declared[0])[0].value}`)
  ok()
}

/* ---- 14) arc 1 → arc 2: the level is cumulative, played rather than asserted ---- */
{
  const model = createLearnerModel()
  const order = [...A1_ARC1, ...A1_ARC2]
  let xp = 0
  order.forEach((ep, index) => {
    const result = playEpisode(model, ep.id, { profile: STRONG, atMs: AT + index * 1000 })
    xp += result.xp
    assert.equal(model.episodes[ep.id].status, 'completed', `${ep.id} must be completable in sequence`)
  })
  assert.equal(xp, order.reduce((sum, ep) => sum + ep.xp, 0), 'both arcs award exactly their own XP')

  /* every capability of both arcs has evidence, and arc 1's is not overwritten */
  for (const canDo of A1_REQUIRED_CAN_DOS) {
    assert.ok(model.canDo[canDo], `${canDo} has no evidence after playing both arcs`)
    assert.ok(model.canDo[canDo].independentSuccesses >= 1, `${canDo} has no unaided use`)
  }
  /* arc 1's statement capability reaches its target here, because arc 2 reuses it */
  assert.ok(model.canDo.talk_about_work_or_study.independentSuccesses >= 2,
    "arc 1's frame comes back in arc 2, so its evidence should keep growing")
  /* both facts, from the arc that owns each */
  assert.equal(factsOfType(model, 'work_or_study').length, 1, "arc 1's fact survives arc 2")
  assert.equal(factsOfType(model, 'usual_time').length, 1, "and arc 2's is captured beside it")

  /* AND NONE OF IT GRADUATES, PROMOTES OR MIGRATES ANYTHING */
  assert.equal(model.version, MODEL_VERSION, 'the learner model must stay where it is')
  assert.equal(MODEL_VERSION, 7, 'and that is v7')
  assert.deepEqual(MILESTONE_LEVELS, ['pre_a1'], 'A1 has no milestone')
  assert.deepEqual(model.levelMilestones, {}, 'and none was written')
  assert.equal(hasGraduatedPreA1(model), false, 'finishing A1 content is not graduating Pre-A1')
  assert.equal(isLevelAvailable(A1), false, 'and it does not open the level')
  for (const path of ['src/learning/curriculum/readiness.js', 'src/learning/curriculum/graduation.js']) {
    const code = read(path).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
    assert.ok(!/\bA1_EXIT_CRITERIA\b|deriveA1Readiness|a1Readiness/.test(code),
      `${path} prepares A1 readiness`)
  }

  /* Pre-A1 is untouched: same episodes, same required core, same readiness */
  assert.equal(ARC.length, 17)
  assert.equal(requiredLevelItems().length, 24)
  assert.equal(episodesOfLevel(PRE_A1).length, 17, 'Home progress is over Pre-A1 alone')
  const before = derivePreA1Readiness(createLearnerModel(), { atMs: AT })
  const after = derivePreA1Readiness(model, { atMs: AT })
  assert.equal(after.ready, before.ready, 'A1 progress must not make a learner ready for A1')
  assert.equal(after.total, before.total, 'nor change what Pre-A1 counts')
  assert.deepEqual(after.missingCanDos, before.missingCanDos,
    'nor change which Pre-A1 capabilities are missing')
  console.log(`  arc 1 → arc 2 plays end to end: ${xp} XP over ${order.length} episodes`)
  ok()
}

/* ---- 15) THE RENDER CONTRACT: every step gives its renderer what it reads ---- */
{
  /*
   * The assertion arc 1 shipped without. `EpisodeShell` dereferences specific
   * fields per step type, and authoring against invented names is silent until a
   * browser draws it — arc 1's `word_order` carried `target` instead of `tokens`
   * and crashed on its fifth step. Arc 2's steps are held to the same contract, and
   * `check:a1-arc1` group 13 holds every runtime episode to it.
   */
  const REQUIRED = {
    scene: ['titleKey', 'bodyKey'],
    model: ['target'],
    comprehension: ['instructionKey', 'target', 'options'],
    choice: ['instructionKey', 'options'],
    word_order: ['instructionKey', 'hintKey', 'tokens'],
    fill_blank: ['instructionKey', 'before', 'after'],
    free_reply: ['instructionKey', 'evalKind'],
    recall: ['instructionKey', 'evalKind'],
    mini_story: ['storyObjective'],
    completion: ['titleKey', 'bodyKey', 'canDoNameKey'],
  }
  for (const ep of A1_ARC2) {
    for (const [index, step] of (ep.steps || []).entries()) {
      const where = `${ep.id} step ${index} (${step.type})`
      const required = REQUIRED[step.type]
      assert.ok(required, `${where}: unknown step type — EpisodeShell renders nothing for it`)
      for (const field of required) {
        assert.ok(step[field] !== undefined && step[field] !== null,
          `${where}: EpisodeShell reads step.${field} and the step does not have it`)
      }
      if (step.type === 'word_order') {
        assert.ok(Array.isArray(step.tokens) && step.tokens.length >= 2, `${where}: tokens must be a sentence`)
      }
      if (step.type === 'fill_blank' && step.alternatives) {
        assert.ok(step.expects, `${where}: alternatives without an expected answer check nothing`)
      }
      if (step.type === 'comprehension' || step.type === 'choice') {
        assert.ok(Array.isArray(step.options) && step.options.length >= 2, `${where}: needs options`)
        assert.ok(step.options.some(o => o.correct), `${where}: no option is correct`)
        const label = step.type === 'comprehension' ? 'key' : 'textEn'
        for (const option of step.options) assert.ok(option[label], `${where}: an option renders blank`)
      }
      if (step.type === 'free_reply') {
        assert.ok(step.promptEn || step.sceneEn, `${where}: a free turn needs a prompt or a scene`)
      }
      /* subtypes must be ones the evaluator knows, or the turn is graded blind */
      if (step.timeForm) {
        assert.ok(['part_of_day', 'clock'].includes(step.timeForm), `${where}: unknown timeForm`)
        assert.equal(step.evalKind, 'state_routine', `${where}: timeForm belongs to a routine turn`)
      }
      if (step.repairKind) {
        assert.ok(REPAIR_KINDS.includes(step.repairKind), `${where}: unknown repair strategy`)
      }
      if (step.meaningWord) {
        assert.equal(step.repairKind, 'ask_meaning', `${where}: a word to ask about needs the meaning strategy`)
      }
      /* and the hosted story must exist, with the shape the player expects */
      if (step.type === 'mini_story') {
        const story = getStory(step.storyObjective)
        assert.equal(story.objective, step.storyObjective,
          `${where}: ${step.storyObjective} has no story of its own and would borrow another`)
        assert.equal(storyHome(story), 'episode', `${where}: the story must be episode-hosted`)
        assert.equal(storyBranches(story).length, 2, `${where}: two branches`)
        assert.equal(storyTurns(story).at(-1).kind, 'close', `${where}: the story must end`)
      }
    }
  }
  ok()
}

console.log(`\ncheck-a1-arc2 — OK  (${groups} arc groups verified)`)
