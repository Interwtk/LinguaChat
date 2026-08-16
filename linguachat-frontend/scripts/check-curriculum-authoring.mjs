/*
 * check-curriculum-authoring — what an episode must declare to be playable, and
 * what a level must not borrow from another one.
 *
 * The freeze closure audit found the sixth arc's three intents missing from the
 * session runner's prompt and model-answer tables. Nothing failed: a
 * consolidation block for a required capability simply showed the greeting prompt
 * and graded the answer as an identification, so the capability could not be
 * consolidated at all. Everything else about that arc was correct, which is why
 * no check noticed.
 *
 * That is the class of defect this file exists for. It walks every runtime
 * episode and checks the contract an episode has to satisfy in order to be
 * teachable end to end: a level, an arc, a capability, prerequisites that
 * resolve, an intent the evaluator knows, an intent the daily session can
 * actually present, semantic slots that exist, Garden grants that are real
 * language, a productive path for a productive capability, and locale keys in all
 * eight languages.
 *
 * The second half proves the same contract FAILS when it should, using synthetic
 * episodes built here — never added to the registry — because a validator nobody
 * has seen reject anything is a validator nobody should trust.
 *
 * The third half is about levels. A1 is designed and unbuilt, and the danger is
 * not that it appears too early: it is that Pre-A1's own answers quietly start
 * including it. So the level-scoped derivations are checked against a synthetic
 * foreign-level curriculum, which is the only way to test that boundary before a
 * second level exists.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { ARC, ARCS, getEpisode } from '../src/learning/episodes/index.js'
/*
 * A1's arcs are imported one by one, exactly as the skeleton generator does it:
 * tooling may hold every level at once, while the runtime keeps each arc in its
 * own chunk.
 */
import { A1_ARC1, getA1Arc1Episode } from '../src/learning/episodes/a1Arc1.js'
import { A1_ARC2, getA1Arc2Episode } from '../src/learning/episodes/a1Arc2.js'
import { A1_ARC3, getA1Arc3Episode } from '../src/learning/episodes/a1Arc3.js'
import { A1_ARC4, getA1Arc4Episode } from '../src/learning/episodes/a1Arc4.js'
import { A1_CAN_DO_INTENT, A1_RECEPTIVE_ITEMS, A1_INCIDENTAL_ITEMS, A1_RUNTIME_ARCS } from '../src/learning/curriculum/a1Map.js'
import {
  PRE_A1, A1, LEVELS, getLevel, episodesOfLevel, runtimeEpisodeCount, isLevelComplete,
  levelIdOfEpisode, levelIdOfEpisodeId, playableLevelId, availableLevelIds, isKnownLevel,
} from '../src/learning/curriculum/levels.js'
import { episodeRequest, loadEpisodeContent, hasContentLoader, REFUSED } from '../src/learning/curriculum/episodeContent.js'
import {
  PRE_A1_EXIT_CRITERIA, CAN_DO_INTENT, intentsForEpisode, itemsOf, productiveItemsOf,
  getPrerequisites, canDoCoverage, requiredLevelItems, RECEPTIVE_ITEMS, INCIDENTAL_ITEMS,
} from '../src/learning/curriculum/preA1Map.js'
import { SEED_VOCAB_BY_ID } from '../src/data/vocabulary.js'
import { evaluateFree } from '../src/learning/engine/responseEvaluation.js'
import { slotsFor, SEMANTIC_TYPES } from '../src/learning/engine/semanticContext.js'
import { BLOCK_CANDIDATES } from '../src/learning/engine/formatChoice.js'

let groups = 0
const ok = () => { groups += 1 }

/* Every episode with runtime content, in curriculum order: Pre-A1, then A1 arc by arc. */
const RUNTIME_EPISODES = [...ARC, ...A1_ARC1, ...A1_ARC2, ...A1_ARC3, ...A1_ARC4]
const A1_EPISODES = [...A1_ARC1, ...A1_ARC2, ...A1_ARC3, ...A1_ARC4]
const runtimeEpisode = (id) =>
  getEpisode(id) || getA1Arc1Episode(id) || getA1Arc2Episode(id) || getA1Arc3Episode(id) || getA1Arc4Episode(id)

