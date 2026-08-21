# LC-FND-001 — blocked on shared automation, not on this task's content

## Status

The four in-scope documents (`docs/curriculum/curriculum-master-a1-c2.md`,
`docs/curriculum/level-blueprint-template.md`,
`docs/research/supervisor-evidence-contract.md`,
`docs/research/supervisor-evidence-ledger.md`) plus
`.ai/foundry/completed/LC-FND-001.json` are complete, in scope, and pass:

- `check-foundry-scope.mjs --branch foundry/core/lc-fnd-001-master --base origin/main --head <local checkout of the branch> --require-complete` — passes when run **from a checkout of the foundry branch itself**.
- Two consecutive clean `check:all && build && check:i18n` (frontend) and `compileall && pytest` (backend) cycles, re-run after merging current `main` in.
- PR #37 checks: `backend`, `frontend`, `guards`, `evidence` all green.

This task's own deliverable is done. It cannot reach `merged` because of a bug in shared automation outside this task's `writeScopes`.

## The blocker (outside `writeScopes`, not fixed here)

`.github/scripts/check-foundry-scope.mjs`, `--require-complete` block:

```js
if (!changed.includes(marker) || !existsSync(marker)) {
  console.error(`Ready PR must add ${marker}`)
  process.exit(1)
}
...
try { m = JSON.parse(readFileSync(marker, 'utf8')) } catch (e) { ... }
```

`existsSync(marker)` / `readFileSync(marker)` read the **physical working tree that happens to be checked out**, not the `--head` ref being validated. `changed` is computed correctly via `git diff --name-only base...head` (ref-aware), but the marker-content check is not.

