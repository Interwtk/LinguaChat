# C1 implementation status — `LC-CONT-C1`

**Status: content authored, self-validated, NOT wired into the running app.**
C1 stays exactly as unavailable to a learner as it was before this task —
nothing here is imported by any runtime module, no episode is reachable
through the UI, and `docs/curriculum/blueprints/c1.md`'s own
`Product availability: false until a dedicated C1 release gate` line is
unaffected by anything in this document.

This document is the honest handoff a reader needs: what was built, how it
was checked, and exactly what remains before a learner could ever see C1
content — most of which is deliberately **not** this task's job, per its
write scope (`linguachat-frontend/src/learning/levels/c1/**`,
`linguachat-frontend/scripts/foundry/c1/**`,
`docs/curriculum/implementation/c1/**` — see `.ai/foundry/tasks.json`).

## 1. What's built

Seven arcs, matching `docs/curriculum/blueprints/c1.json` exactly (verified
mechanically, see section 2):

| arc | id | episodes | new capabilities |
|---|---|---|---|
| 1 | `abstract_argument` | 5 | `develop_a_structured_argument`, `qualify_a_claim_precisely`, `concede_a_counterpoint_gracefully`, `weigh_implications_of_a_position` |
| 2 | `register_and_diplomacy` | 5 | `adapt_register_to_audience`, `hedge_and_mitigate_a_statement`, `disagree_diplomatically`, `repair_a_register_slip` |
| 3 | `synthesis_and_mediation` | 5 | `summarize_a_complex_message_for_a_new_audience`, `synthesize_two_conflicting_viewpoints`, `reformulate_for_a_different_audience`, `paraphrase_to_avoid_repetition` |
| 4 | `nuance_and_implication` | 5 | `infer_implied_meaning_in_unfamiliar_context`, `express_degrees_of_certainty`, `hold_a_nuanced_stance`, `recognize_understatement_or_irony` |
| 5 | `extended_structured_discourse` | 5 | `produce_an_extended_structured_explanation`, `use_cohesive_devices_across_a_turn`, `self_correct_without_losing_the_thread`, `open_and_close_an_extended_turn` |
| 6 | `negotiation_and_complexity` | 5 | `negotiate_a_mutually_acceptable_outcome`, `clarify_an_ambiguous_instruction_precisely`, `propose_and_defend_an_alternative`, `handle_an_unexpected_complication` |
| 7 | `sustained_interaction` (capstone) | 6 (4 teaching + themed/neutral structurally-identical capstone pair) | `sustain_a_conversation_across_topic_shifts`, `refer_back_to_earlier_discourse`, `shift_register_within_one_conversation`, `close_a_complex_interaction_with_a_summary` |

36 episodes total, 28 capabilities (21 required, 7 should, 0 optional per
c1.md section 3).

Plus the shared data every arc is built against, under
`linguachat-frontend/src/learning/levels/c1/`:

- `c1Capabilities.js` — the 28-capability graph, transcribed from
  `c1.json#/capabilities` field-for-field (using c1.json's own schema:
  `priority` not `scope`, `languageInfrastructure` not `patterns`, a flat
  `independentEvidence` number).
- `c1Patterns.js` — the 12 pattern groups plus `negotiated_item`, the one new
  C1 semantic type (already resolved by LC-FND-002, not proposed fresh here —
  see `docs/curriculum/semantic-types.md` section 2).
- `c1Vocabulary.js` — 100 productive / 182 receptive vocabulary items,
  reconciling a real blueprint-internal mismatch (section 4 below).
- `c1Intents.js` — the 12 `evaluationIntents`, each with a worked example set
  (clearly correct / natural variant / near miss / wrong meaning / nonsense,
  plus insufficient-form/pragmatically-inappropriate cases wherever c1.md
  section 11 calls for them).
- `c1EvaluationContracts.js` — the per-capability opt-in data for the two
  shared evaluator dimensions `docs/curriculum/core-engine-requirements.md`
  already scaffolded in `engine/responseEvaluation.js`'s `base()`
  (`registerAppropriateness`, `discourseCoherence`) — used as REQUIRED here
  from `register_and_diplomacy`/`extended_structured_discourse` onward
  (stricter than B2's should-relevant capstone-only use of the same fields,
  per c1.md sections 15.1/15.2), plus C1's own `conversation_state_tracking`
  opt-in and honest structural-floor fallback specs.
- `c1ReuseMatrix.js` — the machine copy of `c1.json#/reuseMatrix`,
  cross-checked against real content.

Every episode uses only the nine step types `EpisodeShell.jsx` already
renders (`scene`, `model`, `comprehension`, `choice`, `word_order`,
`fill_blank`, `free_reply`, `recall`, `completion`) — **zero renderer work
is needed to eventually show this content**, only evaluator/dispatch wiring
(section 3 below).

