#!/usr/bin/env node
/*
 * curriculum-readiness-matrix — the Pre-A1 / A1 coverage tables, computed (P3).
 *
 * Every number in docs/curriculum/pre-a1-a1-readiness-matrix.md between the
 * generated markers comes from here: the runtime skeleton, the content loader
 * (each episode's content is really loaded), the level gate, the eight
 * locales, the A1 blueprint and the test suites that cover each episode.
 * Nothing is typed by hand, so the matrix cannot claim more than the code has.
 *
 *   node scripts/curriculum-readiness-matrix.mjs           print the tables
 *   node scripts/curriculum-readiness-matrix.mjs --write   refresh the document
 *   node scripts/curriculum-readiness-matrix.mjs --check   fail if it is stale
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { EPISODE_SKELETON } from '../src/learning/curriculum/preA1Skeleton.generated.js'
import { loadEpisodeContent, episodeRequest, hasContentLoader } from '../src/learning/curriculum/episodeContent.js'
import { PRE_A1_EXIT_CRITERIA } from '../src/learning/curriculum/preA1Map.js'
import { isLevelAvailable } from '../src/learning/curriculum/levels.js'
import { extractBase, extractLocale, LOCALE_ORDER, TRANSLATIONS_PATH, LOCALES_DIR } from './lib/i18nSource.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const REPO = join(ROOT, '..')
const DOC = join(REPO, 'docs/curriculum/pre-a1-a1-readiness-matrix.md')
const blueprint = JSON.parse(readFileSync(join(REPO, 'docs/curriculum/a1-blueprint.json'), 'utf8'))

const OPEN = new Set(['free_reply'])
const RECALL = new Set(['recall'])
const CLOSED = new Set(['choice', 'word_order', 'fill_blank', 'comprehension'])

// i18n: the English source and each locale, read exactly as the i18n checks read them
const base = extractBase(readFileSync(TRANSLATIONS_PATH, 'utf8')).dict
const locales = Object.fromEntries(LOCALE_ORDER.map(code => [code, extractLocale(readFileSync(join(LOCALES_DIR, `${code}.js`), 'utf8')).dict]))

function files(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (['node_modules', '.venv', '__pycache__'].includes(name)) continue
    if (statSync(path).isDirectory()) files(path, out)
    else if (/\.(mjs|py)$/.test(name) && !name.startsWith('curriculum-readiness-matrix')) out.push(path)
  }
  return out
}
const testSources = [...files(join(ROOT, 'scripts')), ...files(join(REPO, 'linguachat-backend/tests'))]
  .map(path => ({ path: path.replace(/\\/g, '/'), text: readFileSync(path, 'utf8') }))

// Suites that walk a whole level or arc without naming each episode id.
const LEVEL_WIDE = {
  'Pre-A1': /check-pre-a1-journeys|check-pedagogical-journeys|check-pre-a1-freeze|check-episodes\.mjs|check-arc-e2e/,
  A1: /check-a1-longitudinal-journeys|check-pedagogical-journeys|check-a1-blueprint/,
}

async function episodeRows(level) {
  const rows = []
  for (const ep of EPISODE_SKELETON.filter(e => e.level === level)) {
    const types = ep.steps.map(s => s.type)
    let loaded = 0
    try { loaded = (await loadEpisodeContent({ episodeId: ep.id, forLearner: false })).steps?.length || 0 } catch { loaded = 0 }
    const prefix = ep.titleKey.replace(/Title$/, '')
    const keys = Object.keys(base).filter(k => k.startsWith(prefix) && /^[A-Z]/.test(k.slice(prefix.length)))
    const missing = LOCALE_ORDER.filter(code => keys.some(k => !locales[code][k]))
    const arcOrder = level === 'A1' ? blueprint.arcs.find(a => a.id === ep.arc)?.order : null
    const arcModule = arcOrder ? new RegExp(`a1Arc_?${arcOrder}(?![0-9])`) : null
    const byId = testSources.filter(t => t.text.includes(`'${ep.id}'`) || t.text.includes(`"${ep.id}"`)).length
    const byArc = testSources.filter(t => t.text.includes(`'${ep.arc}'`) || (arcModule && arcModule.test(t.text))
      || LEVEL_WIDE[level].test(t.path)).length
    rows.push({
      id: ep.id, arc: ep.arc, canDo: ep.canDoId, secondary: ep.secondaryCanDoId || null,
      open: types.filter(t => OPEN.has(t)).length,
      recall: types.filter(t => RECALL.has(t)).length,
      closed: types.filter(t => CLOSED.has(t)).length,
      loader: hasContentLoader(level === 'Pre-A1' ? 'pre_a1' : 'a1', ep.arc),
      loadedSteps: loaded,
      learnerCanOpen: episodeRequest({ episodeId: ep.id }).ok,
      keys: keys.length,
      localesComplete: missing.length === 0 ? '8/8' : `${8 - missing.length}/8 (${missing.join(',')})`,
      byId, byArc,
    })
  }
  return rows
}

function table(rows) {
  const head = '| Episodio | Arco | Capacidad | Abiertas | Recuerdo | Cerradas | Contenido carga (pasos) | Estudiante puede abrir | Claves i18n | Idiomas completos | Pruebas: por id / por arco o nivel |'
  const sep = '|---|---|---|---|---|---|---|---|---|---|---|'
  const line = r => [
    '`' + r.id + '`', r.arc, r.canDo + (r.secondary ? ` (+${r.secondary})` : ''), r.open, r.recall, r.closed,
    r.loader && r.loadedSteps ? `sí (${r.loadedSteps})` : 'NO', r.learnerCanOpen ? 'sí' : 'no (cerrado)',
    r.keys, r.localesComplete, `${r.byId} / ${r.byArc}`,
  ].join(' | ')
  return [head, sep, ...rows.map(r => `| ${line(r)} |`)].join('\n')
}

function coverage(canDos, rows) {
  const head = '| Capacidad | Alcance | Episodios (propio o secundario) | Producciones abiertas | Pasos de recuerdo diferido | Reutilizada en otros episodios (transferencia) |'
  const sep = '|---|---|---|---|---|---|'
  const lines = canDos.map(c => {
    const own = rows.filter(r => r.canDo === c.id || r.secondary === c.id)
    const reuse = EPISODE_SKELETON.filter(e => (e.reuseSkills || []).includes(c.id)).length
    return `| ${c.id} | ${c.scope} | ${own.length} | ${own.reduce((n, r) => n + r.open, 0)} | ${own.reduce((n, r) => n + r.recall, 0)} | ${reuse} |`
  })
  return [head, sep, ...lines].join('\n')
}

export async function computeMatrix() {
  const pre = await episodeRows('Pre-A1')
  const a1 = await episodeRows('A1')
  const preCanDos = PRE_A1_EXIT_CRITERIA.requiredCanDos.map(id => ({ id, scope: 'required (exit)' }))
  const a1CanDos = blueprint.canDos.map(c => ({ id: c.id, scope: c.scope }))
  const uncovered = a1CanDos.filter(c => !a1.some(r => r.canDo === c.id || r.secondary === c.id)).map(c => c.id)
  const sum = (rows, key) => rows.reduce((n, r) => n + r[key], 0)
  const summary = [
    '| Medida | Pre-A1 | A1 |',
    '|---|---|---|',
    `| Nivel abierto a estudiantes | ${isLevelAvailable('pre_a1') ? 'sí' : 'no'} | ${isLevelAvailable('a1') ? 'sí' : 'no'} |`,
    `| Episodios en runtime / planificados | ${pre.length} / 17 | ${a1.length} / ${blueprint.episodes.length} |`,
    `| Episodios cuyo contenido carga de verdad | ${pre.filter(r => r.loadedSteps).length} | ${a1.filter(r => r.loadedSteps).length} |`,
    `| Episodios que un estudiante puede abrir hoy | ${pre.filter(r => r.learnerCanOpen).length} | ${a1.filter(r => r.learnerCanOpen).length} |`,
    `| Episodios con i18n completo en los 8 idiomas | ${pre.filter(r => r.localesComplete === '8/8').length} | ${a1.filter(r => r.localesComplete === '8/8').length} |`,
    `| Producciones abiertas (free_reply) | ${sum(pre, 'open')} | ${sum(a1, 'open')} |`,
    `| Pasos de recuerdo diferido (recall) | ${sum(pre, 'recall')} | ${sum(a1, 'recall')} |`,
    `| Episodios sin prueba que los nombre por id | ${pre.filter(r => !r.byId).length} | ${a1.filter(r => !r.byId).length} |`,
    `| Episodios sin ninguna prueba (ni por id ni por arco/nivel) | ${pre.filter(r => !r.byId && !r.byArc).length} | ${a1.filter(r => !r.byId && !r.byArc).length} |`,
    `| Capacidades del blueprint sin episodio (propio o secundario) | — | ${uncovered.length ? uncovered.join(', ') : 'ninguna'} |`,
  ].join('\n')
  return [
    '### Resumen calculado', '', summary, '',
    '### Pre-A1 — episodios', '', table(pre), '',
    '### Pre-A1 — capacidades exigidas para graduarse', '', coverage(preCanDos, pre), '',
    '### A1 — episodios', '', table(a1), '',
    '### A1 — capacidades del blueprint', '', coverage(a1CanDos, a1),
  ].join('\n')
}

const START = '<!-- generated:start (node scripts/curriculum-readiness-matrix.mjs --write) -->'
const END = '<!-- generated:end -->'

const generated = await computeMatrix()
if (process.argv.includes('--write') || process.argv.includes('--check')) {
  const doc = readFileSync(DOC, 'utf8')
  const a = doc.indexOf(START), b = doc.indexOf(END)
  if (a < 0 || b < a) throw new Error('generated markers missing in ' + DOC)
  const next = doc.slice(0, a + START.length) + '\n\n' + generated + '\n\n' + doc.slice(b)
  if (process.argv.includes('--check')) {
    if (next !== doc) { console.error('curriculum-readiness-matrix — STALE: run with --write'); process.exit(1) }
    console.log('curriculum-readiness-matrix — OK (the document matches the runtime)')
  } else {
    writeFileSync(DOC, next)
    console.log('curriculum-readiness-matrix — written')
  }
} else {
  console.log(generated)
}
