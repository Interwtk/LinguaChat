# HANDOFF — read this, then start

Keep this file current: what just happened, what is proved, what comes next, and
what will bite the next operator.

_Written for `LC-DOC-001` closeout, PR #34, on 2026-08-21. Live main/TASKS wins if
it changes after this branch was cut._

## What just happened

`LC-DOC-001` closes the stale-documentation gap this queue had flagged since
`LC-OPS-010`: `README.md` still described an earlier "LinguaChat Local" product —
a bare Practice Room chatting at raw B1/mode labels, "Lingo" left unmentioned, no
Lingua/Chatto distinction, mock-flow lists that predate the frozen Hoy · Chats ·
Palabras · Tú navigation, and no honest statement of what A1/Pre-A1 actually cover
today. It also linked to `linguachat-frontend-old/` (a 740 KB legacy Create React
App tree) and two empty root files, `pacientes.txt`/`procedimientos.txt`, as if they
were live parts of the architecture.

Per this task's `done` criteria, unused status was proven before deleting anything:
`git log --all --oneline -- linguachat-frontend-old/ pacientes.txt procedimientos.txt`
shows exactly one commit for all three (the original `536dd62` "add guided
LinguaChat learning experience" import) and a repo-wide grep found no reference to
any of the three paths anywhere in `.github/`, source, configs or docs except
`README.md`'s own description and `.ai/TASKS.md`'s own task text. No build tool,
CI workflow or `package.json` referenced `linguachat-frontend-old/`. All three were
therefore removed outright, not merely marked deprecated.

`README.md` was rewritten to state, accurately and checkably against the live
tree: Lingua is the sole tutor, Chatto is mascot-only; the frozen navigation; Pre-A1
frozen/available vs. A1 partial/`available:false` with named arcs 6–7 still
designed-only; one canonical `user_language` with the eight actually-implemented
auxiliary locales and Arabic RTL; an explicit "what is real today" / "what is
intentionally not implemented" pair (no cloud persistence, no Supabase, no voice/
STT/TTS/WebRTC/calls, no real paid-provider calls, no A2+ runtime curriculum); real
`npm ci`/`npm run dev`/`check:all`/`check:i18n` and backend `pip install -r
requirements.txt`/`compileall`/`pytest -q` commands verified against the actual
`package.json` scripts and `requirements.txt` in this tree, not assumed. No
runtime frontend/backend behavior was touched by this task.

## A resumed branch, and a real merge conflict-in-spirit this run had to resolve

PR #34 / `docs/lc-doc-001-readme-cleanup` already had real completed work sitting
in draft from prior runs (the README rewrite and debris removal were done; final
bookkeeping had already moved `LC-DOC-001` to DONE in a local copy of
`.ai/TASKS.md`/`.ai/STATE.md`/`.ai/HANDOFF.md`). This run resumed that branch
rather than duplicating it, per the standing instruction to check for existing
branch/PR work before re-claiming a task.

Between that draft's last sync and this run, an entirely separate, large
**Curriculum Foundry** pipeline was merged to `main` (`.ai/foundry/`,
`docs/curriculum/curriculum-master-a1-c2.md`,
`docs/curriculum/level-blueprint-template.md`,
`docs/research/supervisor-evidence-contract.md`,
`docs/research/supervisor-evidence-ledger.md`, plus
`.github/scripts/check-foundry-scope.mjs` and `.github/workflows/claude-task.yml`
changes) — a second, scope-isolated task graph specifically for A1–C2 curriculum/
research work, coordinated through `.ai/foundry/tasks.json` rather than
`.ai/TASKS.md`. `git merge origin/main` picked all of this up with no textual
conflicts (the two branches never touched the same lines), but the draft's own
final-bookkeeping commit had already decided to seed a new serial task,
`LC-CURR-006`, for A1 arc 6 in `.ai/TASKS.md`.

That decision predates the Foundry merge and is now wrong: `.ai/foundry/tasks.json`
already declares `LC-CONT-A1` ("Implement and prove A1 curriculum"), which is
intended to cover the remaining A1 arcs once its dependency chain
(`LC-FND-002` → `LC-AUD-001` → six level blueprints → the 100+100-primary-study
supervisor evidence-ready gate, `LC-SUP-001`) clears. Seeding a competing serial
`LC-CURR-006` would either duplicate that eventual work or land inside a write
scope (`linguachat-frontend/src/learning/levels/a1/**`) the Foundry's own
`check-foundry-scope.mjs` gate is designed to protect before it formally exists.
This run therefore **reverted that part of the draft's bookkeeping**: the TODO
queue is left open rather than seeded with `LC-CURR-006`, and `.ai/STATE.md` now
documents the Foundry discovery and this reasoning so a future operator does not
recreate the same conflict. Nothing about the README rewrite or the debris removal
needed to change — those were unaffected by the Foundry merge.

## Automation lane status

A prior run recorded that a controlled re-dispatch of `LC-DOC-001` reached
autonomous run `32474896010` and failed immediately at turn 1 with `is_error:true`,
zero permission denials and no pushed work — an external Claude Code/OAuth
failure, not a LinguaChat defect. `main` subsequently merged PR #41
(`ops/claude-action-turn1-diagnostic`), PR #42
(`ops/claude-safe-error-surface`, "surface sanitized Claude startup errors") and
PR #43 (`ops/wake-lc-doc-001-sanitized`, "wake chain for one sanitized LC-DOC-001
diagnostic") to investigate and address that failure class.

This run **is** the evidence those fixes worked: it is itself an autonomous
`claude-action` dispatch for exactly `LC-DOC-001`, and it authenticated, read the
full coordination stack, resumed the existing branch/PR and pushed real work
without hitting that failure. Treat the autonomous task lane as healthy again.
Do not re-apply the old "do not repeatedly rerun" caution without a new failure to
justify it.

## QA — what was actually run on the final head

This task changed documentation and removed dead files only; no runtime/UI/backend
behavior changed, so per the QA table in `CLAUDE.md` no browser walkthrough
applies — build/`check:all`/`compileall`/`pytest` proof is what's required. Exact
counts and two-consecutive-clean-cycle confirmation are recorded in `## Evidence`
on PR #34 and in `.ai/TASKS.md`'s `LC-DOC-001` DONE entry.

## Next product handoff

The serial `.ai/TASKS.md` queue is open. Do not seed a new `LC-CURR-006`/
`LC-CURR-007` for A1 arcs 6–7 — read `.ai/foundry/README.md` and
`.ai/foundry/tasks.json` first; that work is now scoped to the Foundry's
`LC-CONT-A1` lane, which is not yet unblocked (it waits on `LC-FND-002`, itself
waiting on `LC-AUD-001` and the supervisor evidence-ready gates). `LC-CLOUD-001`
and `LC-PED-002` remain BLOCKED for the reasons already recorded in
`.ai/TASKS.md`. If the next operator believes arc 6/7 genuinely needs to move
outside the Foundry timeline, that is an owner-level product decision, not
something to resolve by quietly reintroducing a competing serial task.
