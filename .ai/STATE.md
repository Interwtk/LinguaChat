# STATE — where LinguaChat actually is

Rewrite this file at the end of every task. It describes measured reality, not
intentions. If a number here disagrees with a command or live GitHub run, the live
evidence wins and this file must be corrected.

_Last product baseline verified on main: 2026-08-18 · `157df479`._

`LC-OPS-009` is being validated in PR #17. Until that PR is green and merged, its
workflow changes are a candidate, not production automation. The product baseline
below is already on main; the automation section distinguishes current-main facts
from the PR #17 repair.

## Repository / product baseline

| | |
|---|---|
| default branch | `main` |
| product baseline | `157df479` — A1 arc 5 complete + browser walkthrough recorded |
| coordination claim | `393fe540` — LC-OPS-009 claimed for the cloud-autonomy repair |
| active ops branch | `ops/lc-ops-009-cloud-autonomy-v2` / PR #17 |
| remote | `github.com/Interwtk/LinguaChat` (public) |

Historical owner archives such as `linguachat-*.zip` are not project inputs and
must never be committed or modified by automation.

## Frontend

- Vite + React 18, mobile-first, one responsive shell.
- Visual architecture FROZEN. Primary nav: Hoy · Chats · Palabras · Tú.
- Last verified main `npm run check:all`: **50/50** invocations, counted by exit code.
- Last verified main build: green; entry chunk remained below the 500 kB budget.
- i18n structural parity: **1580 English-base keys**, 100% key parity in
  es/pt/fr/it/de/ja/ar. Linguistic/support honesty is NOT certified by that number;
  `LC-I18N-001` is queued for the real audit.
- PR #17 adds `check:cloud-automation` to `check:all`; its new total/result is not
  recorded as verified until GitHub QA completes.

## Backend

- FastAPI pedagogical backend.
- Last verified main `python -m compileall .`: clean.
- Last verified main pytest: **444 passed**.
- Provider defaults to `local`; possession of an API key alone does not enable
  OpenAI. CI pins `LINGUACHAT_PROVIDER=local`.

## Curriculum

| level | state |
|---|---|
| Pre-A1 | 17 episodes, FROZEN and available |
| A1 arc 1 `work_and_study` (18–20) | ready |
| A1 arc 2 `daily_rhythm` (21–23) | ready |
| A1 arc 3 `people_around_you` (24–26) | ready |
| A1 arc 4 `finding_your_way` (27–29) | ready |
| A1 arc 5 `paying_and_choosing` (30–33) | ready; blueprint check + production browser walkthrough |
| A1 arc 6 `what_you_can_do` (34–35) | designed only; no runtime content |
| A1 arc 7 `making_arrangements` (36–38) | designed only; no runtime content |

A1 is correctly `contentStatus: partial`, `available: false`. Arcs 6–7 must fail
closed. Do not open A1 merely because every currently-built episode passes.

Arc 5 evidence on main includes all four episodes in a production build: happy
path, a wrong price question + retry, model/help recorded as assistance, and replay
without duplicate XP/reward.

## Language architecture — owner-corrected rule

One `user_language` governs UI/chrome, explanations, hints, corrections,
interpretations and meanings. English is the target language.

Legacy `interface_language` and `native_language` may exist internally but are one
user choice and must stay synchronised. The old mixed requirement
`interface=es + native=ja + target=en` is superseded and must not drive code/tests.
Arabic auxiliary experience is RTL; target English/input remain LTR; Chatto is never
mirrored.

## Current queue

While PR #17 is open:

1. `LC-OPS-009` — IN_PROGRESS, cloud autonomy repair.
2. `LC-I18N-001` — next after OPS-009: audit the eight implemented languages.
3. `LC-I18N-002` — support/picker honesty.
4. `LC-QA-001` — strengthen the i18n linter.

Arc 6/7 are not yet queued as implementation tasks. They must be seeded from the
live A1 blueprint after the infrastructure/i18n audit establishes a truthful,
stable base; do not invent their task contracts from summaries.

## Automation — baseline defects found by audit

Current-main automation before PR #17 has useful guardrails, but is **not yet
fully self-healing**:

- `qa.yml` gates frontend checks/build, i18n table, backend compileall/pytest,
  forbidden-scope guards and an `## Evidence` section.
- `claude-chain.yml` can merge a green agent PR and dispatch work, but normal
  advancement depends on a later event; a merge performed with the workflow token
  can therefore leave a correct queue dormant.
- general and i18n workers still own independent weekly schedules and use different
  claimability logic instead of one selector.
- interactive `@claude` does not share the autonomous writer lock.
- a dead agent can leave a red READY PR holding a claim indefinitely.
- `qa.yml` did not explicitly listen to `ready_for_review`, forcing historical
  close/reopen/extra-commit workarounds.

### Confirmed 2026-08-20 failure

GitHub-hosted run `32331959420` (`Claude — mention`) was independent of the owner's
PC and authenticated correctly: checkout, OAuth secret, OIDC exchange and Claude
GitHub App token all succeeded. It failed because the interactive lane had
`--max-turns 40`; Claude returned `error_max_turns` at turn 41, with zero permission
denials, and no remote branch had been pushed. The action's issue-mode capability
also states it cannot modify `.github/workflows`, so LC-OPS-009 was assigned to the
wrong lane. Blindly rerunning it would reproduce the failure class.

### PR #17 repair contract

PR #17 is intended to make the normal loop fully cloud-hosted and recoverable:

- same-run advancement after successful agent merge;
- hourly `Claude — chain` watchdog as recovery, not the main mechanism;
- worker schedules removed; chain is the sole scheduler/router;
- `.github/scripts/next-task.mjs` is the one claimability authority;
- general/i18n/mention writers share one concurrency lock;
- red/draft/stale work becomes resumable rather than a permanent claim;
- `ready_for_review` triggers QA;
- final TASKS DONE + STATE + HANDOFF land atomically in the task PR;
- autonomous prompts carry the corrected one-`user_language` rule;
- focused `check:cloud-automation` regression coverage is part of `check:all`.

**Do not call this repair verified until PR #17's GitHub QA and focused regression
checks are green with exact evidence.**

## Known product / technical risks to audit next

1. Structural 100% i18n parity may hide poor copy, hardcoded strings, bad plurals,
   fallback leaks, RTL defects and user-language inconsistency.
2. The language picker historically advertises many more languages than have full
   locale implementations; exact live counts must be derived in LC-I18N-002.
3. `linguachat-frontend-old/` and unrelated historical root files remain technical
   debris; clean only through a deliberate, proved-unused cleanup PR.
4. Some source comments (for example older A1 frontier prose) can become stale even
   when runtime flags remain correct; documentation consistency should be linted or
   audited instead of trusted manually.
5. A1 arcs 6–7 and the final A1 completion gate remain real product work.

## Blockers

No user-PC blocker. GitHub-hosted runners, Claude OAuth/OIDC and the Claude GitHub
App are all proven available. The active blocker is **software correctness of the
automation itself**, being repaired and validated in PR #17.
