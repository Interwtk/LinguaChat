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

export const LANGUAGE_OPTIONS = [
  { code: 'en', base: 'en', englishName: 'English', nativeName: 'English', aliases: ['ingles', 'inglés'] },
  { code: 'en-US', base: 'en', englishName: 'English (United States)', nativeName: 'English (US)', aliases: ['american english', 'usa', 'us english'] },
  { code: 'en-GB', base: 'en', englishName: 'English (United Kingdom)', nativeName: 'English (UK)', aliases: ['british english', 'uk english'] },
  { code: 'es', base: 'es', englishName: 'Spanish', nativeName: 'Español', aliases: ['espanol', 'español', 'castellano'] },
  { code: 'es-CO', base: 'es', englishName: 'Spanish (Colombia)', nativeName: 'Español (Colombia)', aliases: ['colombian spanish', 'colombia'] },
  { code: 'es-MX', base: 'es', englishName: 'Spanish (Mexico)', nativeName: 'Español (México)', aliases: ['mexican spanish', 'mexico', 'méxico'] },
  { code: 'es-CL', base: 'es', englishName: 'Spanish (Chile)', nativeName: 'Español (Chile)', aliases: ['chilean spanish', 'chile'] },
  { code: 'es-AR', base: 'es', englishName: 'Spanish (Argentina)', nativeName: 'Español (Argentina)', aliases: ['argentinian spanish', 'argentina'] },
  { code: 'pt', base: 'pt', englishName: 'Portuguese', nativeName: 'Português', aliases: ['portugues', 'português'] },
  { code: 'pt-BR', base: 'pt', englishName: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', aliases: ['brazilian portuguese', 'brasil', 'brazil'] },
  { code: 'pt-PT', base: 'pt', englishName: 'Portuguese (Portugal)', nativeName: 'Português (Portugal)', aliases: ['european portuguese', 'portugal'] },
  { code: 'fr', base: 'fr', englishName: 'French', nativeName: 'Français', aliases: ['frances', 'français'] },
  { code: 'it', base: 'it', englishName: 'Italian', nativeName: 'Italiano', aliases: ['italiano'] },
  { code: 'de', base: 'de', englishName: 'German', nativeName: 'Deutsch', aliases: ['aleman', 'alemán'] },
  { code: 'ja', base: 'ja', englishName: 'Japanese', nativeName: '日本語', aliases: ['japanese', 'nihongo', 'japonés', 'japones'] },
  { code: 'ar', base: 'ar', englishName: 'Arabic', nativeName: 'العربية', aliases: ['arabic', 'arabe', 'árabe'] },
  { code: 'ko', base: 'ko', englishName: 'Korean', nativeName: '한국어', aliases: ['coreano'] },
  { code: 'zh', base: 'zh', englishName: 'Chinese', nativeName: '中文', aliases: ['mandarin', 'chinese', 'chino'] },
  { code: 'hi', base: 'hi', englishName: 'Hindi', nativeName: 'हिन्दी', aliases: ['hindi'] },
  { code: 'ru', base: 'ru', englishName: 'Russian', nativeName: 'Русский', aliases: ['ruso', 'russian'] },
  { code: 'tr', base: 'tr', englishName: 'Turkish', nativeName: 'Türkçe', aliases: ['turco', 'turkish'] },
]

function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function optionToLanguageInfo(option) {
  return { code: option.code, base: option.base, name: option.englishName }
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
    const option = LANGUAGE_OPTIONS.find(item => item.code.toLowerCase() === code.toLowerCase())
    return { code, base, name: language.name || option?.englishName || getLanguageDisplayName(code) }
  }
  const code = normalizeLanguageCode(language || FALLBACK_LANGUAGE.code)
  const base = code.split('-', 1)[0].toLowerCase()
  const option = LANGUAGE_OPTIONS.find(item => item.code.toLowerCase() === code.toLowerCase())
  return { code, base: base || FALLBACK_LANGUAGE.base, name: option?.englishName || getLanguageDisplayName(code) }
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
  const query = normalizeSearchText(value)
  const option = LANGUAGE_OPTIONS.find(item => {
    const fields = [item.code, item.base, item.englishName, item.nativeName, ...(item.aliases || [])]
    return fields.some(field => normalizeSearchText(field) === query)
  })
  return option ? optionToLanguageInfo(option) : makeLanguageInfo(value || FALLBACK_LANGUAGE.code)
}

export function getLanguageOption(language) {
  const info = makeLanguageInfo(language || FALLBACK_LANGUAGE.code)
  const exact = LANGUAGE_OPTIONS.find(item => item.code.toLowerCase() === info.code.toLowerCase())
  if (exact) return exact

  const baseOption = LANGUAGE_OPTIONS.find(item => item.code.toLowerCase() === info.base.toLowerCase())
  if (baseOption && info.code.toLowerCase() === info.base.toLowerCase()) return baseOption

  let nativeName = info.name
  try {
    nativeName = new Intl.DisplayNames([info.base], { type: 'language' }).of(info.code) || info.name
  } catch {}

  return {
    code: info.code,
    base: info.base,
    englishName: info.name || getLanguageDisplayName(info.code),
    nativeName,
    aliases: [],
    custom: true,
  }
}

export function searchLanguages(query, currentLanguage = null) {
  const normalizedQuery = normalizeSearchText(query)
  const current = currentLanguage ? getLanguageOption(currentLanguage) : null
  const options = current?.custom
    ? [current, ...LANGUAGE_OPTIONS]
    : LANGUAGE_OPTIONS

  if (!normalizedQuery) return options

  return options.filter(item => {
    const fields = [item.code, item.base, item.englishName, item.nativeName, ...(item.aliases || [])]
    return fields.some(field => normalizeSearchText(field).includes(normalizedQuery))
  })
}
