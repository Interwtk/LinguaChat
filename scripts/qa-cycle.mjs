#!/usr/bin/env node
/*
 * qa-cycle — one complete QA cycle, every stage counted by exit code.
 *
 *   node scripts/qa-cycle.mjs <name>            logs in .qa/<name>/, result in result.json
 *   node scripts/qa-cycle.mjs --compare a b     are two cycles the same, on the same commit?
 *
 * The cycle passes only if EVERY stage ran and exited as required and the tree
 * was clean before and after. A stage that cannot start is a failure, never a
 * skip: phase 3's secret scan crashed inside its cycle and still printed "0".
 *
 * Declared differences from CI: check:github-integration uses jq-lite here
 * (LINGUACHAT_JQ_LITE=1) and the real jq there.
 */
import { execFileSync, spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const FE = join(ROOT, 'linguachat-frontend')
const BE = join(ROOT, 'linguachat-backend')
const venv = [join(BE, '.venv/Scripts/python.exe'), join(BE, '.venv/bin/python')].find(existsSync)
const PY = venv || 'python'
const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm'

const git = (...a) => execFileSync('git', ['-c', 'core.autocrlf=false', ...a], { cwd: ROOT, encoding: 'utf8' }).trim()

if (process.argv[2] === '--compare') {
  const [a, b] = process.argv.slice(3, 5).map(n => JSON.parse(readFileSync(join(ROOT, '.qa', n, 'result.json'), 'utf8')))
  const shape = r => JSON.stringify(r.stages.map(s => [s.name, s.exit, s.summary?.replace(/\b\d+(\.\d+)?m?s\b|in \d+s|127\.0\.0\.1:\d+/g, '')]))
  const ok = a.commit === b.commit && a.tree === b.tree && a.passed && b.passed && shape(a) === shape(b)
  console.log(`${ok ? 'IDENTICAL AND CLEAN' : 'NOT EQUIVALENT'} · ${a.name} ${a.commit.slice(0, 7)} ${a.passed ? 'PASS' : 'FAIL'} · ${b.name} ${b.commit.slice(0, 7)} ${b.passed ? 'PASS' : 'FAIL'}`)
  process.exit(ok ? 0 : 1)
}

const name = process.argv[2]
if (!name) { console.error('usage: qa-cycle.mjs <name> | --compare a b'); process.exit(2) }
const out = join(ROOT, '.qa', name)
rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })

const env = { ...process.env, LINGUACHAT_PROVIDER: 'local', OPENAI_ENABLED: 'false', PYTHONIOENCODING: 'utf-8', PYTHONDONTWRITEBYTECODE: '1' }
const stages = []

function stage(label, cmd, args, { cwd = ROOT, extraEnv = {}, summary = (t) => t.trim().split('\n').at(-1) } = {}) {
  const started = Date.now()
  const shell = process.platform === 'win32' && cmd === NPM
  const r = spawnSync(cmd, args, { cwd, env: { ...env, ...extraEnv }, encoding: 'utf8', maxBuffer: 1 << 28, shell })
  const text = `${r.stdout || ''}${r.stderr || ''}${r.error ? `\nSTAGE COULD NOT RUN: ${r.error.message}` : ''}`
  writeFileSync(join(out, `${String(stages.length + 1).padStart(2, '0')}-${label.replace(/[^a-z0-9]+/gi, '-')}.log`), text)
  const exit = r.error ? -1 : r.status ?? -1
  const row = { name: label, exit, seconds: Math.round((Date.now() - started) / 1000), summary: summary(text) || '' }
  stages.push(row)
  console.log(`${exit === 0 ? 'ok  ' : 'FAIL'} ${label} (exit ${exit}) :: ${row.summary.slice(0, 150)}`)
  return text
}

const head = { commit: git('rev-parse', 'HEAD'), tree: git('rev-parse', 'HEAD^{tree}'), branch: git('branch', '--show-current') }
const dirtyBefore = git('status', '--porcelain').split('\n').filter(Boolean).length
console.log(`qa-cycle ${name}: ${head.branch} @ ${head.commit.slice(0, 7)} dirty=${dirtyBefore}`)

// check:all, step by step, as CI does
const steps = JSON.parse(readFileSync(join(FE, 'package.json'), 'utf8')).scripts['check:all'].split('&&').map(s => s.trim())
const failedSteps = []
{
  const started = Date.now()
  const lines = []
  for (const step of steps) {
    const args = step.split(/\s+/).slice(1)
    const r = spawnSync(process.execPath, args, { cwd: FE, env, encoding: 'utf8', maxBuffer: 1 << 28 })
    if (r.status !== 0) { failedSteps.push(args.join(' ')); lines.push(`FAIL ${args.join(' ')}\n${(r.stdout || '').slice(-2000)}\n${(r.stderr || '').slice(-2000)}`) } else lines.push(`PASS ${args.join(' ')}`)
  }
  writeFileSync(join(out, '00-check-all.log'), lines.join('\n'))
  const row = { name: 'check:all', exit: failedSteps.length ? 1 : 0, seconds: Math.round((Date.now() - started) / 1000), summary: `${steps.length - failedSteps.length}/${steps.length} green${failedSteps.length ? `; failed: ${failedSteps.join(', ')}` : ''}` }
  stages.push(row)
  console.log(`${row.exit ? 'FAIL' : 'ok  '} check:all :: ${row.summary}`)
}

