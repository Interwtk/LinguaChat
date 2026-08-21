#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const FILES = {
  pedagogical: new URL('../../docs/research/supervisors/pedagogical-primary.json', import.meta.url),
  psychology: new URL('../../docs/research/supervisors/psychology-primary.json', import.meta.url),
}
const MIN = 100
const required = ['id','title','authors','year','design','venue','institution','topic','outcome','limitations','sourceUrl','persistentId','qualityGrade','verified']

function norm(s='') { return String(s).trim().toLowerCase().replace(/\s+/g,' ') }
function load(domain, url) {
  if (!existsSync(url)) return { domain, records: [], errors: [`missing ${url.pathname}`] }
  let records
  try { records = JSON.parse(readFileSync(url, 'utf8')) } catch (e) { return { domain, records: [], errors: [`invalid JSON: ${e.message}`] } }
  if (!Array.isArray(records)) return { domain, records: [], errors: ['root must be a JSON array'] }
  const errors = []
  const seenId = new Set(), seenStudy = new Set()
  const topicCounts = new Map()
  records.forEach((r, i) => {
    for (const key of required) {
      if (r[key] === undefined || r[key] === null || r[key] === '') errors.push(`#${i+1} ${r.id || '?'} missing ${key}`)
    }
    if (r.verified !== true) errors.push(`#${i+1} ${r.id || '?'} verified must be true`)
    if (!['A','B'].includes(r.qualityGrade)) errors.push(`#${i+1} ${r.id || '?'} qualityGrade must be A or B`)
    if (r.sourceType && r.sourceType !== 'primary') errors.push(`#${i+1} ${r.id || '?'} sourceType must be primary`)
    const id = norm(r.id)
    if (seenId.has(id)) errors.push(`duplicate record id ${r.id}`)
    seenId.add(id)
    const pid = norm(r.persistentId)
    const fingerprint = pid || `${norm(r.title)}|${r.year}`
    if (seenStudy.has(fingerprint)) errors.push(`duplicate study ${r.persistentId || r.title}`)
    seenStudy.add(fingerprint)
    const topic = norm(r.topic)
    if (topic) topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1)
  })
  const uniqueCount = seenStudy.size
  if (uniqueCount < MIN) errors.push(`${domain}: ${uniqueCount}/${MIN} unique verified primary studies`)
  const topicValues = [...topicCounts.values()]
  if (topicCounts.size < 6) errors.push(`${domain}: only ${topicCounts.size} topics; need >=6`)
  if (uniqueCount >= MIN && topicValues.some(n => n > Math.floor(uniqueCount * 0.35))) errors.push(`${domain}: one topic exceeds 35% of the evidence base`)
  const strongTopics = topicValues.filter(n => n >= 8).length
  if (uniqueCount >= MIN && strongTopics < 5) errors.push(`${domain}: fewer than 5 topics have >=8 studies`)
  return { domain, records, errors, uniqueCount, topicCounts: Object.fromEntries(topicCounts) }
}

let failed = false
for (const [domain, url] of Object.entries(FILES)) {
  const result = load(domain, url)
  console.log(`${domain}: ${result.uniqueCount || 0}/${MIN} unique primary studies; ${Object.keys(result.topicCounts || {}).length} topics`)
  if (result.errors.length) {
    failed = true
    for (const e of result.errors.slice(0, 60)) console.error(`- ${e}`)
    if (result.errors.length > 60) console.error(`- ... ${result.errors.length - 60} more`)
  }
}
if (failed) process.exit(1)
console.log('Supervisor evidence gate: READY (100+100 unique validated primary studies).')
