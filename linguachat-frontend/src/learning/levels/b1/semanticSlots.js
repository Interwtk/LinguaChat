/*
 * b1/semanticSlots — B1's own `INTENT_SLOTS` additions, additive-only, same
 * shape as `engine/semanticContext.js`'s `INTENT_SLOTS` (survey: one
 * array-of-accepted-types per intent, explicit `[]` for "no personalized
 * slot" rather than omission). `engine/**` is out of this task's write scope;
 * `LC-INT-001` merges these keys into the real `INTENT_SLOTS`.
 *
 * `B1_NEW_SEMANTIC_TYPES` below records B1's one genuinely new type, `problem`
 * (arc 4, `somethings_wrong`), self-contained the same way — matching
 * b1.json's own `semanticTypes.proposed[0]` entry, already reconciled with
 * B2's `problem_type`/C1's `negotiated_item` in
 * `docs/curriculum/semantic-types.md`.
 *
 * FOUND ALREADY TRUE AT `LC-INT-001` INTEGRATION TIME: `engine/
 * semanticContext.js`'s real `SEMANTIC_TYPES` already registers `'problem'`
 * — A2 (`LC-CONT-A2`, a sibling lane this file could not see; wired in by
 * this same `LC-INT-001`) proposed and registered the identical type name
 * for its own `report_problem` intent first. `SEMANTIC_TYPES` is a flat
 * list of type NAMES with no enforced `incompatibleWith`/`requiredBy` (that
 * detail is documentary only, per that file's own comment), so B1 needs no
 * second registration — it reuses the existing entry. This object stays for
 * the design record (`requiredBy`/`incompatibleWith` as B1 itself needs
 * them); no merge into `SEMANTIC_TYPES` is required or performed.
 */
export const B1_NEW_SEMANTIC_TYPES = {
  problem: {
    requiredBy: ['escalate_and_resolve_a_problem', 'negotiate_a_solution', 'express_frustration_politely'],
    examples: ['broken item', 'wrong order', 'delayed delivery', 'lost item'],
    incompatibleWith: ['drink', 'person', 'feeling'],
  },
}

export const B1_INTENT_SLOTS = {
  // arc 1 — narrate_connected_event ∪ narrate_interrupted_action semanticNeeds
  narrate_past_event: ['place', 'activity', 'feeling'],
  // arc 2 — give_an_opinion ∪ agree_or_disagree semanticNeeds (b1.json arc 2)
  state_opinion: ['activity', 'place', 'interest'],
  agree_or_disagree: ['activity', 'place', 'interest'],
  // arc 3 — compare_options_with_reasons ∪ describe_an_experience ∪
  // recommend_or_warn semanticNeeds (b1.json arc 3)
  compare_and_choose: ['place', 'activity', 'generic_object'],
  describe_experience: ['place', 'activity', 'feeling'],
  recommend_or_warn: ['place', 'activity'],
  // arc 4 — escalate_and_resolve_a_problem ∪ negotiate_a_solution ∪
  // express_frustration_politely semanticNeeds (b1.json arc 4). Key renamed
  // from b1.json's `report_problem` at LC-INT-001 integration time — see
  // b1Map.js's B1_CAN_DO_INTENT comment for the collision this resolves.
  escalate_problem: ['problem', 'generic_object', 'place'],
  negotiate_solution: ['problem', 'generic_object'],
  // arc 5 — talk_about_plans_and_intentions ∪ talk_about_hopes_and_ambitions
  // ∪ talk_about_real_conditions ∪ imagine_a_hypothetical semanticNeeds (b1.json arc 5)
  state_future_intent: ['activity', 'time_point', 'day'],
  state_real_condition: ['activity', 'time_point'],
  state_hypothetical: ['activity'],
  // arc 6 — sustain_topic_change ∪ ask_follow_up_questions ∪
  // summarize_what_was_said semanticNeeds (b1.json arc 6)
  change_topic: ['activity', 'interest'],
  ask_follow_up: ['activity', 'interest'],
  summarize_other: ['activity', 'interest'],
}

export const b1SlotsFor = (intent) => B1_INTENT_SLOTS[intent] || []
