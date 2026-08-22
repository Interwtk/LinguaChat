/*
 * run-all — every LC-CONT-B2 self-validation script, in dependency order.
 * Not wired into `package.json#/scripts/check:all` (package.json is out of
 * this task's write scope; see docs/curriculum/implementation/b2/README.md)
 * — run directly with `node scripts/foundry/b2/run-all.mjs` from
 * `linguachat-frontend/`.
 */
import { spawnSync } from 'node:child_process'

const SCRIPTS = [
  'check-b2-blueprint-fidelity.mjs',
  'check-b2-capability-graph.mjs',
  'check-b2-vocabulary-budget.mjs',
  'check-b2-intent-catalog.mjs',
  'check-b2-arc-content.mjs',
  'check-b2-evidence-paths.mjs',
  'check-b2-reuse-matrix.mjs',
  'check-b2-personalization-invariant.mjs',
]

let failed = false
for (const script of SCRIPTS) {
  const result = spawnSync(process.execPath, [new URL(script, import.meta.url).pathname], { stdio: 'inherit' })
  if (result.status !== 0) failed = true
}
if (failed) {
  console.error('\nrun-all: one or more B2 self-validation scripts FAILED')
  process.exit(1)
}
console.log('\nrun-all: all B2 self-validation scripts passed')
