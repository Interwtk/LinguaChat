# F24 — Adaptive selection bias must not become proof of a superior teaching method

**Status:** design-only curricular acceptance fixture; **UNSUPPORTED** until implemented against a named engine HEAD with deterministic tests. This document does not report a reproduced product defect, a learner experiment, or improved learning. Pre-A1 remains frozen; A1–C2 remain unavailable.

**Contract:** `docs/curriculum/longitudinal-instructional-adaptation.md`. F23 isolates *topic familiarity* from instructional-method effects; F24 isolates *policy selection and exposure bias* from those effects. The tutor may adapt and explore, but cannot treat the performance of a self-selected subset of exercises as an unbiased comparison between teaching methods.

## Controlled setup

Resolve `goal-1` to one existing, versioned CEFR can-do. Use two actually supported teaching options `concise_explanation` (A) and `worked_example` (B), or record a valid substitution. Hold evaluator, target demand, difficulty, assistance rules, due-review obligations, skill-family coverage, assessment context and delayed-probe policy constant. Use multiple real sessions, distinct learning days and meaningful delayed independent probes in both familiar and unseen neutral contexts.

Record a minimal event ledger with stable event/run IDs, learner/objective version, eligible candidate set, policy version, seed, assigned option, **assignment mechanism** (balanced exploration / policy exploitation / fallback), logged selection probability when available, observed context and difficulty, instruction exposure, assistance, timestamps, later independent probe linkage, outcome and missingness reason. Never invent a probability, a causal counterfactual or an unobserved outcome. No raw chat text is needed.

### Histories

- **A — Selection bias only.** The policy sends B disproportionately to learners/occasions with easier prerequisites and A to difficult occasions. Naive pooled delayed independent success is higher for B, but within matched readiness/difficulty/context strata there is no supported B advantage. Both options must have genuinely observed delayed outcomes in comparable strata.
- **B — Identifiable option effect.** Balanced, logged exploration supplies repeated, comparable A and B exposures across distinct sessions. After controlling for recorded context, readiness, difficulty and due-review timing, later independent retrieval and unseen-context transfer favor B consistently. Compare against a fixed balanced baseline, without prescribing a universal minimum sample.
- **C — No overlap.** B was only assigned to high-readiness learners and A only to low-readiness learners; no comparable alternative exposure exists. Logged probabilities are 0 or missing for one option in relevant strata. Do not extrapolate a causal ranking or invent counterfactuals.
- **D — Selective missingness.** Keep assigned options and difficulty matched but drop delayed probes more often after difficult B exposures. Immediate assisted answers remain available. Missing delayed results must not be silently scored as successes, failures, or independent evidence; report coverage and uncertainty by option.
- **E — Policy change and reversal.** Begin with legitimate balanced evidence favoring B, then switch the assignment policy to exploit B more heavily while new balanced exploration occasions favor A. The hypothesis must remain revisable; exploitation-only volume must not overwhelm stronger recent comparable evidence.
- **F — Soft interests orthogonal.** Change demonstrated topic interests while keeping assignment mechanisms and instructional outcome ledger fixed. Context sampling can shift without changing method-effect estimates or the CEFR mastery gate; unfamiliar and neutral contexts remain reachable.

## Acceptance assertions

1. **No self-fulfilling promotion.** A must not declare B pedagogically superior from pooled outcome differences caused by who/when received B. Report confounding and fall back to balanced teaching or explicitly labeled exploration if the comparison is unsupported.
2. **Evidence-based divergence.** B may support a provisional B preference only after documented comparable, delayed, independent evidence and appropriate uncertainty accounting; log whether the decision is exploitation, exploration or fallback. A passing synthetic fixture is not a human-learning efficacy claim.
3. **Overlap is a gate.** C remains **insufficient evidence**, even if pooled accuracy strongly favors one option. Never divide by a zero selection probability or fabricate propensity values.
4. **Missingness is visible.** D reports assignment counts, independently assessed counts, delayed-probe coverage and missingness by option and relevant stratum. Assisted or immediate responses cannot fill missing delayed independent outcomes.
5. **Reversibility and alternative access.** E responds to later comparable evidence; exploration stays nonzero for eligible methods, and no permanent learner-type label is assigned. Policy changes must be versioned and distinguishable from changes in learner ability.
6. **Interest and CEFR separation.** F changes only soft topic probabilities; it does not modify the objective, rubric, eligibility, mastery threshold, due reviews or evidence classification. Preserve skill-family balance.
7. **Deterministic audit.** With identical ledger, clock, candidate set, policy version and seed, repeated runs yield identical selection and evidence classifications. Log usable and rejected comparisons, not invented counterfactual outcomes.

## Evidence and release gate

For each condition publish the exact tested HEAD, executable command, policy version, seed, source fixture, option-by-stratum assignments, independent delayed outcomes, unseen-context transfer, missingness/overlap diagnostics, uncertainty and PASS/FAIL/UNSUPPORTED for each assertion. If the engine lacks assignment-mechanism or comparable-exposure provenance, mark causal method ranking **UNSUPPORTED**; this does not prevent honest exploratory teaching.

Even a deterministic PASS establishes only software acceptance behavior. A claim that adaptive teaching improves durable learning requires a separately reviewed longitudinal learner evaluation against a balanced baseline with delayed independent retrieval, unseen-context transfer and protected CEFR/skill coverage.

**Boundary:** curriculum documentation/acceptance only. No engine, Auth, cloud, Supabase, infrastructure, production, paid-provider or merge changes. Integration/watchdog remains the sole owner-action aggregator.
