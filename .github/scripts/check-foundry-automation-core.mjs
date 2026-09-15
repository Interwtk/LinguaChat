#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { loadManifest, readyTasks } from './foundry-next.mjs'
import { validateCorpus } from './check-supervisor-evidence.mjs'

const { tasks } = loadManifest()
const byId = new Map(tasks.map(t => [t.id, t]))
const fail = (msg) => { console.error(`FAIL: ${msg}`); process.exitCode = 1 }
const expect = (cond, msg) => { if (!cond) fail(msg) }

// Graph must be acyclic.
const visiting = new Set(), visited = new Set()
function visit(id, trail=[]) {
  if (visited.has(id)) return
  if (visiting.has(id)) return fail(`dependency cycle: ${[...trail,id].join(' -> ')}`)
  visiting.add(id)
  const task = byId.get(id)
  for (const dep of task.dependsOn) visit(dep, [...trail,id])
  visiting.delete(id); visited.add(id)
}
for (const task of tasks) visit(task.id)

// Initial state must fail closed: only the foundation contract is dispatchable.
let ready = readyTasks(tasks, new Set())
expect(ready.length === 1 && ready[0].id === 'LC-FND-001', `initial ready set must be only LC-FND-001, got ${ready.map(t=>t.id).join(', ')}`)

// After foundation, research + all six blueprint lanes should fan out, exactly one per lane.
const afterFoundation = new Set(['LC-FND-001'])
ready = readyTasks(tasks, afterFoundation)
const expectedFanout = new Set(['LC-RES-P01','LC-RES-Y01','LC-BP-A1','LC-BP-A2','LC-BP-B1','LC-BP-B2','LC-BP-C1','LC-BP-C2'])
expect(ready.length === expectedFanout.size, `foundation fanout expected ${expectedFanout.size}, got ${ready.length}`)
for (const id of expectedFanout) expect(ready.some(t => t.id === id), `foundation fanout missing ${id}`)
expect(new Set(ready.map(t => t.lane)).size === ready.length, 'readyTasks returned more than one task in a lane')

// Evidence batches must stay sequential inside each research lane.
const ped1 = new Set([...afterFoundation, 'LC-RES-P01'])
ready = readyTasks(tasks, ped1)
expect(ready.some(t => t.id === 'LC-RES-P02'), 'PED batch 2 should unlock after batch 1')
expect(!ready.some(t => t.id === 'LC-RES-P03'), 'PED batch 3 unlocked before batch 2')
const psy1 = new Set([...afterFoundation, 'LC-RES-Y01'])
ready = readyTasks(tasks, psy1)
expect(ready.some(t => t.id === 'LC-RES-Y02'), 'PSY batch 2 should unlock after batch 1')
expect(!ready.some(t => t.id === 'LC-RES-Y03'), 'PSY batch 3 unlocked before batch 2')

// Supervisor cannot qualify until both research chains are fully complete.
const almostResearch = new Set(['LC-FND-001','LC-RES-P01','LC-RES-P02','LC-RES-P03','LC-RES-P04','LC-RES-Y01','LC-RES-Y02','LC-RES-Y03'])
ready = readyTasks(tasks, almostResearch)
expect(!ready.some(t => t.id === 'LC-SUP-001'), 'supervisor readiness unlocked before both 100-study chains finish')
const fullResearch = new Set([...almostResearch,'LC-RES-Y04'])
ready = readyTasks(tasks, fullResearch)
expect(ready.some(t => t.id === 'LC-SUP-001'), 'supervisor readiness did not unlock after both research chains')

// Cross-level audit needs supervisor + every blueprint, not merely content authors' self-review.
const supervisorOnly = new Set([...fullResearch,'LC-SUP-001'])
ready = readyTasks(tasks, supervisorOnly)
expect(!ready.some(t => t.id === 'LC-AUD-001'), 'cross-level audit unlocked without all blueprints')
const allBlueprints = ['LC-BP-A1','LC-BP-A2','LC-BP-B1','LC-BP-B2','LC-BP-C1','LC-BP-C2']
const auditReady = new Set([...supervisorOnly, ...allBlueprints])
ready = readyTasks(tasks, auditReady)
expect(ready.some(t => t.id === 'LC-AUD-001'), 'cross-level audit did not unlock with supervisor + all blueprints')

// No content work may start before audit and shared isolation are complete.
const beforeCoreIsolation = new Set([...auditReady,'LC-AUD-001'])
ready = readyTasks(tasks, beforeCoreIsolation)
expect(ready.some(t => t.id === 'LC-FND-002'), 'core isolation did not unlock after cross-level audit')
expect(!ready.some(t => t.id.startsWith('LC-CONT-')), 'content unlocked before shared infrastructure isolation')

const afterCoreIsolation = new Set([...beforeCoreIsolation,'LC-FND-002'])
ready = readyTasks(tasks, afterCoreIsolation)
const contentIds = ['LC-CONT-A1','LC-CONT-A2','LC-CONT-B1','LC-CONT-B2','LC-CONT-C1','LC-CONT-C2']
for (const id of contentIds) expect(ready.some(t => t.id === id), `parallel content fanout missing ${id}`)

