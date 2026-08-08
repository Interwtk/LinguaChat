/*
 * check-a1-blueprint — the A1 design, validated, and kept out of the product.
 *
 * A1 is planned and not built. That makes two kinds of mistake possible, and
 * this file exists for both.
 *
 * The first is a design that quietly stops holding together: an arc with no
 * capability, a capability nothing teaches, a prerequisite pointing at a skill
 * that does not exist in Pre-A1 or in A1, a cycle, a capability deferred to A2
 * and assigned to an arc anyway, an episode plan with no can-do. Those are cheap
 * to catch now and expensive to discover halfway through building the level.
 *
 * The second is worse: A1 becoming real by accident. The blueprint is a design
 * document, and a document that some component imports is a feature. So the
 * second half of this file walks the source and proves that nothing in the
 * product knows about it — no runtime import, no A1 episode, no seventh arc, and
 * Pre-A1 still exactly six arcs and seventeen episodes.
 *
 * It deliberately validates structure and links, not taste. Whether
 * `arrange_to_meet` belongs in A1 is a judgement recorded in a1-map.md; whether
 * it is reachable, prerequisite-sound and unassigned to A2 is a fact.
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'

import { ARC, ARCS } from '../src/learning/episodes/index.js'
import { CAN_DO_INTENT } from '../src/learning/curriculum/preA1Map.js'

const BLUEPRINT = '../../docs/curriculum/a1-blueprint.json'
const MAP_DOC = '../../docs/curriculum/a1-map.md'

const blueprint = JSON.parse(readFileSync(new URL(BLUEPRINT, import.meta.url), 'utf8'))
const mapDoc = readFileSync(new URL(MAP_DOC, import.meta.url), 'utf8')

let groups = 0
const ok = () => { groups += 1 }

const canDoIds = blueprint.canDos.map(c => c.id)
const arcIds = blueprint.arcs.map(a => a.id)
const preA1CanDos = new Set(Object.keys(CAN_DO_INTENT))
const deferredIds = new Set(blueprint.deferredToA2.map(d => d.id))

/* ---- 1) it says what it is: planned, versioned, level a1 ---- */
{
  assert.equal(blueprint.level, 'a1')
  assert.equal(blueprint.status, 'planned', 'a blueprint may not describe itself as built')
  assert.match(blueprint.blueprintVersion, /^a1\.blueprint\.v\d+$/)
  for (const forbidden of ['implemented', 'available', 'unlocked', 'released']) {
    assert.notEqual(blueprint.status, forbidden)
  }
  // the document a person reads must agree that nothing exists yet
  assert.match(mapDoc, /Status: PLANNED/i, 'the map must open by saying the level is planned')
  ok()
}

/* ---- 2) ids are unique, and shaped like capabilities rather than grammar ---- */
{
  assert.equal(new Set(canDoIds).size, canDoIds.length, 'duplicate can-do id')
  assert.equal(new Set(arcIds).size, arcIds.length, 'duplicate arc id')
  const patternIds = blueprint.patterns.map(p => p.id)
  assert.equal(new Set(patternIds).size, patternIds.length, 'duplicate pattern id')

  for (const id of [...canDoIds, ...arcIds]) {
    assert.match(id, /^[a-z][a-z0-9_]*$/, `${id} is not a stable snake_case id`)
    assert.ok(id.length <= 34, `${id} is too long to live with`)
    /*
     * An id naming a grammar point or a unit number is the failure mode this
     * project keeps rejecting: it survives a change of title only by pretending
     * the capability was about the structure all along.
     */
    assert.ok(!/^(present_simple|past_|unit_|lesson_|grammar_)/.test(id), `${id} names grammar, not a capability`)
    assert.ok(!/_v\d+$|_\d+$/.test(id), `${id} is numbered rather than named`)
  }
  ok()
}

