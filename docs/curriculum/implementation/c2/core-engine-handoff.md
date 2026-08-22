# C2 core-engine wiring handoff — for `LC-INT-001`

Everything `LC-CONT-C2` built (`docs/curriculum/implementation/c2/README.md`)
is content and self-validated data, deliberately not wired into the running
app because doing so requires editing shared-core files outside this task's
write scope (`linguachat-frontend/src/learning/levels/c2/**`,
`linguachat-frontend/scripts/foundry/c2/**`,
`docs/curriculum/implementation/c2/**` only). This document is the exact,
itemized spec for the task that owns the wider scope — `LC-INT-001`
("Integrate A1-C2, run longitudinal learner journeys, and repair
integration defects"), whose write scope already includes every file named
below.

Per the master contract (`curriculum-master-a1-c2.md` section 14): "when a
level worker discovers a shared-core need, it must raise the requirement
instead of quietly implementing a private workaround." This is that raise,
made as concrete as possible so the wiring is mechanical rather than a
second design pass. It folds in both the GENERAL registration wall every
`LC-CONT-*` lane hits (already documented in detail by `LC-CONT-B1`/`B2`'s
own handoffs) and the FOUR C2-specific gaps `c2.json#/coreEngineRequirements`
names, which no earlier level needed.

## 1. Why C2 content cannot run today

The shared engine's per-intent dispatch, prompt tables and item registries
are still flat, single-level structures — no `LC-CONT-*` lane's content is
wired in yet. Nothing knows a C2 intent, canDo id, pattern or level exists
until each of the following is done.

## 2. Registry wiring (mechanical, one line per registry)

- **`linguachat-frontend/src/learning/curriculum/levelMaps.js`**: add a
  `c2Map.js` file exporting `C2_CAN_DO_INTENT` (already built —
  `levels/c2/c2Capabilities.js` exports the exact payload) and one entry
  `{ levelId: C2, canDoIntent: C2_CAN_DO_INTENT }` to
  `LEVEL_CAN_DO_INTENT_MAPS`. **Caveat, same one B2 already flagged**:
  `canDoForIntent()` assumes one intent maps to exactly one canDo
  (first-match-wins). C2 breaks that assumption for nine capabilities that
  reuse an already-introduced intent under a subtype (`reformulate_for_audience`
  serves three capabilities, `recognize_implication` serves three,
  `shift_register` serves four, `edit_for_precision` serves two,
  `qualify_claim` serves two — see `c2Intents.js`'s `C2_INTENT_SUBTYPES`
  export for the full flattened list). `canDoForIntent()` needs a
  subtype-aware lookup (intent + subtype -> canDo) before C2's teaching
  content can resolve correctly.
- **`linguachat-frontend/src/learning/engine/semanticContext.js`**:
  register the four proposed semantic types from `levels/c2/c2Patterns.js`'s
  `C2_SEMANTIC_TYPES.proposed` (`source_text`, `audience_profile`,
  `register_level`, `stance_marker`). This is also
  `coreEngineRequirements[2]` — see section 4 below for the fuller spec,
  since `source_text` additionally needs scene-content support for a
  passage longer than any existing level assumes.
- **`linguachat-frontend/src/learning/engine/session.js`**: add C2's
  entries to `ITEM_KIND`/`ERROR_KIND`/`CANDO_KIND` alongside whatever
  fix lands first for the same live gap A1/B1/B2 already flagged.

## 3. Evaluator dispatch (the real design/implementation work)

- **`linguachat-frontend/src/learning/engine/responseEvaluation.js`**: add
  one evaluator function per C2 intent (13 total plus 5 subtype groups,
  `levels/c2/c2Intents.js` is the exact spec — every intent's `examples`
  object, INCLUDING the base `pragmaticallyInappropriate` category C2
  requires for every intent, per `c2.md` section 11) and wire them into the
  `evaluateFree` switch, following the existing Pre-A1/A1/B1/B2 pattern.
- **`registerAppropriateness` scoring**: implement real scoring for the
  five capabilities `levels/c2/c2EvaluationContracts.js`'s
  `C2_REGISTER_APPROPRIATENESS_OPT_IN` opts in
  (`shift_register_deliberately`, `manage_face_in_disagreement`,
  `edit_own_text_for_precision_and_tone`, `adapt_a_text_across_genre_and_register`,
  `mediate_a_complex_disagreement_for_a_third_party`), local-first against
  the declared register-pair pattern vocabulary, escalating to remote only
  when the local read is inconclusive.
- **`discourseCoherence` scoring**: implement real scoring for the four
  capabilities `c2EvaluationContracts.js`'s `C2_DISCOURSE_COHERENCE_OPT_IN`
  opts in (`sustain_coherence_across_topic_shifts`,
  `function_inside_an_unfamiliar_high_ambiguity_exchange`,
  `repair_a_misunderstanding_at_intention_level`,
  `mediate_a_complex_disagreement_for_a_third_party`).
  `c2EvaluationContracts.js`'s `C2_DISCOURSE_COHERENCE_REFUSAL_FIXTURES` is
  the exact test shape required before shipping: a `contradictory` case, a
  `flat_list` case, an `off_topic_drift` case, and a coherent control that
  must NOT fail — extended from B2's own two-clause precedent to a
  multi-turn span (section 4 below).
- **Honest structural-floor fallback**: `c2EvaluationContracts.js`'s
  `C2_STRUCTURAL_FLOOR_FALLBACK` declares the exact per-intent structural
  check to use when the provider is unreachable, for all ten hybrid
  intents `c2.json#/evaluationStrategy.hybrid` names — implement the
  three-tier contract (provider-graded when reachable; structural floor
  when not; the degraded state surfaced honestly, never silently accepted
  or silently downgraded), same discipline B1/B2 already established.
- **Meaning-preserved reformulation/summary checking**:
  `c2EvaluationContracts.js`'s `C2_MEANING_PRESERVATION_STRUCTURAL_FLOOR`
  declares the three-tier contract for `reformulate_for_audience` (base,
  `summarize` and `paraphrase` subtypes) — provider-graded
  meaning-equivalence as the primary path, a non-verbatim + marker-presence
  structural floor otherwise. Every arc-2/arc-8 `free_reply` step needing
  this carries `sourceRef: true` and sits immediately after a `scene` step
  with a `sourceTextEn` field — that is the source text to compare against.

## 4. The four C2-specific `coreEngineRequirements`

These are genuinely new — no earlier `LC-CONT-*` lane needed them.

1. **Multi-turn evaluation span** (`c2.json#/coreEngineRequirements[0]`).
   Several C2 intents (`sustain_coherence` — both the base intent and its
   `unfamiliar_exchange` subtype — plus `mediate_disagreement`, plus the
   documented exception `repair_at_intention_level`) need evaluation across
   a span of turns, not just the latest learner message. The exact contract:
   an evaluator invoked for a step carrying `evaluationSpan: 'multiTurn'`
   receives that step's `turnContext` array (`{ speaker, textEn }[]`, the
   preceding turn(s)) alongside the learner's new turn.
   `c2EvaluationContracts.js`'s `C2_MULTI_TURN_SPAN_FIXTURES` declares the
   `spanKind` per capability (`topic_bridge`, `misread_then_repair`,
   `full_dispute_plus_mediation`) and the minimum turn count each needs —
   `scripts/foundry/c2/check-c2-multi-turn-spans.mjs` already proves every
   one of these capabilities has real authored steps matching the spec.
   **Must not change per-turn evaluation for any existing level** — an
   additive mode, invoked only when a step declares it.
