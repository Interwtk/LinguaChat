/*
 * What the conversation archive may show: the learner's own practice days.
 *
 * Source: `progress.sessions`, the per-day summaries the progress ledger folds
 * from real chat turns (one per learning day, newest first, at most 30). They
 * already live in the account's namespace, merge across tabs, and disappear
 * with a reset — so the archive inherits all of that instead of keeping a
 * second store.
 *
 * Until P3 the screen showed six invented conversations (London, a job
 * interview, …) to anyone without sessions, plus a mood, a "+N pts" score and
 * a confidence figure for each day. Mood and score were never measured; they
 * are not read here. Nothing is generated: titles are the topic ids the
 * ledger inferred by keyword, shown through i18n, and the text lines are the
 * learner's own last message and correction of that day, exactly as stored.
 * No transcript of a conversation is kept or shown.
 */
const TOPIC_KEYS = {
  travel: 'topicTravel',
  work: 'topicWork',
  food: 'topicFood',
  hobbies: 'topicHobbies',
  feelings: 'topicFeelings',
  translation: 'topicTranslation',
  grammar: 'topicGrammar',
  conversation: 'topicConversation',
}

export const topicKey = (id) => TOPIC_KEYS[id] || null

const DAY = /^\d{4}-\d{2}-\d{2}$/

export function archiveDays(progress) {
  const sessions = Array.isArray(progress?.sessions) ? progress.sessions : []
  const seen = new Set()
  const days = []
  for (const raw of sessions) {
    const day = typeof raw?.date === 'string' && DAY.test(raw.date) ? raw.date : (DAY.test(String(raw?.id)) ? String(raw.id) : null)
    if (!day || seen.has(day)) continue
    seen.add(day)
    const topics = (Array.isArray(raw.tags) ? raw.tags : []).filter(id => TOPIC_KEYS[id])
    const messages = Number(raw.messages)
    days.push({
      day,
      topics: topics.length ? topics : ['conversation'],
      // the ledger counts the learner's line and Lingua's reply: two per turn
      yourMessages: Number.isFinite(messages) && messages > 0 ? Math.max(1, Math.round(messages / 2)) : 0,
      lastLine: typeof raw.preview === 'string' && raw.preview.trim() ? raw.preview.trim() : null,
      correction: typeof raw.correction === 'string' && raw.correction.trim() ? raw.correction.trim() : null,
    })
  }
  return days.sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0))
}

/* The topic present on most days, or null when nothing but plain conversation. */
export function mostPracticedTopic(days) {
  const counts = new Map()
  for (const d of days) for (const id of d.topics) if (id !== 'conversation') counts.set(id, (counts.get(id) || 0) + 1)
  let best = null
  for (const [id, n] of counts) if (!best || n > best.days || (n === best.days && id < best.id)) best = { id, days: n }
  return best
}
