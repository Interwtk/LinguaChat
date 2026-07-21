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

/* ---- Episode 4: ask how someone is ---- */
const ASK_WELLBEING = /\b(how are you( doing| today)?|how'?re you|how are things|how'?s it going)\b/
// "How you?" / "how you doing" — intent is clear, the auxiliary is missing.
const WELLBEING_NO_AUX = /\bhow (you|u)\b/

export function evaluateAskWellbeing(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = 'How are you?'
  if (!n) return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep4RetryPromptEmpty' }
  if (ASK_WELLBEING.test(n)) {
    r.completedObjective = true
    r.confidence = 0.95
    r.acceptedVariant = !/^how are you$/.test(n)
    r.praiseKey = r.masteryEvidence.independent ? 'ep4PraiseIndependent' : 'ep4PraiseAsked'
    return r
  }
  if (WELLBEING_NO_AUX.test(n)) {
    // understood, but the auxiliary "are" is missing — one priority correction
    return { ...r, errorType: 'missing_auxiliary', priorityCorrection: 'ep4RetryExplainAux', explanation: 'ep4RetryExplainAux', retryRequired: true, retryPrompt: 'ep4RetryPromptAux' }
  }
  return { ...r, errorType: 'no_question', conclusive: wordCount(n) < 4, confidence: wordCount(n) < 4 ? 0.85 : 0.5, priorityCorrection: 'ep4RetryExplainAsk', explanation: 'ep4RetryExplainAsk', retryRequired: true, retryPrompt: 'ep4RetryPromptAsk' }
}

