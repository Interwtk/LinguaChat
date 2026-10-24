# F30 — Assessment drift cannot masquerade as instructional-method improvement

**Status:** design-only curricular acceptance fixture; **UNSUPPORTED** until an executable check runs against a named engine HEAD. This is not a reproduced defect, implemented adaptive tutor capability, causal finding, or evidence of improved learning. Pre-A1 remains frozen; A1–C2 remain unavailable.

**Contract:** `docs/curriculum/longitudinal-instructional-adaptation.md`. F24 guards against selection bias, F25 against coverage debt, F28 against cross-skill extrapolation, and F29 against instructional carryover. F30 addresses a separate confounder: **assessment calibration drift**. When a rubric, evaluator, item difficulty, assistance policy, or scoring implementation changes between instructional options, a higher observed score may reflect a different measuring instrument rather than better durable learning.

## Controlled setup

Resolve `goal-1` to one versioned, required CEFR can-do, a supported skill, and genuinely independent evidence routes. Define two eligible teaching options, `concise_explanation` (A) and `worked_example` (B). Keep objective, prerequisite, modality availability, mastery thresholds, coverage debt, due-review obligations, and assessment intent fixed. Use neutral and unfamiliar contexts with matched language demands; interest selection remains a separate soft policy.

Inject a deterministic clock and seed. Maintain an append-only synthetic event ledger with learner/objective/skill, teaching exposure ID and completion, assignment eligibility/probability if actually logged, assessment event ID, attempt and session IDs, assessment instrument ID/version, item family and difficulty/calibration version, rubric/evaluator implementation version, scoring policy and score scale, assessor identity/type where available, context family, assistance and first-attempt provenance, independent versus assisted status, actual elapsed delay, unseen transfer, missingness/reason codes, and event occurrence versus upload time. Deduplicate stable IDs.

Define a *predeclared comparability policy*: only outcomes demonstrated comparable under a documented, versioned calibration or common-anchor procedure may contribute to a cross-method efficacy contrast. Otherwise preserve the raw observation and valid objective-specific evidence route, but classify the **method comparison** as `NOT_COMPARABLE` or `UNSUPPORTED`. Do not manufacture equivalence from a shared numeric score or retrospectively lower CEFR mastery gates.

## Synthetic histories

- **A — Easier post-change items.** A is followed by harder independent prompts under instrument v1; B by easier prompts under v2. B has a higher raw success rate without a common-anchor calibration. The policy must not call B the better teaching method merely from the raw difference.
- **B — Rubric leniency shift.** The same independent response is scored strictly under evaluator v1 and leniently under v2. A is concentrated before the evaluator change and B after. Preserve evaluator versions and mark method attribution confounded; do not reclassify v1 attempts as v2 passes without a validated, auditable re-score route.
- **C — Comparable anchored controls.** Both A and B have balanced exposure to a stable common-anchor independent probe, plus delayed retrieval and unseen-context transfer under a validated invariant rubric. These comparable observations may inform provisional, uncertainty-aware estimates while non-anchored observations remain separate.
- **D — False progress from changing assistance rules.** B sessions permit hints, model answers or retries before a scored response; A sessions record the unaided first attempt. Even with identical item IDs, assisted B success cannot be counted as equivalent independent retention or used to declare B superior.
- **E — Evaluator upgrade with disagreement.** A later scoring implementation changes semantic grading of an ambiguous free-production answer; a frozen anchor set reveals disagreement and incomplete calibration. The policy must retain both evaluator identities, quarantine the cross-version method comparison, and preserve the learner's observed response without silently rewriting prior mastery.
- **F — Missing metadata and offline replay.** An offline result lacks rubric version; another arrives twice; upload order reverses the actual assessment chronology. Unknown version is not inferred from upload time, duplicates do not multiply observations, and changing replay order cannot change the comparability decision.

## Acceptance assertions

1. **Instrument identity is mandatory for comparisons.** Each observation used to compare teaching options must carry its actual instrument/item calibration, rubric/evaluator version, independence and assistance provenance. Missing or unvalidated identity means `NOT_COMPARABLE`, not an assumed match.
2. **Raw score is not an invariant scale.** In A and B, higher post-change correctness cannot establish a method effect without a documented common-anchor or equivalent validated comparison. Report per-version counts and uncertainty.
3. **Comparable evidence stays usable.** In C, distinguish validated anchor observations from non-anchored outcomes, including per-option independent attempts, actual delays, unseen transfer, sample sizes and uncertainty. Do not assign invented causal weights.
4. **No assisted-score laundering.** In D, hints, models, retries and scaffold exposure remain visible; repaired or copied answers cannot replace independent first-attempt evidence or delayed unaided transfer.
5. **Evaluator changes are auditable.** In E, expose the frozen anchor-set results, version disagreement and calibration status. Never silently change historical evidence or lower existing CEFR can-do and mastery thresholds.
6. **Missingness and idempotency.** In F, unknown instrument metadata is neither a pass nor a failure for method efficacy. Deduplicate assessment IDs, use occurrence time rather than upload order, and ensure replay-order invariance.
7. **Objective and skill coverage remain fixed.** A method comparison cannot drop difficult independent production, overdue review, required CEFR objectives or unsupported modality debt. A favorable aggregate score cannot hide a harmed skill.
8. **Interest independence.** Changing topic-interest weights alone may change example sampling but must not alter assessment calibration, method-efficacy claims, required neutral/unfamiliar transfer or CEFR standards.
9. **Reversible uncertainty-aware decision.** When comparable delayed independent outcomes are insufficient, continue balanced eligible exploration with the shared curriculum. Later calibrated evidence can reverse a provisional method preference; never create a permanent learner-type label.

## Required evidence and release gate

For A–F report exact tested engine HEAD, executable command, seed and injected clock, policy version, objective/skill, synthetic ledger, teaching-option eligibility/assignment/completion, assessment item/rubric/evaluator versions, anchor calibration and disagreement, first-attempt and assistance provenance, actual delay, independent retrieval and unseen transfer, comparable versus excluded counts, missingness and reason codes, outstanding coverage/reviews, decision/confidence, and PASS/FAIL/UNSUPPORTED per assertion. Include at least one unchanged anchor instrument across A/B, an evaluator-upgrade disagreement case and an offline idempotent replay.

If the engine does not record assessment version/provenance or cannot validate cross-version comparability, report **UNSUPPORTED** rather than infer a teaching-method winner. A deterministic PASS would establish a software invariant only. Claims that adaptive instruction improves durable independent learning require separately reviewed longitudinal learner evidence versus a balanced baseline, equivalent assessment opportunity, calibrated uncertainty, independent delayed retrieval, unseen transfer, and unchanged CEFR coverage.

**Boundary:** curriculum acceptance documentation only. No engine, Auth, cloud, infrastructure, production, Supabase, paid Claude, EvoLabs or auto-merge changes. Integration/watchdog is the sole owner-action aggregator.
