# HANDOFF — read this, then start

Current as of 2026-08-24 after the A1–C2 Curriculum Foundry completed, the serial queue was corrected, `LC-DOC-002` synced the agent/operator contracts with that integrated baseline, and `LC-PED-002` completed the final all-arcs pedagogical acceptance gate.

## What just happened

The full Curriculum Foundry chain finished and merged:
- evidence foundation/supervision and cross-level audit;
- shared curriculum isolation;
- all six content lanes `LC-CONT-A1` through `LC-CONT-C2`;
- shared runtime integration `LC-INT-001`;
- final supervisor acceptance `LC-SUP-002` (`PASS_WITH_CONDITIONS`);
- release-candidate hardening `LC-RC-001`.

A1 arcs 6–7 are no longer design-only. A1 arcs 1–7 are implemented and integrated. A2, B1, B2, C1 and C2 are also integrated into the shared runtime. None of those levels is open to learners: A1–C2 remain `available:false`.

The final hardening pass preserved all product boundaries and finished with two clean frontend/backend cycles and 468 backend tests. Pre-A1 remains frozen.

`LC-DOC-002` (PR #90) then closed the documentation gap this created: `CLAUDE.md`'s Curriculum state section, `.ai/TRANSLATIONS.md`'s coverage table (stale 1726-key snapshot, now 5205) and `check-a1-blueprint.mjs`'s printed conclusion ("A1 is planned and absent from the product") all still described the pre-Foundry state. They now match reality — content exists for A1 through C2, all still `available:false`. Documentation/operator-message only; no curriculum, evaluator, availability, provider or visual behavior changed.

`LC-PED-002` (PR #91) then re-proved the whole Pre-A1 + A1 learning journey end to end on that final integrated/hardened head: 298 distinct per-arc journeys across all 13 Pre-A1+A1 arcs, a 38-episode longitudinal new-learner journey through A1 exit (delayed recall, transfer, cross-level prerequisite reuse, scaffold fading/recovery, assisted-vs-independent evidence, no false mastery, no duplicate replay reward), 41/41 focused evaluator cases and a real Chromium browser pass for A1 arcs 6–7 at 390px/1440px in es/ja/ar (correct RTL, target-English stays `lang=en`/LTR, Chatto never mirrored, no overflow/raw keys/console errors). It also fixed one stale test assertion (`check-cloud-automation.mjs` still expected `--max-turns 80` after an unrelated main commit, `LC-OPS-019`, intentionally raised the interactive-lane budget to 140) that was otherwise blocking every branch's `check:all` from a clean run. A1 stays `available:false` — this gate proves the curriculum works, it does not itself authorize opening A1.

## Product contract — do not reinterpret

- Lingua is the tutor; Chatto is mascot-only.
- Pre-A1 is frozen.
- A1 stays fail-closed. `LC-PED-002` is now DONE, but that is not itself the availability decision — a separate, explicit decision is still required and has not happened.
- One `user_language` governs UI, explanations, hints, corrections, interpretations and meanings; target language is English.
- Arabic auxiliary UI is RTL; target-English content/input stays LTR; Chatto is never mirrored.
- No Supabase.
- No voice/calls/video/WebRTC/STT/TTS/pronunciation scoring.
- No real OpenAI or paid-provider runtime calls; local provider contract remains authoritative.
- Preserve the frozen Hoy · Chats · Palabras · Tú visual architecture.

## What comes next

`LC-PED-002` is done. There is no A1-availability task in the queue yet — do not infer one is implicitly authorized. The next serial product step is a distinct, explicitly-scoped availability-decision task (not yet filed as of this writing) that would deliberately flip A1's `available:false`. Until that task exists and is separately approved, A1 stays closed exactly as it is today.

Do not create another A1 curriculum task and do not reopen the Foundry — the curriculum and its acceptance proof are both finished.

## Separate i18n lane

Issue #81 (`LC-I18N-006`) tracks translation of the integrated A2–C2 auxiliary-language instructional surface. Keep it separate from `LC-PED-002`: no translation expansion inside the pedagogical acceptance task.

## Current coordination warning

`.ai/TASKS.md`, `.ai/STATE.md` and `.ai/HANDOFF.md` must tell the same story atomically. Do not merge a coordination PR that changes only one of those three files and leaves the others stale.

## QA discipline

Never merge a Draft or red PR. Never relax thresholds/guards to make a change pass. Functional changes need actual affected-flow proof. Any fix after validation resets the two-cycle count. Require two consecutive complete clean cycles on the exact final head before Ready/Merge.
