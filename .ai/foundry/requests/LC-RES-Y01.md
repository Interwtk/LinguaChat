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

## Update (2026-08-21, new session): re-verified, still blocked, escalating ownership gap

Fresh session, no prior context carried over except this file/branch/PR state.
Re-checked everything from scratch rather than trusting the earlier entries:

- Branch is even with `origin/main` (`ff6ee28`) — no rebase needed, no conflicts.
- Content diff vs. `origin/main` is unchanged: 4 files, all inside scope
  (`psychology-primary.json`, `batches/psy-01.md`, this request file, the
  completion marker).
- `node .github/scripts/check-supervisor-evidence.mjs --partial psychology` →
  `psychology: 30 unique primary studies; 12 topics` — passes, exit 0.
- `node .github/scripts/check-foundry-scope.mjs --branch foundry/research-psy/lc-res-y01 --base origin/main --head HEAD`
  → `Foundry scope OK for LC-RES-Y01: 4 changed files.` — passes, exit 0.
- Read current `main`'s `.github/scripts/check-foundry-scope.mjs` directly: the
  `--require-complete` branch still does
  `spawnSync(process.execPath, [evidenceScript, '--partial', domain], { stdio:'inherit' })`
  with no ref/path argument, and `merge-foundry-pr.sh` still never checks out
  `origin/$BRANCH` before calling it with `--require-complete`. The bug
  described above is unchanged and still live on `main`.
- PR #50's per-commit CI checks are still green (`frontend`, `backend`,
  `guards`); `evidence` check shows `skipping` (that check only runs on
  ready/non-draft PRs, which this deliberately stays as, per the reasoning
  below).
- Checked `.ai/foundry/tasks.json` for a task whose `writeScopes` covers
  `.github/scripts/**`: **none exists.** No current Foundry lane owns the file
  that needs the fix. Since `.github/scripts/**` is also outside every research
  lane's scope, no research worker can fix this in-scope, and the task graph
  itself doesn't have a task to claim it. This is worth a human/product-queue
  decision (e.g. a new ops-lane task, or a direct `.ai/TASKS.md` entry) rather
  than something a Foundry research worker can resolve by waiting.

No new action taken beyond this note: marking the PR ready would just get
auto-reverted to draft with the same `scope-or-quality` / `0 unique primary
studies` false negative already reproduced twice (this branch and sibling
PR #53). Left in draft. This task's own deliverable (25+ new unique verified
primary psychology studies, batch 1/4) remains complete and unchanged; nothing
here required re-running the two-clean-cycle QA cycle since no code/content
changed.

## Update (2026-08-21, resumed session): ownership gap resolved — GH issue #52 already tracks the fix

Fresh session. The prior update above (17:26:10Z) flagged that no `tasks.json`
entry owns `.github/scripts/**` and asked for a human/product-queue decision.
That check only looked at `tasks.json`; it missed that a GitHub issue for
exactly this fix already existed one commit earlier in wall-clock time
(**issue #52, "LC-OPS-015 — make Foundry evidence gates validate the candidate
head"**, opened 2026-08-21T17:14:21Z, before the 17:26:10Z update that raised
the gap). Issue #52's body independently reaches the same root cause as this
file (evidence gate resolves the corpus path via `import.meta.url` off the
live working tree, not `--head`) and specifies the required fix (materialize
candidate-head corpus content via `git show <head>:<path>` or an isolated
worktree at candidate head), required regressions, and explicitly directs:
"Do not implement this fix from #50's scope-limited research branch." So the
ownership gap is resolved — this is not an orphaned bug, it has a filed,
scoped, unassigned task waiting for whichever lane picks up `LC-OPS-015`.
Nothing for this research-psy branch to do differently: correct action
remains staying in draft until `LC-OPS-015` lands, then rebasing and
rerunning #50's final-head evidence/QA contract, exactly as issue #52's last
paragraph specifies.

