# STATE — where LinguaChat actually is

Rewrite this file at the end of every task. It describes measured reality, not
intentions. If a number here disagrees with a command or live GitHub run, live
evidence wins and this file must be corrected.

_Last product baseline on main: 2026-08-18 · `157df479`._

`LC-OPS-009` implementation is complete in PR #17. GitHub is the authority for
whether that PR is still open or has merged; its `## Evidence` section is the
authority for the final clean-cycle run ids. This file describes the state the PR
is intended to place on main.

## Repository / product

| | |
|---|---|
| default branch | `main` |
| last product-content baseline | `157df479` — A1 arc 5 complete + browser walkthrough recorded |
| automation delivery | PR #17, `ops/lc-ops-009-cloud-autonomy-v2` |
| remote | `github.com/Interwtk/LinguaChat` (public) |

Historical owner archives such as `linguachat-*.zip` are not project inputs and
must never be committed or modified by automation.

## Frontend

- Vite + React 18, mobile-first, one responsive shell.
- Visual architecture FROZEN. Primary nav: Hoy · Chats · Palabras · Tú.
- `check:all` now contains **51** invocations after adding
  `check:cloud-automation` (12 focused automation groups).
- First clean PR #17 validation after the only automation-test fix: run
  `32334267568` → **51/51**, production build green, entry **436.85 kB** (<500 kB).
- i18n structural parity on that run: **1580/1580** English-base keys in each of
  es/pt/fr/it/de/ja/ar, zero missing/extra/placeholder mismatches.
- Key parity is structural only. `LC-I18N-001` remains the required linguistic,
  fallback, RTL and hardcoded-string audit.

Final acceptance of LC-OPS-009 still follows the repository rule: after the final
bookkeeping commit, the PR must show two consecutive clean validation cycles. Do
not replace the PR evidence with this snapshot.

## Backend

- FastAPI pedagogical backend.
- PR #17 run `32334267568`: `python -m compileall .` clean and **444 pytest passed**.
- One existing warning remains: Pydantic V1-style `@validator` in `ai/schemas.py`
  is deprecated and should be migrated deliberately before Pydantic v3, not mixed
  into this automation PR.
- Provider defaults to `local`; an API key alone does not enable OpenAI. CI pins
  `LINGUACHAT_PROVIDER=local`.

## Dependency/security signal found during audit

`npm ci` currently reports **4 dependency vulnerabilities (1 moderate, 3 high)**.
That is a signal, not yet a proved exploitable product defect. Do not run
`npm audit fix --force` blindly. A separate dependency/security audit must identify
which packages/paths are affected, whether they are build-only or runtime, safe
upgrade ranges, and regression impact before changing versions.

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

A1 correctly remains `contentStatus: partial`, `available: false`. Arcs 6–7 must
fail closed. Never infer “A1 complete” from “all currently-built episodes pass”.

Arc 5 browser evidence on main covers all four episodes, a wrong price question +
retry, model/help recorded as assistance, and replay without duplicate reward.

## Language architecture — owner-corrected rule

One `user_language` governs UI/chrome, explanations, hints, corrections,
interpretations and meanings. English is the target language.

Legacy `interface_language` and `native_language` may remain internally for
compatibility but are one user choice and must stay synchronised. The former mixed
requirement `interface=es + native=ja + target=en` is superseded. Arabic auxiliary
experience is RTL; target English/input remain LTR; Chatto is never mirrored.

## Queue after LC-OPS-009

`IN_PROGRESS` is empty in the PR's final queue state. Ordered next work:

1. `LC-I18N-001` — audit the eight implemented languages for real quality.
2. `LC-I18N-002` — make language support/picker claims truthful.
3. `LC-QA-001` — strengthen i18n linting beyond key parity.

A1 arcs 6–7 are intentionally not yet represented by invented implementation
contracts in TASKS. Seed them from the live blueprint/authoring contract after the
current infrastructure + language-quality foundation is stable.

## Automation after LC-OPS-009

The repaired architecture is cloud-hosted; a powered-off owner PC is irrelevant:

- `Claude — chain` owns scheduling/routing and has an hourly watchdog at minute 17.
- Normal progression does **not** wait for the watchdog: after a green agent PR is
  merged from QA, the same chain invocation refreshes main and advances.
- `next-task.mjs` is the single claimability/dependency authority.
- General and i18n workers have no independent schedules and refuse work from the
  wrong lane or a stale requested task id.
- General, i18n and interactive `@claude` writers share
  `linguachat-claude-writer`, preventing concurrent repository mutation.
- Final TASKS DONE + STATE + HANDOFF are required inside the same task PR before
  merge; no post-merge bookkeeping seam is normal operation.
- A missed green event can be recovered by the watchdog. Dead draft/red/incomplete
  work is made resumable and the claim released rather than freezing the queue.
- QA explicitly declares `ready_for_review` so a real draft→ready transition is a
  supported CI event once this workflow version is on main.
- No generic Claude `push` trigger; no `allowed_bots: '*'`.
- Autonomous worker prompts use the corrected one-`user_language` contract.

### Failure that motivated the repair

Run `32331959420` (`Claude — mention`) ran on GitHub-hosted Ubuntu and proved the
owner PC was not involved. OAuth secret, OIDC exchange and Claude GitHub App token
all succeeded. The run failed at the interactive lane's 40-turn ceiling
(`error_max_turns`, turn 41, zero permission denials) before pushing a remote
branch. Issue-mode Claude also cannot edit `.github/workflows`, so the
infrastructure task had been assigned to the wrong execution lane. Blind rerun was
rejected as the wrong remedy.

## Known risks/debt to work from evidence

1. i18n 100% structural parity may hide poor copy, hardcoded strings, plurals,
   fallback leaks, RTL defects and one-language inconsistency.
2. The picker historically exposes more language options than full locale
   implementations; LC-I18N-002 must derive exact live counts.
3. `npm ci` reports 1 moderate + 3 high vulnerabilities; dependency audit pending.
4. Pydantic V1 validator deprecation warning; planned migration before Pydantic v3.
5. `linguachat-frontend-old/` and unrelated historical root files are cleanup
   candidates only after proving they are unused.
6. Some source comments can drift from runtime truth; documentation consistency
   should eventually be checked rather than trusted manually.
7. A1 arcs 6–7 and the final A1 completion gate remain real product work.

## Blockers

No user-PC, OAuth, OIDC or Claude-App blocker. Remaining work is software/product
quality work handled through the queue and QA gates.
