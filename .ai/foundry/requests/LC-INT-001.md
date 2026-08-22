# LC-INT-001 — a scope gap this task cannot resolve from inside its own write scope

Discovered while wiring A1 arcs 6-7 into the shared runtime engine (first bounded
checkpoint of this task). Recorded here per the resume contract: "if a conflict is
outside scope, record the exact blocker instead of editing around it."

## The blocker

LC-INT-001's declared `writeScopes` (`.ai/foundry/tasks.json`) are:

```
linguachat-frontend/src/learning/**
linguachat-frontend/src/i18n/**
linguachat-frontend/src/services/**
linguachat-frontend/src/context/**
linguachat-frontend/src/components/**
linguachat-frontend/scripts/**
linguachat-frontend/package.json
linguachat-frontend/package-lock.json
linguachat-backend/**
docs/curriculum/**
```

**`linguachat-frontend/src/data/**` is not in this list.** `src/data/vocabulary.js`
holds `SEED_VOCAB`/`SEED_VOCAB_BY_ID`, the single shared vocabulary catalogue every
level's episodes grant Garden items from. `scripts/check-curriculum-authoring.mjs`
(a correctness check, not one this task may weaken — an explicit supervisor
instruction on this PR says so directly) asserts that every `gardenItems` entry and
every step `itemIds`/`meaningItems` reference in every runtime episode resolves to a
real `SEED_VOCAB_BY_ID` entry.

A1 arcs 6-7 (this checkpoint's own content, authored by `LC-CONT-A1` under
`src/learning/levels/a1/**`) introduce 14 new vocabulary ids (`can_ability_pattern`,
`swim`, `cook`, `drive`, `dance`, `can_you_ability_pattern`, `how_do_you_say_pattern`,
`sing`, `day_of_week_pattern`, `arrange_pattern`, `monday`, `friday`, `the_station`,
`the_cinema`) that do not exist in `src/data/vocabulary.js` yet, and this task's write
scope does not permit adding them there.

**This is not unique to A1.** The same pattern — and the same explicit expectation
that LC-INT-001 would have this scope — already exists in three other completed
content tasks' own staging files:

- `linguachat-frontend/src/learning/levels/b1/vocabulary.js` (`B1_VOCAB_BY_ID`),
  whose own header says verbatim: *"`src/data/**` is outside this task's write
  scope... LC-INT-001 merges these into `SEED_VOCAB_BY_ID` under the same ids."*
- `linguachat-frontend/src/learning/levels/b2/b2Vocabulary.js`
- `linguachat-frontend/src/learning/levels/c1/c1Vocabulary.js`
- `linguachat-frontend/src/learning/levels/c2/c2Vocabulary.js`

All four were written under the same assumption A1's own content task made:
that the integration task would have `src/data/**` write access. **It does not**,
per a direct, live run of `.github/scripts/check-foundry-scope.mjs` against this
exact branch (which correctly rejected a first attempt at this that added the 14
A1 entries directly to `vocabulary.js`).

## What this task tried, and ruled out

1. **Add the entries to `vocabulary.js` anyway** — ruled out. The scope guard is a
   hard, deterministic, automated merge gate (`check-foundry-scope.mjs`, run by the
   orchestrator before any Foundry PR merges); a violation does not merge regardless
   of justification, so this would not actually unblock anything, only hide the real
   blocker behind a red automated gate later.
2. **Weaken `check-curriculum-authoring.mjs`'s catalogue-membership check** (e.g. an
   allowlist for arc 6/7's ids, or a parallel lookup this check alone reads) — ruled
   out. The check is correct: an uncatalogued Garden grant is a real defect (the
   Memory Garden would render an item with no term/meaning/emoji the day A1 opens).
   Weakening a correctness check to route around a scope gap is explicitly the kind
   of QA shortcut this task was told not to take.
3. **Remove the affected `gardenItems`/`itemIds` from arc 6-7's episode content** —
   ruled out. `itemsOf()` (read by the same check) collects ids from step `itemIds`/
   `meaningItems` too, not just `gardenItems`; removing every reference to these 14
   ids would mean stripping item-tracking metadata from nearly every step across all
   5 episodes — not a "temporary content trim," effectively gutting the authored
   content's structure for a scope technicality. Left untouched.
4. **Monkey-patch `SEED_VOCAB` at runtime from an in-scope module** (import it and
   `.push()` new entries before anything reads it) — ruled out as a bad-faith
   workaround: it changes `src/data/vocabulary.js`'s observable behaviour without
   ever being reviewable as a change to that file, which defeats the point of a
   write-scope boundary rather than respecting it.

## What is NOT blocked, and is committed on this branch

Every other dimension of A1 arc 6-7's runtime wiring is complete and proven:
episode registration (resolver, skeleton generator, per-arc hardcoded import lists),
evaluator dispatch (`state_ability`/`ask_ability`/`arrange_meeting` in
`evaluateFree`, `ask_how_to_say` merged into `evaluateRepairRequest` with a
frontend/backend-parity mirror in `linguachat-backend/ai/evaluator.py`), the `day`
semantic-type registration (resolving the A1/A2 `incompatibleWith` mismatch as a
documented union), `PRAISE`/`MODEL_ANSWER`+`PROMPT`/`OBJECTIVE_FORMATS` table
entries, `abilityForm`/`arrangeStage`/`praisePrefix` threading through
`EpisodeShell.jsx`/`MiniStory.jsx`/`hybridEvaluation.js`, the `arrange_meeting`
hosted story (episode 38), the `check-a1-blueprint.mjs` "on purpose" guard edit,
and the full 122+5-key i18n merge (English base + all 7 locale placeholders).
`check:all` is fully green EXCEPT for the 22 catalogue-membership assertions this
document explains (all 14 missing ids, referenced from `i_can_i_cant`, `can_you`,
`when_are_you_free`, `where_shall_we_meet`, `see_you_on_friday`).

## The ask

One of, whichever the orchestrator/supervisor judges cheaper:

1. **Amend `LC-INT-001`'s `writeScopes` in `.ai/foundry/tasks.json`** to add
   `linguachat-frontend/src/data/**` — this is the file's evident original intent,
   given four independent content tasks (A1, B1, B2, C1, C2 in effect) all wrote
   their vocabulary hand-off assuming it; or
2. **Spin up a narrowly-scoped follow-up task** (any lane) whose only write scope is
   `linguachat-frontend/src/data/vocabulary.js`, to merge the ~14 (A1) + however many
   B1/B2/C1/C2 turn out to need once those levels are wired, all under one
   deliberately reviewed change; LC-INT-001 (or whichever task has the wider scope)
   resumes immediately once that lands.

Until either happens, `check:all` on this branch will keep failing on exactly the
22 assertions listed above, and the same class of failure will recur, larger, the
moment A2/B1/B2/C1/C2 are wired in (subsequent checkpoints of this same task).