## 2. Self-validation

`linguachat-frontend/scripts/foundry/c1/` — eight scripts, runnable together
via `node scripts/foundry/c1/run-all.mjs` from `linguachat-frontend/`. They
are NOT wired into `package.json#/scripts/check:all` (`package.json` is out
of this task's write scope), so run them directly:

| script | proves |
|---|---|
| `check-c1-blueprint-fidelity.mjs` | `c1Capabilities.js`/`c1Patterns.js` match `c1.json` exactly — ids, prerequisites, evidence targets, pattern chains, using c1.json's own field names |
| `check-c1-capability-graph.mjs` | no prerequisite cycles, every prerequisite resolves, every capability has a resolvable teaching arc and a non-zero evidence path |
| `check-c1-vocabulary-budget.mjs` | the level-wide productive/receptive totals fall within c1.json's declared estimate range (a RANGE check, not exact equality — c1.json has no per-arc vocabulary budget the way b2.json does; see section 4) |
| `check-c1-intent-catalog.mjs` | every intent has the template's required example categories, the catalog size (12) matches `c1.json#/evaluationIntents` exactly including `clarify_ambiguity`, every capability has exactly one intent mapping |
| `check-c1-arc-content.mjs` | only real step types, every canDoId/evalKind/itemId resolves, no duplicate episode/title ids across the seven arcs, every episode's declared `arc` field matches the file it lives in |
| `check-c1-evidence-paths.mjs` | every capability's authored content reaches C1's own stricter thresholds (`c1.json#/evidence/thresholds`: required independent:3/transfer:2/delayedRetrieval:1, should independent:2/transfer:1) — not just declared in JSON — including the blueprint's own documented exception for the three `sustained_interaction`-only required capabilities (delayed retrieval via a later EPISODE within the arc, since there is no later arc to reuse in) |
| `check-c1-reuse-matrix.mjs` | the reuse matrix matches `c1.json` exactly, and every non-null cell corresponds to a real step in that arc's content |
| `check-c1-personalization-invariant.mjs` | Arc G's themed and neutral capstone variants are structurally identical (same canDoId/evalKind/evidenceType/transfer sequence — only surface text differs); Arc B and Arc D declare no personalization at all |

All eight pass as of this task's completion (see the PR's `## Evidence`
section for the exact run). A full cross-arc evidence tally (summing every
`evidenceType`/`transfer` marker per capability across all 36 episodes)
independently confirms all 28 capabilities meet or exceed their
`c1Capabilities.js` `independentEvidence`/threshold targets.

## 3. What is deliberately NOT done here, and why

Per `docs/curriculum/curriculum-isolation-plan.md` (`LC-FND-002`'s own
finding) and this task's write scope, several shared surfaces remain flat
and level-unaware, and wiring C1 into them is **not** `LC-CONT-C1` work — it
is `LC-INT-001`'s ("Integrate A1-C2, run longitudinal learner journeys, and
repair integration defects"), which owns the broad write scope
(`linguachat-frontend/src/learning/**`, `i18n/**`, `services/**`,
`context/**`, `components/**`) this wiring actually requires. See
`core-engine-handoff.md` in this directory for the exact, itemized spec.

In short: this task built the content and the exact interfaces the shared
engine needs to implement against; it did not — and per its write scope,
could not — implement those interfaces itself.

## 4. Honesty notes worth a human read

