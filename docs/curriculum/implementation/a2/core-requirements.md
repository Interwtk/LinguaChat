# A2 → runtime integration: what a wider-scope task still needs to do

Written by `LC-CONT-A2`, whose write scope is `linguachat-frontend/src/learning/levels/a2/**`,
`linguachat-frontend/scripts/foundry/a2/**` and `docs/curriculum/implementation/a2/**` only.
Everything below requires touching files outside that scope — `src/i18n/**`,
`src/learning/engine/**`, `src/learning/episodes/index.js`,
`src/components/session/**` — which per `.ai/foundry/tasks.json` belongs to
`LC-INT-001` ("Integrate A1-C2, run longitudinal learner journeys, and repair
integration defects"), the task with that wider write scope. This document is
the content-informed version of `docs/curriculum/curriculum-isolation-plan.md`
§3's instruction: "the moment to build the per-level-registry extension... is
when the first real type needs it, informed by what that level's content
actually requires." A2's content now exists (`levels/a2/**`); this is what it
actually requires.

## 1. Episode registration

`src/learning/episodes/index.js` resolves a level's episodes via a dynamic
import and a per-level `getEpisode(id)` contract (see that file's existing A1
wiring). `levels/a2/index.js` already exports `getA2Episode(id)` in the
identical shape. **Ask:** add an A2 case to the resolver's level switch,
importing from `levels/a2/index.js` — additive, no existing A1/Pre-A1 case
changes.

## 2. i18n keys

`levels/a2/i18n/en.js` is a complete draft English value for every key the 23
episodes reference (see that file; `check-a2-structure.mjs` proves no key is
missing a draft value). **Ask:** merge these into `src/i18n/translations.js` +
`src/i18n/locales/*.js` for every gated locale, then translate the non-English
locales — per CLAUDE.md, translation work stays in its own PR, separate from
this content merge. The episode-numbered key prefix convention (`ep39*`...`ep61*`)
already keeps A2's keys disjoint from Pre-A1/A1's, matching the existing
per-episode convention the isolation plan's survey confirms is already safe.

## 3. Evaluator dispatch

`levels/a2/evaluators.js` exports a full working reference implementation for
all 17 new intents (`A2_EVALUATORS`), built against the exact same result
contract `engine/responseEvaluation.js`'s `base()` already returns, plus a
reusable `twoClauseJudgment(text, {connectors, clause1Test, clause2Test})`
helper implementing `a2.json#coreEngineRequirements[1]`'s proposed shared
two-clause behaviour. **Ask:**

1. Add a case per new intent to `responseEvaluation.js`'s `evaluateFree`
   switch, calling into `A2_EVALUATORS[intent]` (or porting the logic inline if
   the switch's dispatch shape can't call an external map directly).
2. Decide whether `twoClauseJudgment` becomes a shared `engine/` utility (B1/B2
   will need clause-connector-clause judgment too, per the master's
   progression) or stays A2-local and is duplicated when B1 needs it — this
   task deliberately leaves that call to the integration task, since a second
   real consumer (B1) does not exist yet to inform the right shape, exactly the
   reasoning `curriculum-isolation-plan.md` used to defer the original
   refactor.
3. Register two subtype extensions on EXISTING A1 intents rather than new
   intents (`a2.json#intentStrategy.newSubtypesOnExistingIntents`):
   `repair_request` gains `repairKind: 'ask_to_spell'`, and `use_quantity`
   gains party-size counts. Both are additive cases on already-shared logic.
4. Add `PRAISE` table entries (`engine/hybridEvaluation.js`) and
   `MODEL_ANSWER`/`PROMPT` table entries (`components/session/SessionRunner.jsx`)
   and `OBJECTIVE_FORMATS` entries (`engine/formatChoice.js`) for the 17 new
   intents — the three tables `curriculum-isolation-plan.md` names as having a
   "documented history of real regressions when an intent is missing from it".
5. `check-a2-evaluators.mjs` (in this task's own scope) already proves the
   reference implementations discriminate correct/near-miss/nonsense/missing-
   second-clause per intent — rerun it after wiring to confirm the ported
   logic still passes the same battery.

## 4. Semantic-type registry

`levels/a2/semanticTypes.js` exports `A2_SEMANTIC_TYPES` (7 entries:
`past_time`, `future_time`, `month`, `date_ordinal`, `quality`, `problem`,
`day`) with a `validate()` function and documented `incompatibleWith` rules for
each, in the same shape `engine/semanticContext.js`'s `SEMANTIC_TYPES` already
uses. **Ask:** append these 7 entries to `SEMANTIC_TYPES`, and their
`INTENT_SLOTS` entries for the new intents that take a personalized value
(`describe_person_or_place` → `quality`/`place`/`person`;
`invite_someone`/`state_future_plan` → `activity`/`future_time`; etc., per
`levels/a2/semanticTypes.js`'s `A2_ARC_PERSONALIZATION` map). **Coordinate the
`day` type carefully**: `a2.json#coreEngineRequirements[0]` flags that A1's own
designed-only arc 7 (`making_arrangements`) already proposed `day` with the
same incompatibilities (`rejects time_point, relation`) — this module reuses
those exact incompatibilities rather than inventing new ones, specifically so
a single registration serves both lanes. If A1's arc 7 lands first and
registers `day` before this integration task runs, this module's `day` entry
should be treated as confirmation, not a second registration — a build-order
guard should make a genuinely conflicting second registration fail loudly
(`a2.json#coreEngineRequirements[0]`'s `testsRequired`).

## 5. Fact capture / privacy boundary

`report_a_problem`, `talk_about_future_plans` (arc 7's `factsCaptured:
preferred_activity`) and `talk_about_what_you_did` (arc 1's `factsCaptured:
recent_activity`) may want `learnerModel.js` `FACT_TYPES` entries, matching
A1's `captureStatedLifeFact`-style pattern. **`spell_a_name_for_a_booking`
MUST NOT get one** — `evaluators.js`'s `evaluateSpellWord` deliberately returns
no fact-worthy field (see its own comment and
`check-a2-evaluators.mjs`'s `spell_word result carries no persistable identity
field` assertion) precisely so a future integrator cannot casually wire a
spelled name into persistent storage the way a routine or plan is. **Ask:** add
`recent_activity` and `stated_plan`/`preferred_activity` to `FACT_TYPES`; add a
negative test (parallel to `check-a2-evaluators.mjs`'s own) asserting no
`FACT_TYPES` entry is ever created for a `spell_word` turn, satisfying
`a2.json#coreEngineRequirements[2]`'s `testsRequired` exactly.

## 6. Mini-story table

Four episodes use a `mini_story` step (39-42's `past_day_story`, 45-48's
`compare_two_places_story`, 51-54's `booking_call_story`,
55-57's `problem_resolution_story`, 58-61's `closing_invitation_story` — five
total, one per multi-episode arc except `making_plans` and `getting_around`,
which deliberately opt out per their own arc files' header comments). **Ask:**
add five entries to `engine/miniStory.js`'s `STORIES` table with these exact
`storyObjective` keys.

## 7. Cross-level id / prerequisite verification

Run `check-cross-level-ids.mjs` (already wired into `check:all`) after
importing `levels/a2/**` anywhere real, to confirm none of A2's new vocabulary/
pattern/capability ids collide with a registered Pre-A1/A1/other-level id — this
task's own `check-a2-structure.mjs` (`scripts/foundry/a2/**`) already runs an
equivalent local check against `a2.json`, but the shared registry is the
authoritative cross-level guard.

## 8. What this task could NOT prove as a result

Because none of the above is wired in, `LC-CONT-A2` cannot produce a live
in-app browser walkthrough, a real learner-journey replay through
`SessionRunner`, or a real i18n `check:i18n`/locale-loading pass for A2's own
keys (they are draft values in a level-owned file, not yet in
`src/i18n/**`). What it proves instead — structural correctness against the
blueprint, evaluator discrimination via `check-a2-evaluators.mjs`, and
simulated learner journeys against the level's own content+evaluators via
`check-a2-journeys.mjs` — is documented in `status.md`. `LC-INT-001` is where
end-to-end, in-app proof becomes possible, per the master contract's own
parallel-authoring rule (§18: step 5 authors level-owned content in parallel;
step 7 integrates one level at a time through the global gate).
