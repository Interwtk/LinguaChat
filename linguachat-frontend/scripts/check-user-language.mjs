/*
 * check-user-language — LC-I18N-003: the one canonical `user_language`.
 *
 * The learner chooses ONE auxiliary language. Legacy `native`/`interface`
 * storage keys and context fields may still exist for compatibility, but a
 * supported product API must never be able to leave them pointing at two
 * different languages, and any mismatch left behind by older storage must be
 * reconciled deterministically on load — never preserved.
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
    raw: data,
  }
}

async function freshLanguageModule(store) {
  global.localStorage = store
  // each learner in this file gets an isolated module instance so one
  // scenario's storage never leaks into the next
  const mod = await import(`../src/services/language.js?scenario=${Math.random()}`)
  return mod
}

async function main() {
  // 1) a first-ever load has no stored choice: native and interface resolve to
  //    the same detected language, and nothing about a second picker exists.
  {
    const store = makeStore()
    const { ensureLanguagePreferences, getStoredNativeLanguage, getStoredInterfaceLanguage } =
      await freshLanguageModule(store)
    const prefs = ensureLanguagePreferences()
    assert.equal(prefs.nativeLanguage.base, prefs.interfaceLanguage.base, 'first load must agree with itself')
    assert.equal(getStoredNativeLanguage().base, getStoredInterfaceLanguage().base)
    delete global.localStorage
    ok()
  }

  // 2) there is no supported API that writes only one of native/interface.
  {
    const store = makeStore()
    const languageModule = await freshLanguageModule(store)
    assert.equal(typeof languageModule.setInterfaceLanguage, 'undefined',
      'an independent interface-only setter must not be exported')
    assert.equal(typeof languageModule.setNativeLanguage, 'function')
    delete global.localStorage
    ok()
  }

  // 3) setNativeLanguage('ja') converges storage: both legacy reads return ja.
  {
    const store = makeStore()
    const { setNativeLanguage, getStoredNativeLanguage, getStoredInterfaceLanguage } =
      await freshLanguageModule(store)
    setNativeLanguage('ja')
    assert.equal(getStoredNativeLanguage().base, 'ja')
    assert.equal(getStoredInterfaceLanguage().base, 'ja')
    delete global.localStorage
    ok()
  }

  // 4) reload proof for es/ja/ar: set once, "reload" (fresh ensureLanguagePreferences
  //    call against the same store) and confirm the choice survived untouched and
  //    native/interface still agree — UI, explanations, corrections and meanings
  //    all key off the same resolved value.
  for (const code of ['es', 'ja', 'ar']) {
    const store = makeStore()
    const first = await freshLanguageModule(store)
    first.setNativeLanguage(code)

    const reloaded = await freshLanguageModule(store)
    const prefs = reloaded.ensureLanguagePreferences()
    assert.equal(prefs.nativeLanguage.base, code, `${code} must survive reload`)
    assert.equal(prefs.interfaceLanguage.base, code, `${code} interface must match native after reload`)
    assert.equal(prefs.targetLanguage.base, 'en', 'target stays English regardless of user_language')
    delete global.localStorage
    ok()
  }

  // 5) THE regression this task exists for: storage left over from before this
  //    fix (or edited by hand) with native and interface pointing at two
  //    different languages. A reload must deterministically collapse them onto
  //    one value instead of preserving the mismatch.
  {
    const store = makeStore()
    // simulate legacy divergent storage directly, bypassing the one writer
    store.setItem('lc2-native-language-code', 'ja')
    store.setItem('lc2-native-language-base', 'ja')
    store.setItem('lc2-native-language-name', 'Japanese')
    store.setItem('lc2-interface-language-code', 'es')
    store.setItem('lc2-interface-language-base', 'es')
    store.setItem('lc2-interface-language-name', 'Spanish')
    store.setItem('lc2-native-language', 'ja')

    const { ensureLanguagePreferences, getStoredNativeLanguage, getStoredInterfaceLanguage } =
      await freshLanguageModule(store)
    const prefs = ensureLanguagePreferences()
    assert.equal(prefs.nativeLanguage.base, prefs.interfaceLanguage.base,
      'a legacy mismatch must be reconciled to one value, not preserved')
    assert.equal(prefs.nativeLanguage.base, 'ja', 'native is the value the learner actually set; it wins reconciliation')
    assert.equal(getStoredNativeLanguage().base, 'ja')
    assert.equal(getStoredInterfaceLanguage().base, 'ja')
    // and the interface storage keys themselves were rewritten, not just the
    // in-memory return value
    assert.equal(store.getItem('lc2-interface-language-base'), 'ja', 'stored interface key must be rewritten, not merely shadowed')
    delete global.localStorage
    ok()
  }

  // 6) target language is always English and is never influenced by user_language.
  {
    const store = makeStore()
    const { setNativeLanguage, getStoredTargetLanguage } = await freshLanguageModule(store)
    setNativeLanguage('ar')
    assert.equal(getStoredTargetLanguage().base, 'en')
    delete global.localStorage
    ok()
  }

  // 7) getLocalizedMeaning resolves against the one user_language, then English —
  //    no second "interface" argument, no silent Spanish-first fallback.
  {
    const { getLocalizedMeaning } = await import('../src/services/localizedMeaning.js')
    const meaning = { en: 'hello', ja: 'こんにちは' }
    assert.equal(getLocalizedMeaning(meaning, { base: 'ja', code: 'ja' }), 'こんにちは')
    assert.equal(getLocalizedMeaning(meaning, { base: 'ar', code: 'ar' }), 'hello', 'missing language falls back to English, not to any other language')
    assert.equal(getLocalizedMeaning(meaning, { base: 'ja-JP', code: 'ja-JP' }), 'こんにちは', 'full code resolves through the base')
    ok()
  }

  console.log(`check-user-language — OK  (${n} user_language groups verified)`)
}

main().catch((e) => { console.error('check-user-language — FAIL\n', e.message); process.exit(1) })
