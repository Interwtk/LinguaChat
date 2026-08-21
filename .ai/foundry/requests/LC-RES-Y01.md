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

## Update (2026-08-21, later run): partial fix landed, blocker still open

Commit `576f8a9` (`fix(ops): validate Foundry completion marker from candidate
head`) landed on `main` and fixed *half* of this: the completion-marker read in
`check-foundry-scope.mjs` now uses `git show ${head}:${marker}` instead of
`readFileSync(marker)`, so the marker check itself is now ref-correct.

It did **not** touch the evidence-gate subprocess call. `check-foundry-scope.mjs`
(current `main`, lines ~73-82) still does:

```js
const evidenceScript = new URL('./check-supervisor-evidence.mjs', import.meta.url).pathname
const gate = spawnSync(process.execPath, [evidenceScript, '--partial', domain], { stdio:'inherit' })
```

and `check-supervisor-evidence.mjs` still resolves the corpus file via
`new URL('../../docs/research/supervisors/psychology-primary.json', import.meta.url)`
— i.e. off the live working tree, with no `--path`/`--root`/ref argument of any
kind. Re-verified directly against current `check-supervisor-evidence.mjs`
source: no such argument exists. Because `merge-foundry-pr.sh` never checks out
`origin/$BRANCH` before invoking `check-foundry-scope.mjs --require-complete`,
this subprocess will still read whatever `psychology-primary.json` happens to be
on disk at merge time (missing on `main` until an `LC-RES-Y0x` batch merges),
not the PR head's content. The original root cause and suggested fix above are
unchanged and still needed.

Re-verified on this branch's current head (content unchanged since `8727df9`):

```
node .github/scripts/check-foundry-scope.mjs --branch foundry/research-psy/lc-res-y01 --base origin/main --head HEAD --require-complete
Foundry scope OK for LC-RES-Y01: 4 changed files.
psychology: 30 unique primary studies; 12 topics
Supervisor evidence partial gate: every present primary-study record is structurally verifiable and deduplicated.
```

(4 changed files now, vs. 3 previously, because this update itself added to
`.ai/foundry/requests/LC-RES-Y01.md`, which is in scope per the coordination
contract.) PR #50's per-commit checks remain green; branch is even with
`origin/main` (0 commits behind), so no rebase was needed. No content changes
were made — nothing here requires re-running the two-clean-cycle QA cycle,
since QA cycles are keyed to code/content changes and none occurred.

## Update (2026-08-21, resumed session): bug confirmed repo-wide, hit a sibling PR live

Re-verified independently on this branch's current head (`d323a3f`, unchanged
content): both `check-foundry-scope.mjs --branch foundry/research-psy/lc-res-y01
--base origin/main --head HEAD` and `check-supervisor-evidence.mjs --partial
psychology` still exit 0 (30 studies, 12 topics). PR #50 remains `OPEN`/draft,
`mergeable`, all per-commit checks green. Left in draft — marking it ready
would just trigger the same false-negative bump documented below rather than
merge, per the orchestrator log evidence just gathered.

New evidence that this is a **repo-wide, still-unfixed** bug and not specific
to this branch: orchestrator run `32507266052` (2026-08-21T17:16:19Z, minutes
before this update) bumped PR **#53** (`LC-RES-P01`, the sibling
`research-ped` batch-1 task) from ready back to draft with the identical
failure signature:

```
pedagogical: 0 unique primary studies; 0 topics
- missing /home/runner/work/LinguaChat/LinguaChat/docs/research/supervisors/pedagogical-primary.json
Foundry PR #53 (foundry/research-ped/lc-res-p01): merge gate=scope-or-quality; returned to draft.
```

This is the exact same class of failure as LC-RES-Y01's blocker (missing
corpus file because the evidence-gate subprocess reads the live working tree,
which `run-foundry-cycle.sh` had reset to `origin/main`, not the PR head),
hitting a different lane/task/file (`pedagogical-primary.json` vs.
`psychology-primary.json`) on the same day. This corroborates the original
root-cause diagnosis and suggested fix above with a second, independent,
live production instance — whichever lane owns `.github/scripts/**` should
treat this as confirmed and not branch-specific.
