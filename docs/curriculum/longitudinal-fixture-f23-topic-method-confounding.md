# F23 — Topic familiarity must not be mistaken for instructional effectiveness

**Status:** design-only longitudinal acceptance fixture; **UNSUPPORTED** until a provenance-aware policy and deterministic tests implement the assertions. This is not a confirmed production defect, not a learner study and not evidence of improved learning. Pre-A1 stays frozen; A1–C2 remain unavailable.

**Owner contract:** `docs/curriculum/longitudinal-instructional-adaptation.md`, especially sections 1–7. Topic personalization is a *soft context layer*; instructional adaptation is a separate, revisable hypothesis about future unaided learning. Neither may alter a required CEFR objective, evidence standard, mastery threshold or review obligation.

## Controlled factorial setup

Use one fixed `goal-1` can-do and versioned rubric. Two eligible teaching choices are `concise_explanation` and `worked_example` (only if both are actually supported by the product); two semantically valid context families are `music` (familiar to the learner) and `market` (less familiar). Hold instructional duration, target vocabulary burden, item difficulty, feedback exposure, number of attempts, due-review interval, reward and evaluator constant. Verify semantic-slot validity; otherwise replace with two valid contexts and record the substitution.

Create an event ledger with unique IDs, real timestamps, session/learning-day IDs, objective version, instructional option, topic/context family, whether a hint or model was shown, first-attempt quality, independent/assisted/retried flags, and the *specific prior instruction* that each later probe is eligible to evaluate. Missing attribution must remain unknown. Use the same recorded evidence and seed to reproduce decisions.

Counterbalance instructional option × topic over multiple distinct days, with order alternated. Each teaching exposure is followed by a meaningful delayed **independent** probe, not a same-session repeat or a next-day-boundary artifact. Add unseen, neutral-context transfer probes. Never credit an assisted response as independent, and never treat a topic preference click as learning evidence.

### Histories to compare

- **A — Familiar-topic advantage only:** both instructional options produce equivalent later independent retention and neutral transfer when compared *within the same context*. Immediate first attempts look better on `music` than `market` under **both** methods. Delayed performance has no supported method effect.
- **B — Genuine method effect:** after balancing topic, `worked_example` repeatedly improves delayed unaided retrieval and unseen-context transfer over `concise_explanation`. The effect appears in both topic families across distinct sessions.
- **C — Reversal:** begin with B's credible evidence, then append multiple later independent probes in which `concise_explanation` performs better across topics. Confidence and subsequent selection must be revisable.
- **D — Missing/corrupted provenance:** remove topic labels or prior-instruction links from some observations, add duplicate event IDs, and include an assisted success. Unknown evidence must not be silently assigned to the favored method.
- **E — Interest shift only:** keep A's instructional outcome ledger unchanged while adding credible voluntary engagements with `market` on separate days. The topic distribution may shift, but the instructional estimate and CEFR mastery decision must not.

## Acceptance assertions

1. **No confounded promotion.** In A, a method that happened to be used more often with `music` must not be declared superior solely because familiar-topic immediate answers were stronger. When method and topic cannot be separated, report uncertainty and use the balanced default or labeled exploration.
2. **Evidence-sensitive adaptation.** In B, sufficient independent, delayed, cross-context evidence can favor `worked_example` for `goal-1`, with an honest reason and confidence. A deterministic evaluation should show decisions diverging from A, without asserting a universal threshold or percentage.
3. **Reversal and exploration.** C can reverse the provisional ranking as new evidence arrives. Suitable alternatives remain reachable; the policy never assigns a permanent learning-style type.
4. **Provenance and independence.** D does not invent attribution, transfer, delayed retention or independent mastery. Deduplicate by stable event ID; do not count multiple same-session probes as independent longitudinal occasions.
5. **Orthogonal soft interests.** In E, `market` becomes more probable if supported by engagement, but familiar, adjacent, neutral and unfamiliar topics remain reachable. Topic evidence never changes method-effect estimates, objective eligibility, evaluator, due reviews or level exit.
6. **Equivalent assessment.** For every condition, the same objective, rubric, language demand and skill-family coverage are required. An easier favorite-topic task is not an acceptable substitute for an independent transfer test.
7. **Determinism and observability.** For each decision, record code HEAD, policy version, seed, eligible methods, context source, usable/missing observations, distinct delayed occasions, outcome estimate and whether the choice was exploitation, exploration or fallback. No raw learner conversation text is needed in logs.

## Evidence gate

Publish the exact source HEAD, deterministic fixture command, event ledger, candidate and topic counts, delayed-probe intervals, method-by-topic results, independent transfer outcomes, uncertainty, and PASS/FAIL/UNSUPPORTED per assertion. A passing simulated fixture proves only the specified software behavior. Any claim that instruction *improves* durable learning requires later independent learner outcomes against a balanced baseline, including unseen-context transfer and skill-balance safeguards.

**Current boundary:** the integrated topic selector accepts explicit interests and context rotation but not longitudinal demonstrated-interest weights at the previously inspected HEAD; this fixture does not imply that missing behavior is shipped. Shared engine, Auth, cloud, Supabase, infrastructure, production, paid models and automatic merge are out of scope. Curriculum workers author acceptance evidence only; integration/watchdog aggregates owner actions.
