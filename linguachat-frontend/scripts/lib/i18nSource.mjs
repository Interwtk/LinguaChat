/*
 * Shared parsing for src/i18n/translations.js and src/i18n/locales/*.js.
 *
 * Both check-i18n.mjs (coverage/plural/placeholder gate) and check-i18n-lint.mjs
 * (structural/reachability gate) need the same "key: value" extraction over the
 * same two dictionary shapes (`const base = { … }` and `export default { … }`),
 * so it lives once here rather than drifting into two slightly different copies.
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
export const FRONTEND_ROOT = resolve(here, '../..')
export const TRANSLATIONS_PATH = resolve(FRONTEND_ROOT, 'src/i18n/translations.js')
export const LOCALES_DIR = resolve(FRONTEND_ROOT, 'src/i18n/locales')

// Every declared interface locale is fully supported and gated.
export const LOCALE_ORDER = ['es', 'pt', 'fr', 'it', 'de', 'ja', 'ar']

const KEY_LINE = /^\s{2}([A-Za-z0-9_]+):\s*(.*?),?\s*$/

/*
 * Collects `  key: value,` pairs from a dictionary body, plus any key that
 * appears more than once in that same block — a plain object literal silently
 * keeps only the last occurrence, so a duplicate is a real authoring bug (dead
 * translation shadowed by a later one) that plain key-presence checks can never
 * see: both keys "exist", coverage looks 100%, and one of them never renders.
 */
export function readPairs(lines, from = 0, until = () => false) {
  const dict = {}
  const seen = new Map()
  const duplicates = []
  for (let i = from; i < lines.length; i++) {
    if (until(lines[i])) break
    const kv = lines[i].match(KEY_LINE)
    if (!kv) continue
    const [, key, value] = kv
    dict[key] = value
    const count = (seen.get(key) || 0) + 1
    seen.set(key, count)
    if (count === 2) duplicates.push(key)
  }
  return { dict, duplicates }
}

// English lives in translations.js as `const base = { … }`; it is both a locale
// and the fallback, so it always ships in the entry chunk.
export function extractBase(source) {
  const lines = source.split(/\r?\n/)
  const start = lines.findIndex(l => /^const base = \{$/.test(l))
  if (start === -1) return { dict: {}, duplicates: [] }
  return readPairs(lines, start + 1, (l) => /^\}/.test(l))
}

// Every other locale is its own lazily-imported module: `export default { … }`.
export function extractLocale(source) {
  const lines = source.split(/\r?\n/)
  const start = lines.findIndex(l => /^export default \{$/.test(l))
  if (start === -1) return { dict: {}, duplicates: [] }
  return readPairs(lines, start + 1, (l) => /^\}/.test(l))
}

export const placeholders = (value) => {
  const found = new Set()
  for (const m of String(value || '').matchAll(/\{(\w+)\}/g)) found.add(m[1])
  return [...found].sort()
}

/*
 * Reads the base dictionary and every gated locale dictionary in one shot.
 * Returns plain `dict` maps for callers that only care about key sets/values,
 * plus `duplicates` per source so a caller that wants that gate can use it.
 */
export async function loadAllDictionaries() {
  const baseSource = await readFile(TRANSLATIONS_PATH, 'utf8')
  const base = extractBase(baseSource)
  const locales = {}
  for (const loc of LOCALE_ORDER) {
    const source = await readFile(resolve(LOCALES_DIR, `${loc}.js`), 'utf8')
    locales[loc] = extractLocale(source)
  }
  return { base, locales }
}
