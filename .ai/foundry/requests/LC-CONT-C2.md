# LC-CONT-C2 — blocked on shared-core runtime registration; handoff for a CORE task

## Status

`LC-CONT-C2`'s write scope is exactly `linguachat-frontend/src/learning/levels/c2/**`,
`linguachat-frontend/scripts/foundry/c2/**` and `docs/curriculum/implementation/c2/**`
(`.ai/foundry/tasks.json`). None of those paths can make C2 episode content *run*, because every
one of C2's 13 new evaluator intents (`docs/curriculum/blueprints/c2.json`'s
`intentStrategy.newIntents`) needs registration in shared files this task has no permission to
touch. This confirms, for the C2 lane specifically, the identical finding
`LC-CONT-B1` (`foundry/level-b1/lc-cont-b1`, `.ai/foundry/requests/LC-CONT-B1.md`) already made by
direct code inspection: **no `LC-CONT-*` content lane can make a genuinely new intent evaluate
correctly from inside its `levels/<level>/**` write scope alone.** That document's file:line
evidence (`engine/responseEvaluation.js`'s `evaluateFree` switch with a fatal, non-escalating
`default` case; `SessionRunner.jsx`'s flat `MODEL_ANSWER`/`PROMPT` tables silently falling back to
Pre-A1's `introduction` entry for an unknown key; `curriculum/levels.js`/`episodeContent.js`'s
hardcoded, no-auto-discovery level registry; `scripts/build-curriculum-skeleton.mjs`'s hardcoded
arc-module import list; `engine/semanticContext.js`'s flat semantic-type registries; `i18n`'s flat
locale files) is re-verified against the current `main` head as part of this task and still
accurate — see "Re-verification" below. This document does not repeat that evidence in full;
read `LC-CONT-B1`'s request file first. Per the coordination contract, a scoped-out required
change is recorded here instead of being made quietly, and the PR stays draft.

## Re-verification for C2

Confirmed by direct grep against the current `main` head (not re-derived from memory):
`engine/responseEvaluation.js` still has exactly one `evaluateFree` switch shared by Pre-A1/A1;
`engine/scaffolding.js` still reads only the (now cross-level-aware, but still single) shared
capability map; `curriculum/episodeContent.js`'s `CONTENT_LOADERS` and `curriculum/levels.js`'s
`LEVELS` are still flat, hand-edited, two-level-only structures (`Pre-A1`, `A1`); `SessionRunner.jsx`
still has one shared `MODEL_ANSWER`/`PROMPT` pair. No `c2` entry, loader, or evaluator case exists
anywhere in any of these files, and none of them are inside `levels/c2/**`.

## What is uniquely harder for C2, beyond B1's general finding