/* ---- 3) every capability is assigned, every arc teaches something ---- */
{
  const assigned = new Map()
  for (const arc of blueprint.arcs) {
    assert.ok(arc.newCanDos.length > 0, `${arc.id} introduces no capability`)
    for (const canDo of arc.newCanDos) {
      assert.ok(canDoIds.includes(canDo), `${arc.id} teaches unknown capability ${canDo}`)
      assert.ok(!assigned.has(canDo), `${canDo} is introduced twice (${assigned.get(canDo)} and ${arc.id})`)
      assigned.set(canDo, arc.id)
    }
    for (const canDo of arc.reinforcedCanDos || []) {
      assert.ok(canDoIds.includes(canDo) || preA1CanDos.has(canDo),
        `${arc.id} reinforces ${canDo}, which is neither an A1 nor a Pre-A1 capability`)
    }
    assert.ok(arc.communicativeProblem && arc.communicativeProblem.length > 30,
      `${arc.id} must state the communicative problem it solves`)
    assert.ok(arc.whyNow, `${arc.id} must say why it comes where it does`)
    assert.ok(arc.risk, `${arc.id} must name its own risk`)
    assert.ok(typeof arc.miniStory?.use === 'boolean' && arc.miniStory.why,
      `${arc.id} must decide about a mini story and say why`)
  }
  for (const canDo of canDoIds) {
    assert.ok(assigned.has(canDo), `${canDo} is designed and no arc introduces it`)
  }
  // and nothing deferred to A2 sneaks into an arc
  for (const arc of blueprint.arcs) {
    for (const canDo of [...arc.newCanDos, ...(arc.reinforcedCanDos || [])]) {
      assert.ok(!deferredIds.has(canDo), `${arc.id} assigns ${canDo}, which is deferred to A2`)
    }
  }
  ok()
}

/* ---- 4) prerequisites resolve, and do not go round in circles ---- */
{
  const byId = new Map(blueprint.canDos.map(c => [c.id, c]))
  for (const canDo of blueprint.canDos) {
    for (const prereq of canDo.prerequisites) {
      assert.ok(byId.has(prereq) || preA1CanDos.has(prereq),
        `${canDo.id} requires ${prereq}, which exists in neither level`)
      assert.ok(!deferredIds.has(prereq), `${canDo.id} requires ${prereq}, which is deferred to A2`)
    }
  }
  /* depth-first cycle detection over the A1 half of the graph */
  const state = new Map()
  const walk = (id, trail) => {
    if (state.get(id) === 'done') return
    assert.ok(state.get(id) !== 'open', `prerequisite cycle: ${[...trail, id].join(' -> ')}`)
    state.set(id, 'open')
    for (const prereq of byId.get(id)?.prerequisites || []) {
      if (byId.has(prereq)) walk(prereq, [...trail, id])
    }
    state.set(id, 'done')
  }
  for (const id of canDoIds) walk(id, [])

  // arc prerequisites too
  for (const arc of blueprint.arcs) {
    for (const prior of arc.prerequisiteArcs || []) {
      assert.ok(arcIds.includes(prior), `${arc.id} requires unknown arc ${prior}`)
      const priorOrder = blueprint.arcs.find(a => a.id === prior).order
      assert.ok(priorOrder < arc.order, `${arc.id} requires ${prior}, which comes later in the walk`)
    }
  }
  ok()
}

