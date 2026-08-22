# Isolating shared curriculum infrastructure — status and remaining plan

What `LC-FND-002` changed, what it deliberately did not, and why — so a future task does not have to
re-derive this from scratch or guess whether a gap was overlooked.

- **Source of truth for what's live today:** `linguachat-frontend/src/learning/curriculum/levelMaps.js`
  (the id registry) and `scripts/check-cross-level-ids.mjs` (the guard).
- **Design decisions this task made without touching runtime code:**
  `docs/curriculum/semantic-types.md` (F9), `docs/curriculum/core-engine-requirements.md` (F8).

---

## 1. What's done

- **Cross-level capability-id collisions in the design documents** (LC-AUD-001 F1, F2, F3): fixed in
  `docs/curriculum/blueprints/{b1,c1,c2}.json`. Three real collisions, all renamed with a documented
  is-a/escalation relationship rather than silently coexisting.
- **Nineteen broken cross-level prerequisite strings** (F4, F4b, F5, F6): resolved across
  `b1.json`/`c1.json`/`c2.json`, all but one at high/medium confidence; the one low-confidence row
  (`c2.json`'s `sustain_coherence_across_topic_shifts`) is deliberately left for a human curriculum
  call, not auto-applied.
- **A2's missing CEFR coverage** (F7): all 19 capabilities now carry `cefrRefs`.
- **Semantic-type fragmentation** (`problem` / `problem_type` / `negotiated_item`, F9): reconciled
  into one family with a documented is-a relationship — see `semantic-types.md`.
- **Pattern-id reuse ambiguity** (F10, F11): `because_reason_pattern` marked as B1 reuse of A2's
  pattern rather than a second introduction; C2's academic hedging form renamed to
  `academic_hedging_pattern` rather than reusing B2's colloquial `hedging_pattern`.
- **Duplicate CORE evaluator asks** (F8): one register-appropriateness dimension, one
  discourse-coherence-scoring path, specified once — see `core-engine-requirements.md` — and the
  shared contract shape (not the scoring logic) added to `responseEvaluation.js`'s `base()`.
- **A real, live bug**: `scaffolding.js`'s novelty check previously read only Pre-A1's capability map,
  silently failing to resolve any of A1's own intents. Fixed via the new `levelMaps.js` registry.
- **A mechanical collision guard**: `check:cross-level-ids` fails the build the moment two registered
  levels declare the same bare capability id — the automation LC-AUD-001 had to do by hand.

## 2. What's deliberately not done, and why

A full architecture survey (done as part of this task) found several more shared, flat,
level-unaware data structures that a new level's authoring would need to extend — listed below with
the reason each was left alone rather than refactored now.

| shared surface | file | why not touched now |
|---|---|---|
| per-intent evaluator dispatch | `engine/responseEvaluation.js` (the `evaluateFree` switch), `engine/hybridEvaluation.js`'s `PRAISE` table | ~40 hand-written evaluator functions and one dispatcher switch power the live, shipped Pre-A1/A1 experience. No A2-C2 runtime intent exists yet to prove a per-level-registry refactor is even shaped right. Refactoring live, tested evaluator logic with zero real second-level consumer to validate against is exactly the premature-abstraction risk the product's engineering guardrails warn against. |
| per-intent prompt/model-answer tables | `components/session/SessionRunner.jsx`'s `MODEL_ANSWER`/`PROMPT` | Same reasoning: a UI-adjacent table with a documented history of real regressions when an intent is missing from it (`a1-authoring-contract.md` rule 6). Splitting it into per-level modules is safe only once a second level's real intents exist to test the split against. |
| per-intent format table | `engine/formatChoice.js`'s `OBJECTIVE_FORMATS` | Same shape, same reasoning; also has a documented real regression (an unlisted objective silently defaulted to "every format allowed"). |
| hosted-story table | `engine/miniStory.js`'s `STORIES` | Smaller and lower-risk than the above, but still no A2+ story exists to validate a split against. |
| flat item/error/canDo tables | `engine/session.js`'s `ITEM_KIND`, `ERROR_KIND`, `CANDO_KIND` | These already have a **live gap**, not a hypothetical one: they contain zero A1 entries today, so A1's own vocabulary/errors/canDos are invisible to the daily session's review and fragile-skill generators. Fixing this is real, valuable work — but it is an A1-scoped bug fix (add A1's own entries), not a parallel-authoring isolation change, and is better scoped as its own task with A1-specific QA proof (per CLAUDE.md's functional-proof table) than bundled into this one. |
| five flat semantic registries | `engine/semanticContext.js` (`SEMANTIC_TYPES`, `INTENT_SLOTS`, `NEUTRAL_CATALOG`, `THINGS`, `KNOWN_VALUES`) | The *design* reconciliation for the one concrete conflict that exists today (`problem`/`problem_type`/`negotiated_item`) is done (`semantic-types.md`). Restructuring the registry itself into a per-level-extensible form is speculative until a level that actually needs `problem`/`negotiated_item` in runtime code (B1, B2 or C1) starts content work — the right time to build the extension mechanism is when the first real type needs it, informed by what that level's content actually requires. |
| `learnerModel.js`'s `FACT_TYPES` / `MILESTONE_LEVELS` | `engine/learnerModel.js` | Same reasoning as `semanticContext.js`: no second level captures a learner fact yet, so there is nothing concrete to extend against. |
| `readiness.js` / `graduation.js` generalization | `curriculum/readiness.js`, `curriculum/graduation.js` | Explicitly flagged by `a1-authoring-contract.md` as **A1's own unresolved work**, not something this task's scope covers: "Pre-A1 graduation and the A1 milestone are separate... no A1 readiness function exists. Adding one is A1's own work." Whether to generalize these into level-parametrized functions or keep one file pair per level (matching `preA1Map.js`/`a1Map.js`'s existing precedent) is a real architectural choice that needs A1's own readiness function to exist first, so there are two real examples to generalize from rather than one plus a guess. |
| i18n's 8-file flat structure | `i18n/translations.js` + `i18n/locales/*.js` | The highest-file-count collision surface found, but also the one where the existing per-episode key-prefix convention (`ep18*`, `ep27*`, ...) already keeps different levels' *keys* disjoint even though the *files* are shared. Splitting into per-level i18n modules is a real, valuable change, but it touches all 8 files, the loader, and every check that validates locale parity (`check:i18n`, `check:i18n-lint`, `check:locale-loading`) — a large, live-i18n-architecture change the master contract lists as needing its own serialized core task, not a rider on this one. |
| `preA1Skeleton.generated.js`'s misleading name | `curriculum/preA1Skeleton.generated.js` (holds the WHOLE curriculum's skeleton, not just Pre-A1's) | Purely cosmetic, but renaming a generated, git-tracked file changes its path in `build-curriculum-skeleton.mjs`, every consumer's import, and `check-curriculum-loading`'s drift check simultaneously — real risk for zero runtime behaviour change. Left as a documented naming smell rather than a same-PR rename. |
| import-by-name tooling | `scripts/build-curriculum-skeleton.mjs`, `scripts/check-curriculum-authoring.mjs` | Both already additive-only (one new import line per arc/level) and low collision risk on their own. Converting to a level-registry-driven enumeration is worth doing once there are 3+ levels' worth of import lines to justify the indirection, not at 2. |

## 3. What a future FND-level task should do with this

When a level with real runtime content (most likely A2, since it is closest to landing) is about to
add its first evaluator/session/semantic-type/i18n entries, that is the moment to build the
per-level-registry extension for whichever of the rows above that level's content actually needs —
informed by real intents and real content, not a guess made before any existed. `levelMaps.js` is the
template for the pattern: a small, additive registry plus a mechanical collision guard, not a rewrite
of the file it isolates. Re-run the architecture survey this task did (or read this document) before
starting, since the shared-surface list above should still be accurate unless another task already
narrowed it.
