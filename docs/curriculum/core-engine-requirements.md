# Consolidated shared-evaluator CORE requirements (register + discourse-coherence)

Design decision record for the two evaluator dimensions B2 and C1 each independently requested,
per `docs/curriculum/cross-level-audit.json` finding F8. Both are shared-core per the master contract
(`curriculum-master-a1-c2.md` §18, "response evaluation semantics"), so a level worker who discovers
the need raises it here rather than each lane building its own private evaluator path.

This is a design decision record, not runtime code. `linguachat-frontend/src/learning/engine/`
implements the decisions below when a level with runtime content actually needs the dimension; no
evaluator behaviour here is live until then. Today's engine (per the architecture survey done for
`LC-FND-002`'s code-isolation work) has no register-appropriateness dimension beyond one hardcoded
special case (`evaluatePoliteRequest`'s `previous_structure` errorType) and no discourse-coherence or
conversation-state-tracking dimension at all — every evaluator function judges one single-utterance
`text` against one target frame.

---

## 1. What B2 and C1 each asked for

**B2** (`blueprints/b2.json coreEngineRequirements`) raised `discourse_coherence_evaluation` (needed
from arc 5, "judge whether a turn coherently continues a multi-turn exchange, not only whether it
matches a canonical per-turn intent frame", affecting `sustain_a_multi_topic_conversation`,
`handle_a_topic_shift_gracefully`, `negotiate_an_agreement_under_pushback`) and
`register_appropriateness_dimension` (needed from arc 5, "grade a semantically/grammatically correct
reply as register-inappropriate for its context, as a separate verdict from the semantic one",
affecting `adjust_register_to_context`, `soften_or_strengthen_a_statement`,
`negotiate_an_agreement_under_pushback`), both marked should-relevant/capstone-relevant rather than
required across the whole level.

**C1** (`blueprints/c1.json coreEngineRequirements`, also `.ai/foundry/requests/LC-BP-C1.md`) raised
`discourse_coherence_scoring` (needed from Arc E, `extended_structured_discourse`, "evaluate whether
several linked sentences in one turn cohere", affecting `use_cohesive_devices_across_a_turn` and
discourse-tracking capabilities) and `register_appropriateness_scoring` (needed from Arc B,
`register_and_diplomacy`, "a response marked wrong or partially credited for wrong register even when
intent and grammar are correct"), both required from the arc onward, not optional.

These are the same two underlying evaluator capabilities, authored in parallel lanes with no
cross-reference to each other (LC-AUD-001 F8). Building two incompatible implementations — one from
each lane's own vocabulary and API shape — was the risk this document heads off.

## 2. One register-appropriateness dimension

**Shape:** a new, independent verdict field alongside the existing `completedObjective` (intent-match
correctness), not a replacement for it and not folded into it. A reply can be `completedObjective:
true` and simultaneously register-inappropriate; the two must be separately inspectable so a learner
can be told "that's correct, but here's why it doesn't fit who you're talking to" rather than a single
conflated pass/fail.

- **Field:** `registerAppropriateness: { checked: boolean, appropriate: boolean | null, expectedRegister: string | null, detectedRegister: string | null }`. `checked: false` (with the other fields `null`) is the explicit default for every level below B2's capstone arc — additive, not a behaviour change for A1/A2/B1.
- **Scoring is per-capability opt-in**, not global: a capability's evaluator declares whether it exercises this dimension (B2's should-relevant capstone capabilities; C1's required Arc B-onward capabilities), matching the "defaults to not-scored/not_applicable below C1" instruction both B2 and C1 already gave independently.
- **Local-first, same escalation contract as every other dimension:** the shared local evaluator (`responseEvaluation.js`'s per-intent functions) judges register from a declared closed register-pair vocabulary for the capability (formal/informal lexical and structural markers already named in B2's `register_pair_pattern`/C1's `register_pair_pattern`), escalating to remote only when the local read is inconclusive — never a dimension that requires the provider to be reachable, consistent with the master's local-first evaluation rule.
- **B2 vs. C1 usage of the same field:** B2 uses it as should-relevant (a capstone signal, not a graduation blocker); C1 uses it as required from Arc B onward. Same field, same shape, different `graduationRelevance` per capability — this is exactly how B1/B2 already differentiate required vs. should capabilities without needing two evaluator APIs.

## 3. One discourse-coherence-scoring path

**Shape:** an evaluator entry point that accepts a **multi-sentence turn** (not a single canonical
frame) and returns a coherence verdict plus per-capability credit, extending the shared dispatcher
(`evaluateFree(kind, text, ctx)` / `evaluateEpisodeResponse(params)`) rather than replacing it.

- **Field:** `discourseCoherence: { checked: boolean, coherent: boolean | null, clausesEvaluated: number | null, incoherenceType: string | null }`, with `incoherenceType` a closed set (`flat_list` — sentences correct individually but not linked; `contradictory` — later sentences contradict earlier ones; `off_topic_drift` — later sentences abandon the turn's own topic without a signalled change). `checked: false` is the default below the level that first needs it.
- **Scoring method, inherited from A2's own two-clause precedent:** A2 already established (its own `coreEngineRequirements`, "Extend the shared local evaluator to accept a declared two-clause canonical shape") that a multi-clause turn can be scored locally as: each clause matches its own declared frame, connectors are from the taught closed set, no clause contradicts an earlier one. Discourse-coherence scoring generalizes this from two clauses to N sentences within one turn — B2's arc 5 and C1's Arc E are the same underlying mechanism at larger scale, not a new mechanism.
- **Explicit refusal tests required before any consumer ships** (carried from both B2's and C1's own risk notes, now unified): correct-sentence-1 + contradictory-sentence-2 must fail with `incoherenceType: contradictory`; N correct, unconnected sentences must fail with `flat_list`; a genuinely coherent multi-sentence turn using the taught cohesive-device vocabulary must pass. This is a medium-regression-risk change to shared evaluator plumbing (per B2's own risk note) and must not alter scoring for any existing single-utterance step type.
- **Relationship to conversation-state tracking:** C1 separately raised `conversation_state_tracking` (crediting a reference to something said several turns *earlier in the session*, e.g. `refer_back_to_earlier_discourse`). This is a **different, later** requirement — discourse-coherence scoring is within one turn; conversation-state tracking is across turns via a bounded history buffer. C1's own proposed shape (a session-scoped conversation-history buffer the evaluator can check a later turn against) stays as C1 raised it; this document does not merge it into discourse-coherence scoring, since collapsing "coherent within a turn" and "accurately references an earlier turn" into one mechanism would understate the state-tracking requirement's real cost (session-scoped storage, not just multi-clause parsing).

## 4. What this does not do

Neither dimension is implemented by this document. `docs/curriculum/**` is a design-artifact write
scope; the shared evaluator implementation is `linguachat-frontend/src/learning/engine/` code, to be
built when a level with runtime content first needs it (earliest: B2's capstone arc, if B2 content
work lands before C1's). This document exists so that implementation, whenever it happens, builds one
register-appropriateness dimension and one discourse-coherence-scoring path — not two per level — per
LC-AUD-001 F8's finding and the master contract's shared-core rule.
