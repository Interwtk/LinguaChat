# STATE — where LinguaChat actually is

Rewrite this file at the end of every task. It describes the repo, not intentions.
If a number here disagrees with a command, the command is right and this file is
stale — fix it.

_Last verified: 2026-08-18 · commit `c8a4c0b` (main)_

## Head

| | |
|---|---|
| branch | `main` |
| commit | `c8a4c0b` — fix(ci): id-token: write for the Claude jobs |
| remote | `github.com/Interwtk/LinguaChat` (public) |
| sync | 0 / 0 |
| untracked | `linguachat-backend.zip`, `linguachat-frontend.zip` — the owner's, leave alone |

## Frontend

- Vite + React 18, mobile-first, one responsive shell.
- Visual architecture FROZEN. Nav is Hoy · Chats · Palabras · Tú.
- `npm run check:all` -> 49 invocations, 49 green (count by exit code).
- `npm run build` green. Entry chunk 418.3 kB (budget 500), 24 chunks.
- i18n: 1485 keys, 100 % in es pt fr it de ja ar, plus the English base.

## Backend

- FastAPI, pedagogical evaluation only. `python -m compileall .` clean.
- 431 pytest passing.
- Provider defaults to `local`; a key alone does not enable OpenAI.

## Curriculum

| level | state |
|---|---|
| Pre-A1 | 17 episodes, FROZEN |
| A1 arc 1 `work_and_study` (18-20) | ready |
| A1 arc 2 `daily_rhythm` (21-23) | ready |
| A1 arc 3 `people_around_you` (24-26) | closed, incl. real chunk-failure recovery |
| A1 arc 4 `finding_your_way` (27-29) | ready — verified green at this commit |
| A1 arc 5 `paying_and_choosing` | NEXT FRONTIER — nothing authored |
| A1 arcs 6-7 | designed only; must fail closed |

A1 is `contentStatus: partial`, `available: false`. Learner model v7.
Journey Pre-A1 -> arc 4: 29 episodes, 25 can-dos, 97 garden items.

## Known risks and debt

1. 26 advertised languages have no locale file. `LANGUAGE_OPTIONS` offers 46
   entries; 26 distinct base languages beyond the 8 implemented fall back to
   English while looking supported. -> `LC-I18N-002`.
2. Instructional prose sometimes reads `interface_language` where it should read
   `native_language`. Historical debt; needs its own sprint. -> `LC-I18N-003`.
3. Unaccented Spanish remains on the unauthenticated entry screen. -> `LC-I18N-004`.
4. `linguachat-frontend-old/` still exists in the tree; unused, unbuilt.
5. `linguachat-backend.zip` contains a real OpenAI key. Never commit it; the owner
   may want to rotate that key.

## Automation — working, and proven in live runs

- `qa.yml` on every push and pull request: frontend checks counted by exit code,
  build, the i18n table, backend compileall and pytest, five guards, and an
  **evidence gate** that fails a non-draft PR whose description has no `## Evidence`
  section naming the suites it ran.
- `claude-chain.yml` — the chain. QA green + evidence -> merge; then verify the
  coordination files, release a claim whose agent is gone, ask the queue for exactly
  ONE claimable task, and dispatch it: `LC-I18N-*` to the translation lane,
  everything else to `claude-task.yml`. It merged PR #6 by itself and healed the
  stale claim on `LC-CURR-005a`.
- `claude-task.yml` (200 turns) and `claude-i18n.yml` (100), both naming
  `allowed_bots: github-actions` so a chained run is not refused as a non-human
  initiator. Never `*`.
- `claude-mention.yml` answers `@claude` from collaborators only.
- Nothing triggers on `push`, so no run can start a run.

Measured cost of an agent run: about **0.12 USD a turn**; two runs that hit the old
120-turn ceiling cost 11.39 and 14.17 USD and produced nothing, which is why tasks
are sized and the ceiling was raised.

## Blockers

_(none)_

Historical, now resolved: the Claude workflows could not authenticate. Two of the three prerequisites are
  now met: the secret exists (the guard step passes) and OIDC works after
  `id-token: write` (`c8a4c0b`). The third is the **Claude Code GitHub App**, which
  is not installed on this repository — the action exchanges its OIDC token with
  the app and gets `401 - Claude Code is not installed on this repository`.
  Installing an App is an authorisation grant made in GitHub's UI, so it is the
  owner's action: github.com/apps/claude, or `/install-github-app` in Claude Code.
- `qa.yml` needs none of that and is green on every push and pull request.
