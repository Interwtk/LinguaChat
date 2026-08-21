# STATE — where LinguaChat actually is

Updated during LC-DOC-001 final reconciliation.

## Product contract

- Lingua is the tutor. Chatto is the mascot only; Chatto is not a tutor/chat agent.
- Pre-A1 is complete, available and **frozen**. Do not modify it unless a separately approved regression fix requires it.
- A1 remains **fail-closed** with `available: false` until the final all-arcs gate (`LC-PED-002`) is DONE and a separate availability decision is explicitly approved.
- A1 runtime currently has arcs 1–5. Arc 6 `what_you_can_do` (episodes 34–35) and arc 7 `making_arrangements` (36–38) are designed but not yet implemented.
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
- `LC-DOC-001` is the current PR #34 closeout: README corrected and proven-unused legacy debris removed; no runtime code changed.

## Queue after LC-DOC-001

The next serial product task is `LC-CURR-006`: implement only A1 arc 6 `what_you_can_do`, episodes 34–35, from the live blueprint. Arc 7 remains a later separate task. `LC-PED-002` stays blocked until arcs 6 and 7 exist.

`LC-CLOUD-001` is non-claimable while the current no-Supabase contract remains in force.

## Automation status / current blocker

The queue/chain itself is structurally healthy, but autonomous Claude run `32474896010` failed on 2026-08-21 at the first model turn: `anthropics/claude-code-action@v1` initialized Claude Sonnet 5, then returned `subtype: success` with `is_error:true`, `num_turns:1`, zero permission denials and no repository write. Do **not** blindly loop this failure. The task remained unclaimed and PR #34 work was preserved.

This failure is in the external Claude Code/OAuth execution lane, not in LinguaChat runtime or QA. Until that lane is diagnosed, repository-safe documentation/coordination fixes may be applied directly with normal GitHub writes, but no second functional implementation should be started in parallel.

## Required QA discipline

For any changed final head: run `check:all`, production build, `check:i18n`, backend `compileall`, `pytest` and guards. Any fix after validation resets the count; require two consecutive clean full cycles on the exact final head before Ready/Merge. Functional changes additionally require rendered/runtime proof for their affected flow.