- **C1's evidence thresholds are genuinely heavier than B2's.**
  `c1.json#/evidence/thresholds` requires `independent:3`/`transfer:2` for
  required capabilities (vs. B2's `independent:2`/`transfer:1`), so — unlike
  B2, where a capability's home arc alone supplied its full evidence — most
  C1 required capabilities need a **3rd** independent+transfer touch from a
  LATER arc, specifically the arc(s) `c1ReuseMatrix.js` marks for that
  capability. Every arc file's own header comment documents exactly which
  later arc supplies each capability's 3rd touch, and Arc G
  (`sustained_interaction`) carries the largest share of these (16 of the
  level's 21 required capabilities reach their final evidence instance
  there), matching the blueprint's own description of it as "the level's
  delayed-retrieval arc for nearly every required capability introduced
  earlier."

- **`weigh_implications_of_a_position`'s prerequisite id disagrees with its
  own blueprint's prose.** `c1.json#/capabilities[weigh_implications_of_a_position].prerequisites`
  still reads `b2_weigh_advantages_and_disadvantages` (underscore, the
  pre-reconciliation id) with `crossLevelPrerequisite: "assumed"`, while
  `c1.md`'s own section 0/3 prose describes this exact row as already
  resolved to `b2.weigh_advantages_and_disadvantages` ("already resolves —
  B2 landed with this exact id"). `c1Capabilities.js` transcribes c1.json's
  literal field value (the fidelity check compares against c1.json, the
  machine-checked source) rather than silently normalizing it to match the
  prose. `docs/curriculum/blueprints/**` is out of this task's write scope;
  this is recorded here for a human/LC-AUD-001-style follow-up, the same
  discipline B2 used for its own analogous inconsistency.

- **`use_cohesive_devices_across_a_turn`'s `reuseContexts` field overclaims.**
  `c1.json#/capabilities[use_cohesive_devices_across_a_turn].reuseContexts`
  names three arcs (`synthesis_and_mediation`, `negotiation_and_complexity`,
  `sustained_interaction`), but BOTH `c1.json#/reuseMatrix` (only an `R` at
  `sustained_interaction`) AND those two arcs' own `capabilitiesReused`
  arc-level lists (neither names this capability) agree it is reused only in
  `sustained_interaction`. Content followed the two agreeing, more specific
  sources (documented in `c1Arc5ExtendedStructuredDiscourse.js`'s header),
  the same "arc's own declared reuse list over an aggregate field" precedent
  B2 used for its own `weigh_advantages_and_disadvantages`/`when_plans_go_wrong`
  mismatch. No evidence gap results either way.

- **C1's vocabulary budget required real reconciliation, not a pick.**
  `c1.json#/capabilities[].productiveVocabulary`/`receptiveVocabulary` sum to
  200/236 across the level's 28 capabilities — well above the level-wide
  `languageInfrastructure.vocabularyBudget.productiveItemsEstimate`
  ("90-110") / `receptiveItemsEstimate` ("160-200"). Unlike B2 (which had a
  clean per-arc budget in `b2.json` to hit exactly), c1.json's own note says
  these are "budget ceilings... not a pre-committed catalogue... exact counts
  are finalized during LC-CONT-C1 against the actual authored episodes" —
  this task's explicit authority to reconcile. `c1Vocabulary.js` authors 100
  productive / 182 receptive items (within the level-wide range), allocated
  per arc in rough proportion to each arc's own capabilities' declared sums
  (scale factors ~0.5 productive / ~0.76 receptive applied per arc — see that
  file's own header for the full table). `check-c1-vocabulary-budget.mjs`
  checks this as a RANGE, not exact equality, since no per-arc target exists
  in c1.json to check exactly against.

- **`weigh_implications_of_a_position`'s `conditional_alternative_pattern`
  is a forward reference inside the blueprint's own capability entry.**
  `c1.json#/capabilities[weigh_implications_of_a_position].languageInfrastructure`
  lists `conditional_alternative_pattern`, but that pattern's own
  `firstAppearance` (`c1.json#/languageInfrastructure/patterns`) is
  `negotiation_and_complexity` (Arc F) — two arcs after
  `weigh_implications_of_a_position`'s own home arc (Arc A). `c1Arc1AbstractArgument.js`'s
  EP4 uses ordinary conditional language for this should-priority capability
  without tagging `conditional_alternative_pattern` as a `gardenItems` entry
  there, consistent with not inventing an earlier "first appearance" than
  the blueprint itself declares.

- **`mini_story` step type was not used anywhere**, for the same reason B2's
  README documents: `type: 'mini_story'` requires a `storyObjective`
  registered in `engine/miniStory.js`'s shared-core `STORIES` table, out of
  this task's write scope. Every arc instead carries its debate/diplomacy/
  mediation/negotiation framing through plain `scene` steps, which works
  today with zero engine changes.

## 5. Functional-proof honesty (CLAUDE.md QA protocol)

CLAUDE.md's QA protocol asks every functional/episode change to be walked
end-to-end in the running app. **That could not be done for this task**, and
saying so plainly is the point of this section rather than implying
otherwise: C1 content cannot run in the app yet because the shared engine
does not know these intents, these canDo ids, this level, or the
`registerAppropriateness`/`discourseCoherence`/`conversation_state_tracking`
scoring logic exist — `core-engine-handoff.md` section 1 explains exactly
why, and it is squarely `LC-INT-001`'s write scope, not this task's. What
this task proved instead: structural/data-level correctness (section 2's
eight scripts, plus an independent cross-arc evidence tally), the standard
frontend/backend suites still pass unmodified (this task added files, it did
not change any file another suite depends on), and the foundry scope guard
passes. A browser walkthrough of C1 content is `LC-INT-001`'s functional
proof to produce, once the wiring in `core-engine-handoff.md` exists.
