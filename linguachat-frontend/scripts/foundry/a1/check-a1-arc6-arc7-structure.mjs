#!/usr/bin/env node
/*
 * check-a1-arc6-arc7-structure — structural validation of A1 arc 6/7 content
 * (`src/learning/levels/a1/**`) against `docs/curriculum/a1-blueprint.json`,
 * scoped to the two arcs `what_you_can_do` (episodes 34-35) and
 * `making_arrangements` (episodes 36-38).
 *
 * This is level-owned QA (scripts/foundry/a1/**), run directly with node. It
 * does not touch package.json, so it is not wired into `npm run check:all` —
 * see docs/curriculum/implementation/a1/status.md for why, and run it
 * explicitly as part of this task's own evidence.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..', '..', '..', '..')
const FRONTEND = join(__dirname, '..', '..', '..')

const blueprint = JSON.parse(readFileSync(join(REPO_ROOT, 'docs/curriculum/a1-blueprint.json'), 'utf8'))
const ARC_IDS = ['what_you_can_do', 'making_arrangements']
const blueprintArcs = blueprint.arcs.filter((a) => ARC_IDS.includes(a.id))
const blueprintEpisodes = blueprint.episodes.filter((e) => ARC_IDS.includes(e.arc))

const { A1_ARC6_ARC7_ARCS, A1_ARC6_ARC7_EPISODES } = await import(join(FRONTEND, 'src/learning/levels/a1/index.js'))
const { A1_ARC6_ARC7_NEW_INTENTS, A1_ARC6_ARC7_EVALUATORS } = await import(join(FRONTEND, 'src/learning/levels/a1/evaluators.js'))
const { A1_ARC6_ARC7_I18N_EN } = await import(join(FRONTEND, 'src/learning/levels/a1/i18n/en.js'))

let failures = 0
const fail = (msg) => { failures += 1; console.error(`FAIL: ${msg}`) }
const warn = (msg) => console.warn(`WARN: ${msg}`)

/* ---- 1. Counts: 2 arcs, 5 episodes, episode numbers 34-38 ---- */
if (A1_ARC6_ARC7_ARCS.length !== 2) fail(`expected 2 arcs, got ${A1_ARC6_ARC7_ARCS.length}`)
if (A1_ARC6_ARC7_EPISODES.length !== 5) fail(`expected 5 episodes, got ${A1_ARC6_ARC7_EPISODES.length}`)
if (blueprintArcs.length !== 2) fail(`blueprint should have exactly 2 arcs named ${ARC_IDS.join('/')}, found ${blueprintArcs.length}`)
if (blueprintEpisodes.length !== 5) fail(`blueprint should have exactly 5 episodes for these 2 arcs, found ${blueprintEpisodes.length}`)

const contentArcIds = A1_ARC6_ARC7_ARCS.map((a) => a.id)
for (const id of ARC_IDS) if (!contentArcIds.includes(id)) fail(`arc "${id}" from blueprint has no content file`)

/* ---- 2. Episode numbering: derive plannedNumber from titleKey (ep{N}Title), must be unique 34..38 ---- */
const seenNumbers = new Set()
const numberByEpisodeId = {}
for (const ep of A1_ARC6_ARC7_EPISODES) {
  const m = /^ep(\d+)Title$/.exec(ep.titleKey || '')
  if (!m) { fail(`episode "${ep.id}" titleKey "${ep.titleKey}" does not match ep{N}Title`); continue }
  const n = Number(m[1])
  numberByEpisodeId[ep.id] = n
  if (n < 34 || n > 38) fail(`episode "${ep.id}" plannedNumber ${n} outside arc 6/7's 34-38 range`)
  if (seenNumbers.has(n)) fail(`episode number ${n} used more than once`)
  seenNumbers.add(n)
}
for (let n = 34; n <= 38; n++) if (!seenNumbers.has(n)) fail(`episode number ${n} is missing`)

/* ---- 3. Episode ids unique ---- */
const idCounts = {}
for (const ep of A1_ARC6_ARC7_EPISODES) idCounts[ep.id] = (idCounts[ep.id] || 0) + 1
for (const [id, count] of Object.entries(idCounts)) if (count > 1) fail(`episode id "${id}" used ${count} times`)

