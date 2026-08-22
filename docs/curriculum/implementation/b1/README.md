# B1 implementation — status

**Status: level-owned content complete (all 7 arcs).** This directory holds both level-owned
design artifacts and the record of what actually exists under
`linguachat-frontend/src/learning/levels/b1/**`. "Complete" here means exactly what
`LC-CONT-B1`'s write scope can honestly claim — self-contained content, evaluators and QA, proven
in isolation. **Live in-app wiring and the full in-app browser walkthrough remain `LC-INT-001`'s
job**, not this task's; see the section below for why, and `b1Map.js`'s `b1ImplementationStatus()`
for why its own `complete` flag deliberately still reads `false`.

## The scope boundary this task confirmed, and how it resolves

`.ai/foundry/requests/LC-CONT-B1.md` documents, with file:line evidence, that every one of B1's 14
new evaluator intents needs registration in shared engine/component/curriculum/i18n files this task
has no write access to (`engine/**`, `components/session/SessionRunner.jsx`, `curriculum/**`,
`i18n/**`). That finding is accurate and still holds — it is **not**, on reflection, a missing or
unscheduled gap requiring a brand-new CORE task, though an earlier pass through this branch read it
that way. `.ai/foundry/tasks.json`'s own task graph already has the task built for this: `LC-INT-001`
("Integrate A1-C2, run longitudinal learner journeys, and repair integration defects") depends on
every `LC-CONT-*` content lane finishing first and has write access to exactly the shared surfaces
listed above (`linguachat-frontend/src/learning/**`, `src/i18n/**`, `src/components/**`, etc.). This
matches the master contract's own parallel-authoring sequence
(`curriculum-master-a1-c2.md` section 18): step 5 is "author level-owned runtime content in
parallel," step 7 is "integrate levels one at a time through the global gate" — two different,
sequential steps, not one. Sibling lane `LC-CONT-A2` (PR #74) reached the same reading independently.

So: `LC-CONT-B1` builds complete, self-contained, level-owned B1 content — episode definitions,
evaluator functions, model-answer/prompt copy, semantic-type usage, i18n key lists — entirely inside
`linguachat-frontend/src/learning/levels/b1/**` and proves it with its own self-contained
journey-simulation harness (calling this level's own modules directly, the same rigor
`scripts/lib/journey.mjs` + `check-a1-arc*.mjs` apply to A1, rather than the shared dispatcher, which
cannot see B1 yet). **Live in-app wiring (registering B1 into `evaluateFree`'s switch, `levels.js`,
`SessionRunner.jsx`'s tables, `semanticContext.js`, i18n) and the full in-app browser walkthrough are
`LC-INT-001`'s job, not this task's** — this content cannot honestly be walked end-to-end in the
running app before that integration lands, and this document does not claim otherwise.

- **Core-engine questions (b1.md section 15):** both resolved without a shared-core code change —
  see [`core-engine-findings.md`](core-engine-findings.md).
- **The scope-boundary finding:** [`.ai/foundry/requests/LC-CONT-B1.md`](../../../.ai/foundry/requests/LC-CONT-B1.md).

## What exists today

Tracked per arc as it lands. An arc listed here has real runtime modules under
`linguachat-frontend/src/learning/levels/b1/` plus a passing self-contained QA check under
`linguachat-frontend/scripts/foundry/b1/`; an arc not listed is design-only (or not yet started).

- **Arc 1 — `what_happened`** (`narrate_connected_event`, `narrate_interrupted_action`): **done.**
  3 episodes (`episodes/b1Arc1.js`), evaluator (`evaluators.js`), draft
  `MODEL_ANSWER`/`PROMPT` tables (`tables.js`), semantic slots (`semanticSlots.js`), self-contained
  vocabulary (`vocabulary.js`) and i18n draft copy (`i18nDraft.js`), capability map (`b1Map.js`).
  Proven by `scripts/foundry/b1/check-b1-arc1.mjs` (16 groups, 25 pedagogical journeys) using a
  self-contained journey harness (`scripts/foundry/b1/lib/journey.mjs`) that reuses the real,
  unedited `scaffolding.js`/`learnerModel.js`/`episodeRuns.js`. Delayed-retrieval proof is
  explicitly deferred (arc 7's capstone does not exist yet), not faked.
- **Arc 2 — `i_think_that`** (`give_an_opinion`, `agree_or_disagree`): **done.**
  3 episodes (`episodes/b1Arc2.js`), evaluator functions added to `evaluators.js`,
  `B1_MODEL_ANSWER`/`B1_PROMPT` entries added to `tables.js`, semantic slots added
  to `semanticSlots.js`, vocabulary in `vocabulary.js` (`B1_ARC2_VOCAB`, 10
  productive / 6 receptive, matches b1.json exactly), i18n draft copy in
  `i18nDraft.js` (`B1_ARC2_COPY`). No mini-story (b1.json arc 2 `miniStory.use:
  false`). Proven by `scripts/foundry/b1/check-b1-arc2.mjs` (16 groups, 25
  pedagogical journeys), reusing the same self-contained journey harness (its
  `answerFor` was generalized to accept a plain-string canonical answer for an
  intent with no subtype, alongside arc 1's existing subtype-keyed shape — a
  non-breaking extension inside this task's own write scope). Delayed-retrieval
  proof again explicitly deferred to arc 7.
- **Arc 3 — `which_one`** (`compare_options_with_reasons`, `describe_an_experience`,
  `recommend_or_warn` [should]): **done.** 4 episodes (`episodes/b1Arc3.js`), the
  mini-story (b1.json arc 3 `miniStory.use: true`) implemented as ordinary
  `scene`/`model` steps inside episode 2, exactly like arc 1's episode 3.
  `recommend_or_warn` is `scope: should` — implemented, taught and evaluated,
  but deliberately excluded from `B1_REQUIRED_CAN_DOS` (tracked separately in
  the new `B1_SHOULD_CAN_DOS`). Vocabulary in `B1_ARC3_VOCAB` (17 productive /
  12 receptive, matches b1.json exactly). Proven by
  `scripts/foundry/b1/check-b1-arc3.mjs` (16 groups, 35 pedagogical journeys).
  One evaluator bug caught and fixed during authoring: the multi-attribute
  description regex originally assumed literal commas survive the shared
  `normalize()` helper, but `normalize()` strips punctuation — the regex now
  matches on word-boundary structure instead. Delayed-retrieval proof again
  explicitly deferred to arc 7.
- **Arc 4 — `somethings_wrong`** (`escalate_and_resolve_a_problem`, `negotiate_a_solution`,
  `express_frustration_politely` [should]): **done.** 4 episodes (`episodes/b1Arc4.js`).
  `report_problem`'s `tone` subtype (`neutral`/`frustrated`) carries both
  `escalate_and_resolve_a_problem` and `express_frustration_politely`, per
  b1.json `intentStrategy.newSubtypesOnExistingIntents` — the same convention
  arc 1's `narrativeForm` established; `negotiate_solution` is its own intent,
  adapted from the draft evaluator that resolved b1.md §15.1
  (`core-engine-findings.md`). Registers B1's one new semantic type, `problem`
  (`semanticSlots.js`'s `B1_NEW_SEMANTIC_TYPES`, matching b1.json's own
  `semanticTypes.proposed` entry). The mini-story (b1.json arc 4
  `miniStory.use: true`) is episode 4's integrated capstone, again as ordinary
  `scene`/`model` steps. Vocabulary in `B1_ARC4_VOCAB` (15 productive / 11
  receptive, matches b1.json exactly). Proven by
  `scripts/foundry/b1/check-b1-arc4.mjs` (16 groups, 33 pedagogical journeys).
  Two evaluator-authoring bugs caught and fixed during authoring: (1) the
  frustrated-tone model answer/journey-harness/test variants originally
  paired a frustration marker with no actual problem detail, which the
  evaluator correctly rejected (`express_frustration_politely` is a tone
  *layer* on a real problem, not a stand-alone phrase) — fixed by adding
  problem detail to every frustrated-tone example; (2) the problem/expectation
  regexes only recognized the verb "ordered", so a paraphrase like "I booked a
  double room, but I got a single one" (used in the novel-context transfer
  check) was wrongly rejected — generalized to a small set of request verbs
  (ordered/booked/asked for/wanted/paid for).
- **Arc 5 — `looking_ahead`** (`talk_about_plans_and_intentions`,
  `talk_about_hopes_and_ambitions`, `talk_about_real_conditions` [should],
  `imagine_a_hypothetical` [optional]): **done.** 4 episodes
  (`episodes/b1Arc5.js`), one per can-do — this is the first arc with no
  separate reinforcement episode (`episodesInArc === newCanDos.length`).
  `state_future_intent`'s `intentForm` subtype carries
  `talk_about_plans_and_intentions` vs `talk_about_hopes_and_ambitions`; a
  second, evaluator-only `situationForm` field (`decision`/`plan`/
  `prediction`/`hope`) carries b1.json's stated architectural risk for this
  arc — judging *function*, not surface form, adapted from the draft
  evaluator that resolved b1.md §15.1. New `B1_OPTIONAL_CAN_DOS` bucket added
  alongside `B1_REQUIRED_CAN_DOS`/`B1_SHOULD_CAN_DOS`. No mini-story (b1.json
  arc 5 `miniStory.use: false`). Vocabulary in `B1_ARC5_VOCAB` (18 productive
  / 10 receptive, matches b1.json exactly). Proven by
  `scripts/foundry/b1/check-b1-arc5.mjs` (16 groups, 43 pedagogical
  journeys). Three evaluator bugs caught and fixed during authoring: (1) the
  first-conditional regex only matched *if-clause-then-will-clause* order,
  rejecting the equally valid "I won't go if it's too cold." — added the
  reverse order; (2) the real-condition-vs-hypothetical guard checked only
  the literal word "would", missing the far more natural "I'd" contraction;
  (3) the future-decision/plan verb allowlist was too narrow (rejected "I'm
  going to start a new course" — "start" wasn't listed) — broadened it.
- **Arc 6 — `keep_talking`** (`sustain_topic_change`, `ask_follow_up_questions`,
  `summarize_what_was_said` [should]): **done.** 3 episodes
  (`episodes/b1Arc6.js`), one per can-do (no reinforcement episode, same shape
  as arc 5). Each new can-do is its own distinct intent; `change_topic`
  additionally carries a `role` (`initiate`/`follow`) since sustaining a topic
  change means both raising one and following a partner's. b1.json arc 6's
  `risk` flags discourse-level evaluation as needing the immediately
  preceding partner turn — resolved read-only in `core-engine-findings.md`
  §15.2 (the runtime already threads a `turnContext`); all three evaluators
  here read `ctx.turnContext.linguaSaid` for real, including a check that a
  reply is not just repeating the partner's own turn back. No mini-story
  (b1.json arc 6 `miniStory.use: false`). Vocabulary in `B1_ARC6_VOCAB` (12
  productive / 6 receptive, matches b1.json exactly). Proven by
  `scripts/foundry/b1/check-b1-arc6.mjs` (16 groups, 35 pedagogical
  journeys). One evaluator bug caught and fixed during authoring: the
  "real content but no discourse marker" near-miss branch used a bare
  word-count threshold (>=4) as its only signal, which happened to match
  this file's own 4-word nonsense test string and produced a false
  *confident* reject — violating the zero-false-conclusive-reject invariant
  (§15.1). Raised the threshold to 5, since a plain word count is a weak
  content signal on its own and must stay clearly outside a coincidental
  nonsense-string collision.
- **Arc 7 — `the_long_conversation`** (no new can-dos; the level's closing capstone): **done.**
  2 episodes (`episodes/b1Arc7.js`), no new patterns/vocabulary/evaluators by design
  (`vocabularyBudget: 0/0`) — every evalKind it uses was already authored and proven in arcs 1-6.
  This is the arc every earlier arc's check explicitly deferred delayed-retrieval proof to; that
  proof now genuinely exists: `scripts/foundry/b1/check-b1-arc7.mjs` statically confirms every one
  of the 12 required B1 capabilities (`B1_REQUIRED_CAN_DOS`) is exercised by the correct
  evalKind/subtype somewhere in the two episodes, then *behaviorally* proves it by playing both
  episodes end to end with a strong, fully unaided learner (`playEpisode` throws on any rejected
  reply, so a clean run means every required capability's canonical answer still passes its
  unmodified arcs-1-6 evaluator when asked fresh, inside prompts nobody scripted per-arc). Also
  reinforces both should-haves the arc's own prose calls out (`recommend_or_warn`,
  `summarize_what_was_said`), includes a learner-initiated topic change and a genuinely unplanned
  problem raised mid-conversation (a branching partner turn, not a scripted aside), and stays
  unaided throughout (`autonomyTarget`, matching A1's `making_arrangements` precedent). 20
  pedagogical journeys, 12 QA groups. `b1.json`'s own prose ("all thirteen required B1
  capabilities") does not match its own `counts.canDosRequired: 12` or the actual required-scope
  list this task built arc by arc — documented as a minor blueprint-prose inconsistency in
  `b1Arc7.js`'s header, not treated as a blocker (the capstone is built and proven against the
  authoritative 12-item list).

## Running the QA suite

`node scripts/foundry/b1/run-all.mjs` (from `linguachat-frontend/`) runs all seven arc checks in
order. All seven pass cleanly as of this task's final head. Not wired into `package.json`'s
`check:all` (`package.json` is out of this task's write scope).
