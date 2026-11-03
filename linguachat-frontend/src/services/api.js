import { translate } from '../i18n/translations'
import { safeAnalysis } from './chatAnalysis.js'

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '/api')
const VALID_MODES = new Set(['chat', 'translation', 'correction'])

/*
 * When the tutor service cannot be reached, Lingua says so and checks nothing.
 * The old offline fallback answered in Spanish for every learner and called
 * unchecked sentences "correct": no claim about the learner's English may be
 * made without an evaluation behind it. The notice is in the learner's language.
 */
const OFFLINE_REPLY = "I can't reach my tutor service right now, so I can't check that sentence. Please try again in a moment."

function randomDelay(min = 1200, max = 2200) {
  return new Promise(r => setTimeout(r, min + Math.random() * (max - min)))
}

/* ─── Public API ─── */
export function normalizeChatResponse(payload) {
  const data = typeof payload === 'string' ? { reply: payload } : (payload || {})
  const inferredMode = data.translation
    ? 'translation'
    : data.correction
      ? 'correction'
      : 'chat'
  const normalizedMode = VALID_MODES.has(data.mode) ? data.mode : inferredMode
  const translatedReply = data.translation
    ? `${data.message || "Here's that in English:"} ${data.translation}`
    : null

  return {
    reply: String(data.reply ?? data.response ?? translatedReply ?? data.message ?? 'Tell me more.'),
    correction: data.correction ?? null,
    explanation: data.explanation ?? data.why ?? null,
    suggestion: data.suggestion ?? null,
    mode: normalizedMode,
    learning_action: data.learning_action && data.learning_action.prompt
      ? {
          type: data.learning_action.type || 'answer_question',
          prompt: String(data.learning_action.prompt),
          options: Array.isArray(data.learning_action.options) ? data.learning_action.options : null,
          expected: data.learning_action.expected ?? null,
        }
      : null,
    focus: data.focus ?? null,
    word_to_use: data.word_to_use ?? null,
    detected_language: data.detected_language ?? null,
    target_language: data.target_language ?? null,
    mission_feedback: data.mission_feedback ?? null,
    analysis: safeAnalysis(data.analysis, data.evaluation),
  }
}

export async function sendChatMessage({
  message,
  level,
  mode,
  history,
  sessionId,
  preferences,
  nativeLanguage = null,
  interfaceLanguage = null,
  targetLanguage = null,
  missionContext = null,
  tutorPreferences = null,
  activeCompanion = 'lingua',
  // At most one short thing the learner mentioned before ("music"). Never the
  // profile, never the history, never anything the model has inferred.
  rememberedLike = null,
  /*
   * The ONE topic this conversation is about, already chosen locally:
   * { topic: 'gaming', topic_facet: 'game worlds' }. The provider is not asked
   * which of the learner's interests to use, is not told how many there are, and
   * is not told why this one won — the selection happened before the request.
   */
  topicContext = null,
  /*
   * P3: what this device remembers across days about rules Lingua corrected
   * (chatEvidence.learningMemoryPayload): rule ids, a status, verbs already
   * practised. Never sentences; the server validates and ignores the rest.
   */
  learningMemory = null,
  /*
   * P5: how the learner produced this message — 'suggestion_sent' when they
   * sent a suggestion Lingua offered. It can only lower what the turn is worth.
   */
  assistance = 'none',
}) {
  try {
    /*
     * How the learner likes to be taught travels; WHAT they like to talk about
     * does not. The interests used to ride along in full — twenty ids in every
     * request, for a prompt that can only use one — so they are stripped here and
     * replaced by the single chosen topic below.
     */
    const { interests: _droppedInterests, ...teachingPreferences } = tutorPreferences || {}
    const optionalContext = {
      ...(rememberedLike ? { remembered_like: rememberedLike } : {}),
      ...(topicContext || {}),
    }
    const res = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        level,
        mode,
        history,
        session_id: sessionId,
        preferences,
        native_language: nativeLanguage,
        interface_language: interfaceLanguage,
        target_language: targetLanguage,
        mission_context: missionContext,
        tutor_preferences: tutorPreferences ? teachingPreferences : null,
        active_companion: activeCompanion,
        ...(Array.isArray(learningMemory) && learningMemory.length ? { learning_memory: learningMemory } : {}),
        ...(assistance && assistance !== 'none' ? { assistance } : {}),
        ...(Object.keys(optionalContext).length ? { optional_context: optionalContext } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    })

    const payload = await res.json().catch(() => null)
    if (!res.ok) throw new Error(payload?.reply || `Backend error ${res.status}`)
    const provider = res.headers.get('X-LinguaChat-Provider') || 'unknown'

    return {
      ...normalizeChatResponse(payload),
      provider,
      isFallback: false,
      connectionMessage: null,
    }
  } catch {
    await randomDelay(450, 850)
    return {
      ...normalizeChatResponse({ reply: OFFLINE_REPLY, mode: 'chat' }),
      isFallback: true,
      connectionMessage: translate(interfaceLanguage?.base || nativeLanguage?.base || 'en', 'chatOfflineNotice'),
    }
  }
}

/*
 * Ask the server to erase what it remembers of these conversations now (the
 * last turns of each practice chat; it also forgets them by itself 24 hours
 * after the last message). True only when the server confirmed.
 */
export async function forgetServerConversations(sessionIds, { timeoutMs = 6000 } = {}) {
  const ids = (sessionIds || []).filter(id => typeof id === 'string' && id.trim()).slice(0, 4)
  if (!ids.length) return true
  try {
    const res = await fetch(`${API_URL}/chat/forget`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_ids: ids }),
      signal: AbortSignal.timeout(timeoutMs),
    })
    return res.ok
  } catch {
    return false
  }
}

/*
 * Remote evaluator for LinguaLoop free replies (Level 2 of the hybrid pipeline).
 *
 * Isolated from /chat: posts to /learning/evaluate and returns the parsed JSON,
 * or null on ANY problem (network error, timeout, non-2xx, unparseable body).
 * A null makes the hybrid router fall back to the local verdict, so a missing or
 * broken backend never blocks an episode. Honours an external AbortSignal (e.g.
 * the learner navigated away or advanced) in addition to its own timeout.
 */
export async function evaluateLearningResponse(payload, { signal, timeoutMs = 6000 } = {}) {
  const controller = new AbortController()
  const onAbort = () => controller.abort()
  const timer = setTimeout(onAbort, timeoutMs)
  if (signal) {
    if (signal.aborted) { clearTimeout(timer); return null }
    signal.addEventListener('abort', onAbort)
  }
  try {
    const res = await fetch(`${API_URL}/learning/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    if (!res.ok) return null
    return await res.json().catch(() => null)
  } catch {
    return null
  } finally {
    clearTimeout(timer)
    if (signal) signal.removeEventListener('abort', onAbort)
  }
}
