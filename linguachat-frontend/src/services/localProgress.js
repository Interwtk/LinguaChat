const STORAGE_KEYS = {
  sessionId: 'lc2-session-id',
  messages: 'lc2-chat-messages',
  progress: 'lc2-local-progress',
}

const EMPTY_PROGRESS = {
  version: 1,
  startedAt: null,
  lastPracticeDate: null,
  streak: 0,
  messagesSent: 0,
  correctionsReceived: 0,
  xp: 0,
  confidence: 45,
  topics: [],
  learnedItems: [],
  sessions: [],
  missionsCompleted: 0,
}

const TOPIC_RULES = [
  ['travel', /\b(travel|trip|city|country|flight|hotel|train)\b/i],
  ['work', /\b(work|job|interview|office|career)\b/i],
  ['food', /\b(food|eat|restaurant|cook|meal)\b/i],
  ['hobbies', /\b(game|music|sport|movie|hobby|play)\b/i],
  ['feelings', /\b(feel|happy|sad|nervous|excited|tired)\b/i],
]

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

function makeId(prefix = 'session') {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID()}`
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function dateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dayDifference(from, to) {
  if (!from || !to) return null
  const start = new Date(`${from}T00:00:00`)
  const end = new Date(`${to}T00:00:00`)
  return Math.round((end - start) / 86400000)
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function inferTopics(message, response) {
  const topics = TOPIC_RULES
    .filter(([, pattern]) => pattern.test(message))
    .map(([topic]) => topic)

  if (response.mode === 'translation') topics.push('translation')
  if (response.correction) topics.push('grammar')
  if (!topics.length) topics.push('conversation')
  return unique(topics)
}

function learnedCandidate(response) {
  if (response.correction) {
    return { phrase: response.correction, kind: 'correction', mastery: 0.55, marker: 'Fix' }
  }
  if (response.mode === 'translation') {
    return { phrase: response.reply.split('(')[0].trim(), kind: 'translation', mastery: 0.45, marker: 'Aa' }
  }
  if (response.suggestion) {
    return { phrase: response.suggestion, kind: 'practice phrase', mastery: 0.35, marker: 'Try' }
  }
  if (response.learning_action?.prompt) {
    return { phrase: response.learning_action.prompt, kind: 'mini goal', mastery: 0.3, marker: 'Go' }
  }
  return null
}

function updateLearnedItems(items, response) {
  const candidate = learnedCandidate(response)
  if (!candidate?.phrase || candidate.phrase.length > 100) return items

  const id = candidate.phrase.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  if (!id) return items

  const now = Date.now()
  const existing = items.find(item => item.id === id)
  const nextItem = existing
    ? {
        ...existing,
        mastery: Math.min(0.95, existing.mastery + 0.08),
        seen: (existing.seen || 1) + 1,
        lastSeenAt: now,
        example: response.suggestion || response.reply,
      }
    : {
        id,
        word: candidate.phrase,
        trans: candidate.kind,
        mastery: candidate.mastery,
        emoji: candidate.marker,
        example: response.suggestion || response.reply,
        addedAt: now,
        lastSeenAt: now,
        seen: 1,
      }

  return [nextItem, ...items.filter(item => item.id !== id)].slice(0, 40)
}

function updateSessions(sessions, userMessage, response, topics, confidence) {
  const today = dateKey()
  const existing = sessions.find(session => session.id === today)
  const correction = response.correction
    ? `${userMessage} -> ${response.correction}`
    : existing?.correction || null

  const updated = {
    id: today,
    date: today,
    topic: topics[0]?.replace(/^./, letter => letter.toUpperCase()) || 'Conversation',
    mood: 'LC',
    moodLabel: 'Practicing',
    confidence: Math.max(5, Math.min(10, Math.round(confidence / 10))),
    messages: (existing?.messages || 0) + 2,
    preview: userMessage.slice(0, 140),
    tags: unique([...(existing?.tags || []), ...topics]).slice(0, 4),
    correction,
  }

  return [updated, ...sessions.filter(session => session.id !== today)].slice(0, 30)
}

export function createSessionId() {
  const id = makeId()
  try { localStorage.setItem(STORAGE_KEYS.sessionId, id) } catch {}
  return id
}

export function getOrCreateSessionId() {
  try {
    return localStorage.getItem(STORAGE_KEYS.sessionId) || createSessionId()
  } catch {
    return makeId()
  }
}

export function loadStoredMessages(welcomeMessage) {
  const messages = readJSON(STORAGE_KEYS.messages, [])
  return Array.isArray(messages) && messages.length ? messages : [welcomeMessage]
}

export function saveStoredMessages(messages) {
  writeJSON(STORAGE_KEYS.messages, messages.slice(-100))
}

export function createEmptyProgress() {
  return { ...EMPTY_PROGRESS, startedAt: Date.now() }
}

export function loadLocalProgress() {
  const saved = readJSON(STORAGE_KEYS.progress, null)
  return saved ? { ...createEmptyProgress(), ...saved } : createEmptyProgress()
}

export function saveLocalProgress(progress) {
  writeJSON(STORAGE_KEYS.progress, progress)
}

export function recordPractice(previous, { userMessage, response }) {
  const today = dateKey()
  const difference = dayDifference(previous.lastPracticeDate, today)
  const streak = difference === 0
    ? previous.streak
    : difference === 1
      ? previous.streak + 1
      : 1
  const messagesSent = previous.messagesSent + 1
  const correctionsReceived = previous.correctionsReceived + (response.correction ? 1 : 0)
  const confidence = Math.min(95, 45 + messagesSent * 2 + correctionsReceived)
  const topics = inferTopics(userMessage, response)

  return {
    ...previous,
    lastPracticeDate: today,
    streak,
    messagesSent,
    correctionsReceived,
    xp: previous.xp + 10 + (response.correction ? 5 : 0),
    confidence,
    topics: unique([...topics, ...previous.topics]).slice(0, 12),
    learnedItems: updateLearnedItems(previous.learnedItems, response),
    sessions: updateSessions(previous.sessions, userMessage, response, topics, confidence),
  }
}

export function recordMissionProgress(previous, { mission, step, earnedXp = 0, completed = false }) {
  const today = dateKey()
  const difference = dayDifference(previous.lastPracticeDate, today)
  const streak = difference === 0
    ? previous.streak
    : difference === 1
      ? previous.streak + 1
      : 1
  const topics = unique([mission?.type?.toLowerCase(), step?.type, ...(previous.topics || [])]).slice(0, 12)
  return {
    ...previous,
    lastPracticeDate: today,
    streak,
    xp: (previous.xp || 0) + earnedXp,
    confidence: Math.min(95, (previous.confidence || 45) + (completed ? 2 : 1)),
    topics,
    missionsCompleted: (previous.missionsCompleted || 0) + (completed ? 1 : 0),
  }
}

export function clearStoredProgress() {
  try {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key))
  } catch {}
}
