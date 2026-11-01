/*
 * The tutor's report about a turn, reduced to what the learning record may use
 * (P3). The findings' original text — the learner's own words — is dropped
 * here: only rule ids, confidence and the English base form survive.
 */
const RULE_ID = /^[a-z_]{1,40}$/
const BASE = /^[a-z]{1,20}$/
export function safeAnalysis(raw) {
  if (!raw || typeof raw !== 'object') return null
  const findings = (Array.isArray(raw.findings) ? raw.findings : []).slice(0, 6)
    .filter(f => RULE_ID.test(f?.rule || ''))
    .map(f => ({ rule: f.rule, confidence: ['high', 'medium', 'low'].includes(f.confidence) ? f.confidence : 'medium',
      base: BASE.test(f?.facts?.base || '') ? f.facts.base : null }))
  const uses = (Array.isArray(raw.uses) ? raw.uses : []).slice(0, 6)
    .filter(u => RULE_ID.test(u?.rule || '') && BASE.test(u?.form || '') && BASE.test(u?.base || ''))
    .map(u => ({ rule: u.rule, form: u.form, base: u.base }))
  const r = raw.retrieval
  const retrieval = r && RULE_ID.test(r.rule || '') && /^[a-z]{1,20}$/.test(String(r.expected || '').toLowerCase()) && BASE.test(r.base || '')
    ? { rule: r.rule, expected: String(r.expected).toLowerCase(), base: r.base } : null
  return {
    verdict: typeof raw.verdict === 'string' ? raw.verdict : null,
    confidence: typeof raw.confidence === 'string' ? raw.confidence : null,
    strategy: typeof raw.strategy === 'string' ? raw.strategy : null,
    findings, uses, retrieval,
  }
}