`.github/scripts/merge-foundry-pr.sh` (the orchestrator's merge gate, invoked from `run-foundry-cycle.sh`) checks out `main` and then runs:

```
node .github/scripts/check-foundry-scope.mjs --branch "$BRANCH" --base origin/main --head "origin/$BRANCH" --require-complete
```

Since the runner's working tree is `main`, not `origin/$BRANCH`, the completion marker legitimately does not exist on disk yet (it only exists, pre-merge, on the foundry branch). So `existsSync(marker)` is always `false` and the gate always fails with `Ready PR must add .ai/foundry/completed/<TASK>.json`, reported upstream as `merge gate=scope-or-quality`, and the orchestrator converts the PR back to draft — **regardless of whether the marker is actually present and correct on the branch.**

Observed directly in the orchestrator's own run log (`Curriculum Foundry — workflow_run`, run `32454886577`, step "Run one self-healing Foundry cycle", 2026-08-21T06:33:49Z):

```
HEAD is now at 8c02736 chore(docs): claim LC-DOC-001 to resume existing PR #34
...
Foundry scope OK for LC-FND-001: 5 changed files.
Ready PR must add .ai/foundry/completed/LC-FND-001.json
✓ Pull request Interwtk/LinguaChat#37 is converted to "draft"
Foundry PR #37 (foundry/core/lc-fnd-001-master): merge gate=scope-or-quality; returned to draft.
```

Note `HEAD is now at 8c02736` — that is `main`, not the foundry branch — confirming the working tree mismatch.

## Why this blocks the whole Foundry pipeline, not just this PR

Every task in `.ai/foundry/tasks.json` reaches completion the same way: add its own
`.ai/foundry/completed/<TASK>.json` on its own branch, then rely on
`merge-foundry-pr.sh` to validate `--require-complete` before merging. Since that
validation is run from a `main` checkout in every observed orchestrator run, **no
Foundry task can ever pass its own final gate**, independent of content quality.
This will keep cycling every task through ready → auto-draft.

## Suggested fix (not applied — outside this task's `writeScopes`)

Make the marker check ref-aware instead of filesystem-aware, e.g. replace the
`existsSync`/`readFileSync` pair with a `git show <head>:<marker>` read (falling
back cleanly, with the same error message, when the path doesn't exist at that
ref). This keeps the script usable both from a same-branch checkout (existing
passing case) and from the orchestrator's `main` checkout (currently broken).

This change belongs to `.github/scripts/check-foundry-scope.mjs`, which is core
shared automation, not part of `LC-FND-001`'s `writeScopes`. It needs its own
task/PR through the normal `.ai/TASKS.md` serial queue (this is CI/automation
infrastructure, not curriculum/research content) or a dedicated `LC-OPS-*`
Foundry task — not a silent fix inside this branch.

## What to do with this PR

PR #37 is left in draft, as the coordination contract requires when a completion
blocker is outside the task's own write scope. Its content is finished and
evidence-backed; it is waiting on the automation fix above (or a manual merge)
rather than on further curriculum/contract work.

## Re-verified 2026-08-21 (resumed session)

Resumed this branch and re-checked before making any further change:

- `.github/scripts/check-foundry-scope.mjs` on current `origin/main` still uses
  `existsSync(marker)` / `readFileSync(marker)` (filesystem-based, not ref-based)
  in the `--require-complete` block — the bug described above is unpatched and no
  `.ai/TASKS.md` entry currently targets it.
- Reproduced the orchestrator's exact failure mode from a separate worktree checked
  out to `origin/main`, running
  `check-foundry-scope.mjs --branch foundry/core/lc-fnd-001-master --base origin/main --head origin/foundry/core/lc-fnd-001-master --require-complete`:
  it prints `Foundry scope OK for LC-FND-001: 6 changed files.` followed by
  `Ready PR must add .ai/foundry/completed/LC-FND-001.json` and exits 1, even
  though the marker is present and correct on the branch tip.
- Merged current `main` into `foundry/core/lc-fnd-001-master` (fast, no conflicts —
  `main`'s only change in range was to `.ai/TASKS.md`, outside this task's scope)
  and re-ran the full completion contract from the branch's own checkout:
  `check:all`, `build`, `check:i18n` (frontend) and `compileall`, `pytest -q`
  (backend), two consecutive clean cycles, all exit 0; `check-foundry-scope.mjs
  --require-complete` from the branch checkout still reports OK with the marker
  validated (`status=complete`, `cleanCycles=2`).

No content or scope change was needed this session. This task remains genuinely
done and still blocked only by the shared-automation bug above.

## Re-verified 2026-08-21 (second resumed session)

Resumed again after PR #37 was cycled back to draft by the orchestrator. Same
finding, re-confirmed end to end:

- `.github/scripts/check-foundry-scope.mjs` on current `origin/main` is still
  filesystem-based (`existsSync(marker)` / `readFileSync(marker)`) in the
  `--require-complete` block, not ref-aware — unpatched, no `.ai/TASKS.md` entry
  targets it.
- `main`'s only change since the branch's last sync was to `.ai/TASKS.md`
  (LC-DOC-001 claim/release churn in the serial queue) — entirely outside this
  task's `writeScopes` and outside the Foundry coordination contract's editable
  files. Merged cleanly with no conflicts.
- Re-ran the full completion contract from the branch's own checkout after the
  merge: `check:all`, `build`, `check:i18n` (frontend) and `compileall`,
  `pytest -q` (backend, 444 passed) — two consecutive clean cycles, all exit 0.
- `check-foundry-scope.mjs --require-complete` from the branch checkout: `Foundry
  scope OK for LC-FND-001: 6 changed files` (4 write-scope docs + completion
  marker + this request file) — still OK; marker still validated.

Still no content or scope change needed. The deliverable has been complete and
evidence-backed across three sessions now; the only blocker remains the
ref-unaware marker check in shared automation, outside this task's `writeScopes`.

## Owner-confirmed 2026-08-21T07:17:38Z

The repo owner reviewed PR #37 and confirmed this diagnosis directly (see PR
comment at that timestamp): `check-foundry-scope.mjs --require-complete` reads
the completion marker off the physical working tree (`existsSync`/
`readFileSync`) instead of the candidate `--head` ref, so it can falsely fail
every correct Foundry PR whose marker exists only on the candidate branch. The
owner's explicit direction: keep PR #37 Draft, do not work around or weaken the
gate, and do not edit shared automation from this scope-limited branch. The fix
belongs in the serial queue (or a dedicated `LC-OPS-*` Foundry task) and must
change marker validation to read the candidate ref (e.g. `git show
${head}:${marker}`), keep `changed.includes(marker)`, and add a regression that
runs the guard from a `main` checkout against a separate foundry head
containing the marker, with two clean full cycles after the fix.

Resumed sessions after this point: `main` has not moved since this branch's
last sync (verified via `git merge-base --is-ancestor origin/main HEAD`) and
the four in-scope documents plus the completion marker are unchanged and still
correct. Re-running the full QA/re-verification loop every session adds no new
information once the owner has already confirmed the blocker — do not repeat
it unless `main` has moved, `check-foundry-scope.mjs` has changed, or new PR
feedback arrives. This task's own deliverable remains done; it is waiting on
the shared-automation fix above (or a manual merge), not on further work here.

## Resynced 2026-08-21 (main moved, trivial and out of scope)

`main` advanced by one commit (`chore(ops): release LC-DOC-001 so its existing
work can resume`, `.ai/TASKS.md` only) — outside this task's `writeScopes` and
unrelated to its content. `.github/scripts/check-foundry-scope.mjs` is
byte-identical to the version already diagnosed; no new PR feedback since the
owner's 07:17:38Z confirmation. Merged `main` in (no conflicts; only
`.ai/TASKS.md` changed) and re-ran `check-foundry-scope.mjs --require-complete`
from this branch's own checkout: `Foundry scope OK for LC-FND-001: 6 changed
files`, marker still validated. Did not re-run the full frontend/backend QA
cycles — none of the four in-scope documents or the completion marker changed,
so the prior two clean cycles still stand. This task remains done and blocked
only on the shared-automation fix described above.
