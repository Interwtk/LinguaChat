# STATE — where LinguaChat actually is

Updated after completion of the A1–C2 Curriculum Foundry, final supervisor acceptance, release-candidate hardening, `LC-DOC-002`, `LC-PED-002`, the continuous-recovery hardening `LC-OPS-021` (PR #100), `LC-I18N-006` (PR #108), and the owner-authorized coordination task `LC-OPS-027` now in progress on PR #128. A1 arcs 6–7's and the integrated A2–C2 surface's auxiliary-language instructional copy is genuinely localized in es/pt/fr/it/de/ja/ar. A1–C2 remain closed.

## Product contract

- Lingua is the tutor. Chatto is the mascot only; Chatto is not a tutor/chat agent.
- Pre-A1 is complete, available and **frozen**. Do not modify it unless a separately approved regression fix requires it.
- A1 remains **fail-closed** with `available: false`. `LC-PED-002` is DONE, but that alone does not open A1 — `LC-PROD-002` / issue #101 is a separate availability decision and remains blocked on explicit owner approval.
- A1 arcs 1–7 are implemented and integrated. A2, B1, B2, C1 and C2 are also integrated into the shared runtime, but all A1–C2 levels remain `available:false`.
- `user_language` is one auxiliary language for UI/chrome, explanations, hints, corrections, interpretations and meanings. `target_language` is English.
- Implemented auxiliary locales are `en`, `es`, `pt`, `fr`, `it`, `de`, `ja`, `ar`; unsupported languages must not masquerade as supported via English fallback.
- Arabic auxiliary UI is RTL; target-English content/input remains LTR; Chatto is never mirrored.
- Frozen visual architecture remains Hoy · Chats · Palabras · Tú and the established responsive layout/components.

## Hard technical boundaries

- The owner has authorized only the **LinguaChat project's public browser Supabase/Auth client** as future implementation scope, limited to `linguachat-frontend/src/auth/` and `linguachat-frontend/src/cloud/` and public `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` variables. This does **not** authorize backend Supabase, service-role/private keys, direct Postgres, Storage, pgvector, Edge Functions, EvoLabs project reuse, production deployment, billing or paid providers. `LC-OPS-027` must reconcile the guards before implementation is claimable.
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
- `LC-DOC-002` complete (PR #90): `CLAUDE.md`, `.ai/TRANSLATIONS.md` and `check-a1-blueprint.mjs`'s printed conclusion match the integrated A1–C2 state.
- `LC-PED-002` complete (PR #91): the final all-arcs pedagogical acceptance gate re-proved every Pre-A1 + A1 arc on the final integrated/hardened head — 298 per-arc journeys across 13 arcs, a 38-episode longitudinal new-learner journey through A1 exit, 41/41 arc-6/7 evaluator cases, 95/95 focused arc-6/7 journeys and real es/ja/ar browser proof at 390px/1440px.
- `LC-OPS-021` complete (PR #100): live-Evidence reads replace stale event snapshots; successful checkpointed workers can resume from durable task→branch/Draft-PR state; claim release no longer destroys a real checkpoint mapping; no-checkpoint success cannot hot-loop; review work no longer freezes the implementation writer; watchdog fallback is every 5 minutes; and the second exact-head QA cycle is explicitly dispatched rather than relying on a recursively suppressed `GITHUB_TOKEN` Draft→Ready event. The final source head passed two complete clean cycles before merge.
- `LC-I18N-006` complete (PR #108): the A1-C2 Curriculum Foundry integration phase had left many `es/pt/fr/it/de/ja/ar` auxiliary-instructional values byte-identical to the English base. This task replaced those values with genuine localized copy across A1 arcs 6-7 and integrated A2/B1/B2/C1/C2, verified by semantic scan and real Chromium browser proof at 390px/1440px in es/ja/ar.

The integrated runtime currently contains 171 curriculum episodes across Pre-A1 and A1–C2. Pre-A1 remains frozen and A1–C2 remain unavailable.

## Current claimable work

`LC-OPS-027` is the single IN_PROGRESS task on PR #128. It is coordination + guards only: reconcile the owner's narrow LinguaChat public Supabase/Auth permission across the live contracts and replace obsolete blanket-cloud guards without weakening Pre-A1, level availability, provider, secrets or no-voice/media gates. No Supabase implementation or connection belongs in this task.

`LC-CLOUD-001` remains BLOCKED until `LC-OPS-027` is complete and a separate narrow implementation task is claimed. Auth PR #126 is not authorization to run Claude or to implement against Supabase in this coordination task.

## A1 availability remains separately blocked

`LC-PROD-002` / issue #101 records the explicit A1 availability decision gate. It is in BLOCKED, not TODO. `LC-PED-002` and `LC-I18N-006` completing are **not** approval to open A1 — that requires a new, explicit owner instruction. Without it, A1 remains `available:false` and the automation must not infer permission.

## QA discipline

For any changed final head: require functional proof for affected flows plus `check:all`, production build, `check:i18n`, backend `compileall`, `pytest` and guards. Any fix after validation resets the clean-cycle count. Require two consecutive complete clean cycles on the exact final head before merge. Never merge red or Draft PRs and never weaken QA to make a change pass.
