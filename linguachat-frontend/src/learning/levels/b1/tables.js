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
  report_problem: (v) => (v.tone === 'frustrated'
    ? "This isn't ideal — I ordered this three days ago, but I understand these things happen."
    : "There's a problem with my order. I ordered a chicken sandwich, but I got a cheese one."),
  negotiate_solution: () => 'Would it be possible to get a replacement instead?',
  state_future_intent: (v) => {
    const byForm = {
      decision: "I'll have the pasta, thanks.",
      plan: "I'm going to visit my sister next week.",
      prediction: 'It will probably rain later.',
      hope: 'I hope to travel more one day.',
    }
    return byForm[v.situationForm] || byForm.decision
  },
  state_real_condition: () => "If it rains tomorrow, I'll stay home.",
  state_hypothetical: () => "If I were you, I'd ask for more details before deciding.",
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
  report_problem: (v) => (v.tone === 'frustrated'
    ? `How do you feel about that, ${v.name || ''}? Tell me — politely.`
    : `What's wrong, ${v.name || ''}? Tell me what happened and what you expected instead.`),
  negotiate_solution: (v) => `What solution would you like, ${v.name || ''}?`,
  state_future_intent: (v) => {
    const byForm = {
      decision: `What will you have, ${v.name || ''}?`,
      plan: `What have you already planned, ${v.name || ''}?`,
      prediction: `What do you think will happen, ${v.name || ''}?`,
      hope: `What do you hope to do one day, ${v.name || ''}?`,
    }
    return byForm[v.situationForm] || byForm.decision
  },
  state_real_condition: (v) => `What will you do if that happens, ${v.name || ''}?`,
  state_hypothetical: (v) => `What would you tell them, ${v.name || ''}?`,
}
