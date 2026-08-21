# LC-RES-Y01 — blocker: orchestrator recovery gate reads the wrong working tree

Status: content work is complete and verified. PR #50 is blocked from going
ready/merging by an infrastructure bug in the shared orchestrator scripts, which
are outside this task's `writeScopes` (`docs/research/supervisors/psychology-primary.json`,
`docs/research/supervisors/batches/psy-01.md`). Recording the blocker here instead
of fixing it out of scope, per the coordination contract.

## What's actually done on this branch

- `docs/research/supervisors/psychology-primary.json`: 30 unique, verified primary
  studies (`PSY-Y01-001..030`), 12 of 14 §7 topics covered.
- `docs/research/supervisors/batches/psy-01.md`: verification methodology + known gaps.
- `.ai/foundry/completed/LC-RES-Y01.json`: `status: complete`, `cleanCycles: 2`.
- Verified locally on this branch's checkout (HEAD `8727df9`):
  - `node .github/scripts/check-foundry-scope.mjs --branch foundry/research-psy/lc-res-y01 --base origin/main --head HEAD` → `Foundry scope OK for LC-RES-Y01: 3 changed files.` (exit 0)
  - `node .github/scripts/check-supervisor-evidence.mjs --partial psychology` → `psychology: 30 unique primary studies; 12 topics` / partial gate passed (exit 0)
- PR #50's own per-commit CI checks are all green: `frontend — checks and build`,
  `backend — compile and tests`, `guards — nothing forbidden slipped in`,
  `evidence — the PR shows the QA it ran`.

## The actual blocker

Every recovery cycle (`Curriculum Foundry — orchestrator`, e.g. run
`32505513380` at 2026-08-21T16:56:17Z, *after* the owner-requested topic fix was
already pushed) returns PR #50 to draft with reason `scope-or-quality`, logging:

```
Foundry scope OK for LC-RES-Y01: 3 changed files.
psychology: 0 unique primary studies; 0 topics
- missing /home/runner/work/LinguaChat/LinguaChat/docs/research/supervisors/psychology-primary.json
```

Root cause: `.github/scripts/merge-foundry-pr.sh` runs

```
git fetch origin main "$BRANCH" --quiet
node .github/scripts/check-foundry-scope.mjs --branch "$BRANCH" --base origin/main --head "origin/$BRANCH" --require-complete
```

without ever checking out `origin/$BRANCH`. The `--require-complete` path in
`check-foundry-scope.mjs` correctly diffs `base...head` by ref (that part doesn't
need a checkout), but then spawns
`check-supervisor-evidence.mjs --partial <domain>`, which reads the corpus file
straight off disk via `new URL('../../docs/research/supervisors/psychology-primary.json', import.meta.url)`
— i.e. from whatever the runner's working tree happens to be, not from `head`.
The caller (`run-foundry-cycle.sh`) resets the working tree to `origin/main`
before this loop runs. `psychology-primary.json` does not exist on `main` at all
yet (no `LC-RES-Y0x` batch has merged), so the gate always sees an empty/missing
corpus for any not-yet-merged `research-psy`/`research-ped` PR, regardless of
what that PR actually contains. This is a repo-wide bug hitting every
`research-ped`/`research-psy` (and any `requiresEvidenceReady`) PR, not something
specific to this batch's content.

## Suggested fix (for whichever lane owns `.github/scripts/**`)

In `check-foundry-scope.mjs`'s `requireComplete` branch, make the evidence-gate
subprocess operate on `head`'s content instead of the live working tree —
e.g. `git worktree add`/`git show head:<path>` into a temp file/dir and point
`check-supervisor-evidence.mjs` at that, or have `merge-foundry-pr.sh` checkout
`origin/$BRANCH` before calling `check-foundry-scope.mjs --require-complete`
(restoring `origin/main` afterward, since later loop iterations depend on it).

## What I did NOT do

- Did not edit `.github/scripts/**` (outside `LC-RES-Y01`'s `writeScopes`).
- Did not touch `.ai/TASKS.md`, `.ai/STATE.md`, `.ai/HANDOFF.md`.
- Left PR #50 in draft; the branch/content are otherwise ready to merge once the
  orchestrator gate is fixed.
