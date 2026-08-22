# B2 core-engine wiring handoff — for `LC-INT-001`

Everything `LC-CONT-B2` built (`docs/curriculum/implementation/b2/README.md`)
is content and self-validated data, deliberately not wired into the running
app because doing so requires editing shared-core files outside this task's
write scope (`linguachat-frontend/src/learning/levels/b2/**`,
`linguachat-frontend/scripts/foundry/b2/**`,
`docs/curriculum/implementation/b2/**` only). This document is the exact,
itemized spec for the task that owns that wider scope —
`LC-INT-001` ("Integrate A1-C2, run longitudinal learner journeys, and
repair integration defects"), whose write scope already includes every file
named below.

Per the master contract (`curriculum-master-a1-c2.md` section 14): "when a
level worker discovers a shared-core need, it must raise the requirement
instead of quietly implementing a private workaround." This is that
raise, made as concrete as possible so the wiring is mechanical rather than
a second design pass.

## 1. Why B2 content cannot run today

The shared engine's per-intent dispatch, prompt tables and item registries
are still flat, single-level structures (`docs/curriculum/curriculum-isolation-plan.md`
section 2, `LC-FND-002`'s own architecture survey) — no A1/A2/B1 content
lane has landed real runtime content yet either, so B2 is the first content
lane to actually hit this wall. Nothing knows a B2 intent, canDo id, pattern
or level exists until each of the following is done:

## 2. Registry wiring (mechanical, one line per registry)

- **`linguachat-frontend/src/learning/curriculum/levelMaps.js`**: add a
  `b2Map.js` file exporting `B2_CAN_DO_INTENT` (already built —
  `levels/b2/b2Capabilities.js` exports the exact payload) and one entry
  `{ levelId: B2, canDoIntent: B2_CAN_DO_INTENT }` to `LEVEL_CAN_DO_INTENT_MAPS`,
  per that file's own header comment ("A NEW LEVEL'S OWN MAP FILE SHOULD...").
  **Caveat**: `levelMaps.js`'s `canDoForIntent()` assumes one intent maps to
  exactly one canDo (first-match-wins). B2 intentionally breaks that
  assumption for its capstone subtype reuse (`shift_register` intent serves
  `adjust_register_to_context`, `sustain_a_multi_topic_conversation` AND
  `handle_a_topic_shift_gracefully`; `propose_a_resolution` serves both
  `negotiate_a_resolution` and `negotiate_an_agreement_under_pushback`) — see
  `b2Capabilities.js`'s own comment on `B2_CAN_DO_INTENT`. `canDoForIntent()`
  needs a subtype-aware lookup (intent + subtype -> canDo) before B2's
  capstone can resolve correctly; a naive registration will silently resolve
  every capstone lookup to whichever canDo is listed first.
- **`linguachat-frontend/src/learning/engine/semanticContext.js`**: register
  the three proposed semantic types from `levels/b2/b2Patterns.js`'s
  `B2_SEMANTIC_TYPES` (`stance`, `problem_type`, `register`). Per
  `docs/curriculum/semantic-types.md` section 1 (already resolved by
  `LC-AUD-001`/`LC-FND-002`), `problem_type` is B1's existing `problem`
  family with an added category field — register ONE type with an optional
  category, not two `SEMANTIC_TYPES` entries.
- **`linguachat-frontend/src/learning/engine/session.js`**: B2's items are
  currently invisible to `ITEM_KIND`/`ERROR_KIND`/`CANDO_KIND` (same
  live gap `curriculum-isolation-plan.md` already flagged for A1's own
  items) — add B2's entries alongside whatever A1/A2/B1 fix lands first.

## 3. Evaluator dispatch (the real design/implementation work)

- **`linguachat-frontend/src/learning/engine/responseEvaluation.js`**: add
  one evaluator function per B2 intent (14 total, `levels/b2/b2Intents.js`
  is the exact spec — each intent's `examples` object is the worked
  correct/variant/near-miss/wrong-meaning/nonsense set an evaluator function
  must be able to discriminate) and wire them into the `evaluateFree` switch,
  following the existing Pre-A1/A1 pattern exactly (`curriculum-isolation-plan.md`
  section 2 flags this switch as "~40 hand-written evaluator functions and
  one dispatcher switch," and B2 is the intended second real consumer that
  finally justifies generalizing it, if that turns out to be the right call
  once B2's shape is visible).
- **`registerAppropriateness` scoring** (the dimension
  `core-engine-requirements.md` section 2 already scaffolded in `base()`,
  `checked: false` by default): implement real scoring for the three
  capabilities `levels/b2/b2EvaluationContracts.js`'s
  `B2_REGISTER_APPROPRIATENESS_OPT_IN` opts in
  (`adjust_register_to_context`, `soften_or_strengthen_a_statement`,
  `negotiate_an_agreement_under_pushback`), local-first against the declared
  register-pair pattern vocabulary (`register_marker_pattern`,
  `hedging_pattern`/`intensifying_pattern`, `diplomatic_hedge_pattern`),
  escalating to remote only when the local read is inconclusive — never a
  dimension that itself requires the provider (`core-engine-requirements.md`
  section 2).
- **`discourseCoherence` scoring** (`core-engine-requirements.md` section 3,
  also already scaffolded in `base()`): implement real scoring for the three
  capstone capabilities `b2EvaluationContracts.js`'s
  `B2_DISCOURSE_COHERENCE_OPT_IN` opts in, extending from A2's own two-clause
  precedent (per that document: "generalizes this from two clauses to N
  sentences within one turn"). `b2EvaluationContracts.js`'s
  `B2_DISCOURSE_COHERENCE_REFUSAL_FIXTURES` is the exact test shape required
  before shipping: a `contradictory` case, a `flat_list` case, an
  `off_topic_drift` case, and a coherent control that must NOT fail.
- **Honest structural-floor fallback** (`b2.md` section 15.3, arc 1/2's open
  argumentative/negotiation turns): `b2EvaluationContracts.js`'s
  `B2_STRUCTURAL_FLOOR_FALLBACK` declares the exact per-intent structural
  check (stance/connector/proposal-marker presence) to use when the provider
  is unreachable — implement the three-tier contract (provider-graded when
  reachable; structural floor when not; the degraded state surfaced honestly
  to the learner, never silently accepted or silently downgraded).
- **Meaning-preserved reformulation/summary checking** (`b2.md` section
  15.4, arc 4's mediation capabilities): `b2EvaluationContracts.js`'s
  `B2_MEANING_PRESERVATION_STRUCTURAL_FLOOR` declares the same three-tier
  contract for `summarize_for_third_party`, `reformulate_for_clarity`,
  `report_third_party_opinion` — provider-graded meaning-equivalence as the
  primary path, a non-verbatim + marker-presence structural floor otherwise.
  Every arc-4 `free_reply` step needing this carries `sourceRef: true` and
  sits immediately after a `scene` step with a `sourceTextEn` field — that's
  the source text to compare against.

## 4. UI-adjacent tables

- **`linguachat-frontend/src/components/session/SessionRunner.jsx`**: add
  B2's 14 intents to the `MODEL_ANSWER`/`PROMPT` tables — `curriculum-isolation-plan.md`
  already documents "a real regression when an intent is missing from it,"
  so treat every B2 intent as required here, not optional.
- **`linguachat-frontend/src/learning/engine/formatChoice.js`**: add B2's
  intents to `OBJECTIVE_FORMATS` — same already-documented regression risk
  (an unlisted objective silently defaulted to "every format allowed").

## 5. Registration into the level/episode system

- **`linguachat-frontend/src/learning/episodes/index.js`** (or whatever
  `LC-FND-002`/`LC-INT-001` decides is the per-level equivalent by then):
  register B2's six arc content modules
  (`levels/b2/arcs/b2Arc{1..6}*Content.js`, each already exporting
  `getEpisode(id)` per the existing convention) so the resolver can find
  them. Arc 6 registers its `variant: 'themed'`/`variant: 'neutral'` pair as
  the personalization-slot resolution point.
- **B2's product-availability gate**: B2 must stay `available: false`
  (`b2.md` section 1) even after wiring — a separate, deliberate B2 release
  gate is required, exactly like A1's own gate in `a1-map.md` section 14.
  Wiring the engine is not that gate.

## 6. i18n

`i18n/**` is out of every content lane's write scope. Run
`node scripts/foundry/b2/list-b2-i18n-keys.mjs` from `linguachat-frontend/`
for the exact, mechanically-generated list of every `*Key`/`glossKey` B2
content references — populate these across every supported locale before B2
content is reachable, matching the existing per-episode key-prefix
convention (`b2ep1`-`b2ep21`, disjoint from `ep1`-`ep38`'s Pre-A1/A1 range,
and from `b2Vocab_*` for vocabulary glosses).

## 7. `mini_story` (optional enhancement, not a blocker)

`b2.json` marks `miniStory.use: true` for arcs 2, 3, 4, 6. No B2 arc actually
uses `type: 'mini_story'` steps — it requires a `storyObjective` registered
in `engine/miniStory.js`'s `STORIES` table (shared-core, out of scope), and
every arc's content works today with plain `scene` steps instead. If
`LC-INT-001` wants the richer presentation, add `STORIES` entries and swap
the relevant `scene` steps for `mini_story` steps as a follow-up — content
does not depend on it.

## 8. Two design questions worth resolving before wiring, not during it

1. **`shift_register` intent reuse for topic-shift judgment** — see
   `README.md` section 4. Confirm this is intentional before building
   evaluator logic against it; if it is a blueprint copy-paste artifact, fix
   `b2.json`/`b2.md` first (a design-doc edit, cheap) rather than building
   real scoring logic around a misleading name.
2. **`canDoForIntent()`'s one-intent-per-canDo assumption** — see section 2
   above. Decide whether to generalize the lookup to accept a subtype
   qualifier, or mint distinct intent ids for the capstone's reused
   functions instead (a `b2.json` edit). Either is workable; picking one
   before wiring `levelMaps.js` avoids building against an assumption that
   has to be undone.
