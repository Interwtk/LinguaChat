# B1 implementation — status

**Status: blocked on shared-core runtime registration.** No B1 runtime episode content exists and
none is claimed here. This directory holds level-owned design artifacts only — content
specifications, not runtime modules — per `docs/curriculum/curriculum-master-a1-c2.md` section 14's
distinction between level-owned content and shared-core semantics.

- **The blocker, with file:line evidence:** [`.ai/foundry/requests/LC-CONT-B1.md`](../../../.ai/foundry/requests/LC-CONT-B1.md).
  Every one of B1's 14 new evaluator intents needs registration in shared engine/component/i18n
  files this task has no write access to (`linguachat-frontend/src/learning/engine/**`,
  `components/session/SessionRunner.jsx`, `curriculum/**`, `i18n/**`), and none of those surfaces
  degrades gracefully for an unregistered intent — an unregistered intent is permanently rejected,
  never escalated to the hybrid/AI evaluator, for every learner input. A new serialized CORE task
  is required before real runtime content can land.
- **The content plan, ready to transcribe once CORE unblocks:** one file per arc under this
  directory (`arc1-what-happened.md` through `arc7-the-long-conversation.md`), each a faithful
  expansion of `docs/curriculum/blueprints/b1.json`/`b1.md` into episode/step-level detail — target
  intents, step sequences, evaluator test-case tables (correct / natural variant / near miss /
  wrong meaning / nonsense / insufficient form / pragmatically inappropriate, per the blueprint's
  own section 11 examples), draft `PROMPT`/`MODEL_ANSWER` copy, and the i18n keys each episode will
  need. These are design documents; no runtime module imports them, and they do not make B1
  available or claim any evidence was produced.
- **What is NOT here:** runtime `.js` episode files, evaluator functions, i18n entries, or any
  claim of QA evidence. `docs/curriculum/blueprints/b1.md` section 16's QA acceptance list (20+
  learner-shaped journeys per arc, transfer/delayed-retrieval/replay proof, browser usability) can
  only be produced against running content, which does not yet exist.

## Once the CORE blocker is resolved

Resume `LC-CONT-B1` on this same branch. The per-arc content-plan files in this directory are the
starting point for authoring the actual `levels/b1/**` runtime modules; blueprint section 15's two
open core-engine questions (evaluation-density measurement, discourse-level evaluation context for
`keep_talking`) still need answering as part of that work — see the request file for detail.
