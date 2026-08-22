/*
 * run-all — every LC-CONT-C2 self-validation script, in dependency order.
 * Not wired into `package.json#/scripts/check:all` (package.json is out of
 * this task's write scope) — run directly with
 * `node scripts/foundry/c2/run-all.mjs` from `linguachat-frontend/`.
 */
import { spawnSync } from 'node:child_process'

const SCRIPTS = [
  'check-c2-content-plan.mjs',
  'check-c2-blueprint-fidelity.mjs',
  'check-c2-capability-graph.mjs',
  'check-c2-vocabulary-budget.mjs',
  'check-c2-intent-catalog.mjs',
  'check-c2-arc-content.mjs',
  'check-c2-evidence-paths.mjs',
  'check-c2-multi-turn-spans.mjs',
  'check-c2-reuse-matrix.mjs',
  'check-c2-personalization-invariant.mjs',
]

let failed = false
for (const script of SCRIPTS) {
  const result = spawnSync(process.execPath, [new URL(script, import.meta.url).pathname], { stdio: 'inherit' })
  if (result.status !== 0) failed = true
}
if (failed) {
  console.error('\nrun-all: one or more C2 self-validation scripts FAILED')
  process.exit(1)
}
console.log('\nrun-all: all C2 self-validation scripts passed')
