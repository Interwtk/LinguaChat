/*
 * B2 pattern groups — transcribed from `docs/curriculum/blueprints/b2.json#/patterns`.
 * Twenty groups, each Garden-trackable as one multiword unit (b2.md section 6:
 * "every pattern in section 6 above is a single Garden-trackable unit, not its
 * component words"). `reaches` names the evidence tier the pattern's own
 * capability requires it to reach (`b2.json` `reaches` field), not a separate
 * invention.
 */

export const B2_PATTERNS = [
  { id: 'opinion_stance_pattern', form: "In my view / I'd argue that / As I see it", enables: ['develop_and_defend_opinion'], prerequisite: null, reaches: 'independent', firstArc: 'making_the_case', reuseArcs: ['the_long_conversation'] },
  { id: 'contrast_connector_pattern', form: 'whereas / on the other hand / by contrast', enables: ['weigh_advantages_and_disadvantages'], prerequisite: 'opinion_stance_pattern', reaches: 'independent', firstArc: 'making_the_case', reuseArcs: ['the_long_conversation'] },
  { id: 'advantage_disadvantage_frame', form: 'the main advantage/drawback of X is that…', enables: ['weigh_advantages_and_disadvantages'], prerequisite: 'contrast_connector_pattern', reaches: 'independent', firstArc: 'making_the_case', reuseArcs: ['the_long_conversation'] },
  { id: 'concession_counter_pattern', form: "that's true, but / I take your point, however", enables: ['concede_a_point_and_counter'], prerequisite: 'opinion_stance_pattern', reaches: 'guided_production', firstArc: 'making_the_case', reuseArcs: ['when_plans_go_wrong', 'the_long_conversation'] },
  { id: 'justification_pattern', form: "given that / since / the reason I'm asking is that", enables: ['justify_a_request_for_change'], prerequisite: null, reaches: 'independent', firstArc: 'when_plans_go_wrong', reuseArcs: ['the_long_conversation'] },
  { id: 'negotiation_proposal_pattern', form: "would you be willing to / what if we / I'd suggest that", enables: ['negotiate_a_resolution'], prerequisite: 'justification_pattern', reaches: 'independent', firstArc: 'when_plans_go_wrong', reuseArcs: ['the_long_conversation'] },
  { id: 'diplomatic_hedge_pattern', form: "I understand, but / I don't want to make a fuss, but", enables: ['express_frustration_diplomatically'], prerequisite: 'negotiation_proposal_pattern', reaches: 'guided_production', firstArc: 'when_plans_go_wrong', reuseArcs: ['the_long_conversation'] },
  { id: 'second_conditional_pattern', form: 'If I were…, I would…', enables: ['hypothesize_about_unreal_situations'], prerequisite: null, reaches: 'independent', firstArc: 'what_if', reuseArcs: ['the_long_conversation'] },
  { id: 'third_conditional_pattern', form: 'If I had…, I would have…', enables: ['hypothesize_about_unreal_situations'], prerequisite: 'second_conditional_pattern', reaches: 'independent', firstArc: 'what_if', reuseArcs: ['the_long_conversation'] },
  { id: 'mixed_conditional_pattern', form: 'If I had…, I would… [now]', enables: ['hypothesize_about_unreal_situations'], prerequisite: 'third_conditional_pattern', reaches: 'guided_production', firstArc: 'what_if', reuseArcs: [] },
  { id: 'modal_deduction_present_pattern', form: "must be / might be / can't be", enables: ['speculate_about_cause_and_effect'], prerequisite: 'second_conditional_pattern', reaches: 'independent', firstArc: 'what_if', reuseArcs: ['the_long_conversation'] },
  { id: 'modal_deduction_past_pattern', form: 'must have / might have / could have', enables: ['speculate_about_cause_and_effect'], prerequisite: 'modal_deduction_present_pattern', reaches: 'independent', firstArc: 'what_if', reuseArcs: ['the_long_conversation'] },
  { id: 'wish_past_perfect_pattern', form: "I wish I had… / if only I'd…", enables: ['express_regret_about_a_past_decision'], prerequisite: 'third_conditional_pattern', reaches: 'guided_production', firstArc: 'what_if', reuseArcs: [] },
  { id: 'reported_speech_pattern', form: 'tense back-shift + claim/mention/point out/suggest', enables: ['summarize_for_someone_else', 'report_someone_elses_opinion'], prerequisite: null, reaches: 'independent', firstArc: 'talking_around_a_subject', reuseArcs: ['the_long_conversation'] },
  { id: 'summary_connector_pattern', form: 'basically / the main point was / to sum up', enables: ['summarize_for_someone_else'], prerequisite: 'reported_speech_pattern', reaches: 'independent', firstArc: 'talking_around_a_subject', reuseArcs: ['the_long_conversation'] },
  { id: 'reformulation_marker_pattern', form: 'in other words / what I mean is / put simply', enables: ['reformulate_to_clarify'], prerequisite: 'summary_connector_pattern', reaches: 'independent', firstArc: 'talking_around_a_subject', reuseArcs: ['the_long_conversation'] },
  { id: 'register_marker_pattern', form: 'could you possibly (formal) vs can you (informal)', enables: ['adjust_register_to_context'], prerequisite: null, reaches: 'independent', firstArc: 'reading_between_the_lines', reuseArcs: ['the_long_conversation'] },
  { id: 'hedging_pattern', form: "sort of / tend to / I'd say / more or less", enables: ['soften_or_strengthen_a_statement'], prerequisite: 'register_marker_pattern', reaches: 'independent', firstArc: 'reading_between_the_lines', reuseArcs: ['the_long_conversation'] },
  { id: 'intensifying_pattern', form: "absolutely / without a doubt / I'm convinced that", enables: ['soften_or_strengthen_a_statement'], prerequisite: 'register_marker_pattern', reaches: 'independent', firstArc: 'reading_between_the_lines', reuseArcs: ['the_long_conversation'] },
  { id: 'topic_shift_marker_pattern', form: 'anyway / speaking of which / that reminds me / before I forget', enables: ['sustain_a_multi_topic_conversation', 'handle_a_topic_shift_gracefully'], prerequisite: 'register_marker_pattern', reaches: 'independent', firstArc: 'the_long_conversation', reuseArcs: [] },
]

