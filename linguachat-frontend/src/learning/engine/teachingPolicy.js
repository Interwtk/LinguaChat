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
/*
 * P5: a method that has STOPPED working. The window of the last twelve later
 * probes kept such a method for about a week (P4 measured it). Now, when a
 * method's most recent CHANGE_RUN later probes — each on a different
 * learning-day — all FAILED, and its earlier probes had mostly succeeded, the
 * estimate follows that run instead of the whole window. One failure never
 * does this; three in a row on three days do. The earlier evidence is not
 * deleted: it stays in `durable` and returns as soon as a success breaks the
 * run. Only failures count as a change: a run of lucky successes for a method
 * that is rarely used would over-credit it (measured in P5, round 3), and a
 * method that works again recovers through its ordinary estimate.
 */
export const CHANGE_RUN = 3
/*
 * A skill's own estimate is pulled toward the all-skills estimate by this many
 * pseudo-observations, so a handful of listening probes cannot overrule a month
 * of evidence by chance; a skill that really differs overcomes it with its own
 * probes (simple shrinkage, P5).
 */
export const SKILL_PRIOR_WEIGHT = 4
const skillOfProbe = x => (x.channel === 'listening' || x.listening ? 'listening' : 'written')

function estimate(samples) {
  const successes = samples.filter(x => x.success).length
  const durable = (1 + successes) / (2 + samples.length)
  let run = 0
  while (run < samples.length && samples[samples.length - 1 - run].success === samples[samples.length - 1].success) run++
  const before = samples.slice(0, samples.length - run)
  const beforeRate = before.length ? before.filter(x => x.success).length / before.length : null
  const changed = samples.at(-1)?.success === false && run >= CHANGE_RUN && before.length >= 2 && beforeRate > 0.5
  const retention = changed ? 1 / (2 + run) : durable
  return { successes, durable, retention, changed }
}

export function teachingEstimates(model, capability, candidates, dimension = 'format', { skill = null } = {}) {
  const pooled = skill ? teachingEstimates(model, capability, candidates, dimension) : null
  const history = teachingHistory(model?.teachingHistory).filter(x => x.capability === capability)
  const outcomes = Object.fromEntries(candidates.map(f => [f, []]))
  for (const { probe, prior, index: i } of retentionProbes(history)) {
    if (!outcomes[prior[dimension]]) continue
    // P5: a skill-specific estimate counts only probes of that skill.
    if (skill && skillOfProbe(probe) !== skill) continue
    // Product window, not a scientific estimate. Older hypotheses can reverse.
    outcomes[prior[dimension]].push({ success: probe.success, transfer: history.length < 80
      && Boolean(probe.context) && prior.context !== probe.context
      && !history.slice(0, i).some(x => x.context === probe.context) })
  }
  return candidates.map(format => {
    const samples = outcomes[format].slice(-12)
    const { successes, durable: own, retention: run, changed } = estimate(samples)
    const prior = pooled?.find(x => x.format === format)
    // the same Beta(1, 1) start as `own`, plus the all-skills estimate as K pseudo-observations
    const durable = prior ? (1 + successes + SKILL_PRIOR_WEIGHT * prior.retention) / (2 + samples.length + SKILL_PRIOR_WEIGHT) : own
    // a persistent change in this skill's own probes speaks for itself
    const retention = changed ? run : durable
    return { format, count: samples.length, retention, durable, changed,
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

/*
 * @param options.skill  'written' | 'listening': rank by that skill's own later
 *                       probes when it has enough of them (P5) — a method can
 *                       help one skill and not the other. Otherwise all skills
 *                       together, as before.
 */
export function chooseTeaching(model, capability, candidates, seed = '', dimension = 'format', { skill = null } = {}) {
  if (!capability || candidates.length < 2) return null
  const own = skill ? teachingEstimates(model, capability, candidates, dimension, { skill }) : null
  const estimates = own?.some(x => x.count >= 3) ? own : teachingEstimates(model, capability, candidates, dimension)
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
  const ranked = [...estimates].sort((a, b) => b.retention - a.retention || b.durable - a.durable
    || b.transfer - a.transfer || a.count - b.count)
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
