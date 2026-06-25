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
  { code: 'en', base: 'en', englishName: 'English', nativeName: 'English', aliases: ['ingles', 'inglés', 'english'] },
  { code: 'en-US', base: 'en', englishName: 'English (United States)', nativeName: 'English (US)', aliases: ['american english', 'usa', 'us english', 'united states'] },
  { code: 'en-GB', base: 'en', englishName: 'English (United Kingdom)', nativeName: 'English (UK)', aliases: ['british english', 'uk english', 'united kingdom'] },
  { code: 'es', base: 'es', englishName: 'Spanish', nativeName: 'Español', aliases: ['espanol', 'español', 'castellano'] },
  { code: 'es-CO', base: 'es', englishName: 'Spanish (Colombia)', nativeName: 'Español (Colombia)', aliases: ['colombian spanish', 'colombia', 'espanol colombiano'] },
  { code: 'es-MX', base: 'es', englishName: 'Spanish (Mexico)', nativeName: 'Español (México)', aliases: ['mexican spanish', 'mexico', 'méxico', 'espanol mexicano'] },
  { code: 'es-ES', base: 'es', englishName: 'Spanish (Spain)', nativeName: 'Español (España)', aliases: ['spanish spain', 'spain', 'españa', 'castellano'] },
  { code: 'es-CL', base: 'es', englishName: 'Spanish (Chile)', nativeName: 'Español (Chile)', aliases: ['chilean spanish', 'chile', 'espanol chileno'] },
  { code: 'es-AR', base: 'es', englishName: 'Spanish (Argentina)', nativeName: 'Español (Argentina)', aliases: ['argentinian spanish', 'argentine spanish', 'argentina'] },
  { code: 'pt', base: 'pt', englishName: 'Portuguese', nativeName: 'Português', aliases: ['portugues', 'português'] },
  { code: 'pt-BR', base: 'pt', englishName: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', aliases: ['brazilian portuguese', 'brasil', 'brazil', 'portugues brasil'] },
  { code: 'pt-PT', base: 'pt', englishName: 'Portuguese (Portugal)', nativeName: 'Português (Portugal)', aliases: ['european portuguese', 'portugal', 'portugues portugal'] },
  { code: 'fr', base: 'fr', englishName: 'French', nativeName: 'Français', aliases: ['frances', 'français', 'francais'] },
  { code: 'fr-CA', base: 'fr', englishName: 'French (Canada)', nativeName: 'Français (Canada)', aliases: ['canadian french', 'quebec', 'québec', 'francais canada'] },
  { code: 'it', base: 'it', englishName: 'Italian', nativeName: 'Italiano', aliases: ['italiano', 'italian'] },
  { code: 'de', base: 'de', englishName: 'German', nativeName: 'Deutsch', aliases: ['aleman', 'alemán', 'german'] },
  { code: 'ja', base: 'ja', englishName: 'Japanese', nativeName: '日本語', aliases: ['japanese', 'nihongo', 'japonés', 'japones'] },
  { code: 'ar', base: 'ar', englishName: 'Arabic', nativeName: 'العربية', aliases: ['arabic', 'arabe', 'árabe'] },
  { code: 'zh', base: 'zh', englishName: 'Chinese', nativeName: '中文', aliases: ['mandarin', 'chinese', 'chino'] },
  { code: 'zh-CN', base: 'zh', englishName: 'Chinese (Simplified)', nativeName: '简体中文', aliases: ['simplified chinese', 'mandarin', 'chino simplificado', 'china'] },
  { code: 'zh-TW', base: 'zh', englishName: 'Chinese (Traditional)', nativeName: '繁體中文', aliases: ['traditional chinese', 'taiwan', 'chino tradicional'] },
  { code: 'ko', base: 'ko', englishName: 'Korean', nativeName: '한국어', aliases: ['coreano', 'korean', 'hangul'] },
  { code: 'hi', base: 'hi', englishName: 'Hindi', nativeName: 'हिन्दी', aliases: ['hindi', 'हिंदी'] },
  { code: 'ru', base: 'ru', englishName: 'Russian', nativeName: 'Русский', aliases: ['ruso', 'russian'] },
  { code: 'tr', base: 'tr', englishName: 'Turkish', nativeName: 'Türkçe', aliases: ['turco', 'turkish'] },
  { code: 'nl', base: 'nl', englishName: 'Dutch', nativeName: 'Nederlands', aliases: ['dutch', 'holandes', 'holandés'] },
  { code: 'pl', base: 'pl', englishName: 'Polish', nativeName: 'Polski', aliases: ['polish', 'polaco'] },
  { code: 'vi', base: 'vi', englishName: 'Vietnamese', nativeName: 'Tiếng Việt', aliases: ['vietnamese', 'vietnamita', 'tieng viet'] },
  { code: 'id', base: 'id', englishName: 'Indonesian', nativeName: 'Bahasa Indonesia', aliases: ['indonesian', 'indonesio', 'bahasa'] },
  { code: 'th', base: 'th', englishName: 'Thai', nativeName: 'ไทย', aliases: ['thai', 'tailandes', 'tailandés'] },
  { code: 'uk', base: 'uk', englishName: 'Ukrainian', nativeName: 'Українська', aliases: ['ukrainian', 'ucraniano'] },
  { code: 'el', base: 'el', englishName: 'Greek', nativeName: 'Ελληνικά', aliases: ['greek', 'griego', 'ellinika'] },
  { code: 'he', base: 'he', englishName: 'Hebrew', nativeName: 'עברית', aliases: ['hebrew', 'hebreo', 'ivrit'] },
  { code: 'sv', base: 'sv', englishName: 'Swedish', nativeName: 'Svenska', aliases: ['swedish', 'sueco'] },
  { code: 'no', base: 'no', englishName: 'Norwegian', nativeName: 'Norsk', aliases: ['norwegian', 'noruego'] },
  { code: 'da', base: 'da', englishName: 'Danish', nativeName: 'Dansk', aliases: ['danish', 'danes', 'danés'] },
  { code: 'fi', base: 'fi', englishName: 'Finnish', nativeName: 'Suomi', aliases: ['finnish', 'fines', 'finés', 'suomi'] },
  { code: 'ro', base: 'ro', englishName: 'Romanian', nativeName: 'Română', aliases: ['romanian', 'rumano', 'romana'] },
  { code: 'cs', base: 'cs', englishName: 'Czech', nativeName: 'Čeština', aliases: ['czech', 'checo', 'cesky'] },
  { code: 'hu', base: 'hu', englishName: 'Hungarian', nativeName: 'Magyar', aliases: ['hungarian', 'hungaro', 'húngaro'] },
  { code: 'bn', base: 'bn', englishName: 'Bengali', nativeName: 'বাংলা', aliases: ['bengali', 'bangla', 'bengali language'] },
  { code: 'ur', base: 'ur', englishName: 'Urdu', nativeName: 'اردو', aliases: ['urdu'] },
  { code: 'fa', base: 'fa', englishName: 'Persian', nativeName: 'فارسی', aliases: ['persian', 'farsi', 'persa'] },
  { code: 'sw', base: 'sw', englishName: 'Swahili', nativeName: 'Kiswahili', aliases: ['swahili', 'kiswahili', 'suajili'] },
  { code: 'fil', base: 'fil', englishName: 'Filipino', nativeName: 'Filipino', aliases: ['filipino', 'tagalog', 'tagalo'] },
  { code: 'ms', base: 'ms', englishName: 'Malay', nativeName: 'Bahasa Melayu', aliases: ['malay', 'malayo', 'melayu'] },
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

function getSearchFields(option) {
  return [
    option.code,
    option.base,
    option.englishName,
    option.nativeName,
    ...(option.aliases || []),
    ...(option.searchTerms || []),
  ]
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
    return getSearchFields(item).some(field => normalizeSearchText(field) === query)
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
    return getSearchFields(item).some(field => normalizeSearchText(field).includes(normalizedQuery))
  })
}
