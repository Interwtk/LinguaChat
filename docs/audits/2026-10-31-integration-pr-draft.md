# Borrador de PR — integración local P0–P5 (NO PUBLICADO)

> **Este archivo es un borrador.**
> - No se ha creado ningún PR, rama remota ni push.
> - Publicarlo requiere una autorización explícita del propietario.
> - Los pasos están en `2026-10-31-p6-github-integration-readiness.md` §14.
>
> Todo lo que hay debajo de la línea es el cuerpo propuesto, en inglés como el resto de PRs del repositorio.

**Title:** `Integrate local phases P0–P5: integrity, teaching intelligence, product hardening, tutor runtime and learner level (A1 stays closed)`

**Base:** `main` (`086323c41f5f93ff8af12ee70304c30b1633f2d0`)
**Head:** `integration/local-p0-p5` (8 commits; see below)
**Open as:** Draft

---

## Goal

Bring six phases of locally developed and locally verified work into the repository as one reviewable branch, without losing any change and without opening any level.

- The work was built in a local folder extracted from `main@086323c`, with no git checkout.
- The branch reproduces that folder **byte for byte**: 679 files, 0 differences by git blob hash.
- It keeps one commit per phase. Each commit is rebuilt from the backup taken at the end of that phase and verified against that phase's recorded diff.

## Commits

