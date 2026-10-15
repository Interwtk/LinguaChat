import { seedFrom } from './variation.js'

// Bounded revisable observations, never learner types or mastery evidence.
// A later independent attempt evaluates the most recent earlier instruction.
export function teachingHistory(raw) {
  return (Array.isArray(raw) ? raw : []).filter(x => x && typeof x.id === 'string'
    && typeof x.capability === 'string' && typeof x.format === 'string'
    && typeof x.session === 'string' && Number.isFinite(x.at)
    && (typeof x.success === 'boolean' || x.success === null)).slice(-80)
}
export function observeTeaching(model, observation) {
  const history = teachingHistory(model.teachingHistory)
  if (history.some(x => x.id === observation.id)) return false
  const clean = teachingHistory([observation])[0]
  if (!clean) return false
  model.teachingHistory = [...history, clean].slice(-80)
  return true
}
export function teachingEstimates(model, capability, candidates) {
  const history = teachingHistory(model?.teachingHistory).filter(x => x.capability === capability)
  const outcomes = Object.fromEntries(candidates.map(f => [f, []]))
  history.forEach((probe, i) => {
    if (!probe.independent || probe.retried || probe.assisted || typeof probe.success !== 'boolean') return
    const prior = history.slice(0, i).reverse().find(x => x.session !== probe.session && x.at < probe.at)
    if (!prior || !outcomes[prior.format]) return
    // Product window, not a scientific estimate. Older hypotheses can reverse.
    outcomes[prior.format].push({ success: probe.success, transfer: prior.context !== probe.context })
  })
  return candidates.map(format => {
    const samples = outcomes[format].slice(-12)
    return { format, count: samples.length,
      retention: (1 + samples.filter(x => x.success).length) / (2 + samples.length),
      transfer: samples.filter(x => x.transfer && x.success).length }
  })
}
export function chooseTeaching(model, capability, candidates, seed = '') {
  if (!capability || candidates.length < 2) return null
  const estimates = teachingEstimates(model, capability, candidates)
  if (!estimates.some(x => x.count >= 3)) return null
  const n = seedFrom(String(seed))
  // Exploration remains reachable even after strong early evidence.
  if (n % 5 === 0) return { format: candidates[Math.floor(n / 5) % candidates.length], reason: 'exploration', estimates }
  const ranked = [...estimates].sort((a, b) => b.retention - a.retention || b.transfer - a.transfer || a.count - b.count)
  return { format: ranked[0].format, reason: 'later-independent-retrieval', estimates }
}
