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

/*
 * Where the roleplay partner is from. Derived from the partner name so it is
 * stable per learner and varied across learners — and so no single country is
 * ever hardcoded as "the" answer. This is the PARTNER's place only; the
 * learner's own place is always supplied by the learner.
 */
const PARTNER_PLACES = ['Canada', 'Ireland', 'Kenya', 'Japan', 'Brazil', 'Spain', 'India', 'Mexico']

export function placeFor(partnerName) {
  return PARTNER_PLACES[seedFrom(partnerName) % PARTNER_PLACES.length]
}

export const PARTNER_NAMES = PARTNERS
export const PARTNER_PLACE_NAMES = PARTNER_PLACES
