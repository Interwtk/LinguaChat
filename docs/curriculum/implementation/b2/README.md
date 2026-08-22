# B2 implementation status — `LC-CONT-B2`

**Status: content authored, self-validated, NOT wired into the running app.**
B2 stays exactly as unavailable to a learner as it was before this task —
nothing here is imported by any runtime module, no episode is reachable
through the UI, and `docs/curriculum/blueprints/b2.md`'s own
`Product availability: false until a separate B2 release gate` line is
unaffected by anything in this document.

This document is the honest handoff a reader needs: what was built, how it
was checked, and exactly what remains before a learner could ever see B2
content — most of which is deliberately **not** this task's job, per its
write scope (`linguachat-frontend/src/learning/levels/b2/**`,
`linguachat-frontend/scripts/foundry/b2/**`,
`docs/curriculum/implementation/b2/**` — see `.ai/foundry/tasks.json`).

## 1. What's built

Six arcs, matching `docs/curriculum/blueprints/b2.json` exactly (verified
mechanically, see section 2):

| arc | id | episodes | new capabilities |
|---|---|---|---|
| 1 | `making_the_case` | 4 | `develop_and_defend_opinion`, `weigh_advantages_and_disadvantages`, `concede_a_point_and_counter` |
| 2 | `when_plans_go_wrong` | 4 | `justify_a_request_for_change`, `negotiate_a_resolution`, `express_frustration_diplomatically` |
| 3 | `what_if` | 4 | `hypothesize_about_unreal_situations`, `speculate_about_cause_and_effect`, `express_regret_about_a_past_decision` |
| 4 | `talking_around_a_subject` | 4 | `summarize_for_someone_else`, `reformulate_to_clarify`, `report_someone_elses_opinion` |
| 5 | `reading_between_the_lines` | 4 | `adjust_register_to_context`, `soften_or_strengthen_a_statement`, `infer_implied_meaning` |
| 6 | `the_long_conversation` (capstone) | 2 (themed + neutral variant, structurally identical) | `sustain_a_multi_topic_conversation`, `handle_a_topic_shift_gracefully`, `negotiate_an_agreement_under_pushback` |

Plus the shared data every arc is built against, under
`linguachat-frontend/src/learning/levels/b2/`:

- `b2Capabilities.js` — the 19-capability graph, transcribed from `b2.json#/canDos`.
- `b2Patterns.js` — the 20 pattern groups + 3 proposed semantic types.
- `b2Vocabulary.js` — the 88 productive / 67 receptive vocabulary items (patterns count as their own Garden-trackable items per `b2.md` section 6; this file carries the remainder).
- `b2Intents.js` — the 14 new intents, each with a worked example set (clearly correct / natural variant / near miss / wrong meaning / nonsense, plus register-insufficient and pragmatically-inappropriate cases where the blueprint calls for them).
- `b2EvaluationContracts.js` — the per-capability opt-in data for the two shared evaluator dimensions `docs/curriculum/core-engine-requirements.md` already scaffolded in `engine/responseEvaluation.js`'s `base()` (registerAppropriateness, discourseCoherence), plus the honest-fallback structural-floor spec for open/paragraph-length turns and meaning-preserving reformulation.
- `b2ReuseMatrix.js` — the machine copy of `b2.json#/reuseMatrix`, cross-checked against real content.

Every episode uses only the nine step types `EpisodeShell.jsx` already
renders (`scene`, `model`, `comprehension`, `choice`, `word_order`,
`fill_blank`, `free_reply`, `recall`, `completion`) — **zero renderer work
is needed to eventually show this content**, only evaluator/dispatch wiring
(section 3 below).

## 2. Self-validation

`linguachat-frontend/scripts/foundry/b2/` — eight scripts, runnable together
via `node scripts/foundry/b2/run-all.mjs` from `linguachat-frontend/`. They
are NOT wired into `package.json#/scripts/check:all` (`package.json` is out
of this task's write scope), so run them directly:

| script | proves |
|---|---|
| `check-b2-blueprint-fidelity.mjs` | `b2Capabilities.js`/`b2Patterns.js` match `b2.json` exactly — ids, prerequisites, evidence targets, pattern chains |
| `check-b2-capability-graph.mjs` | no prerequisite cycles, every prerequisite resolves, every required/should capability has a resolvable teaching arc |
| `check-b2-vocabulary-budget.mjs` | per-arc and level-wide productive/receptive vocabulary counts (items + patterns) sum to exactly `b2.json`'s declared budgets |
| `check-b2-intent-catalog.mjs` | every intent has the template's required example categories, the catalog size matches the blueprint, subtype reuse (capstone) is accounted for |
| `check-b2-arc-content.mjs` | only real step types, every canDoId/evalKind/itemId resolves, no duplicate episode/title ids across the six parallel-authored arcs |
| `check-b2-evidence-paths.mjs` | every required/should capability's authored content actually reaches its declared independent/transfer/delayed-retrieval evidence counts — not just declared in JSON |
| `check-b2-reuse-matrix.mjs` | the reuse matrix matches `b2.json` exactly, and every non-`-` cell corresponds to a real step in that arc's content |
| `check-b2-personalization-invariant.mjs` | the capstone's themed and neutral variants are structurally identical (same evalKind/canDoId/evidenceType/transfer sequence — only surface text differs); arc 5 declares no personalization at all |

All eight pass as of this task's completion (see the PR's `## Evidence`
section for the exact run).

