/*
 * check-a1-arc3 — the third real A1 arc, against the design it came from.
 *
 * The same shape as `check:a1-arc1` and `check:a1-arc2`, pointed at
 * `people_around_you`, and again a SEPARATE file: an arc check that grows into a
 * level check is how arc 1's assertions started reading arc 2 as a regression, and
 * how arc 2's read arc 3 as one. This file owns arc 3. "How many arcs exist at all"
 * belongs to `check:a1-blueprint`.
 *
 * Everything expected is read out of docs/curriculum/a1-blueprint.json. Three
 * things make this arc different from the two before it, and each is checked as a
 * fact rather than glossed:
 *
 *   1. ONE capability, THREE episodes — so the arc reaches the can-do's lifetime
 *      target of two unaided uses INSIDE the arc, the opposite of arcs 1 and 2.
 *   2. ONE capability, TWO intents — introducing somebody and saying something
 *      about them are different sentences and both are its evidence.
 *   3. It captures NO fact and hosts NO story, because the blueprint says so.
 *      Both are asserted explicitly: a design decision that leaves no trace in a
 *      check is indistinguishable from something forgotten.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { ARC } from '../src/learning/episodes/index.js'
import { A1_ARC1 } from '../src/learning/episodes/a1Arc1.js'
import { A1_ARC2 } from '../src/learning/episodes/a1Arc2.js'
import { A1_ARC3, A1_ARC3_ID, getA1Arc3Episode } from '../src/learning/episodes/a1Arc3.js'
import {
  A1, PRE_A1, getLevel, episodesOfLevel, isLevelAvailable, hasRuntimeContent,
} from '../src/learning/curriculum/levels.js'
import {
  A1_CAN_DO_INTENT, A1_CAN_DO_EXTRA_INTENTS, a1IntentsOf, A1_REQUIRED_CAN_DOS,
  A1_RECEPTIVE_ITEMS, A1_RUNTIME_ARCS, A1_INTRODUCED_ITEMS, a1ProductiveItemsOf,
} from '../src/learning/curriculum/a1Map.js'
import { episodeRequest, loadEpisodeContent, hasContentLoader, REFUSED } from '../src/learning/curriculum/episodeContent.js'
import {
  requiredLevelItems, intentsForEpisode, personalisesOf, CAN_DO_INTENT as PRE_A1_CAN_DO_INTENT,
} from '../src/learning/curriculum/preA1Map.js'
import { derivePreA1Readiness } from '../src/learning/curriculum/readiness.js'
import { evaluateFree, REPAIR_KINDS, shouldEscalate } from '../src/learning/engine/responseEvaluation.js'
import { evaluateEpisodeResponse } from '../src/learning/engine/hybridEvaluation.js'
import {
  INTENT_SLOTS, slotsFor, SEMANTIC_TYPES, classifyValue, isContextCompatible,
} from '../src/learning/engine/semanticContext.js'
import { getStory, hasStory } from '../src/learning/engine/miniStory.js'
import { formatSupportsObjective } from '../src/learning/engine/formatChoice.js'
import { SEED_VOCAB_BY_ID } from '../src/data/vocabulary.js'
import {
  createLearnerModel, MODEL_VERSION, MILESTONE_LEVELS, FACT_TYPES,
} from '../src/learning/engine/learnerModel.js'
import { factsOfType } from '../src/learning/engine/learnerFacts.js'
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

const arc3 = BLUEPRINT.arcs.find(a => a.order === 3)
/* arc 3's own required capabilities, derived — never the level's growing list */
const ARC3_REQUIRED = [...new Set(A1_ARC3.map(ep => ep.canDoId))]
  .filter(id => A1_REQUIRED_CAN_DOS.includes(id))
const granted = A1_ARC3.flatMap(ep => ep.gardenItems || [])
const AT = new Date('2026-08-19T09:00:00Z').getTime()
/* the partner the harness introduces; the product derives one per learner */
const PARTNER = 'Ana'

/* ---- 1) the blueprint's arc 3, and the runtime's, are the same arc ---- */
{
  assert.ok(arc3, 'the blueprint must describe an arc 3')
  assert.equal(arc3.id, A1_ARC3_ID, "the runtime arc id must be the blueprint's")
  assert.ok(A1_RUNTIME_ARCS.includes(arc3.id), 'arc 3 must be declared as implemented')
  assert.equal(A1_RUNTIME_ARCS[2], arc3.id, 'and it must come third, in the blueprint order')

  const planned = BLUEPRINT.episodes
    .filter(ep => ep.arc === arc3.id)
    .sort((a, b) => a.plannedNumber - b.plannedNumber)
  assert.deepEqual(planned.map(ep => ep.plannedNumber), arc3.episodes,
    'the blueprint must agree with itself about which episodes are in the arc')
  assert.equal(A1_ARC3.length, planned.length,
    `arc 3 plans ${planned.length} episodes and the runtime has ${A1_ARC3.length}`)

  /*
   * Every runtime episode traces to exactly one planned episode, in order, with the
   * plan's role, and prerequisites that are the plan's NUMBERS translated to ids —
   * across arcs, so "A1 is one chain" is proved rather than assumed. Episode 24
   * requires 20, arc 1's last, which is what the blueprint's `prerequisiteArcs`
   * says: this arc follows `work_and_study`, not the arc immediately before it.
   */
  const allRuntime = [...A1_ARC1, ...A1_ARC2, ...A1_ARC3]
  const arcOf = (arcId) => ({ work_and_study: A1_ARC1, daily_rhythm: A1_ARC2, [arc3.id]: A1_ARC3 })[arcId]
  planned.forEach((plan, index) => {
    const episode = A1_ARC3[index]
    assert.equal(episode.canDoId, plan.canDo,
      `runtime episode ${index + 1} teaches ${episode.canDoId}, the plan says ${plan.canDo}`)
    assert.equal(episode.role, plan.role, `${episode.id}: role must match the plan`)
    assert.equal(episode.arc, arc3.id, `${episode.id}: arc`)
    assert.equal(episode.level, 'A1', `${episode.id}: level`)
    const expected = (plan.prerequisites || []).map((number) => {
      const other = BLUEPRINT.episodes.find(e => e.plannedNumber === number)
      const order = BLUEPRINT.episodes
        .filter(e => e.arc === other.arc)
        .sort((a, b) => a.plannedNumber - b.plannedNumber)
        .findIndex(e => e.plannedNumber === number)
      return arcOf(other.arc)[order].id
    })
    assert.deepEqual(episode.prerequisites, expected,
      `${episode.id}: prerequisites must be the plan's, not the numbering's`)
    for (const prerequisite of episode.prerequisites) {
      assert.ok(allRuntime.some(e => e.id === prerequisite),
        `${episode.id} requires ${prerequisite}, which is not a runtime episode`)
    }
  })
  /* the arc the design says comes first must be built, or the chain is broken */
  for (const required of arc3.prerequisiteArcs || []) {
    assert.ok(A1_RUNTIME_ARCS.includes(required),
      `arc 3 requires ${required}, which has no runtime content`)
  }
  console.log(`\n  arc 3 "${arc3.id}": ${A1_ARC3.length} episodes, traced to the blueprint`)
  ok()
}

