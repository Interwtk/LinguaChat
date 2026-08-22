/*
 * B2 intent catalog — one intent per communicative function
 * (`b2.json#/intentStrategy`'s rule, inherited from A1's `intentStrategy`),
 * with a worked example set per intent matching the template's section 11
 * categories: clearly correct, natural variant, near miss, wrong meaning,
 * nonsense, and (only where the capability's evaluation bucket needs it)
 * insufficient form / pragmatically inappropriate.
 *
 * This is content, not evaluator code: nothing here is wired into
 * `engine/responseEvaluation.js`'s dispatch (out of this task's write scope).
 * It is the exact spec `LC-INT-001` needs to write real per-intent evaluator
 * functions against, so the wiring step is mechanical rather than a second
 * design pass — see `docs/curriculum/implementation/b2/core-engine-handoff.md`.
 *
 * The `develop_and_defend_opinion`, `negotiate_a_resolution`,
 * `hypothesize_about_unreal_situations` and `adjust_register_to_context`
 * example sets are taken verbatim from `b2.md` section 11 (the blueprint's
 * own worked examples); every other intent's examples are authored here
 * against the same capability/evidence targets, since the blueprint names
 * only "representative examples per required capability... full sets belong
 * to the content-authoring phase, not the blueprint" (b2.md section 11).
 */