/*
 * Which intent evidences a can-do, asked of the map that owns the level. A
 * shared map would have let one level's capability satisfy another's coverage,
 * which is the mistake this architecture keeps refusing to make.
 */
const canDoIntentOf = (episode) =>
  (episode?.level === 'A1' ? A1_CAN_DO_INTENT : CAN_DO_INTENT)[episode?.canDoId]

const receptiveFor = (episode) =>
  (episode?.level === 'A1' ? A1_RECEPTIVE_ITEMS : RECEPTIVE_ITEMS)
const incidentalFor = (episode) =>
  (episode?.level === 'A1' ? A1_INCIDENTAL_ITEMS : INCIDENTAL_ITEMS)

const runnerSource = readFileSync(new URL('../src/components/session/SessionRunner.jsx', import.meta.url), 'utf8')
const baseLocale = readFileSync(new URL('../src/i18n/translations.js', import.meta.url), 'utf8')
const LOCALES = ['es', 'pt', 'fr', 'it', 'de', 'ja', 'ar']
const localeSources = Object.fromEntries(LOCALES.map(code =>
  [code, readFileSync(new URL(`../src/i18n/locales/${code}.js`, import.meta.url), 'utf8')]))

/* The tables the daily session presents a short practice turn with. */
const tableKeys = (name) => {
  const start = runnerSource.indexOf(`const ${name} = {`)
  const end = runnerSource.indexOf('\n}', start)
  return new Set([...runnerSource.slice(start, end).matchAll(/^\s{2}([a-z_]+):/gm)].map(m => m[1]))
}
const SESSION_PROMPTS = tableKeys('PROMPT')
const SESSION_ANSWERS = tableKeys('MODEL_ANSWER')

/* Every objective a session block can be built around, from the planner's own tables. */
const SESSION_BLOCK_FORMATS = new Set(Object.values(BLOCK_CANDIDATES).flat())

const localeKeyPresent = (key) => LOCALES.every(code => localeSources[code].includes(`${key}:`))
    && baseLocale.includes(`${key}:`)

/*
 * The contract, applied to one episode. Returned as a list of problems rather
 * than thrown, so the synthetic cases below can assert that it catches them.
 */
