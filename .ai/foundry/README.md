# Curriculum Foundry — autonomous parallel pipeline

This directory is the machine-readable coordination layer for A1→C2 curriculum work.

## Why this exists

The original `.ai/TASKS.md` queue is intentionally serial: one writer owns one task and one branch at a time. That remains the correct contract for shared product work. Curriculum expansion is different: research and level-specific authoring can run safely in parallel **only** when writers are isolated by write scope and shared-core changes stay serialized.

The Foundry therefore does not replace the normal queue. It adds a second, scope-isolated pipeline for curriculum/research work.

## Invariants

1. `tasks.json` is the immutable task graph. Dependencies are satisfied only by completion markers merged to `main`.
2. Every task has one lane, one exact branch, explicit dependencies, and explicit write scopes.
3. A lane has at most one active worker. Different lanes may run concurrently.
4. Foundry workers never edit `.ai/TASKS.md`, `.ai/STATE.md`, or `.ai/HANDOFF.md`.
5. A ready PR must:
   - stay inside its write scope;
   - contain `## Evidence` with measured QA;
   - add `.ai/foundry/completed/<TASK>.json`;
   - declare `cleanCycles >= 2`;
   - pass the normal frontend/backend/guard QA on the final head.
6. Tasks marked `requiresEvidenceReady` cannot complete until the supervisor evidence gate proves **>=100 unique verified primary empirical studies in pedagogy and >=100 in learning psychology**, after deduplication and topic-distribution checks.
7. Reviews and meta-analyses guide discovery but do not automatically count as their included primary studies.
8. The orchestrator automatically merges only ready, green, scope-valid Foundry PRs. Red/conflicted work is returned to draft and resumed on the same branch.
9. Speed comes from independent lanes. Shared learning-engine, registry, i18n architecture, integration and release-hardening remain serialized.
10. A1 remains fail-closed until its existing final acceptance gate is satisfied. Foundry completion does not silently open a level.

## Recovery

`Curriculum Foundry — orchestrator` runs on main pushes, completed QA runs, merged PRs, a 20-minute watchdog schedule, and manual dispatch. It:
- merges every ready/green Foundry PR that passes the scope/completion/evidence gates;
- refreshes main completion markers;
- selects at most one ready task per lane;
- avoids duplicate active runs by checking the worker run-name;
- resumes existing draft branches rather than restarting work.

A worker that dies before pushing is simply dispatched again. A worker that pushed a branch but no PR gets an automatic recovery draft.

## Research corpus

Primary-study records live in:
- `docs/research/supervisors/pedagogical-primary.json`
- `docs/research/supervisors/psychology-primary.json`

The deterministic gate is `.github/scripts/check-supervisor-evidence.mjs`.

This gate establishes that the supervisors are grounded in a sufficiently large, verified empirical corpus. It does **not** claim that software can prove universal human learning efficacy; later real-learner pilot evidence is still required for efficacy claims.
