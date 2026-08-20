#!/usr/bin/env node
/*
 * check-i18n-lint — structural i18n defects check-i18n.mjs cannot see.
 *
 * check-i18n.mjs proves the two locale dictionaries (base + each translated file)
 * agree with each other: same keys, same placeholders, same plural grammar. It
 * never looks at the ~40k lines of code that actually CALL those dictionaries, so
 * it cannot see the defect classes LC-I18N-001 found by hand:
 *
 *   - a component calling t('typoedKey') — every locale "has" the key it doesn't
 *     use, coverage stays 100%, and every learner in every language sees the raw
 *     key string at runtime (translate() falls back to the literal key — see
 *     src/i18n/translations.js);
 *   - a JSX text node or aria-label/placeholder/title/alt written as a plain
 *     English string instead of `{t('someKey')}` — invisible to a dictionary
 *     diff because it was never a key at all.
 *
 * Both are provable by reading the actual reachable source tree, not the
 * dictionaries, which is what this script does:
 *
 *   1. build the real import graph from src/main.jsx (the one entry point) and
 *      walk it to find every file the shipped app can actually reach — a string
 *      sitting in a file nothing imports can never reach a learner, so it is
 *      reported separately and never gates the build (see check-a1-* /
 *      LC-DOC-001 for "should this dead file be deleted" — a different question);
 *   2. for every reachable file, parse it with @babel/parser (JSX-aware) and walk
 *      the AST — not text/regex — for `t('literalKey', …)` calls and for JSXText/
 *      aria-label/placeholder/title/alt string literals that look like real
 *      auxiliary prose rather than a code/product token.
 *
 * False-positive discipline (the task's explicit "without absurd false
 * positives" requirement):
 *   - a candidate must contain >=2 words and a lowercase letter, so ALL-CAPS
 *     tokens, acronyms (XP, UI, CEFR), single brand words (Lingua, Chatto) and
 *     symbols never match;
 *   - target-English content is real product content, not an i18n defect: any
 *     JSX element wrapped in the codebase's own established `lang="en"`
 *     convention (already relied on and browser-proved by LC-PED-001/LC-PROD-001)
 *     is skipped, walking up through ancestors;
 *   - ALLOWLIST below is for specific, reviewed exceptions (mascot/brand copy,
 *     legal/technical tokens) found while calibrating this script — add to it only
 *     with a one-line reason, never to silence a real defect.
 *
 * At the time this gate was added the reachable tree had exactly one real
 * defect it could prove (ConversationArchive.jsx's hardcoded "confidence pts"),
 * fixed in the same PR — so this gate starts at zero debt with no baseline/
 * allowlist file to carry forward.
 *
 *   node scripts/check-i18n-lint.mjs
 */
import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, extname, dirname as pdirname, join } from 'node:path'
import { existsSync } from 'node:fs'
import { parse } from '@babel/parser'
import _traverse from '@babel/traverse'
import { extractBase, TRANSLATIONS_PATH } from './lib/i18nSource.mjs'

const traverse = _traverse.default || _traverse

const here = dirname(fileURLToPath(import.meta.url))
const SRC = resolve(here, '../src')
const ENTRY = resolve(SRC, 'main.jsx')

// ---------------------------------------------------------------------------
// 1. Reachability: BFS the real import graph from the one entry point.
// ---------------------------------------------------------------------------

const JS_EXTS = ['.js', '.jsx']
const PARSEABLE = new Set(['.js', '.jsx'])

function resolveSpecifier(fromFile, specifier) {
  if (!specifier.startsWith('.')) return null // bare package import — not part of src
  const base = join(pdirname(fromFile), specifier)
  if (existsSync(base) && !existsSync(base + '/') && extname(base)) return base
  for (const ext of JS_EXTS) {
    if (existsSync(base + ext)) return base + ext
  }
  for (const ext of JS_EXTS) {
    if (existsSync(join(base, `index${ext}`))) return join(base, `index${ext}`)
  }
  if (existsSync(base)) return base // css/json/asset — real file, not parseable
  return null
}

function parseFile(source) {
  return parse(source, {
    sourceType: 'module',
    plugins: ['jsx'],
    errorRecovery: true,
  })
}

const astCache = new Map()
async function astFor(file) {
  if (astCache.has(file)) return astCache.get(file)
  const source = await readFile(file, 'utf8')
  let ast = null
  try { ast = parseFile(source) } catch { ast = null }
  astCache.set(file, ast)
  return ast
}

async function importsOf(file) {
  if (!PARSEABLE.has(extname(file))) return []
  const ast = await astFor(file)
  if (!ast) return []
  const specifiers = []
  traverse(ast, {
    ImportDeclaration(path) { specifiers.push(path.node.source.value) },
    ExportNamedDeclaration(path) { if (path.node.source) specifiers.push(path.node.source.value) },
    ExportAllDeclaration(path) { specifiers.push(path.node.source.value) },
    CallExpression(path) {
      if (path.node.callee.type === 'Import' && path.node.arguments[0]?.type === 'StringLiteral') {
        specifiers.push(path.node.arguments[0].value)
      }
    },
  })
  return specifiers
}

async function buildReachableSet(entry) {
  const reachable = new Set([entry])
  const queue = [entry]
  while (queue.length) {
    const file = queue.pop()
    for (const spec of await importsOf(file)) {
      const resolved = resolveSpecifier(file, spec)
      if (resolved && !reachable.has(resolved)) {
        reachable.add(resolved)
        queue.push(resolved)
      }
    }
  }
  return reachable
}

const reachable = await buildReachableSet(ENTRY)
const reachableJsx = [...reachable].filter(f => extname(f) === '.jsx').sort()
const reachableParseable = [...reachable].filter(f => PARSEABLE.has(extname(f))).sort()

