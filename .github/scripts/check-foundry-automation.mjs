#!/usr/bin/env node
import { loadManifest, readyTasks } from './foundry-next.mjs'

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

if (!process.exitCode) console.log(`Foundry automation contract OK: ${tasks.length} tasks, acyclic DAG, guarded fan-out/fan-in and evidence gates.`)
