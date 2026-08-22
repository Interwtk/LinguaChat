# LC-CONT-B1 — confirmed scope boundary; wiring is LC-INT-001's job, not a missing CORE task

## Status — corrected on resume

An earlier pass through this branch read the finding below as requiring a brand-new, unscheduled
serialized CORE task before any content could land, and left the PR blocked with no runtime content.
On resume, re-reading `.ai/foundry/tasks.json`'s existing task graph and the master contract's own
parallel-authoring sequence (`curriculum-master-a1-c2.md` section 18: step 5 "author level-owned
runtime content in parallel," step 7 "integrate levels one at a time through the global gate") shows
that task already exists: **`LC-INT-001`**, which depends on every `LC-CONT-*` lane and has write
access to exactly the shared surfaces named below. Sibling lane `LC-CONT-A2` (PR #74) reached the
same reading independently. The technical finding itself (below) is unchanged and still accurate —
only the conclusion drawn from it was wrong. See `docs/curriculum/implementation/b1/README.md` for
what this task does instead: build complete, self-contained, level-owned B1 content and prove it with
a self-contained journey harness, and leave live in-app wiring plus the full in-app browser
walkthrough to `LC-INT-001`.

## Original finding (unchanged)

`LC-CONT-B1`'s write scope is exactly `linguachat-frontend/src/learning/levels/b1/**`,
`linguachat-frontend/scripts/foundry/b1/**` and `docs/curriculum/implementation/b1/**`
(`.ai/foundry/tasks.json`). None of those paths can make B1 episode content
*run through the live app today*, because every one of B1's 14 new evaluator intents
(`docs/curriculum/blueprints/b1.json`'s `intentStrategy.newIntents`) needs registration in shared
files this task has no permission to touch. This is confirmed by direct code inspection, not
inferred from the blueprint's own section 15 alone (which flagged two narrower CORE questions —
both resolved without a shared-core change; see `core-engine-findings.md`). This does not block
authoring self-contained, level-owned content and proving it in isolation, which is what this task
does instead of quietly working around the boundary or stalling on it.

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

## What LC-CONT-B1 does instead (corrected on resume)

An earlier pass through this branch stated it had produced a full arc-by-arc content specification at
`docs/curriculum/implementation/b1/content-plan.md`. **That file was never actually written** — only
this request file and the directory `README.md` existed on the branch at that point. That claim is
retracted here rather than left standing.

What this task actually does, per the corrected reading in the Status section above:

- keeps this finding (the file:line evidence above) as a durable record, so it does not need
  re-discovery by every sibling `LC-CONT-*` lane;
- resolves blueprint section 15's two open core-engine questions by read-only investigation — see
  `docs/curriculum/implementation/b1/core-engine-findings.md` — rather than deferring them to a future
  task, since neither needed a shared-core code change;
- authors real, complete, self-contained B1 runtime content — episodes, evaluators, model-answer/
  prompt tables, semantic-type usage, journey-simulation QA — entirely inside
  `linguachat-frontend/src/learning/levels/b1/**` and `linguachat-frontend/scripts/foundry/b1/**`,
  proceeding arc by arc;
- writes `.ai/foundry/completed/LC-CONT-B1.json` only once that self-contained content and its own
  QA gate are genuinely done, explicitly scoped as "level-owned content complete; live in-app wiring
  and the full in-app browser walkthrough are `LC-INT-001`'s work," not by silently claiming the
  level QA gate's in-app requirements (browser usability, live end-to-end play) that only
  `LC-INT-001` can actually produce.

## What LC-INT-001 needs to do (for reference; out of this task's scope to build)

`LC-INT-001` needs write access to `engine/**`, `components/session/SessionRunner.jsx`,
`curriculum/**`, `i18n/**` and `scripts/**` (it already has this per `.ai/foundry/tasks.json`) to
wire every content lane's self-contained modules into the shared runtime:

1. a per-level evaluator-function registry so `evaluateFree` can dispatch to a level's own module
   instead of one shared `switch` (or a direct merge of B1's `evaluators.js` into the switch, if a
   registry is judged disproportionate for six levels — an `LC-INT-001` decision, not this task's);
2. a per-level `MODEL_ANSWER`/`PROMPT` registry for `SessionRunner.jsx`, or a direct merge;
3. a `b1` (and by extension `a2`/`b2`/`c1`/`c2`) entry in `curriculum/levels.js` and
   `curriculum/episodeContent.js`'s `CONTENT_LOADERS`, plus a skeleton-build path that does not
   require hand-editing `build-curriculum-skeleton.mjs` per level;
4. registering B1's new semantic type (`problem`) in `semanticContext.js`;
5. merging B1's i18n key list into the shared locale files (matching how A1 did it).

## What this does not resolve

This is a scope/architecture finding, not a pedagogical one, and it does not by itself make B1
available or claim any evidence was produced. `docs/curriculum/blueprints/b1.md` section 16's QA
acceptance list includes items only reachable through the live app (representative browser usability,
an actual in-app end-to-end walkthrough) — those remain `LC-INT-001`'s to produce, honestly, once
wiring lands; this task's own completion marker states that scope boundary explicitly rather than
implying the level QA gate was fully satisfied from inside an isolated write scope where it cannot be.