export const B2_INTENTS = [
  {
    /*
     * Runtime-renamed at `LC-INT-001` integration time from `state_opinion_with_reason`
     * to resolve a real collision with A2's own, much simpler intent of that
     * exact bare id (`levels/a2/evaluators.js`) — see `b2Capabilities.js`'s
     * `B2_CAN_DO_INTENT` comment for the full account.
     */
    id: 'argue_opinion_with_reason',
    capabilityId: 'develop_and_defend_opinion',
    evaluationBucket: 'hybrid_provider_preferred',
    examples: {
      clearlyCorrect: 'I think we should go with the later start time, because most people struggle to get here by eight.',
      naturalVariant: "Honestly, I'd rather start later — getting here by eight is hard for most of us.",
      nearMiss: 'I just think so.',
      nearMissNote: 'recognized as an opinion, marked as missing the required justification',
      wrongMeaning: "agreeing with the counter-argument's position while using opinion-stating language",
      nonsense: 'The opinion is opinion.',
    },
  },
  {
    id: 'weigh_options',
    capabilityId: 'weigh_advantages_and_disadvantages',
    evaluationBucket: 'hybrid_provider_preferred',
    examples: {
      clearlyCorrect: "The main advantage of the morning slot is that it's quieter, whereas the afternoon slot is more convenient for most people.",
      naturalVariant: 'On the one hand, mornings are quieter; on the other hand, afternoons work better for most of us.',
      nearMiss: 'I like the morning slot.',
      nearMissNote: 'recognized as a preference, marked as missing the explicit advantage/disadvantage trade-off',
      wrongMeaning: "describing only one option's features without ever comparing it to the other",
      nonsense: 'The advantage of the disadvantage is the advantage.',
    },
  },
  {
    id: 'concede_and_counter',
    capabilityId: 'concede_a_point_and_counter',
    evaluationBucket: 'hybrid_provider_preferred',
    examples: {
      clearlyCorrect: "That's true, the later slot is more convenient — but I still think mornings work better for most of the team.",
      naturalVariant: "I take your point about convenience, however I'd still lean toward the morning.",
      nearMiss: "Yes, you're right.",
      nearMissNote: 'recognized as full agreement, not a concession-and-counter — the counter half is missing',
      wrongMeaning: 'conceding a point that was never raised in the conversation',
      nonsense: "That's true, but that's true.",
    },
  },
  {
    id: 'justify_a_request',
    capabilityId: 'justify_a_request_for_change',
    evaluationBucket: 'hybrid_provider_preferred',
    examples: {
      clearlyCorrect: "Could you move my delivery to Friday? Since I won't be home until then, Thursday doesn't work.",
      naturalVariant: "The reason I'm asking is that I'm away until Friday, so could we push the delivery back?",
      nearMiss: 'Change my delivery.',
      nearMissNote: 'recognized as a bare request, marked as missing the required justification',
      wrongMeaning: 'giving a reason unrelated to the requested change',
      nonsense: 'Given that Friday, deliver Thursday because.',
    },
  },
  {
    id: 'propose_a_resolution',
    capabilityId: 'negotiate_a_resolution',
    evaluationBucket: 'hybrid_provider_preferred',
    examples: {
      clearlyCorrect: "Could you move my appointment to Thursday instead? I explained why Tuesday doesn't work.",
      naturalVariant: "Would it be possible to reschedule for Thursday? Tuesday's a problem for me, for the reason I mentioned.",
      nearMiss: 'Just fix it.',
      nearMissNote: 'recognized as dissatisfaction, not as a negotiation move — no justification and no proposed alternative',
      wrongMeaning: "accepting the original problem as final when the turn calls for a counter-proposal",
      nonsense: 'an unrelated proposal that ignores the stated problem entirely',
    },
    subtypes: [
      {
        id: 'pushback',
        usedIn: ['the_long_conversation'],
        capabilityId: 'negotiate_an_agreement_under_pushback',
        note: 'the same intent judged across repeated objection rounds rather than once (b2.json intentStrategy.newSubtypesOnExistingIntents)',
        pragmaticallyInappropriateExample: {
          text: "That's completely wrong and you clearly don't understand the issue.",
          context: 'a response to a landlord during a request for a repair',
          why: 'grammatically flawless, pragmatically counter-productive to the negotiation goal — must be distinguishable from a grammar error in the evaluator output (b2.md section 11)',
        },
      },
    ],
  },
  {
    id: 'express_diplomatic_frustration',
    capabilityId: 'express_frustration_diplomatically',
    evaluationBucket: 'hybrid_provider_preferred',
    examples: {
      clearlyCorrect: "I understand things get busy, but this is the second time it's happened, and I need it sorted this week.",
      naturalVariant: "I get that mistakes happen, but this is starting to become a pattern, and I'd really appreciate it if it didn't happen again.",
      nearMiss: 'This is so annoying!',
      nearMissNote: 'recognized as raw frustration, not the diplomatic register the capability requires',
      wrongMeaning: 'expressing satisfaction instead of dissatisfaction',
      nonsense: 'I understand, but I understand, but.',
    },
  },
  {
    id: 'state_unreal_hypothesis',
    capabilityId: 'hypothesize_about_unreal_situations',
    evaluationBucket: 'deterministic_local_with_hybrid_escalation',
    examples: {
      clearlyCorrect: "If I were in your position, I'd ask for more time before deciding.",
      naturalVariant: 'Were I you, I’d want more time before deciding.',
      naturalVariantNote: 'fronted inversion — accepted, not required',
      nearMiss: 'If I am you, I ask for more time.',
      nearMissNote: 'real-conditional form used for an unreal situation — recognized as an attempt, marked for form',
      wrongMeaning: 'a hypothesis that answers a different question than the one asked',
      nonsense: 'a well-formed conditional with an impossible/unrelated result clause',
    },
  },
  {
    id: 'speculate_cause_or_effect',
    capabilityId: 'speculate_about_cause_and_effect',
    evaluationBucket: 'deterministic_local_with_hybrid_escalation',
    examples: {
      clearlyCorrect: "The lights are off and the car's gone — they must have left early.",
      naturalVariant: "They might have left already; the car's not here.",
      nearMiss: 'They left early.',
      nearMissNote: 'a flat assertion with no calibrated-certainty modal — recognized as an attempt, marked for missing modal deduction',
      wrongMeaning: 'a deduction that contradicts the evidence given in the scene',
      nonsense: 'They must have might have left.',
    },
  },
  {
    id: 'express_past_regret',
    capabilityId: 'express_regret_about_a_past_decision',
    evaluationBucket: 'deterministic_local_with_hybrid_escalation',
    examples: {
      clearlyCorrect: "I wish I had checked the reviews before booking — I would have chosen somewhere else.",
      naturalVariant: "If only I'd asked more questions first, I wouldn't have signed up.",
      nearMiss: 'I should ask more questions next time.',
      nearMissNote: 'future-facing advice, not regret about the specific past decision — recognized as an attempt, marked as not yet the regret form',
      wrongMeaning: 'expressing satisfaction with the past decision',
      nonsense: 'I wish I have had checking.',
    },
  },
  {
    id: 'summarize_for_third_party',
    capabilityId: 'summarize_for_someone_else',
    evaluationBucket: 'provider_preferred_meaning_equivalence',
    examples: {
      clearlyCorrect: "Basically, the shipment's delayed until next week because of a supplier issue, and they offered a partial refund.",
      naturalVariant: "The main point was that the delivery's late — a supplier problem — and they're refunding part of it.",
      nearMiss: 'a verbatim, unshortened repetition of the whole source conversation',
      nearMissNote: 'recognized as recall, not summary — condensation for a third party is the required move',
      wrongMeaning: "a summary that states the opposite of the source (e.g. 'on time' instead of 'delayed')",
      nonsense: "unrelated content with summary connectors attached ('basically, the weather is nice')",
    },
  },
  {
    id: 'reformulate_for_clarity',
    capabilityId: 'reformulate_to_clarify',
    evaluationBucket: 'provider_preferred_meaning_equivalence',
    examples: {
      clearlyCorrect: "In other words, the account is on hold until it's verified.",
      naturalVariant: "What I mean is, we're just waiting on verification before the account's active.",
      nearMiss: 'a verbatim copy of the confusing original, with no reformulation attempted',
      wrongMeaning: "a rewording that changes the source's meaning (e.g. claims the account is already active)",
      nonsense: 'reformulation markers attached to unrelated content',
    },
  },
  {
    id: 'report_third_party_opinion',
    capabilityId: 'report_someone_elses_opinion',
    evaluationBucket: 'provider_preferred_meaning_equivalence',
    examples: {
      clearlyCorrect: 'She said she thought the later time would work better for everyone.',
      naturalVariant: 'She mentioned that, in her view, the later time was the better option.',
      nearMiss: 'She likes the later time.',
      nearMissNote: 'loses the reported-speech/opinion framing — recognized as an attempt, marked for the missing report frame',
      wrongMeaning: 'reporting the opposite stance from what the third party actually said',
      nonsense: 'reported-speech markers attached with no actual opinion content',
    },
  },
  {
    id: 'shift_register',
    capabilityId: 'adjust_register_to_context',
    evaluationBucket: 'register_dimension_plus_semantic',
    examples: {
      clearlyCorrect: 'Could you possibly let me know when the report will be ready?',
      naturalVariant: 'Would it be possible to get an update on the report?',
      nearMiss: 'When report ready?',
      nearMissNote: 'meaning recoverable, register/grammar both underspecified — marked for form, not treated as a register failure',
      wrongMeaning: 'a register-correct utterance that asks about the wrong thing entirely',
      nonsense: 'could you possibly could you possibly',
      formInsufficient: {
        text: "gimme a sec, I'll check the contract",
        context: 'addressed to a landlord in a formal complaint turn',
        why: "semantically fine, register-inappropriate — gradable as its own failure mode, not folded into 'wrong' (b2.md section 11)",
      },
    },
    subtypes: [
      { id: 'formal_shift', usedIn: ['reading_between_the_lines', 'the_long_conversation'] },
      { id: 'informal_shift', usedIn: ['reading_between_the_lines', 'the_long_conversation'] },
      {
        id: 'topic_shift',
        usedIn: ['the_long_conversation'],
        capabilityId: 'sustain_a_multi_topic_conversation',
        alsoCapabilityId: 'handle_a_topic_shift_gracefully',
        note: 'b2.json literally names this intent+subtype for both capstone conversation-length capabilities (evaluationStrategy.discourse_coherence_plus_semantic); the id is reused from register-shift, not renamed — flagged in b2Capabilities.js and this level\'s implementation README as a naming concern worth a human check, not silently fixed here.',
        discourseCoherenceExamples: {
          coherent: 'a topic-shift marker used with a genuine, signalled change of subject that both speakers can follow',
          incoherentFlatList: 'several correct, individually well-formed sentences on different topics with no shift marker connecting them',
          incoherentOffTopicDrift: 'abandoning the active topic mid-turn without any signal that a shift was intended',
        },
      },
    ],
  },
  {
    id: 'soften_or_intensify_claim',
    capabilityId: 'soften_or_strengthen_a_statement',
    evaluationBucket: 'register_dimension_plus_semantic',
    examples: {
      clearlyCorrect: "It's sort of a problem, to be honest — I'd say it needs looking at soon.",
      clearlyCorrectIntensify: "I'm absolutely convinced this needs fixing today, without a doubt.",
      naturalVariant: 'It tends to be an issue around this time of year, more or less.',
      nearMiss: "It's a problem.",
      nearMissNote: 'the claim itself is correct, but the turn explicitly calls for a deliberate hedge/intensifier that is missing',
      wrongMeaning: 'a hedge applied so that the claim reverses its intended force (a strong claim reads as denial)',
      nonsense: 'Sort of absolutely without a doubt.',
    },
  },
]

export const getB2Intent = (id) => B2_INTENTS.find((i) => i.id === id) || null

/*
 * `infer_implied_meaning` and `use_idiomatic_expressions_naturally` are
 * receptive-only (`b2.json#/evaluationStrategy.comprehension_only`) — they
 * have no production intent and are exercised through plain `comprehension`/
 * `choice` steps in the arc content, the same convention A1 uses for
 * receptive-only items.
 */
export const B2_COMPREHENSION_ONLY_CAN_DOS = ['infer_implied_meaning', 'use_idiomatic_expressions_naturally']

export const B2_NEW_INTENT_COUNT = B2_INTENTS.length // must equal b2.json#/intentStrategy/counts/newB2Intents (14)
