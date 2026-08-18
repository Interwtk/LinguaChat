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

The Claude workflows need three things. Two are done:

1. the repository secret `CLAUDE_CODE_OAUTH_TOKEN` — created by the owner, and the
   guard step confirms it is present;
2. `id-token: write` on the Claude jobs — added in `c8a4c0b`; the run now reports
   "OIDC token successfully obtained".

The third is missing and only the owner can supply it:

3. **the Claude Code GitHub App, installed on this repository.** The action swaps
   its OIDC token with that app, and without the installation the exchange returns
   `401 - Claude Code is not installed on this repository`. Installing an App is an
   authorisation grant made in GitHub's own UI, so no agent can do it:

       https://github.com/apps/claude        (install on Interwtk/LinguaChat)
       /install-github-app                   (the same thing, from Claude Code)

Then dispatch `claude-task.yml` with `task_id: LC-CURR-005`, `dry_run: false`.

Until then `qa.yml` works — it needs none of this — and the Claude workflows fail
fast with a clear message instead of half-running.

## The chain runs itself now

You probably did not have to be dispatched by hand. `claude-chain.yml` merges an
agent's pull request once QA is green and it carries an `## Evidence` section, then
picks exactly ONE claimable task and starts it. `next-task.mjs` is the single
parser of the queue: it refuses to name anything while a task sits in IN_PROGRESS,
and it honours `blocked-on:`. When nothing is claimable the chain stops, and that
is a normal ending.

So: do your task, put the real QA numbers under `## Evidence`, update TASKS and
HANDOFF in the same pull request, and the next task starts itself. If you run out
of turns, stop early — push the branch, open a DRAFT pull request saying where you
stopped, release your claim. A draft is never auto-merged, and the chain waits.

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
