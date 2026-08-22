# LC-CONT-B1 — blocked on shared-core runtime registration; handoff for a CORE task

## Status

`LC-CONT-B1`'s write scope is exactly `linguachat-frontend/src/learning/levels/b1/**`,
`linguachat-frontend/scripts/foundry/b1/**` and `docs/curriculum/implementation/b1/**`
(`.ai/foundry/tasks.json`). None of those paths can make B1 episode content
*run*, because every one of B1's 14 new evaluator intents (`docs/curriculum/blueprints/b1.json`'s
`intentStrategy.newIntents`) needs registration in shared files this task has no permission to
touch. This is confirmed by direct code inspection, not inferred from the blueprint's own
section 15 alone (which flagged two narrower CORE questions — this finding is broader and harder
than either of them). Per the coordination contract, a scoped-out required change is recorded
here instead of being made quietly, and the PR stays draft.

This is not B1-specific. Every sibling `LC-CONT-*` task (`LC-CONT-A1`'s remaining arcs 6-7,
`LC-CONT-A2`, `LC-CONT-B2`, `LC-CONT-C1`, `LC-CONT-C2`) has the identical write-scope shape and
will hit the same wall the first time it tries to make a genuinely new intent evaluate correctly.
`LC-FND-002`'s own `docs/curriculum/curriculum-isolation-plan.md` (section 3) predicted this
exact moment — "when a level with real runtime content ... is about to add its first
evaluator/session/semantic-type/i18n entries, that is the moment to build the per-level-registry
extension" — but that task's write scope did not include a second level's content to build the
extension against, so it deliberately deferred the work. B1 (or whichever `LC-CONT-*` lane reaches
this point first) is that moment. A **new serialized CORE task** is needed before any content lane
can land real runtime episodes.

## The evidence

`docs/curriculum/curriculum-master-a1-c2.md` section 14 ("Authoring architecture") already states
the rule this confirms mechanically: "response evaluation semantics" is listed as a **shared-core**
example requiring a serialized core task, explicitly distinct from "level episode
definitions/content," which is level-owned. Direct inspection of the current runtime shows exactly
how deep that shared surface goes and that none of it degrades gracefully for an unregistered
intent — it fails closed, silently, in a way a learner would experience as "nothing I type is ever
accepted":

1. **`engine/responseEvaluation.js`'s `evaluateFree` (line 1430)** is a single `switch` with one
   hand-written `case` per intent, all of Pre-A1's and A1's interleaved in the same statement. Its
   `default` case (line 1470) returns `{ understood: false, conclusive: true, retryRequired: true }`.
   There is no generic/fallback evaluator path for an intent without a case.
2. **That default's `conclusive: true` is fatal, not just unhelpful.** `hybridEvaluation.js`'s
   `shouldEscalate` (lines 1696-1698 of `responseEvaluation.js`) only escalates to the remote/AI
   provider when the local verdict is `conclusive: false`. An intent with no `case` is always
   `conclusive: true` and `understood: false`, so it **never reaches the remote hybrid path at
   all** — this matters specifically for B1, where 13 of its 14 new intents are `hybrid` by design
   (`b1.json`'s `evaluationStrategy.densityFinding`). A B1 learner could type a perfect, human-correct
   answer to a `negotiate_solution` or `state_opinion` step and it would be rejected every time,
   with no path to correction, until a `case` exists.
3. **`components/session/SessionRunner.jsx`'s `MODEL_ANSWER` and `PROMPT`** are both flat objects
   (lines ~33-113 and ~135-182) with A1's arc entries added directly alongside Pre-A1's. Unknown
   keys silently fall back to the `introduction`/Pre-A1 entry (`MODEL_ANSWER[kind] ||
   MODEL_ANSWER.introduction`, line ~343; same pattern for `PROMPT`, line ~368) — exactly the
   defect class `a1-authoring-contract.md` already documents as having shipped once for real
   ("the sixth arc's three intents were missing from the session runner's tables ... a
   consolidation block for a required capability showed the greeting prompt and graded the answer
   as an identification. Nothing failed and no check noticed.").
4. **`curriculum/levels.js`'s `LEVELS` array and `curriculum/episodeContent.js`'s
   `CONTENT_LOADERS`** are both hardcoded, flat, no-auto-discovery structures. A `b1` level id and
   a `b1` content loader do not exist and cannot be added from inside `levels/b1/**` — both files
   are under `curriculum/**`, a different lane's (`core`) write scope.
5. **`scripts/build-curriculum-skeleton.mjs`** hardcodes named imports of each arc module
   (`A1_ARC1`...`A1_ARC5`) to build the generated skeleton `levels.js`'s `episodesOfLevel` reads at
   runtime. A B1 arc module has no way to appear in that skeleton without editing this script,
   which lives directly under `linguachat-frontend/scripts/`, not `scripts/foundry/b1/**`.
6. **`engine/semanticContext.js`'s `SEMANTIC_TYPES`/`INTENT_SLOTS`** are flat, edited-in-place
   structures. B1's new `problem` semantic type (`b1.json`'s `semanticTypes`, already reconciled
   with B2/C1 in `docs/curriculum/semantic-types.md`) cannot be registered from `levels/b1/**`.
7. **`i18n/translations.js` + `i18n/locales/*.js`** are flat dictionaries with no merge-in
   extension point; every new episode string needs a direct edit across all eight locale files to
   avoid shipping raw keys, per `check:i18n`.

None of this is a workaround-able gap. It is the same shape of bug LC-FND-002 already fixed once
for `scaffolding.js`'s intent lookup (a level's own capabilities silently invisible to a shared
consumer) — except here the shared consumer is the evaluator itself, and the failure mode for a
learner is total, not degraded.

