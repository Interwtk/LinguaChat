# B1 implementation — status

**Status: in progress.** This directory holds both level-owned design artifacts and (as arcs land)
the record of what actually exists under `linguachat-frontend/src/learning/levels/b1/**`.

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
- Arcs 5-7: not yet started (design-only content-plan specs to follow).
