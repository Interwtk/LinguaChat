/*
 * b1/tables — B1's own `MODEL_ANSWER`/`PROMPT` entries, keyed by `evalKind`
 * exactly like `components/session/SessionRunner.jsx`'s tables (see the survey
 * this task ran: table keys are the intent string, not the step `type`, and a
 * subtype like `narrativeForm` branches inside the function the same way
 * `state_routine` already branches on `timeForm`). `SessionRunner.jsx` is out
 * of this task's write scope; `LC-INT-001` merges these entries into its real
 * `MODEL_ANSWER`/`PROMPT` objects.
 */
export const B1_MODEL_ANSWER = {
  narrate_past_event: (v) => (v.narrativeForm === 'interruption'
    ? 'I was cooking dinner when the power went out.'
    : 'First I got up. Then I had breakfast. After that I went to work. Finally I came home.'),
}

export const B1_PROMPT = {
  narrate_past_event: (v) => (v.narrativeForm === 'interruption'
    ? `Think of a moment something happened while you were doing something else, ${v.name || ''}. What was happening?`
    : `Tell me about your day, ${v.name || ''} — what did you do, in order?`),
}
