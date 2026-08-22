# LC-CONT-B2 — handoff / follow-up requests

Not a hard blocker to this task's own completion (LC-CONT-B2's write scope
is `levels/b2/**`, `scripts/foundry/b2/**`, `docs/curriculum/implementation/b2/**`
only, and everything in that scope is finished and self-validated). These
are the follow-ups the next task in the dependency graph — `LC-INT-001`
("Integrate A1-C2, run longitudinal learner journeys, and repair
integration defects") — needs, since its write scope is the one that
actually covers the shared engine.

## For `LC-INT-001`

Full itemized spec: `docs/curriculum/implementation/b2/core-engine-handoff.md`.
Summary:

1. **Registry wiring** — register `levels/b2/b2Capabilities.js`'s
   `B2_CAN_DO_INTENT` into `curriculum/levelMaps.js`; register the three
   proposed semantic types (`stance`, `problem_type`, `register`) into
   `engine/semanticContext.js`; add B2 episodes to `episodes/index.js`'s
   resolver.
2. **Evaluator dispatch** — 14 new intent evaluator functions in
   `engine/responseEvaluation.js`, against the exact worked-example spec in
   `levels/b2/b2Intents.js`. Includes implementing the actual scoring logic
   for the two shared dimensions `core-engine-requirements.md` already
   scaffolded (`registerAppropriateness`, `discourseCoherence`) — B2 is the
   first real consumer, per `levels/b2/b2EvaluationContracts.js`'s opt-in
   data and refusal-test fixtures.
3. **UI-adjacent tables** — `SessionRunner.jsx`'s `MODEL_ANSWER`/`PROMPT`,
   `formatChoice.js`'s `OBJECTIVE_FORMATS`.
4. **i18n** — `node scripts/foundry/b2/list-b2-i18n-keys.mjs` generates the
   exact key manifest; `i18n/**` is out of every content lane's scope.
5. **B2 release gate** — B2 must stay `available: false` even after wiring;
   a deliberate, separate gate is required (same pattern as A1's).

## Two design questions to resolve before wiring, not during it

1. `canDoForIntent()` in `levelMaps.js` assumes one intent maps to exactly
   one canDo. B2's capstone deliberately reuses `shift_register` and
   `propose_a_resolution` across multiple canDos via subtypes. Decide:
   generalize the lookup, or mint distinct intent ids instead.
2. `b2.json#/evaluationStrategy` names the `shift_register` intent (register
   formality) as the evaluator behind the capstone's topic-shift judgment
   too. Confirm this is intentional before building evaluator logic around
   it, or fix the blueprint naming first (see
   `docs/curriculum/implementation/b2/README.md` section 4).

## One blueprint-internal inconsistency, informational only

`b2.json#/reuseMatrix` marks `weigh_advantages_and_disadvantages` reused in
`when_plans_go_wrong`, but that arc's own `b2Reuse` list disagrees. No
evidence gap results (the capability's full evidence target is already met
in arc 1 + arc 6). Recorded in
`docs/curriculum/implementation/b2/README.md` section 4 and as an explicit
documented exception in `scripts/foundry/b2/check-b2-reuse-matrix.mjs`.
Worth reconciling in `b2.json` itself the next time that file is touched —
`docs/curriculum/blueprints/**` is not in this task's write scope.