## 3. What is deliberately NOT done here, and why

Per `docs/curriculum/curriculum-isolation-plan.md` (`LC-FND-002`'s own
finding) and this task's write scope, several shared surfaces remain flat
and level-unaware, and wiring B2 into them is **not** `LC-CONT-B2` work — it
is `LC-INT-001`'s ("Integrate A1-C2, run longitudinal learner journeys, and
repair integration defects"), which owns the broad write scope
(`linguachat-frontend/src/learning/**`, `i18n/**`, `services/**`,
`context/**`, `components/**`) this wiring actually requires. See
`core-engine-handoff.md` in this directory for the exact, itemized spec.

In short: this task built the content and the exact interfaces the shared
engine needs to implement against; it did not — and per its write scope,
could not — implement those interfaces itself.

## 4. Three honesty notes worth a human read

- **`shift_register` intent reuse for topic-shift judgment.**
  `b2.json#/evaluationStrategy` literally names the `shift_register` intent
  (register formality) as the evaluator behind BOTH
  `sustain_a_multi_topic_conversation` and `handle_a_topic_shift_gracefully`
  (topic-shift judgment), via a `topic_shift` subtype. This is transcribed
  verbatim in `b2Capabilities.js`/`b2Intents.js` per this task's
  no-invented-curricular-detail rule, but the shared intent id is genuinely
  confusing for a topic-change judgment that has nothing to do with
  formality. Worth a deliberate human check (or an `LC-AUD-001`-style
  follow-up) before `LC-INT-001` builds evaluator logic against it — it may
  be a copy-paste artifact in the blueprint rather than an intentional
  design decision, and renaming it is a one-line blueprint edit, not a
  content-authoring one.
- **`mini_story` step type was not used anywhere**, even though `b2.json`
  marks `miniStory.use: true` for four of the six arcs. Every arc-3 worker
  independently found the same blocker: `type: 'mini_story'` requires a
  `storyObjective` registered in `engine/miniStory.js`'s `STORIES` table,
  which is shared-core and out of this task's write scope (same isolation
  reasoning as `curriculum-isolation-plan.md`'s own "hosted-story table" row).
  Every arc instead carries its narrative/mystery/negotiation framing through
  plain `scene` steps, which works today with zero engine changes. If
  `LC-INT-001` wants the richer `mini_story` presentation, that is an
  additive enhancement on top of already-complete content, not a blocker to
  it — the content does not depend on it.
- **`b2.json` disagrees with itself once**: the `reuseMatrix` table marks
  `weigh_advantages_and_disadvantages` as reused ("R") in
  `when_plans_go_wrong`, but that arc's own `b2Reuse` list names only
  `develop_and_defend_opinion` and `concede_a_point_and_counter`. Content
  authoring followed the arc's own explicit `b2Reuse` declaration (the more
  specific, arc-scoped source) rather than inventing a
  `weigh_advantages_and_disadvantages` touch the arc's own metadata does not
  call for. No evidence gap results either way — that capability already
  reaches its full `independent:2`/`transfer:1` target in arc 1 and arc 6 —
  but the two blueprint fields should be reconciled by whoever next edits
  `b2.json` (`docs/curriculum/blueprints/**` is not in this task's write
  scope). `scripts/foundry/b2/check-b2-reuse-matrix.mjs` records this as one
  explicit, documented exception rather than silently passing or silently
  failing.

## 5. Functional-proof honesty (CLAUDE.md QA protocol)

CLAUDE.md's QA protocol asks every functional/episode change to be walked
end-to-end in the running app. **That could not be done for this task**, and
saying so plainly is the point of this section rather than implying
otherwise: B2 content cannot run in the app yet because the shared engine
does not know these intents, these canDo ids, or this level exist —
`core-engine-handoff.md` section 1 explains exactly why, and it is squarely
`LC-INT-001`'s write scope, not this task's. What this task proved instead:
structural/data-level correctness (section 2's eight scripts), the standard
frontend/backend suites still pass unmodified (this task added files, it did
not change any file another suite depends on), and the foundry scope guard
passes. A browser walkthrough of B2 content is `LC-INT-001`'s functional
proof to produce, once the wiring in `core-engine-handoff.md` exists.
