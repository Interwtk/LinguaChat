# HANDOFF — read this, then start

Keep this file current: what just happened, what is proved, what comes next, and
what will bite the next operator.

_Written at the end of LC-OPS-009 / PR #17 on 2026-08-20._

## What just happened

A1 arc 5 (`paying_and_choosing`, episodes 30–33) was already complete before this
ops task. Do not redo it. Main has content/resolver, frontend/backend evaluator
parity, eight-language copy, `check:a1-arc5`, and a production-build walkthrough of
all four episodes covering happy path, wrong/retry, model/help assistance and replay
without duplicate reward.

LC-OPS-009 repaired the cloud development loop after two concrete failures:

1. the queue could become correct and claimable after a merge yet no event woke the
   next worker;
2. issue #16 was sent through interactive `@claude`; run `32331959420` authenticated
   correctly on GitHub-hosted Ubuntu but hit `error_max_turns` at turn 41 with zero
   permission denials and no remote branch, and issue-mode Claude cannot edit
   `.github/workflows` anyway.

The owner PC was never the runtime dependency. The problem was orchestration.

## LC-OPS-009 result

PR #17 introduces:

- same-run advancement after a successful QA-gated agent merge;
- hourly chain watchdog at minute 17 as a recovery net;
- no worker-local schedules;
- `next-task.mjs` as the one claimability/dependency authority;
- strict lane routing and rejection of stale requested task ids;
- one writer lock (`linguachat-claude-writer`) shared by task/i18n/mention lanes;
- a shared merge contract requiring green checks, `## Evidence`, atomic
  TASKS/STATE/HANDOFF bookkeeping, and the task under DONE on the PR branch;
- watchdog recovery of missed green PRs;
- red/draft/incomplete work returned to a resumable state instead of holding the
  queue forever;
- QA trigger for `ready_for_review`;
- corrected worker language rule: one `user_language` for the complete auxiliary
  experience, English target;
- `check:cloud-automation` (12 focused groups) inside `check:all`.

The first validation after fixing the new test's own false positive was GitHub run
`32334267568`: `check:cloud-automation` 12/12, `check:all` 51/51, build green
(entry 436.85 kB), i18n 1580/1580 in every implemented locale, compileall clean,
444 pytest. Because a fix occurred during the task, PR #17 must still show two
consecutive clean cycles after the **final bookkeeping commit** before merge. Read
the PR's latest `## Evidence`; it supersedes this snapshot.

## Next task after PR #17 merges

`LC-I18N-001` — **audit, do not bulk-fix**.

The eight implemented languages (English base + es/pt/fr/it/de/ja/ar) have 100%
structural key parity, but that does not prove good language. Audit each one for:

- natural copy/register and missing diacritics;
- placeholders and count/plural grammar;
- hardcoded visible strings;
- raw i18n keys and silent English fallback;
- consistency that UI, explanations, hints, corrections and meanings all follow the
  same `user_language`;
- target English remaining English/LTR;
- RTL layout, nested LTR English and Chatto non-mirroring.

Record measured findings in `.ai/TRANSLATIONS.md`. Keep fixes in small subsequent
PRs so a huge translation diff cannot hide mistakes.

Then `LC-I18N-002` makes advertised support truthful, followed by `LC-QA-001` to
turn key-parity checks into a real i18n linter.

A1 arcs 6–7 are real later work but are not yet queued with invented details. When
it is time to seed them, read `a1-blueprint.json` and the authoring contract in full.

## Language rule — authoritative

```text
user_language = the user's language
UI / explanations / hints / corrections / meanings = user_language
target_language = English
```

Legacy `interface_language` and `native_language` are compatibility names for the
same user choice, not separate settings. Spanish user => all auxiliary Spanish;
Japanese user => all auxiliary Japanese; Arabic user => auxiliary Arabic/RTL while
target English/input stay LTR. Chatto never mirrors.

## New audit signals to keep, not blindly patch

- `npm ci` reports **4 dependency vulnerabilities: 1 moderate, 3 high**. Audit
  affected dependency paths and safe versions before changing anything; never use
  `npm audit fix --force` as a reflex.
- Backend tests are green but emit one Pydantic deprecation warning for a V1-style
  `@validator` in `ai/schemas.py`. Migrate deliberately before Pydantic v3.
- Historical folders/files such as `linguachat-frontend-old/` and unrelated empty
  root artifacts are cleanup candidates only after proving no build/test/docs path
  depends on them.

## Traps this repo has already sprung

- Count `check:all` by exit code.
- A suite going green is not functional proof. Episodes need happy + wrong/retry +
  assisted + replay; UI/i18n needs browser proof at 390/1440; evaluators need
  frontend/backend parity including refusal cases.
- A step/story field must reach local evaluation AND the provider payload.
- Every displayed model answer must pass its evaluator.
- Failed dynamic imports are browser-memoized; do not simplify the deliberate reload
  recovery path into an inert retry.
- Never infer “A1 complete” from all *runtime* A1 episodes passing while arcs 6–7
  do not exist. Keep A1 partial/unavailable until the final gate.
- No Supabase, real-provider QA, voice/STT/TTS/WebRTC/pronunciation/calls/video.
- Never touch owner archives/secrets.
- Do not route workflow-editing infrastructure through interactive `@claude`.
- Never blind-rerun a failed workflow: read its logs, identify the deterministic
  cause, fix that cause or make the work resumable.
