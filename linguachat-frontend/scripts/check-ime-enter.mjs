#!/usr/bin/env node
/*
 * check-ime-enter — Enter sends; Enter that confirms an IME composition does not.
 *
 * A Japanese learner types with an input method: Enter picks the kanji/kana.
 * Every "Enter sends" handler used to fire on that Enter too, sending half a
 * word (the chat, the answer fields, even the name field). This proves the
 * shared rule on the event shapes real browsers produce, and that no field
 * reads Enter on its own any more. The same behaviour is exercised against
 * the running app in a real browser (see the P2 report, browser results).
 *
 * Run: node scripts/check-ime-enter.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isSubmitEnter } from '../src/services/keyboard.js'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
let passed = 0
const failures = []
function scenario(name, run) {
  try { run(); passed++; console.log('  ok  ' + name) }
  catch (error) { failures.push(name); console.log('  FAIL ' + name + '\n       ' + String(error.message).split('\n')[0]) }
}
// The shape React hands a handler: its own fields plus the browser event.
const key = (k, { composing = false, keyCode = k === 'Enter' ? 13 : 0, shift = false } = {}) =>
  ({ key: k, shiftKey: shift, keyCode, nativeEvent: { key: k, isComposing: composing, keyCode, shiftKey: shift } })

scenario('a plain Enter sends', () => {
  assert.equal(isSubmitEnter(key('Enter')), true)
})
scenario('Enter while composing (Chrome, Firefox, Edge) does not send', () => {
  assert.equal(isSubmitEnter(key('Enter', { composing: true, keyCode: 229 })), false)
  assert.equal(isSubmitEnter(key('Enter', { composing: true })), false)
})
scenario('the confirming Enter Safari sends after compositionend (keyCode 229) does not send', () => {
  assert.equal(isSubmitEnter(key('Enter', { composing: false, keyCode: 229 })), false)
})
scenario('cancelling a composition (Escape) or typing a key never sends', () => {
  assert.equal(isSubmitEnter(key('Escape', { composing: true })), false)
  assert.equal(isSubmitEnter(key('a', { composing: true, keyCode: 229 })), false)
  assert.equal(isSubmitEnter(key('Escape')), false)
})
scenario('the Enter after a finished composition sends normally', () => {
  // compose → confirm (229) → then a real Enter
  const sequence = [key('Enter', { composing: true, keyCode: 229 }), key('Enter', { keyCode: 229 }), key('Enter')]
  assert.deepEqual(sequence.map(e => isSubmitEnter(e)), [false, false, true])
})
scenario('the multi-line composer keeps Shift+Enter for a new line; single-line fields may submit', () => {
  assert.equal(isSubmitEnter(key('Enter', { shift: true })), false)
  assert.equal(isSubmitEnter(key('Enter', { shift: true }), { allowShift: true }), true)
  assert.equal(isSubmitEnter(key('Enter', { shift: true, composing: true }), { allowShift: true }), false)
})
scenario('a bare DOM KeyboardEvent-like object works too', () => {
  assert.equal(isSubmitEnter({ key: 'Enter', isComposing: true }), false)
  assert.equal(isSubmitEnter({ key: 'Enter', isComposing: false, keyCode: 13 }), true)
  assert.equal(isSubmitEnter(null), false)
})
scenario('no field reads Enter on its own: every handler goes through the shared rule', () => {
  const files = []
  const walk = dir => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name)
      if (statSync(path).isDirectory()) walk(path)
      else if (/\.(jsx?|tsx?)$/.test(name)) files.push(path)
    }
  }
  walk(join(ROOT, 'src'))
  const raw = files.filter(f => !f.endsWith(join('services', 'keyboard.js')))
    .filter(f => /key\s*===\s*['"]Enter['"]/.test(readFileSync(f, 'utf8')))
    .map(f => relative(ROOT, f))
  assert.deepEqual(raw, [], 'reads Enter directly: ' + raw.join(', '))
  const users = files.filter(f => readFileSync(f, 'utf8').includes('isSubmitEnter(')).map(f => relative(ROOT, f))
  for (const expected of ['ConversationRoom.jsx', 'SessionRunner.jsx', 'EpisodeShell.jsx', 'MiniStory.jsx', 'LanguageIdentity.jsx']) {
    assert.ok(users.some(f => f.endsWith(expected)), expected + ' uses the shared rule')
  }
})

console.log(`\ncheck-ime-enter — ${passed} passed, ${failures.length} failed`)
if (failures.length) process.exit(1)
