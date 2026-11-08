#!/usr/bin/env node
// Developer tool (not part of check:all): add/remove interface strings in all 8 locales at once.
// Usage: node i18n-apply.mjs <i18nDir> <spec.json>
// spec: { "comment": "...", "remove": ["key", ...], "add": { "key": { "en": "...", "es": "...", ... } } }
// Adds keys before the closing brace of the base dict (translations.js) and each locale; removes whole lines `  key: ...,`.
import fs from 'node:fs'
const [dir, specPath] = process.argv.slice(2)
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'))
const LANGS = ['es', 'pt', 'fr', 'de', 'it', 'ja', 'ar']
const add = spec.add || {}
for (const [k, v] of Object.entries(add)) for (const l of ['en', ...LANGS]) if (typeof v[l] !== 'string' || !v[l]) throw new Error(`${k} missing ${l}`)
const block = (lang) => `  // ${spec.comment || 'added'}\n` + Object.entries(add).map(([k, v]) => `  ${k}: ${JSON.stringify(v[lang])},`).join('\n') + '\n'
function removeKeys(s, file) {
  for (const key of spec.remove || []) {
    const re = new RegExp(`^  ${key}: .*\\n`, 'm')
    if (!re.test(s)) throw new Error(`remove: ${key} not found as a one-line entry in ${file}`)
    s = s.replace(re, '')
  }
  return s
}
function guardNew(s, file) { for (const k of Object.keys(add)) if (new RegExp(`^  ${k}: `, 'm').test(s)) throw new Error(`${k} already in ${file}`) }
{
  const file = `${dir}/translations.js`
  let s = removeKeys(fs.readFileSync(file, 'utf8'), file); guardNew(s, file)
  if (Object.keys(add).length) { const i = s.indexOf('\n}\n'); s = s.slice(0, i + 1) + block('en') + s.slice(i + 1) }
  fs.writeFileSync(file, s)
}
for (const lang of LANGS) {
  const file = `${dir}/locales/${lang}.js`
  let s = removeKeys(fs.readFileSync(file, 'utf8'), file); guardNew(s, file)
  if (Object.keys(add).length) { const i = s.lastIndexOf('\n}'); s = s.slice(0, i + 1) + block(lang) + s.slice(i + 1) }
  fs.writeFileSync(file, s)
}
console.log(`i18n-apply: +${Object.keys(add).length} -${(spec.remove || []).length}`)
