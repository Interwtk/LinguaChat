# HANDOFF — read this, then start

Current after the A1–C2 Curriculum Foundry, `LC-DOC-002`, `LC-PED-002`, `LC-OPS-021` (PR #100), `LC-I18N-006` (PR #108), merged cloud/Auth coordination `LC-OPS-027` (PR #128), merged real Auth `LC-AUTH-001` (PR #130), merged Auth email templates (PR #131), and merged B1 Arc 1 evidence hardening (PR #133). A1 arcs 6–7 and the integrated A2–C2 surface remain honestly localized in all seven implemented auxiliary locales. A1–C2 remain closed.

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

`LC-OPS-021` (PR #100) repaired the systemic continuity failures that had allowed work to sit idle. The final source head passed two consecutive complete clean QA cycles and PR #100 merged. Do not reintroduce an hourly-only recovery path, IN_PROGRESS-only checkpoint lookup, destructive claim release, or recursive-token second-cycle trigger.

`LC-I18N-006` (PR #108) closed issue #81: semantic scan plus Chromium proof confirmed genuine auxiliary localization across A1 arcs 6–7 and integrated A2/B1/B2/C1/C2 in es/pt/fr/it/de/ja/ar. A1–C2 stayed `available:false`; Pre-A1 was untouched.

## Product contract — do not reinterpret

- Lingua is the tutor; Chatto is mascot-only.
- Pre-A1 is frozen.
- A1 stays fail-closed. `LC-PED-002` is DONE, but that is not itself the availability decision.
- One `user_language` governs UI, explanations, hints, corrections, interpretations and meanings; target language is English.
- Arabic auxiliary UI is RTL; target-English content/input stays LTR; Chatto is never mirrored.
- The owner has authorized only the **LinguaChat project's public browser Supabase/Auth client**, limited to `linguachat-frontend/src/auth/` and `linguachat-frontend/src/cloud/` and public `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` variables. `LC-OPS-027` and the first Auth implementation in PR #130 are already merged.
- That authorization still does **not** permit backend Supabase, service-role/private keys, direct Postgres, Storage, pgvector, Edge Functions, EvoLabs project reuse, production deployment, billing or paid providers.
- No voice/calls/video/WebRTC/STT/TTS/pronunciation scoring.
- No real OpenAI or paid-provider runtime calls; local provider contract remains authoritative.
- Preserve the frozen Hoy · Chats · Palabras · Tú visual architecture.

## Start here — current task

`LC-CLOUD-001` is the single IN_PROGRESS queue task. Resume the existing Draft PR #123 on branch `feat/linguachat-cloud-preferences`; do **not** create another sync/preferences branch.

Its current safe scope is to reconcile that old Draft with the merged Auth baseline and implement/prove offline-safe learner preference synchronization using the authorized public browser client only. Required proof before merge: session-user binding, A↔B isolation/RLS + anonymous deny, safe first-login import without erasing local progress, offline→online merge without duplication/data loss, idempotent repeat sync, account-switch/logout isolation, and exact-head QA.

PR #128 is merged; it is no longer the current task. PR #130 is merged; do not rebuild Auth from scratch. PR #131 is merged but email templates remain repository files only, not SMTP delivery proof. PR #133 is merged; B1 still remains unavailable.

## A1 availability — explicitly blocked

Issue #101 (`LC-PROD-002`) exists for the separate A1 availability decision. Do **not** interpret i18n or pedagogical completion as permission to flip A1 to available. Until a new explicit owner instruction approves A1 release, leave `available:false` unchanged.

## Current coordination warning

`.ai/TASKS.md`, `.ai/STATE.md` and `.ai/HANDOFF.md` must tell the same story atomically. The stale PR #128 / blocked-Auth wording is obsolete; the live queue now points to `LC-CLOUD-001` on existing PR #123. Resume existing work instead of duplicating it.

## QA discipline

Never merge a Draft or red PR. Never relax thresholds/guards to make a change pass. Functional changes need actual affected-flow proof. Any fix after validation resets the two-cycle count. Require two consecutive complete clean cycles on the exact final head before merge.