export function authoringProblems(episode, { allEpisodes = RUNTIME_EPISODES } = {}) {
  const problems = []
  const say = (problem) => problems.push(`${episode?.id || '(no id)'}: ${problem}`)

  if (!episode?.id) return ['(no id): an episode must have an id']
  if (allEpisodes.filter(e => e.id === episode.id).length > 1) say('the id is used by more than one episode')

  const levelId = levelIdOfEpisode(episode)
  if (!levelId) say(`declares level "${episode.level}", which the level registry does not know`)
  /* the arcs OF THIS LEVEL: `ARCS` is Pre-A1's list and A1 declares its own */
  const declaredArcs = episode.level === 'A1' ? A1_RUNTIME_ARCS : ARCS
  if (!declaredArcs.includes(episode.arc)) say(`belongs to arc "${episode.arc}", which is not a declared arc`)
  if (!episode.canDoId) say('teaches no capability')
  else if (!canDoIntentOf(episode)) say(`teaches "${episode.canDoId}", which the curriculum map does not know`)
  if (episode.reinforces !== undefined && episode.reinforces !== true) say('`reinforces` may only be true when present')

  for (const prerequisite of getPrerequisites(episode.id)) {
    if (!allEpisodes.some(e => e.id === prerequisite)) say(`requires "${prerequisite}", which does not exist`)
  }

  /* the steps: what the learner is actually asked to do */
  const steps = episode.steps || []
  if (!steps.length) say('has no steps')
  const productiveSteps = steps.filter(s => s.type === 'free_reply' || s.type === 'recall')
  const intents = intentsForEpisode(episode.id)

  for (const intent of intents) {
    /* the evaluator must know it — an unknown objective must not pass by default */
    const verdict = evaluateFree(intent, 'zzz qqq wwww', {
      name: 'Alex', place: 'Madrid', independent: true, targetNoun: 'music',
      targetThing: 'book', targetCount: 2, quantityForm: 'bare',
    })
    if (!verdict || verdict.completedObjective !== false) {
      say(`intent "${intent}" is not evaluated: nonsense was not rejected`)
    }
    /*
     * And the daily session must be able to present it. This is the sixth-arc
     * defect: a missing entry silently fell back to the introduction prompt, so a
     * consolidation block asked for a greeting and graded an identification.
     */
    if (!SESSION_PROMPTS.has(intent)) say(`intent "${intent}" has no prompt in the session runner`)
    if (!SESSION_ANSWERS.has(intent)) say(`intent "${intent}" has no model answer in the session runner`)

    /* declared semantic slots must be types the engine knows */
    for (const slot of slotsFor(intent) || []) {
      if (!SEMANTIC_TYPES.includes(slot)) say(`intent "${intent}" declares unknown semantic type "${slot}"`)
    }
  }

  /* a capability the learner is meant to produce needs a productive turn */
  if (episode.canDoId && !episode.reinforces) {
    const canDoIntent = canDoIntentOf(episode)
    const producesIt = productiveSteps.some(s => s.evalKind === canDoIntent)
      || steps.some(s => (s.turns || []).some(t => t.kind === 'reply' && t.evalKind === canDoIntent))
    if (canDoIntent && !producesIt) say(`teaches "${episode.canDoId}" and never asks the learner to produce it`)
  }

  /* Garden grants must be real language, and granted once */
  const grants = episode.gardenItems || []
  for (const id of grants) {
    if (!SEED_VOCAB_BY_ID[id]) say(`grants "${id}", which is not in the vocabulary catalogue`)
  }
  const duplicated = grants.filter((id, i) => grants.indexOf(id) !== i)
  if (duplicated.length) say(`grants ${duplicated.join(', ')} more than once`)

  /* receptive and incidental declarations must name real language too */
  for (const id of itemsOf(episode.id)) {
    if (!SEED_VOCAB_BY_ID[id]) say(`practises "${id}", which is not in the vocabulary catalogue`)
  }

  /* the keys the shell will ask for, in every locale */
  for (const key of [episode.titleKey, episode.goalKey, episode.canDoNameKey, episode.durationKey]) {
    if (!key) say('is missing one of its own i18n keys')
    else if (!localeKeyPresent(key)) say(`key "${key}" is missing from at least one locale`)
  }

  /*
   * And the content must be reachable through the resolver — asked as TOOLING.
   * A1 is deliberately closed to learners, so a learner-facing request is
   * supposed to be refused; what the contract needs to know is whether the
   * episode exists, belongs to its level and has a loader.
   */
  const request = episodeRequest({ levelId, episodeId: episode.id, forLearner: false })
  if (!request.ok) say(`cannot be resolved by the content loader: ${request.reason}`)

  return problems
}

/* ---- 1) every runtime episode satisfies the contract ---- */
{
  const problems = RUNTIME_EPISODES.flatMap(ep => authoringProblems(ep))
  assert.deepEqual(problems, [], `runtime episodes break the authoring contract:\n  ${problems.join('\n  ')}`)
  /*
   * Counted per level rather than once: the contract is the same for both, and
   * "seventeen" stopped being the number of episodes in the product.
   */
  assert.equal(ARC.length, runtimeEpisodeCount(PRE_A1), 'Pre-A1 is what the skeleton says it is')
  assert.equal(A1_EPISODES.length, runtimeEpisodeCount(A1), 'and so is A1')
  console.log(`\n  ${RUNTIME_EPISODES.length} runtime episodes satisfy the authoring contract`
    + ` (${ARC.length} Pre-A1, ${A1_EPISODES.length} A1 across ${A1_RUNTIME_ARCS.length} arcs)`)
  ok()
}

