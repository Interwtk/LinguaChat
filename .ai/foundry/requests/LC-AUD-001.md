# LC-AUD-001 — handoff to LC-FND-002

## Status

`docs/curriculum/cross-level-audit.md` and `docs/curriculum/cross-level-audit.json`
are complete: a deterministic cross-check of all six A1-C2 level blueprints
against `curriculum-master-a1-c2.md`, `level-blueprint-template.md`, and each
other. Thirteen findings, three high-severity id collisions, nineteen broken
cross-level prerequisite strings (each with a concrete recommended real-id
replacement), one full-level CEFR-reference gap, two CORE-requirement
duplication risks, one semantic-type fragmentation risk and two pattern-id
reuse risks with genuine spacing/false-mastery implications. Full detail,
confidence levels and reasoning are in `cross-level-audit.json`'s `findings`
array and `cross-level-audit.md`'s narrative.

This document exists because `LC-AUD-001`'s write scope is exactly
`docs/curriculum/cross-level-audit.md` and `docs/curriculum/cross-level-audit.json`
— it has no permission to edit the blueprint files (`docs/curriculum/blueprints/**`)
that actually need the fixes it identified. Per the coordination contract, a
scoped-out required change must be recorded here rather than made quietly.

## What LC-FND-002 needs to do with this

`LC-FND-002` ("Isolate shared curriculum infrastructure for collision-free
parallel authoring") depends on `LC-AUD-001` and its write scope already
includes `docs/curriculum/**`, making it the natural home for these fixes
alongside its core-infrastructure work. In priority order:

1. **Resolve the three id collisions** (`cross-level-audit.json` F1, F2, F3):
   rename B1's `report_a_problem`, decide C1's `infer_implied_meaning`
   relationship to B2's should-scope capability of the same name, and resolve
   C1/C2's duplicate `reformulate_for_a_different_audience` claim (including
   C2's "first mediation task" prose, which is currently false).
2. **Apply the nineteen prerequisite-string fixes** (F4, F5, F6) — each has an
   exact old-id → new-id mapping in the JSON, all but one at high or medium
   confidence. The one low-confidence mapping (C2's
   `sustain_coherence_across_topic_shifts` → C1's assumed
   `handle_abstract_topics`) needs a human curriculum-design call, not a
   mechanical rename, and should not be auto-applied.
3. **Add CEFR references to all 19 A2 capabilities** (F7) — the only level
   currently missing this required field entirely.
4. **Consolidate the duplicate CORE asks** (F8) — one register-appropriateness
   dimension and one discourse-coherence-scoring path in the shared evaluator,
   not two independent implementations from B2 and C1's separate requests.
5. **Reconcile the problem/negotiation semantic-type family** (F9) before
   building C1's proposed `negotiated_item` type — check whether it can extend
   B1's `problem` / B2's `problem_type` rather than becoming a fourth
   independent type.
6. **Give C2's academic-register hedging form its own pattern id** (F11) and
   mark B1's reuse of A2's `because_reason_pattern` as reuse rather than a
   second introduction (F10), so the spaced-retrieval engine cannot credit
   mastery of language a learner was never actually taught.

## What this does not resolve

This audit is a design-artifact consistency check. It does not implement any
of the four CORE-engine requirements C1 raised in its own request document
(`register_appropriateness_scoring`, `discourse_coherence_scoring`,
`conversation_state_tracking`, `negotiated_item_semantic_type` —
`.ai/foundry/requests/LC-BP-C1.md`), nor B2's equivalent list. Those remain
`LC-FND-002` implementation work. It also does not certify pedagogical
approval of any level or real-learner efficacy — see the disclaimer in
`cross-level-audit.md`.
