/*
 * responseEvaluation — deterministic (Level 1) evaluation of learner free replies.
 *
 * Returns a consistent contract the UI never shows raw:
 *   {
 *     source: 'deterministic',
 *     understood, completedObjective, acceptedVariant, confidence, conclusive,
 *     errorType, priorityCorrection (key), explanation (key), naturalVersion,
 *     retryRequired, retryPrompt (key), praiseKey,
 *     masteryEvidence: { independent, scaffoldUsed }
 *   }
 *
 * `conclusive` tells the hybrid router whether this local verdict is trustworthy
 * on its own. Clear accepts and clear failures are conclusive; a non-empty reply
 * that looks like a genuine but unrecognized attempt is NOT conclusive, so the
 * router may escalate it to Lingua (Level 2). When no remote is available the
 * deterministic verdict is still used as a safe, conservative fallback (Level 3).
 */

// Normalize: lowercase, unify apostrophes, drop emojis/symbols, keep letters
// (incl. accents) + digits + spaces + apostrophes, collapse spaces.
export function normalize(text) {
  return String(text || '')
    .replace(/[’‘‛`´]/g, "'")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}'\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Accent-fold for lenient name matching (é -> e).
const DIACRITICS = /[̀-ͯ]/g
export function fold(text) {
  return String(text || '').normalize('NFD').replace(DIACRITICS, '').toLowerCase()
}

const wordCount = (n) => (n ? n.split(' ').filter(Boolean).length : 0)

const GREETING = /\b(hi|hello|hey|hey there|good morning|good afternoon|good evening)\b/
const GREETING_G = /\b(hi|hello|hey|there|good morning|good afternoon|good evening)\b/g
// Copula / self-naming patterns accepted for a Pre-A1 introduction.
const INTRO = /\b(i'?m called|i'?m|i am called|i am|my name'?s|my name is|name'?s|name is|(?:you can |they |people |everyone |friends )?call me|i go by|go by)\b/
const INTRO_G = /\b(i'?m called|i'?m|i am called|i am|my name'?s|my name is|name'?s|name is|call me|i go by|go by|you can|they|people|everyone|friends)\b/g
// Ask-name question forms (incl. politely prefixed variants).
const ASK_NAME = /\b((and )?(what'?s|what is) your name|(may|can) i ask (for )?your name|and your name)\b/
const NICE = /\bnice (to meet|meeting) you\b/
// Short reciprocal closings — only valid as a REPLY to "nice to meet you".
const RECIPROCAL = /^(you too|same|same here|likewise|and you)\.?!?$/

function hasNameToken(normalized, name) {
  const rest = normalized.replace(GREETING_G, ' ').replace(INTRO_G, ' ').replace(/\s+/g, ' ').trim()
  if (rest && /\p{L}/u.test(rest)) return true
  if (name && fold(normalized).includes(fold(String(name).trim())) && fold(name).trim()) return true
  return false
}

const base = (independent) => ({
  source: 'deterministic',
  understood: true,
  completedObjective: false,
  acceptedVariant: false,
  confidence: 0.9,
  conclusive: true,
  errorType: null,
  priorityCorrection: null,
  explanation: null,
  naturalVersion: null,
  retryRequired: false,
  retryPrompt: null,
  praiseKey: null,
  masteryEvidence: { independent: Boolean(independent), scaffoldUsed: !independent },
})

/* ---- Episode 1 & 3: introduce yourself ---- */
export function evaluateIntroduction(text, { name = 'Alex', independent = false } = {}) {
  const n = normalize(text)
  const natural = `Hi, I'm ${String(name).trim() || 'Alex'}.`
  const r = base(independent)
  r.naturalVersion = natural
  if (!n) {
    return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep1RetryPromptEmpty' }
  }
  const greeting = GREETING.test(n)
  const copula = INTRO.test(n)
  const nameOk = hasNameToken(n, name)

  if (copula && nameOk) {
    r.completedObjective = true
    r.confidence = 0.96
    r.acceptedVariant = !(greeting && /i'?m|i am|my name is/.test(n))
    // specific, non-repetitive praise
    if (r.masteryEvidence.independent) r.praiseKey = 'ep1PraiseIndependent'
    else if (!greeting) r.praiseKey = 'ep1PraiseIm'
    else r.praiseKey = 'ep1PraiseGreetAndName'
    return r
  }
  // A non-empty reply that carries a name plus extra, unrecognized wording (e.g.
  // "Sebastián here", "I'm known as Sam") is a plausible attempt we cannot
  // confirm locally → mark non-conclusive so the router may consult Lingua.
  const words = wordCount(n)
  const looksLikeAttempt = nameOk && !copula && (/\b(here|known|goes|goes by)\b/.test(n) || words >= 3)

  if (!copula && nameOk) {
    return { ...r, errorType: 'missing_copula', confidence: looksLikeAttempt ? 0.5 : 0.85, conclusive: !looksLikeAttempt, priorityCorrection: 'ep1RetryExplainIm', explanation: 'ep1RetryExplainIm', retryRequired: true, retryPrompt: 'ep1RetryPromptIm' }
  }
  if (copula && !nameOk) {
    return { ...r, errorType: 'missing_name', priorityCorrection: 'ep1RetryExplainName', explanation: 'ep1RetryExplainName', retryRequired: true, retryPrompt: 'ep1RetryPromptName' }
  }
  if (greeting) {
    return { ...r, errorType: 'greeting_only', priorityCorrection: 'ep1RetryExplainName', explanation: 'ep1RetryExplainName', retryRequired: true, retryPrompt: 'ep1RetryPromptName' }
  }
  return { ...r, errorType: 'no_intro', confidence: words >= 3 ? 0.5 : 0.8, conclusive: words < 3, priorityCorrection: 'ep1RetryExplainIm', explanation: 'ep1RetryExplainIm', retryRequired: true, retryPrompt: 'ep1RetryPromptIm' }
}

/* ---- Episode 2: ask someone's name ---- */
export function evaluateAskName(text, { independent = false } = {}) {
  const n = normalize(text)
  const natural = "What's your name?"
  const r = base(independent)
  r.naturalVersion = natural
  if (!n) return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep2RetryPromptEmpty' }
  if (ASK_NAME.test(n)) {
    r.completedObjective = true
    r.confidence = 0.95
    // a politely-prefixed question is a natural (slightly formal) variant
    r.acceptedVariant = !/^what'?s your name$/.test(n)
    r.praiseKey = r.masteryEvidence.independent ? 'ep2PraiseIndependent' : 'ep2PraiseAsked'
    return r
  }
  // has "name" but not the question form
  if (/\bname\b/.test(n)) {
    return { ...r, errorType: 'question_order', priorityCorrection: 'ep2RetryExplain', explanation: 'ep2RetryExplain', retryRequired: true, retryPrompt: 'ep2RetryPrompt' }
  }
  return { ...r, errorType: 'no_question', conclusive: wordCount(n) < 4, confidence: wordCount(n) < 4 ? 0.85 : 0.5, priorityCorrection: 'ep2RetryExplain', explanation: 'ep2RetryExplain', retryRequired: true, retryPrompt: 'ep2RetryPrompt' }
}

/* ---- Episode 3: close naturally with "nice to meet you" ---- */
export function evaluateNiceToMeet(text, { independent = false, turnContext = null } = {}) {
  const n = normalize(text)
  const natural = 'Nice to meet you.'
  const r = base(independent)
  r.naturalVersion = natural
  const linguaSaid = normalize(turnContext && turnContext.linguaSaid)
  const asResponse = /nice (to meet|meeting) you/.test(linguaSaid)
  if (!n) return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep3RetryPromptEmpty' }
  if (NICE.test(n)) {
    r.completedObjective = true
    r.confidence = 0.95
    r.acceptedVariant = /too\b/.test(n) || /meeting you/.test(n)
    r.praiseKey = r.masteryEvidence.independent ? 'ep3PraiseIndependent' : 'ep3PraiseClose'
    return r
  }
  // "You too" / "likewise" close the exchange only when replying to the phrase.
  if (RECIPROCAL.test(n)) {
    if (asResponse) {
      r.completedObjective = true
      r.confidence = 0.9
      r.acceptedVariant = true
      r.praiseKey = r.masteryEvidence.independent ? 'ep3PraiseIndependent' : 'ep3PraiseClose'
      return r
    }
    // said as an opener — not a valid close on its own
    return { ...r, errorType: 'missing_close', priorityCorrection: 'ep3RetryExplain', explanation: 'ep3RetryExplain', retryRequired: true, retryPrompt: 'ep3RetryPrompt' }
  }
  return { ...r, errorType: 'missing_close', conclusive: wordCount(n) < 3, confidence: wordCount(n) < 3 ? 0.85 : 0.5, priorityCorrection: 'ep3RetryExplain', explanation: 'ep3RetryExplain', retryRequired: true, retryPrompt: 'ep3RetryPrompt' }
}

// Dispatcher used by the engine for free_reply / roleplay steps.
export function evaluateFree(kind, text, ctx = {}) {
  switch (kind) {
    case 'introduction': return evaluateIntroduction(text, ctx)
    case 'ask_name': return evaluateAskName(text, ctx)
    case 'nice_to_meet': return evaluateNiceToMeet(text, ctx)
    default: return { ...base(ctx.independent), understood: false, conclusive: true, retryRequired: true }
  }
}

// Whether the hybrid router should consider escalating this verdict to Lingua.
export function shouldEscalate(result) {
  return Boolean(result) && result.completedObjective === false && result.conclusive === false
}
