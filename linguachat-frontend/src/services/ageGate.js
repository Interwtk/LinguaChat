/*
 * Age gate — the beta is for adults (docs/legal/age-and-safety-policy.md §A).
 *
 * The question is neutral and asks for a bracket, never a birth date. What is
 * kept is the least that makes the gate work:
 *
 *   - a learner who answers "under 18" gets no account. This browser keeps a
 *     bare timestamp (no answer, no age) for 24 hours, so the same screen is
 *     not offered again at once — that would only invite a different answer;
 *   - an adult's answer is the FACT "declared 18+" with the date: sent with
 *     the sign-up as account metadata, and kept in the account's own namespace
 *     for accounts that existed before the gate (asked once after sign-in).
 *
 * This is a self-declaration. It is not age verification and not, on its own,
 * compliance with COPPA or any other law; the policy says what else applies.
 */
import { learnerStorage } from '../auth/localLease.js'

export const AGE_BRACKETS = ['under_13', '13_17', '18_plus']
export const BLOCK_KEY = 'lc2-age-gate-block'
export const ADULT_KEY = 'lc2-age-confirmed'
export const BLOCK_MS = 24 * 60 * 60 * 1000
export const ADULT_DECLARATION = '18_plus'

export const isAdultBracket = (bracket) => bracket === '18_plus'

/* The sign-up flow's own memory that this visit answered "18 or older". */
let passedThisVisit = false
export const ageGatePassed = () => passedThisVisit
export const resetAgeGateForTests = () => { passedThisVisit = false }

export function isRecentlyBlocked(storage = learnerStorage, now = Date.now()) {
  try {
    const at = Number(storage.getItem(BLOCK_KEY))
    if (!Number.isFinite(at) || at <= 0) return false
    if (now - at < BLOCK_MS) return true
    storage.removeItem(BLOCK_KEY)
  } catch { /* unreadable storage: ask again rather than block */ }
  return false
}

/* Decide one answer. Returns 'continue' or 'blocked'; never stores the age. */
export function answerAgeGate(bracket, storage = learnerStorage, now = Date.now()) {
  if (!AGE_BRACKETS.includes(bracket)) return 'invalid'
  if (isAdultBracket(bracket)) {
    passedThisVisit = true
    return 'continue'
  }
  passedThisVisit = false
  try { storage.setItem(BLOCK_KEY, String(now)) } catch { /* the gate still blocks this visit */ }
  return 'blocked'
}

/*
 * Accounts created before the gate existed, or on another device: confirmed
 * if the account carries the declaration, or this account's namespace does.
 */
export function accountAgeConfirmed(authUser, access) {
  if (authUser?.ageDeclared === true) return true
  try { return String(access?.getItem?.(ADULT_KEY) || '').startsWith(ADULT_DECLARATION) } catch { return false }
}

export function confirmAccountAdult(access, now = Date.now()) {
  const value = `${ADULT_DECLARATION}:${new Date(now).toISOString()}`
  try {
    if (!access?.valid?.() || access.setItem(ADULT_KEY, value) === false) return false
    return access.getItem(ADULT_KEY) === value
  } catch {
    return false
  }
}