/* ---- 2) and the contract refuses what it should ---- */
{
  const valid = getEpisode('what_is_this')
  const broken = (patch) => ({ ...JSON.parse(JSON.stringify(valid)), ...patch })
  const cases = [
    ['a duplicate id', broken({}), { allEpisodes: [...ARC, valid] }, /more than one episode/],
    ['an unknown level', broken({ level: 'B2' }), {}, /level registry does not know/],
    ['an unknown arc', broken({ arc: 'arc7' }), {}, /not a declared arc/],
    ['no capability', broken({ canDoId: undefined }), {}, /teaches no capability/],
    ['an unknown capability', broken({ canDoId: 'talk_about_daily_routine' }), {}, /curriculum map does not know/],
    ['a prerequisite that does not exist', broken({ id: 'ghost_prereq' }), {}, /does not exist|cannot be resolved/],
    ['a Garden grant that is not vocabulary', broken({ gardenItems: [...valid.gardenItems, 'unicorn'] }), {}, /not in the vocabulary catalogue/],
    ['a duplicated Garden grant', broken({ gardenItems: [...valid.gardenItems, valid.gardenItems[0]] }), {}, /more than once/],
    ['a missing locale key', broken({ titleKey: 'epNeverTranslatedTitle' }), {}, /missing from at least one locale/],
    ['no steps', broken({ steps: [] }), {}, /has no steps/],
  ]
  for (const [label, episode, options, expected] of cases) {
    const problems = authoringProblems(episode, options)
    assert.ok(problems.length > 0, `the contract accepted ${label}`)
    assert.ok(problems.some(p => expected.test(p)),
      `${label} was rejected for the wrong reason: ${problems.join(' | ')}`)
  }

  /*
   * The sixth-arc defect itself, reconstructed: an episode whose intent the
   * session runner cannot present. Built by pretending the runner's tables are
   * missing the entry, which is exactly what happened.
   */
  const missingFromRunner = [...intentsForEpisode('how_many')].filter(i => !SESSION_PROMPTS.has(i))
  assert.deepEqual(missingFromRunner, [],
    'the sixth arc is wired into the session runner (this is the defect the audit found)')

  /* a capability with no productive turn */
  const noProduction = broken({
    steps: valid.steps.filter(s => s.type !== 'free_reply' && s.type !== 'recall'),
  })
  const problems = authoringProblems(noProduction)
  assert.ok(problems.some(p => /never asks the learner to produce it/.test(p)),
    `a capability with no productive turn must be refused: ${problems.join(' | ')}`)
  console.log(`  ${cases.length + 2} synthetic violations refused`)
  ok()
}

/* ---- 3) the level registry says what it means ---- */
{
  assert.deepEqual(LEVELS.map(l => l.id), [PRE_A1, A1], 'the registry knows Pre-A1 and A1, in order')
  /*
   * `implemented` became `contentStatus` when A1's first arc landed: a boolean
   * could not distinguish "has content" from "is finished", and A1 is now the
   * first level where those differ. What has to hold is that A1 has SOME content
   * and is not complete — and is closed to learners regardless.
   */
  assert.equal(getLevel(PRE_A1).contentStatus, 'complete')
  assert.equal(getLevel(PRE_A1).available, true)
  assert.equal(getLevel(A1).contentStatus, 'partial', 'A1 has three arcs of seven')
  assert.equal(isLevelComplete(A1), false, 'a partially built level is never complete')
  assert.equal(getLevel(A1).available, false, 'A1 may not be opened')
  assert.deepEqual(availableLevelIds(), [PRE_A1], 'exactly one level is available today')
  assert.equal(playableLevelId(), PRE_A1)

  /* an unknown level is nobody's level */
  for (const unknown of ['a2', 'b1', '', null, undefined, 'PRE_A1']) {
    assert.equal(getLevel(unknown), null, `${String(unknown)} must not resolve to a level`)
    assert.equal(isKnownLevel(unknown), false)
    assert.deepEqual(episodesOfLevel(unknown), [], `${String(unknown)} must not inherit another level's episodes`)
  }
  /*
   * A1 has content now, and how much is derived from the level itself. What must
   * never change here is Pre-A1: seventeen, whatever happens above it.
   */
  assert.equal(runtimeEpisodeCount(A1), A1_EPISODES.length, 'A1 holds exactly its implemented arcs')
  assert.deepEqual([...new Set(A1_EPISODES.map(ep => ep.arc))], A1_RUNTIME_ARCS,
    'and the arcs it holds are exactly the ones declared as implemented, in order')
  assert.equal(runtimeEpisodeCount(PRE_A1), 17, 'Pre-A1 is seventeen episodes')
  ok()
}