/* ---- 2) and nothing from an unbuilt arc exists ---- */
{
  const plannedOnly = BLUEPRINT.arcs.map(a => a.id).filter(id => !A1_RUNTIME_ARCS.includes(id))
  assert.equal(plannedOnly.length, BLUEPRINT.arcs.length - A1_RUNTIME_ARCS.length,
    'every runtime arc must be one the blueprint designed')
  assert.ok(plannedOnly.length >= 1, 'A1 is not finished, so something must still be planned')
  const runtimeArcs = new Set(episodesOfLevel(A1).map(ep => ep.arc))
  for (const arcId of plannedOnly) {
    assert.ok(!runtimeArcs.has(arcId), `${arcId} has runtime content and was not authorised`)
    assert.equal(hasContentLoader(A1, arcId), false, `${arcId} must have no content loader`)
  }
  /* the design totals still come from the design, never from what is built */
  assert.equal(BLUEPRINT.arcs.length, 7)
  assert.equal(BLUEPRINT.episodes.length, 21, 'twenty-one planned stays twenty-one')
  /* arc 3's own episodes are all in the level, whatever else joins them later */
  for (const ep of A1_ARC3) {
    assert.ok(episodesOfLevel(A1).some(other => other.id === ep.id), `${ep.id} is not in the level`)
    assert.ok(runtimeArcs.has(ep.arc), `${ep.id} lost its arc`)
  }
  /* and the capabilities of unbuilt arcs are still unregistered */
  const futureCanDos = BLUEPRINT.episodes
    .filter(ep => !A1_RUNTIME_ARCS.includes(ep.arc))
    .map(ep => ep.canDo)
  /* five episodes across arcs 6-7 remain unbuilt; the number shrinks by exactly as many as each arc sprint builds */
  assert.ok(futureCanDos.length >= 5, 'there should be plenty of unbuilt design left')
  for (const canDo of new Set(futureCanDos)) {
    assert.ok(!A1_CAN_DO_INTENT[canDo], `${canDo} is registered before its arc exists`)
  }
  ok()
}

/* ---- 3) still partially built, still closed, and loaded per arc ---- */
{
  assert.equal(getLevel(A1).contentStatus, 'partial', 'three arcs of seven is partial')
  assert.equal(getLevel(A1).available, false, 'A1 must stay closed to learners')
  assert.equal(hasRuntimeContent(A1), true, 'and it does have content')

  for (const episode of A1_ARC3) {
    const asLearner = episodeRequest({ episodeId: episode.id })
    assert.equal(asLearner.ok, false, `${episode.id} must be closed to learners`)
    assert.equal(asLearner.reason, REFUSED.LEVEL_UNAVAILABLE)
  }
  await assert.rejects(() => loadEpisodeContent({ episodeId: A1_ARC3[0].id }),
    (error) => error.reason === REFUSED.LEVEL_UNAVAILABLE,
    'and loading it as a learner must be refused before any import')

  /* every one of them resolves for tooling, from arc 3's OWN loader */
  assert.equal(hasContentLoader(A1, arc3.id), true, 'arc 3 must have its own loader')
  assert.equal(hasContentLoader(A1), false, 'and the level must still have no catch-all')
  for (const episode of A1_ARC3) {
    const loaded = await loadEpisodeContent({ episodeId: episode.id, forLearner: false })
    assert.equal(loaded.id, episode.id)
    assert.equal(loaded.arc, arc3.id)
    assert.ok(loaded.steps.length > 0, `${episode.id} must arrive with its content`)
    /* the module's own accessor agrees with the resolver */
    assert.equal(getA1Arc3Episode(episode.id).id, episode.id)
  }
  assert.ok(!getA1Arc3Episode('my_day'), "arc 3's accessor must not answer for arc 2")
  assert.ok(!getA1Arc3Episode('nope'), 'nor for an id nobody wrote')

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
  for (const ghost of ['find_your_way', 'episode27', 'a1_arc4_first', 'my_week', 'introduce_someone_else']) {
    const result = episodeRequest({ levelId: A1, episodeId: ghost, forLearner: false })
    assert.equal(result.ok, false, `${ghost} must not resolve`)
    assert.equal(result.reason, REFUSED.UNKNOWN_EPISODE, `${ghost}: wrong reason`)
  }
  assert.equal(episodeRequest({ levelId: 'a2', episodeId: 'anything', forLearner: false }).reason,
    REFUSED.UNKNOWN_LEVEL, 'an unknown level fails closed even for tooling')
  ok()
}

/* ---- 5) the capability is the blueprint's, with its scope ---- */
{
  const planned = arc3.newCanDos
  assert.deepEqual([...new Set(A1_ARC3.map(ep => ep.canDoId))].sort(), [...planned].sort(),
    'the arc must teach exactly the capability it declares')
  assert.equal(planned.length, 1, 'arc 3 is one capability across three episodes, by design')

  for (const canDoId of planned) {
    const spec = BLUEPRINT.canDos.find(c => c.id === canDoId)
    assert.ok(spec, `${canDoId} is taught and not designed`)
    if (spec.scope === 'required') {
      assert.ok(A1_REQUIRED_CAN_DOS.includes(canDoId), `${canDoId} is required and not registered as such`)
    } else {
      assert.ok(!A1_REQUIRED_CAN_DOS.includes(canDoId), `${canDoId} is ${spec.scope} and was promoted to required`)
    }
    /* its prerequisites must be capabilities an implemented level actually teaches */
    const known = { ...PRE_A1_CAN_DO_INTENT, ...A1_CAN_DO_INTENT }
    assert.ok((spec.prerequisites || []).length >= 1, 'introducing somebody else builds on something')
    for (const prerequisite of spec.prerequisites || []) {
      assert.ok(known[prerequisite],
        `${canDoId} requires ${prerequisite}, which no implemented level teaches`)
    }
    /* and every episode claiming it must evaluate at least one of its intents */
    for (const episode of A1_ARC3.filter(ep => ep.canDoId === canDoId)) {
      const evaluated = intentsForEpisode(episode.id)
      assert.ok(a1IntentsOf(canDoId).some(intent => evaluated.includes(intent)),
        `${episode.id} claims ${canDoId} and evaluates none of its intents`)
    }
  }
  /* Pre-A1's capability map is untouched by any of it */
  assert.equal(Object.keys(PRE_A1_CAN_DO_INTENT).length, 16, "Pre-A1's intent map must not grow")
  for (const canDoId of planned) {
    assert.ok(!PRE_A1_CAN_DO_INTENT[canDoId], `${canDoId} was registered in Pre-A1's map`)
  }
  ok()
}

