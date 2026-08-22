/*
 * run-all — every LC-CONT-B1 self-validation script, in arc order. Not wired
 * into `package.json#/scripts/check:all` (package.json is out of this
 * task's write scope; see docs/curriculum/implementation/b1/README.md) —
 * run directly with `node scripts/foundry/b1/run-all.mjs` from
 * `linguachat-frontend/`.
 */
import { spawnSync } from 'node:child_process'

const SCRIPTS = [
  'check-b1-arc1.mjs',
  'check-b1-arc2.mjs',
  'check-b1-arc3.mjs',
  'check-b1-arc4.mjs',
  'check-b1-arc5.mjs',
  'check-b1-arc6.mjs',
  'check-b1-arc7.mjs',
]

let failed = false
for (const script of SCRIPTS) {
  const result = spawnSync(process.execPath, [new URL(script, import.meta.url).pathname], { stdio: 'inherit' })
  if (result.status !== 0) failed = true
}
if (failed) {
  console.error('\nrun-all: one or more B1 self-validation scripts FAILED')
  process.exit(1)
}
console.log('\nrun-all: all B1 self-validation scripts passed (7 arcs, all required + should-have + optional B1 capabilities)')
