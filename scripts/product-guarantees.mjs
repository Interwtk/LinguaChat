// Product guarantees, asserted directly (complements check:all). Part of scripts/qa-cycle.mjs.
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const FE = join(ROOT, 'linguachat-frontend'), BE = join(ROOT, 'linguachat-backend')
const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 })
const read = p => readFileSync(join(ROOT, p), 'utf8')
const results = []
const check = (name, ok, detail = '') => results.push({ name, ok: Boolean(ok), detail })
const walk = (dir, out = []) => { for (const e of readdirSync(dir, { withFileTypes: true })) { const p = join(dir, e.name); e.isDirectory() ? walk(p, out) : out.push(p) } return out }

const runtime = await import(pathToFileURL(join(FE, 'src/cloud/runtime.js')))
check('CLOUD_PREFERENCES_RELEASED === false', runtime.CLOUD_PREFERENCES_RELEASED === false)

const levels = await import(pathToFileURL(join(FE, 'src/learning/curriculum/levels.js')))
const open = levels.LEVELS.filter(l => l.available).map(l => l.id)
check('only Pre-A1 available; A1–C2 closed', open.length === 1 && open[0] === levels.PRE_A1, `open=${open.join(',')}`)
check('A1 contentStatus partial', levels.LEVELS.find(l => l.id === levels.A1)?.contentStatus === 'partial')

const FROZEN = ['linguachat-frontend/src/learning/curriculum/preA1Map.js', 'linguachat-frontend/src/learning/curriculum/preA1Skeleton.generated.js',
  'linguachat-frontend/src/learning/episodes/preA1Content.js', 'docs/curriculum/pre-a1-freeze.md', 'docs/curriculum/pre-a1-map.md',
  'docs/curriculum/a1-blueprint.json', 'docs/curriculum/blueprints']
check('frozen curriculum paths exist', FROZEN.every(p => existsSync(join(ROOT, p))), FROZEN.filter(p => !existsSync(join(ROOT, p))).join(','))
const preA1 = git('diff', '--name-only', '086323c', 'HEAD', '--', ...FROZEN).trim()
check('Pre-A1 content, freeze docs and blueprints untouched vs main', !preA1, preA1)

const srcFiles = walk(join(FE, 'src')).filter(p => /\.(jsx?|mjs)$/.test(p))
const importsPrepared = srcFiles.filter(p => /from\s+['"][^'"]*prepared\//.test(readFileSync(p, 'utf8')))
check('prepared/a1Readiness.js isolated (no src import)', existsSync(join(FE, 'prepared/a1Readiness.js')) && !importsPrepared.length, importsPrepared.join(','))

const lingo = srcFiles.filter(p => /['"`][^'"`\n]*\bLingo\b/.test(readFileSync(p, 'utf8')))
check('no "Lingo" in UI strings', !lingo.length, lingo.join(','))
const locales = readdirSync(join(FE, 'src/i18n/locales')).filter(f => f.endsWith('.js')).sort()
check('eight auxiliary languages (en + 7 locales)', locales.join(',') === 'ar.js,de.js,es.js,fr.js,it.js,ja.js,pt.js' && existsSync(join(FE, 'src/i18n/translations.js')), locales.join(','))

const engine = read('linguachat-backend/ai/local_engine.py')
check('local evaluator wired into /chat (evaluate_chat_turn)', /from ai\.chat_evaluation import evaluate_chat_turn/.test(engine) && /evaluate_chat_turn\(message/.test(engine))
check('provider default is local', /DEFAULT_MODE = MODE_LOCAL/.test(read('linguachat-backend/ai/provider_policy.py')))

const pkg = JSON.parse(read('linguachat-frontend/package.json'))
const all = pkg.scripts['check:all']
const REQUIRED = ['check-ledger-integrity', 'check-chat-observations', 'check-learner-level', 'check-adaptation-policy', 'check-bundle-boundaries',
  'check-line-endings', 'check-placement-honesty', 'check-pre-a1-freeze', 'check-curriculum-authoring', 'check-session-surfaces']
check('check:all keeps the guarantee suites', REQUIRED.every(s => all.includes(s)), REQUIRED.filter(s => !all.includes(s)).join(','))
check('check:all carries every required step', ['check-es-course', 'check-age-gate', 'check-es-session', 'check-learner-data', 'check-auth-journeys', 'check-es-unseen', 'check-premium-practice', 'qa-real-journeys.mjs --self-test', 'check-jq-lite'].every(n => all.includes(n)), String(all.split('&&').length))

const dist = join(FE, 'dist')
if (existsSync(dist)) {
  const files = walk(dist)
  const benchLeaks = files.filter(p => /bench/i.test(p) || (/\.js$/.test(p) && /bench\/main|scene=tu|saveFailing/.test(readFileSync(p, 'utf8'))))
  check('dev bench absent from production bundle', !benchLeaks.length, benchLeaks.join(','))
} else check('dev bench absent from production bundle', false, 'no dist — run build first')

const tracked = git('ls-files').trim().split('\n')
const forbidden = tracked.filter(p => /(^|\/)(node_modules|dist|\.venv|__pycache__)\/|\.zip$|(^|\/)\.env(\.|$)(?!example)|_snapshot-|_originals-/.test(p) && !/\.env\.example$/.test(p))
check('no forbidden tracked paths (deps, builds, env, zips, backups)', !forbidden.length, forbidden.join(','))
const crlf = git('ls-files', '--eol').trim().split('\n').filter(l => /\bi\/crlf\b|\bw\/crlf\b/.test(l))
check('no CRLF in tracked text', !crlf.length, crlf.slice(0, 5).join(' | '))

const SECRET = /(sk-[A-Za-z0-9]{20,}|sk-ant-[A-Za-z0-9-]{20,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}|BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY|gh[pousr]_[A-Za-z0-9]{30,}|AKIA[0-9A-Z]{16}|(OPENAI|ANTHROPIC|SUPABASE_SERVICE_ROLE)[A-Z_]*\s*=\s*['"]?[A-Za-z0-9_\-]{16,})/
const changed = git('diff', '--name-only', '086323c', 'HEAD').trim().split('\n').filter(p => existsSync(join(ROOT, p)))
const hits = changed.filter(p => SECRET.test(readFileSync(join(ROOT, p), 'utf8')))
check('secret scan over changed files: no key/token/JWT/private key values', !hits.length, hits.join(','))

for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.name}${r.detail ? ' — ' + r.detail : ''}`)
const failed = results.filter(r => !r.ok).length
console.log(`guarantees — ${results.length - failed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
