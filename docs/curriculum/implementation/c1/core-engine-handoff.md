# C1 core-engine wiring handoff — for `LC-INT-001`

Everything `LC-CONT-C1` built (`docs/curriculum/implementation/c1/README.md`)
is content and self-validated data, deliberately not wired into the running
app because doing so requires editing shared-core files outside this task's
write scope (`linguachat-frontend/src/learning/levels/c1/**`,
`linguachat-frontend/scripts/foundry/c1/**`,
`docs/curriculum/implementation/c1/**` only). This document is the exact,
itemized spec for the task that owns that wider scope — `LC-INT-001`
("Integrate A1-C2, run longitudinal learner journeys, and repair integration
defects"), whose write scope already includes every file named below.

Per the master contract (`curriculum-master-a1-c2.md` section 14): "when a
level worker discovers a shared-core need, it must raise the requirement
instead of quietly implementing a private workaround." This is that raise,
made as concrete as possible so the wiring is mechanical rather than a
second design pass. Much of this mirrors
`docs/curriculum/implementation/b2/core-engine-handoff.md`'s own structure —
C1 hits the same wall B2 already documented, plus three items specific to
C1's own required-not-should evaluator dimensions.

## 1. Why C1 content cannot run today

Same root cause `curriculum-isolation-plan.md` already documents for B2: the
shared engine's per-intent dispatch, prompt tables and item registries are
still flat, single-level structures. Nothing knows a C1 intent, canDo id,
pattern or level exists until each of the following is done:

## 2. Registry wiring (mechanical, one line per registry)

- **`linguachat-frontend/src/learning/curriculum/levelMaps.js`**: add a
  `c1Map.js` file exporting `C1_CAN_DO_INTENT` (already built —
  `levels/c1/c1Capabilities.js` exports the exact payload) and one entry
  `{ levelId: C1, canDoIntent: C1_CAN_DO_INTENT }` to
  `LEVEL_CAN_DO_INTENT_MAPS`. Unlike B2's capstone-subtype reuse, C1's map is
  a clean one-capability-per-intent mapping EXCEPT
  `clarify_an_ambiguous_instruction_precisely`, whose intent id
  (`clarify_ambiguity`) is itself one of `c1.json#/evaluationIntents`'s 12
  listed entries but whose evaluator MECHANISM is a `repairKind:
  ask_for_precision` subtype of the existing `repair_request` family (see
  `c1Intents.js`'s `clarify_ambiguity` entry and its `intentReuse` field) —
  `canDoForIntent()`'s one-intent-per-canDo assumption is NOT broken by C1
  the way B2's capstone broke it, so no lookup generalization is required
  here.
- **`linguachat-frontend/src/learning/engine/semanticContext.js`**: register
  `negotiated_item` from `levels/c1/c1Patterns.js`'s `C1_SEMANTIC_TYPES`. Per
  `docs/curriculum/semantic-types.md` section 2 (already resolved by
  `LC-AUD-001`/`LC-FND-002`), register this as a SECOND semantic type whose
  accepted values are a superset of B1's existing `problem` type's values
  (every `problem` value is a valid `negotiated_item` value, plus C1's own
  problem-free examples — a time slot, a compromise plan) — do NOT collapse
  the two into one type, since that would let `problem`-scoped capabilities
  accept a calendar slot as if it were a malfunction.
- **`linguachat-frontend/src/learning/engine/session.js`**: C1's items are
  currently invisible to `ITEM_KIND`/`ERROR_KIND`/`CANDO_KIND` — add C1's
  entries alongside whatever A1/A2/B1/B2 fix lands first.

## 3. Evaluator dispatch (the real design/implementation work)

- **`linguachat-frontend/src/learning/engine/responseEvaluation.js`**: add
  one evaluator function per C1 intent (12 total, `levels/c1/c1Intents.js`
  is the exact spec — each intent's `examples` object is the worked
  correct/variant/near-miss/wrong-meaning/nonsense set, plus
  insufficient-form/pragmatically-inappropriate cases where declared, that an
  evaluator function must be able to discriminate) and wire them into the
  `evaluateFree` switch, following the existing Pre-A1/A1/B2 pattern.

- **`registerAppropriateness` scoring, as REQUIRED (not should-relevant)** —
  the key difference from B2's use of this same shared field
  (`core-engine-requirements.md` section 2): implement real scoring for the
  six capabilities `levels/c1/c1EvaluationContracts.js`'s
  `C1_REGISTER_APPROPRIATENESS_OPT_IN` opts in
  (`adapt_register_to_audience`, `hedge_and_mitigate_a_statement`,
  `disagree_diplomatically`, `repair_a_register_slip`,
  `reformulate_for_a_different_audience`, `shift_register_within_one_conversation`),
  local-first against the declared register-pair pattern vocabulary
  (`register_pair_pattern`, `mitigation_device_pattern`,
  `concessive_clause_pattern`), escalating to remote only when the local read
  is inconclusive. Four of these six are `graduationRelevance: 'required'` —
  a wrong-register answer must be gradable as its own distinguishable failure
  mode (not folded into "wrong"), consistent with c1.md section 9's rule
  that "a C1 response may be grammatically correct and still fail its target
  if register or pragmatic force is inappropriate."

- **`discourseCoherence` scoring, also REQUIRED from Arc E onward** — real
  scoring for the six capabilities `c1EvaluationContracts.js`'s
  `C1_DISCOURSE_COHERENCE_OPT_IN` opts in
  (`produce_an_extended_structured_explanation`,
  `use_cohesive_devices_across_a_turn`, `self_correct_without_losing_the_thread`,
  `open_and_close_an_extended_turn`, `sustain_a_conversation_across_topic_shifts`,
  `close_a_complex_interaction_with_a_summary`), extending A2's own
  two-clause precedent to N sentences per `core-engine-requirements.md`
  section 3. `c1EvaluationContracts.js`'s `C1_DISCOURSE_COHERENCE_REFUSAL_FIXTURES`
  is the exact test shape required before shipping: a `contradictory` case,
  a `flat_list` case, an `off_topic_drift` case, and a coherent control that
  must NOT fail — `c1Arc5ExtendedStructuredDiscourse.js`'s EP2 (`comprehension`/
  `choice` steps) already carries worked examples of the `flat_list` and
  `contradictory` shapes to test against.

- **`conversation_state_tracking` (NEW, C1-only — not shared with B2)** —
  `c1.json#/coreEngineRequirements` raises this as a THIRD, separate
  dimension from `discourseCoherence` (`core-engine-requirements.md` section
  3 explicitly keeps it separate: "coherent within a turn" vs. "accurately
  references an earlier turn" are different mechanisms with different costs
  — session-scoped storage, not just multi-clause parsing). Implement a
  bounded conversation-history buffer, scoped to a single episode run, that
  `refer_back_to_earlier_discourse`'s evaluator can check a later turn's
  reference against. `c1EvaluationContracts.js`'s
  `C1_CONVERSATION_STATE_TRACKING_FIXTURES` is the exact fixture spec: a
  `correct_reference` case (must pass), a `vague_reference` case (must fail
  with `insufficient_specificity`), and a `misattributed_reference` case
  (must fail with `misattributed`). `c1Arc7SustainedInteraction.js`'s EP2
  (`refer_back_to_earlier_discourse`'s teaching episode) is the exact content
  this fixture spec was authored against.

- **Honest structural-floor fallback** for open, paragraph-length
  argumentative/negotiation/extended-explanation turns:
  `c1EvaluationContracts.js`'s `C1_STRUCTURAL_FLOOR_FALLBACK` declares the
  per-intent structural check to use when the provider is unreachable —
  implement the same three-tier contract B2's handoff already specifies
  (provider-graded when reachable; structural floor when not; the degraded
  state surfaced honestly, never silently accepted or downgraded).

- **Meaning-preserved reformulation/summary checking**:
  `c1EvaluationContracts.js`'s `C1_MEANING_PRESERVATION_STRUCTURAL_FLOOR`
  declares the same three-tier contract for `summarize_message` and
  `synthesize_viewpoints` — provider-graded meaning-equivalence as the
  primary path, a non-verbatim + marker-presence structural floor otherwise.
  Every Arc C `free_reply` step needing this carries `sourceRef: true` and
  sits immediately after a `scene` step with a `sourceTextEn` field (the
  same convention B2's arc 4 already established) — that's the source text
  to compare against.

## 4. UI-adjacent tables

- **`linguachat-frontend/src/components/session/SessionRunner.jsx`**: add
  C1's 12 intents to the `MODEL_ANSWER`/`PROMPT` tables — treat every C1
  intent as required here, not optional, per the same documented regression
  risk B2's handoff already flags.
- **`linguachat-frontend/src/learning/engine/formatChoice.js`**: add C1's
  intents to `OBJECTIVE_FORMATS`.

## 5. Registration into the level/episode system

- **`linguachat-frontend/src/learning/episodes/index.js`** (or whatever
  `LC-INT-001` decides is the per-level equivalent by then): register C1's
  seven arc content modules (`levels/c1/arcs/c1Arc{1..7}*Content.js`, each
  already exporting `getEpisode(id)` per the existing convention). Arc 7
  registers its `variant: 'themed'`/`variant: 'neutral'` capstone pair as the
  personalization-slot resolution point, the same as B2's arc 6.
- **C1's product-availability gate**: C1 must stay `available: false`
  (`c1.md` section 1) even after wiring — a separate, deliberate C1 release
  gate is required, exactly like A1's own gate in `a1-map.md` section 14 and
  B2's own note in its handoff.

## 6. i18n

`i18n/**` is out of every content lane's write scope. Run
`node scripts/foundry/c1/list-c1-i18n-keys.mjs` from `linguachat-frontend/`
for the exact, mechanically-generated list of every `*Key`/`glossKey` C1
content references — populate these across every supported locale before C1
content is reachable, matching the existing per-episode key-prefix
convention (`c1ep1`-`c1ep36`, disjoint from `ep1`-`ep38`'s Pre-A1/A1 range,
`a2ep*`'s A2 range and `b2ep1`-`b2ep21`'s B2 range, and `c1Vocab_*` for
vocabulary glosses).

## 7. `mini_story` (optional enhancement, not a blocker)

No C1 arc uses `type: 'mini_story'` steps, for the same reason B2's own
handoff documents — it requires a `storyObjective` registered in
`engine/miniStory.js`'s shared-core `STORIES` table, out of scope here.
Every arc's content works today with plain `scene` steps instead.

## 8. Design questions worth resolving before wiring, not during it

1. **`registerAppropriateness`/`discourseCoherence` as REQUIRED, not
   should-relevant.** B2 uses these two shared fields as capstone-only
   should-relevant signals; C1 uses them as graduation-relevant required
   dimensions from their respective arcs onward. Confirm the shared scoring
   implementation actually differentiates `graduationRelevance` per
   capability (both `c1EvaluationContracts.js` and B2's own
   `b2EvaluationContracts.js` already declare this per-capability, not
   globally) before wiring, so a should-relevant B2 capability and a
   required C1 capability sharing the same evaluator code path do not
   silently get the same graduation treatment.
2. **`conversation_state_tracking`'s storage scope.** Confirm the bounded
   conversation-history buffer's lifetime (single episode run, per
   `c1EvaluationContracts.js`) is compatible with however session state is
   actually persisted/replayed elsewhere in the engine, particularly for the
   replay/idempotency requirement (`c1.json#/qaAcceptance`: "replay/
   idempotency tests") — a buffer that leaks across replays would let a
   learner's replayed attempt "remember" an answer from the first attempt.
3. **`use_cohesive_devices_across_a_turn`'s reuseContexts mismatch** (see
   `README.md` section 4) is a `docs/curriculum/blueprints/**` fix, not a
   wiring concern — cheap to fix whenever `c1.json` next gets a maintenance
   pass, does not block wiring against the content as authored.
