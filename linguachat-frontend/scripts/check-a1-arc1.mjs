/*
 * check-a1-arc1 — the first real A1 content, against the design it came from.
 *
 * Three things this file refuses to let drift apart:
 *
 *   THE BLUEPRINT AND THE RUNTIME. Arc 1's episodes, their order, their
 *     capabilities and their prerequisites are read out of
 *     docs/curriculum/a1-blueprint.json and compared with what exists. Nothing is
 *     hardcoded twice: if the blueprint says three episodes, three must exist, and
 *     if it says seven arcs, six of them must still be missing.
 *
 *   HAVING CONTENT AND BEING OPEN. A1 is partially built and closed. Every
 *     learner-facing path must refuse it, the arc's content must stay out of the
 *     chunks Home and Practice load, and an episode from an unbuilt arc must fail
 *     closed rather than resolve to something nearby.
 *
 *   A1 AND PRE-A1. Pre-A1's episode count, required core, readiness and Home
 *     progress must be untouched by a level existing above them — now against real
 *     content instead of the synthetic foreign level the architecture sprint used.
 *
 * It also plays the arc, twice: once unaided and once leaning on help, because a
 * curriculum that only type-checks has not been shown to teach anything.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { ARC } from '../src/learning/episodes/index.js'
import { A1_ARC1, A1_ARC1_ID, getA1Arc1Episode } from '../src/learning/episodes/a1Arc1.js'
import {
  A1, PRE_A1, getLevel, episodesOfLevel, runtimeEpisodeCount, isLevelComplete,
  isLevelAvailable, contentStatusOf, hasRuntimeContent,
} from '../src/learning/curriculum/levels.js'
import {
  A1_CAN_DO_INTENT, A1_REQUIRED_CAN_DOS, A1_RECEPTIVE_ITEMS, A1_RUNTIME_ARCS,
  a1RequiredLevelItems, a1ImplementationStatus, a1ProductiveItemsOf, A1_INTRODUCED_ITEMS,
} from '../src/learning/curriculum/a1Map.js'
import { episodeRequest, loadEpisodeContent, hasContentLoader, REFUSED } from '../src/learning/curriculum/episodeContent.js'
import {
  PRE_A1_EXIT_CRITERIA, requiredLevelItems, intentsForEpisode, personalisesOf,
  CAN_DO_INTENT as PRE_A1_CAN_DO_INTENT,
} from '../src/learning/curriculum/preA1Map.js'
import { derivePreA1Readiness } from '../src/learning/curriculum/readiness.js'
import { evaluateFree } from '../src/learning/engine/responseEvaluation.js'
import { INTENT_SLOTS, slotsFor, SEMANTIC_TYPES, classifyValue, isContextCompatible } from '../src/learning/engine/semanticContext.js'
import { SEED_VOCAB_BY_ID } from '../src/data/vocabulary.js'
import { createLearnerModel, MODEL_VERSION, MILESTONE_LEVELS } from '../src/learning/engine/learnerModel.js'
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

/* ---- 1) the blueprint's arc 1, and the runtime's, are the same arc ---- */
const arc1 = BLUEPRINT.arcs.find(a => a.order === 1)
{
  assert.ok(arc1, 'the blueprint must describe an arc 1')
  assert.equal(arc1.id, A1_ARC1_ID, 'the runtime arc id must be the blueprint\'s')
  assert.deepEqual(A1_RUNTIME_ARCS, [arc1.id], 'exactly one A1 arc is implemented')

  /* the planned episode numbers become the runtime episodes, in order */
  const planned = BLUEPRINT.episodes
    .filter(ep => ep.arc === arc1.id)
    .sort((a, b) => a.plannedNumber - b.plannedNumber)
  assert.deepEqual(planned.map(ep => ep.plannedNumber), arc1.episodes,
    'the blueprint must agree with itself about which episodes are in the arc')
  assert.equal(A1_ARC1.length, planned.length,
    `arc 1 plans ${planned.length} episodes and the runtime has ${A1_ARC1.length}`)

  /* every runtime episode traces to exactly one planned episode, in the same order */
  planned.forEach((plan, index) => {
    const episode = A1_ARC1[index]
    assert.equal(episode.canDoId, plan.canDo,
      `runtime episode ${index + 1} teaches ${episode.canDoId}, the plan says ${plan.canDo}`)
    assert.equal(episode.role, plan.role, `${episode.id}: role must match the plan`)
    assert.equal(episode.arc, plan.arc)
    assert.equal(episode.level, 'A1')
    /* curriculum prerequisites: the plan's numbers, translated to ids */
    const expected = (plan.prerequisites || []).map(number => {
      const other = planned.find(p => p.plannedNumber === number)
      return A1_ARC1[planned.indexOf(other)].id
    })
    assert.deepEqual(episode.prerequisites, expected,
      `${episode.id}: prerequisites must be the plan's, not the numbering's`)
  })
  console.log(`\n  arc 1 "${arc1.id}": ${A1_ARC1.length} episodes, traced to the blueprint`)
  ok()
}

