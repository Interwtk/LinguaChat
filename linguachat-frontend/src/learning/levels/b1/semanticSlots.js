/*
 * b1/semanticSlots — B1's own `INTENT_SLOTS` additions, additive-only, same
 * shape as `engine/semanticContext.js`'s `INTENT_SLOTS` (survey: one
 * array-of-accepted-types per intent, explicit `[]` for "no personalized
 * slot" rather than omission). `engine/**` is out of this task's write scope;
 * `LC-INT-001` merges these keys into the real `INTENT_SLOTS`.
 *
 * `B1_NEW_SEMANTIC_TYPES` below registers B1's one genuinely new type,
 * `problem` (arc 4, `somethings_wrong`), self-contained the same way — it is
 * NOT `engine/semanticContext.js`'s real `SEMANTIC_TYPES` (out of write
 * scope), but the exact shape `LC-INT-001` needs to merge one in: matches
 * b1.json's own `semanticTypes.proposed[0]` entry, already reconciled with
 * B2's `problem_type`/C1's `negotiated_item` in
 * `docs/curriculum/semantic-types.md`.
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
  // express_frustration_politely semanticNeeds (b1.json arc 4)
  report_problem: ['problem', 'generic_object', 'place'],
  negotiate_solution: ['problem', 'generic_object'],
}

export const b1SlotsFor = (intent) => B1_INTENT_SLOTS[intent] || []
