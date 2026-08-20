/*
 * check-language-support — LC-I18N-002: stop advertising languages that only
 * fall back to English.
 *
 * LC-I18N-001 (finding A6) found the visible language picker offering 46
 * option rows across 34 base languages while only 8 base auxiliary locales
 * (`en/es/pt/fr/it/de/ja/ar`, `SUPPORTED_LOCALES` in i18n/translations.js)
 * actually had a complete implementation. Picking any of the other 26 bases
 * persisted it as `user_language` and set `document.lang` to it while every
 * visible string silently rendered English — the exact false-support claim
 * `docs/product/language-detection-contract.md` forbids for automatic
 * detection, previously reachable through manual selection instead.
 *
 * This proves `services/language.js`'s `LANGUAGE_OPTIONS.supported` flag is
 * derived from the one real source of truth (`SUPPORTED_LOCALES`), that the
 * post-login picker can therefore never silently drift ja/ar out of support
 * or claim an unimplemented base in, that a persisted-but-unsupported choice
 * self-heals instead of sticking forever, and that the drifted duplicate
 * registry LC-I18N-001 flagged (finding A7) is gone rather than merely
 * unused.
 */
import assert from 'node:assert/strict'

let n = 0
const ok = () => { n++ }

// The 26 base languages LC-I18N-001 confirmed have no implemented locale.
const UNIMPLEMENTED_BASES = [
  'zh', 'ko', 'hi', 'ru', 'tr', 'nl', 'pl', 'vi', 'id', 'th', 'uk', 'el', 'he',
  'sv', 'no', 'da', 'fi', 'ro', 'cs', 'hu', 'bn', 'ur', 'fa', 'sw', 'fil', 'ms',
]
const IMPLEMENTED_BASES = ['en', 'es', 'pt', 'fr', 'it', 'de', 'ja', 'ar']

function makeStore() {
  const data = new Map()
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
  }
}

function setNavigator(value) {
  Object.defineProperty(global, 'navigator', { value, configurable: true, writable: true })
}

async function freshLanguageModule(store, languages = ['en-US']) {
  global.localStorage = store
  setNavigator({ languages, language: languages[0] })
  // an isolated module instance per scenario, same technique
  // check-user-language.mjs / check-language-detection.mjs use
  return import(`../src/services/language.js?scenario=${Math.random()}`)
}

