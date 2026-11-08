/*
 * FROZEN REFERENCE — the method-choice policy exactly as it shipped in phase 5
 * (src/learning/engine/teachingPolicy.js at P4). Test-only: the adaptation
 * benchmark (check-adaptation-policy.mjs) compares the current policy with
 * this one on the same synthetic learners. Never imported by product code.
 */
import { seedFrom } from '../../src/learning/engine/variation.js'

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
  for (const { probe, prior, index: i } of retentionProbes(history)) {
    if (!outcomes[prior[dimension]]) continue
    // Product window, not a scientific estimate. Older hypotheses can reverse.
    outcomes[prior[dimension]].push({ success: probe.success, transfer: history.length < 80
      && Boolean(probe.context) && prior.context !== probe.context
      && !history.slice(0, i).some(x => x.context === probe.context) })
  }
  return candidates.map(format => {
    const samples = outcomes[format].slice(-12)
    const successes = samples.filter(x => x.success).length
    return { format, count: samples.length,
      retention: (1 + successes) / (2 + samples.length),
      transfer: samples.filter(x => x.transfer && x.success).length,
      uncertainty: evidenceSummary(successes, samples.length - successes) }
  })
}

export function retentionProbes(history) {
  const measuredSessions = new Set(), probes = []
  history.forEach((probe, i) => {
    if (!probe.independent || probe.retried || probe.assisted || typeof probe.success !== 'boolean') return
    // Several blocks/reopens on one learning-day are one retention occasion.
    // Keep the first valid probe, including a failure; a later same-day success
    // must not rewrite it or manufacture confidence through massed repetition.
    if (measuredSessions.has(probe.session)) return
    measuredSessions.add(probe.session)
    const prior = history.slice(0, i).reverse().find(x => x.session !== probe.session && x.at < probe.at)
    if (prior) probes.push({ probe, prior, index: i })
  })
  return probes
}

// Scheduling heuristics, not mastery or a learner type. A short recent window
// permits recovery/reversal; one valid probe per learning-day caps repetition.
export function retentionProfile(model, capability, atMs = Date.now()) {
  const history = teachingHistory(model?.teachingHistory).filter(x => x.capability === capability && x.at <= atMs)
  const recent = retentionProbes(history).map(x => x.probe).slice(-6)
  const last = recent.at(-1)
  let successes = 0
  for (let i = recent.length - 1; i >= 0 && recent[i].success; i--) successes++
  return { samples: recent.length, lastAt: last?.at ?? null, lastSuccess: last?.success ?? null, successes,
    priority: !last ? 0 : !last.success ? 2 : successes >= 3 ? -1 : 0 }
}
/*
 * How much the evidence supports a success rate: a Beta(1+s, 1+f) summary with
 * a ±2 sd band. A product heuristic for "how sure may we sound", not a validated
 * psychometric estimate. Fewer than three observations is never enough to claim
 * anything; a wide band is reported as uncertain rather than rounded to a verdict.
 */
export function evidenceSummary(successes, failures) {
  const s = Math.max(0, successes | 0), f = Math.max(0, failures | 0)
  const a = 1 + s, b = 1 + f, n = s + f
  const mean = a / (a + b)
  const sd = Math.sqrt((a * b) / ((a + b) ** 2 * (a + b + 1)))
  const low = Math.max(0, mean - 2 * sd), high = Math.min(1, mean + 2 * sd)
  return { samples: n, successes: s, mean, low, high,
    status: n < 3 ? 'insufficient' : high - low > 0.5 ? 'uncertain' : 'supported' }
}

/*
 * The method behind the last two later-retrieval probes failed both times: try
 * the other one. Reversible by construction — the next probes judge the switch
 * the same way, and a recovered method is chosen again by the estimates.
 */
function failedTwice(history, dimension) {
  const probes = retentionProbes(history).filter(x => x.prior[dimension] !== undefined).slice(-2)
  if (probes.length < 2 || probes.some(x => x.probe.success)) return null
  return probes[0].prior[dimension] === probes[1].prior[dimension] ? probes[1].prior[dimension] : null
}

export function chooseTeaching(model, capability, candidates, seed = '', dimension = 'format') {
  if (!capability || candidates.length < 2) return null
  const estimates = teachingEstimates(model, capability, candidates, dimension)
  if (!estimates.some(x => x.count >= 3)) {
    // Too little evidence to rank methods. The one thing already worth acting
    // on: the same method failed the last two later-retrieval probes.
    const history = teachingHistory(model?.teachingHistory).filter(x => x.capability === capability)
    const failing = failedTwice(history, dimension)
    if (!failing || !candidates.includes(failing)) return null
    const others = candidates.filter(x => x !== failing)
    return { format: others[seedFrom(String(seed)) % others.length], reason: 'switch_after_failure', failing, estimates }
  }
  const n = seedFrom(String(seed))
  // Exploration remains reachable even after strong early evidence.
  if (n % 5 === 0) return { format: candidates[Math.floor(n / 5) % candidates.length], reason: 'exploration', estimates }
  const ranked = [...estimates].sort((a, b) => b.retention - a.retention || b.transfer - a.transfer || a.count - b.count)
  return { format: ranked[0].format, reason: 'later-independent-retrieval', estimates }
}

/*
 * What has actually been demonstrated for one capability, per skill.
 *
 * Only independent first attempts count, and only one per learning-day (the
 * same retention probes the estimates use). Written work and listening are
 * kept apart: reading a sentence correctly says nothing about hearing it.
 * Speaking and pronunciation are never assessed by this app (no microphone),
 * so they are reported as `not_assessed`, never inferred from text.
 * `delayed` counts successes in a later session than the first practice;
 * `transfer` those in a context never used before for this capability.
 */
export function skillEvidence(model, capability, atMs = Date.now()) {
  const history = teachingHistory(model?.teachingHistory).filter(x => x.capability === capability && x.at <= atMs)
  const probes = retentionProbes(history)
  const skillOf = x => (x.channel === 'listening' || x.listening ? 'listening' : 'written')
  const out = {}
  for (const skill of ['written', 'listening']) {
    const own = probes.filter(x => skillOf(x.probe) === skill)
    const ok = own.filter(x => x.probe.success)
    let transfer = 0
    for (const { probe, index } of own) {
      const earlier = history.slice(0, index)
      if (probe.success && probe.context && !earlier.some(x => x.context === probe.context)) transfer++
    }
    out[skill] = { ...evidenceSummary(ok.length, own.length - ok.length), delayed: ok.length, transfer }
  }
  out.speaking = { status: 'not_assessed' }
  out.pronunciation = { status: 'not_assessed' }
  return out
}
