# HANDOFF — read this, then start

## Current task

`LC-DOC-001` is being closed in PR #34 (`docs/lc-doc-001-readme-cleanup`). The branch has been reconciled with current `main`; PR #34 is mergeable but must remain Draft until its final bookkeeping/docs head earns two consecutive clean QA cycles.

Do not create a replacement PR for this task.

## What PR #34 must leave true

- README describes the real current product, not legacy Practice/Journey/B1 behavior.
- Lingua is the tutor; Chatto is mascot only.
- Pre-A1 remains frozen.
- A1 remains `available: false`.
- One `user_language` controls all auxiliary experience; English is the target language.
- No Supabase is authorized under the current contract. Historical cloud planning docs are reference only; `LC-CLOUD-001` remains non-claimable.
- No voice/STT/TTS/WebRTC/calls/video/pronunciation scoring and no real paid-provider calls.
- Frozen visual architecture remains untouched.
- The next serial task is `LC-CURR-006`, A1 arc 6 `what_you_can_do`, episodes 34–35. Do not implement arc 6 inside PR #34. Arc 7 remains a later separate curriculum task; `LC-PED-002` stays blocked until both arcs exist.

## Current automation blocker

A controlled re-dispatch of `LC-DOC-001` reached `Claude — autonomous task` run `32474896010`, authenticated to GitHub correctly and passed queue validation, but Claude Code failed immediately on turn 1 with `is_error:true`, zero permission denials and no pushed work. The cleanup left the queue honest. Do not repeatedly rerun that same failure without diagnosis.

The failure signature is external to LinguaChat product code. If the autonomous lane is repaired, resume the existing task/branch rather than creating parallel work. If it remains broken, report the exact Claude Code/OAuth blocker; do not substitute another functional writer.

## QA before PR #34 can be Ready

Because final coordination/docs changed after prior evidence, restart validation from zero on the exact final head:

1. `cd linguachat-frontend && npm run check:all`
2. `cd linguachat-frontend && npm run build`
3. `cd linguachat-frontend && npm run check:i18n`
4. `cd linguachat-backend && python -m compileall .`
5. `cd linguachat-backend && python -m pytest -q`
6. GitHub product/queue/foundry guards

Require a second consecutive full clean cycle with no fixes between cycles. PR #34 is docs/dead-file cleanup, so no fabricated browser walkthrough is required; functional browser proof remains mandatory for later runtime/UI/i18n changes.

## Next product handoff after merge

Claim `LC-CURR-006` only when the autonomous writer lane is healthy. Read the live A1 blueprint/map in full before implementation. Implement exactly arc 6 episodes 34–35, keep translation work separate, keep A1 closed, and use the full functional-evidence protocol.
