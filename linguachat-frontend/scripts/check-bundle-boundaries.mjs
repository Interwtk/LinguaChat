/*
 * check-bundle-boundaries — the code-splitting contract, asserted on the real
 * build output in dist/.
 *
 * The entry chunk is what every learner downloads before seeing anything, so it
 * is budgeted. Screens they may never open, the practice/episode engine and the
 * seven non-English interface locales must live in their own chunks. Run after
 * `npm run build`; it skips (without failing) when dist/ is absent, so the
 * check suite still works on a fresh clone.
 */
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const DIST = resolve(here, '../dist/assets')

if (!existsSync(DIST)) {
  console.log('check-bundle-boundaries — SKIPPED (no dist/, run `npm run build` first)')
  process.exit(0)
}

// Budgets in kB. The entry sat at 645 kB before splitting; 500 kB is Vite's own
// warning threshold and the number we must stay under.
const ENTRY_BUDGET_KB = 500
const LOCALE_MAX_KB = 60

const files = readdirSync(DIST).filter(f => f.endsWith('.js'))
const sizeKb = (f) => statSync(join(DIST, f)).size / 1024
const find = (re) => files.filter(f => re.test(f))

let n = 0
const ok = () => { n++ }

// 1) there is exactly one entry chunk and it is under budget
const entries = find(/^index-.*\.js$/)
assert.equal(entries.length, 1, `expected one entry chunk, found ${entries.length}`)
const entryKb = sizeKb(entries[0])
assert.ok(entryKb < ENTRY_BUDGET_KB,
  `entry chunk is ${entryKb.toFixed(1)} kB, over the ${ENTRY_BUDGET_KB} kB budget`)
ok()

// 2) every non-English interface locale is its own chunk, none in the entry
const LOCALES = ['es', 'pt', 'fr', 'it', 'de', 'ja', 'ar']
const entrySource = readFileSync(join(DIST, entries[0]), 'utf8')
for (const loc of LOCALES) {
  const chunk = find(new RegExp(`^${loc}-.*\\.js$`))
  assert.equal(chunk.length, 1, `locale ${loc} should be exactly one chunk, found ${chunk.length}`)
  assert.ok(sizeKb(chunk[0]) < LOCALE_MAX_KB, `locale ${loc} chunk unexpectedly large`)
}
ok()

// 3) a locale's strings must NOT be inlined into the entry. Probe with strings
//    that only exist in a translated dictionary.
const LOCALE_PROBES = [
  ['es', 'Comenzar sesión'],
  ['de', 'Einheit starten'],
  ['ja', 'セッションを始める'],
  ['ar', 'ابدأ الجلسة'],
]
for (const [loc, probe] of LOCALE_PROBES) {
  assert.ok(!entrySource.includes(probe), `entry chunk contains ${loc} strings (${probe})`)
  const chunk = find(new RegExp(`^${loc}-.*\\.js$`))[0]
  assert.ok(readFileSync(join(DIST, chunk), 'utf8').includes(probe), `${loc} chunk is missing its own strings`)
}
ok()

// 4) secondary screens and the practice surface are split out
for (const name of ['ConversationRoom', 'MemoryGarden', 'ConversationArchive', 'LanguageIdentity', 'Pricing', 'AuthFlow', 'SetupFlow']) {
  assert.equal(find(new RegExp(`^${name}-.*\\.js$`)).length, 1, `${name} should be its own chunk`)
}
ok()

/*
 * 5) The episode UI and the evaluators ride with the practice chunk.
 *
 * The arc *metadata* (ids, prerequisites, titles) does stay in the entry on
 * purpose: Home describes today's session, so it has to know which episode is
 * next. What must not be there is the machinery — the response evaluators, the
 * hybrid router and the episode/session UI — which is the bulk of the weight.
 */
const practice = readFileSync(join(DIST, find(/^ConversationRoom-.*\.js$/)[0]), 'utf8')
for (const probe of ['acceptedVariant', 'masteryEvidence']) {
  assert.ok(practice.includes(probe), `evaluator (${probe}) should ship with the practice chunk`)
  assert.ok(!entrySource.includes(probe), `evaluator (${probe}) must not ship in the entry chunk`)
}
// the interactive episode UI belongs to practice too
assert.ok(practice.includes('aria-pressed'), 'episode UI should ship with the practice chunk')
ok()

// 6) no check script or test helper ever reaches the bundle
for (const f of files) {
  const src = readFileSync(join(DIST, f), 'utf8')
  assert.ok(!src.includes('check-daily-session'), `${f} contains check-script code`)
  assert.ok(!src.includes('node:assert'), `${f} contains node-only test code`)
}
ok()

// 7) Chatto ships only in web-sized renditions — never the 1254px masters
const images = readdirSync(DIST).filter(f => /\.(png|webp|jpg)$/.test(f))
const chatto = images.filter(f => /chatto/.test(f))
assert.ok(chatto.length > 0, 'expected Chatto renditions in the build')
for (const img of chatto) {
  assert.ok(/-(128|256|384)-/.test(img), `unexpected Chatto asset in build: ${img}`)
  assert.ok(statSync(join(DIST, img)).size < 200 * 1024, `Chatto asset too large: ${img}`)
}
ok()

const totalKb = files.reduce((sum, f) => sum + sizeKb(f), 0)
console.log(`check-bundle-boundaries — OK  (${n} boundary groups; entry ${entryKb.toFixed(1)} kB, ${files.length} JS chunks, ${totalKb.toFixed(1)} kB total)`)
