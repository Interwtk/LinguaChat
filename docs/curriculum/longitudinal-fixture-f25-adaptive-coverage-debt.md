# F25 — Adaptive ease bias must not erase required language-skill coverage

**Status:** design-only curricular acceptance fixture; **UNSUPPORTED** until implemented and run against a named engine HEAD. This is not a reproduced product defect, not evidence of a shipped feature, and not proof of better learner retention. Pre-A1 is frozen; A1–C2 are unavailable.

**Contract:** `docs/curriculum/longitudinal-instructional-adaptation.md`. F23 isolates topic familiarity from instructional effects; F24 isolates policy-selection bias. F25 tests the **coverage constraint**: an adaptive tutor cannot optimize an easy short-term score by avoiding harder required skills, independent production, unfamiliar contexts, or overdue reviews. Exploration is allowed, but it must not replace required CEFR evidence.

## Controlled setup

Resolve one existing versioned CEFR can-do and its prerequisite graph, rubric, mandatory receptive/productive skill families, independent-evidence requirements and due-review obligations. Do not invent a new mastery threshold. For a concrete test, use only actual product-supported activities; if speaking or audio is unavailable, mark its coverage **UNAVAILABLE/UNSUPPORTED**, never passed. Keep learner/objective version, evaluator, difficulty bands, accessibility constraints and time budget fixed where comparison requires them.

Build an append-only event ledger with stable event/run IDs, session and learning-day IDs, objective and skill-family IDs, assigned activity/modality, candidate set, policy version/seed, topic family, difficulty, assistance/model exposure, first-attempt outcome, later independent retrieval/transfer, timestamps, due-review state, reason for skipped/deferred work, and missingness. Record availability separately from preference and from demonstrated competence. Deduplicate events, and distinguish independent delayed occasions from same-session repetitions. A topic click or assisted success cannot fill a skill-coverage requirement.

Use a deterministic balanced baseline and an adaptive policy on the **same eligible task universe**, with comparable learner histories. Track both achieved independent evidence and opportunities offered. Do not fabricate unobserved outcomes or causal comparisons.

## Histories

- **A — Easy-format trap.** The learner repeatedly succeeds immediately on supported multiple-choice/recognition items, but struggles with independent free production for the same objective. The adaptive policy predicts higher immediate accuracy for recognition. The tutor must still schedule required independent production, preserve its evidence gate and offer appropriate scaffold fading; it must not graduate from recognition alone.
- **B — Receptive/productive imbalance.** Reading/listening evidence accumulates while writing/free-production opportunities are repeatedly deferred. Some modalities may be unsupported. The scheduler must expose the coverage debt and allocate feasible practice/review to the neglected required supported families. Unsupported modalities remain explicitly unresolved, not simulated.
- **C — Due-review displacement.** An independently demonstrated can-do is due for delayed retrieval, while engaging favorite-topic practice has high expected immediate correctness. The due obligation cannot be silently displaced indefinitely by the favorite activity. If deferred for accessibility or availability, log the reason and retain the debt.
- **D — Genuine adaptive advantage under constraints.** Across distinct days, comparable delayed independent probes and unseen-context transfer favor a provisional explanation/scaffold/ordering choice. Adapt the method **within** the same required skill and mastery obligations. Continue suitable alternatives and balanced coverage; do not equate a higher prediction with evidence that graduation is earned.
- **E — Contradiction and recovery.** Early delayed evidence favors shorter recognition-heavy practice; later independent production and transfer deteriorate. The policy must revise its hypothesis, lower confidence as appropriate, restore neglected practice and preserve due reviews without a permanent learner-type label.
- **F — Interest and missingness pressure.** The learner strongly prefers one topic; unfamiliar contexts and difficult production probes are less frequently completed. The tutor can increase favorite-topic examples probabilistically, but must preserve neutral/adjacent/unfamiliar contexts, report probe coverage and missingness by skill/context, and refuse to treat missing independent outcomes as successes.

## Acceptance assertions

1. **Hard CEFR gate.** For every history, the objective, versioned rubric, required skill-family evidence, independent mastery standard and level-exit requirements remain identical to the balanced baseline. No favorite format or topic can bypass a required can-do.
2. **No score gaming.** In A, assisted or easy recognition accuracy may inform diagnosis, but cannot substitute for missing independent production or raise an unsupported mastery verdict. Record separate immediate, assisted, delayed and transfer outcomes.
3. **Coverage debt is explicit.** In B, report required/supported/unavailable skill families, independent evidence obtained, practice opportunities, deferrals and remaining debt. When a required modality is unavailable, report **UNSUPPORTED**, never complete coverage.
4. **Review obligations survive adaptation.** In C, a due review remains visible and schedulable despite preference/exploitation pressure; any deferral has a bounded, auditable rationale, without inventing a universal deadline.
5. **Constrained, reversible personalization.** D can provisionally prefer a better-supported teaching choice without dropping required skills, exploration or unseen-context transfer. E must respond to contradictory independent evidence, not merely count more easy repetitions.
6. **Interests are orthogonal.** F may alter soft context probabilities but not objective eligibility, skill coverage, evaluator, review debt, difficulty standard or mastery. Keep unfamiliar and neutral contexts reachable; no exclusive topic filter.
7. **Missing data stay missing.** Report delayed-probe assignment, completion and independent-result coverage by method, skill and context. No silent imputation from assisted correctness, topic engagement, retries or same-session repeats.
8. **Deterministic audit.** Identical ledger, clock, candidate set, policy version and seed reproduce the same choices, coverage debt and evidence classifications. Log reasons as exploration, exploitation or fallback, including rejected evidence.
9. **Safety fallback.** With insufficient, corrupted or incomparable longitudinal evidence, use the shared balanced curriculum and normal scaffolding. Never claim a superior teaching method or a completed CEFR requirement from missing provenance.

## Evidence and release gate

For A–F publish the **exact tested HEAD**, executable command, fixture input, policy version/seed, eligible supported modalities, per-skill offered/completed/independent counts, due-review ledger, context rotation, delayed intervals, unseen transfer, missingness, decisions and PASS/FAIL/UNSUPPORTED for each assertion. Include a balanced-baseline comparison on the same objectives and assessment demands; do not choose only the highest-scoring completed exercises.

A deterministic PASS establishes only software-contract behavior. Claiming that adaptive instruction **improves durable independent learning** additionally requires a separately reviewed longitudinal learner evaluation with delayed retrieval, unseen-context transfer, calibrated uncertainty and protected skill coverage. Do not claim the vision complete because adaptive scaffolding or scheduling exists.

**Boundary:** curricular documentation/acceptance only. No engine, Auth, cloud, Supabase, infrastructure, production, paid Claude, EvoLabs or auto-merge changes. Integration/watchdog is the sole owner-action aggregator.
