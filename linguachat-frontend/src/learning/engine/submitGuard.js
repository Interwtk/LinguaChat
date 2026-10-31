import { captureLearnerAccess } from '../../auth/localLease.js'
/*
 * createSubmissionGuard — tiny state machine that makes async free-reply
 * submission safe:
 *   - begin() returns a token, or null if a submission is already in flight
 *     (protects against double submit / double tap).
 *   - isCurrent(token) tells a resolving submission whether it is still the
 *     active one; a stale token means the learner advanced or left, so its late
 *     result must be ignored.
 *   - settle() clears the in-flight flag after a submission resolves.
 *   - invalidate() bumps the token and clears in-flight — call it when the step
 *     advances or the component unmounts so any pending result is discarded.
 *
 * Pure and framework-free so it can be unit-tested directly.
 */
export function createSubmissionGuard() {
  let token = 0
  let inFlight = false
  let access = null
  return {
    begin() {
      if (inFlight) return null
      access = globalThis.localStorage ? captureLearnerAccess() : null
      if (access && !access.valid()) return null
      inFlight = true
      token += 1
      return token
    },
    isCurrent(t) { return t === token && inFlight === true && (!access || access.valid()) },
    settle() { inFlight = false },
    invalidate() { token += 1; inFlight = false },
    get inFlight() { return inFlight },
  }
}