export const getB2Pattern = (id) => B2_PATTERNS.find((p) => p.id === id) || null

/*
 * Deliberately NOT a 21st pattern group (b2.md section 6 / b2.json
 * `architecturalNote` on negotiate_an_agreement_under_pushback): it
 * recombines three existing patterns. Recorded here so content/QA can find
 * the decision without re-deriving it from prose.
 */
export const B2_RECOMBINED_PATTERNS = [
  {
    id: 'pushback_response_pattern',
    form: "I hear what you're saying, but / let's find a middle ground",
    recombines: ['concession_counter_pattern', 'negotiation_proposal_pattern', 'diplomatic_hedge_pattern'],
    usedIn: ['the_long_conversation'],
    enables: ['negotiate_an_agreement_under_pushback'],
  },
]

/*
 * Semantic slot types B2 needs, transcribed from `b2.json#/semanticTypes`.
 * `problem_type` is B1's existing `problem` family escalated with an
 * explicit category, per `docs/curriculum/semantic-types.md` section 1
 * (LC-AUD-001 F9 / LC-FND-002) — not a second, unrelated type. Registering
 * any of these into `engine/semanticContext.js`'s live registries is out of
 * this task's write scope.
 */
export const B2_SEMANTIC_TYPES = [
  {
    id: 'stance',
    requiredBy: ['develop_and_defend_opinion', 'weigh_advantages_and_disadvantages', 'concede_a_point_and_counter', 'report_someone_elses_opinion', 'soften_or_strengthen_a_statement', 'negotiate_an_agreement_under_pushback'],
    examples: ['for', 'against', 'neutral/undecided'],
    incompatibleWith: ['place', 'food', 'drink'],
  },
  {
    id: 'problem_type',
    requiredBy: ['justify_a_request_for_change', 'negotiate_a_resolution', 'express_frustration_diplomatically', 'negotiate_an_agreement_under_pushback'],
    examples: ['delay', 'damage', 'wrong_item', 'missed_appointment'],
    incompatibleWith: ['person', 'feeling'],
    crossLevelNote: "Escalates B1's problem family with an explicit category field; the runtime registry should register one problem type with an optional category, not two SEMANTIC_TYPES entries (see this level's shared-core handoff notes).",
  },
  {
    id: 'register',
    requiredBy: ['adjust_register_to_context', 'soften_or_strengthen_a_statement', 'infer_implied_meaning'],
    examples: ['formal', 'informal', 'neutral'],
    incompatibleWith: ['place', 'activity'],
  },
]
