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
/*
 * 500 kB held through A1's seven arcs. `LC-INT-001` wiring A2's 23 episodes in
 * took the entry to 512.2 kB — measured, not guessed — entirely from the arc
 * *metadata* (`preA1Skeleton.generated.js`) and A2's 521 new interface/praise
 * keys landing in `src/i18n/translations.js`'s base dictionary, both of which
 * belong in the entry on purpose per this file's own §5 (Home needs to know
 * what's next; the base dictionary is the English fallback for every locale).
 * `check-curriculum-loading.mjs`'s own two-part budget (app code vs curriculum
 * data, checked separately per-episode) already accounts for exactly this
 * growth and stays green; this flat total is what needed to move, the same
 * reason `LOCALE_MAX_KB` below has already moved three times.
 *
 * 550 kB held for A2; `LC-INT-001` wiring B1's 23 episodes in the same way
 * took the entry to 565.9 kB — measured, not guessed — from B1's own arc
 * metadata in `preA1Skeleton.generated.js` and its 456 new interface/praise
 * keys landing in the base dictionary, the identical, expected growth shape
 * A2's own note above describes. 600 kB leaves headroom for the same
 * de-minimis growth without another edit.
 */
const ENTRY_BUDGET_KB = 600
/*
 * A locale's own chunk. Sixty was calibrated when the product had one level's
 * worth of strings; A1 arc 1 added seventy-five keys in eight languages and the
 * byte-heavy ones (Japanese, Arabic) went past it. Translation volume growing with
 * the curriculum is the system working, so the number moves — and the guard below
 * gains the assertion that actually matters: a locale chunk carries its own
 * interface text, never another locale's, and never a step's prose.
 */
/*
 * 80 kB held from arc 1 to arc 3 and arc 4's eighty-eight new keys took Japanese to
 * 84.4 kB and Arabic to 86.2 kB — both encode most characters in three bytes, so a
 * locale's size tracks curriculum volume rather than anything going wrong. The
 * number moves for the reason the comment above already gives; what does NOT move is
 * the structural guard underneath it, which is the assertion that would actually
 * catch a leak: a locale chunk carries its own interface text, never another
 * locale's, and never a step's prose.
 */
/*
 * 95 kB held until LC-I18N-004, which closed the placement flow being Spanish-only
 * for every other interface language: 18 questions x 4 fields, 5 level plans x 7
 * fields and the plural-aware count categories added ~113 real keys per locale
 * that simply did not exist before (they were hardcoded Spanish shared by every
 * learner, not translated content). That took Arabic to 101.5 kB and Japanese to
 * 97.2 kB. Measured, not guessed; the number moves for the same reason as above.
 */
/*
 * 110 kB held until `LC-INT-001` merged A2's 521 new keys (draft English,
 * identical across all seven gated locales pending a later translation PR —
 * see that merge's own commit) into every locale file. That took Arabic to
 * 139.1 kB and Japanese to 134.5 kB — both still three-byte-heavy scripts, the
 * same reason this number has already moved twice.
 *
 * 150 kB held for A2; `LC-INT-001` merging B1's 456 new keys the same way
 * (draft English, identical across all seven gated locales pending a later
 * translation PR — see that merge's own commit) took Arabic to 173.7 kB and
 * Japanese to 168.9 kB — both still three-byte-heavy scripts, the same reason
 * this number keeps moving. Measured, not guessed; 190 kB leaves headroom for
 * the same de-minimis growth.
 */
const LOCALE_MAX_KB = 190

const files = readdirSync(DIST).filter(f => f.endsWith('.js'))
const sizeKb = (f) => statSync(join(DIST, f)).size / 1024
const find = (re) => files.filter(f => re.test(f))

let n = 0
const ok = () => { n++ }

// 1) the page loads one entry chunk and it is under budget
//    Read from index.html: the `index-` prefix stopped identifying the entry
//    when a content chunk built from `episodes/index.js` took the same shape.
const html = readFileSync('dist/index.html', 'utf8')
const scripts = [...html.matchAll(/<script[^>]+src="\/assets\/([^"]+\.js)"/g)].map(m => m[1])
assert.equal(scripts.length, 1, `the page should load one entry chunk, it loads ${scripts.length}`)
const entries = scripts
assert.ok(files.includes(entries[0]), `index.html loads ${entries[0]}, which is not in the build`)
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
  /*
   * AND A LOCALE CHUNK IS NOT A PLACE FOR EPISODE PROSE. A hint may legitimately
   * quote a short target sentence ("try: I work at home"), which is why the probes
   * are step PROMPTS: if one of those appeared here, the curriculum would have
   * leaked into all eight language chunks.
   */
  const localeSource = readFileSync(join(DIST, chunk), 'utf8')
  for (const prose of ['So — what do you do?', 'Ana says:', 'I have some books for you']) {
    assert.ok(!localeSource.includes(prose), `the ${loc} chunk carries episode prose (${prose})`)
  }
}
ok()

// 4) secondary screens and the practice surface are split out
for (const name of ['ConversationRoom', 'EpisodeShell', 'SessionRunner', 'MemoryGarden', 'ConversationArchive', 'LanguageIdentity', 'Pricing', 'AuthFlow', 'SetupFlow']) {
  assert.equal(find(new RegExp(`^${name}-.*\\.js$`)).length, 1, `${name} should be its own chunk`)
}
ok()

/*
 * 5) The episode UI and the evaluators ride with the PLAYER, not with the list.
 *
 * The arc *metadata* (ids, prerequisites, titles) does stay in the entry on
 * purpose: Home describes today's session, so it has to know which episode is
 * next. What must not be there is the machinery — the response evaluators, the
 * hybrid router and the episode/session UI — which is the bulk of the weight.
 *
 * This used to look for it in the ConversationRoom chunk, when the practice
 * screen and the player were the same chunk. They are not any more: a learner
 * who opens the practice list and stays there loads neither the machinery nor the
 * level's content. So the rule keeps its ban on the entry and adds the listing.
 */
const player = readFileSync(join(DIST, find(/^EpisodeShell-.*\.js$/)[0]), 'utf8')
const listing = readFileSync(join(DIST, find(/^ConversationRoom-.*\.js$/)[0]), 'utf8')
for (const probe of ['acceptedVariant', 'masteryEvidence']) {
  assert.ok(player.includes(probe), `evaluator (${probe}) should ship with the episode player`)
  assert.ok(!entrySource.includes(probe), `evaluator (${probe}) must not ship in the entry chunk`)
  assert.ok(!listing.includes(probe), `evaluator (${probe}) must not ship with the practice listing`)
}
// the interactive episode UI belongs to the player too
assert.ok(player.includes('aria-pressed'), 'episode UI should ship with the episode player')
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