/* ---- 6) ONE capability, TWO intents — and the second is real evidence ---- */
{
  /*
   * The arc's structural novelty. `introduce_someone_else` is evidenced by two
   * different sentences: presenting the person (`introduce_person`) and saying
   * something about them (`state_person_fact`). The primary map keeps ONE intent per
   * can-do, because coverage, the planner and the authoring contract all read it
   * that way; the extra intents live in their own map, so nothing that asks "which
   * intent evidences this capability" silently starts receiving a list.
   */
  assert.equal(A1_CAN_DO_INTENT.introduce_someone_else, 'introduce_person',
    'the primary intent stays a single value')
  assert.deepEqual(A1_CAN_DO_EXTRA_INTENTS.introduce_someone_else, ['state_person_fact'])
  assert.deepEqual(a1IntentsOf('introduce_someone_else'), ['introduce_person', 'state_person_fact'],
    'and both are readable as the capability\'s evidence')
  assert.deepEqual(a1IntentsOf('nothing_like_this'), [], 'an unknown capability yields no intents')
  /* the extra map may only extend capabilities that exist */
  for (const canDoId of Object.keys(A1_CAN_DO_EXTRA_INTENTS)) {
    assert.ok(A1_CAN_DO_INTENT[canDoId], `${canDoId} has extra intents and no primary one`)
  }

  /* THE EXPLOSION GUARD: the blueprint allows three new intents per arc; this is two */
  const intents = new Set(A1_ARC3.flatMap(ep => intentsForEpisode(ep.id)))
  /*
   * What existed before is DERIVED from what the earlier episodes evaluate, not
   * listed by hand: a hand-written list of "intents so far" is a second registry
   * that goes stale, and the number this guard protects is "how many are NEW".
   */
  const before = new Set([...ARC, ...A1_ARC1, ...A1_ARC2].flatMap(ep => intentsForEpisode(ep.id)))
  const introduced = [...intents].filter(i => !before.has(i)).sort()
  assert.deepEqual(introduced, ['introduce_person', 'state_person_fact'],
    `arc 3 introduces ${introduced.join(', ')}`)
  assert.ok(introduced.length <= 3, "the blueprint's explosion guard is three new intents per arc")
  ok()
}

/* ---- 7) hybrid, in the blueprint's sense of the word ---- */
{
  /*
   * A1's FIRST `hybrid` capability. The blueprint's own definition is the test: the
   * canonical frame is judged locally, and only an inconclusive reply escalates. So
   * every canonical case below must be settled with no provider at all, and the
   * inconclusive band must be exactly that — inconclusive, not wrong.
   */
  const spec = BLUEPRINT.canDos.find(c => c.id === 'introduce_someone_else')
  assert.equal(spec.evaluation, 'hybrid', 'the design calls this capability hybrid')
  const strategy = BLUEPRINT.evaluationStrategy.hybrid
  assert.ok(/judged locally/.test(JSON.stringify(strategy)) || Array.isArray(strategy),
    'the blueprint must say what hybrid means')

  const ctx = { partner: PARTNER }
  const cases = [
    /* introducing a third person */
    ['introduce_person', 'This is Ana.', true, false],
    ['introduce_person', 'This is my friend Ana.', true, false],
    ['introduce_person', 'Ana, this is Ben.', true, false],
    ['introduce_person', 'Meet Ana.', true, true],
    ['introduce_person', 'Here is Ana.', true, true],
    ['introduce_person', 'Ana.', false, false],
    ['introduce_person', "Hi, I'm Sam.", false, false],
    ['introduce_person', '', false, false],
    /* saying something about them */
    ['state_person_fact', 'She is a student.', true, false],
    ['state_person_fact', "He's a teacher.", true, false],
    ['state_person_fact', 'She works at the office.', true, true],
    ['state_person_fact', 'They are students.', false, false],
    ['state_person_fact', 'I am a student.', false, false],
    ['state_person_fact', '', false, false],
  ]
  for (const [kind, text, expected, variant] of cases) {
    const verdict = evaluateFree(kind, text, ctx)
    assert.equal(verdict.completedObjective, expected,
      `${kind} ${JSON.stringify(text)} → ${verdict.errorType}`)
    assert.equal(shouldEscalate(verdict), false,
      `${JSON.stringify(text)} is canonical or clearly not, and must be settled locally`)
    if (expected) {
      assert.equal(Boolean(verdict.acceptedVariant), variant,
        `${JSON.stringify(text)}: variant flag`)
      assert.ok(verdict.praiseKey, `${JSON.stringify(text)} must be praised by key, not by prose`)
    } else {
      assert.ok(verdict.retryRequired, `${JSON.stringify(text)} must offer another try`)
      assert.ok(verdict.explanation || verdict.priorityCorrection || verdict.retryPrompt,
        `${JSON.stringify(text)} must be explained, not just refused`)
      if (text.trim()) {
        assert.ok(verdict.explanation || verdict.priorityCorrection,
          `${JSON.stringify(text)} is a real attempt and needs a real correction`)
      }
    }
  }
  /* the specific confusions the arc exists to correct are named, not lumped together */
  assert.equal(evaluateFree('introduce_person', "Hi, I'm Sam.", ctx).errorType, 'introduced_self')
  assert.equal(evaluateFree('introduce_person', 'Ana.', ctx).errorType, 'missing_frame')
  assert.equal(evaluateFree('state_person_fact', 'They are students.', ctx).errorType, 'wrong_person')
  assert.equal(evaluateFree('state_person_fact', 'I am a student.', ctx).errorType, 'wrong_person')

  /* AND THE INCONCLUSIVE BAND ESCALATES — which is what hybrid buys */
  for (const [kind, text, errorType] of [
    ['introduce_person', 'hmm what', 'no_introduction'],
    ['state_person_fact', 'zzz qqq', 'no_person_statement'],
  ]) {
    const verdict = evaluateFree(kind, text, ctx)
    assert.equal(verdict.completedObjective, false)
    assert.equal(verdict.conclusive, false, `${JSON.stringify(text)} must be inconclusive`)
    assert.equal(shouldEscalate(verdict), true, `${JSON.stringify(text)} must escalate`)
    assert.equal(verdict.errorType, errorType)
    assert.ok(verdict.retryRequired, 'and the learner still gets a retry with no provider at all')
  }
  /*
   * NO CAPABILITY DEPENDS ON THE PROVIDER. With no remote, an inconclusive reply
   * falls back to the local verdict; the learner is never blocked and never told
   * they were right because a network call failed.
   */
  const noRemote = await evaluateEpisodeResponse({
    episode: { id: 'this_is', canDoId: 'introduce_someone_else' },
    step: { evalKind: 'introduce_person' }, learnerResponse: 'hmm what', partner: PARTNER,
  })
  assert.equal(noRemote.source, 'fallback', 'with no provider the local verdict stands')
  assert.equal(noRemote.completedObjective, false, 'and it does not become a pass')
  ok()
}

