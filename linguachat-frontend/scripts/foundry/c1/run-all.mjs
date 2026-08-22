/*
 * run-all — every LC-CONT-C1 self-validation script, in dependency order.
 * Not wired into `package.json#/scripts/check:all` (package.json is out of
 * this task's write scope; see docs/curriculum/implementation/c1/README.md)
 * — run directly with `node scripts/foundry/c1/run-all.mjs` from
 * `linguachat-frontend/`.
 */
import { spawnSync } from 'node:child_process'

const SCRIPTS = [
  'check-c1-blueprint-fidelity.mjs',
  'check-c1-capability-graph.mjs',
  'check-c1-vocabulary-budget.mjs',
  'check-c1-intent-catalog.mjs',
  'check-c1-arc-content.mjs',
  'check-c1-evidence-paths.mjs',
  'check-c1-reuse-matrix.mjs',
  'check-c1-personalization-invariant.mjs',
]

let failed = false
for (const script of SCRIPTS) {
  const result = spawnSync(process.execPath, [new URL(script, import.meta.url).pathname], { stdio: 'inherit' })
  if (result.status !== 0) failed = true
}
if (failed) {
  console.error('\nrun-all: one or more C1 self-validation scripts FAILED')
  process.exit(1)
}
console.log('\nrun-all: all C1 self-validation scripts passed')