/* ---- 4. canDoId (+ secondaryCanDoId / creditsCanDoId) must exist in the blueprint; every REQUIRED/SHOULD canDo in these 2 arcs has >=1 credit ---- */
const blueprintCanDoIds = new Set(blueprint.canDos.map((c) => c.id))
const arc6Arc7CanDoIds = new Set(blueprintArcs.flatMap((a) => a.newCanDos))
const requiredOrShouldInScope = new Set(
  blueprint.canDos.filter((c) => arc6Arc7CanDoIds.has(c.id) && (c.scope === 'required' || c.scope === 'should')).map((c) => c.id),
)
const canDoIdsCredited = new Set()
for (const ep of A1_ARC6_ARC7_EPISODES) {
  if (!blueprintCanDoIds.has(ep.canDoId)) fail(`episode "${ep.id}" canDoId "${ep.canDoId}" is not in a1-blueprint.json#canDos`)
  canDoIdsCredited.add(ep.canDoId)
  if (ep.secondaryCanDoId) {
    if (!blueprintCanDoIds.has(ep.secondaryCanDoId)) fail(`episode "${ep.id}" secondaryCanDoId "${ep.secondaryCanDoId}" is not in a1-blueprint.json#canDos`)
    canDoIdsCredited.add(ep.secondaryCanDoId)
    // the secondary canDo must actually be credited by a step, not just declared
    const creditingStep = (ep.steps || []).some((s) => s.creditsCanDoId === ep.secondaryCanDoId)
    if (!creditingStep) fail(`episode "${ep.id}" declares secondaryCanDoId "${ep.secondaryCanDoId}" but no step credits it via creditsCanDoId`)
  }
}
for (const id of requiredOrShouldInScope) if (!canDoIdsCredited.has(id)) fail(`required/should canDo "${id}" (arc 6/7) has no episode credit (orphan capability)`)

/* ---- 5. Episode-level `prerequisites` must resolve, INCLUDING cross-arc episode 34's dependency on arc 2's "what_does_it_mean" ---- */
const allEpisodeIds = new Set(A1_ARC6_ARC7_EPISODES.map((e) => e.id))
const KNOWN_EXTERNAL_PREREQS = new Set(['what_does_it_mean']) // arc 2 (daily_rhythm), already shipped in episodes/a1Arc2.js
for (const ep of A1_ARC6_ARC7_EPISODES) {
  for (const p of ep.prerequisites || []) {
    if (!allEpisodeIds.has(p) && !KNOWN_EXTERNAL_PREREQS.has(p)) fail(`episode "${ep.id}" prerequisite "${p}" is not a known arc 6/7 episode id or documented external prerequisite`)
  }
}

/* ---- 6. No prerequisite cycles within arc 6/7's own episode graph ---- */
{
  const graph = Object.fromEntries(A1_ARC6_ARC7_EPISODES.map((e) => [e.id, (e.prerequisites || []).filter((p) => allEpisodeIds.has(p))]))
  const WHITE = 0, GREY = 1, BLACK = 2
  const color = Object.fromEntries(Object.keys(graph).map((id) => [id, WHITE]))
  const visit = (id, path) => {
    if (color[id] === BLACK) return
    if (color[id] === GREY) { fail(`prerequisite cycle detected: ${[...path, id].join(' -> ')}`); return }
    color[id] = GREY
    for (const p of graph[id] || []) visit(p, [...path, id])
    color[id] = BLACK
  }
  for (const id of Object.keys(graph)) visit(id, [])
}