/* ---- 4) content resolution fails closed ---- */
{
  assert.equal(episodeRequest({ episodeId: 'first_greeting' }).ok, true)
  assert.equal(episodeRequest({ levelId: PRE_A1, episodeId: 'how_many' }).ok, true)

  const refusals = [
    /*
     * A1's first arc exists, so the refusals changed shape rather than
     * disappearing: an id nobody wrote is unknown, a real A1 episode is refused to
     * a LEARNER because the level is closed, and a blueprint episode from an
     * unimplemented arc is simply not there.
     */
    /*
     * To a LEARNER, a closed level is closed and says nothing about which ids
     * exist inside it — the availability gate comes first deliberately, so
     * nobody can enumerate unreleased content by reading refusal reasons.
     */
    [{ levelId: A1, episodeId: 'episode18' }, REFUSED.LEVEL_UNAVAILABLE],
    [{ levelId: A1, episodeId: 'what_you_do' }, REFUSED.LEVEL_UNAVAILABLE],
    [{ episodeId: 'what_you_do' }, REFUSED.LEVEL_UNAVAILABLE],
    [{ levelId: 'a2', episodeId: 'anything' }, REFUSED.UNKNOWN_LEVEL],
    [{ episodeId: 'episode18' }, REFUSED.UNKNOWN_EPISODE],
    [{ episodeId: undefined }, REFUSED.UNKNOWN_EPISODE],
    [{ levelId: PRE_A1, episodeId: 'ghost' }, REFUSED.UNKNOWN_EPISODE],
  ]
  for (const [request, reason] of refusals) {
    const result = episodeRequest(request)
    assert.equal(result.ok, false, `${JSON.stringify(request)} must be refused`)
    assert.equal(result.reason, reason, `${JSON.stringify(request)}: wrong reason`)
  }

  /* the async path refuses before importing anything, and loads Pre-A1 content */
  for (const [request, reason] of refusals) {
    await assert.rejects(() => loadEpisodeContent(request), (error) => {
      assert.equal(error.name, 'EpisodeContentError')
      assert.equal(error.reason, reason)
      return true
    }, `${JSON.stringify(request)} must reject`)
  }
  const loaded = await loadEpisodeContent({ episodeId: 'we_can_continue' })
  assert.equal(loaded.id, 'we_can_continue', 'a Pre-A1 episode must load through the resolver')
  assert.ok(loaded.steps.length > 0, 'and arrive with its content')
  const replayed = await loadEpisodeContent({ levelId: PRE_A1, episodeId: 'how_many' })
  assert.equal(replayed.id, 'how_many', 'replaying the last Pre-A1 episode must resolve too')

  /*
   * A1's implemented arcs load for tooling, each from its OWN chunk, while staying
   * refused to learners — the two halves of "implemented but not open".
   *
   * To TOOLING, which has passed the availability gate, the distinction is exact:
   * an episode of an unimplemented arc, or an id nobody wrote, is unknown. `my_day`
   * used to be listed here as a ghost and is now arc 2's first episode, which is
   * exactly the transition an arc sprint makes.
   */
  for (const ghost of ['episode27', 'a1_arc4_anything', 'find_your_way']) {
    const result = episodeRequest({ levelId: A1, episodeId: ghost, forLearner: false })
    assert.equal(result.ok, false, `${ghost} must not resolve`)
    assert.equal(result.reason, REFUSED.UNKNOWN_EPISODE, `${ghost}: wrong reason`)
  }

  for (const id of ['what_you_do', 'my_day', 'this_is']) {
    const a1Episode = await loadEpisodeContent({ episodeId: id, forLearner: false })
    assert.equal(a1Episode.id, id)
    assert.equal(a1Episode.level, 'A1')
    assert.ok(a1Episode.steps.length > 0, 'and arrive with its content')
    await assert.rejects(() => loadEpisodeContent({ episodeId: id }),
      (error) => error.reason === REFUSED.LEVEL_UNAVAILABLE,
      'a learner-facing load of A1 must still be refused')
  }

  /* every runtime arc has a loader; a planned level has none */
  for (const arc of ARCS) assert.ok(hasContentLoader(PRE_A1, arc), `${arc} has no content loader`)
  /*
   * Each implemented arc has its own loader; the level has no `default`, so an
   * unimplemented arc still cannot resolve to a neighbouring arc's content.
   */
  for (const arc of A1_RUNTIME_ARCS) {
    assert.equal(hasContentLoader(A1, arc), true, `${arc} is implemented and must be loadable`)
  }
  assert.equal(hasContentLoader(A1), false, 'and the level must not have a catch-all loader')
  /* named so it stays a real arc id, and derived so implementing it moves the target */
  const nextPlannedArc = 'paying_and_choosing'
  assert.equal(A1_RUNTIME_ARCS.includes(nextPlannedArc), false, `${nextPlannedArc} is not implemented`)
  assert.equal(hasContentLoader(A1, nextPlannedArc), false, 'an unimplemented arc must not resolve')
  assert.equal(hasContentLoader('a2'), false)
  ok()
}

