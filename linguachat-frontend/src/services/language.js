const NATIVE_CODE_KEY = 'lc2-native-language-code'
const NATIVE_BASE_KEY = 'lc2-native-language-base'
const NATIVE_NAME_KEY = 'lc2-native-language-name'
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

function makeLanguageInfo(code) {
  const normalized = normalizeLanguageCode(code)
  const base = normalized.split('-', 1)[0].toLowerCase()
  return {
    code: normalized,
    base: base || FALLBACK_LANGUAGE.base,
    name: getLanguageDisplayName(normalized),
  }
}

export function detectNativeLanguage() {
  try {
    const candidates = navigator.languages?.length
      ? navigator.languages
      : [navigator.language]
    const detected = candidates.find(Boolean)
    return makeLanguageInfo(detected || FALLBACK_LANGUAGE.code)
  } catch {
    return FALLBACK_LANGUAGE
  }
}

export function getStoredNativeLanguage() {
  try {
    const code = localStorage.getItem(NATIVE_CODE_KEY)
      || localStorage.getItem(LEGACY_NATIVE_KEY)
    if (code) return makeLanguageInfo(code)
  } catch {}
  const detected = detectNativeLanguage()
  setNativeLanguage(detected)
  return detected
}

export function setNativeLanguage(language) {
  const info = typeof language === 'object' && language
    ? makeLanguageInfo(language.code || language.base)
    : makeLanguageInfo(language)
  try {
    localStorage.setItem(NATIVE_CODE_KEY, info.code)
    localStorage.setItem(NATIVE_BASE_KEY, info.base)
    localStorage.setItem(NATIVE_NAME_KEY, info.name)
    localStorage.setItem(LEGACY_NATIVE_KEY, info.base)
  } catch {}
  return info
}

export function getTargetLanguage() {
  try { localStorage.setItem(TARGET_KEY, TARGET_LANGUAGE.code) } catch {}
  return TARGET_LANGUAGE
}

export function languageFromInput(value) {
  return makeLanguageInfo(value || FALLBACK_LANGUAGE.code)
}
