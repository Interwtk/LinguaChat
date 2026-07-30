/*
 * check-locale-loading — the lazy-locale contract.
 *
 * Interface locales are fetched on demand, so the rules that used to be
 * guaranteed by "everything is already in memory" now need asserting: English
 * is always available as the fallback, a locale resolves once loaded, an
 * unavailable locale degrades to English (never to a raw key), and a failed
 * chunk cannot leave the interface blank.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { translate, loadLocale, isLocaleReady, normalizeLocale, SUPPORTED_LOCALES } from '../src/i18n/translations.js'

const here = dirname(fileURLToPath(import.meta.url))
const read = (p) => readFileSync(resolve(here, '..', p), 'utf8')

let n = 0
const ok = () => { n++ }

async function main() {
  // 1) English is present from the first tick — it is the fallback
  assert.equal(isLocaleReady('en'), true)
  assert.equal(translate('en', 'sessionStartCta'), 'Start session')
  ok()

  // 2) a locale that has not loaded yet falls back to English, NEVER to a key
  assert.equal(isLocaleReady('de'), false)
  const beforeLoad = translate('de', 'sessionStartCta')
  assert.equal(beforeLoad, 'Start session', 'unloaded locale must fall back to English')
  assert.notEqual(beforeLoad, 'sessionStartCta', 'a raw key must never be shown')
  ok()

  // 3) after loading, the locale resolves in its own language
  await loadLocale('de')
  assert.equal(isLocaleReady('de'), true)
  assert.equal(translate('de', 'sessionStartCta'), 'Einheit starten')
  ok()

  // 4) every declared locale loads and translates a known key
  const EXPECTED = {
    es: 'Comenzar sesión', pt: 'Começar sessão', fr: 'Commencer la séance',
    it: 'Inizia la sessione', ja: 'セッションを始める', ar: 'ابدأ الجلسة',
  }
  for (const [loc, expected] of Object.entries(EXPECTED)) {
    await loadLocale(loc)
    assert.equal(translate(loc, 'sessionStartCta'), expected, `${loc} failed to resolve`)
  }
  ok()

  // 5) regional codes resolve to their base locale (es-CO -> es)
  assert.equal(normalizeLocale('es-CO'), 'es')
  assert.equal(normalizeLocale('pt-BR'), 'pt')
  assert.equal(translate('es-CO', 'sessionStartCta'), 'Comenzar sesión')
  ok()

  // 6) an unknown language degrades to English instead of throwing
  assert.equal(normalizeLocale('xx'), 'en')
  assert.equal(normalizeLocale(undefined), 'en')
  assert.equal(translate('xx', 'sessionStartCta'), 'Start session')
  ok()

  // 7) loading is idempotent and concurrent callers share one fetch
  const [a, b] = await Promise.all([loadLocale('fr'), loadLocale('fr')])
  assert.equal(a, b, 'concurrent loads must resolve to the same dictionary')
  ok()

  // 8) interpolation still works through a lazily-loaded locale
  const minutes = translate('es', 'sessionMinutes', { minutes: 10 })
  assert.ok(minutes.includes('10'), 'placeholders must interpolate after lazy load')
  assert.ok(!minutes.includes('{minutes}'), 'placeholder left unresolved')
  ok()

  // 9) the eight supported locales are exactly the ones we ship
  assert.deepEqual([...SUPPORTED_LOCALES].sort(), ['ar', 'de', 'en', 'es', 'fr', 'it', 'ja', 'pt'])
  ok()

  /*
   * 10) Structural guarantees that cannot be observed from Node: a failing chunk
   *     must not blank the screen, must not wipe stored progress, and must offer
   *     a retry in the interface language.
   */
  const boundary = read('src/components/ui/LazyBoundary.jsx')
  assert.ok(/\.catch\(/.test(boundary), 'a failed chunk import must be caught')
  assert.ok(/role="alert"/.test(boundary), 'chunk failure must be announced')
  assert.ok(/role="status"/.test(boundary) && /aria-busy/.test(boundary), 'loading state must be announced')
  /*
   * Retry must genuinely re-run the import. React.lazy memoises the rejected
   * promise, so a boundary that only resets its own state shows the same failure
   * forever — verified against a real 404 during this sprint. The loader keeps
   * an attempt counter and re-invokes the factory instead.
   */
  assert.ok(!/\blazy\(/.test(boundary), 'React.lazy caches rejections; do not use it for retryable screens')
  assert.ok(/setAttempt\(a => a \+ 1\)/.test(boundary), 'retry must bump the attempt counter')
  assert.ok(/\[attempt\]/.test(boundary), 'the import must re-run when the attempt changes')
  // no actual storage calls (a mention in a comment is fine)
  assert.ok(!/localStorage\s*\.\s*(setItem|removeItem|clear)/.test(boundary),
    'a chunk failure must never write to or clear stored progress')
  /*
   * A browser caches the failed module, so an in-place retry alone cannot
   * recover — verified against a real 404. One reload rebuilds the module map,
   * and it must be guarded so a permanently missing chunk cannot loop.
   */
  if (/location\.reload/.test(boundary)) {
    assert.ok(/sessionStorage\.getItem\(RELOAD_GUARD\)/.test(boundary), 'a reload recovery must be guarded')
    assert.ok(/sessionStorage\.setItem\(RELOAD_GUARD/.test(boundary), 'the reload guard must be recorded')
    assert.ok(/sessionStorage\.removeItem\(RELOAD_GUARD\)/.test(boundary), 'a successful load must clear the guard')
    assert.ok(/attempt >= 1/.test(boundary), 'reload only after an in-place retry already failed')
  }
  assert.ok(!/ChattoMascot/.test(boundary), 'the mascot must not be used as a spinner')
  /*
   * A component-lifetime "is mounted" ref hangs the screen on its loading label:
   * StrictMode (and any real remount) runs cleanup once, the ref stays false and
   * every later import result is discarded. Reproduced during this sprint — the
   * per-effect cancelled flag is the correct guard.
   */
  assert.ok(!/alive\.current/.test(boundary), 'do not gate the import result on a mounted-ref')
  assert.ok(/let cancelled = false/.test(boundary) && /return \(\) => \{ cancelled = true \}/.test(boundary),
    'the import must be guarded per effect run, not per component lifetime')
  ok()

  // 11) locale files never leak into the entry graph via a static import
  const translations = read('src/i18n/translations.js')
  assert.ok(!/^import .* from '\.\/locales\//m.test(translations), 'locales must only be imported dynamically')
  assert.ok(/import\('\.\/locales\//.test(translations), 'locales must be dynamically imported')
  ok()

  console.log(`check-locale-loading — OK  (${n} locale-loading groups verified)`)
}

main().catch((e) => { console.error('check-locale-loading — FAIL\n', e.message); process.exit(1) })
