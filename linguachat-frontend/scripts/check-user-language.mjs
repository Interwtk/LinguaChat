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


  // 8) Interactive language edits retain the originating account lease through
  // durable storage and deferred React state. Run the real callback and writer.
  {
    const { readFileSync } = await import('node:fs')
    const context = readFileSync(new URL('../src/context/AppContext.jsx', import.meta.url), 'utf8')
    const signature = '  const updateNativeLanguage = useCallback((language) => {'
    const start = context.indexOf(signature)
    const end = context.indexOf('\n  }, [])', start)
    assert.ok(start >= 0 && end > start, 'language updater must be inspectable')
    const updateLanguage = new Function('language', 'deps',
      'with (deps) { ' + context.slice(start + signature.length, end) + ' }')

    for (const mode of ['current', 'stale-flush', 'denied', 'revoked-write',
      'rejected-write', 'mismatch-readback', 'storage-throws', 'concurrent-edit', 'unsupported']) {
      const store = makeStore()
      global.localStorage = store
      const language = await freshLanguageModule(store)
      language.setNativeLanguage('en')
      let owner = mode === 'denied' ? 'B' : 'A'
      let writes = 0
      const queued = []
      const access = {
        valid: () => owner === 'A',
        getItem: key => {
          if (mode === 'mismatch-readback' && writes && key === 'lc2-native-language-base') return 'wrong-value'
          return store.getItem(key)
        },
        setItem: (key, value) => {
          writes++
          if (mode === 'rejected-write') return false
          if (mode === 'storage-throws') throw new Error('Storage unavailable')
          store.setItem(key, value)
          if (mode === 'revoked-write') owner = 'B'
          if (mode === 'concurrent-edit') store.setItem('lc2-interface-language-code', 'fr')
          return true
        },
      }
      const original = {
        nativeLanguage: { code: 'en', base: 'en', name: 'English' },
        interfaceLanguage: { code: 'en', base: 'en', name: 'English' },
      }
      let state = structuredClone(original)
      const result = updateLanguage(mode === 'unsupported' ? 'hi' : 'es-CO', {
        captureLearnerAccess: () => access,
        persistNativeLanguage: (choice, options) => language.setNativeLanguage(choice, options),
        setLanguagePreferences: updater => queued.push(updater),
      })
      if (mode === 'stale-flush') owner = 'B'
      for (const updater of queued) {
        assert.equal(typeof updater, 'function', mode + ': language state must be lease-checked')
        state = updater(state)
      }
      if (mode === 'current') {
        assert.equal(result, true)
        assert.equal(state.nativeLanguage.code, 'es-CO')
        assert.equal(state.interfaceLanguage.code, 'es-CO')
        for (const [key, value] of language.languagePreferencePersistence('es-CO').entries) {
          assert.equal(store.getItem(key), value, 'all language mirrors must persist')
        }
      } else if (mode === 'stale-flush') {
        assert.equal(result, true, 'the originating account committed before the switch')
        assert.equal(queued.length, 1)
        assert.deepEqual(state, original, 'A cannot repaint B after deferred React flush')
      } else {
        assert.equal(result, false, mode + ': rejected edits must not report success')
        assert.equal(queued.length, 0)
        assert.deepEqual(state, original, mode + ': B must keep its own language')
        assert.equal(store.getItem('lc2-native-language-code'), 'en',
          mode + ': canonical language must not advance on an intermediate failure')
      }
      if (mode === 'denied' || mode === 'unsupported') assert.equal(writes, 0)
      delete global.localStorage
    }
    ok()
  }

  console.log(`check-user-language — OK  (${n} user_language groups verified)`)
}

main().catch((e) => { console.error('check-user-language — FAIL\n', e.message); process.exit(1) })
