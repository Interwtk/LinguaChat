const NATIVE_CODE_KEY = 'lc2-native-language-code'
const NATIVE_BASE_KEY = 'lc2-native-language-base'
const NATIVE_NAME_KEY = 'lc2-native-language-name'
const INTERFACE_CODE_KEY = 'lc2-interface-language-code'
const INTERFACE_BASE_KEY = 'lc2-interface-language-base'
const INTERFACE_NAME_KEY = 'lc2-interface-language-name'
const LEGACY_NATIVE_KEY = 'lc2-native-language'
const TARGET_KEY = 'lc2-target-language'

const FALLBACK_LANGUAGE = { code: 'en', base: 'en', name: 'English' }
const TARGET_LANGUAGE = { code: 'en', base: 'en', name: 'English' }

const FALLBACK_NAMES = {
  ar: 'Arabic',
  de: 'German',
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  hi: 'Hindi',
  it: 'Italian',
  ja: 'Japanese',
  ko: 'Korean',
  pt: 'Portuguese',
  ru: 'Russian',
  tr: 'Turkish',
  zh: 'Chinese',
}

export function normalizeLanguageCode(code) {
  const raw = String(code || '').trim().replace('_', '-')
  if (!raw) return FALLBACK_LANGUAGE.code
  try {
    return Intl.getCanonicalLocales(raw)[0] || raw
  } catch {
    return raw
  }
}

export function getLanguageDisplayName(code) {
  const normalized = normalizeLanguageCode(code)
  const base = normalized.split('-', 1)[0].toLowerCase()
  try {
    const display = new Intl.DisplayNames(['en'], { type: 'language' }).of(normalized)
    if (display) return display
  } catch {}
  return FALLBACK_NAMES[base] || normalized
}

function makeLanguageInfo(language) {
  if (typeof language === 'object' && language) {
    const code = normalizeLanguageCode(language.code || language.base || FALLBACK_LANGUAGE.code)
    const base = String(language.base || code.split('-', 1)[0] || FALLBACK_LANGUAGE.base).toLowerCase()
    return { code, base, name: language.name || getLanguageDisplayName(code) }
  }
  const code = normalizeLanguageCode(language || FALLBACK_LANGUAGE.code)
  const base = code.split('-', 1)[0].toLowerCase()
  return { code, base: base || FALLBACK_LANGUAGE.base, name: getLanguageDisplayName(code) }
}

function readLanguage(codeKey, legacyKey = null) {
  try {
    const code = localStorage.getItem(codeKey) || (legacyKey ? localStorage.getItem(legacyKey) : null)
    if (code) return makeLanguageInfo(code)
  } catch {}
  return null
}

function writeLanguage(prefix, info) {
  const keys = prefix === 'native'
    ? [NATIVE_CODE_KEY, NATIVE_BASE_KEY, NATIVE_NAME_KEY]
    : [INTERFACE_CODE_KEY, INTERFACE_BASE_KEY, INTERFACE_NAME_KEY]
  try {
    localStorage.setItem(keys[0], info.code)
    localStorage.setItem(keys[1], info.base)
    localStorage.setItem(keys[2], info.name)
    if (prefix === 'native') localStorage.setItem(LEGACY_NATIVE_KEY, info.base)
  } catch {}
}

export function detectNativeLanguage() {
  try {
    const candidates = navigator.languages?.length ? navigator.languages : [navigator.language]
    return makeLanguageInfo(candidates.find(Boolean) || FALLBACK_LANGUAGE.code)
  } catch {
    return FALLBACK_LANGUAGE
  }
}

export function getStoredNativeLanguage() {
  return readLanguage(NATIVE_CODE_KEY, LEGACY_NATIVE_KEY) || FALLBACK_LANGUAGE
}

export function setNativeLanguage(language) {
  const info = makeLanguageInfo(language)
  writeLanguage('native', info)
  return info
}

export function getStoredInterfaceLanguage() {
  return readLanguage(INTERFACE_CODE_KEY) || getStoredNativeLanguage()
}

export function setInterfaceLanguage(language) {
  const info = makeLanguageInfo(language)
  writeLanguage('interface', info)
  return info
}

export function getStoredTargetLanguage() {
  try { localStorage.setItem(TARGET_KEY, TARGET_LANGUAGE.code) } catch {}
  return TARGET_LANGUAGE
}

export function ensureLanguagePreferences() {
  const existingNative = readLanguage(NATIVE_CODE_KEY, LEGACY_NATIVE_KEY)
  const native = existingNative || detectNativeLanguage()
  const existingInterface = readLanguage(INTERFACE_CODE_KEY)
  const interfaceLanguage = existingInterface || native
  const target = getStoredTargetLanguage()

  if (!existingNative) setNativeLanguage(native)
  if (!existingInterface) setInterfaceLanguage(interfaceLanguage)
  return { nativeLanguage: native, interfaceLanguage, targetLanguage: target }
}

export function languageFromInput(value) {
  return makeLanguageInfo(value || FALLBACK_LANGUAGE.code)
}