## What LC-CONT-B1 did instead

Rather than editing shared-core files outside this task's write scope (which the coordination
contract and the master's own section 14 both forbid — "a level worker discovers a shared-core
need, it must raise the requirement instead of quietly implementing a private workaround"), this
task:

- confirmed and documented the blocker precisely (this file), so it does not need re-discovery by
  every sibling `LC-CONT-*` lane;
- produced the level-owned design artifact the master's section 14 explicitly permits without
  shared-core access — a full arc-by-arc B1 content specification faithful to `b1.json`/`b1.md`,
  at `docs/curriculum/implementation/b1/content-plan.md` — so that once a CORE task lands the
  registration mechanism, authoring the actual runtime episode files is a fast, low-risk transcription
  rather than a fresh design pass;
- left `.ai/foundry/completed/LC-CONT-B1.json` **unwritten** and this PR in **draft**, because no
  runtime content exists and none can be honestly claimed complete.

## What a CORE task needs to do

A new task (proposed id `LC-FND-003`, lane `core`, depending on `LC-FND-002`) needs write access to
`engine/**`, `components/session/SessionRunner.jsx`, `curriculum/**`, `i18n/**` and
`scripts/**` to build the per-level extension mechanism `curriculum-isolation-plan.md` already
named as the template (`levelMaps.js`'s "small, additive registry plus a mechanical collision
guard" pattern), applied to:

1. a per-level evaluator-function registry so `evaluateFree` can dispatch to a level's own module
   instead of one shared `switch`;
2. a per-level `MODEL_ANSWER`/`PROMPT` registry for `SessionRunner.jsx`;
3. a `b1` (and by extension `a2`/`b2`/`c1`/`c2`) entry in `curriculum/levels.js` and
   `curriculum/episodeContent.js`'s `CONTENT_LOADERS`, plus a skeleton-build path that does not
   require hand-editing `build-curriculum-skeleton.mjs` per level;
4. a registration point for new semantic types (`problem`) in `semanticContext.js`;
5. an i18n extension point, or an accepted convention for adding B1's keys directly to the shared
   locale files (matching how A1 did it) if a full merge-registry is judged out of proportion to
   the actual gain — this one is more a *decision* than a build, unlike 1-4.

Section 15 of `b1.json`/`b1.md` also still needs answering as part of (or immediately after) this
CORE task, since both of its findings depend on the same evaluator surface being touched anyway:
**15.1** (measure the local evaluator's conclusive/inconclusive rate on B1-shaped sentences before
committing B1's hybrid-heavy intents to the existing escalation rule) and **15.2** (confirm whether
the evaluator call already receives the prior partner turn as context, needed for
`sustain_topic_change`/`ask_follow_up_questions` in arc `keep_talking`).

## What this does not resolve

This is a scope/architecture finding, not a pedagogical one. `docs/curriculum/implementation/b1/content-plan.md`
is a design artifact like the blueprint itself — no runtime module imports it, and it does not make
B1 available or claim any evidence was produced. The blueprint's own section 15 items are restated
above but not resolved here; a CORE task must actually resolve or explicitly re-scope them before
`LC-CONT-B1` (resumed on this same branch) can implement arcs to their stated evidence bar.