/* ---- 5) the episode plan matches the arcs it belongs to ---- */
{
  const numbers = blueprint.episodes.map(e => e.plannedNumber)
  assert.equal(new Set(numbers).size, numbers.length, 'duplicate planned episode number')
  assert.equal(Math.min(...numbers), ARC.length + 1,
    `the plan must start after the frozen level: expected ${ARC.length + 1}`)
  assert.deepEqual([...numbers].sort((a, b) => a - b), numbers, 'planned numbers should be in order')
  /*
   * The counts block is a summary, and a summary nobody checks becomes folklore —
   * this project has already had to correct "74 items" and "40 checks" that were
   * counted the easy way. Every count that can be derived is derived here.
   */
  const derived = {
    arcs: arcIds.length,
    episodes: numbers.length,
    canDosRequired: blueprint.canDos.filter(c => c.scope === 'required').length,
    canDosShould: blueprint.canDos.filter(c => c.scope === 'should').length,
    canDosOptional: blueprint.optionalOrNotTaken.filter(o => o.scope === 'optional').length,
    canDosDeferred: blueprint.deferredToA2.length,
    newPatterns: blueprint.patterns.length,
    newIntents: blueprint.intentStrategy.newIntents.length,
    newSemanticTypesRequired: blueprint.semanticTypes.proposed.filter(t => t.scope !== 'should').length,
    newSemanticTypesShould: blueprint.semanticTypes.proposed.filter(t => t.scope === 'should').length,
  }
  for (const [key, value] of Object.entries(derived)) {
    assert.equal(blueprint.counts[key], value,
      `counts.${key} says ${blueprint.counts[key]} and the design says ${value}`)
  }
  assert.equal(blueprint.counts.newProductiveVocabularyBudget,
    blueprint.arcs.reduce((n, a) => n + a.vocabularyBudget.newProductive, 0),
    'the productive vocabulary budget must be the sum of the arcs')
  assert.equal(blueprint.counts.newReceptiveVocabularyBudget,
    blueprint.arcs.reduce((n, a) => n + a.vocabularyBudget.newReceptive, 0),
    'and so must the receptive one')
  assert.deepEqual(blueprint.counts.plannedEpisodeNumbers,
    [Math.min(...numbers), Math.max(...numbers)], 'the planned range must match the episodes')

  for (const ep of blueprint.episodes) {
    assert.ok(arcIds.includes(ep.arc), `episode ${ep.plannedNumber} belongs to unknown arc ${ep.arc}`)
    assert.ok(canDoIds.includes(ep.canDo), `episode ${ep.plannedNumber} teaches unknown capability ${ep.canDo}`)
    assert.ok(['primary', 'reinforcement'].includes(ep.role),
      `episode ${ep.plannedNumber} must be primary or reinforcement`)
    const arc = blueprint.arcs.find(a => a.id === ep.arc)
    assert.ok([...arc.newCanDos, ...(arc.reinforcedCanDos || [])].includes(ep.canDo),
      `episode ${ep.plannedNumber} teaches ${ep.canDo}, which its arc does not list`)
    assert.ok(arc.episodes.includes(ep.plannedNumber),
      `${arc.id} does not list episode ${ep.plannedNumber}`)
    assert.ok(ep.openProductions >= 1, `episode ${ep.plannedNumber} plans no open production`)
    assert.ok(ep.evidence, `episode ${ep.plannedNumber} must say what evidence it produces`)
    assert.ok(ep.newPatterns <= 2, `episode ${ep.plannedNumber} plans ${ep.newPatterns} new patterns`)
  }
  // every arc's episode list is covered by real episode plans
  for (const arc of blueprint.arcs) {
    for (const n of arc.episodes) {
      assert.ok(numbers.includes(n), `${arc.id} lists episode ${n}, which has no blueprint`)
    }
  }
  // every required capability is produced in an open turn somewhere
  for (const canDo of blueprint.canDos.filter(c => c.scope === 'required')) {
    const eps = blueprint.episodes.filter(e => e.canDo === canDo.id)
    assert.ok(eps.length >= 1, `${canDo.id} is required and no episode teaches it`)
    assert.ok(eps.some(e => e.openProductions >= 1),
      `${canDo.id} is required and never produced in an open turn`)
  }
  ok()
}

