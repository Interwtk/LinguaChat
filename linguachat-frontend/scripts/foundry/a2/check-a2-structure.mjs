#!/usr/bin/env node
/*
 * check-a2-structure — structural validation of the A2 level content
 * (`src/learning/levels/a2/**`) against `docs/curriculum/blueprints/a2.json`,
 * the source of truth for ids/counts/links (per that file's own header and
 * `docs/curriculum/blueprints/a2.md`).
 *
 * This is level-owned QA (scripts/foundry/a2/**), run directly with node. It
 * does not touch package.json, so it is not wired into `npm run check:all` —
 * see docs/curriculum/implementation/a2/status.md for why, and run it
 * explicitly as part of this task's own evidence.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..', '..', '..', '..')
const FRONTEND = join(REPO_ROOT, 'linguachat-frontend')

const blueprint = JSON.parse(readFileSync(join(REPO_ROOT, 'docs/curriculum/blueprints/a2.json'), 'utf8'))
const { A2_ARCS, A2_EPISODES } = await import(join(FRONTEND, 'src/learning/levels/a2/index.js').replace(/\\/g, '/').replace(/^([A-Za-z]:)?/, (m) => (process.platform === 'win32' ? m : '')))
const { A2_NEW_INTENTS, A2_EVALUATORS } = await import('../../../src/learning/levels/a2/evaluators.js')
const { A2_I18N_EN } = await import('../../../src/learning/levels/a2/i18n/en.js')

let failures = 0
const fail = (msg) => { failures += 1; console.error(`FAIL: ${msg}`) }
const warn = (msg) => console.warn(`WARN: ${msg}`)

/* ---- 1. Counts: 7 arcs, 23 episodes, episode range 39-61 ---- */
if (A2_ARCS.length !== blueprint.counts.arcs) fail(`expected ${blueprint.counts.arcs} arcs, got ${A2_ARCS.length}`)
if (A2_EPISODES.length !== blueprint.counts.episodes) fail(`expected ${blueprint.counts.episodes} episodes, got ${A2_EPISODES.length}`)

const blueprintArcIds = blueprint.arcs.map((a) => a.id)
const contentArcIds = A2_ARCS.map((a) => a.id)
for (const id of blueprintArcIds) if (!contentArcIds.includes(id)) fail(`arc "${id}" from blueprint has no content file`)
for (const id of contentArcIds) if (!blueprintArcIds.includes(id)) fail(`content arc "${id}" is not in the blueprint`)

/* ---- 2. Episode numbering: derive plannedNumber from titleKey (ep{N}Title), must be unique 39..61 ---- */
const seenNumbers = new Set()
const numberByEpisodeId = {}
for (const ep of A2_EPISODES) {
  const m = /^ep(\d+)Title$/.exec(ep.titleKey || '')
  if (!m) { fail(`episode "${ep.id}" titleKey "${ep.titleKey}" does not match ep{N}Title`); continue }
  const n = Number(m[1])
  numberByEpisodeId[ep.id] = n
  if (n < 39 || n > 61) fail(`episode "${ep.id}" plannedNumber ${n} outside A2's 39-61 range`)
  if (seenNumbers.has(n)) fail(`episode number ${n} used more than once`)
  seenNumbers.add(n)
}
for (let n = 39; n <= 61; n++) if (!seenNumbers.has(n)) fail(`episode number ${n} is missing`)

/* ---- 3. Episode ids unique ---- */
const idCounts = {}
for (const ep of A2_EPISODES) idCounts[ep.id] = (idCounts[ep.id] || 0) + 1
for (const [id, count] of Object.entries(idCounts)) if (count > 1) fail(`episode id "${id}" used ${count} times`)

/* ---- 4. canDoId must exist in the blueprint; every REQUIRED canDo has >=1 episode ---- */
const blueprintCanDoIds = new Set(blueprint.canDos.map((c) => c.id))
const requiredCanDoIds = new Set(blueprint.canDos.filter((c) => c.scope === 'required').map((c) => c.id))
const canDoIdsUsed = new Set()
for (const ep of A2_EPISODES) {
  if (!blueprintCanDoIds.has(ep.canDoId)) fail(`episode "${ep.id}" canDoId "${ep.canDoId}" is not in a2.json#canDos`)
  canDoIdsUsed.add(ep.canDoId)
}
for (const id of requiredCanDoIds) if (!canDoIdsUsed.has(id)) fail(`required canDo "${id}" has no episode (orphan required capability)`)

/* ---- 5. Episode-level `prerequisites` must reference real episode ids within A2 ---- */
const allEpisodeIds = new Set(A2_EPISODES.map((e) => e.id))
for (const ep of A2_EPISODES) {
  for (const p of ep.prerequisites || []) {
    if (!allEpisodeIds.has(p)) fail(`episode "${ep.id}" prerequisite "${p}" is not a known A2 episode id`)
  }
}