/* ---- 7. evalKind coverage: every evalKind used must be a real arc6/7 intent, a shipped A1 evalKind, or a documented repairKind extension ---- */
const SHIPPED_A1_EVAL_KINDS = new Set([
  'introduction', 'ask_wellbeing', 'express_like', 'repair_request', 'close_encounter',
])
function collectSteps(steps) {
  const out = []
  for (const step of steps) { out.push(step); if (step.steps) out.push(...collectSteps(step.steps)) }
  return out
}
const evalKindsUsed = new Set()
for (const ep of A1_ARC6_ARC7_EPISODES) for (const s of collectSteps(ep.steps || [])) if (s.evalKind) evalKindsUsed.add(s.evalKind)
for (const k of evalKindsUsed) {
  const known = A1_ARC6_ARC7_NEW_INTENTS.includes(k) || SHIPPED_A1_EVAL_KINDS.has(k)
  if (!known) fail(`evalKind "${k}" is not an arc 6/7 blueprint intent, a shipped A1 evalKind, or a documented reuse`)
}
for (const k of A1_ARC6_ARC7_NEW_INTENTS) {
  if (typeof A1_ARC6_ARC7_EVALUATORS[k] !== 'function') fail(`blueprint intent "${k}" has no reference evaluator in evaluators.js`)
}
/* repair_request steps must use a known repairKind (4 shipped + the arc's own proposed 5th) */
const KNOWN_REPAIR_KINDS = new Set(['signal_nonunderstanding', 'repeat', 'slow_down', 'ask_meaning', 'ask_how_to_say'])
for (const ep of A1_ARC6_ARC7_EPISODES) {
  for (const s of collectSteps(ep.steps || [])) {
    if (s.evalKind === 'repair_request' && s.repairKind && !KNOWN_REPAIR_KINDS.has(s.repairKind)) {
      fail(`episode "${ep.id}" step uses undocumented repairKind "${s.repairKind}"`)
    }
  }
}

/* ---- 8. i18n key completeness: every *Key referenced (episode-level and step-level, incl. option "key") has a draft value ---- */
function collectKeys(obj, out) {
  if (obj == null) return
  if (Array.isArray(obj)) { for (const v of obj) collectKeys(v, out); return }
  if (typeof obj !== 'object') return
  for (const [k, v] of Object.entries(obj)) {
    if ((k.endsWith('Key') || k === 'key') && typeof v === 'string') out.push(v)
    else if (typeof v === 'object') collectKeys(v, out)
  }
}
const referencedKeys = []
for (const ep of A1_ARC6_ARC7_EPISODES) collectKeys(ep, referencedKeys)
const missingKeys = [...new Set(referencedKeys)].filter((k) => !(k in A1_ARC6_ARC7_I18N_EN))
for (const k of missingKeys) fail(`i18n key "${k}" is referenced by arc 6/7 content but has no draft value in i18n/en.js`)

/* ---- 9. patterns declared by the blueprint for these 2 arcs must be granted as a gardenItem somewhere ---- */
const blueprintPatternIds = new Set(blueprintArcs.flatMap((a) => a.newPatterns))
for (const p of blueprintPatternIds) {
  const introduced = A1_ARC6_ARC7_EPISODES.some((ep) => (ep.gardenItems || []).includes(p))
  if (!introduced) warn(`blueprint pattern "${p}" is never granted as a gardenItem by any arc 6/7 episode`)
}

/* ---- 10. the canAmbiguity architectural note has a real content counterpart: episode 35 must teach the disambiguation ---- */
{
  const ep35 = A1_ARC6_ARC7_EPISODES.find((e) => e.id === 'can_you')
  const hasDisambiguationStep = ep35 && (ep35.steps || []).some((s) => s.type === 'choice' && /ABILITY/i.test(s.promptEn || ''))
  if (!hasDisambiguationStep) fail('episode "can_you" (35) must teach the ability-vs-repair "Can you...?" disambiguation as content, per a1-blueprint.json#coreEngineRequirements.canAmbiguity')
}

console.log(`check-a1-arc6-arc7-structure: ${A1_ARC6_ARC7_ARCS.length} arcs, ${A1_ARC6_ARC7_EPISODES.length} episodes, ${evalKindsUsed.size} distinct evalKinds, ${referencedKeys.length} i18n key references (${new Set(referencedKeys).size} distinct)`)
if (failures > 0) {
  console.error(`check-a1-arc6-arc7-structure: ${failures} FAILURES`)
  process.exit(1)
}
console.log('check-a1-arc6-arc7-structure: OK')
process.exit(0)
