# HANDOFF — read this, then start

Current as of 2026-08-24 after the A1–C2 Curriculum Foundry completed and the serial queue was corrected so documentation-contract sync happens before the final A1 pedagogical acceptance gate.

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

## Product contract — do not reinterpret

- Lingua is the tutor; Chatto is mascot-only.
- Pre-A1 is frozen.
- A1 stays fail-closed until `LC-PED-002` is DONE and a separate explicit availability decision is approved.
- One `user_language` governs UI, explanations, hints, corrections, interpretations and meanings; target language is English.
- Arabic auxiliary UI is RTL; target-English content/input stays LTR; Chatto is never mirrored.
- No Supabase.
- No voice/calls/video/WebRTC/STT/TTS/pronunciation scoring.
- No real OpenAI or paid-provider runtime calls; local provider contract remains authoritative.
- Preserve the frozen Hoy · Chats · Palabras · Tú visual architecture.

## What comes next

The next serial task is `LC-DOC-002`, not `LC-PED-002` yet.

Reason: `CLAUDE.md`, `.ai/TRANSLATIONS.md` and one operator-facing A1 blueprint conclusion still contain stale pre-Foundry wording. Because every worker reads those contracts before acting, leaving that drift in place can make the pedagogical gate operate under obsolete A1/Supabase assumptions.

`LC-DOC-002` must stay narrow:
- documentation/operator-message only;
- align `CLAUDE.md` with the integrated A1–C2 baseline and current no-Supabase contract;
- refresh the measured structural i18n baseline without claiming placeholder English is translated;
- update only the stale green operator conclusion in `check-a1-blueprint`;
- no curriculum logic, evaluator, availability, provider, Supabase, voice/media/pronunciation or frozen-visual changes;
- focused regression proof plus `check:all`, build, `check:i18n`, backend `compileall` + `pytest`, guards and two consecutive clean full cycles on the exact final head.

After `LC-DOC-002` is DONE, the next serial product task is the existing `LC-PED-002` final all-arcs learning acceptance gate. Its old blocker (“A1 arcs 6 and 7 implemented”) is satisfied.

Do not create another A1 curriculum task and do not reopen the Foundry. `LC-PED-002` is an acceptance/proof task over the integrated runtime, not a curriculum rewrite.

Required proof before `LC-PED-002` can be DONE:
- re-derive every Pre-A1 + A1 arc from the live integrated runtime;
- at least 20 distinct learner journeys per arc;
- longitudinal new-learner journeys through A1 exit;
- delayed recall and transfer;
- support fading and recovery;
- independent can-do evidence;
- no false mastery and no duplicate rewards;
- prerequisite reuse;
- rendered es/ja/ar proof at 390px and 1440px;
- `check:all`, build, `check:i18n`, backend `compileall` + `pytest`, guards;
- two consecutive complete clean cycles on the exact final head after the last fix.

A1 must remain `available:false` during both tasks. Completing `LC-PED-002` does not itself authorize opening A1.

## Separate i18n lane

Issue #81 (`LC-I18N-006`) tracks translation of the integrated A2–C2 auxiliary-language instructional surface. Keep it separate from `LC-DOC-002` and `LC-PED-002`: no curriculum/evaluator/availability changes in the i18n task, and no translation expansion inside the pedagogical acceptance task.

## Current coordination warning

`.ai/TASKS.md`, `.ai/STATE.md` and `.ai/HANDOFF.md` must tell the same story atomically. The queue order is now `LC-DOC-002` first, then `LC-PED-002`; do not merge a coordination PR that changes only one of those three files and leaves the others stale.

## QA discipline

Never merge a Draft or red PR. Never relax thresholds/guards to make a change pass. Functional changes need actual affected-flow proof. Any fix after validation resets the two-cycle count. Require two consecutive complete clean cycles on the exact final head before Ready/Merge.