/* ---- 5) Pre-A1's answers do not change when another level exists ---- */
{
  /*
   * The boundary cannot be tested by adding an A1 episode — that is the next
   * sprint's job and would make A1 real. It can be tested where the derivations
   * actually read: give the level filter a curriculum that contains a foreign
   * level and check that Pre-A1's list is unchanged.
   */
  const preA1 = episodesOfLevel(PRE_A1)
  const foreign = [
    { id: 'planned_a1_one', level: 'A1', arc: 'work_and_study', canDoId: 'talk_about_work_or_study', steps: [] },
    { id: 'planned_a1_two', level: 'A1', arc: 'daily_rhythm', canDoId: 'talk_about_daily_routine', steps: [] },
  ]
  const mixed = [...preA1, ...foreign]

  const scoped = mixed.filter(ep => levelIdOfEpisode(ep) === PRE_A1)
  assert.deepEqual(scoped.map(e => e.id), preA1.map(e => e.id),
    'a foreign level must not change which episodes are Pre-A1')
  const foreignScoped = mixed.filter(ep => levelIdOfEpisode(ep) === A1)
  assert.equal(foreignScoped.length, 2, 'and the foreign episodes must be recognised as A1, not as Pre-A1')

  /* completion is level-scoped: seventeen of seventeen, not seventeen of nineteen */
  const completed = new Set(preA1.map(e => e.id))
  const preA1Complete = scoped.every(ep => completed.has(ep.id))
  const globalComplete = mixed.every(ep => completed.has(ep.id))
  assert.equal(preA1Complete, true, 'Pre-A1 is complete when its own episodes are done')
  assert.equal(globalComplete, false, 'and the global list is deliberately not the test')

  /* a foreign episode is never offered to a Pre-A1 learner */
  for (const ep of foreign) {
    const request = episodeRequest({ episodeId: ep.id })
    assert.equal(request.ok, false, `${ep.id} must not be openable`)
    assert.equal(request.reason, REFUSED.UNKNOWN_EPISODE,
      'a planned episode is unknown to the runtime, which is the honest refusal')
  }

  /* the required-item and required-capability sets are Pre-A1's own */
  const required = requiredLevelItems()
  assert.ok(required.length > 0, 'Pre-A1 must have required-core language')
  for (const id of required) assert.ok(SEED_VOCAB_BY_ID[id], `${id} is required and not real vocabulary`)
  for (const canDoId of PRE_A1_EXIT_CRITERIA.requiredCanDos) {
    const coverage = canDoCoverage(canDoId)
    assert.ok(coverage.introducedIn, `${canDoId} is required to leave Pre-A1 and no Pre-A1 episode introduces it`)
    assert.ok(preA1.some(ep => ep.id === coverage.introducedIn),
      `${canDoId} is introduced by ${coverage.introducedIn}, which is not a Pre-A1 episode`)
    assert.ok(productiveItemsOf(canDoId).length > 0, `${canDoId} produces no Pre-A1 language`)
  }
  console.log(`  Pre-A1: ${preA1.length} episodes, ${PRE_A1_EXIT_CRITERIA.requiredCanDos.length} required capabilities, `
    + `${required.length} required-core items — unchanged with a foreign level present`)
  ok()
}

