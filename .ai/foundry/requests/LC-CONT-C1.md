# LC-CONT-C1 — handoff / follow-up requests

Not a hard blocker to this task's own completion (LC-CONT-C1's write scope
is `levels/c1/**`, `scripts/foundry/c1/**`, `docs/curriculum/implementation/c1/**`
only, and everything in that scope is finished and self-validated). These
are the follow-ups the next task in the dependency graph — `LC-INT-001`
("Integrate A1-C2, run longitudinal learner journeys, and repair
integration defects") — needs, since its write scope is the one that
actually covers the shared engine.

## For `LC-INT-001`

Full itemized spec: `docs/curriculum/implementation/c1/core-engine-handoff.md`.
Summary:

1. **Registry wiring** — register `levels/c1/c1Capabilities.js`'s
   `C1_CAN_DO_INTENT` into `curriculum/levelMaps.js`; register
   `negotiated_item` (a superset of B1's existing `problem` type) into
   `engine/semanticContext.js`; add C1's seven arc content modules to
   `episodes/index.js`'s resolver.
2. **Evaluator dispatch** — 12 new intent evaluator functions in
   `engine/responseEvaluation.js`, against the exact worked-example spec in
   `levels/c1/c1Intents.js`. Includes implementing real scoring logic for
   THREE shared dimensions, two of them used as REQUIRED (not
   should-relevant, unlike B2's use of the same two fields):
   `registerAppropriateness` (six capabilities, four required),
   `discourseCoherence` (six capabilities, four required), and the new
   `conversation_state_tracking` dimension C1 raises for the first time
   (a session-scoped conversation-history buffer for
   `refer_back_to_earlier_discourse`) — per
   `levels/c1/c1EvaluationContracts.js`'s opt-in data and refusal/fixture
   sets.
3. **UI-adjacent tables** — `SessionRunner.jsx`'s `MODEL_ANSWER`/`PROMPT`,
   `formatChoice.js`'s `OBJECTIVE_FORMATS`.
4. **i18n** — `node scripts/foundry/c1/list-c1-i18n-keys.mjs` generates the
   exact key manifest; `i18n/**` is out of every content lane's scope.
5. **C1 release gate** — C1 must stay `available: false` even after wiring;
   a deliberate, separate gate is required (same pattern as A1's and B2's).

## Design questions to resolve before wiring, not during it

1. `conversation_state_tracking`'s buffer lifetime must be compatible with
   however session state is persisted/replayed elsewhere — a buffer that
   leaks across a replayed attempt would let a learner "remember" an answer
   from their first attempt, breaking `c1.json#/qaAcceptance`'s replay/
   idempotency requirement.
2. Confirm `registerAppropriateness`/`discourseCoherence` scoring actually
   differentiates `graduationRelevance` per capability (both this level's
   and B2's own evaluation-contract files already declare it per-capability,
   not globally) before sharing one evaluator code path between a
   should-relevant B2 capability and a required C1 one.

## Blueprint-internal inconsistencies found, informational only

All three are documented in `docs/curriculum/implementation/c1/README.md`
section 4 and as explicit, non-silent exceptions in the relevant
`scripts/foundry/c1/check-c1-*.mjs` script. None caused a missing-evidence
gap; `docs/curriculum/blueprints/**` is not in this task's write scope, so
none were "fixed" by editing the blueprint:

1. `weigh_implications_of_a_position`'s own `c1.json` prerequisite field
   still reads the pre-reconciliation id `b2_weigh_advantages_and_disadvantages`
   (`crossLevelPrerequisite: "assumed"`), while `c1.md`'s prose describes
   this row as already resolved to `b2.weigh_advantages_and_disadvantages`.
2. `use_cohesive_devices_across_a_turn`'s own `reuseContexts` field names
   three arcs, but `c1.json#/reuseMatrix` and those arcs' own
   `capabilitiesReused` lists (which agree with each other) name only one.
3. `c1.json#/capabilities[].productiveVocabulary`/`receptiveVocabulary` sum
   to 200/236 across the level — well above the level-wide
   `languageInfrastructure.vocabularyBudget` estimate range ("90-110"/
   "160-200"). The blueprint's own note explicitly authorizes this task to
   reconcile it during authoring; `c1Vocabulary.js`'s header documents the
   exact per-arc allocation used.
