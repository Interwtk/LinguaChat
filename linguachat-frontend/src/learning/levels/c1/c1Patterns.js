/*
 * C1 pattern groups — transcribed from
 * `docs/curriculum/blueprints/c1.json#/languageInfrastructure/patterns`.
 * Twelve groups, each Garden-trackable as one multiword unit (same rule
 * B2/A1 already use). `guidedUseTarget`/`independentUseTarget` are per-
 * episode occurrence counts within a capability's home arc (c1.md section 6
 * note), not level-wide totals — level-wide independent evidence targets
 * live in `c1Capabilities.js`'s `independentEvidence` field.
 */

export const C1_PATTERNS = [
  { id: 'emphatic_cleft_pattern', function: 'foreground the core of an argument or nuance', prerequisitePatterns: [], firstAppearance: 'abstract_argument', guidedUseTarget: 1, independentUseTarget: 2, laterReuse: ['nuance_and_implication', 'extended_structured_discourse'] },
  { id: 'hedging_modal_pattern', function: "qualify a claim's certainty", prerequisitePatterns: [], firstAppearance: 'abstract_argument', guidedUseTarget: 2, independentUseTarget: 2, laterReuse: ['nuance_and_implication', 'negotiation_and_complexity'] },
  { id: 'hedging_adverbial_pattern', function: 'narrow/broaden a claim', prerequisitePatterns: ['hedging_modal_pattern'], firstAppearance: 'abstract_argument', guidedUseTarget: 2, independentUseTarget: 2, laterReuse: ['nuance_and_implication', 'negotiation_and_complexity', 'sustained_interaction'] },
  { id: 'concessive_clause_pattern', function: 'concede without conceding everything', prerequisitePatterns: ['hedging_modal_pattern'], firstAppearance: 'abstract_argument', guidedUseTarget: 2, independentUseTarget: 2, laterReuse: ['nuance_and_implication', 'negotiation_and_complexity', 'sustained_interaction'] },
  { id: 'mitigation_device_pattern', function: 'soften a face-threatening statement', prerequisitePatterns: ['hedging_adverbial_pattern'], firstAppearance: 'register_and_diplomacy', guidedUseTarget: 2, independentUseTarget: 2, laterReuse: ['negotiation_and_complexity', 'sustained_interaction'] },
  { id: 'register_pair_pattern', function: 'shift register on purpose', prerequisitePatterns: [], firstAppearance: 'register_and_diplomacy', guidedUseTarget: 2, independentUseTarget: 2, laterReuse: ['synthesis_and_mediation', 'extended_structured_discourse', 'sustained_interaction'] },
  { id: 'evaluative_reporting_pattern', function: 'relay what someone meant, not just what they said', prerequisitePatterns: ['hedging_modal_pattern'], firstAppearance: 'synthesis_and_mediation', guidedUseTarget: 2, independentUseTarget: 2, laterReuse: ['nuance_and_implication', 'sustained_interaction'] },
  { id: 'certainty_marking_pattern', function: 'mark degree of confidence', prerequisitePatterns: ['hedging_modal_pattern'], firstAppearance: 'nuance_and_implication', guidedUseTarget: 2, independentUseTarget: 2, laterReuse: ['negotiation_and_complexity', 'sustained_interaction'] },
  { id: 'cohesive_connector_pattern', function: 'link sentences across an extended turn', prerequisitePatterns: [], firstAppearance: 'extended_structured_discourse', guidedUseTarget: 3, independentUseTarget: 2, laterReuse: ['synthesis_and_mediation', 'negotiation_and_complexity', 'sustained_interaction'] },
  { id: 'self_repair_discourse_pattern', function: 'repair mid-turn without losing the thread', prerequisitePatterns: ['cohesive_connector_pattern'], firstAppearance: 'extended_structured_discourse', guidedUseTarget: 2, independentUseTarget: 2, laterReuse: ['sustained_interaction'] },
  { id: 'anaphoric_reference_pattern', function: 'refer back without restating', prerequisitePatterns: ['cohesive_connector_pattern'], firstAppearance: 'sustained_interaction', guidedUseTarget: 2, independentUseTarget: 2, laterReuse: [] },
  { id: 'conditional_alternative_pattern', function: 'propose an alternative and justify it', prerequisitePatterns: [], firstAppearance: 'negotiation_and_complexity', guidedUseTarget: 2, independentUseTarget: 2, laterReuse: ['sustained_interaction'] },
]

export const getC1Pattern = (id) => C1_PATTERNS.find((p) => p.id === id) || null

/*
 * `negotiated_item` — the one new C1 semantic slot type, resolved by
 * LC-FND-002 (`docs/curriculum/semantic-types.md` section 2, LC-AUD-001 F9)
 * rather than proposed fresh by this task. It generalizes B1's `problem`
 * type (every `problem` value is a valid `negotiated_item` value) while also
 * accepting problem-free negotiable objects (a meeting slot, a compromise
 * plan) that `problem` must keep rejecting — an is-a relationship, not a
 * fourth independent type. Registering this into the live
 * `engine/semanticContext.js` registry is out of this task's write scope.
 */
export const C1_SEMANTIC_TYPES = [
  {
    id: 'negotiated_item',
    requiredBy: ['negotiate_a_mutually_acceptable_outcome', 'propose_and_defend_an_alternative'],
    examples: ['a returned purchase', 'a service booking gone wrong', 'a shared calendar conflict', 'a rescheduled trip', 'a compromise plan'],
    generalizes: 'problem',
    crossLevelNote: "Every problem value (B1's semantic-types family: delay, damage, wrong_item, missed_appointment) is a valid negotiated_item value, plus C1's own problem-free examples (a proposed meeting time, a compromise plan) that problem must continue to reject. See the cross-level semantic type registry's own decision record for the full rationale.",
  },
]
