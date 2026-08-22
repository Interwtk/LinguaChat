# A2 content authoring conventions

Shared spec for every A2 arc content file under
`linguachat-frontend/src/learning/levels/a2/episodes/`. Written once so seven arcs
authored in parallel stay mechanically consistent with each other and with
`docs/curriculum/blueprints/a2.json` (the source of truth for ids, counts and
links) and `docs/curriculum/blueprints/a2.md` (the prose rationale).

**Status.** This module is level-owned content. Nothing here is imported by
runtime code yet — exactly like a blueprint, but as working JS instead of prose,
so a later integration task (`LC-INT-001`, which has the wider write scope this
task deliberately does not) can wire it in without re-deriving structure. See
`docs/curriculum/implementation/a2/status.md` and `core-requirements.md` for what
integration still needs.

## 1. File layout

One file per arc: `linguachat-frontend/src/learning/levels/a2/episodes/a2Arc<N><PascalId>.js`,
numbered by `a2.json#arcs[].order`:

1. `a2Arc1WhatHappened.js` — episodes 39–42
2. `a2Arc2MakingPlans.js` — episodes 43–44
3. `a2Arc3PeopleAndPlaces.js` — episodes 45–48
4. `a2Arc4GettingAround.js` — episodes 49–50
5. `a2Arc5BookingAStay.js` — episodes 51–54
6. `a2Arc6EverydayProblems.js` — episodes 55–57
7. `a2Arc7LetsDoSomething.js` — episodes 58–61

Each file exports `A2_ARC<N>` (array of episode objects, in plannedNumber order),
`A2_ARC<N>_ID` (the arc id string from `a2.json#arcs[].id`), and
`getA2Arc<N>Episode(id)` (`A2_ARC<N>.find(ep => ep.id === id) || null`) — the same
three-export shape `a1Arc1.js` uses, so `levels/a2/index.js` can aggregate them
identically to how `episodes/index.js` aggregates the A1 arcs.

## 2. Episode object schema

Mirrors the live A1 schema (`episodes/a1Arc1.js`) exactly, field for field:

```js
{
  id: 'kebab_or_snake_case_stable_id',      // stable, never renumbered
  arc: 'what_happened',                      // a2.json#arcs[].id, exact string
  level: 'A2',
  role: 'primary' | 'reinforcement',         // from a2.json#episodes[].role
  reinforces: true,                          // only present when role === 'reinforcement'
  titleKey: 'ep{N}Title',
  goalKey: 'ep{N}Goal',
  canDoId: 'talk_about_what_you_did',        // a2.json#canDos[].id, exact string
  canDoNameKey: 'ep{N}CanDoName',
  durationKey: 'ep{N}Duration',
  estimatedMinutes: 8,                        // integer, author judgement from novelty/step count
  xp: 70,                                     // integer, follows A1's ~10xp-per-minute convention
  prerequisites: ['prior_episode_id'],        // EPISODE ids within A2 (or [] for an arc's first episode) — capability readiness comes from skillPrerequisites, not episode order, exactly as a1Arc1.js's WORK_01 comment explains
  skillPrerequisites: ['canDo_id', ...],      // canDo ids — may be A1-required ids (see a2.json#a1Inheritance) or earlier-taught A2 canDo ids
  gardenItems: ['item_id', ...],              // NEW vocabulary/pattern items this episode grants; [] for pure reinforcement episodes that grant nothing new
  reuseSkills: ['canDo_id', ...],             // canDo ids this episode deliberately reuses (from a2.json#arcs[].a1Reuse / a2Reuse / reinforcedCanDos)
  steps: [ /* see §3 */ ],
}
```

`{N}` is always `a2.json#episodes[].plannedNumber` (39–61), matching the live A1
convention of numbering i18n keys by episode number, not by arc-local index.

## 3. Step types

Use exactly the vocabulary the live engine already renders generically (see
`episodes/a1Arc1.js`, `a1Arc2.js`, `a1Arc4.js`, `a1Arc5.js` for real examples of
every one of these):

| type | required fields | notes |
|---|---|---|
| `scene` | `mood`, `titleKey`, `bodyKey`, `ctaKey` | `showGoal: true` on an arc's first scene |
| `model` | `target` (literal English), `meaningItems` (item ids), `explainKey` | `response` optional for a two-turn model |
| `comprehension` | `instructionKey`, `target` (literal English), `itemId`, `options: [{key, correct?}]` | exactly one `correct: true` |
| `word_order` | `instructionKey`, `hintKey`, `tokens` (array), `itemId` | tokens include punctuation as its own token, e.g. `'?'` |
| `fill_blank` | `instructionKey`, `before`, `after`, `expects`, `itemId`, `hintKey` | `alternatives` optional array of other accepted answers |
| `choice` | `instructionKey`, `promptEn` (literal), `itemId`, `options: [{textEn, correct?}]` | receptive; used for "who did/said X" comprehension checks |
| `free_reply` | `speaker: 'lingua'`, `promptEn` (literal), `instructionKey`, `evalKind`, `itemIds` | `suggestionEn` present while support is offered, ABSENT once the arc's autonomy target withdraws it (see a2.json#arcs[].autonomyTarget); `format: 'roleplay'` for continuous-exchange turns; `variation: true` + `sceneEn` instead of `promptEn` for a second phrasing of the same drill |
| `recall` | `instructionKey`, `evalKind`, `itemIds` | `review: true` when it recalls a PRIOR episode's capability at the start of a new one |
| `mini_story` | `storyObjective`, `instructionKey` | `storyObjective` is a new key this level proposes (e.g. `'past_day_story'`); the actual `STORIES` table entry is core-engine work, listed in `core-requirements.md` — write the step anyway, exactly as A1 arcs do, since the table entry is additive and does not change this file |
| `completion` | `canDoNameKey`, `titleKey`, `bodyKey`, `ctaKey` | always the final step |

