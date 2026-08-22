# C2 implementation — status

**Status: content authored, self-validated, NOT wired into the running app.**
C2 stays exactly as unavailable to a learner as it was before this task —
nothing here is imported by any runtime module, no episode is reachable
through the UI, and `docs/curriculum/blueprints/c2.md`'s own product-
availability line is unaffected by anything in this document.

## Supervisor correction (2026-08-22, PR #76)

This task originally stopped at a design-only content plan, reasoning that
no `LC-CONT-*` content lane could make a genuinely new intent evaluate
correctly from inside its own `levels/<level>/**` write scope, and that no
CORE task existed to unblock it. The repository owner corrected this
directly on the PR: `.ai/foundry/tasks.json` already provides the intended
shared-runtime integration lane, `LC-INT-001` ("Integrate A1-C2, run
longitudinal learner journeys, and repair integration defects"), which
depends on all six `LC-CONT-*` tasks and owns the shared `engine/**`,
`i18n/**`, `services/**`, `context/**`, `components/**` surfaces this
content needs. Sibling lanes A2 and B2 had already completed on exactly
this understanding: author complete, self-contained, level-owned content
and defer shared wiring + live browser proof to `LC-INT-001`, rather than
inventing a parallel CORE task. This task now follows the same corrected
boundary. The original blocker analysis is preserved for the record in
`.ai/foundry/requests/LC-CONT-C2.md` (re-labeled "historical finding,
superseded"), since its file:line evidence about the shared engine's
current shape is still accurate and still useful — it is the reason
`core-engine-handoff.md` in this directory is as concrete as it is.

## 1. What's built

Eight arcs, matching `docs/curriculum/blueprints/c2.json` exactly (verified
mechanically, see section 2):

| arc | id | episodes | new capabilities |
|---|---|---|---|
| 1 | `dense_input_synthesis` | 4 | `extract_key_argument_from_dense_text`, `synthesize_multiple_viewpoints`, `identify_authors_stance_and_bias` |
| 2 | `precise_reformulation` | 4 | `reformulate_dense_source_for_a_new_audience`, `summarize_preserving_nuance`, `paraphrase_to_avoid_flattening_meaning` |
| 3 | `implication_and_subtext` | 4 | `recognize_implied_meaning`, `recognize_irony_and_understatement`, `respond_appropriately_to_an_indirect_speech_act` |
| 4 | `register_and_pragmatics` | 4 | `shift_register_deliberately`, `soften_or_intensify_a_claim`, `manage_face_in_disagreement` |
| 5 | `argument_and_position` | 4 | `develop_an_extended_qualified_argument`, `preempt_and_rebut_a_counterargument`, `qualify_a_position_with_precision` |
| 6 | `discourse_flexibility` | 4 | `sustain_coherence_across_topic_shifts`, `repair_a_misunderstanding_at_intention_level`, `function_inside_an_unfamiliar_high_ambiguity_exchange` |
| 7 | `stylistic_control` | 4 | `edit_own_text_for_precision_and_tone`, `vary_expression_to_avoid_flattening_meaning`, `adapt_a_text_across_genre_and_register` |
| 8 | `integrated_mediation` (capstone) | 1 | `mediate_a_complex_disagreement_for_a_third_party` |

29 episodes total. Plus the shared data every arc is built against, under
`linguachat-frontend/src/learning/levels/c2/`:

- `c2Capabilities.js` — the 22-capability graph, transcribed from `c2.json#/canDos`.
- `c2Patterns.js` — the 10 pattern groups + 4 proposed semantic types (`source_text`, `audience_profile`, `register_level`, `stance_marker`).
- `c2Vocabulary.js` — per-arc productive/receptive vocabulary matching `c2.json#/arcs[].vocabularyBudget` exactly (58 productive / 90 receptive level-wide).
- `c2Intents.js` — the 13 new intents (plus 5 subtype groups), each with a worked example set: correct / natural variant / near miss / wrong meaning / nonsense / **pragmatically inappropriate** — a base category for C2, not optional, per `c2.md` section 11.
- `c2EvaluationContracts.js` — the per-capability opt-in data for `registerAppropriateness`/`discourseCoherence`, the multi-turn evaluation span fixtures (`coreEngineRequirements[0]`), the capstone's seven-capability delayed-retrieval spec (`coreEngineRequirements[3]`), and the honest structural-floor fallback for every hybrid intent.
- `c2ReuseMatrix.js` — the machine copy of every arc's `c2.json#/arcs[].reuseMap`, cross-checked against real content.

Every episode uses only the nine step types `EpisodeShell.jsx` already
renders (`scene`, `model`, `comprehension`, `choice`, `free_reply`,
`recall`, `completion` — this level's content happens not to need
`word_order`/`fill_blank`) — **zero renderer work is needed to eventually
show this content**, only evaluator/dispatch wiring (section 3 below).

Two C2-specific structural conventions, both harmless extra keys on
existing step shapes (not new step types):

- **Source-text steps.** A `scene` step may carry `sourceTextEn` (and
  `sourceTextBEn` for two-text comparison tasks); the `free_reply` step
  that follows carries `sourceRef: true` so a future evaluator grades it
  against the preceding text.
- **Multi-turn steps.** A step whose capability needs more than the latest
  turn (arc 6's `sustain_coherence`/`function_inside_an_unfamiliar_high_ambiguity_exchange`,
  arc 8's capstone, and — as a deliberate authored exception, see
  `c2EvaluationContracts.js`'s header comment — `repair_at_intention_level`)
  carries `evaluationSpan: 'multiTurn'` and a `turnContext` array of
  `{ speaker, textEn }` prior turns.

## 2. Self-validation

`linguachat-frontend/scripts/foundry/c2/` — ten scripts, runnable together
via `node scripts/foundry/c2/run-all.mjs` from `linguachat-frontend/`. They
are NOT wired into `package.json#/scripts/check:all` (`package.json` is out
of this task's write scope), so run them directly:

| script | proves |
|---|---|
| `check-c2-content-plan.mjs` | the original design plan (`docs/curriculum/implementation/c2/content-plan.json`) stayed internally faithful to the frozen blueprint |
| `check-c2-blueprint-fidelity.mjs` | `c2Capabilities.js`/`c2Patterns.js` match `c2.json` exactly — ids, prerequisites, evidence targets, pattern chains, semantic types |
| `check-c2-capability-graph.mjs` | no prerequisite cycles, every prerequisite resolves, every required/should capability has a resolvable teaching arc |
| `check-c2-vocabulary-budget.mjs` | per-arc and level-wide productive/receptive vocabulary counts sum to exactly `c2.json`'s declared budgets |
| `check-c2-intent-catalog.mjs` | every intent has all six required example categories (including `pragmaticallyInappropriate`), the catalog size matches the blueprint, subtype reuse is accounted for |
| `check-c2-arc-content.mjs` | only real step types, every canDoId/evalKind/itemId resolves, no duplicate episode/title ids or i18n key ranges across the eight parallel-authored arcs |
| `check-c2-evidence-paths.mjs` | every required/should/optional capability's authored content actually reaches its declared independent/transfer/delayed-retrieval evidence counts — not just declared in JSON — including the capstone's seven-capability `delayedRetrievalChecks` |
| `check-c2-multi-turn-spans.mjs` | every `evaluationSpan: 'multiTurn'` capability has real steps carrying both the span flag and a non-empty `turnContext` |
| `check-c2-reuse-matrix.mjs` | every arc's reuse matrix matches `c2.json#/arcs[].reuseMap` exactly, and every non-`I` cell corresponds to a real authored step |
| `check-c2-personalization-invariant.mjs` | personalization never changes required evidence — arcs marked `personalizationMode: "none"` carry zero personalization steps, `"light"` arcs carry at most one, and no `personalizationVariant` step is ever counted toward independent/transfer evidence |

All ten pass as of this task's completion (see the PR's `## Evidence`
section for the exact run).

## 3. What is deliberately NOT done here, and why

Per `docs/curriculum/curriculum-isolation-plan.md` and this task's write
scope, several shared surfaces remain flat and level-unaware, and wiring C2
into them is **not** `LC-CONT-C2` work — it is `LC-INT-001`'s. See
`core-engine-handoff.md` in this directory for the exact, itemized spec,
which folds in C2's four blueprint-declared `coreEngineRequirements`
(multi-turn evaluation span, provider-free hybrid fixtures, the two new
semantic-type/content-object needs, and multi-capability delayed retrieval)
alongside the general registration wall every `LC-CONT-*` lane hits.

## 4. Honesty notes worth a human read

- **Personalization is lighter than B1/B2's own capstone-variant pattern.**
  B1/B2 built full themed/neutral duplicate episodes for their capstones.
  C2's capstone (arc 8) is `personalizationMode: "none"` by design (it is
  the graduation capstone), and every other arc's personalization is a
  single optional inline step (`personalizationVariant: true`), per
  `content-plan.json`'s own framing of personalization as one interchangeable
  example rather than a parallel arc. This is a genuine design choice made
  in this task, not dictated word-for-word by the blueprint — flagged here
  rather than presented as a blueprint requirement.
- **`c2.json` disagrees with itself once, on `identify_authors_stance_and_bias`.**
  Arc 3 (`implication_and_subtext`)'s `reinforcedCanDos` names this
  capability as reinforced, but that arc's own `reuseMap` — the more
  specific, arc-scoped source — carries no matching entry. Content
  authoring follows the arc's own `reuseMap`, exactly the precedent B2's
  README already established for its own analogous inconsistency. No
  evidence gap results either way: `identify_authors_stance_and_bias`
  already reaches its full `independent:2`/`transfer:1` target inside arc 1
  itself.
- **`sustain_coherence_across_topic_shifts` keeps an unresolved C1
  prerequisite placeholder.** `c2.json` deliberately declined to
  auto-resolve `c1_assumed__handle_abstract_topics` (LC-AUD-001's F6,
  low-confidence). Content authoring treats arc 5
  (`argument_and_position`) as the arc's real, already-resolved
  prerequisite and does not invent a resolution for the placeholder itself
  — that is a human curriculum-design decision, not a content-authoring one.
- **The register/discourse-coherence opt-in tables in
  `c2EvaluationContracts.js` are authored here, not lifted from a blueprint
  field.** Unlike `b2.json`, `c2.json` does not tag individual capabilities
  with a descriptive `evaluation` value (only `hybrid`/`deterministic_local`).
  The opt-in lists are built against `c2.json#/semanticTypes.proposed`'s
  `register_level.requiredBy` list and the multi-turn-tagged capabilities
  respectively — a reasonable, defensible design choice, flagged explicitly
  in that file's own header rather than presented as blueprint-derived.
- **Seven authored guided/reinforcement/delayed-retrieval touches were
  added beyond content-plan.json's original outline.** Running
  `check-c2-reuse-matrix.mjs` surfaced several `c2.json` arc `reuseMap`
  entries (a `G`/`R`/`D`/`T`/`F` marker for an earlier arc's capability)
  with no matching authored step. Rather than documenting these as
  blueprint-metadata inconsistencies (the B2 precedent, used where the
  arc's OWN `reuseMap` genuinely disagrees with a looser
  `reinforcedCanDos`/`newCanDos` list), these were real content gaps — the
  arc's own `reuseMap` explicitly called for the touch — so short
  additional steps were authored in arcs 2, 4, 5, 6, 7 and 8 to close them
  honestly rather than suppress the check.

## 5. Functional-proof honesty (CLAUDE.md QA protocol)

CLAUDE.md's QA protocol asks every functional/episode change to be walked
end-to-end in the running app. **That could not be done for this task**:
C2 content cannot run in the app yet because the shared engine does not
know these intents, these canDo ids, or this level exist —
`core-engine-handoff.md` section 1 explains exactly why, and it is squarely
`LC-INT-001`'s write scope, not this task's. What this task proved instead:
structural/data-level correctness (section 2's ten scripts), the standard
frontend/backend suites still pass unmodified (this task added files, it
did not change any file another suite depends on), and the foundry scope
guard passes. A browser walkthrough of C2 content is `LC-INT-001`'s
functional proof to produce, once the wiring in `core-engine-handoff.md`
exists.
