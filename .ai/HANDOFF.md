# HANDOFF — read this, then start

Current after the A1–C2 Curriculum Foundry, `LC-DOC-002`, the final pedagogical gate `LC-PED-002`, continuous-recovery hardening `LC-OPS-021` (PR #100), and `LC-I18N-006` (PR #108). The queue is now intentionally empty. A1 arcs 6–7 and the integrated A2–C2 surface are honestly localized in all seven implemented auxiliary locales; A1 remains closed pending a separate, still-unfiled, explicit owner-approved availability decision (`LC-PROD-002` / issue #101).

## What just happened

The full Curriculum Foundry chain finished and merged:
- evidence foundation/supervision and cross-level audit;
- shared curriculum isolation;
- all six content lanes `LC-CONT-A1` through `LC-CONT-C2`;
- shared runtime integration `LC-INT-001`;
- final supervisor acceptance `LC-SUP-002` (`PASS_WITH_CONDITIONS`);
- release-candidate hardening `LC-RC-001`.

A1 arcs 1–7 are implemented and integrated. A2, B1, B2, C1 and C2 are also integrated into the shared runtime. None of those levels is open to learners: A1–C2 remain `available:false`. Pre-A1 remains frozen.

`LC-DOC-002` (PR #90) aligned `CLAUDE.md`, `.ai/TRANSLATIONS.md` and the A1 blueprint operator message with the integrated runtime.

`LC-PED-002` (PR #91) re-proved the whole Pre-A1 + A1 learning journey end to end: 298 distinct per-arc journeys across 13 arcs, a 38-episode longitudinal new-learner journey through A1 exit, 41/41 focused evaluator cases, 95/95 focused arc-6/7 journeys and real Chromium proof for A1 arcs 6–7 at 390px/1440px in es/ja/ar. A1 stays `available:false` — this proof does not itself authorize opening A1.

`LC-OPS-021` (PR #100) then repaired the systemic continuity failures that had allowed work to sit idle:
- QA Evidence reads the live PR instead of stale event-body metadata;
- the watchdog fallback is every 5 minutes instead of hourly;
- interactive review has separate concurrency and cannot freeze implementation;
- successful task/translation workers wake the chain immediately;
- releasing a claim preserves a real remote checkpoint branch and only clears a provably missing ref;
- worker completion can recover a checkpoint after the task has already returned to TODO, and requires branch + open Draft PR before immediate redispatch;
- success without a durable checkpoint cannot create a hot retry loop;
- the second exact-head QA cycle is explicitly dispatched on the same branch/SHA instead of relying on a `GITHUB_TOKEN` Draft→Ready event that GitHub may suppress recursively.

The final LC-OPS-021 source head passed two consecutive complete clean QA cycles and PR #100 merged. Do not reintroduce an hourly-only recovery path, IN_PROGRESS-only checkpoint lookup, destructive claim release, or recursive-token second-cycle trigger.

`LC-I18N-006` (PR #108) then closed issue #81: the A1-C2 Curriculum Foundry integration phase had left many auxiliary-locale values byte-identical to the English base — structurally 100% coverage, never actually translated. A semantic scan (not just `check:i18n` key parity) confirmed genuine translation across A1 arcs 6-7 and integrated A2/B1/B2/C1/C2 in es/pt/fr/it/de/ja/ar, and real Chromium browser proof at 390px/1440px in es/ja/ar (via a temporary, uncommitted QA harness using the sanctioned `forLearner:false` tooling opt-out documented in `learning/curriculum/episodeContent.js`, fully removed before merge) confirmed correct rendering, RTL and no raw-key/overflow/console regressions. Full details and numbers are in `.ai/TRANSLATIONS.md`'s `LC-I18N-006` entry. A1/A2-C2 stayed `available:false` throughout; Pre-A1 untouched.

## Product contract — do not reinterpret

- Lingua is the tutor; Chatto is mascot-only.
- Pre-A1 is frozen.
- A1 stays fail-closed. `LC-PED-002` is DONE, but that is not itself the availability decision.
- One `user_language` governs UI, explanations, hints, corrections, interpretations and meanings; target language is English.
- Arabic auxiliary UI is RTL; target-English content/input stays LTR; Chatto is never mirrored.
- No Supabase.
- No voice/calls/video/WebRTC/STT/TTS/pronunciation scoring.
- No real OpenAI or paid-provider runtime calls; local provider contract remains authoritative.
- Preserve the frozen Hoy · Chats · Palabras · Tú visual architecture.

## Start here — next claimable task

The queue is empty: there is no TODO or IN_PROGRESS task right now. The only filed item is `LC-PROD-002` (below), and it is BLOCKED, not claimable. Do not invent new scope; wait for a new task to be filed or an explicit owner instruction.

## A1 availability — explicitly blocked

Issue #101 (`LC-PROD-002`) exists for the separate A1 availability decision. It is BLOCKED on explicit owner approval only now that `LC-I18N-006` is DONE. Do **not** interpret `LC-I18N-006` or `LC-PED-002` completion as permission to flip A1 to available. Until a new explicit owner instruction approves A1 release, leave `available:false` unchanged.

## Current coordination warning

`.ai/TASKS.md`, `.ai/STATE.md` and `.ai/HANDOFF.md` must tell the same story atomically. Coordination-only queue maintenance belongs under `ops/coord-*` and may change only these three files. Do not merge a coordination PR that updates only one and leaves the others stale.

## QA discipline

Never merge a Draft or red PR. Never relax thresholds/guards to make a change pass. Functional changes need actual affected-flow proof. Any fix after validation resets the two-cycle count. Require two consecutive complete clean cycles on the exact final head before merge.