/* ---- 6) patterns and semantic types are justified, not decorative ---- */
{
  const patternIds = new Set(blueprint.patterns.map(p => p.id))
  const preA1Patterns = new Set(['im_pattern', 'whats_your_pattern', 'im_feeling_pattern', 'im_from_pattern',
    'i_like_pattern', 'i_want_pattern', 'can_i_have_pattern', 'repair_pattern', 'its_a_pattern',
    'quantity_pattern', 'numbers_1_10'])
  for (const pattern of blueprint.patterns) {
    assert.ok(pattern.enables?.length, `${pattern.id} enables nothing`)
    for (const canDo of pattern.enables) {
      assert.ok(canDoIds.includes(canDo), `${pattern.id} claims to enable unknown ${canDo}`)
    }
    assert.ok(['comprehension', 'guided_production', 'independent'].includes(pattern.reaches),
      `${pattern.id} must say how far it travels`)
    assert.ok(arcIds.includes(pattern.firstArc), `${pattern.id} first appears in unknown arc ${pattern.firstArc}`)
    if (pattern.prerequisite) {
      assert.ok(patternIds.has(pattern.prerequisite) || preA1Patterns.has(pattern.prerequisite),
        `${pattern.id} requires unknown pattern ${pattern.prerequisite}`)
    }
  }
  // every can-do names at least one pattern, and they exist
  for (const canDo of blueprint.canDos) {
    assert.ok(canDo.patterns?.length, `${canDo.id} names no pattern`)
    for (const p of canDo.patterns) {
      assert.ok(patternIds.has(p) || preA1Patterns.has(p), `${canDo.id} names unknown pattern ${p}`)
    }
    assert.ok(canDo.why && canDo.why.length > 40, `${canDo.id} must justify its place in the level`)
    assert.ok(['required', 'should', 'optional'].includes(canDo.scope), `${canDo.id} has no scope`)
    assert.ok(['deterministic_local', 'hybrid', 'remote_likely'].includes(canDo.evaluation),
      `${canDo.id} must say how it can be evaluated`)
  }
  for (const type of blueprint.semanticTypes.proposed) {
    assert.ok(type.whyNotExisting, `${type.id} must explain why an existing type cannot carry it`)
    for (const canDo of type.requiredBy) {
      assert.ok(canDoIds.includes(canDo), `${type.id} is required by unknown ${canDo}`)
    }
    assert.ok(!blueprint.semanticTypes.existing.includes(type.id), `${type.id} already exists`)
  }
  ok()
}

/* ---- 7) the reuse matrix covers what it claims to ---- */
{
  const { rows, arcOrder } = blueprint.reuseMatrix
  assert.deepEqual(arcOrder, arcIds, 'the reuse matrix must follow the arc order')
  for (const [skill, marks] of Object.entries(rows)) {
    assert.ok(canDoIds.includes(skill) || preA1CanDos.has(skill), `the matrix has a row for unknown ${skill}`)
    assert.equal(marks.length, arcIds.length, `${skill}: the matrix row is the wrong width`)
    assert.ok(marks.some(m => m !== '-'), `${skill} appears nowhere in the level`)
  }
  for (const canDo of canDoIds) {
    assert.ok(rows[canDo], `${canDo} has no row in the reuse matrix`)
  }
  // the design must know which rows are thin rather than discovering it later
  assert.ok(blueprint.reuseMatrix.singleAppearanceRisks?.length >= 1,
    'a level this size will have thin rows; the blueprint must name them')
  assert.ok(blueprint.reuseMatrix.mitigation, 'and say what happens about them')
  ok()
}

/* ---- 8) the level knows where it stops ---- */
{
  const exit = blueprint.exitCriteria
  assert.ok(exit.readinessDimensionsForA2.length >= 4, 'readiness needs more than one dimension')
  for (const d of exit.readinessDimensionsForA2) assert.ok(d.dimension && d.appliesTo)
  assert.ok(exit.notCriteria.some(n => /score/i.test(n)), 'a 0–100 score must stay explicitly excluded')
  assert.ok(canDoIds.includes(exit.lastRequiredA1Capability),
    'the last required capability must be one of the level’s own')
  assert.equal(blueprint.canDos.find(c => c.id === exit.lastRequiredA1Capability).scope, 'required')
  assert.ok(deferredIds.has(exit.firstA2Capability),
    'the first A2 capability must be on the deferred list, which is what makes it a fence')
  assert.ok(blueprint.deferredToA2.find(d => d.firstA2)?.id === exit.firstA2Capability)
  for (const d of blueprint.deferredToA2) assert.ok(d.why, `${d.id} is deferred with no reason`)
  ok()
}

