#!/usr/bin/env node
/*
 * check-i18n — reports interface-translation coverage per locale.
 *
 * It parses src/i18n/translations.js directly (no build, no deps) and, for every
 * locale dictionary, lists the base (English) keys that are NOT explicitly
 * translated. Those keys still render — they fall back to English via
 * `{ ...base, ...locale }` — but they are the honest measure of how "complete"
 * a language really is.
 *
 * Locales in FULLY_SUPPORTED are treated as a hard gate: if any of them is
 * missing a visible key, the script exits 1 (use it in CI / pre-commit).
 * Every other locale is report-only.
 *
 *   node scripts/check-i18n.mjs
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const TRANSLATIONS = resolve(here, '../src/i18n/translations.js')

// Locales we promise are fully localized. English (base) is the reference.
const FULLY_SUPPORTED = ['es']
const LOCALE_ORDER = ['es', 'pt', 'fr', 'it', 'de', 'ja', 'ar']

function extractLocaleKeys(source) {
  const lines = source.split(/\r?\n/)
  const dicts = {}
  let current = null
  for (const line of lines) {
    const open = line.match(/^const (\w+) = \{$/)
    if (open) {
      // Only treat known dictionary names as locale blocks.
      if (['base', ...LOCALE_ORDER].includes(open[1])) {
        current = open[1]
        dicts[current] = new Set()
      } else {
        current = null
      }
      continue
    }
    if (current && /^\}/.test(line)) { current = null; continue }
    if (!current) continue
    const key = line.match(/^\s{2}([A-Za-z0-9_]+):/)
    if (key) dicts[current].add(key[1])
  }
  return dicts
}

const source = await readFile(TRANSLATIONS, 'utf8')
const dicts = extractLocaleKeys(source)
const baseKeys = [...(dicts.base || [])]

if (!baseKeys.length) {
  console.error('check-i18n: could not read base dictionary keys. Aborting.')
  process.exit(2)
}

console.log(`\ni18n coverage — ${baseKeys.length} visible keys in base (English)\n`)
console.log('locale   translated   missing   coverage')
console.log('------   ----------   -------   --------')

let gateFailed = false
const report = {}

for (const loc of LOCALE_ORDER) {
  const keys = dicts[loc] || new Set()
  const missing = baseKeys.filter(k => !keys.has(k))
  const translated = baseKeys.length - missing.length
  const pct = Math.round((translated / baseKeys.length) * 100)
  report[loc] = missing
  const gate = FULLY_SUPPORTED.includes(loc)
  const flag = gate && missing.length ? '  <- INCOMPLETE (gated)' : ''
  console.log(
    `${loc.padEnd(6)}   ${String(translated).padStart(10)}   ${String(missing.length).padStart(7)}   ${String(pct).padStart(6)}%${flag}`,
  )
  if (gate && missing.length) gateFailed = true
}

// Detail for gated locales that failed, so the gap is actionable.
for (const loc of FULLY_SUPPORTED) {
  const missing = report[loc]
  if (missing && missing.length) {
    console.log(`\nMissing keys in "${loc}" (must be translated):`)
    console.log('  ' + missing.join('\n  '))
  }
}

console.log(
  '\nNote: untranslated keys fall back to English automatically. Report-only for non-gated locales.\n',
)

process.exit(gateFailed ? 1 : 0)
