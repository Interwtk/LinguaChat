# STATE — where LinguaChat actually is

Updated after completion of the A1–C2 Curriculum Foundry, final supervisor acceptance and release-candidate hardening on 2026-08-23, with queue-order coordination corrected and `LC-DOC-002` contract sync completed on 2026-08-24.

## Product contract

- Lingua is the tutor. Chatto is the mascot only; Chatto is not a tutor/chat agent.
- Pre-A1 is complete, available and **frozen**. Do not modify it unless a separately approved regression fix requires it.
- A1 remains **fail-closed** with `available: false` until `LC-PED-002` is DONE and a separate availability decision is explicitly approved.
- A1 arcs 1–7 are implemented and integrated. A2, B1, B2, C1 and C2 are also integrated into the shared runtime, but all A1–C2 levels remain `available:false`.
- `user_language` is one auxiliary language for UI/chrome, explanations, hints, corrections, interpretations and meanings. `target_language` is English.
- Implemented auxiliary locales are `en`, `es`, `pt`, `fr`, `it`, `de`, `ja`, `ar`; unsupported languages must not masquerade as supported via English fallback.
- Arabic auxiliary UI is RTL; target-English content/input remains LTR; Chatto is never mirrored.
- Frozen visual architecture remains Hoy · Chats · Palabras · Tú and the established responsive layout/components.

## Hard technical boundaries

- No Supabase/Auth/Postgres/Storage/pgvector/Edge Functions under the current owner contract.
- No voice, calls, video calls, WebRTC, STT, TTS or pronunciation scoring.
- No real OpenAI or other paid-provider runtime calls. `LINGUACHAT_PROVIDER=local` remains the execution contract.
- Do not open any A1–C2 level merely because its curriculum exists in runtime.

## Current repository baseline

The Curriculum Foundry chain is complete:
- `LC-SUP-001`, `LC-AUD-001`, `LC-FND-002` complete.
- `LC-CONT-A1`, `LC-CONT-A2`, `LC-CONT-B1`, `LC-CONT-B2`, `LC-CONT-C1`, `LC-CONT-C2` complete and merged.
- `LC-INT-001` complete: A1–C2 integrated into the shared runtime.
- `LC-SUP-002` complete with `PASS_WITH_CONDITIONS`.
- `LC-RC-001` complete: release-candidate hardening finished with two clean full cycles and 468 backend tests.
- `LC-DOC-002` complete (PR #90): `CLAUDE.md`, `.ai/TRANSLATIONS.md` and `check-a1-blueprint.mjs`'s printed conclusion now match the integrated A1–C2 state — no more stale pre-Foundry wording for a worker to act on.

The integrated runtime currently contains 171 curriculum episodes across Pre-A1 and A1–C2. Pre-A1 remains frozen and A1–C2 remain unavailable.

## Next serial product gate

`LC-PED-002` is now the next and only claimable serial product task. It must re-prove the final integrated Pre-A1 + A1 learning journey before any A1 availability decision:
- at least 20 distinct learner journeys per arc;
- longitudinal new-learner journeys through A1 exit;
- delayed recall, transfer, support fading/recovery and independent can-do evidence;
- no false mastery or duplicate rewards;
- prerequisite reuse;
- rendered es/ja/ar usability at 390px and 1440px;
- `check:all`, production build, `check:i18n`, backend `compileall`, `pytest`, guards;
- two consecutive clean full cycles on the exact final head after the last fix.

A1 MUST remain `available:false` throughout this task.

## Separate i18n work

Issue #81 (`LC-I18N-006`) tracks real auxiliary-language localization of the integrated A2–C2 surface. It is independent of `LC-PED-002` and must not change curriculum logic, evaluator behavior, level availability, the frozen visual architecture or any hard product boundary.

## QA discipline

For any changed final head: require functional proof for affected flows plus `check:all`, production build, `check:i18n`, backend `compileall`, `pytest` and guards. Any fix after validation resets the clean-cycle count. Require two consecutive clean full cycles on the exact final head before Ready/Merge. Never merge red or Draft PRs and never weaken QA to make a change pass.
