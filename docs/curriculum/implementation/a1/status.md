# A1 arc 6/7 implementation status (LC-CONT-A1)

**Level status: unchanged. A1 stays `contentStatus: partial`, `available: false`** — per CLAUDE.md's
frozen availability rule ("A1 stays `contentStatus: partial` and `available: false` until all seven
arcs are implemented... and a separate A1 completion gate deliberately changes the level state") and
"Arcs 6–7 (34–38) remain designed-only and must fail closed", both unchanged by this task. This task
adds content and reference code that could not be wired into the runtime from inside its own write
scope (see `core-requirements.md` §0 for why arc 6/7 specifically, unlike A2/B2, could not even ship
as unwired `.js` — it had to be JSON).

## 1. What this task built

All inside this task's write scope (`linguachat-frontend/src/learning/levels/a1/**`,
`linguachat-frontend/scripts/foundry/a1/**`, `docs/curriculum/implementation/a1/**`,
`linguachat-frontend/src/learning/episodes/a1*`):

- **5 episodes across 2 arcs** (`what_you_can_do` 34-35, `making_arrangements` 36-38), matching
  `docs/curriculum/a1-blueprint.json` exactly (ids, canDo coverage including the arc's one
  two-capability episode, pattern coverage, vocabulary budgets, evidence targets, autonomy fade,
  reuse/integration turns, the closing mini-story with its accept/postpone branch). Content lives as
  data (`levels/a1/episodes/whatYouCanDo.json`, `makingArrangements.json`), not `.js` — see
  `core-requirements.md` §0 and `authoring-conventions.md` for exactly why, discovered by actually
  running the shared blueprint guard against a first draft, not assumed in advance.
- **A full reference evaluator implementation for the level's 3 new intents**
  (`levels/a1/evaluators.js`: `evaluateStateAbility`, `evaluateAskAbility`, `evaluateArrangeMeeting`),
  plus a fourth reference function (`evaluateAskHowToSay`) for the existing `repair_request` intent's
  proposed fifth `repairKind`. **Resolves the level's one documented architectural debt
  (`coreEngineRequirements.canAmbiguity`) as real, tested code** — see `core-requirements.md` §3.
- **A1's proposed `day` semantic type** (`levels/a1/semanticTypes.js`), verbatim from the blueprint,
  with a documented (not silently resolved) mismatch against A2's own already-shipped `day` proposal.
- **A complete draft English i18n key set** (`levels/a1/i18n/en.js`) — 122 distinct keys (106
  referenced by the episode content's own `*Key`/`key` fields, plus 16 the reference evaluators emit
  at runtime — `praiseKey`/`priorityCorrection`/`explanation` values a content-only completeness check
  would miss), each a finished English sentence, not a placeholder.
