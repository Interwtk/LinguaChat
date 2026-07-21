/*
 * variation — small, DETERMINISTIC narrative variety for the existing arc.
 *
 * The roleplay partner the learner meets is chosen from a stable seed (the
 * learner's name), so it is identical on every reload and across a session, yet
 * different learners meet different people. This adds life without new episodes,
 * new vocabulary, or any non-reproducible generation. Partner names only ever
 * appear inside the English target strings, so no localization is involved.
 */
const PARTNERS = ['Alex', 'Sam', 'Maya', 'Leo', 'Mia', 'Noah', 'Emma', 'Kai']

// FNV-1a — a tiny, stable string hash (no Math.random, fully reproducible).
export function seedFrom(str) {
  let h = 2166136261
  const s = String(str || 'guest')
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function partnerFor(seedStr) {
  return PARTNERS[seedFrom(seedStr) % PARTNERS.length]
}

export const PARTNER_NAMES = PARTNERS