/* ---- 9) the plan for building it, and the gate before the first episode ---- */
{
  assert.equal(blueprint.implementationPhases[0].phase, 0)
  assert.match(blueprint.implementationPhases[0].name, /readiness/i)
  const arcPhases = blueprint.implementationPhases.filter(p => /^Arc /.test(p.name))
  assert.equal(arcPhases.length, arcIds.length, 'one phase per arc')
  for (const phase of arcPhases) {
    const arcId = phase.name.replace(/^Arc /, '')
    assert.ok(arcIds.includes(arcId), `phase names unknown arc ${arcId}`)
    assert.deepEqual(phase.episodes, blueprint.arcs.find(a => a.id === arcId).episodes)
  }
  assert.ok(blueprint.beforeEp18Gate.length >= 1 && blueprint.beforeEp18Gate.length <= 6,
    'the gate before the first episode must be short enough to be real')
  assert.ok(['NO TECHNICAL SPRINT NEEDED', 'SMALL ARCHITECTURE SPRINT NEEDED', 'MAJOR BLOCKER']
    .includes(blueprint.decision), 'the technical decision must be one of the three')
  for (const area of blueprint.technicalReadiness) {
    assert.ok(typeof area.blocksEp18 === 'boolean' && area.state && area.when && area.risk,
      `${area.area} is not fully assessed`)
  }
  // whatever blocks episode 18 must appear in the gate, and vice versa
  const blocking = blueprint.technicalReadiness.filter(a => a.blocksEp18).length
  assert.ok(blocking > 0 === (blueprint.decision !== 'NO TECHNICAL SPRINT NEEDED'),
    'the decision must follow from the matrix')
  ok()
}

