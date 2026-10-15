import { seedFrom } from './variation.js'

// Bounded revisable observations, never learner types or mastery evidence.
// A later independent attempt evaluates the most recent earlier instruction.
export function teachingHistory(raw) {
  return (Array.isArray(raw) ? raw : []).filter(x => x && typeof x.id === 'string'
    && typeof x.capability === 'string' && typeof x.format === 'string'
    && typeof x.session === 'string' && Number.isFinite(x.at)
    && (typeof x.success === 'boolean' || x.success === null))
    .sort((a, b) => a.at - b.at || a.id.localeCompare(b.id)).slice(-80)
}
export function observeTeaching(model, observation) {
  const history = teachingHistory(model.teachingHistory)
  if (history.some(x => x.id === observation.id)) return false
  const clean = teachingHistory([observation])[0]
  if (!clean) return false
  model.teachingHistory = teachingHistory([...history, clean])
  return true
}
export function teachingEstimates(model, capability, candidates, dimension = 'format') {
  const history = teachingHistory(model?.teachingHistory).filter(x => x.capability === capability)
  const outcomes = Object.fromEntries(candidates.map(f => [f, []]))
  const measuredSessions = new Set()
  history.forEach((probe, i) => {
    if (!probe.independent || probe.retried || probe.assisted || typeof probe.success !== 'boolean') return
    // Several blocks/reopens on one learning-day are one retention occasion.
    // Keep the first valid probe, including a failure; a later same-day success
    // must not rewrite it or manufacture confidence through massed repetition.
    if (measuredSessions.has(probe.session)) return
    measuredSessions.add(probe.session)
    const prior = history.slice(0, i).reverse().find(x => x.session !== probe.session && x.at < probe.at)
    if (!prior || !outcomes[prior[dimension]]) return
    // Product window, not a scientific estimate. Older hypotheses can reverse.
    outcomes[prior[dimension]].push({ success: probe.success, transfer: history.length < 80
      && Boolean(probe.context) && prior.context !== probe.context
      && !history.slice(0, i).some(x => x.context === probe.context) })
  })
  return candidates.map(format => {
    const samples = outcomes[format].slice(-12)
    return { format, count: samples.length,
      retention: (1 + samples.filter(x => x.success).length) / (2 + samples.length),
      transfer: samples.filter(x => x.transfer && x.success).length }
  })
}
export function chooseTeaching(model, capability, candidates, seed = '', dimension = 'format') {
  if (!capability || candidates.length < 2) return null
  const estimates = teachingEstimates(model, capability, candidates, dimension)
  if (!estimates.some(x => x.count >= 3)) return null
  const n = seedFrom(String(seed))
  // Exploration remains reachable even after strong early evidence.
  if (n % 5 === 0) return { format: candidates[Math.floor(n / 5) % candidates.length], reason: 'exploration', estimates }
  const ranked = [...estimates].sort((a, b) => b.retention - a.retention || b.transfer - a.transfer || a.count - b.count)
  return { format: ranked[0].format, reason: 'later-independent-retrieval', estimates }
}
