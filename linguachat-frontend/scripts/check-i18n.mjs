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
 *   node scripts/check-i18n.mjs
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const TRANSLATIONS = resolve(here, '../src/i18n/translations.js')

// Every declared interface locale is fully supported and gated.
const LOCALE_ORDER = ['es', 'pt', 'fr', 'it', 'de', 'ja', 'ar']
const FULLY_SUPPORTED = [...LOCALE_ORDER]

function extractDicts(source) {
  const lines = source.split(/\r?\n/)
  const dicts = {}
  let current = null
  for (const line of lines) {
    const open = line.match(/^const (\w+) = \{$/)
    if (open) {
      current = ['base', ...LOCALE_ORDER].includes(open[1]) ? open[1] : null
      if (current) dicts[current] = {}
      continue
    }
    if (current && /^\}/.test(line)) { current = null; continue }
    if (!current) continue
    const kv = line.match(/^\s{2}([A-Za-z0-9_]+):\s*(.*?),?\s*$/)
    if (kv) dicts[current][kv[1]] = kv[2]
  }
  return dicts
}

const placeholders = (value) => {
  const found = new Set()
  for (const m of String(value || '').matchAll(/\{(\w+)\}/g)) found.add(m[1])
  return [...found].sort()
}

const source = await readFile(TRANSLATIONS, 'utf8')
const dicts = extractDicts(source)
const base = dicts.base || {}
const baseKeys = Object.keys(base)

if (!baseKeys.length) {
  console.error('check-i18n: could not read base dictionary keys. Aborting.')
  process.exit(2)
}

console.log(`\ni18n coverage — ${baseKeys.length} visible keys in base (English)\n`)
console.log('locale   translated   missing   extra   phMismatch   coverage')
console.log('------   ----------   -------   -----   ----------   --------')

let gateFailed = false
const detail = {}

for (const loc of LOCALE_ORDER) {
  const dict = dicts[loc] || {}
  const keys = Object.keys(dict)
  const missing = baseKeys.filter(k => !(k in dict))
  const extra = keys.filter(k => !(k in base))
  const phMismatch = baseKeys.filter(k => (k in dict) &&
    placeholders(base[k]).join(',') !== placeholders(dict[k]).join(','))
  const translated = baseKeys.length - missing.length
  const pct = Math.round((translated / baseKeys.length) * 100)
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
process.exit(gateFailed ? 1 : 0)
