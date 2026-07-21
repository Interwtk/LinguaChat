/*
 * responseEvaluation — deterministic (Level 1) evaluation of learner free replies.
 *
 * Returns a consistent contract the UI never shows raw:
 *   {
 *     understood, completedObjective, acceptedVariant,
 *     errorType, priorityCorrection (key), explanation (key), naturalVersion,
 *     retryRequired, retryPrompt (key), praiseKey,
 *     masteryEvidence: { independent, scaffoldUsed }
 *   }
 *
 * Level 2 (backend/Lingua) can override for ambiguous free replies; Level 3 is
 * this deterministic evaluator as a safe fallback when OpenAI is unavailable.
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

const GREETING = /\b(hi|hello|hey|good morning|good afternoon|good evening)\b/
const GREETING_G = /\b(hi|hello|hey|good morning|good afternoon|good evening)\b/g
const INTRO = /\b(i'm|im|i am|my name is|name is|i am called)\b/
const INTRO_G = /\b(i'm|im|i am|my name is|name is|i am called)\b/g
const ASK_NAME = /\b(what'?s your name|what is your name|whats your name)\b/
const NICE = /\bnice to meet you\b/

function hasNameToken(normalized, name) {
  const rest = normalized.replace(GREETING_G, ' ').replace(INTRO_G, ' ').replace(/\s+/g, ' ').trim()
  if (rest && /\p{L}/u.test(rest)) return true
  if (name && fold(normalized).includes(fold(String(name).trim())) && fold(name).trim()) return true
  return false
}

const base = (independent) => ({
  understood: true,
  completedObjective: false,
  acceptedVariant: false,
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
    return { ...r, understood: false, errorType: 'empty', retryRequired: true, retryPrompt: 'ep1RetryPromptEmpty' }
  }
  const greeting = GREETING.test(n)
  const copula = INTRO.test(n)
  const nameOk = hasNameToken(n, name)

  if (copula && nameOk) {
    r.completedObjective = true
    r.acceptedVariant = !(greeting && /i'?m|i am|my name is/.test(n))
    // specific, non-repetitive praise
    if (r.masteryEvidence.independent) r.praiseKey = 'ep1PraiseIndependent'
    else if (!greeting) r.praiseKey = 'ep1PraiseIm'
    else r.praiseKey = 'ep1PraiseGreetAndName'
    return r
  }
  if (!copula && nameOk) {
    return { ...r, errorType: 'missing_copula', priorityCorrection: 'ep1RetryExplainIm', explanation: 'ep1RetryExplainIm', retryRequired: true, retryPrompt: 'ep1RetryPromptIm' }
  }
  if (copula && !nameOk) {
    return { ...r, errorType: 'missing_name', priorityCorrection: 'ep1RetryExplainName', explanation: 'ep1RetryExplainName', retryRequired: true, retryPrompt: 'ep1RetryPromptName' }
  }
  if (greeting) {
    return { ...r, errorType: 'greeting_only', priorityCorrection: 'ep1RetryExplainName', explanation: 'ep1RetryExplainName', retryRequired: true, retryPrompt: 'ep1RetryPromptName' }
  }
  return { ...r, errorType: 'no_intro', priorityCorrection: 'ep1RetryExplainIm', explanation: 'ep1RetryExplainIm', retryRequired: true, retryPrompt: 'ep1RetryPromptIm' }
}

/* ---- Episode 2: ask someone's name ---- */
export function evaluateAskName(text, { independent = false } = {}) {
  const n = normalize(text)
  const natural = "What's your name?"
  const r = base(independent)
  r.naturalVersion = natural
  if (!n) return { ...r, understood: false, errorType: 'empty', retryRequired: true, retryPrompt: 'ep2RetryPromptEmpty' }
  if (ASK_NAME.test(n)) {
    r.completedObjective = true
    r.praiseKey = r.masteryEvidence.independent ? 'ep2PraiseIndependent' : 'ep2PraiseAsked'
    return r
  }
  // has "name" but not the question form
  if (/\bname\b/.test(n)) {
    return { ...r, errorType: 'question_order', priorityCorrection: 'ep2RetryExplain', explanation: 'ep2RetryExplain', retryRequired: true, retryPrompt: 'ep2RetryPrompt' }
  }
  return { ...r, errorType: 'no_question', priorityCorrection: 'ep2RetryExplain', explanation: 'ep2RetryExplain', retryRequired: true, retryPrompt: 'ep2RetryPrompt' }
}

/* ---- Episode 3: close naturally with "nice to meet you" ---- */
export function evaluateNiceToMeet(text, { independent = false } = {}) {
  const n = normalize(text)
  const natural = 'Nice to meet you.'
  const r = base(independent)
  r.naturalVersion = natural
  if (!n) return { ...r, understood: false, errorType: 'empty', retryRequired: true, retryPrompt: 'ep3RetryPromptEmpty' }
  if (NICE.test(n)) {
    r.completedObjective = true
    r.acceptedVariant = /too\b/.test(n)
    r.praiseKey = r.masteryEvidence.independent ? 'ep3PraiseIndependent' : 'ep3PraiseClose'
    return r
  }
  return { ...r, errorType: 'missing_close', priorityCorrection: 'ep3RetryExplain', explanation: 'ep3RetryExplain', retryRequired: true, retryPrompt: 'ep3RetryPrompt' }
}

// Dispatcher used by the engine for free_reply / roleplay steps.
export function evaluateFree(kind, text, ctx = {}) {
  switch (kind) {
    case 'introduction': return evaluateIntroduction(text, ctx)
    case 'ask_name': return evaluateAskName(text, ctx)
    case 'nice_to_meet': return evaluateNiceToMeet(text, ctx)
    default: return { ...base(ctx.independent), understood: false, retryRequired: true }
  }
}
