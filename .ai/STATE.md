# STATE — where LinguaChat actually is

Updated at `LC-DOC-001` closeout (PR #34).

## Product contract

- Lingua is the tutor. Chatto is the mascot only; Chatto is not a tutor/chat agent.
- Pre-A1 is complete, available and **frozen**. Do not modify it unless a separately approved regression fix requires it.
- A1 remains **fail-closed** with `available: false` until the final all-arcs gate (`LC-PED-002`) is DONE and a separate availability decision is explicitly approved.
- A1 runtime currently has arcs 1–5. Arc 6 `what_you_can_do` (episodes 34–35) and arc 7 `making_arrangements` (36–38) are designed but not yet implemented in runtime.
- `user_language` is one auxiliary language for UI/chrome, explanations, hints, corrections, interpretations and meanings. `target_language` is English.
- Implemented auxiliary locales are `en`, `es`, `pt`, `fr`, `it`, `de`, `ja`, `ar`; unsupported languages must not masquerade as supported via English fallback.
- Arabic auxiliary UI is RTL; target-English content/input remains LTR; Chatto is never mirrored.
- Frozen visual architecture remains Hoy · Chats · Palabras · Tú and the established responsive layout/components.

## Hard technical boundaries

- No Supabase/Auth/Postgres/Storage/pgvector/Edge Functions under the current owner contract. Historical Supabase planning documents are non-operative reference material only.
- No voice, calls, video calls, WebRTC, STT, TTS or pronunciation scoring.
- No real OpenAI or other paid-provider runtime calls. `LINGUACHAT_PROVIDER=local` remains the execution contract.
- No A2+ runtime curriculum may be inferred from planning/foundry documents.

## Current repository baseline

- `LC-PED-001` is DONE: 253 distinct learner journeys across 11 completed runtime arcs plus rendered es/ja/ar evidence.
- `LC-I18N-002` is DONE: support catalog is honest; only implemented bases are selectable.
- `LC-QA-001` is DONE: reachable-source i18n AST linting now gates raw keys, duplicate keys and hardcoded auxiliary copy.
- `LC-SEC-001` is DONE: frontend dependency audit is clean without forced upgrades.
- `LC-BE-001` is DONE: Pydantic V1 validator warning removed with behavior parity.
- `LC-DOC-001` is DONE (PR #34): README rewritten to describe the real product; proven-unused legacy debris (`linguachat-frontend-old/`, `pacientes.txt`, `procedimientos.txt`) removed; no runtime code changed. Full evidence in `.ai/TASKS.md`'s DONE entry.

## A second curriculum pipeline now exists — read before touching A1 arcs 6–7

Between this task's first draft and its close, a separate **Curriculum Foundry**
pipeline was merged to `main`: `.ai/foundry/README.md`, `.ai/foundry/tasks.json`,
`docs/curriculum/curriculum-master-a1-c2.md`, `docs/curriculum/level-blueprint-template.md`,
`docs/research/supervisor-evidence-contract.md` and `docs/research/supervisor-evidence-ledger.md`.
`LC-FND-001` (its foundation task) is already complete
(`.ai/foundry/completed/LC-FND-001.json`).

The Foundry is a **second, scope-isolated pipeline for curriculum/research work only**,
explicitly not a replacement for the serial `.ai/TASKS.md` queue — read its own
invariants in `.ai/foundry/README.md` before assuming either system. Two invariants
matter most here:

- Foundry workers never edit `.ai/TASKS.md`, `.ai/STATE.md` or `.ai/HANDOFF.md`.
- Its task graph (`.ai/foundry/tasks.json`) already contains `LC-CONT-A1`
  ("Implement and prove A1 curriculum"), which will cover the remaining A1
  arcs (6–7) once its dependency chain clears
  (`LC-FND-002` → isolate shared curriculum infrastructure, gated behind
  `LC-AUD-001`, itself gated behind the six level blueprints and the
  100+100-primary-study supervisor evidence-ready gate, `LC-SUP-001`). That
  chain is far from satisfied today.

**Do not seed a new serial `LC-CURR-006`/`LC-CURR-007` task in `.ai/TASKS.md`
for A1 arcs 6–7.** Implementing arc 6/7 as a one-off serial task would either
duplicate `LC-CONT-A1`'s eventual work or write inside its declared write
scope (`linguachat-frontend/src/learning/levels/a1/**` after `LC-FND-002`
lands) before that scope exists, which the Foundry's own scope gate
(`check-foundry-scope.mjs`) is designed to prevent. If arc 6/7 needs to move
faster than the Foundry chain allows, that is a product decision for the
owner, not something to route around silently in either queue.

## Queue after LC-DOC-001

The serial `.ai/TASKS.md` queue is open (`_(none — the queue is open)_`) — see the
note above for why no new curriculum task was seeded. `LC-CLOUD-001` and
`LC-PED-002` remain BLOCKED, unchanged.

## Automation status

This task (`LC-DOC-001`) was itself completed by an autonomous `Claude — action`
dispatch that authenticated, read the queue and pushed real work without hitting
the turn-1 `is_error:true` failure recorded against run `32474896010` on
2026-08-21 (see PR #34's prior history and `bb8aa3a`/`84e796c`, "surface sanitized
Claude startup errors", and `3eac5a5`/`5dd108a`, "wake chain for one sanitized
LC-DOC-001 diagnostic", both merged to `main` ahead of this run). Treat the
autonomous lane as healthy again unless a future run demonstrates otherwise; do
not preemptively re-apply the old turn-1-failure caution without new evidence.

## Required QA discipline

For any changed final head: run `check:all`, production build, `check:i18n`, backend `compileall`, `pytest` and guards. Any fix after validation resets the count; require two consecutive clean full cycles on the exact final head before Ready/Merge. Functional changes additionally require rendered/runtime proof for their affected flow. This task (`LC-DOC-001`) changed only documentation and removed dead files — no runtime/UI flow was touched, so no browser walkthrough applies; build/check:all/compileall/pytest proof is what's required and was run.
