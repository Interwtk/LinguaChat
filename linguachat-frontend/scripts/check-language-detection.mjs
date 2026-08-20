/*
 * check-language-detection — LC-I18N-005: first-launch device-language
 * detection without geo guessing.
 *
 * `docs/product/language-detection-contract.md` requires automatic detection
 * to choose the first device/browser preferred language LinguaChat can
 * actually serve, never merely the first preference regardless of support,
 * and to leave an explicit persisted choice untouched. This proves the
 * acceptance list in that contract's "QA acceptance" section directly
 * against `detectNativeLanguage()`/`ensureLanguagePreferences()`, the
 * functions the real first-launch code path calls.
 */
import assert from 'node:assert/strict'

let n = 0
const ok = () => { n++ }

function makeStore() {
  const data = new Map()
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
  }
}

/*
 * Node's own `globalThis.navigator` (added in Node 21) is a getter with no
 * setter, so a plain assignment throws; it stays configurable, so it can be
 * redefined for the scope of one scenario.
 */
function setNavigator(value) {
  Object.defineProperty(global, 'navigator', { value, configurable: true, writable: true })
}

async function freshLanguageModule(store, languages) {
  global.localStorage = store
  setNavigator({ languages, language: languages[0] })
  // an isolated module instance per scenario, same technique
  // check-user-language.mjs uses, so no scenario's state leaks into the next
  const mod = await import(`../src/services/language.js?scenario=${Math.random()}`)
  return mod
}

async function main() {
  // 1) es-CL, preferred over en-US -> Spanish (base locale, region dropped
  //    for storage purposes but the exact code is preserved for display).
  {
    const store = makeStore()
    const { detectNativeLanguage } = await freshLanguageModule(store, ['es-CL', 'en-US'])
    const info = detectNativeLanguage()
    assert.equal(info.base, 'es')
    assert.equal(info.code.toLowerCase(), 'es-cl')
    delete global.localStorage; delete global.navigator
    ok()
  }

  // 2) ja-JP, preferred over en-US -> Japanese
  {
    const store = makeStore()
    const { detectNativeLanguage } = await freshLanguageModule(store, ['ja-JP', 'en-US'])
    const info = detectNativeLanguage()
    assert.equal(info.base, 'ja')
    delete global.localStorage; delete global.navigator
    ok()
  }

  // 3) ar-SA, preferred over en-US -> Arabic
  {
    const store = makeStore()
    const { detectNativeLanguage } = await freshLanguageModule(store, ['ar-SA', 'en-US'])
    const info = detectNativeLanguage()
    assert.equal(info.base, 'ar')
    delete global.localStorage; delete global.navigator
    ok()
  }

  // 4) an unsupported first preference (Hindi is not an implemented locale)
  //    followed by supported English must resolve to English — never claim
  //    Hindi while actually rendering English copy.
  {
    const store = makeStore()
    const { detectNativeLanguage } = await freshLanguageModule(store, ['hi-IN', 'en-US'])
    const info = detectNativeLanguage()
    assert.equal(info.base, 'en', 'an unsupported preference must be skipped, not honoured')
    delete global.localStorage; delete global.navigator
    ok()
  }

  // 4b) THE regression this task exists for: unsupported preferences with NO
  //     supported preference anywhere in the list must still fall back to
  //     English rather than picking the first (unsupported) candidate. The
  //     old implementation took `candidates.find(Boolean)` unconditionally.
  {
    const store = makeStore()
    const { detectNativeLanguage } = await freshLanguageModule(store, ['hi-IN', 'ko-KR', 'th-TH'])
    const info = detectNativeLanguage()
    assert.equal(info.base, 'en', 'no supported candidate anywhere must still resolve to English, not the first unsupported one')
    delete global.localStorage; delete global.navigator
    ok()
  }

  // 5) regional fallback: pt-BR is not itself a distinct implemented locale,
  //    but its base `pt` is — the region variant must resolve to the base
  //    that is actually supported, not to English.
  {
    const store = makeStore()
    const { detectNativeLanguage } = await freshLanguageModule(store, ['pt-BR', 'en-US'])
    const info = detectNativeLanguage()
    assert.equal(info.base, 'pt', 'a regional variant of a supported base must resolve to that base, not fall through to English')
    delete global.localStorage; delete global.navigator
    ok()
  }

  // 6) a persisted manual choice always wins over the current device
  //    preference list — the whole point of a switcher the learner can use
  //    to override automatic detection.
  {
    const store = makeStore()
    const first = await freshLanguageModule(store, ['ja-JP'])
    first.setNativeLanguage('ar') // explicit learner choice
    delete global.localStorage; delete global.navigator

    // "reload" with a totally different device preference — must not move
    const reloaded = await freshLanguageModule(store, ['fr-FR', 'en-US'])
    const prefs = reloaded.ensureLanguagePreferences()
    assert.equal(prefs.nativeLanguage.base, 'ar', 'an explicit persisted choice must survive a later device-preference change')
    delete global.localStorage; delete global.navigator
    ok()
  }

  // 7) target language is never affected by detection — it is always English
  //    regardless of which auxiliary language was detected.
  {
    const store = makeStore()
    const { ensureLanguagePreferences } = await freshLanguageModule(store, ['ar-SA'])
    const prefs = ensureLanguagePreferences()
    assert.equal(prefs.targetLanguage.base, 'en')
    delete global.localStorage; delete global.navigator
    ok()
  }

  // 8) no location API is read for language selection — detection depends
  //    only on navigator.language(s), never on geolocation.
  {
    const store = makeStore()
    setNavigator({ languages: ['es-CL'], geolocation: { getCurrentPosition: () => { throw new Error('must not be called') } } })
    global.localStorage = store
    const { detectNativeLanguage } = await import(`../src/services/language.js?scenario=${Math.random()}`)
    assert.equal(detectNativeLanguage().base, 'es')
    delete global.localStorage; delete global.navigator
    ok()
  }

  console.log(`check-language-detection — OK  (${n} first-launch detection groups verified)`)
}

main().catch((e) => { console.error('check-language-detection — FAIL\n', e.message); process.exit(1) })