/* ---- 6. No prerequisite cycles (episode graph) ---- */
{
  const graph = Object.fromEntries(A2_EPISODES.map((e) => [e.id, e.prerequisites || []]))
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

/* ---- 7. evalKind coverage: every evalKind used must be a real A2 intent, a shipped A1 evalKind, or a documented exception ---- */
const SHIPPED_A1_EVAL_KINDS = new Set([
  'accept_offer', 'answer_origin', 'answer_wellbeing', 'ask_life_fact', 'ask_location', 'ask_name',
  'ask_origin', 'ask_preference', 'ask_price', 'ask_transport', 'ask_want', 'ask_wellbeing', 'ask_what_thing',
  'cafe_order_conversation', 'close_encounter', 'decline_offer', 'express_dislike', 'express_like',
  'express_need', 'express_want', 'finish_order', 'full_intro_conversation', 'identify_thing',
  'introduce_person', 'introduction', 'nice_to_meet', 'polite_request', 'reciprocal_question',
  'repair_request', 'respond_anything_else', 'simple_plan_conversation', 'state_life_fact',
  'state_location', 'state_person_fact', 'state_routine', 'thank_service', 'use_quantity',
])
/*
 * A1's own required capability `arrange_to_meet` lives in arc 7
 * (`making_arrangements`), which CLAUDE.md and a1.json both record as
 * DESIGNED-ONLY — not yet built, so it has no shipped evalKind to reuse
 * verbatim. A2 legitimately depends on it (a2.json#a1Inheritance) and must
 * name an evalKind for the turns that integrate it; `arrange_meeting` is that
 * proposed id, listed here explicitly (not silently allowed) so it stays a
 * single, visible exception rather than a loophole.
 */
const DOCUMENTED_UNBUILT_A1_EVAL_KINDS = new Set(['arrange_meeting'])

function collectEvalKinds(steps) {
  const out = []
  for (const step of steps) if (step.evalKind) out.push(step.evalKind)
  return out
}
const evalKindsUsed = new Set()
for (const ep of A2_EPISODES) for (const k of collectEvalKinds(ep.steps || [])) evalKindsUsed.add(k)
for (const k of evalKindsUsed) {
  const known = A2_NEW_INTENTS.includes(k) || SHIPPED_A1_EVAL_KINDS.has(k) || DOCUMENTED_UNBUILT_A1_EVAL_KINDS.has(k)
  if (!known) fail(`evalKind "${k}" is not a blueprint A2 intent, a shipped A1 evalKind, or a documented exception`)
}
for (const k of A2_NEW_INTENTS) {
  if (typeof A2_EVALUATORS[k] !== 'function') fail(`blueprint intent "${k}" has no reference evaluator in evaluators.js`)
}

/* ---- 8. i18n key completeness: every *Key referenced (episode-level and step-level) has a draft value ---- */
function collectKeys(obj, out) {
  if (obj == null) return
  if (Array.isArray(obj)) { for (const v of obj) collectKeys(v, out); return }
  if (typeof obj !== 'object') return
  for (const [k, v] of Object.entries(obj)) {
    if (k.endsWith('Key') && typeof v === 'string') out.push(v)
    else if (typeof v === 'object') collectKeys(v, out)
  }
}
const referencedKeys = []
for (const ep of A2_EPISODES) collectKeys(ep, referencedKeys)
const missingKeys = [...new Set(referencedKeys)].filter((k) => !(k in A2_I18N_EN))
for (const k of missingKeys) fail(`i18n key "${k}" is referenced by A2 content but has no draft value in i18n/en.js`)

/* ---- 9. patterns referenced must be real (blueprint pattern ids, or vocabulary — not validated strictly) ---- */
const blueprintPatternIds = new Set(blueprint.patterns.map((p) => p.id))
const usedPatternLikeIds = new Set()
for (const ep of A2_EPISODES) {
  for (const item of ep.gardenItems || []) if (item.endsWith('_pattern')) usedPatternLikeIds.add(item)
}
for (const id of usedPatternLikeIds) {
  if (!blueprintPatternIds.has(id) && !id.match(/_pattern$/)) continue
  if (!blueprintPatternIds.has(id)) warn(`gardenItem "${id}" looks like a pattern id but is not in a2.json#patterns (may be an A1 pattern reused by id — not hard-failed)`)
}
for (const p of blueprint.patterns) {
  const introduced = A2_EPISODES.some((ep) => (ep.gardenItems || []).includes(p.id))
  if (!introduced) warn(`blueprint pattern "${p.id}" is never granted as a gardenItem by any episode`)
}

console.log(`check-a2-structure: ${A2_ARCS.length} arcs, ${A2_EPISODES.length} episodes, ${evalKindsUsed.size} distinct evalKinds, ${referencedKeys.length} i18n key references (${new Set(referencedKeys).size} distinct)`)
if (failures > 0) {
  console.error(`check-a2-structure: ${failures} FAILURES`)
  process.exit(1)
}
console.log('check-a2-structure: OK')
process.exit(0)