rmSync(join(FE, 'dist'), { recursive: true, force: true })
stage('build', NPM, ['run', 'build'], { cwd: FE, summary: t => (t.match(/assets\/index-[^\n]*/) || [''])[0].replace(/\x1b\[[0-9;]*m/g, '').replace(/\s+/g, ' ') })
stage('check:i18n', NPM, ['run', 'check:i18n'], { cwd: FE, summary: () => 'all locales' })
stage('check:github-integration (jq-lite)', NPM, ['run', 'check:github-integration'], { cwd: FE, extraEnv: { LINGUACHAT_JQ_LITE: '1' } })
for (const level of ['b1', 'b2', 'c1', 'c2']) stage(`foundry ${level}`, process.execPath, [`scripts/foundry/${level}/run-all.mjs`], { cwd: FE })
stage('foundry a2-structure', process.execPath, ['scripts/foundry/a2/check-a2-structure.mjs'], { cwd: FE })
stage('ledger integrity + P3 rollback (from git)', process.execPath, ['scripts/check-ledger-rollback.mjs', '--require'], { cwd: FE })
stage('adaptation policy', process.execPath, ['scripts/check-adaptation-policy.mjs', '--report'], { cwd: FE })
stage('cloud scope', process.execPath, ['.github/scripts/check-linguachat-cloud-scope.mjs'], { summary: t => t.trim().split('\n').at(-1) })
stage('cloud scope self-test', process.execPath, ['.github/scripts/check-linguachat-cloud-scope.mjs', '--self-test'])
stage('cloud scope tests', process.execPath, ['.github/scripts/check-linguachat-cloud-scope.test.mjs'])
stage('backend compileall', PY, ['-m', 'compileall', '-q', '-x', '\\.venv', '.'], { cwd: BE, summary: () => 'compiled' })
stage('backend pytest', PY, ['-m', 'pytest', '-q', '-p', 'no:cacheprovider'], { cwd: BE, summary: t => t.trim().split('\n').at(-1).replace(/ in [\d.]+s.*/, '') })
stage('independent safety evaluation (holdout, aggregates)', PY, ['tests/safety_eval/evaluate.py', 'holdout_v1', '--label', `qa-${name}`], { cwd: BE, summary: t => t.trim().split('\n').filter(l => l.startsWith('holdout')).join(' || ') })
stage('independent guided evaluation (holdout, aggregates)', PY, ['tests/guided_eval/evaluate.py', 'guided_holdout_v1', '--label', `qa-${name}`], { cwd: BE, summary: t => t.trim().split('\n').at(-1) })
stage('independent guided evaluation v2 (holdout, aggregates)', PY, ['tests/guided_eval/evaluate.py', 'guided_holdout_v2', '--label', `qa-${name}`], { cwd: BE, summary: t => t.trim().split('
').at(-1) })
stage('sealed safety set through the scenarios (aggregates)', PY, ['tests/guided_eval/evaluate.py', 'safety_holdout', '--label', `qa-${name}`], { cwd: BE, summary: t => t.trim().split('\n').at(-1) })

// HTTP end to end against a real server
{
  const port = 8500 + Math.floor(Math.random() * 400)
  const server = spawn(PY, ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', String(port)], { cwd: BE, env, stdio: 'ignore' })
  let up = false
  for (let i = 0; i < 60 && !up; i++) {
    up = await fetch(`http://127.0.0.1:${port}/docs`).then(r => r.ok).catch(() => false)
    if (!up) await new Promise(r => setTimeout(r, 500))
  }
  if (!up) stages.push({ name: 'e2e server start', exit: -1, seconds: 30, summary: 'server did not start' })
  stage('e2e tutor runtime', process.execPath, ['scripts/e2e-tutor-runtime.mjs', `http://127.0.0.1:${port}`], { cwd: FE })
  stage('e2e chat continuity', process.execPath, ['scripts/e2e-chat-continuity.mjs', `http://127.0.0.1:${port}`], { cwd: FE })
  server.kill()
}

stage('email templates', process.execPath, ['docs/auth-email/check-templates.mjs'])
stage('product guarantees', process.execPath, ['scripts/product-guarantees.mjs'])
stage('secret scan (tree)', process.execPath, ['scripts/secret-scan.mjs'], { summary: t => t.trim().split('\n').find(l => l.includes('self-test')) || t.slice(-200) })

const dirtyAfter = git('status', '--porcelain').split('\n').filter(Boolean).length
const passed = dirtyBefore === 0 && dirtyAfter === 0 && stages.every(s => s.exit === 0)
writeFileSync(join(out, 'result.json'), JSON.stringify({ name, ...head, dirtyBefore, dirtyAfter, passed, checkAllSteps: steps.length, stages }, null, 1))
console.log(`qa-cycle ${name}: ${passed ? 'PASS' : 'FAIL'} · ${stages.filter(s => s.exit === 0).length}/${stages.length} stages · dirty before ${dirtyBefore} after ${dirtyAfter} · ${head.commit.slice(0, 7)}`)
process.exit(passed ? 0 : 1)