| # | Commit | Phase | Files |
|---|---|---|---|
| 1 | `ad8b061` | read-only audit of `main@086323c` (document only) | 1 |
| 2 | `60542ee` | **P0** initial integrity hardening | 22 |
| 3 | `acb0f06` | **P1** teaching intelligence | 36 |
| 4 | `8395e6f` | **P2** product hardening | 71 |
| 5 | `a9f5bac` | **P3** tutor and curriculum | 38 |
| 6 | `64f9b02` | **P4** persistence and A1 preparation (A1 closed) | 21 |
| 7 | `b9d3065` | **P5** local evaluator in `/chat`, individual learner level | 58 |
| 8 | *(docs)* | P6 integration-readiness reports (this PR's own evidence) | 3 |

Net against `main`: **71 files modified, 72 added, 0 deleted** (the 68 code and test files plus the 4 handoff deliverables), and 3 P6 reports.

## Summary by phase

Each phase has its own report under `docs/audits/2026-10-31-*.md`, with its own diff.

- **P0 — integrity.** Fail-closed fixes found by the audit: progress, lease and episode-state hardening. The phase was verified with two clean cycles.
- **P1 — teaching intelligence.**
  - retention-based teaching choice (`teachingPolicy`);
  - assisted/independent evidence;
  - cross-day difficulty memory;
  - uncertainty reporting.
- **P2 — product hardening.**
  - i18n split for the bundle;
  - portable `check:all` on Windows;
  - cloud-scope checker hardening;
  - development-only visual bench, kept out of the production bundle;
  - workflow scripts.
- **P3 — tutor and curriculum.** Grammar-check and tutor explanations in 8 languages; curriculum authoring checks. A1–C2 stay closed.
- **P4 — persistence and A1 preparation.**
  - event-based progress ledger with account isolation and duplicate-reward prevention;
  - evaluator contract `lingua-evaluator/1`;
  - `prepared/a1Readiness.js`, which is isolated, not imported by `src/`, and has no invented thresholds;
  - pilot protocol, a document only.
- **P5 — tutor runtime and learner level.**
  - the local reference evaluator is wired into `/chat` through the versioned `chat-evaluation/1` layer: one evaluation per message, the legacy `analysis` is unchanged, and the evaluator can only *lower* evidence (copied or assisted);
  - noun-subject agreement detection and non-English detection;
  - per-skill teaching adaptation with shrinkage;
  - derived individual learner level, which opens nothing;
  - recovery of stranded >30-day progress events;
  - a save-failure notice with retry.

## Important changes for reviewers

- `linguachat-frontend/src/context/AppContext.jsx`, `services/localProgress.js`, `services/progressLedger.js`: the persistence path, with the ledger, saved stamps and retry.
- `linguachat-frontend/src/learning/engine/teachingPolicy.js`, `chatEvidence.js`, `learnerModel.js`: the adaptation and evidence rules.
- `linguachat-backend/ai/chat_evaluation.py` (new), `evaluator_adapters.py`, `local_engine.py`, `grammar_check.py`, `language_id.py` (new): the evaluator in `/chat`.
- `linguachat-frontend/src/learning/curriculum/learnerLevel.js` (new): the derived level.
- `.github/workflows/qa.yml` and `.github/scripts/check-linguachat-cloud-scope*.mjs` changed in P2. See the P2 report.
- `linguachat-frontend/package.json`: `check:all` now has 100 steps; no dependency changes, and `package-lock.json` is unchanged.

## Evidence

Every suite below ran on this exact branch in a **fresh clone** (`npm ci`, a new Python 3.12.14 venv from `requirements.txt`), twice in a row, with no change in between.

Results are counted by exit code:

| Suite | Cycle 1 | Cycle 2 |
|---|---|---|
| frontend `check:all` (by exit code) | 100/100 | 100/100 |
| `npm run build` | ok (entry 730.9 kB / 850) | ok (entry 730.9 kB / 850) |
| `npm run check:i18n` | ok | ok |
| Curriculum Foundry `b1`/`b2`/`c1`/`c2` and `a2-structure` | 5/5 | 5/5 |
| full ledger integrity / concurrency (`check-ledger-integrity`) | 29/29 + 1 NOT_TESTED ¹ | 29/29 + 1 NOT_TESTED ¹ |
| adaptation policy, old vs new (`check-adaptation-policy`) | 10/10 | 10/10 |
| cloud scope (self-test, tests, scan, git mode) | ok | ok |
| backend `compileall` | ok | ok |
| backend `pytest` | 1241 passed / 28 skipped | 1241 passed / 28 skipped |
| HTTP e2e against a real local uvicorn: tutor runtime / chat continuity | 4/4 · 5/5 | 4/4 · 5/5 |
| auth email templates | ok | ok |
| product guarantees (A1–C2 closed, Pre-A1 untouched, `CLOUD_PREFERENCES_RELEASED=false`, evaluator wired, bench outside the bundle, secrets, CRLF) | 16/16 | 16/16 |
| `qa.yml` `guards` job replayed locally | 8/8 | 8/8 |
| byte equality with the local source folder | EQUAL (679 / 0 differ) | EQUAL (679 / 0 differ) |
| `npm run check:github-integration` | **BLOCKED locally (no `jq`)**; runs in CI | BLOCKED |

¹ The scenario "migration from P3 code and rollback" needs `../_snapshot-p3` beside the project, so the script reports NOT_TESTED in a clone (and in CI) instead of passing it.
- Run with the P3 tree extracted from this branch's own history (`git archive a9f5bac`), the full suite gives **30/30**.
- On a local trial merge of this branch with #137: `check:all` 100/100, build and i18n ok, and #137's 13 structural checks pass.

**Functional proof per change kind** (from the phase reports, not re-run here):
- **Browser checks:** 390 / 768 / 1440 px, light and dark, en/es/ja/ar with RTL — the P5 report §E covers 96 combinations plus 48 notice combinations in 8 languages.
- **Backend and evaluator:** local versus backend verdicts compared on a golden replay of 189 cases and 192 responses.
- **Ledger integrity:** concurrency scenarios 30/30.

**Not tested:**
- real Supabase accounts and RLS, because no authorized test project exists;
- a Vercel Preview of this branch;
- `check:github-integration`, outside CI.

## Pending tests

- `check:github-integration`, which CI runs.
- A visual check of the Vercel Preview at 390 and 1440 px.
- Real-account auth / RLS / sync, which is BLOCKED until an authorized Supabase test project exists.
- Learner efficacy: needs a real pilot. Nothing here claims efficacy.

## Privacy

- **Data:** no real user data, no `.env`, no keys. The secret scan over every changed file found only policy mentions (`service_role`, `SUPABASE_SERVICE_ROLE`) in documentation and in the checker that blocks them.
- **Cloud scope:** `CLOUD_PREFERENCES_RELEASED=false` is unchanged; no new Supabase scope.
- **Evaluator:** it runs locally and makes no remote provider calls; `LINGUACHAT_PROVIDER=local` stays the default.
- **Commit author:** commits carry the author identity from the local git configuration. Check it before publishing, because this repository is public.

## Compatibility

- Stored progress from before these phases still loads: legacy formats are sanitized, not rejected, and ledger events are additive.
- `/chat` keeps its response format; the new `evaluation` field is additive.
- No dependency changes.
- The bench is development-only and excluded from the production bundle by `check-bundle-boundaries`.

## A1 status

**Closed.**
- `levels.js` is unchanged: Pre-A1 is the only level with `available: true`; A1–C2 stay `available: false`.
- `prepared/a1Readiness.js` is not imported by the app.
- The learner level is *derived* and cannot open a level: a placement result opens nothing.
- Pre-A1 content and the blueprints are untouched against `main`.

## Remaining risks

- `.ai/STATE.md`, `.ai/HANDOFF.md` and `.ai/TASKS.md` are stale against `main`: they still describe #123 as Draft and `LC-CLOUD-001` as IN_PROGRESS, though #123 merged on 2026-10-31. This PR does not edit them, because the coordination protocol decides that.
- Large audit artefacts: the `.diff` files under `docs/audits` add about 4.8 MB and 96k lines. The owner may prefer to drop them from the PR; they duplicate git history.
- Data-loss limits stated in the P5 report §F, for example a tab closed before any save.
- The teaching-estimate defects documented by #137 (F14, F15, F17, F18) are still present here and in `main`. See the conflict review.

## Relation to #137 and #135

See `docs/audits/2026-10-31-pr137-pr135-conflict-review.md`.

- **#137** adds 232 curriculum documents and fixtures (docs only). It **does not touch** any file of this PR: a local trial merge has no conflicts, and `check:all` passes on the merged tree. Integrate it after this one, in its own curriculum PR.
- **#135** is superseded by `main` (`2557e42`, `58a241b`, `50e26db`). It conflicts with `main` itself and its head references an out-of-scope variable. The owner decides whether to close it.

## Vercel Preview and CI

- **Pushing the branch** starts a Vercel **Preview** deployment of the head commit. Vercel has created a Preview for every pushed PR commit, for example `868e0c4` on #137; the Vercel project is linked through the GitHub integration.
  - That deployment runs `npm ci && npm run build` and the `api/index.py` function.
  - Production deploys only from `main`.
- **Pushing does not run GitHub Actions**: `qa.yml` listens to `push` only on `main`.
- **Opening the PR** runs `qa.yml`: the `frontend`, `backend` and `guards` jobs, and, when the PR is not Draft, `evidence` and `qa-cycle`.
  - `cloud-preferences-qa.yml` will **not** run: none of its trigger paths change in this branch.
  - `merge_handoff` runs only on a manual `workflow_dispatch`, and the `qa-merge-handoff.yml` workflow it dispatches does not exist on `main`.
  - **Nothing merges automatically.**
- **Cannot be verified from here** without touching Vercel:
  - whether Preview deployments are protected;
  - which environment variables Vercel Preview has;
  - if a key were present, `provider_policy` still requires an explicit mode.

## Rollback

- **Before merge:** close the PR and delete the branch; the Vercel Preview stays as a harmless deployment.
- **After merge:** `git revert -m 1 <merge-commit>`, or revert the phase commits newest first, then let Vercel redeploy `main`. You can also promote the previous production deployment in Vercel, which is an owner action.
- **Data:**
  - **Proven:** P3-era code reads progress written by the P4 ledger; the fields `w`, `seq` and `coverage` are ignored without error. `check-ledger-integrity` tests this against `_snapshot-p3`.
  - **Not proven:** that `main@086323c` code reads progress written by P4/P5 code. Add that regression test before merge if a full revert must stay data-safe.
  - Learner data lives in the browser (localStorage). A code revert does not delete it, but an older reader might ignore the newer fields.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