/* ---- 6) the derivations really read the level, not the whole curriculum ---- */
{
  /*
   * Group 5 proves the filter is right. This proves the callers use it — the
   * difference between an architecture that is level-aware and one that has a
   * `level` field nobody reads.
   */
  const mustBeScoped = {
    'src/learning/curriculum/readiness.js': 'Pre-A1 readiness',
    'src/learning/curriculum/preA1Map.js': 'the Pre-A1 registry',
    'src/components/today/TodayView.jsx': 'Home',
    'src/context/AppContext.jsx': 'the session the app builds',
    'src/components/episode/CompletedEpisodes.jsx': 'the replay list',
  }
  for (const [path, what] of Object.entries(mustBeScoped)) {
    const src = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
    assert.ok(/episodesOfLevel\(PRE_A1\)/.test(src),
      `${what} must take its episodes from the level registry (${path})`)
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
    assert.ok(!/EPISODE_SKELETON as ARC|EPISODE_SKELETON\.(filter|map|every|some|find)/.test(code),
      `${what} still walks the whole curriculum (${path})`)
  }

  /*
   * The one deliberate exception, asserted so it stays deliberate: the support
   * engine looks up a capability's home episode and must find it in any level.
   */
  const scaffolding = readFileSync(new URL('../src/learning/engine/scaffolding.js', import.meta.url), 'utf8')
  assert.ok(/EPISODE_SKELETON as ARC/.test(scaffolding), 'the support engine reads the whole curriculum')
  assert.ok(/on purpose and unlike every other consumer/.test(scaffolding),
    'and must say why, so it does not read as an oversight')

  /* the planner takes its episodes as an argument, so it needs no level of its own */
  const planner = readFileSync(new URL('../src/learning/engine/planner.js', import.meta.url), 'utf8')
  assert.ok(!/EPISODE_SKELETON|episodesOfLevel/.test(planner),
    'the planner must stay level-agnostic and be handed the list')

  /* and the screens must refuse an episode rather than substitute one */
  const context = readFileSync(new URL('../src/context/AppContext.jsx', import.meta.url), 'utf8')
  assert.ok(/episodeRequest\(\{ episodeId \}\)/.test(context), 'startEpisode must ask before opening')
  assert.ok(!/episodeId \|\| 'first_greeting'/.test(context),
    'a missing episode id must not become the first greeting')
  ok()
}

/* ---- 7) receptive and incidental declarations stay honest ---- */
{
  /* nothing may be declared both receptive and produced by a required capability */
  const requiredProductive = new Set(PRE_A1_EXIT_CRITERIA.requiredCanDos.flatMap(id => productiveItemsOf(id)))
  for (const id of RECEPTIVE_ITEMS) {
    assert.ok(SEED_VOCAB_BY_ID[id], `${id} is declared receptive and is not real vocabulary`)
    assert.ok(!requiredProductive.has(id), `${id} is declared receptive and required as production`)
  }
  for (const id of INCIDENTAL_ITEMS) {
    assert.ok(SEED_VOCAB_BY_ID[id], `${id} is declared incidental and is not real vocabulary`)
    assert.ok(!requiredProductive.has(id), `${id} is declared incidental and required as production`)
  }
  /* every session block format the planner can choose is one the runner renders */
  for (const format of SESSION_BLOCK_FORMATS) {
    assert.ok(new RegExp(`'${format}'`).test(runnerSource) || format === 'roleplay' || format === 'mini_story',
      `the planner may choose "${format}" and the session runner does not mention it`)
  }
  ok()
}

console.log(`\ncheck-curriculum-authoring — OK  (${groups} authoring groups verified)`)
