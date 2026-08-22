# A1 arc 6/7 authoring conventions

The shared spec the two arcs (`what_you_can_do`, episodes 34-35; `making_arrangements`, episodes
36-38) were authored against. Read alongside `docs/curriculum/a1-authoring-contract.md` (arcs 1-5's
own conventions, which this mostly follows) and `a1Arc6.js`/`a1Arc7MakingArrangements.js`'s
predecessors, `episodes/a1Arc1.js`...`a1Arc5.js`.

## Where content lives, and why it differs from arcs 1-5

Episode data is **JSON**, not `.js`: `linguachat-frontend/src/learning/levels/a1/episodes/
whatYouCanDo.json` (arc 6) and `makingArrangements.json` (arc 7) — each an array of episode objects,
field-for-field identical in shape to arcs 1-5's `.js` episode objects (`id`, `arc`, `level`, `role`,
`titleKey`, `canDoId`, `gardenItems`, `steps`, ...). `docs/curriculum/implementation/a1/
core-requirements.md` §0 explains exactly why: a shared, out-of-scope guard script
(`scripts/check-a1-blueprint.mjs`) hard-fails on these two arcs' literal id strings anywhere in `.js`/
`.jsx`/`.mjs` source under `src/learning/**`, by design, until a wider-scope task deliberately opens
them. JSON is invisible to that file-extension-filtered scan, so it is where arc 6/7's *content*
lives; nothing about the *shape* of an episode object changed.

`levels/a1/index.js` is the aggregator (`getEpisode(id)`, `A1_ARC6_ARC7_ARCS`,
`A1_ARC6_ARC7_EPISODES`) — the same contract `episodes/a1Arc1Content.js` documents for every level
content module. `levels/a1/evaluators.js` is the reference evaluator implementation (not dispatched;
see core-requirements.md §3). `levels/a1/semanticTypes.js` proposes the one new semantic type these
two arcs need (`day`). `levels/a1/i18n/en.js` is the complete draft English key set.

## Step-payload conventions this task introduced

Two step-level fields exist that arcs 1-5 never needed, both following the authoring contract's own
rule ("variants travel as a subtype on the step payload... not as a new intent"):

- **`abilityForm: 'positive' | 'negative'`** on a `state_ability` step — which polarity of "I can /
  I can't ___" the step expects. Omitted where either polarity is acceptable (e.g. a free-choice
  recall).
- **`arrangeStage: 'propose' | 'place' | 'confirm'`** on an `arrange_meeting` step — which part of the
  arrangement the step is asking for: a day+time proposal, a place, or the full day+time+place
  confirmation (the arc's headline evidence, episodes 37-38).
- **`praisePrefix`** on an `arrange_meeting` `'confirm'`-stage step — `evaluateArrangeMeeting`'s
  `'confirm'` branch is the one place a single evaluator branch is genuinely shared by two different
  episodes (37's confirmation turns and 38's), so the step declares which episode's praise copy
  applies rather than the evaluator guessing from stage alone (defaults to `'ep38'`; episode 37's own
  confirm steps set `'ep37'` explicitly). Found and fixed by review — the first draft hardcoded
  `'ep38'` unconditionally, which would have shown "that's the end of A1!" praise mid-episode-37.

One episode-level field is new: **`secondaryCanDoId`**, paired with a step-level
**`creditsCanDoId`** — episode 35 (`can_you`) is the only episode in this arc pair whose blueprint
entry teaches two `should`-scope can-dos in one episode (`ask_someone_about_ability` primary,
`ask_how_to_say_something` credited via a `repair_request`/`ask_how_to_say` turn), the same "one
episode, two capabilities" shape arc 3's `A1_CAN_DO_EXTRA_INTENTS` already established for A1, applied
here with an explicit, checkable pointer from the episode to the step that actually credits the
second capability (`check-a1-arc6-arc7-structure.mjs` §4 asserts the crediting step exists, not just
the declaration).

## The canAmbiguity disambiguation, taught twice

`a1-blueprint.json#coreEngineRequirements.canAmbiguity` — the level's one documented architectural
debt — is resolved as CONTENT in episode 35's own steps (a `choice` step contrasting "Can you swim?"
against "Can you repeat, please?"/"Can you speak slowly, please?", directly asking the learner to sort
ability from request) and as CODE in `levels/a1/evaluators.js`'s `evaluateAskAbility` (the same
distinction, implemented and tested — see `core-requirements.md` §3). Neither exists without the
other: the content step teaches the distinction nothing in Pre-A1 ever required the learner to notice;
the evaluator proves the distinction is actually judgeable, not just a nice idea for a lesson.

## What was deliberately NOT introduced

- **No new semantic type beyond `day`.** `activity`, `time_point` and `place` — the other three these
  arcs need — already exist in the shipped engine registry (arc 1, arc 2 and arc 4 registered them
  respectively).
- **No new can-do beyond the blueprint's own four** (`say_what_you_can_do`, `ask_someone_about_ability`,
  `ask_how_to_say_something`, `arrange_to_meet`). Episodes 36-38 all evidence the SAME required
  capability (`arrange_to_meet`) in stages — the arc's own `role` field (`primary`, `reinforcement`,
  `primary`) says so — the same "one capability, three episodes" shape arc 3 already used for
  `introduce_someone_else`.
- **No personalization.** Both arcs declare `personalizationMode: none` explicitly in
  `semanticTypes.js`'s `A1_ARC_PERSONALIZATION` (rather than omitting the field) — the blueprint's own
  risk notes for both arcs describe situation-first, not topic-first, content, and neither arc's
  `canDoId`/evidence/evalKind is ever slot-driven.
- **No fact-capture code.** `can_do_activity` and `preferred_day` are named as an ask in
  `core-requirements.md` §5, not implemented — no `levels/a1/**` file touches `learnerModel.js`.