// Integration and final acceptance stay serial and dependent on all level outputs.
const fiveLevels = new Set([...afterCoreIsolation, ...contentIds.slice(0,5)])
ready = readyTasks(tasks, fiveLevels)
expect(!ready.some(t => t.id === 'LC-INT-001'), 'integration unlocked before all six level implementations')
const sixLevels = new Set([...fiveLevels, contentIds[5]])
ready = readyTasks(tasks, sixLevels)
expect(ready.some(t => t.id === 'LC-INT-001'), 'integration did not unlock after all six levels')

for (const task of tasks.filter(t => ['content','integration','final-acceptance','hardening','supervisor-readiness','cross-level-audit','core-infrastructure'].includes(t.kind))) {
  expect(task.requiresEvidenceReady === true, `${task.id} must require evidence-ready supervisor gate`)
}

// Release hardening cannot rewrite the evidence corpus after supervisor acceptance.
const releaseTask = byId.get('LC-RC-001')
expect(releaseTask && !releaseTask.writeScopes.some(s => s === 'docs/**' || s.startsWith('docs/research')), 'LC-RC-001 must not be allowed to rewrite supervisor research evidence')

// Evidence validator regression: 100 unique primary studies across 10 topics should pass.
const topics = ['retrieval','spacing','feedback','transfer','motivation','cognitive-load','interaction','vocabulary','assessment','self-regulation']
const corpus = Array.from({ length: 100 }, (_, i) => ({
  id: `TEST-${String(i+1).padStart(3,'0')}`,
  title: `Synthetic validator study ${i+1}`,
  authors: [`Researcher ${i+1}`],
  year: 2020,
  design: 'randomized controlled experiment',
  sampleSize: 60 + i,
  population: 'adult learners',
  venue: 'Peer-reviewed journal',
  institution: 'Accredited university',
  topic: topics[i % topics.length],
  outcome: 'measured learning outcome',
  limitations: 'synthetic regression fixture only',
  sourceUrl: `https://publisher.example/study-${i+1}`,
  persistentId: `doi:10.1234/test.${i+1}`,
  verificationSources: [`https://doi.org/10.1234/test.${i+1}`, `https://publisher.example/study-${i+1}`],
  verifiedAt: '2026-08-21',
  qualityGrade: 'A',
  qualityRationale: 'synthetic complete record for validator regression',
  sourceType: 'primary',
  verified: true,
}))
let evidence = validateCorpus('fixture', corpus)
expect(evidence.errors.length === 0, `valid 100-study corpus was rejected: ${evidence.errors.slice(0,3).join('; ')}`)

const duplicate = structuredClone(corpus)
duplicate[99].persistentId = duplicate[0].persistentId
evidence = validateCorpus('fixture', duplicate)
expect(evidence.errors.some(e => e.includes('duplicate study')), 'duplicate primary study was not rejected')

const review = structuredClone(corpus)
review[0].sourceType = 'meta-analysis'
evidence = validateCorpus('fixture', review)
expect(evidence.errors.some(e => e.includes('sourceType must be primary')), 'meta-analysis was allowed to count as a primary study')

const unverifiable = structuredClone(corpus)
unverifiable[0].verificationSources = ['https://publisher.example/a','https://publisher.example/b']
evidence = validateCorpus('fixture', unverifiable)
expect(evidence.errors.some(e => e.includes('DOI/Crossref, PubMed or ERIC')), 'record without independent identity source was accepted')

const imbalanced = structuredClone(corpus)
for (let i = 0; i < 40; i++) imbalanced[i].topic = 'retrieval'
evidence = validateCorpus('fixture', imbalanced)
expect(evidence.errors.some(e => e.includes('exceeds 35%')), 'over-concentrated evidence corpus was accepted')

// Both automatic entry paths must invoke the SAME cycle implementation. This pins
// the bridge into the already-proven serial chain and prevents orchestrator drift.
const chain = readFileSync(new URL('../workflows/claude-chain.yml', import.meta.url), 'utf8')
const standalone = readFileSync(new URL('../workflows/curriculum-foundry.yml', import.meta.url), 'utf8')
const cycle = readFileSync(new URL('./run-foundry-cycle.sh', import.meta.url), 'utf8')
const worker = readFileSync(new URL('../workflows/claude-foundry-worker.yml', import.meta.url), 'utf8')
expect(chain.includes('bash .github/scripts/run-foundry-cycle.sh'), 'proven Claude chain is not bridged to Foundry cycle')
expect(chain.includes("startsWith(github.event.workflow_run.head_branch, 'foundry/')"), 'proven chain does not self-heal red Foundry QA events')
expect(standalone.includes('bash .github/scripts/run-foundry-cycle.sh'), 'standalone watchdog does not share Foundry cycle implementation')
expect(cycle.includes('merge-foundry-pr.sh'), 'Foundry cycle does not use the guarded merge helper')
expect(cycle.includes('gh workflow run claude-foundry-worker.yml'), 'Foundry cycle cannot dispatch workers')
expect(cycle.includes('worker already queued/running'), 'Foundry cycle lacks duplicate-run guard')
expect(worker.includes('--partial pedagogical') && worker.includes('--partial psychology'), 'research worker prompt is not aligned with per-batch evidence validation')

if (!process.exitCode) console.log(`Foundry automation contract OK: ${tasks.length} tasks, acyclic DAG, guarded fan-out/fan-in, shared self-healing cycle, write isolation and 100+100 evidence validator regression.`)