async function main() {
  const { LANGUAGE_OPTIONS, getLanguageOption, searchLanguages, ensureLanguagePreferences, isSupportedLanguage } =
    await freshLanguageModule(makeStore())

  // 1) the supported set is exactly the 8 bases LinguaChat actually
  //    implements — no more (overclaiming), no fewer (ja/ar cannot silently
  //    disappear through a stale/duplicate registry).
  {
    const supportedBases = [...new Set(LANGUAGE_OPTIONS.filter(o => o.supported).map(o => o.base))].sort()
    assert.deepEqual(supportedBases, [...IMPLEMENTED_BASES].sort(),
      'the supported base set must be exactly en/es/pt/fr/it/de/ja/ar')
    delete global.localStorage; delete global.navigator
    ok()
  }

  // 2) every one of the 26 bases LC-I18N-001 found unimplemented is present
  //    in the catalog (still discoverable / roadmap-visible) but explicitly
  //    marked unsupported, never silently defaulting to true.
  {
    const store = makeStore()
    const { LANGUAGE_OPTIONS: options } = await freshLanguageModule(store)
    for (const base of UNIMPLEMENTED_BASES) {
      const rows = options.filter(o => o.base === base)
      assert.ok(rows.length > 0, `${base} must still be listed for discovery`)
      for (const row of rows) {
        assert.equal(row.supported, false, `${base} (${row.code}) must not be marked supported`)
      }
    }
    delete global.localStorage; delete global.navigator
    ok()
  }

  // 3) regional variants inherit their base's support, not their own —
  //    es-CO/pt-BR/fr-CA (implemented bases) are selectable, zh-CN/zh-TW
  //    (unimplemented base) are not, so a region row can never imply
  //    region-specific copy that doesn't exist beyond its base locale.
  {
    const store = makeStore()
    const { LANGUAGE_OPTIONS: options } = await freshLanguageModule(store)
    const esCo = options.find(o => o.code === 'es-CO')
    const ptBr = options.find(o => o.code === 'pt-BR')
    const frCa = options.find(o => o.code === 'fr-CA')
    const zhCn = options.find(o => o.code === 'zh-CN')
    assert.equal(esCo.supported, true)
    assert.equal(ptBr.supported, true)
    assert.equal(frCa.supported, true)
    assert.equal(zhCn.supported, false)
    delete global.localStorage; delete global.navigator
    ok()
  }

  // 4) getLanguageOption reports supported honestly for both directions.
  {
    const store = makeStore()
    const { getLanguageOption: getOption } = await freshLanguageModule(store)
    assert.equal(getOption('ar').supported, true)
    assert.equal(getOption('ja').supported, true)
    assert.equal(getOption('hi').supported, false, 'Hindi has no implemented locale')
    assert.equal(getOption('xx-made-up').supported, false, 'an unknown code must never default to supported')
    delete global.localStorage; delete global.navigator
    ok()
  }

  // 5) searchLanguages propagates the same honest flag through to whatever
  //    renders the picker, so the UI cannot accidentally read a stale/local
  //    copy that forgets to carry `supported` along.
  {
    const store = makeStore()
    const { searchLanguages: search } = await freshLanguageModule(store)
    const hindiResults = search('hindi')
    assert.ok(hindiResults.length > 0)
    assert.ok(hindiResults.every(r => r.supported === false))
    const arabicResults = search('arabic')
    assert.ok(arabicResults.length > 0)
    assert.ok(arabicResults.some(r => r.supported === true))
    delete global.localStorage; delete global.navigator
    ok()
  }

  // 6) THE regression this task exists for: a base persisted before this fix
  //    (when the picker could still select any of the 46 rows) must not keep
  //    silently claiming a language LinguaChat cannot serve — it self-heals
  //    to a genuinely supported one on the next load, exactly like a legacy
  //    native/interface mismatch already self-heals (LC-I18N-003).
  {
    const store = makeStore()
    // simulate a pre-fix persisted choice directly, bypassing today's picker
    store.setItem('lc2-native-language-code', 'hi')
    store.setItem('lc2-native-language-base', 'hi')
    store.setItem('lc2-native-language-name', 'Hindi')
    store.setItem('lc2-interface-language-code', 'hi')
    store.setItem('lc2-interface-language-base', 'hi')
    store.setItem('lc2-interface-language-name', 'Hindi')
    store.setItem('lc2-native-language', 'hi')

    const { ensureLanguagePreferences: ensure } = await freshLanguageModule(store, ['hi-IN', 'es-ES'])
    const prefs = ensure()
    assert.notEqual(prefs.nativeLanguage.base, 'hi', 'an unsupported persisted base must not survive')
    assert.equal(prefs.nativeLanguage.base, 'es', 'it must fall through to the next genuinely supported device preference')
    assert.equal(prefs.interfaceLanguage.base, 'es')
    delete global.localStorage; delete global.navigator
    ok()
  }

  // 6b) same self-heal with no supported device preference at all falls back
  //     to English rather than keeping the stale unsupported choice.
  {
    const store = makeStore()
    store.setItem('lc2-native-language-code', 'ko')
    store.setItem('lc2-native-language-base', 'ko')
    store.setItem('lc2-native-language-name', 'Korean')
    store.setItem('lc2-interface-language-code', 'ko')
    store.setItem('lc2-interface-language-base', 'ko')
    store.setItem('lc2-interface-language-name', 'Korean')
    store.setItem('lc2-native-language', 'ko')

    const { ensureLanguagePreferences: ensure } = await freshLanguageModule(store, ['ko-KR'])
    const prefs = ensure()
    assert.equal(prefs.nativeLanguage.base, 'en')
    delete global.localStorage; delete global.navigator
    ok()
  }

  // 7) a genuinely supported persisted choice is untouched — self-healing
  //    must never punish a real, honest choice.
  {
    const store = makeStore()
    const first = await freshLanguageModule(store)
    first.setNativeLanguage('ja')
    delete global.localStorage; delete global.navigator

    const reloaded = await freshLanguageModule(store, ['fr-FR'])
    const prefs = reloaded.ensureLanguagePreferences()
    assert.equal(prefs.nativeLanguage.base, 'ja', 'a supported explicit choice must still survive reload untouched')
    delete global.localStorage; delete global.navigator
    ok()
  }

  // 8) isSupportedLanguage is exported as the one reusable predicate, so
  //    call sites (the picker, ensureLanguagePreferences) cannot each grow
  //    their own copy of the support rule and drift apart.
  {
    assert.equal(isSupportedLanguage('ar'), true)
    assert.equal(isSupportedLanguage('fa'), false)
    assert.equal(isSupportedLanguage(''), false)
    ok()
  }

  // 9) the drifted duplicate registry LC-I18N-001 flagged (finding A7) —
  //    i18n/translations.js used to export its own six-row LANGUAGE_OPTIONS
  //    (missing ja/ar entirely) plus dead detectNativeLanguage/getLanguageName
  //    helpers nothing imported. It is now gone rather than merely unused, so
  //    it can never be picked up by a future accidental import and silently
  //    reintroduce a second, wrong source of truth.
  {
    const translations = await import('../src/i18n/translations.js')
    assert.equal(translations.LANGUAGE_OPTIONS, undefined,
      'the drifted six-row LANGUAGE_OPTIONS registry must not exist in translations.js')
    assert.equal(translations.detectNativeLanguage, undefined)
    assert.equal(translations.getLanguageName, undefined)
    assert.ok(Array.isArray(translations.SUPPORTED_LOCALES) && translations.SUPPORTED_LOCALES.length === 8,
      'SUPPORTED_LOCALES stays the one real source of truth')
    ok()
  }

  console.log(`check-language-support — OK  (${n} language-support-honesty groups verified)`)
}

main().catch((e) => { console.error('check-language-support — FAIL\n', e.message); process.exit(1) })