// Every .jsx file that exists in the tree but the entry point can never reach —
// reported for visibility (dead-code signal), never gated by this i18n check.
async function findAllJsx(dir) {
  const found = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) found.push(...await findAllJsx(full))
    else if (entry.isFile() && extname(full) === '.jsx') found.push(full)
  }
  return found
}
const allJsx = await findAllJsx(SRC)
const unreachableJsx = allJsx.filter(f => !reachable.has(f)).sort()

// ---------------------------------------------------------------------------
// 2. Raw-key / silent-fallback: every literal t('key') must exist in base.
// ---------------------------------------------------------------------------

const { dict: base } = await extractBase(await readFile(TRANSLATIONS_PATH, 'utf8'))
const baseKeys = new Set(Object.keys(base))
const rawKeyHits = []

for (const file of reachableParseable) {
  if (file === TRANSLATIONS_PATH) continue
  const ast = await astFor(file)
  if (!ast) continue
  traverse(ast, {
    CallExpression(path) {
      const { callee, arguments: args } = path.node
      if (callee.type !== 'Identifier' || callee.name !== 't') return
      const [first] = args
      if (first?.type !== 'StringLiteral') return // dynamic key (`t(\`prefix_${x}\`)`) — not statically provable
      // A plural-aware key (see src/i18n/translations.js resolveKey()) has no
      // bare entry in base, only `<key>_other` (and friends) — that is not a
      // missing key, it is the plural-stem shape check-i18n.mjs already gates.
      if (!baseKeys.has(first.value) && !baseKeys.has(`${first.value}_other`)) {
        rawKeyHits.push({ file, line: first.loc.start.line, key: first.value })
      }
    },
  })
}

// ---------------------------------------------------------------------------
// 3. Hardcoded visible auxiliary strings — JSXText and known user-facing attrs.
// ---------------------------------------------------------------------------

const TEXT_ATTRS = new Set(['aria-label', 'placeholder', 'title', 'alt'])

// Reviewed exceptions only — each needs a reason. Never add to silence a real defect.
const ALLOWLIST = new Set([
  // (kept empty; populate only after reviewing a real, justified false positive)
])

function looksLikeAuxiliaryProse(raw) {
  const text = raw.replace(/\s+/g, ' ').trim()
  if (text.length < 6) return false
  if (ALLOWLIST.has(text)) return false
  if (!/[a-z]/.test(text)) return false // no lowercase letter — acronym/constant/SHOUTING, not prose
  if (!/^[A-Za-z]/.test(text)) return false // leads with punctuation/digit/symbol — likely a code token
  const words = text.split(' ').filter(Boolean)
  if (words.length < 2) return false // single word — brand/label risk too high to gate
  if (/^https?:\/\//i.test(text)) return false
  if (/^[\d.,%$€£¥+\-*/() ]+$/.test(text)) return false
  return true
}

function hasEnglishAncestor(path) {
  const ancestor = path.findParent(p =>
    p.isJSXElement() && p.node.openingElement.attributes.some(a =>
      a.type === 'JSXAttribute' && a.name?.name === 'lang' &&
      ((a.value?.type === 'StringLiteral' && a.value.value === 'en') ||
       (a.value?.type === 'JSXExpressionContainer' && a.value.expression?.type === 'StringLiteral' && a.value.expression.value === 'en'))))
  return Boolean(ancestor)
}

const hardcodedHits = []

for (const file of reachableJsx) {
  const ast = await astFor(file)
  if (!ast) continue
  traverse(ast, {
    JSXText(path) {
      const text = path.node.value
      if (!looksLikeAuxiliaryProse(text)) return
      if (hasEnglishAncestor(path)) return
      hardcodedHits.push({ file, line: path.node.loc.start.line, text: text.replace(/\s+/g, ' ').trim() })
    },
    JSXAttribute(path) {
      const name = path.node.name?.name
      if (!TEXT_ATTRS.has(name)) return
      const value = path.node.value
      if (value?.type !== 'StringLiteral') return // {t('key')} expressions are fine — only plain literals are hardcoded
      if (!looksLikeAuxiliaryProse(value.value)) return
      if (hasEnglishAncestor(path)) return
      hardcodedHits.push({ file, line: value.loc.start.line, text: value.value.trim(), attr: name })
    },
  })
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

console.log(`\ni18n-lint — ${reachable.size} files reachable from main.jsx (${reachableJsx.length} .jsx)\n`)

if (unreachableJsx.length) {
  console.log(`unreachable .jsx (dead code, not scanned, not gated — ${unreachableJsx.length}):`)
  for (const f of unreachableJsx) console.log(`  ${f.slice(SRC.length + 1)}`)
  console.log('')
}

let failed = false

if (rawKeyHits.length) {
  failed = true
  console.log(`raw-key / silent-fallback (t('key') not in base — renders as the literal key, ${rawKeyHits.length}):`)
  for (const h of rawKeyHits) console.log(`  ${h.file.slice(SRC.length + 1)}:${h.line}  t('${h.key}')`)
  console.log('')
}

if (hardcodedHits.length) {
  failed = true
  console.log(`hardcoded visible auxiliary strings (${hardcodedHits.length}):`)
  for (const h of hardcodedHits) {
    console.log(`  ${h.file.slice(SRC.length + 1)}:${h.line}${h.attr ? ` [${h.attr}]` : ''}  "${h.text}"`)
  }
  console.log('')
} else {
  console.log('hardcoded visible auxiliary strings: none found\n')
}

console.log(failed ? 'check-i18n-lint: FAIL\n' : 'check-i18n-lint: PASS\n')
process.exit(failed ? 1 : 0)