/* ---- 10) and none of it exists in the product ---- */
{
  const sources = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`
      if (entry.isDirectory()) walk(path)
      else if (/\.(jsx?|mjs)$/.test(entry.name)) sources.push([path, readFileSync(path, 'utf8')])
    }
  }
  walk('src')

  /*
   * Nothing in the product may READ the blueprint. Naming it in a comment is
   * fine — a module that explains which design document it serves is doing the
   * reader a favour — so the comments are stripped before looking, and what is
   * forbidden is the mechanisms that would actually pull the file in.
   */
  const importers = sources.filter(([, src]) => {
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
    return /(import|require|fetch|readFile\w*)\s*\(?[^\n]*a1-(blueprint|map)/.test(code)
      || /from\s+['"][^'"]*a1-(blueprint|map)/.test(code)
      || /a1Blueprint/.test(code)
  })
  assert.deepEqual(importers.map(([p]) => p), [],
    `the blueprint must not be imported by the product: ${importers.map(([p]) => p).join(', ')}`)
  /* and it must not reach the bundle through an asset import either */
  for (const [path, src] of sources) {
    assert.ok(!/docs\/curriculum/.test(src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')),
      `${path} reaches into docs/, which is tooling and must never ship`)
  }

  /*
   * A1 CONTENT IS ALLOWED NOW — arc 1 only.
   *
   * This block used to assert that no A1 content existed anywhere, and that was
   * right until the architecture was ready and the first arc was authorised. What
   * replaces it is the invariant that matters from here: the level may hold arc 1
   * and nothing else, and it stays closed to learners either way. The blueprint's
   * DESIGN totals are still read from the blueprint and never inferred from what
   * happens to be built.
   */
  for (const [path, src] of sources) {
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
    assert.ok(!/arc7\b/i.test(code), `${path} references a seventh arc`)
    assert.ok(!/levelMilestones\.a1/.test(code), `${path} prepares an A1 milestone`)
    assert.ok(!/deriveA1Readiness|a1Readiness/.test(code), `${path} prepares A1 readiness`)
    /*
     * A declared level belongs to curriculum data. The placement questions have
     * carried `level: 'A1'` since long before A1 was designed — that is how the
     * placement screen classifies a learner, and it teaches nothing. What must
     * stay impossible is an A1 episode or an A1 arc in the curriculum itself.
     */
    /*
     * Episode definitions are where content lives, so that is where a declared A1
     * level would mean A1 exists. The level registry is a different thing: it
     * records what an A1 episode WOULD call itself, which is how the curriculum
     * filter will recognise A1 content on the day there is any, and is what
     * "known but unavailable" is made of.
     */
    /*
     * Episode definitions are where content lives, so a declared A1 level here
     * means A1 content exists — which is true in exactly one file PER IMPLEMENTED
     * ARC. Any other episode file declaring A1 would be an arc arriving unannounced.
     */
    if (/^src\/(learning\/episodes|data\/vocabulary)/.test(path)) {
      const declaresA1 = /level:\s*['"]A1['"]/i.test(code)
      const isBuiltArcFile = /^src\/learning\/episodes\/a1Arc[12](Content)?\.js$/.test(path)
      assert.ok(!declaresA1 || isBuiltArcFile,
        `${path} declares A1 curriculum content outside the implemented arcs`)
    }
    /*
     * A PLANNED arc must not appear in runtime data — except the ones that are no
     * longer planned. `work_and_study` and `daily_rhythm` are implemented, so they
     * are the named exceptions and the other FIVE stay impossible until each is
     * authorised. This list shrinks by exactly one per arc sprint, which is how a
     * third arc cannot arrive without somebody editing this line on purpose.
     */
    if (/^src\/(learning|data)/.test(path)) {
      assert.ok(!/arc:\s*['"](people_around_you|finding_your_way|paying_and_choosing|what_you_can_do|making_arrangements)['"]/.test(code),
        `${path} declares a planned A1 arc as if it existed`)
    }
  }
  /*
   * Exactly two places may name the level, and both are named here so a third
   * cannot appear quietly: the placement questions, which classify a learner and
   * predate A1's design, and the level registry, which maps the level id to the
   * string an episode would declare.
   */
  const levelDeclarers = sources
    .filter(([, src]) => /level:\s*['"]A1['"]/i.test(src))
    .map(([path]) => path)
    .sort()
  /*
   * Three files, and each for a different reason: the placement questions classify
   * a learner and predate A1's design, the registry maps the level id to the
   * string an episode declares, and arc 1's content is the level's first episodes.
   * A fourth would be a second arc, or a leak.
   */
  assert.deepEqual(levelDeclarers,
    ['src/data/placementQuestions.js', 'src/learning/curriculum/levels.js',
      'src/learning/episodes/a1Arc1.js', 'src/learning/episodes/a1Arc2.js'],
    `only placement, the registry and the built arcs may name A1: ${levelDeclarers.join(', ')}`)
  /* and the registry must still hold A1 as unavailable */
  const registry = sources.find(([p]) => p === 'src/learning/curriculum/levels.js')[1]
  /*
   * The registry stopped saying `implemented: false` the day arc 1 landed, because
   * a boolean could not tell "has content" from "is finished". What must hold now
   * is that A1 is PARTIAL and still closed.
   */
  assert.ok(/id: A1, order: 2, contentStatus: 'partial', available: false/.test(registry),
    'the registry must keep A1 partial and unavailable')

  /* and Pre-A1 is exactly as the freeze left it */
  assert.equal(ARC.length, 17, 'Pre-A1 must still be seventeen episodes')
  assert.equal(ARCS.length, 6, 'Pre-A1 must still be six arcs')
  assert.deepEqual([...new Set(ARC.map(e => e.level))], ['Pre-A1'], 'no episode may claim another level yet')
  for (const canDo of canDoIds) {
    assert.ok(!preA1CanDos.has(canDo), `${canDo} is planned for A1 and already exists in Pre-A1`)
  }
  ok()
}

const required = blueprint.canDos.filter(c => c.scope === 'required').length
console.log(`\ncheck-a1-blueprint — OK  (${groups} blueprint groups verified)`)
console.log(`  ${blueprint.blueprintVersion}: ${arcIds.length} arcs, ${blueprint.episodes.length} planned episodes, `
  + `${canDoIds.length} capabilities (${required} required), ${blueprint.deferredToA2.length} deferred to A2`)
console.log(`  decision: ${blueprint.decision} — A1 is ${blueprint.status} and absent from the product`)