C2's own blueprint (`docs/curriculum/blueprints/c2.json` → `coreEngineRequirements`, `c2.md` §15)
already named four additional core-engine gaps beyond the general registration wall B1 found. All
four are re-confirmed absent from the runtime today (verified by direct grep, not inference from
the blueprint's own claim):

1. **Multi-turn evaluation span (`evaluationSpan: "multiTurn"`).** No evaluator anywhere accepts
   more than one learner turn at a time. This blocks `sustain_coherence_across_topic_shifts`,
   `function_inside_an_unfamiliar_high_ambiguity_exchange` (arc 6) and the arc 8 capstone
   (`mediate_a_complex_disagreement_for_a_third_party`) from being evaluated honestly even if the
   general registration wall above were somehow bypassed for a single intent.
2. **A recordable `delayedRetrieval` evidence type.** Grepped the entire `src/learning` tree:
   zero matches for `delayedRetrieval`/`assistedOpen`/a six-category evidence vocabulary anywhere
   in runtime code. The learner model (`engine/learnerModel.js`) only records
   `evidenceKind: 'recognition' | 'guided' | 'open'` plus an orthogonal `independent` boolean —
   three categories, not six, and none of them is "retrieved unaided after intervening material."
   C2's capstone requires **multiple** distinct delayed-retrieval records in one task completion,
   which is a harder version of a gap that does not exist at any cardinality yet.
3. **`source_text` / `audience_profile` / `register_level` / `stance_marker` semantic types.**
   `engine/semanticContext.js`'s five flat registries have no multi-sentence-passage type, no
   target-audience-descriptor type, and no closed register enum. Nine of C2's 22 capabilities
   need `source_text` alone.
4. **Register-appropriateness / discourse-coherence scoring.** `LC-FND-002` already added the
   shared **contract shape** for these two dimensions to `responseEvaluation.js`'s `base()`
   (`registerAppropriateness`, `discourseCoherence`, both `checked: false` by default — see
   `docs/curriculum/core-engine-requirements.md`), but confirmed **no scoring logic exists for
   either**. C2's `shift_register_deliberately`, `manage_face_in_disagreement`,
   `sustain_coherence_across_topic_shifts` and the capstone all need real scoring against these
   fields, not just the shape.

## What LC-CONT-C2 did instead

Rather than editing shared-core files outside this task's write scope (forbidden by the
coordination contract and by `curriculum-master-a1-c2.md` §14 — "a level worker discovers a
shared-core need, it must raise the requirement instead of quietly implementing a private
workaround"), this task:

- confirmed and documented the C2-specific instance of the blocker (this file), rather than
  requiring a future reader to re-derive it from `LC-CONT-B1`'s finding plus C2's blueprint by hand;
- produced the level-owned design artifact the master's §14 explicitly permits without shared-core
  access — a full arc-by-arc, episode/step-level C2 content specification faithful to
  `c2.json`/`c2.md`, at `docs/curriculum/implementation/c2/content-plan.json` (machine-checkable)
  and `docs/curriculum/implementation/c2/README.md` (human-readable index), covering all 8 arcs,
  all 22 capabilities, all 13 new intents' evaluator test-case tables (correct / natural variant /
  near miss / wrong meaning / nonsense / pragmatically-inappropriate, per the blueprint's own §11),
  draft prompts/model answers, vocabulary examples, pattern examples, and personalization examples;
- built a structural validator, `scripts/foundry/c2/check-c2-content-plan.mjs`, that proves the
  content plan is internally faithful to the frozen `c2.json` blueprint (every required/should
  capability covered exactly once, every declared intent has all required test-case categories,
  every declared pattern is exemplified, arc order/prerequisites match, personalization-mode
  constraints respected — e.g. arcs marked `"none"` never carry an interest-flavored example) —
  entirely within this task's own write scope, requiring no shared-engine access;
- left `.ai/foundry/completed/LC-CONT-C2.json` **unwritten** and this PR in **draft**, because no
  runtime content exists and none is honestly claimed complete.

## What a CORE task needs to do

`LC-CONT-B1`'s request already proposes a new task (`LC-FND-003`, lane `core`, depending on
`LC-FND-002`) with write access to `engine/**`, `components/session/SessionRunner.jsx`,
`curriculum/**`, `i18n/**` and `scripts/**`, to build the per-level extension mechanism
`curriculum-isolation-plan.md` already named as the template (`levelMaps.js`'s pattern), covering
the general registration wall. This document adds C2-specific requirements that same (or a
follow-on) CORE task must also resolve before `LC-CONT-C2` can implement its arcs to their stated
evidence bar:

6. multi-turn evaluation span support in the shared evaluator dispatcher;
7. a genuine six-category evidence model in `learnerModel.js` (or an explicit, documented decision
   to keep the current three-category model and re-map C2's blueprint evidence targets onto it —
   a real design choice, not a default);
8. the four new semantic types registered in `semanticContext.js`;
9. real scoring logic for `registerAppropriateness`/`discourseCoherence`, not just the shape
   `LC-FND-002` already landed.

Numbers continue from `LC-CONT-B1`'s five-item list (registration wall items 1-5) so a future CORE
task can treat this as one combined backlog rather than two disconnected ones.

## What this does not resolve

This is a scope/architecture finding, not a pedagogical one.
`docs/curriculum/implementation/c2/content-plan.json`/`README.md` are design artifacts like the
blueprint itself — no runtime module imports them, they do not make C2 available, and they do not
claim any learner-facing evidence was produced. `docs/curriculum/blueprints/c2.md` §16's QA
acceptance list (20+ learner-shaped journeys per arc, transfer/delayed-retrieval/replay proof,
browser usability) can only be produced against running content, which does not yet exist.

## Once the CORE blocker is resolved

Resume `LC-CONT-C2` on this same branch. `docs/curriculum/implementation/c2/content-plan.json` is
the starting point for authoring the actual `levels/c2/**` runtime modules; the four C2-specific
core-engine requirements above still need answering as part of that work, not assumed away.
