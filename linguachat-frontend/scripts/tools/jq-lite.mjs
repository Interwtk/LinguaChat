#!/usr/bin/env node
/*
 * jq-lite — the subset of jq our GitHub scripts use, for running
 * check:github-integration on Windows, where jq is not installed.
 *
 * LOCAL ONLY. CI keeps the real jq, which stays the authority: a pass here means
 * "the merge scripts behave under this subset", nothing more. A filter outside
 * the subset is an error (exit 3), never a guess.
 *
 * Supported: . .a .a.b .[0] .[] [ ] ( ) | , // == != and or not select() length
 * ascii_downcase startswith() empty @tsv $var, and -r -c -e -n --arg --argjson.
 */
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

function tokenize(src) {
  const out = []
  const re = /\s*(?:(\/\/|==|!=|[|,()[\]])|("(?:[^"\\]|\\.)*")|(-?\d+(?:\.\d+)?)|(\$[A-Za-z_]\w*)|(@[a-z]+)|(\.[A-Za-z_]\w*)|(\.)|([A-Za-z_]\w*))/y
  let at = 0
  while (at < src.length) {
    if (/^\s*$/.test(src.slice(at))) break
    re.lastIndex = at
    const m = re.exec(src)
    if (!m) throw new SyntaxError(`jq-lite: unsupported filter near: ${src.slice(at, at + 20)}`)
    at = re.lastIndex
    if (m[1]) out.push({ t: m[1] })
    else if (m[2]) out.push({ t: 'lit', v: JSON.parse(m[2]) })
    else if (m[3]) out.push({ t: 'lit', v: Number(m[3]) })
    else if (m[4]) out.push({ t: 'var', v: m[4].slice(1) })
    else if (m[5]) out.push({ t: 'format', v: m[5] })
    else if (m[6]) out.push({ t: 'key', v: m[6].slice(1) })
    else if (m[7]) out.push({ t: '.' })
    else out.push({ t: 'name', v: m[8] })
  }
  return out
}

function parse(src) {
  const toks = tokenize(src)
  let i = 0
  const peek = (t) => toks[i]?.t === t
  const word = (w) => toks[i]?.t === 'name' && toks[i].v === w
  const take = (t) => { if (!peek(t)) throw new SyntaxError(`jq-lite: expected ${t}`); return toks[i++] }

  const pipe = () => { let l = comma(); while (peek('|')) { i++; l = { k: 'pipe', l, r: comma() } } return l }
  const comma = () => { let l = alt(); while (peek(',')) { i++; l = { k: 'comma', l, r: alt() } } return l }
  const alt = () => { let l = or(); while (peek('//')) { i++; l = { k: 'alt', l, r: or() } } return l }
  const or = () => { let l = and(); while (word('or')) { i++; l = { k: 'or', l, r: and() } } return l }
  const and = () => { let l = cmp(); while (word('and')) { i++; l = { k: 'and', l, r: cmp() } } return l }
  const cmp = () => {
    const l = postfix()
    if (peek('==') || peek('!=')) { const op = toks[i++].t; return { k: 'cmp', op, l, r: postfix() } }
    return l
  }
  const postfix = () => {
    let n = primary()
    for (;;) {
      if (peek('key')) n = { k: 'field', of: n, name: toks[i++].v }
      else if (peek('[')) {
        i++
        if (peek(']')) { i++; n = { k: 'iter', of: n } }
        else { const index = take('lit').v; take(']'); n = { k: 'index', of: n, index } }
      } else return n
    }
  }
  const primary = () => {
    if (peek('.')) { i++; return { k: 'id' } }
    if (peek('key')) return { k: 'field', of: { k: 'id' }, name: toks[i++].v }
    if (peek('lit')) return { k: 'lit', v: toks[i++].v }
    if (peek('var')) return { k: 'var', name: toks[i++].v }
    if (peek('format')) { const f = toks[i++].v; if (f !== '@tsv') throw new SyntaxError(`jq-lite: unsupported ${f}`); return { k: 'tsv' } }
    if (peek('(')) { i++; const n = pipe(); take(')'); return n }
    if (peek('[')) { i++; if (peek(']')) { i++; return { k: 'array', of: null } } const n = pipe(); take(']'); return { k: 'array', of: n } }
    if (peek('name')) {
      const name = toks[i++].v
      if (['true', 'false', 'null'].includes(name)) return { k: 'lit', v: JSON.parse(name) }
      if (['length', 'ascii_downcase', 'empty', 'not'].includes(name)) return { k: name }
      if (['select', 'startswith'].includes(name)) { take('('); const arg = pipe(); take(')'); return { k: name, arg } }
      throw new SyntaxError(`jq-lite: unsupported function ${name}`)
    }
    throw new SyntaxError('jq-lite: unexpected end of filter')
  }
  const tree = pipe()
  if (i !== toks.length) throw new SyntaxError('jq-lite: trailing filter text')
  return tree
}

