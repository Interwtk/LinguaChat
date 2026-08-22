/*
 * b1/semanticSlots — B1's own `INTENT_SLOTS` additions, additive-only, same
 * shape as `engine/semanticContext.js`'s `INTENT_SLOTS` (survey: one
 * array-of-accepted-types per intent, explicit `[]` for "no personalized
 * slot" rather than omission). `engine/**` is out of this task's write scope;
 * `LC-INT-001` merges these keys into the real `INTENT_SLOTS`.
 *
 * No new `SEMANTIC_TYPES` entries needed for arc 1: `place`, `activity` and
 * `feeling` (b1.json arc 1 `semanticNeeds`) are already registered by A1.
 * B1's one genuinely new type, `problem` (arc `somethings_wrong`, already
 * reconciled in `docs/curriculum/semantic-types.md`), lands when that arc's
 * module does.
 */
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
}

export const b1SlotsFor = (intent) => B1_INTENT_SLOTS[intent] || []