**Two-clause steps** (arcs 1, 3, 5, 6, 7 — any `evalKind` in
`evaluationStrategy.hybrid`): the canonical target/suggestion sentence must
actually contain the taught connector (`and`/`but`/`so`/`because`/`first...then`),
not a single clause, so the evaluator reference implementation
(`levels/a2/evaluators.js`) has a real two-clause example to score.

## 4. i18n keys — literal text vs. keys

Unchanged from A1 (`episodes/a1Arc1.js` header comment): **all system/instruction
prose is a key** (`instructionKey`, `titleKey`, `bodyKey`, `explainKey`, `hintKey`,
option `key`s), never inlined. **Target-language (English) content the learner
reads as the practice material** — `target`, `promptEn`, `sceneEn`, `suggestionEn`,
`textEn`, `tokens` — is always a literal English string, never translated, never
behind a key, exactly as CLAUDE.md's language-architecture section requires.

Every key referenced must appear in `levels/a2/i18n/en.js` (see task for that
file) with a real, finished English sentence — not a placeholder — because
`scripts/foundry/a2/check-a2-structure.mjs` fails the build if a referenced key
has no draft value.

Key naming (matches A1 exactly): `ep{N}Title`, `ep{N}Goal`, `ep{N}CanDoName`,
`ep{N}Duration`, `ep{N}SceneTitle`, `ep{N}SceneBody`, `ep{N}Start` (first episode
of an arc) or `ep{N}Continue` (later episodes reusing a scene transition),
`ep{N}ModelExplain`, `ep{N}ComprehensionInstruction`,
`ep{N}CompOptCorrect`/`CompOptWrong1`/`CompOptWrong2`, `ep{N}OrderInstruction`,
`ep{N}BlankInstruction`, `ep{N}BlankHint`, `ep{N}ListenInstruction` (for `choice`
steps), `ep{N}OpenInstruction` (first `free_reply`), `ep{N}<Label>Instruction` for
additional named free_reply turns (`ep{N}AskInstruction`,
`ep{N}RepairInstruction`, `ep{N}IntegratedInstruction`, etc. — short, descriptive,
unique within the episode), `ep{N}RecallInstruction`/`ep{N}FinalInstruction`,
`ep{N}StoryInstruction` (mini_story), `ep{N}CloseTitle`, `ep{N}CloseBody`,
`ep{N}CloseCta` (or the shared `ep1CloseCta` when the closing CTA text is
identical, exactly as A1 arcs already share `ep1CloseCta`/`ep1BuildHint` across
episodes).

## 5. evalKind naming

Use exactly the intent names from `a2.json#intentStrategy.newIntents` as
`evalKind` values: `state_past_event`, `ask_past_event`, `narrate_past_sequence`,
`state_future_plan`, `ask_future_plan`, `describe_person_or_place`,
`compare_things`, `state_opinion_with_reason`, `give_multi_step_directions`,
`ask_availability`, `state_availability`, `make_booking`, `spell_word`,
`report_problem`, `ask_for_help`, `invite_someone`, `respond_to_invitation`. For
a step reusing an A1 intent (e.g. `repair_request` with `repairKind: 'ask_to_spell'`,
or `use_quantity` for party-size counts), use the exact A1 `evalKind` string
unchanged — do not invent a synonym.

Every `evalKind` used in episode content must have a matching reference
implementation exported from `levels/a2/evaluators.js` (own task) — the structure
check fails otherwise.

## 6. itemIds / gardenItems

`itemIds` on a step and `gardenItems` on an episode are vocabulary/pattern
identifiers, snake_case, stable. A pattern item id matches
`a2.json#patterns[].id` when the step is teaching or drilling that pattern
directly (e.g. `simple_past_regular_pattern`). A vocabulary item id is a new,
level-scoped snake_case id not already used by Pre-A1/A1 (the structure check
cross-references `check-cross-level-ids.mjs`'s existing registry rules) or one of
the `a1Inheritance.reuseFrequently`/`reuseOccasionally` A1 ids reused verbatim.

## 7. Personalization slots (arcs 3 and 7 = themed; arcs 1, 2, 5, 6 = light; arc 4 = none)

Per `a2.json#arcs[]` and `a2.md`§7: where an episode's scene/prompt names a
context that could be personalized (a café, an activity, a place), write the
**neutral fallback** version literally in the episode file — that is what a
learner without a matching interest, or during structural QA, actually sees. Do
not hardcode a specific interest inline; leave a short inline comment noting
which semantic slot type (`place`, `person`, `activity`, `quality`) the personalization
engine would substitute there once wired in, matching `a2.md`§7's table. This
keeps the file honestly representing what runs today (neutral) while documenting
the personalization hook for later wiring.

## 8. What NOT to do

- Do not invent a capability, pattern, intent, or vocabulary item not in
  `a2.json`. If an episode seems to need one, stop and note it in the file's
  header comment (matching `a1Arc1.js`'s own precedent of naming a risk/decision
  in a header comment) rather than silently adding it.
- Do not collect or reference real personal data anywhere, including in
  `spell_a_name_for_a_booking` episodes — booking/display names only, per
  `a2.json#canDos[].privacyNote`.
- Do not exceed the arc's `vocabularyBudget` (`newProductive`/`newReceptive`
  counts in `a2.json#arcs[]`) across that arc's `gardenItems`.
- Do not write a review episode that repeats old screens verbatim; every
  `reinforcement` episode must integrate the reused capability into a new
  situation, exactly as A1's arc-closing episodes do (see `a1Arc1.js` `WORK_03`'s
  header comment on why).