/* ---- 2) and nothing from any other arc exists ---- */
{
  const laterArcs = BLUEPRINT.arcs.filter(a => a.order > 1).map(a => a.id)
  assert.equal(laterArcs.length, 6, 'six arcs remain planned')
  const runtimeArcs = new Set(episodesOfLevel(A1).map(ep => ep.arc))
  for (const arcId of laterArcs) {
    assert.ok(!runtimeArcs.has(arcId), `${arcId} has runtime content and was not authorised`)
    assert.equal(hasContentLoader(A1, arcId), false, `${arcId} must have no content loader`)
  }
  /* the design totals still come from the design, never from what is built */
  assert.equal(BLUEPRINT.arcs.length, 7)
  assert.equal(BLUEPRINT.episodes.length, 21)
  assert.equal(runtimeEpisodeCount(A1), A1_ARC1.length, 'the level holds only the implemented arc')
  ok()
}

/* ---- 3) partially built, and closed ---- */
{
  assert.equal(contentStatusOf(A1), 'partial', 'A1 has content and is not finished')
  assert.equal(hasRuntimeContent(A1), true)
  assert.equal(isLevelComplete(A1), false, 'three of twenty-one is not a level')
  assert.equal(isLevelAvailable(A1), false, 'A1 must not be open to learners')
  assert.equal(getLevel(A1).available, false)

  /* every learner-facing request is refused, whatever they ask for */
  for (const episode of A1_ARC1) {
    const asLearner = episodeRequest({ episodeId: episode.id })
    assert.equal(asLearner.ok, false, `${episode.id} must be closed to learners`)
    assert.equal(asLearner.reason, REFUSED.LEVEL_UNAVAILABLE)
  }
  await assert.rejects(() => loadEpisodeContent({ episodeId: A1_ARC1[0].id }),
    (error) => error.reason === REFUSED.LEVEL_UNAVAILABLE,
    'and loading it as a learner must be refused too')

  /* the one door, and it is used only by tooling */
  const productFiles = [
    'src/context/AppContext.jsx', 'src/components/layout/ConversationRoom.jsx',
    'src/components/episode/EpisodeShell.jsx', 'src/components/session/SessionRunner.jsx',
    'src/components/today/TodayView.jsx', 'src/components/episode/CompletedEpisodes.jsx',
    'src/learning/engine/session.js', 'src/learning/curriculum/readiness.js',
  ]
  for (const path of productFiles) {
    assert.ok(!/forLearner:\s*false/.test(read(path)),
      `${path} bypasses the availability gate — only tooling may`)
  }
  ok()
}

