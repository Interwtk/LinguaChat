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
  return {
    begin() {
      if (inFlight) return null
      inFlight = true
      token += 1
      return token
    },
    isCurrent(t) { return t === token && inFlight === true },
    settle() { inFlight = false },
    invalidate() { token += 1; inFlight = false },
    get inFlight() { return inFlight },
  }
}