2. **Provider-free hybrid fixtures** (`coreEngineRequirements[1]`).
   `recognize_implication`, `shift_register` and `qualify_claim` are hard
   to judge with pure string matching, but CI/QA must stay provider-free
   (`ai/provider_policy.py`). Extend the local/fake provider fixture set
   with deterministic canned judgments for every C2 hybrid intent — every
   intent's `examples` in `c2Intents.js` (correct / natural variant / near
   miss / wrong meaning / nonsense / pragmatically inappropriate) is the
   exact fixture material to build these against.
3. **`source_text`/`audience_profile`/`register_level`/`stance_marker`
   semantic types plus longer scene-content support**
   (`coreEngineRequirements[2]`). Register the four types (section 2
   above); additionally, `source_text` needs scene-content support for a
   passage longer than any existing level's single-sentence assumption —
   every arc 1/2/8 `sourceTextEn`/`sourceTextBEn` field is 1-4 sentences,
   not one clause. Scene rendering/i18n must not silently break for
   shorter existing scenes (additive change only).
4. **Multi-capability delayed retrieval per task**
   (`coreEngineRequirements[3]`). The capstone (arc 8, the level's only
   `evidence.delayedRetrieval: true` capability) requires SEVEN other
   required/should capabilities' delayed-retrieval evidence recorded
   inside the SAME task completion — `learnerModel.js` currently records
   at most one `evidenceKind` per completion. `c2EvaluationContracts.js`'s
   `C2_CAPSTONE_DELAYED_RETRIEVAL_CHECKS` names the exact seven capability
   ids; `levels/c2/arcs/c2Arc8IntegratedMediation.js`'s `MEDIATE_01`
   episode already authors one short retrieval-check turn per capability,
   immediately before the main independent mediation attempt, plus the
   main attempt's own `delayedRetrievalChecks` array naming all seven —
   this is the exact runtime contract to implement against. Schema change
   must be additive only; existing single-capability episodes (every
   earlier level) must record identically.

