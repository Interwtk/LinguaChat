#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const FILES = {
  pedagogical: {
    url: new URL('../../docs/research/supervisors/pedagogical-primary.json', import.meta.url),
    path: 'docs/research/supervisors/pedagogical-primary.json',
  },
  psychology: {
    url: new URL('../../docs/research/supervisors/psychology-primary.json', import.meta.url),
    path: 'docs/research/supervisors/psychology-primary.json',
  },
}
const MIN = 100
const required = [
  'id','title','authors','year','design','sampleSize','population','venue','institution',
  'topic','outcome','limitations','sourceUrl','persistentId','verificationSources',
  'verifiedAt','qualityGrade','qualityRationale','sourceType','verified'
]
const IDENTITY_HOSTS = new Set(['doi.org','api.crossref.org','pubmed.ncbi.nlm.nih.gov','eric.ed.gov'])

function norm(s='') { return String(s).trim().toLowerCase().replace(/\s+/g,' ') }
function httpsUrl(value) {
  try { const u = new URL(String(value)); return u.protocol === 'https:' ? u : null } catch { return null }
}
function hasPersistentIdentity(value='') {
  const v = norm(value)
  return /^doi:\s*10\.\d{4,9}\//.test(v) || /^10\.\d{4,9}\//.test(v) ||
    /^https:\/\/doi\.org\/10\.\d{4,9}\//.test(v) || /^pmid:\s*\d+$/.test(v) || /^eric:\s*[a-z0-9-]+$/.test(v)
}

export function validateCorpus(domain, records, { requireReady = true } = {}) {
  if (!Array.isArray(records)) return { domain, records: [], errors: ['root must be a JSON array'], uniqueCount: 0, topicCounts: {} }
  const errors = []
  const seenId = new Set(), seenStudy = new Set()
  const topicCounts = new Map()
  records.forEach((r, i) => {
    const label = `#${i+1} ${r?.id || '?'}`
    for (const key of required) {
      const value = r?.[key]
      if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) errors.push(`${label} missing ${key}`)
    }
    if (r?.verified !== true) errors.push(`${label} verified must be true`)
    if (r?.sourceType !== 'primary') errors.push(`${label} sourceType must be primary`)
    if (!['A','B'].includes(r?.qualityGrade)) errors.push(`${label} qualityGrade must be A or B`)
    if (!Number.isInteger(r?.sampleSize) || r.sampleSize <= 0) errors.push(`${label} sampleSize must be a positive integer`)
    if (!Number.isInteger(r?.year) || r.year < 1900 || r.year > new Date().getUTCFullYear()) errors.push(`${label} year is invalid`)
    if (!/^\d{4}-\d{2}-\d{2}(T.*Z)?$/.test(String(r?.verifiedAt || ''))) errors.push(`${label} verifiedAt must be an ISO date/date-time`)
    if (!hasPersistentIdentity(r?.persistentId)) errors.push(`${label} persistentId must be a DOI, PMID or ERIC identifier`)

    const source = httpsUrl(r?.sourceUrl)
    if (!source) errors.push(`${label} sourceUrl must be HTTPS`)
    const verification = Array.isArray(r?.verificationSources) ? r.verificationSources : []
    const validVerification = verification.map(httpsUrl).filter(Boolean)
    if (validVerification.length < 2) errors.push(`${label} needs >=2 valid HTTPS verificationSources`)
    if (new Set(validVerification.map(u => u.href)).size < 2) errors.push(`${label} verificationSources must be distinct`)
    if (!validVerification.some(u => IDENTITY_HOSTS.has(u.hostname))) {
      errors.push(`${label} needs DOI/Crossref, PubMed or ERIC among verificationSources`)
    }

    const id = norm(r?.id)
    if (seenId.has(id)) errors.push(`duplicate record id ${r?.id}`)
    seenId.add(id)
    const pid = norm(r?.persistentId)
    const fingerprint = pid || `${norm(r?.title)}|${r?.year}`
    if (seenStudy.has(fingerprint)) errors.push(`duplicate study ${r?.persistentId || r?.title}`)
    seenStudy.add(fingerprint)
    const topic = norm(r?.topic)
    if (topic) topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1)
  })
  const uniqueCount = seenStudy.size
  if (requireReady) {
    if (uniqueCount < MIN) errors.push(`${domain}: ${uniqueCount}/${MIN} unique verified primary studies`)
    const topicValues = [...topicCounts.values()]
    if (topicCounts.size < 6) errors.push(`${domain}: only ${topicCounts.size} topics; need >=6`)
    if (uniqueCount >= MIN && topicValues.some(n => n > Math.floor(uniqueCount * 0.35))) errors.push(`${domain}: one topic exceeds 35% of the evidence base`)
    const strongTopics = topicValues.filter(n => n >= 8).length
    if (uniqueCount >= MIN && strongTopics < 5) errors.push(`${domain}: fewer than 5 topics have >=8 studies`)
  }
  return { domain, records, errors, uniqueCount, topicCounts: Object.fromEntries(topicCounts) }
}

function readCorpus(spec, ref) {
  if (!ref) {
    if (!existsSync(spec.url)) return { error: `missing ${spec.url.pathname}` }
    try { return { text: readFileSync(spec.url, 'utf8') } } catch (e) { return { error: e.message } }
  }
  try {
    return { text: execFileSync('git', ['show', `${ref}:${spec.path}`], { encoding:'utf8', stdio:['ignore','pipe','pipe'] }) }
  } catch {
    return { error: `missing ${spec.path} at ${ref}` }
  }
}

function load(domain, spec, options, ref) {
  const source = readCorpus(spec, ref)
  if (source.error) return { domain, records: [], errors: [source.error], uniqueCount: 0, topicCounts: {} }
  let records
  try { records = JSON.parse(source.text) } catch (e) { return { domain, records: [], errors: [`invalid JSON: ${e.message}`], uniqueCount: 0, topicCounts: {} } }
  return validateCorpus(domain, records, options)
}

function arg(name) {
  const i = process.argv.indexOf(name)
  return i >= 0 ? process.argv[i + 1] : null
}

function runCli() {
  const partialIndex = process.argv.indexOf('--partial')
  const partial = partialIndex >= 0
  const requestedDomain = partial && process.argv[partialIndex + 1] && !process.argv[partialIndex + 1].startsWith('--') ? process.argv[partialIndex + 1] : null
  const ref = arg('--ref')
  const entries = requestedDomain ? [[requestedDomain, FILES[requestedDomain]]] : Object.entries(FILES)
  if (requestedDomain && !FILES[requestedDomain]) {
    console.error(`Unknown evidence domain: ${requestedDomain}`)
    process.exit(2)
  }
  let failed = false
  for (const [domain, spec] of entries) {
    const result = load(domain, spec, { requireReady: !partial }, ref)
    console.log(`${domain}: ${result.uniqueCount || 0}${partial ? '' : `/${MIN}`} unique primary studies; ${Object.keys(result.topicCounts || {}).length} topics`)
    if (result.errors.length) {
      failed = true
      for (const e of result.errors.slice(0, 80)) console.error(`- ${e}`)
      if (result.errors.length > 80) console.error(`- ... ${result.errors.length - 80} more`)
    }
  }
  if (failed) process.exit(1)
  if (partial) console.log('Supervisor evidence partial gate: every present primary-study record is structurally verifiable and deduplicated.')
  else console.log('Supervisor evidence gate: READY (100+100 unique, identity-verified, primary empirical studies).')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) runCli()
