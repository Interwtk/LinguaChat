#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process'
import process from 'node:process'
import { loadManifest } from './foundry-next.mjs'

const arg = (name) => {
  const i = process.argv.indexOf(name)
  return i >= 0 ? process.argv[i + 1] : null
}
const branch = arg('--branch') || process.env.FOUNDRY_BRANCH || ''
const base = arg('--base') || process.env.FOUNDRY_BASE || 'origin/main'
const head = arg('--head') || process.env.FOUNDRY_HEAD || 'HEAD'
const requireComplete = process.argv.includes('--require-complete')
if (!branch.startsWith('foundry/')) {
  console.log('Not a foundry branch; scope guard skipped.')
  process.exit(0)
}
const manifest = loadManifest()
const task = manifest.tasks.find(t => t.branch === branch)
if (!task) {
  console.error(`No manifest task owns ${branch}`)
  process.exit(1)
}
const marker = `.ai/foundry/completed/${task.id}.json`
const request = `.ai/foundry/requests/${task.id}.md`
const scopes = [...task.writeScopes, marker, request]

function allowed(path) {
  return scopes.some(scope => {
    if (scope.endsWith('/**')) return path.startsWith(scope.slice(0, -3))
    if (scope.endsWith('*')) return path.startsWith(scope.slice(0, -1))
    return path === scope
  })
}
let changed
try {
  changed = execFileSync('git', ['diff','--name-only',`${base}...${head}`], { encoding:'utf8' }).trim().split('\n').filter(Boolean)
} catch (e) {
  console.error(`Could not compute foundry diff ${base}...${head}`)
  process.exit(1)
}
const violations = changed.filter(p => !allowed(p))
if (violations.length) {
  console.error(`Foundry write-scope violation for ${task.id}:`)
  violations.forEach(p => console.error(`- ${p}`))
  console.error('Allowed scopes:')
  scopes.forEach(s => console.error(`  ${s}`))
  process.exit(1)
}
console.log(`Foundry scope OK for ${task.id}: ${changed.length} changed files.`)

if (requireComplete) {
  if (!changed.includes(marker)) {
    console.error(`Ready PR must add ${marker}`)
    process.exit(1)
  }
  let markerText
  try {
    markerText = execFileSync('git', ['show', `${head}:${marker}`], { encoding:'utf8', stdio:['ignore','pipe','pipe'] })
  } catch (e) {
    console.error(`Ready PR must add ${marker}`)
    process.exit(1)
  }
  let m
  try { m = JSON.parse(markerText) } catch (e) {
    console.error(`Invalid completion marker: ${e.message}`); process.exit(1)
  }
  if (m.taskId !== task.id || m.status !== 'complete' || Number(m.cleanCycles) < 2) {
    console.error(`Completion marker must contain taskId=${task.id}, status=complete, cleanCycles>=2`)
    process.exit(1)
  }

  const evidenceScript = new URL('./check-supervisor-evidence.mjs', import.meta.url).pathname
  if (task.kind === 'research-ped' || task.kind === 'research-psy') {
    const domain = task.kind === 'research-ped' ? 'pedagogical' : 'psychology'
    const gate = spawnSync(process.execPath, [evidenceScript, '--partial', domain], { stdio:'inherit' })
    if (gate.status !== 0) process.exit(gate.status || 1)
  }
  if (task.requiresEvidenceReady) {
    const gate = spawnSync(process.execPath, [evidenceScript], { stdio:'inherit' })
    if (gate.status !== 0) process.exit(gate.status || 1)
  }
}