const truthy = (v) => v !== null && v !== false && v !== undefined
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

function run(n, input, vars) {
  const ev = (node, v = input) => run(node, v, vars)
  switch (n.k) {
    case 'id': return [input]
    case 'lit': return [n.v]
    case 'var': if (!(n.name in vars)) throw new Error(`jq-lite: $${n.name} is not defined`); return [vars[n.name]]
    case 'pipe': return ev(n.l).flatMap(v => ev(n.r, v))
    case 'comma': return [...ev(n.l), ...ev(n.r)]
    case 'alt': { const left = ev(n.l).filter(truthy); return left.length ? left : ev(n.r) }
    case 'or': return ev(n.l).flatMap(a => (truthy(a) ? [true] : ev(n.r).map(truthy)))
    case 'and': return ev(n.l).flatMap(a => (truthy(a) ? ev(n.r).map(truthy) : [false]))
    case 'cmp': return ev(n.l).flatMap(a => ev(n.r).map(b => (n.op === '==') === same(a, b)))
    case 'field': return ev(n.of).map(v => (v === null || v === undefined ? null : v[n.name] ?? null))
    case 'index': return ev(n.of).map(v => (Array.isArray(v) ? v.at(n.index) ?? null : null))
    case 'iter': return ev(n.of).flatMap(v => (Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v) : []))
    case 'array': return [n.of ? ev(n.of) : []]
    case 'empty': return []
    case 'not': return [!truthy(input)]
    case 'length': return [input === null ? 0 : typeof input === 'object' && !Array.isArray(input) ? Object.keys(input).length : input.length]
    case 'ascii_downcase': return [String(input).replace(/[A-Z]/g, c => c.toLowerCase())]
    case 'startswith': return ev(n.arg).map(p => String(input).startsWith(p))
    case 'select': return ev(n.arg).some(truthy) ? [input] : []
    case 'tsv': return [input.map(v => (v === null ? '' : String(v))).join('\t')]
    default: throw new Error(`jq-lite: cannot run ${n.k}`)
  }
}

export function jqLite(filter, input, vars = {}) {
  return run(parse(filter), input, vars)
}

function main(argv) {
  const opts = { raw: false, compact: false, exit: false, nullInput: false }
  const vars = {}
  let filter = null
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--version') { console.log('jq-lite-1 (LinguaChat local subset)'); return 0 }
    if (a === '--arg') { vars[argv[++i]] = argv[++i]; continue }
    if (a === '--argjson') { const name = argv[++i]; vars[name] = JSON.parse(argv[++i]); continue }
    if (/^-[rcen]+$/.test(a)) {
      opts.raw ||= a.includes('r'); opts.compact ||= a.includes('c'); opts.exit ||= a.includes('e'); opts.nullInput ||= a.includes('n')
      continue
    }
    if (a.startsWith('-') && a.length > 1) { console.error(`jq-lite: unsupported option ${a}`); return 3 }
    if (filter === null) filter = a
    else { console.error('jq-lite: file arguments are not supported'); return 3 }
  }
  const text = opts.nullInput ? 'null' : readFileSync(0, 'utf8')
  if (!text.trim()) return 0
  let input
  try { input = JSON.parse(text) } catch { console.error('jq-lite: invalid JSON input'); return 2 }
  let out
  try { out = jqLite(filter ?? '.', input, vars) } catch (error) { console.error(error.message); return 3 }
  for (const v of out) {
    if (opts.raw && typeof v === 'string') console.log(v)
    else console.log(JSON.stringify(v, null, opts.compact ? 0 : 2))
  }
  if (opts.exit) return out.length && truthy(out.at(-1)) ? 0 : 1
  return 0
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) process.exitCode = main(process.argv.slice(2))