## 5. UI-adjacent tables

- **`linguachat-frontend/src/components/session/SessionRunner.jsx`**: add
  C2's 13 intents (plus subtype-aware entries where a subtype needs a
  distinct model answer) to the `MODEL_ANSWER`/`PROMPT` tables.
- **`linguachat-frontend/src/learning/engine/formatChoice.js`**: add C2's
  intents to `OBJECTIVE_FORMATS`.

## 6. Registration into the level/episode system

- **`linguachat-frontend/src/learning/episodes/index.js`** (or whatever
  `LC-INT-001` decides is the per-level equivalent by then): register C2's
  eight arc content modules (`levels/c2/arcs/c2Arc{1..8}*Content.js`, each
  already exporting `getEpisode(id)` per the existing convention).
- **C2's product-availability gate**: C2 must stay `available: false` even
  after wiring — a separate, deliberate C2 release gate is required, and
  since C2 is the terminal level, this gate is also load-bearing for
  whatever "all seven levels complete" product statement A1-C2 eventually
  makes. Wiring the engine is not that gate.

## 7. i18n

`i18n/**` is out of every content lane's write scope. Run
`node scripts/foundry/c2/list-c2-i18n-keys.mjs` from `linguachat-frontend/`
for the exact, mechanically-generated list (558 unique keys as of this
task) of every `*Key` C2 content references — populate these across every
supported locale before C2 content is reachable, matching the existing
per-episode key-prefix convention (`c2ep1`-`c2ep29`, disjoint from every
other level's range).

## 8. Design questions worth resolving before wiring, not during it

1. **`canDoForIntent()`'s one-intent-per-canDo assumption** (section 2) —
   the same open question B2's own handoff already raised, now with more
   capabilities depending on the answer. Decide whether to generalize the
   lookup to accept a subtype qualifier, or mint distinct intent ids
   instead (a `c2.json` edit). Either is workable; picking one before
   wiring `levelMaps.js` avoids building against an assumption that has to
   be undone.
2. **The register/discourse-coherence opt-in tables in
   `c2EvaluationContracts.js` are this task's own authored design choice**,
   not a verbatim blueprint field (see that file's header comment and
   `README.md` section 4) — worth a deliberate human/second-opinion check
   before building real scoring logic against it, since c2.json itself
   does not commit to exactly these five/four capabilities the way b2.json
   commits to its own three-and-three.