Re-verified fresh, no drift: branch even with `origin/main` (`4efaf22`, 0
commits behind); content unchanged (`psychology-primary.json`: 30 unique
studies / 12 topics via `check-supervisor-evidence.mjs --partial psychology`,
exit 0; `check-foundry-scope.mjs --branch foundry/research-psy/lc-res-y01
--base origin/main --head HEAD`: `Foundry scope OK for LC-RES-Y01: 4 changed
files.`, exit 0). Latest orchestrator run (`32509614636`,
2026-08-21T17:43:15Z) recognized this branch's worker as already
queued/running and did not attempt a merge cycle against PR #50; sibling PR
#53 (`LC-RES-P01`) was bumped back to draft in that same run with the
identical `scope-or-quality` / `0 unique primary studies` signature,
reconfirming the bug is still live and repo-wide, not fixed. No code/content
changed this session, so the two-clean-cycle QA count is unaffected. PR #50
stays in draft.

## Update (2026-08-21, new session): fresh independent re-verification, no drift

New session, re-derived everything from scratch instead of trusting the notes
above. Findings match exactly, with one additional live corroboration:

- Branch content unchanged and still correct: `psychology-primary.json` = 30
  unique studies, 12 topics (`check-supervisor-evidence.mjs --partial
  psychology`, exit 0); `check-foundry-scope.mjs --branch
  foundry/research-psy/lc-res-y01 --base origin/main --head HEAD
  --require-complete` → `Foundry scope OK for LC-RES-Y01: 4 changed files.`,
  exit 0. Branch is even with `origin/main` (`ff6ee28`), no rebase needed.
- Issue #52 (`LC-OPS-015`) is still `OPEN`, no comments, unclaimed. Read
  current `main`'s `check-supervisor-evidence.mjs` directly: it still
  resolves the corpus via `new URL(..., import.meta.url)` off the live
  working tree with no ref/path CLI argument (`--partial` is the only flag it
  parses) — the bug issue #52 describes is unchanged.
- Watched the bug hit live in the newest orchestrator run
  (`32511260618`, 2026-08-21T18:02:13Z, i.e. after every prior update in this
  file): `pedagogical: 0 unique primary studies; 0 topics` →
  `Foundry PR #53 (foundry/research-ped/lc-res-p01): merge gate=scope-or-quality;
  returned to draft.` Same run logged `LC-RES-Y01: worker already
  queued/running` and skipped re-evaluating PR #50 this cycle rather than
  bumping it — consistent with the bug, not evidence it's fixed.

No content or code changed this session (nothing needed to change), so the
two-clean-cycle QA count is unaffected and no new QA run was required. Correct
action remains unchanged from the prior update: stay in draft until
`LC-OPS-015` lands, then rebase and rerun this PR's final-head evidence/QA
contract.

## Update (2026-08-21, new session): LC-OPS-015 fix now exists as PR #57, still unmerged

Fresh session, re-verified from scratch again (no drift): branch even with
`origin/main` (`ff6ee28`); content diff vs. main unchanged (4 files, all
in-scope); `check-supervisor-evidence.mjs --partial psychology` and
`check-foundry-scope.mjs ... --require-complete` both exit 0 (30 studies, 12
topics). PR #50 still `OPEN`/draft, `mergeable`, per-commit checks green
(`frontend`, `backend`, `guards`; `evidence` skips on drafts by design).

New since the last update: the actual fix for issue #52/`LC-OPS-015` now
exists as **PR #57** (`ops/fix-foundry-evidence-ref`, "fix(ops): validate
Foundry research evidence from candidate head"), open and draft, CI green as
of `2026-08-21T18:30:37Z`. Read its diff directly — it adds `--ref <head>`
support to `check-supervisor-evidence.mjs` (corpus read via
`git show <ref>:<path>` when a ref is given) and makes
`check-foundry-scope.mjs --require-complete` pass `--head` through to both
the partial and full evidence-gate subprocess calls. This is exactly the fix
this file has been describing since the first update; it matches the root
cause precisely and does not weaken any threshold. A sibling PR **#56**
(`ops/lc-ops-016-shared-automation-fixes`) is also open/draft/green and may
bundle related automation fixes.

Neither #56 nor #57 is merged yet, so the orchestrator's `--require-complete`
evidence gate on `main` is still unfixed and this branch's correct action is
unchanged: stay in draft, do not merge #57 myself (outside this task's lane
and scope — that PR belongs to whichever lane owns `.github/scripts/**`, per
issue #52's explicit instruction), and once it lands, rebase this branch and
rerun PR #50's final-head evidence/QA contract before marking ready. No
content or code changed on this branch this session; the two-clean-cycle QA
count is unaffected.
