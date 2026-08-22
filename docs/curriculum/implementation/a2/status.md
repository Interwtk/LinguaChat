# A2 implementation status (LC-CONT-A2)

**Level status: content built, not yet integrated. A2 stays `contentStatus:
partial`, `available: false`** — unchanged, per CLAUDE.md's frozen availability
rule and the master contract's level QA gate (§16-17), which this task alone
cannot satisfy end-to-end (see §3 below).

## 1. What this task built

All inside this task's write scope (`linguachat-frontend/src/learning/levels/a2/**`,
`linguachat-frontend/scripts/foundry/a2/**`, `docs/curriculum/implementation/a2/**`):

- **23 episodes across 7 arcs**, matching `docs/curriculum/blueprints/a2.json`
  exactly (ids, canDo coverage, pattern coverage, vocabulary budgets, evidence
  targets, personalization plan, autonomy fade, reuse/integration turns, mini-story
  placements). One file per arc under `levels/a2/episodes/`, aggregated by
  `levels/a2/index.js` (`A2_EPISODES`, `A2_ARCS`, `getA2Episode(id)` — the same
  contract `episodes/a1Arc1Content.js` documents for A1).
- **A full reference evaluator implementation for all 17 new A2 intents**
  (`levels/a2/evaluators.js`), built against the exact same result contract
  `engine/responseEvaluation.js`'s `base()` already returns, including a
  reusable `twoClauseJudgment` helper that implements
  `a2.json#coreEngineRequirements`'s proposed two-clause shared behaviour as
  real, tested code.
- **A2's proposed semantic types** (`levels/a2/semanticTypes.js`): `past_time`,
  `future_time`, `month`, `date_ordinal`, `quality`, `problem`, and the
  reused-from-A1-proposal `day`, each with a `validate()` function and the
  documented `incompatibleWith` rules.
- **A complete draft English i18n key set** (`levels/a2/i18n/en.js`) — every
  key the 23 episodes reference, with a finished English sentence, not a
  placeholder.
- **Three level-owned QA scripts** (`scripts/foundry/a2/`):
  `check-a2-structure.mjs` (blueprint conformance: counts, ids, prerequisite
  cycles, orphan required capabilities, evalKind coverage, i18n key
  completeness), `check-a2-evaluators.mjs` (a clearly-correct / natural-variant
  / near-miss / wrong-meaning / nonsense / insufficient-form /
  missing-second-clause battery per new intent, per a2.md §11),
  `check-a2-journeys.mjs` (>=20 simulated varied learner journeys per arc
  against the level's own content+evaluators, per a2.md §16 / `LC-PED-001`'s
  standard).
- `docs/curriculum/implementation/a2/authoring-conventions.md` and
  `core-requirements.md` — the shared spec seven arcs were authored against in
  parallel, and the precise, content-informed ask for the task that wires this
  in.

## 2. Measured evidence

See the PR's `## Evidence` section for exact command output. Summary:

