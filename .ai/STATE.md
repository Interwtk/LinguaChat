# STATE — where LinguaChat actually is

Updated after completion of the A1–C2 Curriculum Foundry, final supervisor acceptance and release-candidate hardening on 2026-08-23, with queue-order coordination corrected, `LC-DOC-002` contract sync and `LC-PED-002`'s final all-arcs pedagogical acceptance gate completed on 2026-08-24.

## Product contract

- Lingua is the tutor. Chatto is the mascot only; Chatto is not a tutor/chat agent.
- Pre-A1 is complete, available and **frozen**. Do not modify it unless a separately approved regression fix requires it.
- A1 remains **fail-closed** with `available: false`. `LC-PED-002` (the final pedagogical acceptance gate) is now DONE, but that alone does not open A1 — a separate, explicit availability decision is still required and has not been made.
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
- `LC-PED-002` complete (PR #91): the final all-arcs pedagogical acceptance gate re-proved every Pre-A1 + A1 arc on the final integrated/hardened head — 298 per-arc journeys across 13 arcs, a 38-episode longitudinal new-learner journey through A1 exit (delayed recall, transfer, prerequisite reuse, scaffold fading/recovery, assisted-vs-independent evidence, no false mastery, no duplicate replay reward), 41/41 arc-6/7 evaluator cases, and real es/ja/ar browser proof at 390px/1440px for arcs 6-7. Two consecutive clean non-draft QA cycles on the exact final head, per the merge gate.

The integrated runtime currently contains 171 curriculum episodes across Pre-A1 and A1–C2. Pre-A1 remains frozen and A1–C2 remain unavailable.

## Next serial product gate

`LC-PED-002` is done. The pedagogical acceptance gate does not itself authorize opening A1: a distinct, explicit A1 availability decision task is now the next serial product step, and until it lands A1 stays `available:false` exactly as it is today. No task currently in the queue makes that decision — it is not implicitly authorized by this gate's completion.

## Separate i18n work

Issue #81 (`LC-I18N-006`) tracks real auxiliary-language localization of the integrated A2–C2 surface. It is independent of `LC-PED-002` and must not change curriculum logic, evaluator behavior, level availability, the frozen visual architecture or any hard product boundary.

## QA discipline

For any changed final head: require functional proof for affected flows plus `check:all`, production build, `check:i18n`, backend `compileall`, `pytest` and guards. Any fix after validation resets the clean-cycle count. Require two consecutive clean full cycles on the exact final head before Ready/Merge. Never merge red or Draft PRs and never weaken QA to make a change pass.