/* ---- Episode 4: answer how you are ---- */
// Any of these feelings is a valid answer — a feeling is never "wrong".
const FEELING = /\b(good|fine|okay|ok|great|well|tired|happy|sleepy|so so|not bad|alright)\b/
const WELLBEING_FULL = /\b(i'?m|i am)\b/

export function evaluateAnswerWellbeing(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = "I'm good."
  if (!n) return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep4RetryPromptEmpty' }
  const feeling = FEELING.test(n)
  const full = WELLBEING_FULL.test(n)
  // "Good, thanks." / "Fine, thank you." are natural complete answers too.
  const politeShort = feeling && /\b(thanks|thank you)\b/.test(n)
  if (feeling && (full || politeShort)) {
    r.completedObjective = true
    r.confidence = 0.95
    r.acceptedVariant = !/^i'?m good$/.test(n)
    r.praiseKey = r.masteryEvidence.independent ? 'ep4PraiseIndependent' : 'ep4PraiseAnswered'
    return r
  }
  if (feeling) {
    // partial evidence: the feeling is understood, the structure is missing
    return { ...r, errorType: 'missing_copula', priorityCorrection: 'ep4RetryExplainIm', explanation: 'ep4RetryExplainIm', retryRequired: true, retryPrompt: 'ep4RetryPromptIm' }
  }
  return { ...r, errorType: 'no_answer', conclusive: wordCount(n) < 3, confidence: wordCount(n) < 3 ? 0.85 : 0.5, priorityCorrection: 'ep4RetryExplainIm', explanation: 'ep4RetryExplainIm', retryRequired: true, retryPrompt: 'ep4RetryPromptIm' }
}

/* ---- Episodes 4 & 5: bounce the question back ---- */
const RECIPROCAL_Q = /\b(and you|what about you|how about you|and yourself|and your ?self)\b\??/

export function evaluateReciprocalQuestion(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = 'And you?'
  if (!n) return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep4RetryPromptEmpty' }
  if (RECIPROCAL_Q.test(n)) {
    r.completedObjective = true
    r.confidence = 0.95
    r.acceptedVariant = !/^and you$/.test(n)
    r.praiseKey = r.masteryEvidence.independent ? 'ep4PraiseIndependent' : 'ep4PraiseBounce'
    return r
  }
  return { ...r, errorType: 'no_question', conclusive: wordCount(n) < 4, confidence: wordCount(n) < 4 ? 0.85 : 0.5, priorityCorrection: 'ep4RetryExplainBounce', explanation: 'ep4RetryExplainBounce', retryRequired: true, retryPrompt: 'ep4RetryPromptBounce' }
}

/* ---- Episode 5: ask where someone is from ---- */
const ASK_ORIGIN = /\b((and )?where are you from|what country are you from|where do you come from|where are you from)\b/
const ORIGIN_NO_AUX = /\bwhere (you|u) from\b/

export function evaluateAskOrigin(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = 'Where are you from?'
  if (!n) return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep5RetryPromptEmpty' }
  if (ASK_ORIGIN.test(n)) {
    r.completedObjective = true
    r.confidence = 0.95
    r.acceptedVariant = !/^where are you from$/.test(n)
    r.praiseKey = r.masteryEvidence.independent ? 'ep5PraiseIndependent' : 'ep5PraiseAsked'
    return r
  }
  if (ORIGIN_NO_AUX.test(n)) {
    // "Where you from?" — intent recognised, only the auxiliary is missing
    return { ...r, errorType: 'missing_auxiliary', priorityCorrection: 'ep5RetryExplainAux', explanation: 'ep5RetryExplainAux', retryRequired: true, retryPrompt: 'ep5RetryPromptAux' }
  }
  return { ...r, errorType: 'no_question', conclusive: wordCount(n) < 4, confidence: wordCount(n) < 4 ? 0.85 : 0.5, priorityCorrection: 'ep5RetryExplainAsk', explanation: 'ep5RetryExplainAsk', retryRequired: true, retryPrompt: 'ep5RetryPromptAsk' }
}

/* ---- Episode 5: say where you are from ----
 * The place is never judged geographically: any country, city or region the
 * learner names is accepted. Only the English structure is taught.
 */
const FROM_PLACE = /\bfrom\s+\p{L}[\p{L}\s'.-]*/u

export function evaluateAnswerOrigin(text, { independent = false, place = '' } = {}) {
  const n = normalize(text)
  const natural = `I'm from ${String(place || '').trim() || 'Colombia'}.`
  const r = base(independent)
  r.naturalVersion = natural
  if (!n) return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep5RetryPromptEmpty' }
  const copula = /\b(i'?m|i am)\b/.test(n)
  const fromPlace = FROM_PLACE.test(n)
  if (copula && fromPlace) {
    r.completedObjective = true
    r.confidence = 0.96
    r.acceptedVariant = !/^i'?m from /.test(n)
    r.praiseKey = r.masteryEvidence.independent ? 'ep5PraiseIndependent' : 'ep5PraiseAnswered'
    return r
  }
  if (fromPlace && !copula) {
    return { ...r, errorType: 'missing_copula', priorityCorrection: 'ep5RetryExplainIm', explanation: 'ep5RetryExplainIm', retryRequired: true, retryPrompt: 'ep5RetryPromptIm' }
  }
  // A bare place name is understood but incomplete: partial evidence, ask for
  // the full structure rather than calling it wrong.
  if (/\p{L}/u.test(n) && wordCount(n) <= 3) {
    return { ...r, errorType: 'missing_from', priorityCorrection: 'ep5RetryExplainFrom', explanation: 'ep5RetryExplainFrom', retryRequired: true, retryPrompt: 'ep5RetryPromptFrom' }
  }
  return { ...r, errorType: 'no_answer', conclusive: false, confidence: 0.5, priorityCorrection: 'ep5RetryExplainFrom', explanation: 'ep5RetryExplainFrom', retryRequired: true, retryPrompt: 'ep5RetryPromptFrom' }
}

/* ---- Episode 6: a combined opening turn (greet + introduce, plus one more) ---- */
export function evaluateFullIntroConversation(text, { name = 'Alex', independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = `Hi, I'm ${String(name).trim() || 'Alex'}. How are you?`
  if (!n) return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep6RetryPromptEmpty' }
  const intro = evaluateIntroduction(text, { name, independent })
  const extra = ASK_WELLBEING.test(n) || ASK_ORIGIN.test(n) || ASK_NAME.test(n) || NICE.test(n)
  if (intro.completedObjective && extra) {
    r.completedObjective = true
    r.confidence = 0.94
    r.acceptedVariant = true
    r.praiseKey = r.masteryEvidence.independent ? 'ep6PraiseIndependent' : 'ep6PraiseCombined'
    return r
  }
  if (intro.completedObjective) {
    // introduced correctly but did not carry the conversation forward
    return { ...r, errorType: 'incomplete_turn', priorityCorrection: 'ep6RetryExplainMore', explanation: 'ep6RetryExplainMore', retryRequired: true, retryPrompt: 'ep6RetryPromptMore' }
  }
  return { ...r, errorType: intro.errorType, conclusive: intro.conclusive, confidence: intro.confidence, priorityCorrection: intro.priorityCorrection, explanation: intro.explanation, retryRequired: true, retryPrompt: intro.retryPrompt }
}

// Dispatcher used by the engine for free_reply / roleplay steps.
export function evaluateFree(kind, text, ctx = {}) {
  switch (kind) {
    case 'introduction': return evaluateIntroduction(text, ctx)
    case 'ask_name': return evaluateAskName(text, ctx)
    case 'nice_to_meet': return evaluateNiceToMeet(text, ctx)
    case 'ask_wellbeing': return evaluateAskWellbeing(text, ctx)
    case 'answer_wellbeing': return evaluateAnswerWellbeing(text, ctx)
    case 'reciprocal_question': return evaluateReciprocalQuestion(text, ctx)
    case 'ask_origin': return evaluateAskOrigin(text, ctx)
    case 'answer_origin': return evaluateAnswerOrigin(text, ctx)
    case 'full_intro_conversation': return evaluateFullIntroConversation(text, ctx)
    default: return { ...base(ctx.independent), understood: false, conclusive: true, retryRequired: true }
  }
}

// Whether the hybrid router should consider escalating this verdict to Lingua.
export function shouldEscalate(result) {
  return Boolean(result) && result.completedObjective === false && result.conclusive === false
}
