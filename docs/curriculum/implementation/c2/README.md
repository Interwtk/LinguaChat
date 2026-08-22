# C2 implementation — status

**Status: blocked on shared-core runtime registration.** No C2 runtime episode content exists and
none is claimed here. This directory holds level-owned design artifacts only — content
specifications, not runtime modules — per `docs/curriculum/curriculum-master-a1-c2.md` section 14's
distinction between level-owned content and shared-core semantics.

- **The blocker, with re-verified file:line evidence:**
  [`.ai/foundry/requests/LC-CONT-C2.md`](../../../.ai/foundry/requests/LC-CONT-C2.md). Every one
  of C2's 13 new evaluator intents needs registration in shared engine/component/i18n files this
  task has no write access to (`linguachat-frontend/src/learning/engine/**`,
  `components/session/SessionRunner.jsx`, `curriculum/**`, `i18n/**`) — the same wall
  `LC-CONT-B1` already confirmed for its own lane — plus four C2-specific gaps the blueprint itself
  flagged (multi-turn evaluation span, a recordable `delayedRetrieval` evidence type, four new
  semantic types, and real register/discourse-coherence scoring beyond the contract shape
  `LC-FND-002` already landed). A new serialized CORE task is required before real runtime content
  can land.
- **The content plan, ready to transcribe once CORE unblocks:**
  [`content-plan.json`](content-plan.json) — one entry per arc (all 8), each a faithful expansion
  of `docs/curriculum/blueprints/c2.json`/`c2.md` into episode/step-level detail: target
  capabilities and intents, a full step sequence with real source texts/prompts/scaffolds, an
  evaluator test-case table per new intent (correct / natural variant / near miss / wrong meaning /
  nonsense / pragmatically-inappropriate, per the blueprint's own section 11), vocabulary and
  pattern examples, and personalization examples (interest-flavored vs. neutral fallback,
  respecting each arc's declared personalization mode). These are design documents; no runtime
  module imports them, and they do not make C2 available or claim any evidence was produced.
- **The structural proof this task CAN run today:**
  [`../../../linguachat-frontend/scripts/foundry/c2/check-c2-content-plan.mjs`](../../../linguachat-frontend/scripts/foundry/c2/check-c2-content-plan.mjs)
  validates `content-plan.json` against the frozen `c2.json` blueprint — every required/should
  capability covered exactly once across the plan, every arc's declared intents have complete
  evaluator test-case tables, every declared pattern is exemplified, personalization-mode
  constraints are respected (an arc marked `"none"` never carries an interest-flavored example),
  and arc order/prerequisites match the blueprint. This is real, run, and green — see the script's
  own output and the PR's `## Evidence` section. It does **not** prove the content is playable,
  pedagogically effective, or evaluatable by any evaluator, because none of that exists at runtime
  yet.
- **What is NOT here:** runtime `.js` episode files, evaluator functions, i18n entries, or any
  claim of QA evidence beyond content-plan/blueprint structural consistency.
  `docs/curriculum/blueprints/c2.md` section 16's QA acceptance list (20+ learner-shaped journeys
  per arc, transfer/delayed-retrieval/replay proof, browser usability) can only be produced against
  running content, which does not yet exist.

## Once the CORE blocker is resolved

Resume `LC-CONT-C2` on this same branch. `content-plan.json` is the starting point for authoring
the actual `levels/c2/**` runtime modules; the C2-specific core-engine requirements in the request
file still need answering as part of that work (multi-turn evaluation span, delayed-retrieval
evidence recording, the four new semantic types, real register/discourse-coherence scoring) — not
assumed away.