/* ---- 8) the partner travels: step → runner → router → evaluator → provider ---- */
{
  /*
   * WHO the turn is about is a step property, and it has to survive the whole path
   * or the verdict is about a different question. Arc 2 lost `timeForm` this way and
   * graded a routine turn that demanded an hour against a sentence with no time in
   * it. Here the failure is quieter and just as wrong: the model answer would say
   * "This is Ana." to a learner whose partner on screen is somebody else.
   */
  const local = evaluateFree('introduce_person', 'Ana.', { partner: 'Mia' })
  assert.equal(local.naturalVersion, 'This is Mia.', 'the local verdict must use the turn\'s partner')
  assert.equal(evaluateFree('state_person_fact', 'zz', { partner: 'Mia' }).naturalVersion,
    'Mia is a student.')
  /* and with no partner at all it must still produce a sentence, not "undefined" */
  for (const kind of ['introduce_person', 'state_person_fact']) {
    const blind = evaluateFree(kind, 'zz', {})
    assert.ok(blind.naturalVersion && !/undefined|\{/.test(blind.naturalVersion),
      `${kind}: a missing partner must not leak into the model answer`)
  }

  /* the router forwards it, both to the local evaluator and to the provider */
  let payload = null
  const routed = await evaluateEpisodeResponse({
    episode: { id: 'this_is', canDoId: 'introduce_someone_else' },
    step: { evalKind: 'introduce_person' }, learnerResponse: 'Ana.', partner: 'Mia',
    remote: (sent) => { payload = sent; return null },
  })
  assert.equal(routed.naturalVersion, 'This is Mia.', 'the router must pass the partner down')
  const escalated = await evaluateEpisodeResponse({
    episode: { id: 'this_is', canDoId: 'introduce_someone_else' },
    step: { evalKind: 'introduce_person' }, learnerResponse: 'hmm what', partner: 'Mia',
    remote: (sent) => { payload = sent; return null },
  })
  assert.equal(escalated.source, 'fallback')
  assert.equal(payload?.partner_name, 'Mia', 'and must send it to the provider as partner_name')

  /* the product's own call sites pass it, rather than the harness being the only one */
  for (const path of ['src/components/episode/EpisodeShell.jsx', 'src/components/session/SessionRunner.jsx']) {
    const source = read(path)
    const call = source.slice(source.indexOf('evaluateEpisodeResponse({'), source.indexOf('} catch', source.indexOf('evaluateEpisodeResponse({')))
    assert.match(call, /partner/, `${path} evaluates an introduction without saying who it is about`)
  }

  /* the provider contract knows the field, and knows it is a task property */
  const schemas = read('../linguachat-backend/ai/schemas.py')
  assert.match(schemas, /partner_name/, 'the backend must accept the field')
  const around = schemas.slice(Math.max(0, schemas.indexOf('partner_name') - 700), schemas.indexOf('partner_name') + 200)
  assert.match(around, /never a real person|not a real person|TASK/i,
    'and must record that the name is the task\'s, not somebody from the learner\'s life')
  const evaluator = read('../linguachat-backend/ai/evaluator.py')
  for (const fn of ['_introduce_person', '_state_person_fact']) {
    assert.ok(evaluator.includes(fn), `the deterministic mirror is missing ${fn}`)
  }
  ok()
}

/* ---- 9) the session can present every turn of the arc ---- */
{
  const runner = read('src/components/session/SessionRunner.jsx')
  const table = (name) => {
    const start = runner.indexOf(`const ${name} = {`)
    return new Set([...runner.slice(start, runner.indexOf('\n}', start)).matchAll(/^\s{2}([a-z_]+):/gm)].map(m => m[1]))
  }
  const prompts = table('PROMPT')
  const answers = table('MODEL_ANSWER')
  for (const intent of new Set(A1_ARC3.flatMap(ep => intentsForEpisode(ep.id)))) {
    assert.ok(prompts.has(intent), `${intent} has no prompt in the session runner`)
    assert.ok(answers.has(intent), `${intent} has no model answer in the session runner`)
  }
  /* and the two new ones name the partner rather than a placeholder nobody fills */
  for (const intent of ['introduce_person', 'state_person_fact']) {
    const line = runner.split('\n').find(l => l.trim().startsWith(`${intent}:`) && l.includes('=>'))
    assert.ok(/v\.partner/.test(line), `${intent}'s session text must use the partner it was given`)
  }
  ok()
}

/* ---- 10) semantics: a relation is a relation, and not a name or a place ---- */
{
  /*
   * ONE new type, and it is the blueprint's. `relation` is declared `requiredBy:
   * introduce_someone_else`, which is exactly the capability this arc teaches — and
   * a type whose consumer does not exist yet makes coverage look real, so the
   * premature set is derived from the blueprint rather than listed by hand.
   */
  const proposed = BLUEPRINT.semanticTypes.proposed.find(t => t.id === 'relation')
  assert.ok(proposed, 'relation must be the blueprint\'s type, not an invention')
  assert.deepEqual(proposed.requiredBy, ['introduce_someone_else'])
  assert.ok(SEMANTIC_TYPES.includes('relation'), 'the arc needs a relation type')
  const canDosOfBuiltArcs = new Set(BLUEPRINT.arcs
    .filter(a => A1_RUNTIME_ARCS.includes(a.id))
    .flatMap(a => a.newCanDos))
  const premature = BLUEPRINT.semanticTypes.proposed
    .filter(t => !(t.requiredBy || []).some(canDo => canDosOfBuiltArcs.has(canDo)))
    .map(t => t.id)
  assert.ok(premature.length >= 1, 'A1 still has types it does not need yet')
  for (const type of premature) {
    assert.ok(!SEMANTIC_TYPES.includes(type), `${type} belongs to an arc that does not exist`)
  }
  /* every type the arc says it needs exists — `person` was already Pre-A1's */
  assert.deepEqual(arc3.semanticNeeds.filter(t => !SEMANTIC_TYPES.includes(t)), [],
    'every type the arc declares it needs must exist')

  assert.deepEqual(slotsFor('introduce_person'), ['relation'],
    'an introduction takes a relation and nothing else')
  assert.deepEqual(INTENT_SLOTS.state_person_fact, [],
    'saying something about somebody personalises nothing')

  /* the taught relations are typed */
  for (const value of ['friend', 'colleague', 'classmate']) {
    assert.equal(classifyValue(value)?.semanticType, 'relation', `${value} must be a relation`)
    assert.ok(isContextCompatible('introduce_person', classifyValue(value)), `${value} must fit the slot`)
  }
  /*
   * AND THE SLOT REFUSES WHAT THE ARC'S RISK NOTE IS ABOUT. "This is my the office."
   * and "This is my Ana." must be impossible to build — a name is a person, a place
   * is a place, and neither is a relation.
   */
  for (const nonsense of ['the office', 'home', 'water', 'coffee', 'music', 'seven', 'tired']) {
    const typed = classifyValue(nonsense)
    assert.ok(!typed || !isContextCompatible('introduce_person', typed),
      `"This is my ${nonsense}" must be impossible to build`)
  }
  for (const type of proposed.incompatibleWith || []) {
    assert.ok(!slotsFor('introduce_person').includes(type),
      `the relation slot must refuse ${type}, which is what the type is for`)
  }
  /*
   * NO FAMILY STRUCTURE IS ASSUMED — the arc's risk note, read as a rule. Three
   * neutral relations, and the fallback ("This is Ana.") needs none at all.
   */
  const relations = Object.values(SEED_VOCAB_BY_ID)
    .filter(item => classifyValue(item.id)?.semanticType === 'relation')
    .map(item => item.id)
  for (const kin of ['mother', 'father', 'brother', 'sister', 'wife', 'husband', 'son', 'daughter']) {
    assert.ok(!relations.includes(kin), `${kin} assumes a family structure the arc refuses to assume`)
  }
  assert.equal(evaluateFree('introduce_person', 'This is Ana.', { partner: PARTNER }).completedObjective, true,
    'and an introduction with no relation at all is complete')
  ok()
}

/* ---- 11) the Garden: real language, granted once, within the arc's budget ---- */
{
  assert.deepEqual(granted.filter((id, i) => granted.indexOf(id) !== i), [],
    'no item may be granted twice in the arc')
  for (const id of granted) {
    assert.ok(SEED_VOCAB_BY_ID[id], `${id} is granted and is not in the vocabulary catalogue`)
  }
  const receptive = A1_ARC3.flatMap(ep => (ep.steps || [])
    .flatMap(step => [...(step.meaningItems || []), step.itemId].filter(Boolean)))
    .filter(id => A1_RECEPTIVE_ITEMS.includes(id))
  const productive = granted.filter(id => !A1_RECEPTIVE_ITEMS.includes(id))
  assert.equal(productive.length, arc3.vocabularyBudget.newProductive,
    `the arc grants ${productive.length} productive items, budget ${arc3.vocabularyBudget.newProductive}`)
  assert.ok(new Set(receptive).size <= arc3.vocabularyBudget.newReceptive,
    'the receptive budget must be respected too')
  /* the arc's patterns are the blueprint's, and all of them are taught */
  for (const pattern of arc3.newPatterns) {
    assert.ok(productive.includes(pattern), `${pattern} is designed and never granted`)
  }
  /* the risk note's ceiling: three neutral relations, no more */
  const relationItems = productive.filter(id => classifyValue(id)?.semanticType === 'relation')
  assert.equal(relationItems.length, 3, "the blueprint's relation set is three neutral relations")
  /* everything the arc teaches is declared as A1's share */
  for (const id of productive) {
    assert.ok(A1_INTRODUCED_ITEMS.includes(id), `${id} is taught by arc 3 and not declared as A1's`)
  }
  /* receptive items are never counted as production */
  const produced = new Set(ARC3_REQUIRED.flatMap(id => a1ProductiveItemsOf(id)))
  for (const id of A1_RECEPTIVE_ITEMS) {
    assert.ok(!produced.has(id), `${id} is receptive and is being counted as produced`)
  }
  /* the third-person -s forms are HEARD and never required */
  for (const id of ['works_third', 'studies_third']) {
    assert.ok(A1_RECEPTIVE_ITEMS.includes(id), `${id} must be receptive`)
    assert.ok(!granted.includes(id), `${id} is receptive and must not be granted as production`)
  }
  /* and Pre-A1's required core has not moved */
  assert.equal(requiredLevelItems().length, 24, "Pre-A1's required core must not change")
  ok()
}

/* ---- 12) every key the arc renders exists in all eight locales ---- */
{
  const keys = new Set()
  for (const ep of A1_ARC3) {
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
  /* the evaluators' own keys, read out of the source */
  const evaluator = read('src/learning/engine/responseEvaluation.js')
  const arcSection = evaluator.slice(evaluator.indexOf('A1 ARC 3'), evaluator.indexOf('DO_YOU_QUESTION'))
  for (const [, key] of arcSection.matchAll(/'(ep2[456][A-Za-z]+)'/g)) keys.add(key)

  assert.ok(keys.size >= 55, `the arc should render plenty of text, found ${keys.size} keys`)
  for (const key of keys) {
    assert.ok(localeKeyPresent(key), `${key} is missing from at least one locale`)
  }
  console.log(`  ${keys.size} keys present in all eight locales`)
  ok()
}

/* ---- 13) NO STORY, and unknown objectives cannot borrow one ---- */
{
  /*
   * STATED, NOT OMITTED. The blueprint says `miniStory.use: false` for this arc,
   * with a reason: "Three-way introductions are better felt as a roleplay with a
   * named partner than as a narrated scene." So arc 3 hosts no story and does not
   * become the first consumer of the story-personalisation contract — and that is a
   * finding, not something forgotten.
   */
  assert.equal(arc3.miniStory.use, false, 'the design declines a story for this arc')
  assert.match(arc3.miniStory.why, /roleplay/, 'and says why')
  for (const ep of A1_ARC3) {
    for (const step of ep.steps || []) {
      assert.notEqual(step.type, 'mini_story', `${ep.id} hosts a story the design declined`)
    }
  }
  /* what it uses instead: the roleplay format the blueprint listed */
  assert.ok(arc3.likelyFormats.includes('roleplay'))
  const roleplays = A1_ARC3.flatMap(ep => (ep.steps || []).filter(s => s.format === 'roleplay'))
  assert.ok(roleplays.length >= 3, 'the arc is carried by roleplay turns, as designed')

  /*
   * AND THE SYSTEMIC FIX HOLDS. Both new intents have no story, so neither may be
   * planned as a `mini_story` block and neither may resolve to somebody else's
   * scene. This is the general rule — fail closed on an unknown objective — checked
   * here against the objectives this arc introduced; `check:memory-and-story` owns
   * the permanent regression for strangers in general.
   */
  for (const intent of a1IntentsOf('introduce_someone_else')) {
    assert.equal(formatSupportsObjective('mini_story', intent), false,
      `${intent} has no story and must never be planned as one`)
    assert.equal(getStory(intent), null, `${intent} must not borrow another objective's story`)
    assert.equal(hasStory(intent), false)
    /* the formats it CAN take are still available */
    assert.equal(formatSupportsObjective('free_reply', intent), true, `${intent} must be answerable`)
  }
  /* no story personalisation is declared anywhere for this arc */
  const storySource = read('src/learning/engine/miniStory.js')
  for (const intent of a1IntentsOf('introduce_someone_else')) {
    assert.ok(!storySource.includes(`${intent}: {`), `${intent} has a story entry the design declined`)
  }
  ok()
}

/* ---- 14) NO FACT IS CAPTURED, and that is the design ---- */
{
  /*
   * ALSO STATED. `factsCaptured: []` — arc 3 is about a person the EPISODE named,
   * not about the learner's own life, so the check arcs 1 and 2 use to prove a fact
   * was stored is inverted here.
   *
   * "No fact" means NO NEW FACT. Capture is an engine rule, not an episode feature:
   * a learner who says "I work at the office" during arc 3's reused `state_life_fact`
   * turn has stated arc 1's fact, and the engine stores it wherever it is said. What
   * this arc must not do is introduce a fact of its own — and the fact it could
   * plausibly have introduced is the one the design names and refuses.
   */
  assert.deepEqual(arc3.factsCaptured, [], 'arc 3 is designed to capture no fact')
  /*
   * And the one thing this arc could plausibly have stored is named and REFUSED by
   * the design: `relation_names`, `store: false`, "Naming a learner's family is
   * personal data with no reuse the curriculum needs; the arc works with a neutral
   * partner." So the learner model must not even be able to hold it.
   */
  const refused = BLUEPRINT.factsToCapture.find(f => f.id === 'relation_names')
  assert.ok(refused, 'the design must say what it decided not to store')
  assert.equal(refused.store, false)
  assert.equal(refused.semanticType, 'relation', "it is exactly this arc's type")
  assert.ok(!FACT_TYPES.includes('relation_names'),
    'the learner model must not be able to hold a fact marked store:false')
  assert.ok(!BLUEPRINT.personalization.safeSlots.includes('relation_names'),
    'nor may it be personalised with')

  const played = createLearnerModel()
  A1_ARC3.forEach((ep, i) => playEpisode(played, ep.id, { profile: STRONG, atMs: AT + i * 1000 }))
  /*
   * Whatever arc 3 stores must be a fact an EARLIER arc designed and this one merely
   * reuses the turn for. Anything else is a fact this arc invented.
   */
  const inherited = new Set(BLUEPRINT.arcs
    .filter(a => A1_RUNTIME_ARCS.includes(a.id) && a.order < arc3.order)
    .flatMap(a => a.factsCaptured || []))
  for (const fact of played.learnerFacts || []) {
    assert.ok(inherited.has(fact.type),
      `arc 3 stored a ${fact.type} fact and declared none of its own`)
    assert.ok(A1_ARC3.some(ep => ep.id === fact.sourceEpisodeId),
      'and a fact stored here must name the arc-3 episode that heard it')
  }
  for (const type of FACT_TYPES.filter(t => !inherited.has(t))) {
    assert.equal(factsOfType(played, type).length, 0,
      `arc 3 stored a ${type} fact it was not designed to`)
  }
  /* nothing of this arc's own type — the refused one — is stored under any name */
  for (const fact of played.learnerFacts || []) {
    assert.notEqual(classifyValue(fact.value)?.semanticType, 'relation',
      'a relation must never become a stored fact')
  }
  /*
   * AND THE PARTNER'S NAME IS NEVER STORED. It is a property of the task, invented
   * per learner for the roleplay; storing it would turn a prop into a fact about
   * somebody in the learner's life.
   */
  const serialised = JSON.stringify(played)
  assert.ok(!serialised.includes(PARTNER), `${PARTNER} is a roleplay prop and reached the learner model`)
  for (const ep of A1_ARC3) {
    for (const step of ep.steps || []) {
      assert.ok(!step.captureFact, `${ep.id} captures a fact the arc declared none of`)
    }
  }
  ok()
}

/* ---- 15) the reuse matrix, exercised rather than declared ---- */
{
  /*
   * This is the arc where A1 has to feel cumulative: eight capabilities return in
   * this column, one of them marked `C` — consolidated, the whole conversation held
   * at once in episode 26. A capability marked to return must be EVALUATED by a step
   * of this arc; a mention in a metadata list is how a review unit gets built by
   * accident.
   */
  const column = BLUEPRINT.reuseMatrix.arcOrder.indexOf(arc3.id)
  assert.ok(column >= 0, 'the reuse matrix must have a column for this arc')
  const markOf = (canDoId) => BLUEPRINT.reuseMatrix.rows[canDoId][column]
  const reused = Object.keys(BLUEPRINT.reuseMatrix.rows).filter(id => markOf(id) === 'R')
  const consolidated = Object.keys(BLUEPRINT.reuseMatrix.rows).filter(id => markOf(id) === 'C')
  assert.ok(reused.length + consolidated.length >= 8,
    `the blueprint schedules ${reused.length + consolidated.length} capabilities to return`)

  const known = { ...PRE_A1_CAN_DO_INTENT, ...A1_CAN_DO_INTENT }
  const evaluated = new Set(A1_ARC3.flatMap(ep => intentsForEpisode(ep.id)))
  const missed = reused.filter((canDoId) => {
    const intent = known[canDoId]
    /* a capability no implemented level teaches cannot be reused yet */
    if (!intent) return false
    return !evaluated.has(intent)
  })
  assert.deepEqual(missed, [],
    `the blueprint schedules these to return in this arc and no step evaluates them: ${missed.join(', ')}`)

  /*
   * `C` IS NOT `R`, and the legend says so: "consolidated in an integrated
   * conversation". `R` is a promise about the ARC — the capability comes back
   * somewhere in it — and the assertion above is what checks that. `C` is a promise
   * about ONE EPISODE: the whole exchange is held at once. That is not a step type,
   * so it is checked as the shape of a conversation — opened with a greeting, closed
   * with a closing, several distinct capabilities in between, in a single episode.
   */
  assert.deepEqual(consolidated, ['full_conversation'], 'one capability is consolidated here')
  assert.match(BLUEPRINT.reuseMatrix.legend.C, /integrated conversation/)
  const lastEpisode = A1_ARC3.at(-1)
  /*
   * The CONVERSATION is the roleplay chain. A recall turn after the goodbye is a
   * coda, not part of the exchange, so the shape is read off the roleplay steps —
   * otherwise "it ends with a closing" would be a claim about step ordering rather
   * than about the conversation.
   */
  const chain = (lastEpisode.steps || [])
    .filter(step => step.format === 'roleplay' && step.evalKind)
    .map(step => step.evalKind)
  const evaluatedTurns = (lastEpisode.steps || [])
    .filter(step => step.type === 'free_reply' || step.type === 'recall').length
  assert.ok(evaluatedTurns >= arc3.conversationTarget.meaningfulTurns - 2,
    `the integrated episode holds ${evaluatedTurns} evaluated turns`)
  assert.ok(new Set(chain).size >= 5,
    `an integrated conversation needs several capabilities at once, found ${new Set(chain).size}`)
  assert.ok(['introduction', 'nice_to_meet'].includes(chain[0]),
    'it must open the way a conversation opens')
  assert.equal(chain.at(-1), 'close_encounter', 'and end the way one ends')
  assert.ok(chain.includes(A1_CAN_DO_INTENT.introduce_someone_else),
    "with the arc's own capability inside the sequence rather than beside it")
  /* and only that episode holds the whole sequence — the others build up to it */
  for (const ep of A1_ARC3.slice(0, -1)) {
    const here = new Set(intentsForEpisode(ep.id))
    assert.ok(!(here.has('nice_to_meet') && here.has('close_encounter')),
      `${ep.id} holds a whole conversation; the design integrates it once, at the end`)
  }
  /* the learner has to ask something of their own in it, as the design requires */
  assert.ok(chain.filter(kind => /^ask_/.test(kind)).length >= arc3.conversationTarget.learnerInitiatedQuestions,
    'the integrated conversation must include a question the learner initiates')

  /* the arc's own declared reuse is exercised too */
  for (const ep of A1_ARC3) {
    for (const skill of ep.reuseSkills || []) {
      const intent = known[skill] || skill
      assert.ok(intentsForEpisode(ep.id).includes(intent),
        `${ep.id} declares reuse of ${skill} and no step evaluates it`)
    }
  }
  /* no episode is a review unit: every one of them teaches something of its own */
  for (const ep of A1_ARC3) {
    assert.ok(a1IntentsOf(ep.canDoId).some(i => intentsForEpisode(ep.id).includes(i)),
      `${ep.id} reuses and never teaches`)
  }
  /*
   * AUTONOMY: "mid-level: the suggestion is withheld on the integrated episode".
   * The last episode's own turns must include unaided ones — a suggestion on every
   * turn would make the evidence target unreachable by construction.
   */
  assert.match(arc3.autonomyTarget, /withheld/)
  const integrated = A1_ARC3.at(-1)
  const openTurns = (integrated.steps || []).filter(s => s.type === 'free_reply')
  assert.ok(openTurns.length >= arc3.conversationTarget.learnerOpenTurns,
    `the integrated episode has ${openTurns.length} open turns, target ${arc3.conversationTarget.learnerOpenTurns}`)
  assert.ok(openTurns.some(s => !s.suggestionEn),
    'the integrated episode must withhold the suggestion somewhere')
  console.log(`  ${reused.length} older capabilities return inside the arc,`
    + ` ${consolidated.length} consolidated in ${lastEpisode.id}`)
  ok()
}

/* ---- 16) the arc is playable, and reaches its evidence target INSIDE the arc ---- */
{
  const model = createLearnerModel()
  let xp = 0
  A1_ARC3.forEach((ep, index) => {
    const result = playEpisode(model, ep.id, { profile: STRONG, atMs: AT + index * 1000 })
    xp += result.xp
    assert.equal(model.episodes[ep.id].status, 'completed', `${ep.id} must be completable`)
  })
  assert.equal(xp, A1_ARC3.reduce((sum, ep) => sum + ep.xp, 0), 'the arc awards exactly its own XP')

  for (const canDo of ARC3_REQUIRED) {
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
   * THE STRUCTURAL DIFFERENCE FROM ARCS 1 AND 2, stated as an assertion. The engine
   * records a can-do once per episode RUN. Arcs 1 and 2 taught three capabilities
   * across three episodes, so one pass gave each of them exactly one unaided use and
   * the second had to come from a later run. Arc 3 teaches ONE capability across
   * three episodes, so a single pass produces three — and the capability reaches the
   * blueprint's lifetime target of two WITHIN the arc, which is precisely what its
   * evidence target describes: "two unaided introductions of a third person, one of
   * them inside a greeting sequence".
   */
  const spec = BLUEPRINT.canDos.find(c => c.id === 'introduce_someone_else')
  assert.equal(spec.evidence.independent, 2, "the capability's lifetime target is two unaided uses")
  assert.match(arc3.evidenceTarget, /two unaided introductions/)
  const record = model.canDo.introduce_someone_else
  assert.equal(record.independentSuccesses, A1_ARC3.length,
    'three episodes teaching one capability give it three unaided uses in one pass')
  assert.ok(record.independentSuccesses >= spec.evidence.independent,
    'so the target is reached inside the arc')
  assert.equal(record.status, 'can_do', 'and the capability is recorded as held')
  /*
   * REACHING A CAN-DO TARGET IS NOT READINESS, GRADUATION OR A MILESTONE. The
   * blueprint leaves A1's readiness threshold deliberately unchosen, and a check
   * must not invent one.
   */
  const readinessNote = BLUEPRINT.exitCriteria.readinessDimensionsForA2
    .find(d => d.dimension === 'required capabilities produced unaided')
  assert.match(readinessNote.note, /the number is chosen when there is evidence from real journeys, not now/,
    'the threshold is deliberately unchosen; a check must not invent one')

  /* replaying grants no second reward, and no new items */
  const replay = playEpisode(model, A1_ARC3[0].id, { profile: STRONG, atMs: AT + 10_000 })
  assert.equal(replay.xp, 0, 'a replay must not pay the base reward twice')
  const gardenAfterReplay = Object.keys(model.languageItems).length
  playEpisode(model, A1_ARC3[0].id, { profile: STRONG, atMs: AT + 20_000 })
  assert.equal(Object.keys(model.languageItems).length, gardenAfterReplay,
    'a replay must not grant new items')

  /* an assisted learner can finish it, with weaker evidence */
  const assisted = createLearnerModel()
  A1_ARC3.forEach((ep, index) => {
    playEpisode(assisted, ep.id, { profile: ASSISTED, atMs: AT + index * 1000 })
    assert.equal(assisted.episodes[ep.id].status, 'completed', `${ep.id} must be finishable with help`)
  })
  for (const canDo of ARC3_REQUIRED) {
    assert.ok(assisted.canDo[canDo], `${canDo} must still record something for an assisted learner`)
  }
  assert.ok(assisted.canDo.introduce_someone_else.independentSuccesses
    < model.canDo.introduce_someone_else.independentSuccesses,
  'help must produce weaker evidence than unaided production')
  console.log(`  the arc plays: ${xp} XP, ${A1_ARC3.length} episodes,`
    + ` ${record.independentSuccesses} unaided uses of ${ARC3_REQUIRED.join(', ')}`)
  ok()
}

/* ---- 17) arc 1 → arc 2 → arc 3: the level is cumulative, played not asserted ---- */
{
  const model = createLearnerModel()
  const order = [...A1_ARC1, ...A1_ARC2, ...A1_ARC3]
  let xp = 0
  order.forEach((ep, index) => {
    const result = playEpisode(model, ep.id, { profile: STRONG, atMs: AT + index * 1000 })
    xp += result.xp
    assert.equal(model.episodes[ep.id].status, 'completed', `${ep.id} must be completable in sequence`)
  })
  assert.equal(xp, order.reduce((sum, ep) => sum + ep.xp, 0), 'the three arcs award exactly their own XP')

  /* every capability these three arcs teach has unaided evidence */
  for (const canDo of [...new Set(order.map(ep => ep.canDoId))]) {
    assert.ok(model.canDo[canDo], `${canDo} has no evidence after playing three arcs`)
    assert.ok(model.canDo[canDo].independentSuccesses >= 1, `${canDo} has no unaided use`)
  }
  /*
   * The older frames keep growing rather than being overwritten. How MUCH they grow
   * is the engine's business — a can-do is credited once per episode run, and a
   * reused turn inside an episode that teaches something else does not always credit
   * it again — so what is asserted is the direction: arc 1's statement frame has
   * more unaided evidence after three arcs than the one use arc 1 itself gave it,
   * and arc 3 took nothing away.
   */
  const afterTwoArcs = createLearnerModel()
  ;[...A1_ARC1, ...A1_ARC2].forEach((ep, i) => playEpisode(afterTwoArcs, ep.id, { profile: STRONG, atMs: AT + i * 1000 }))
  for (const [canDo, record] of Object.entries(afterTwoArcs.canDo)) {
    assert.ok(model.canDo[canDo].independentSuccesses >= record.independentSuccesses,
      `${canDo} lost evidence when arc 3 was played after it`)
  }
  assert.ok(model.canDo.talk_about_work_or_study.independentSuccesses >= 2,
    "arc 1's frame comes back later in the level, so its evidence should keep growing")
  /*
   * The earlier arcs' facts survive, and arc 3 adds no fact TYPE of its own. Counts
   * are deliberately not asserted: one type may hold several values — a learner can
   * both work at an office and study at a university, and the model keeps both with
   * their own confidence — so "exactly one" would be a claim about what the harness
   * happens to type, not about the design.
   */
  assert.ok(factsOfType(model, 'work_or_study').length >= 1, "arc 1's fact survives arc 3")
  assert.ok(factsOfType(model, 'usual_time').length >= 1, "and so does arc 2's")
  const typesStored = new Set((model.learnerFacts || []).map(f => f.type))
  assert.deepEqual([...typesStored].sort(), ['usual_time', 'work_or_study'],
    'arc 3 introduces no fact type of its own')

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
  console.log(`  arc 1 → 2 → 3 plays end to end: ${xp} XP over ${order.length} episodes`)
  ok()
}

/* ---- 18) THE RENDER CONTRACT: every step gives its renderer what it reads ---- */
{
  /*
   * The assertion arc 1 shipped without: `EpisodeShell` dereferences specific fields
   * per step type, and authoring against invented names is silent until a browser
   * draws it. Arc 3's steps are held to the same contract.
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
  const KNOWN_INTENTS = new Set([
    ...Object.values(PRE_A1_CAN_DO_INTENT), ...Object.keys(A1_CAN_DO_INTENT).flatMap(a1IntentsOf),
    'state_life_fact', 'ask_life_fact', 'express_like', 'use_quantity', 'repair_request',
    'ask_name', 'ask_origin', 'close_encounter', 'state_routine', 'introduction', 'nice_to_meet',
  ])
  for (const ep of A1_ARC3) {
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
      if (step.type === 'free_reply' || step.type === 'recall') {
        assert.ok(KNOWN_INTENTS.has(step.evalKind), `${where}: ${step.evalKind} is graded by nobody`)
      }
      if (step.type === 'free_reply') {
        assert.ok(step.promptEn || step.sceneEn, `${where}: a free turn needs a prompt or a scene`)
      }
      if (step.repairKind) {
        assert.ok(REPAIR_KINDS.includes(step.repairKind), `${where}: unknown repair strategy`)
      }
      if (step.meaningWord) {
        assert.equal(step.repairKind, 'ask_meaning', `${where}: a word to ask about needs the meaning strategy`)
      }
      /*
       * EVERY PLACEHOLDER MUST ALWAYS RESOLVE. The engine leaves an unfilled
       * placeholder in place rather than printing "undefined", so `{something}`
       * reaching a learner is a visible bug. `{name}` and `{partner}` cannot: the
       * shell derives both, deterministically, per learner.
       */
      const PROSE = ['promptEn', 'sceneEn', 'suggestionEn', 'target', 'response']
      const text = [...PROSE.map(f => step[f]), ...(step.tokens || []),
        ...(step.options || []).map(o => o.textEn), step.before, step.after].filter(Boolean).join(' ')
      for (const [, placeholder] of text.matchAll(/\{(\w+)\}/g)) {
        assert.ok(['name', 'partner', 'noun'].includes(placeholder),
          `${where}: {${placeholder}} has no guaranteed value, so it could reach the learner unfilled`)
      }
      /* personalisation is read from the prose, never declared on the step */
      for (const dead of ['personalizes', 'personalises']) {
        assert.ok(!(dead in step), `${where}: personalisation is read from the prose, not \`${dead}\``)
      }
    }
  }
  /* and what the arc does personalise is one of the blueprint's safe slots */
  for (const slot of new Set(A1_ARC3.flatMap(ep => personalisesOf(ep.id)))) {
    const name = slot.replace(/^fact:/, '')
    assert.ok(BLUEPRINT.personalization.safeSlots.includes(name)
      || ['semantic', 'noun', 'partner'].includes(name),
    `${slot} is not one of the blueprint's safe slots`)
  }
  ok()
}

console.log(`\ncheck-a1-arc3 — OK  (${groups} arc groups verified)`)