- `node scripts/foundry/a2/check-a2-structure.mjs` — PASS (7 arcs, 23 episodes, 27 distinct evalKinds, 428 distinct i18n keys, all present as drafts, no prerequisite cycles, no orphan required capability)
- `node scripts/foundry/a2/check-a2-evaluators.mjs` — PASS (66/66 cases: correct/near-miss/nonsense/insufficient-form/missing-second-clause per new intent, plus the two-clause connector-position regression)
- `node scripts/foundry/a2/check-a2-journeys.mjs` — PASS (455 simulated journeys across all 7 arcs, each well above the 20/arc minimum)
- `cd linguachat-frontend && npm run check:all` — PASS, exit 0 (unchanged baseline: this task's files are additive and unimported by any runtime path)
- `cd linguachat-frontend && npm run build` — PASS, exit 0 (no A2 chunk in `dist/`, confirming zero bundle impact — nothing imports `levels/a2/**` yet)
- `cd linguachat-frontend && npm run check:i18n` — PASS, exit 0, 1727 base keys unchanged (A2's draft keys live in a level-owned file, not yet merged into `src/i18n/**`)
- `cd linguachat-backend && python -m compileall . && python -m pytest -q` — PASS, exit 0, 444 passed (unchanged; no backend files touched)
- `node .github/scripts/check-foundry-scope.mjs --branch foundry/level-a2/lc-cont-a2 --base origin/main --head HEAD` — PASS, 17 changed files, all inside the declared write scope
- `node .github/scripts/check-supervisor-evidence.mjs` — PASS (pedagogical 120/100 unique primary studies/14 topics, psychology 127/100/14 topics; required by `requiresEvidenceReady: true`)
- **Two consecutive fully clean cycles** run after the last fix (a naming collision between A2's seventh arc export and `check-a1-blueprint.mjs`'s unscoped `/arc7\b/i` guard against A1's frozen arc 7 — fixed by renaming the export, not by touching the out-of-scope shared script), with zero edits between the two cycles.

## 3. What this task could NOT prove, and why

A2's content is not wired into the runtime — episode registration
(`episodes/index.js`), i18n merge (`src/i18n/**`), evaluator dispatch
(`engine/responseEvaluation.js`'s switch), the semantic-type registry
(`engine/semanticContext.js`), fact capture (`engine/learnerModel.js`), and the
mini-story table (`engine/miniStory.js`) are all outside this task's write
scope, and per `.ai/foundry/tasks.json`, belong to `LC-INT-001` ("Integrate
A1-C2, run longitudinal learner journeys, and repair integration defects"),
which depends on every `LC-CONT-*` task and has the wider write scope needed.
This is not a scope violation avoided reluctantly — it is the intended shape
of the master contract's own parallel-authoring rule (§18): step 5 authors
level-owned content in parallel across levels; step 7 integrates one level at
a time through the global gate. See `core-requirements.md` for the exact,
content-informed list of what integration still needs.

Concretely, this task could NOT run or produce:

- a live in-app browser walkthrough of any A2 episode (390px/1440px, light/dark);
- a real learner-journey replay through `SessionRunner`/the shared session engine;
- `npm run check:i18n`'s real locale-parity proof for A2's own keys (they are
  draft values in a level-owned file, not yet merged into `src/i18n/**`);
- replay/idempotency proof through the real XP/Garden reward pipeline;
- cross-level `check-cross-level-ids.mjs` proof against the live registry (this
  task's own `check-a2-structure.mjs` proves an equivalent check against
  `a2.json` directly, but the shared runtime registry is the authoritative guard
  and only sees ids once a module actually imports `levels/a2/**`).

What was proved instead, honestly and at the level this task's scope allows:
structural conformance to the blueprint, evaluator correctness (discrimination
between correct/near-miss/nonsense/insufficient-form, including the two-clause
refusal battery `a2.json#coreEngineRequirements` asks for), and simulated
varied learner journeys against the real content paired with the real
reference evaluators. `LC-INT-001` is where end-to-end, in-app proof becomes
possible.

## 4. Pedagogical self-check against the master contract

- **No false mastery**: every required capability's evidence in the episode
  content follows the shared categories (comprehension, guided, independent,
  transfer, delayed retrieval) unchanged from A1/the master (§9); no capability
  invents its own mastery definition.
- **Personalization invariant**: every themed/light arc's episodes write the
  NEUTRAL fallback literally (per `a2.md`§7 and `semanticTypes.js`'s
  `A2_ARC_PERSONALIZATION`), with the compatible slot type noted inline — no
  episode hardcodes a specific interest, and no personalization changes
  `canDoId`, evidence, or difficulty.
- **No superlatives, no present perfect, no passive, no reported speech, no
  register/negotiation, no real personal data** — every explicit A2 exclusion
  (`a2.json#deferredToB1`) is honored in content; `evaluators.js`'s
  `evaluateCompareThings` explicitly refuses a superlative rather than merely
  omitting one, and `evaluateSpellWord` returns no fact-worthy field, ever.
- **Delayed retrieval and transfer**: named explicitly in arc 1 (episode 42
  narrates a sequence built from arc 1's own past-tense work), arc 3 (episode
  48's integration story), and arc 7 (episode 61 retrieves
  `talk_about_what_you_did` from episode 39 — 22 episodes earlier — and
  `express_an_opinion_with_a_reason` from episode 47, per a2.md §16's explicit
  instruction).
