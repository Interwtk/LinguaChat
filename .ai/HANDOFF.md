# HANDOFF — read this, then start

The last agent wrote this for the next one. Keep it short and current: what just
happened, what is half-done, what to do next, and what will bite you.

_Written 2026-08-18, from `401113a`, on branch `chore/autonomous-ops`._

## What just happened

Took operational control of the repo. Verified the real state rather than trusting
history: HEAD is `401113a`, identical to `origin/main`, and A1 arc 4 IS present and
green — 49/49 frontend invocations, build green, 431 backend tests, i18n 100 % in
eight languages.

Added in this branch: `CLAUDE.md` (the permanent rules), `.ai/` (this coordination
system), a CI workflow that runs the whole QA suite on every push and PR with the
provider pinned to `local`, and two Claude workflows written from the current
official documentation of `anthropics/claude-code-action@v1`.

## What has to happen first — one manual action, by the owner

The Claude workflows cannot run until the repository secret exists. An agent must
not create it: that means holding your credential and writing it into a service.
Nothing prints or stores the token.

    claude setup-token
    gh secret set CLAUDE_CODE_OAUTH_TOKEN --repo Interwtk/LinguaChat

`claude setup-token` is the official generator for Pro/Max accounts. `gh secret
set` prompts for the value and never echoes it; verify with `gh secret list`,
which shows names only.

Until that exists, `qa.yml` still works — it needs no secret — and the Claude
workflows stop immediately with a clear message instead of half-running.

## Next task

`LC-CURR-005` — A1 arc 5, `paying_and_choosing`. READ ALL THREE curriculum
documents before writing a line; the blueprint decides episodes, capabilities,
intents, budgets, facts, semantic types and exclusions. Arcs 6 and 7 stay closed.

## Traps this repo has already sprung

- Count `check:all` by exit code. Grepping for a success string undercounts by two.
- A step's own fields (repairKind, placeName, timeForm, partner) must travel to the
  evaluator AND the provider payload, in steps and in story turns. Three separate
  bugs have come from that one gap.
- Any answer modelled on screen must pass the evaluator that will judge the
  learner's copy of it. `check:a1-arc4` group 13 exists because one did not.
- An episode-hosted story must never be offered as a loose session block, and an
  objective with no authored story must never be planned into a story format.
- A failed dynamic import is memoised by the browser: retrying the same specifier
  makes no request at all. `useLazyContent` handles it; do not simplify that away.
- A budget may be raised only with the numbers that justify it, and never by
  weakening the structural assertion underneath it.
