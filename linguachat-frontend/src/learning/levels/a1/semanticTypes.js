/*
 * A1 arc 6/7 semantic types — proposed, not registered.
 *
 * `engine/semanticContext.js`'s `SEMANTIC_TYPES`/`INTENT_SLOTS` registry is
 * shared, flat, out-of-scope infrastructure (`docs/curriculum/
 * curriculum-isolation-plan.md`'s survey names it explicitly). This task's
 * write scope does not include `engine/**`, so nothing here is registered —
 * see `docs/curriculum/implementation/a1/core-requirements.md` for the exact
 * ask to `LC-INT-001`, mirroring the pattern `levels/a2/semanticTypes.js`
 * already established.
 *
 * `activity`, `time_point` and `place` — the other three types arc 6/7 need
 * (`a1-blueprint.json#arcs[what_you_can_do,making_arrangements].semanticNeeds`)
 * — already exist in the engine's live registry (arc 1 registered `activity`,
 * arc 2 `time_point`, arc 4 `place`), so only `day` is proposed here.
 */

/*
 * `day` — `a1-blueprint.json#semanticTypes.proposed` entry, verbatim:
 * `requiredBy: ["arrange_to_meet"]`, examples `Monday`/`Friday`,
 * `incompatibleWith: ["time_point", "place"]` ("`on Monday` and `at seven` are
 * different slots with different prepositions; collapsing them would let the
 * engine build 'on seven'.").
 *
 * A2 already shipped its OWN `day` type (`levels/a2/semanticTypes.js`),
 * noting it is "reused-from-A1-proposal" — but with
 * `incompatibleWith: ['time_point', 'relation']`, not `['time_point',
 * 'place']`. That is a real, small divergence from A1's own blueprint text,
 * not reproduced here: this file follows `a1-blueprint.json` verbatim (per
 * CLAUDE.md, "the blueprint wins"), and `core-requirements.md` flags the
 * mismatch for LC-INT-001 to reconcile at the single point both levels'
 * proposals are merged into one registered type, rather than silently
 * forking a third variant here.
 */
export const A1_SEMANTIC_TYPES = {
  day: {
    requiredBy: ['arrange_to_meet'],
    examples: ['Monday', 'Friday'],
    incompatibleWith: ['time_point', 'place'],
    why: "`on Monday` and `at seven` are different slots with different prepositions; collapsing them would let the engine build 'on seven'.",
    validate(value) {
      const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      return DAYS.includes(String(value || '').trim().toLowerCase())
    },
  },
}

/*
 * Personalization: neither arc opts in. Both episode sets are the same
 * situation-first shape arc 6 and arc 7's own blueprint entries describe
 * ("the value is in the learner's own answers", "the level's closing
 * situation") with no `personalizationMode` declared — matching the
 * authoring contract's own rule that a template listing `canDoId`, an
 * `evalKind` or the required evidence as a personalisable slot is refused,
 * not obeyed. Declared explicitly (mode `none`) rather than omitted, so a
 * later reader does not have to re-derive "did this arc consider it and
 * decline, or just not get to it yet".
 */
export const A1_ARC_PERSONALIZATION = {
  what_you_can_do: { mode: 'none', slots: [], neutralFallback: null },
  making_arrangements: { mode: 'none', slots: [], neutralFallback: null },
}
