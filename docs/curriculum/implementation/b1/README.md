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

(updated as arcs complete — see the per-arc files in this directory)
