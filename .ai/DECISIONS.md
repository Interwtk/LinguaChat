# DECISIONS — why things are the way they are

Append only, newest first. A decision recorded here does not need re-litigating; a
decision NOT recorded here is not a decision, it is a habit.

## 2026-08-18 — The queue heals itself, and 120 turns was not enough

Two runs died the same way on the same task: 32174953879 (121 turns, 11.39 USD) on
the whole arc, and 32178509298 (121 turns, 14.17 USD) on 005a alone. Splitting the
task did not fix it, which is the useful finding: the ceiling is the binding
constraint, not the scope. Reading a1-blueprint.json is what spends it.

So max-turns goes to 200, and the number is now a known cost rather than a guess:
roughly 0.12 USD a turn on these runs.

Both deaths also left a claim behind, and the chain then refused to start anything
— correctly, because it cannot tell a working agent from a dead one. It can now:
a claim whose agent is not running and whose branch has no open pull request is
released automatically, on main, with a warning in the run summary. Without that,
autonomy lasts until the first crash.

## 2026-08-18 — Tasks are sized to a run, and the claim is the one thing on main

Run 32174953879 spent 121 turns and 11.39 USD on LC-CURR-005 and produced nothing:
no branch, no commit, no pull request, and a claim left behind that blocked the
queue. The task was not wrong, it was too big — a whole arc is a session's work,
and asking for it in one run guarantees the turn limit arrives before the pull
request does.

So an arc is now four tasks (005a content, 005b evaluation, 005c copy, 005d proof),
each with a shape a single run can finish, and the prompt tells an agent that is
running out of turns to stop early and leave the branch, the draft PR and the
released claim behind.

The same run exposed a contradiction I had written: TASKS.md says to claim on main
(a claim on a branch is invisible, so locking does not work), while the prompt said
never push to main. The agent resolved it correctly and I have made it explicit:
coordination files under .ai/ may go straight to main, product code never does.

## 2026-08-18 — An agent never creates the OAuth secret

Setting `CLAUDE_CODE_OAUTH_TOKEN` means holding the owner's credential and writing
it into a service. That is the owner's action, once, by hand. Everything around it
is automated so the cost is two commands.

## 2026-08-18 — Autonomy is bounded by pull requests, not by trust

An agent may create branches, commit and open PRs. It does not push functional work
to `main`. The guardrail is `qa.yml`: the full suite on every push and PR with
`LINGUACHAT_PROVIDER=local`, so an autonomous change cannot be merged while red.

Deliberately NOT done: a branch-protection rule requiring PRs. It would also block
the owner's own direct pushes, and that is their call, not an agent's.

## 2026-08-18 — No aggressive cron

The scheduled run is weekly and does nothing unless a task is genuinely claimable.
The Claude workflows never trigger on `push`, so a commit cannot start a run that
makes a commit. Nothing here can loop.

## 2026-08-18 — Interactive Claude is gated to collaborators

The repository is public. The mention workflow answers `@claude` only when the
author association is OWNER, MEMBER or COLLABORATOR, and it never uses
`pull_request_target`, so a stranger's pull request cannot reach the secret.

## Earlier decisions, carried forward from the work itself

- The blueprint outranks the runtime. An arc is implemented from
  `a1-blueprint.json`, never from memory or from a prompt's summary of it.
- A1 stays closed until it is finished: `contentStatus: partial`,
  `available: false`, and `forLearner: false` as the single audited door.
- The design's intent outranks its accident. The streak flame's geometry was
  changed because the original construction drew a water drop; its layers, palette
  and cadences were kept.
- Deterministic first, provider second. Every objective has a local path; the
  provider is an escalation for genuinely ambiguous replies, and it never decides
  mastery, XP, Garden state or graduation.
