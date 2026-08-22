/*
 * C1 intent catalog — one intent per communicative function
 * (`c1.json#/evaluationIntents`), with a worked example set per intent
 * matching c1.md section 11's example categories: clearly correct, natural
 * variant, near miss, wrong meaning, nonsense, and (only where c1.md's own
 * section 11 table calls for it) insufficient form / pragmatically
 * inappropriate.
 *
 * This is content, not evaluator code: nothing here is wired into
 * `engine/responseEvaluation.js`'s dispatch (out of this task's write
 * scope). It is the exact spec `LC-INT-001` needs to write real per-intent
 * evaluator functions against — see
 * `docs/curriculum/implementation/c1/core-engine-handoff.md`.
 *
 * `clarify_ambiguity` (the 11th entry below) IS one of c1.json's 12
 * `evaluationIntents` entries, literally — but per that same entry's own
 * `intentReuse` field, the evaluator mechanism behind it is a new
 * `repairKind: ask_for_precision` subtype on the existing `repair_request`
 * intent family (mirroring A1's own ask_meaning-on-repair_request
 * precedent), not a brand-new evaluator built from scratch. Both facts are
 * recorded on that entry rather than picking one.
 */

export const C1_INTENTS = [
  {
    id: 'state_structured_argument',
    capabilities: ['develop_a_structured_argument', 'weigh_implications_of_a_position'],
    cefrRefs: ['Sustained Monologue: Putting a Case', 'Overall Oral Production'],
    examples: {
      clearlyCorrect: "I think remote work should stay optional, because forcing everyone back full-time ignores how differently people actually work best — for example, a lot of the team does its most focused work early morning, before the office even opens.",
      naturalVariant: "Here's the thing about mandatory office days: people's most productive hours don't line up with a nine-to-five, so forcing the issue would probably just lower output, not raise it.",
      nearMiss: "I don't think everyone should have to go back to the office.",
      nearMissNote: 'recognized as a claim, marked as missing the required supporting reason and example',
      wrongMeaning: 'argues in favor of a full return to the office while using structured-argument language',
      nonsense: 'The argument is that arguing is the argument.',
      formInsufficient: {
        text: "I just don't like it.",
        why: 'a bare opinion with no reasoning or example, when a structured position was the target',
      },
      pragmaticallyInappropriate: {
        text: "Anyone who thinks mandatory office days make sense is clearly not paying attention.",
        context: 'a measured debate about a genuinely two-sided workplace policy question',
        why: 'grammatically fine and even structured, but absolutist and dismissive where the turn calls for a position that leaves room for a good-faith counter-argument',
      },
    },
  },
  {
    id: 'qualify_claim',
    capabilities: ['qualify_a_claim_precisely', 'express_degrees_of_certainty'],
    cefrRefs: ['Coherence and Cohesion'],
    examples: {
      clearlyCorrect: "It's arguably the more efficient option, though that's not necessarily true for every team.",
      naturalVariant: "By and large it works better, but I wouldn't say it's true across the board.",
      nearMiss: "It's kind of better, sort of.",
      nearMissNote: 'a hedge is present but too vague to count as a precise qualification of the claim',
      wrongMeaning: 'a hedge that reverses the claim (e.g. hedging language attached to the opposite conclusion from the one intended)',
      nonsense: "It's arguably arguably not necessarily arguably.",
      formInsufficient: {
        text: "It's definitely the better option, full stop.",
        why: 'stated as an absolute when the turn explicitly called for a qualified, hedged claim',
      },
    },
  },
  {
    id: 'concede_point',
    capabilities: ['concede_a_counterpoint_gracefully', 'hold_a_nuanced_stance'],
    cefrRefs: ['Formal Discussion and Meetings'],
    examples: {
      clearlyCorrect: "What really matters here is that, while I take your point that it costs more upfront, it still pays for itself within a year — so I'd still go with it.",
      naturalVariant: "Even though you're right that it's a bigger investment initially, I still think it's worth it, given the long-term saving.",
      nearMiss: "Yeah, maybe.",
      nearMissNote: 'a vague acknowledgment that names no specific opposing point — not yet a concession-and-hold',
      wrongMeaning: 'a concession that actually abandons the original position rather than holding it',
      nonsense: "I take your point, but I take your point, but.",
      pragmaticallyInappropriate: {
        text: "Oh sure, you're SO right about that.",
        context: 'a genuine concession moment in a good-faith disagreement',
        why: 'reads as sarcasm rather than a real acknowledgment, undermining the concession it is supposed to make',
      },
    },
  },
  {
    id: 'adapt_register',
    capabilities: ['adapt_register_to_audience', 'shift_register_within_one_conversation', 'repair_a_register_slip'],
    cefrRefs: ['Sociolinguistic Appropriateness'],
    examples: {
      clearlyCorrect: 'Would it be possible to get an extension on the deadline? Something unexpected has come up.',
      naturalVariant: "I was wondering if there's any flexibility on the deadline — a few things came up that I didn't plan for.",
      nearMiss: 'Can I get more time? Stuff came up.',
      nearMissNote: 'meaning is recoverable and the register is roughly in the right direction, but one lexical choice ("stuff") is too casual for the addressed relationship',
      wrongMeaning: 'a register-correct, formally phrased request about something entirely unrelated to the deadline',
      nonsense: 'would it be possible would it be possible',
      formInsufficient: {
        text: "yeah whatever, I'll get to it eventually",
        context: 'a reply to a manager after being asked for a status update on an overdue task',
        why: 'semantically on-topic, register wildly inappropriate for the relationship — gradable as its own failure mode, not folded into "wrong"',
      },
      pragmaticallyInappropriate: {
        text: 'I appreciate you taking the time to finally understand the point I was making.',
        context: 'addressed to a colleague who just agreed with the speaker',
        why: 'technically polite phrasing that reads as condescending given the relationship and the moment',
      },
    },
  },
  {
    id: 'hedge_statement',
    capabilities: ['hedge_and_mitigate_a_statement', 'disagree_diplomatically'],
    cefrRefs: ['Sociolinguistic Appropriateness', 'Goal-oriented Co-operation'],
    examples: {
      clearlyCorrect: "I don't want to overstate this, but I think the current draft still needs some work before it goes out.",
      naturalVariant: "I wonder if it might be worth taking another pass at the draft before sending it — just a thought.",
      nearMiss: "It's not great, but whatever, it's fine.",
      nearMissNote: 'softened in tone but the actual point (the draft needs work) gets lost in the process',
      wrongMeaning: 'a mitigation device attached to praise rather than the intended criticism',
      nonsense: 'I wonder if it might be worth, I wonder if it might be worth.',
      pragmaticallyInappropriate: {
        text: "I don't want to overstate this, but honestly this is a complete disaster and I don't know how anyone signed off on it.",
        context: 'giving first-round feedback to a colleague on a draft',
        why: 'over-hedged opener paired with an unmitigated, disproportionate claim underneath — the hedge is present but the statement itself is not actually softened',
      },
    },
  },
  {
    id: 'summarize_message',
    capabilities: ['summarize_a_complex_message_for_a_new_audience', 'reformulate_for_a_different_audience', 'paraphrase_to_avoid_repetition'],
    cefrRefs: ['Processing Text / Mediating a Text'],
    examples: {
      clearlyCorrect: "Basically, the landlord says the repair will happen next week, but only if we cover the cost of the part ourselves.",
      naturalVariant: "The main point was that the repair's happening next week, though we'd need to pay for the part.",
      nearMiss: 'a full, unshortened repetition of the entire source message with no condensation',
      nearMissNote: 'recognized as recall, not summary — reducing to the essential point for a new audience is the required move',
      wrongMeaning: "a summary that states the opposite of the source (e.g. 'the landlord will cover the cost' when the source said the tenant must)",
      nonsense: "unrelated content with summary connectors attached ('basically, the weather has been nice')",
      formInsufficient: {
        text: 'the landlord said the repair will happen next week, but only if we cover the cost of the part ourselves',
        why: 'a verbatim copy of the source sentence with no reformulation, when restating for a different audience was the actual target',
      },
    },
  },
  {
    id: 'synthesize_viewpoints',
    capabilities: ['synthesize_two_conflicting_viewpoints'],
    cefrRefs: ['Processing Text', 'Reading for Information and Argument'],
    examples: {
      clearlyCorrect: "Both reviews agree the location is great, but they disagree on the noise — one calls it lively, the other calls it too loud to sleep.",
      naturalVariant: "They're on the same page about the location, though one review found it lively where the other found it disruptively loud.",
      nearMiss: "One review says the location is great but noisy.",
      nearMissNote: "captures only one source's view — the required move is stating what BOTH sources agree and disagree on",
      wrongMeaning: 'reverses which source said what',
      nonsense: 'unrelated content attached to synthesis language',
    },
  },
  {
    id: 'infer_meaning',
    capabilities: ['infer_implied_meaning_in_unfamiliar_context', 'recognize_understatement_or_irony'],
    cefrRefs: ['Conversation', 'Reading for Information and Argument'],
    examples: {
      clearlyCorrect: "when a friend says \"I've just been really busy lately\" in response to a third missed catch-up, correctly identifying that they're avoiding the friend rather than genuinely swamped",
      naturalVariant: 'a differently worded but equivalent correct inference of the same underlying meaning',
      nearMiss: "recognizing that something is being avoided, but misidentifying what — partially correct, wrong specific meaning",
      wrongMeaning: "taking \"I've just been really busy\" at face value with no recognition of the evasive subtext",
      nonsense: 'an interpretation unrelated to anything said in the exchange',
    },
  },
  {
    id: 'extended_explanation',
    capabilities: ['produce_an_extended_structured_explanation', 'use_cohesive_devices_across_a_turn', 'self_correct_without_losing_the_thread', 'open_and_close_an_extended_turn'],
    cefrRefs: ['Sustained Monologue', 'Coherence and Cohesion'],
    examples: {
      clearlyCorrect: "So, basically what happened is the delivery got rescheduled twice. First it was meant to arrive Monday, but then the courier said Wednesday instead. As a result, I had to rearrange my whole afternoon — or actually, wait, that's not quite right, it was my morning I had to clear. Anyway, that's the situation.",
      naturalVariant: 'a different valid organization (e.g. cause before sequence) that is still cohesively linked start to finish',
      nearMiss: "First it was Monday. Then it was Wednesday. I had to rearrange my afternoon.",
      nearMissNote: 'individually correct sentences with no connecting devices — a flat list, not a linked extended turn',
      wrongMeaning: 'an account that contradicts the situation actually described in the scene',
      nonsense: 'several disconnected, unrelated sentences with no shared thread',
      formInsufficient: {
        text: "So basically the delivery got rescheduled — or wait, actually, hold on, I don't — anyway, never mind.",
        why: 'a genuine self-correction attempt that then abandons the thread instead of recovering it, when recovering it was the required move',
      },
      discourseCoherenceExamples: {
        coherent: 'a several-sentence turn where each sentence is linked to the last with an appropriate connector and no sentence contradicts an earlier one',
        incoherentFlatList: 'several individually well-formed sentences on the same broad subject with no connecting device between them',
        incoherentContradictory: 'a turn whose second half states something that directly contradicts a claim made earlier in the same turn',
        incoherentOffTopicDrift: "a turn that starts on the stated subject and then abandons it partway through with no signalled change of subject",
      },
    },
  },
  {
    id: 'negotiate_outcome',
    capabilities: ['negotiate_a_mutually_acceptable_outcome', 'propose_and_defend_an_alternative', 'handle_an_unexpected_complication'],
    cefrRefs: ['Goal-oriented Co-operation'],
    examples: {
      clearlyCorrect: "What if we split the difference — you get the earlier slot next week, and I get it the week after? That way neither of us loses out every time.",
      naturalVariant: "Would you be willing to alternate? That way it's fair to both of us over time.",
      nearMiss: 'Just give me the slot.',
      nearMissNote: "recognized as a demand, not a negotiation move — no proposal that addresses both sides' stated constraints",
      wrongMeaning: 'a proposal that directly contradicts a constraint either side already stated',
      nonsense: 'an unrelated proposal that ignores the stated conflict entirely',
      pragmaticallyInappropriate: {
        text: "Fine, but this is the last time I'm being reasonable about it.",
        context: 'a proposal that is otherwise workable, delivered as a threat rather than an offer',
        why: 'grammatically and semantically a valid proposal, but delivered as an ultimatum rather than a genuine attempt at a mutually acceptable outcome',
      },
    },
  },
  {
    /*
     * `id: 'clarify_ambiguity'` matches c1.json#/evaluationIntents literally
     * (the blueprint names this its own 12th evaluationIntents entry, id
     * `clarify_ambiguity`) — but per that same entry's own `intentReuse`
     * field ("repair_request with a new repairKind subtype:
     * ask_for_precision", also mirrored in
     * c1Capabilities.js#/intentReuse), the underlying evaluator MECHANISM
     * is a new subtype on the existing `repair_request` intent family, the
     * same convention A1's own ask_meaning already uses. Both facts are
     * true at once: the blueprint's own intent catalog counts this as one
     * of its 12 entries, AND the wiring work is "add a subtype", not "build
     * a new intent from scratch".
     */
    id: 'clarify_ambiguity',
    capabilities: ['clarify_an_ambiguous_instruction_precisely'],
    cefrRefs: ['Conversation'],
    intentReuse: 'repair_request with a new repairKind subtype: ask_for_precision',
    examples: {
      clearlyCorrect: "When you say 'soon', do you mean today, or later this week?",
      naturalVariant: 'Could you be more specific about the timing — are we talking hours or days?',
      nearMiss: 'What?',
      nearMissNote: 'a generic repair request that does not target the specific ambiguity in the instruction',
      wrongMeaning: 'a targeted-sounding question that asks about the wrong part of the instruction',
      nonsense: 'a question unrelated to anything ambiguous in the instruction',
    },
  },
  {
    id: 'track_discourse',
    capabilities: ['sustain_a_conversation_across_topic_shifts', 'refer_back_to_earlier_discourse', 'close_a_complex_interaction_with_a_summary'],
    cefrRefs: ['Conversation', 'Coherence and Cohesion'],
    examples: {
      clearlyCorrect: "Going back to what you said earlier about the schedule — I think that actually connects to this new issue too.",
      naturalVariant: "That point you raised before about the schedule? It's relevant here as well.",
      nearMiss: 'Like I said before...',
      nearMissNote: "a vague reference with no specific content named — not enough to be a genuinely useful accurate reference",
      wrongMeaning: 'misattributes what was actually said earlier in the conversation',
      nonsense: 'a reference to something never actually discussed in the conversation',
      discourseCoherenceExamples: {
        coherent: 'a topic-shift or closing-summary marker used with a genuine, signalled change of subject or a genuinely accurate recap, that the other party can follow',
        incoherentFlatList: 'several correct, individually well-formed statements about different topics raised earlier, with no connecting/summarizing device between them',
        incoherentOffTopicDrift: 'abandoning the active topic mid-turn with no signal that a shift was intended',
      },
    },
  },
]

export const getC1Intent = (id) => C1_INTENTS.find((i) => i.id === id) || null

export const C1_NEW_INTENT_COUNT = C1_INTENTS.length // must equal c1.json#/evaluationIntents.length (12)
