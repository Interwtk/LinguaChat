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
  state_opinion: () => 'I think that weekend trips are great, because they help you relax.',
  agree_or_disagree: () => "I agree, because there's more to do in a city.",
  compare_and_choose: () => "The city is busier than the countryside, but it's more exciting. Of the three, I think the coast is the most relaxing.",
  describe_experience: () => 'It was quiet, beautiful, and relaxing. It made me feel really peaceful.',
  recommend_or_warn: () => "I'd recommend the coast, because it's quiet and relaxing.",
}

export const B1_PROMPT = {
  narrate_past_event: (v) => (v.narrativeForm === 'interruption'
    ? `Think of a moment something happened while you were doing something else, ${v.name || ''}. What was happening?`
    : `Tell me about your day, ${v.name || ''} — what did you do, in order?`),
  state_opinion: (v) => `What's your opinion about that, ${v.name || ''}? Tell me why.`,
  agree_or_disagree: (v) => `Do you agree with that, ${v.name || ''}? Why or why not?`,
  compare_and_choose: (v) => `Compare a few options, ${v.name || ''} — which do you prefer, and why?`,
  describe_experience: (v) => `Describe a place or event you experienced, ${v.name || ''} — what was it like, and how did it make you feel?`,
  recommend_or_warn: (v) => `Would you recommend it or warn me away, ${v.name || ''}? Why?`,
}