/* ---- 4) a future A1 episode fails closed ---- */
{
  /* ids from the blueprint's unbuilt arcs, derived rather than invented */
  const futureCanDos = BLUEPRINT.episodes.filter(ep => ep.arc !== arc1.id).map(ep => ep.canDo)
  assert.ok(futureCanDos.length >= 10, 'there should be plenty of unbuilt design')
  for (const canDo of new Set(futureCanDos)) {
    assert.ok(!A1_CAN_DO_INTENT[canDo], `${canDo} is registered before its arc exists`)
  }
  for (const ghost of ['my_day', 'episode18', 'a1_arc2_first', 'talk_about_daily_routine']) {
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
  const planned = BLUEPRINT.canDos.filter(cd => arc1.newCanDos.includes(cd.id))
  assert.equal(planned.length, arc1.newCanDos.length, 'every new can-do must be designed')
  for (const canDo of planned) {
    assert.ok(A1_CAN_DO_INTENT[canDo.id], `${canDo.id} has no intent`)
    /* required stays required: implementation may not demote scope */
    if (canDo.scope === 'required') {
      assert.ok(A1_REQUIRED_CAN_DOS.includes(canDo.id), `${canDo.id} is required and not registered as such`)
    }
    /* it must be produced by an open turn somewhere in the arc */
    const intent = A1_CAN_DO_INTENT[canDo.id]
    const openTurns = A1_ARC1.flatMap(ep => (ep.steps || []).filter(step =>
      (step.type === 'free_reply' || step.type === 'recall') && step.evalKind === intent))
    assert.ok(openTurns.length >= 1, `${canDo.id} is never produced in an open turn`)
    /* and at least one of those turns must offer no model at all */
    assert.ok(openTurns.some(step => !step.suggestionEn),
      `${canDo.id} is only ever produced with the answer on screen`)
  }
  /*
   * REUSE IS EXERCISED, NOT JUST DECLARED — in both directions.
   *
   * The blueprint's list must be honoured by the episodes, and an episode's own
   * `reuseSkills` must be honoured by its steps. Without the second half, "this
   * arc reuses repair" is a sentence in a file rather than a turn in a
   * conversation, which is exactly how a "review unit" gets built by accident.
   */
  const intentOfSkill = (skill) => A1_CAN_DO_INTENT[skill] || PRE_A1_CAN_DO_INTENT[skill]
  for (const skill of arc1.preA1Reuse) {
    const declared = A1_ARC1.some(ep =>
      (ep.reuseSkills || []).includes(skill) || (ep.skillPrerequisites || []).includes(skill))
    assert.ok(declared, `the arc declares reuse of ${skill} and no episode claims it`)
  }
  for (const ep of A1_ARC1) {
    for (const skill of ep.reuseSkills || []) {
      const intent = intentOfSkill(skill)
      assert.ok(intent, `${ep.id} claims to reuse ${skill}, which no map knows`)
      assert.ok(intentsForEpisode(ep.id).includes(intent),
        `${ep.id} claims to reuse ${skill} and no step evaluates ${intent}`)
    }
  }
  ok()
}

/* ---- 6) both intents are really evaluated, and the session can present them ---- */
{
  const runner = read('src/components/session/SessionRunner.jsx')
  const tableKeys = (name) => {
    const start = runner.indexOf(`const ${name} = {`)
    return new Set([...runner.slice(start, runner.indexOf('\n}', start)).matchAll(/^\s{2}([a-z_]+):/gm)].map(m => m[1]))
  }
  const prompts = tableKeys('PROMPT')
  const answers = tableKeys('MODEL_ANSWER')

  for (const intent of Object.values(A1_CAN_DO_INTENT)) {
    /* nonsense must be refused — an unknown objective must not pass by default */
    const verdict = evaluateFree(intent, 'zzz qqq wwww', { name: 'Alex', independent: true })
    assert.ok(verdict && verdict.completedObjective === false, `${intent} does not evaluate nonsense`)
    assert.equal(evaluateFree(intent, '', {}).completedObjective, false, `${intent} accepts silence`)
    /* and the daily session must be able to ask for it, with its own words */
    assert.ok(prompts.has(intent), `${intent} has no session prompt`)
    assert.ok(answers.has(intent), `${intent} has no session model answer`)
    assert.ok(Object.prototype.hasOwnProperty.call(INTENT_SLOTS, intent),
      `${intent} does not declare which values it accepts`)
  }

  /* NOT a greeting: the generic fallback is what the sixth Pre-A1 arc shipped */
  const promptBody = runner.slice(runner.indexOf('const PROMPT = {'))
  for (const intent of Object.values(A1_CAN_DO_INTENT)) {
    const line = promptBody.split('\n').find(l => l.trim().startsWith(`${intent}:`))
    assert.ok(line && !/Hi there!/.test(line), `${intent} falls back to a generic greeting`)
  }

  /* the canonical answers pass, and the near-misses are corrected rather than accepted */
  const good = evaluateFree('state_life_fact', 'I work at home.', { independent: true })
  assert.equal(good.completedObjective, true)
  assert.equal(good.masteryEvidence.independent, true)
  const askedInstead = evaluateFree('state_life_fact', 'Do you work?', {})
  assert.equal(askedInstead.completedObjective, false, 'a question is not a statement about yourself')
  const noSubject = evaluateFree('state_life_fact', 'work', {})
  assert.equal(noSubject.completedObjective, false)
  assert.ok(noSubject.retryRequired && noSubject.priorityCorrection, 'and it must say what is missing')
  const variant = evaluateFree('state_life_fact', "I'm a student.", {})
  assert.equal(variant.completedObjective, true, 'a natural variant communicates the same thing')
  assert.equal(variant.acceptedVariant, true, 'and is reported as a variant, not as the taught frame')

  const question = evaluateFree('ask_life_fact', 'Do you work?', { independent: true })
  assert.equal(question.completedObjective, true)
  const returned = evaluateFree('ask_life_fact', 'And you?', {})
  assert.equal(returned.completedObjective, false, 'returning the turn is not asking the question')
  assert.equal(evaluateFree('ask_life_fact', 'I work at home.', {}).completedObjective, false,
    'answering is not asking')
  assert.equal(evaluateFree('ask_life_fact', 'What do you do?', {}).completedObjective, true)
  ok()
}

/* ---- 7) semantics: the slot takes places, and refuses everything else ---- */
{
  assert.deepEqual(slotsFor('state_life_fact'), ['place'], 'saying what you do takes a place')
  assert.deepEqual(slotsFor('ask_life_fact'), [], 'asking takes no personalised value')
  for (const type of slotsFor('state_life_fact')) {
    assert.ok(SEMANTIC_TYPES.includes(type), `${type} is not a known semantic type`)
  }
  /* the arc's own workplaces are typed, and typed as places */
  for (const value of ['home', 'at home', 'the office', 'at the office', 'university', 'at university']) {
    const typed = classifyValue(value)
    assert.ok(typed, `"${value}" is untyped and therefore unusable`)
    assert.equal(typed.semanticType, 'place', `"${value}" must be a place`)
    assert.ok(isContextCompatible('state_life_fact', typed), `"${value}" must fit the slot`)
  }
  /* and the things it must never accept */
  for (const wrong of ['water', 'coffee', 'tired', 'music']) {
    const typed = classifyValue(wrong)
    assert.ok(!isContextCompatible('state_life_fact', typed),
      `"${wrong}" must never end up in "I work at ___"`)
  }
  ok()
}

/* ---- 8) the Garden: real language, granted once, and level-scoped ---- */
{
  const granted = A1_ARC1.flatMap(ep => ep.gardenItems || [])
  assert.deepEqual(granted.filter((id, i) => granted.indexOf(id) !== i), [],
    'no item may be granted twice in the arc')
  for (const id of granted) {
    assert.ok(SEED_VOCAB_BY_ID[id], `${id} is granted and is not in the vocabulary catalogue`)
  }
  /* the blueprint's budget for the arc, respected */
  const introduced = A1_INTRODUCED_ITEMS.filter(id => !A1_RECEPTIVE_ITEMS.includes(id))
  assert.ok(introduced.length <= arc1.vocabularyBudget.newProductive,
    `the arc introduces ${introduced.length} productive items, budget ${arc1.vocabularyBudget.newProductive}`)
  assert.ok(A1_RECEPTIVE_ITEMS.length <= arc1.vocabularyBudget.newReceptive,
    'the receptive budget must be respected too')

  /* receptive items are never counted as production */
  const produced = new Set(A1_REQUIRED_CAN_DOS.flatMap(id => a1ProductiveItemsOf(id)))
  for (const id of A1_RECEPTIVE_ITEMS) {
    assert.ok(!produced.has(id), `${id} is declared receptive and counted as produced`)
  }
  /* A1's required core is A1's, and adds nothing to Pre-A1's */
  const a1Core = a1RequiredLevelItems()
  assert.ok(a1Core.length > 0, 'the level must require some language of its own')
  const preA1Core = requiredLevelItems()
  assert.equal(preA1Core.length, 24, 'Pre-A1 requires twenty-four core items, whatever exists above it')
  for (const id of a1Core) {
    if (A1_INTRODUCED_ITEMS.includes(id)) {
      assert.ok(!preA1Core.includes(id), `${id} is A1's and appears in Pre-A1's required core`)
    }
  }
  ok()
}

/* ---- 9) every key the arc renders exists in all eight locales ---- */
{
  const keys = new Set()
  for (const ep of A1_ARC1) {
    for (const key of [ep.titleKey, ep.goalKey, ep.canDoNameKey, ep.durationKey]) keys.add(key)
    for (const step of ep.steps || []) {
      for (const [name, value] of Object.entries(step)) {
        if (/Key$/.test(name) && typeof value === 'string') keys.add(value)
        if (name === 'options') {
          for (const option of value || []) if (option.key) keys.add(option.key)
        }
      }
    }
  }
  /* the evaluator's own keys, read out of the source so none can be forgotten */
  const evaluator = read('src/learning/engine/responseEvaluation.js')
  const arcSection = evaluator.slice(evaluator.indexOf('A1 ARC 1'), evaluator.indexOf('Dispatcher used by the engine'))
  for (const [, key] of arcSection.matchAll(/'(ep(?:18|19|20)[A-Za-z]+)'/g)) keys.add(key)

  assert.ok(keys.size >= 40, `the arc should render plenty of text, found ${keys.size} keys`)
  for (const key of keys) {
    assert.ok(localeKeyPresent(key), `${key} is missing from at least one locale`)
  }
  console.log(`  ${keys.size} keys present in all eight locales`)
  ok()
}

/* ---- 10) personalization: derived from the prose, safe, never load-bearing ---- */
{
  /*
   * DERIVED, NOT DECLARED. `personalisesOf` reads the placeholders an episode's own
   * sentences contain — preA1Map says it plainly: "never a boolean somebody
   * remembered to set". Arc 1 first shipped with a hand-written `personalizes: []`
   * on four steps and no placeholder anywhere, so it declared personalisation that
   * nothing performed. The declaration is gone; this asserts the derivation.
   */
  for (const ep of A1_ARC1) {
    for (const step of ep.steps || []) {
      for (const dead of ['personalizes', 'personalises']) {
        assert.ok(!(dead in step),
          `${ep.id}: personalisation is read from the prose, not declared in \`${dead}\``)
      }
    }
  }
  const personalised = new Set(A1_ARC1.flatMap(ep => personalisesOf(ep.id)))
  assert.ok(personalised.size > 0, 'the arc should personalise something')
  for (const slot of personalised) {
    const slotName = slot.replace(/^fact:/, '')
    assert.ok(BLUEPRINT.personalization.safeSlots.includes(slotName),
      `${slot} is not one of the blueprint's safe slots`)
  }
  /*
   * AND EVERY PLACEHOLDER MUST ALWAYS RESOLVE. The engine leaves an unfilled
   * placeholder in place rather than printing "undefined", so `{something}` reaching
   * a learner is a visible bug. `{name}` cannot: the shell falls back to a neutral
   * name when the profile has none. Arc 1 uses that one and no other.
   */
  const shell = read('src/components/episode/EpisodeShell.jsx')
  assert.ok(/const name = \(profile\.name \|\| ''\)\.trim\(\) \|\| '/.test(shell),
    'the shell must guarantee a name, otherwise {name} could reach the learner unfilled')
  const PROSE = ['promptEn', 'sceneEn', 'suggestionEn', 'target', 'response']
  for (const ep of A1_ARC1) {
    for (const step of ep.steps || []) {
      const text = [...PROSE.map(f => step[f]), ...(step.tokens || []),
        ...(step.options || []).map(o => o.textEn), step.before, step.after].filter(Boolean).join(' ')
      for (const [, placeholder] of text.matchAll(/\{(\w+)\}/g)) {
        assert.equal(placeholder, 'name',
          `${ep.id}: {${placeholder}} has no guaranteed value, so it could reach the learner unfilled`)
      }
    }
  }
  /* the objective is never what changes */
  const evidenceByCanDo = {}
  for (const ep of A1_ARC1) {
    evidenceByCanDo[ep.canDoId] = evidenceByCanDo[ep.canDoId] || new Set()
    for (const intent of intentsForEpisode(ep.id)) evidenceByCanDo[ep.canDoId].add(intent)
  }
  for (const [canDo, intents] of Object.entries(evidenceByCanDo)) {
    assert.ok(intents.has(A1_CAN_DO_INTENT[canDo]),
      `${canDo} is taught by an episode that never evaluates its intent`)
  }
  ok()
}

/* ---- 11) the arc is playable, and teaches what it claims ---- */
{
  const model = createLearnerModel()
  const at = new Date('2026-08-10T09:00:00Z').getTime()
  let xp = 0
  A1_ARC1.forEach((ep, index) => {
    const result = playEpisode(model, ep.id, { profile: STRONG, atMs: at + index * 1000 })
    xp += result.xp
    assert.equal(model.episodes[ep.id].status, 'completed', `${ep.id} must be completable`)
  })
  assert.equal(xp, A1_ARC1.reduce((sum, ep) => sum + ep.xp, 0), 'the arc awards exactly its own XP')

  /* evidence, and the right kind of it */
  for (const canDo of A1_REQUIRED_CAN_DOS) {
    const record = model.canDo[canDo]
    assert.ok(record, `${canDo} has no evidence after playing the arc`)
    assert.ok(record.successes >= 1, `${canDo} was never achieved`)
    assert.ok(record.independentSuccesses >= 1,
      `${canDo} was only ever achieved with help — that is not evidence of the capability`)
  }
  /* the language is learned, not merely seen */
  for (const id of A1_INTRODUCED_ITEMS.filter(i => !A1_RECEPTIVE_ITEMS.includes(i))) {
    assert.ok(model.languageItems[id], `${id} was taught and not recorded`)
  }

  /*
   * `independent: 2` IS A LEVEL TARGET, NOT AN ARC-1 EXIT — and this asserts the
   * exact numbers so nobody has to guess again.
   *
   * The blueprint carries two different evidence fields. On a can-do,
   * `evidence.independent` is the capability's lifetime target, and exitCriteria
   * names it as a READINESS dimension ("required capabilities produced unaided",
   * applied to the 13 required can-dos, threshold deliberately unchosen). On an
   * episode, `evidence` is a sentence about that episode — and for the asking
   * episode it reads "one unaided question plus comprehension of the reply".
   *
   * The engine records a can-do once per episode RUN. So one pass of arc 1 gives
   * `talk_about_work_or_study` two independent uses (episode 18 teaches it and
   * episode 20 integrates it) and `ask_about_work_or_study` one (episode 19 is its
   * only home in this arc). The second one arrives from a later run: a replay, a
   * daily session, or the reuse the blueprint's own matrix schedules in arcs 2 and
   * 6. Arc 1 supplying one is the design, not a shortfall.
   */
  const askEpisode = BLUEPRINT.episodes.find(e => e.plannedNumber === 19)
  assert.match(askEpisode.evidence, /one unaided question/,
    "the asking episode's own evidence target is one unaided question")
  const readinessDimension = BLUEPRINT.exitCriteria.readinessDimensionsForA2
    .find(d => d.dimension === 'required capabilities produced unaided')
  assert.ok(readinessDimension, 'unaided production must be a readiness dimension, which is what the number scopes')
  assert.match(readinessDimension.note, /the number is chosen when there is evidence from real journeys, not now/,
    'the threshold is deliberately unchosen; a check must not invent one')
  for (const canDo of A1_REQUIRED_CAN_DOS) {
    assert.equal(BLUEPRINT.canDos.find(c => c.id === canDo).evidence.independent, 2,
      `${canDo}'s lifetime target is two unaided uses`)
  }
  assert.equal(model.canDo.talk_about_work_or_study.independentSuccesses, 2,
    'the arc gives its statement capability two unaided uses, from episodes 18 and 20')
  assert.deepEqual(model.canDo.talk_about_work_or_study.contexts, ['what_you_do', 'meeting_someone_new'],
    'and they come from two different episodes, not twice from one')
  assert.equal(model.canDo.ask_about_work_or_study.independentSuccesses, 1,
    'the arc gives its asking capability one unaided use — episode 19 is its only home here')
  assert.deepEqual(model.canDo.ask_about_work_or_study.contexts, ['and_you'])
  assert.equal(model.canDo.ask_about_work_or_study.status, 'learning',
    'so it is still learning at the end of the arc, and that is correct')
  {
    /* and a second run of episode 19 is what completes it, wherever that run comes from */
    const again = createLearnerModel()
    playEpisode(again, 'what_you_do', { profile: STRONG, atMs: at })
    playEpisode(again, 'and_you', { profile: STRONG, atMs: at + 1000 })
    playEpisode(again, 'and_you', { profile: STRONG, atMs: at + 2000 })
    assert.equal(again.canDo.ask_about_work_or_study.independentSuccesses, 2)
    assert.equal(again.canDo.ask_about_work_or_study.status, 'can_do',
      'a second unaided ask reaches the target — the level accumulates it, the arc does not have to')
  }

  /* replaying grants no second reward */
  const before = { xp: A1_ARC1[0].xp, awarded: model.episodes[A1_ARC1[0].id].awarded }
  assert.equal(before.awarded, true)
  const replay = playEpisode(model, A1_ARC1[0].id, { profile: STRONG, atMs: at + 10_000 })
  assert.equal(replay.xp, 0, 'a replay must not pay the base reward twice')

  /* an assisted learner can finish it, with weaker evidence */
  const assisted = createLearnerModel()
  A1_ARC1.forEach((ep, index) => {
    playEpisode(assisted, ep.id, { profile: ASSISTED, atMs: at + index * 1000 })
    assert.equal(assisted.episodes[ep.id].status, 'completed', `${ep.id} must be finishable with help`)
  })
  for (const canDo of A1_REQUIRED_CAN_DOS) {
    assert.ok(assisted.canDo[canDo], `${canDo} must still record something for an assisted learner`)
  }
  console.log(`  the arc plays: ${xp} XP, ${A1_ARC1.length} episodes, both capabilities evidenced`)
  ok()
}

/* ---- 12) and none of it graduates, promotes, or migrates anything ---- */
{
  const model = createLearnerModel()
  const at = new Date('2026-08-10T09:00:00Z').getTime()
  A1_ARC1.forEach((ep, i) => playEpisode(model, ep.id, { profile: STRONG, atMs: at + i * 1000 }))

  assert.equal(MODEL_VERSION, 7, 'A1 arc 1 needed no new learner-model version')
  assert.deepEqual(MILESTONE_LEVELS, ['pre_a1'], 'there is no A1 milestone')
  assert.equal(model.levelMilestones?.a1, undefined, 'and playing A1 must not create one')
  assert.equal(hasGraduatedPreA1(model), false, 'playing A1 does not graduate Pre-A1 either')

  /* no A1 readiness exists anywhere */
  for (const path of ['src/learning/curriculum/readiness.js', 'src/learning/curriculum/a1Map.js',
    'src/learning/curriculum/graduation.js', 'src/learning/curriculum/levels.js']) {
    /* the word boundary matters: PRE_A1_EXIT_CRITERIA contains this name */
    assert.ok(!/deriveA1Readiness|a1Readiness|A1_EXIT_CRITERIA/.test(read(path)),
      `${path} prepares A1 readiness or exit criteria`)
  }

  /* PRE-A1 IS UNTOUCHED, measured against the real A1 content */
  assert.equal(runtimeEpisodeCount(PRE_A1), 17)
  assert.equal(ARC.length, 17)
  assert.equal(PRE_A1_EXIT_CRITERIA.requiredCanDos.length, 13)
  assert.equal(requiredLevelItems().length, 24)

  /* a Pre-A1 learner's readiness cannot see A1 at all */
  const preA1Learner = createLearnerModel()
  const before = derivePreA1Readiness(preA1Learner, { atMs: at })
  const alsoPlayedA1 = createLearnerModel()
  A1_ARC1.forEach((ep, i) => playEpisode(alsoPlayedA1, ep.id, { profile: STRONG, atMs: at + i * 1000 }))
  const after = derivePreA1Readiness(alsoPlayedA1, { atMs: at })
  assert.equal(after.ready, before.ready, 'A1 progress must not make a learner ready for A1')
  assert.equal(after.total, before.total, 'nor change what Pre-A1 counts')
  assert.deepEqual(after.missingCanDos, before.missingCanDos,
    'nor change which Pre-A1 capabilities are missing')

  /* Home counts one level: seventeen, not twenty */
  const completedA1 = new Set(A1_ARC1.map(ep => ep.id))
  const preA1Episodes = episodesOfLevel(PRE_A1)
  assert.equal(preA1Episodes.length, 17, 'Home progress is over Pre-A1 alone')
  assert.ok(!preA1Episodes.some(ep => completedA1.has(ep.id)), 'and no A1 episode is in that list')
  assert.deepEqual(a1ImplementationStatus().complete, false)
  ok()
}

/* ---- 13) THE RENDER CONTRACT: every step gives its renderer what it reads ---- */
{
  /*
   * WHY THIS EXISTS. Arc 1 passed twelve groups, played end to end in the journey
   * harness and crashed on its fifth step the first time a browser rendered it:
   * the `word_order` step carried `target: 'I work at home.'` and EpisodeShell reads
   * `step.tokens.map(...)`. Its `fill_blank` carried `promptEn`/`answerEn`, which the
   * renderer never looks at, so the gap drew an empty sentence and accepted anything.
   *
   * The journey harness evaluates answers; it does not render. Nothing in 44 checks
   * asserted that a step supplies the fields its renderer dereferences — which is
   * why authoring an episode against the wrong field names was silent. This closes
   * that gap for every runtime episode, Pre-A1 included: the seventeen shipped ones
   * define the contract, so if a rule here is wrong, they say so.
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
  const ALL = [...ARC, ...A1_ARC1]
  assert.equal(ALL.length, 20, 'the render contract must cover every runtime episode')
  for (const ep of ALL) {
    for (const [i, step] of (ep.steps || []).entries()) {
      const where = `${ep.id} step ${i} (${step.type})`
      const required = REQUIRED[step.type]
      assert.ok(required, `${where}: unknown step type — EpisodeShell renders nothing for it`)
      for (const field of required) {
        assert.ok(step[field] !== undefined && step[field] !== null,
          `${where}: EpisodeShell reads step.${field} and the step does not have it`)
      }
      /* the two fields the renderer calls .map() on, so undefined is a crash */
      if (step.type === 'word_order') {
        assert.ok(Array.isArray(step.tokens) && step.tokens.length >= 2,
          `${where}: tokens must be a sentence to rebuild`)
      }
      if (step.type === 'comprehension' || step.type === 'choice') {
        assert.ok(Array.isArray(step.options) && step.options.length >= 2, `${where}: needs options to choose between`)
        /*
         * At least one, not exactly one: Pre-A1's "How are you?" step accepts three
         * different replies, because more than one answer really is fine. A step with
         * none is the bug — nothing the learner taps would ever advance.
         */
        assert.ok(step.options.some(o => o.correct), `${where}: no option is correct, so the step cannot be passed`)
        const label = step.type === 'comprehension' ? 'key' : 'textEn'
        for (const opt of step.options) {
          assert.ok(opt[label], `${where}: an option with no ${label} renders blank`)
        }
      }
      /* a free turn needs something on screen to answer */
      if (step.type === 'free_reply') {
        assert.ok(step.promptEn || step.sceneEn, `${where}: a free turn needs a prompt or a scene`)
      }
    }
  }
  ok()
}

console.log(`\ncheck-a1-arc1 — OK  (${groups} arc groups verified)`)
