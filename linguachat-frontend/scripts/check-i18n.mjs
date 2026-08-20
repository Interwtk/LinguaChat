#!/usr/bin/env node
/*
 * check-i18n — verifies interface-translation coverage and consistency.
 *
 * Parses src/i18n/translations.js directly (no build, no deps). For every locale
 * dictionary it checks, against the English base:
 *   - missing keys   (base keys the locale does not translate)
 *   - extra keys     (suspicious keys in a locale that are not in base)
 *   - placeholders   ({token} interpolation must match the base value)
 *
 * Every locale in FULLY_SUPPORTED is a hard gate: any missing key, extra key or
 * placeholder mismatch fails the run with exit code 1. English is the reference.
 * (Untranslated keys still render — they fall back to English — but a "complete"
 * interface locale must not rely on that fallback for visible text.)
 *
 * Plural-aware keys: a base key ending `_other` (e.g. `sessionDoneCount_other`)
 * marks `sessionDoneCount` as a plural stem — `translate()` resolves it through
 * Intl.PluralRules at runtime rather than one fixed template (see
 * src/i18n/translations.js). Each locale's required categories are its own
 * grammar, not English's: Arabic genuinely needs zero/one/two/few/many/other,
 * Japanese only ever needs `other`, most others need one/other. Required
 * categories are derived by sampling Intl.PluralRules(locale).select() over a
 * representative range rather than resolvedOptions().pluralCategories, which
 * would also list categories (e.g. Spanish/French/Italian/Portuguese "many")
 * that never actually get selected for the small integer counts this product
 * shows and would force pointless copy nobody's UI can reach.
 *
 *   node scripts/check-i18n.mjs
 *
 * Structural/reachability defects (hardcoded auxiliary strings, raw-key/silent
 * fallback, dead files) are a different kind of check — see check-i18n-lint.mjs,
 * wired in right after this one.
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { LOCALE_ORDER, extractBase, extractLocale, placeholders } from './lib/i18nSource.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const TRANSLATIONS = resolve(here, '../src/i18n/translations.js')

// Every declared interface locale is fully supported and gated.
const FULLY_SUPPORTED = [...LOCALE_ORDER]

const PLURAL_CATEGORIES = ['zero', 'one', 'two', 'few', 'many', 'other']
const SAMPLE_COUNTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 20, 50, 99, 100, 101, 200, 999]

function pluralStemOf(key) {
  for (const cat of PLURAL_CATEGORIES) {
    if (key.endsWith(`_${cat}`)) return { stem: key.slice(0, -(cat.length + 1)), category: cat }
  }
  return null
}

function requiredCategoriesFor(locale) {
  let rules
  try { rules = new Intl.PluralRules(locale) } catch { rules = new Intl.PluralRules('en') }
  return [...new Set(SAMPLE_COUNTS.map(n => rules.select(n)))]
}

const source = await readFile(TRANSLATIONS, 'utf8')
const { dict: base, duplicates: baseDuplicates } = extractBase(source)
const dicts = { base }
const localeDuplicates = { base: baseDuplicates }
for (const loc of LOCALE_ORDER) {
  const { dict, duplicates } = extractLocale(await readFile(resolve(here, `../src/i18n/locales/${loc}.js`), 'utf8'))
  dicts[loc] = dict
  localeDuplicates[loc] = duplicates
}
const baseKeys = Object.keys(base)

if (!baseKeys.length) {
  console.error('check-i18n: could not read base dictionary keys. Aborting.')
  process.exit(2)
}

// A duplicate `key:` inside one object literal silently keeps only the last
// value — the earlier one, and whatever it was meant to say, is unreachable
// dead copy. Coverage/placeholder counts above see only the surviving key, so
// this can never surface as "missing" or "mismatched"; it needs its own gate.
let duplicateGateFailed = false
for (const [loc, dupes] of Object.entries(localeDuplicates)) {
  if (!dupes.length) continue
  duplicateGateFailed = true
  console.log(`\n[${loc}] duplicate keys (only the last occurrence survives):\n  ` + dupes.join('\n  '))
}

// Every base key ending `_other` names a plural stem; that stem's `_<category>`
// keys are validated separately, per locale, against that locale's own grammar.
const pluralStems = new Set()
for (const key of baseKeys) {
  const parsed = pluralStemOf(key)
  if (parsed && parsed.category === 'other') pluralStems.add(parsed.stem)
}
const isPluralVariantKey = (key) => {
  const parsed = pluralStemOf(key)
  return Boolean(parsed && pluralStems.has(parsed.stem))
}
const scalarBaseKeys = baseKeys.filter(k => !isPluralVariantKey(k))

console.log(`\ni18n coverage — ${baseKeys.length} visible keys in base (English), ${pluralStems.size} plural-aware\n`)
console.log('locale   translated   missing   extra   phMismatch   coverage')
console.log('------   ----------   -------   -----   ----------   --------')

let gateFailed = false
const detail = {}

for (const loc of LOCALE_ORDER) {
  const dict = dicts[loc] || {}
  const keys = Object.keys(dict)
  const missing = scalarBaseKeys.filter(k => !(k in dict))
  const extra = keys.filter(k => !isPluralVariantKey(k) && !(k in base))
  const phMismatch = scalarBaseKeys.filter(k => (k in dict) &&
    placeholders(base[k]).join(',') !== placeholders(dict[k]).join(','))

  const requiredCats = requiredCategoriesFor(loc)
  for (const stem of pluralStems) {
    const baseRef = base[`${stem}_other`]
    for (const cat of requiredCats) {
      const k = `${stem}_${cat}`
      if (!(k in dict)) missing.push(k)
      else if (placeholders(baseRef).join(',') !== placeholders(dict[k]).join(',')) phMismatch.push(k)
    }
    for (const cat of PLURAL_CATEGORIES) {
      if (requiredCats.includes(cat)) continue
      const k = `${stem}_${cat}`
      if (k in dict) extra.push(k)
    }
  }

  const totalBase = scalarBaseKeys.length + [...pluralStems].reduce((sum) => sum + requiredCats.length, 0)
  const translated = totalBase - missing.length
  const pct = Math.round((translated / totalBase) * 100)
  detail[loc] = { missing, extra, phMismatch }
  const gate = FULLY_SUPPORTED.includes(loc)
  const bad = gate && (missing.length || extra.length || phMismatch.length)
  console.log(
    `${loc.padEnd(6)}   ${String(translated).padStart(10)}   ${String(missing.length).padStart(7)}   ` +
    `${String(extra.length).padStart(5)}   ${String(phMismatch.length).padStart(10)}   ${String(pct).padStart(6)}%` +
    (bad ? '  <- FAIL' : ''),
  )
  if (bad) gateFailed = true
}

for (const loc of LOCALE_ORDER) {
  const { missing, extra, phMismatch } = detail[loc]
  if (missing.length) console.log(`\n[${loc}] missing keys:\n  ` + missing.join('\n  '))
  if (extra.length) console.log(`\n[${loc}] extra/suspicious keys:\n  ` + extra.join('\n  '))
  if (phMismatch.length) console.log(`\n[${loc}] placeholder mismatch:\n  ` + phMismatch.join('\n  '))
}

console.log('\nUntranslated keys fall back to English, but gated locales must be complete.\n')
process.exit((gateFailed || duplicateGateFailed) ? 1 : 0)