- **Three level-owned QA scripts** (`scripts/foundry/a1/`): `check-a1-arc6-arc7-structure.mjs`
  (blueprint conformance, a content-level assertion that the canAmbiguity disambiguation is actually
  taught, a self-check that every step's own `suggestionEn` passes its own paired evaluator, and a
  static scan of `evaluators.js` proving every key it can emit has a draft value),
  `check-a1-arc6-arc7-evaluators.mjs` (a correct/near-miss/nonsense/insufficient-form battery per
  intent, plus the full canAmbiguity refusal battery), `check-a1-arc6-arc7-journeys.mjs` (>=20
  simulated varied learner journeys per arc against the level's own content+evaluators, honouring each
  real step's own declared `abilityForm`/`arrangeStage`/`praisePrefix` rather than a fixed persona).
- `docs/curriculum/implementation/a1/authoring-conventions.md` and `core-requirements.md` — the shared
  spec both arcs were authored against, and the precise, content-informed ask for `LC-INT-001`.

## 2. Measured evidence

See the PR's `## Evidence` section for exact command output. Summary:

- `node scripts/foundry/a1/check-a1-arc6-arc7-structure.mjs` — PASS (2 arcs, 5 episodes, 8 distinct
  evalKinds, 106 content-referenced + 16 evaluator-emitted i18n keys all present as drafts, no
  prerequisite cycles, no orphan required/should capability, canAmbiguity content assertion holds,
  every suggestionEn passes its own paired evaluator)
- `node scripts/foundry/a1/check-a1-arc6-arc7-evaluators.mjs` — PASS (41/41 cases: correct/near-miss/
  nonsense/insufficient-form per intent, plus 4 explicit canAmbiguity refusal cases and 5 taught-activity
  acceptance cases)
- `node scripts/foundry/a1/check-a1-arc6-arc7-journeys.mjs` — PASS (95 simulated journeys: 35 for
  `what_you_can_do` from 7 evaluable steps, 60 for `making_arrangements` from 12 evaluable steps, both
  well above the 20/arc minimum)
- `node scripts/check-a1-blueprint.mjs` — PASS (proves this task's new files do not trip the shared
  guard that keeps arc 6/7 out of the shipped product — see `core-requirements.md` §0)
- `cd linguachat-frontend && npm run check:all` — PASS, exit 0 (unchanged baseline: this task's files
  are additive, and the JSON/level-owned-JS files are unimported by any runtime path)
- `cd linguachat-frontend && npm run build` — PASS, exit 0 (no arc-6/7 chunk in `dist/`, confirming
  zero bundle impact)
- `cd linguachat-backend && python -m compileall . && python -m pytest -q` — PASS, exit 0 (unchanged;
  no backend files touched)
- `node .github/scripts/check-foundry-scope.mjs --branch foundry/level-a1/lc-cont-a1 --base origin/main --head HEAD`
  — PASS, all changed files inside the declared write scope
- `node .github/scripts/check-supervisor-evidence.mjs` — PASS (pedagogical 120/100 unique primary
  studies/14 topics, psychology 127/100/14 topics; required by `requiresEvidenceReady: true`)
- **Two consecutive fully clean cycles** run after the last edit, zero edits between runs.

## 3. What this task could NOT prove, and why

Arc 6/7's content is not wired into the runtime — episode registration (`episodes/index.js`), i18n
merge (`src/i18n/**`), evaluator dispatch (`engine/responseEvaluation.js`'s switch), the semantic-type
registry (`engine/semanticContext.js`), fact capture (`engine/learnerModel.js`), the mini-story table
(`engine/miniStory.js`), and — specific to these two arcs only — the deliberate literal-text guard in
`scripts/check-a1-blueprint.mjs` that keeps them out of `src/**` at all until opened on purpose, are
all outside this task's write scope and belong to `LC-INT-001`. This is not a scope violation avoided
reluctantly — it is the master contract's own parallel-authoring rule, applied to the one A1 arc pair
where the shared tooling enforces it more strictly than for any other level (§0's discovery).

Concretely, this task could NOT run or produce:

- a live in-app browser walkthrough of episode 34-38 (390px/1440px, light/dark);
- a real learner-journey replay through `SessionRunner`/the shared session engine;
- `npm run check:i18n`'s real locale-parity proof for these 122 keys (they are draft values in a
  level-owned file, not yet merged into `src/i18n/**`);
- replay/idempotency proof through the real XP/Garden reward pipeline;
- cross-level `check-cross-level-ids.mjs` proof against the live registry (this task's own
  `check-a1-arc6-arc7-structure.mjs` proves an equivalent check against `a1-blueprint.json` directly).

What was proved instead, honestly and at the level this task's scope allows: structural conformance to
the blueprint, evaluator correctness (discrimination between correct/near-miss/nonsense/
insufficient-form, including the canAmbiguity refusal battery this arc exists to resolve), and 95
simulated varied learner journeys against the real content paired with the real reference evaluators.
`LC-INT-001` is where end-to-end, in-app proof becomes possible.

## 4. Pedagogical self-check against the master contract

- **No false mastery**: every credited capability's evidence follows the shared categories
  (comprehension, guided, independent, integrated) unchanged from arcs 1-5; the arc's own
  `independent: 2` target is reached WITHIN the arc for `arrange_to_meet` (episodes 37 and 38 both
  produce an unaided confirmation), the same shape arc 3 already established for
  `introduce_someone_else`.
- **No personalization drift**: both arcs declare `personalizationMode: none` explicitly; no
  `canDoId`, `evalKind`, expected pattern, evidence, difficulty or XP is ever slot-driven.
- **Delayed retrieval and transfer, named explicitly**: episode 36 reuses arc 2's `time_at_pattern`
  (15 episodes earlier); episode 38 retrieves `introduce_self`, `ask_wellbeing`, `express_preferences`,
  `say_when_something_happens`, `say_where_something_is`, `ask_for_repair` and `close_an_encounter` —
  eight capabilities, several from Pre-A1, all inside the level's own closing conversation.
- **The canAmbiguity risk, closed rather than deferred**: the blueprint names this "the level's one
  real architectural debt". This task did not defer it to a design note (as `core-engine-requirements.md`
  did for B2/C1's register-appropriateness/discourse-coherence asks, correctly, since those levels have
  no runtime content yet to validate against) — A1 arc 6 DOES have real content now, so the fix is real,
  tested code with a named regression-proof property (zero edits to the function it must not break).

## 5. Self-review findings, and what was fixed

A code-review pass over the first draft found and this task fixed:

- **Two content/evaluator-pairing bugs**: episode 36's ability-reuse turn asked about an untaught
  activity ("come") whose own suggested answer therefore failed `evaluateStateAbility`; episode 37's
  "agree to the new place" turn was tagged `arrangeStage: 'confirm'` (requiring day+time+place) but
  only negotiates a place, so its own suggested answer failed `evaluateArrangeMeeting`. Both fixed at
  the content level (a taught activity; the correct stage), and a permanent self-check added to
  `check-a1-arc6-arc7-structure.mjs` (§7b: every step's `suggestionEn` must pass its own evaluator)
  so this class of bug cannot silently ship again.
- **16 missing i18n keys**: the reference evaluators' own `praiseKey`/`priorityCorrection`/
  `explanation` values had no draft translation anywhere, invisible to a completeness check that only
  read the episode JSON. Fixed by adding all 16 to `i18n/en.js` and adding §8b to
  `check-a1-arc6-arc7-structure.mjs`, which statically scans `evaluators.js` for every key it can
  emit.
- **A real design gap**: `evaluateArrangeMeeting`'s `'confirm'` branch is genuinely shared by episode
  37 and episode 38, but originally hardcoded episode-38 praise copy for both. Fixed with a
  `praisePrefix` option content can override (episode 37's confirm steps now do); documented in
  `authoring-conventions.md`.
- **`check-a1-arc6-arc7-journeys.mjs` never exercised `state_ability`'s polarity check or
  `evaluateAskHowToSay`** against real content (the polarity option was silently dropped; the
  how-to-say evaluator wasn't in the map the self-check reads). Fixed: the journeys script now
  forwards each real step's own `abilityForm`, and `check-a1-arc6-arc7-structure.mjs`'s §7b
  self-check now also validates `repair_request`/`ask_how_to_say` steps via a dedicated
  `A1_ARC6_ARC7_REPAIR_KIND_EVALUATORS` map.
- **A real evaluator limitation**: `evaluateStateAbility`'s polarity regexes required "I" and
  "can"/"can't" to be adjacent, so a natural reply like "I definitely can't cook." was misjudged as
  having no ability frame at all. Fixed to tolerate one intervening word, deliberately capped at one
  so a sentence about someone else's ability ("I think you can help") is still correctly not matched.
- **Minor duplication cleanup**: a `nonsense(r)` helper (alongside the existing `empty(r)`) and a
  `withPraise(r, prefix)` helper replaced five and six copy-pasted literals respectively in
  `evaluators.js`; `semanticTypes.js`'s `day.validate()` now imports the same `DAYS` list
  `evaluators.js` already exports instead of re-declaring it; `index.js` dropped an unnecessary
  intermediate-constant indirection.

Not changed, and deliberately so: the `REPAIR_COMPLEMENT_RE`/engine-internal-regex parallel and the
A1/A2 `day`-type `incompatibleWith` mismatch — both already documented as intentional, content-informed
handoffs to `LC-INT-001` (`core-requirements.md` §3, §4), not gaps this task could close itself.
