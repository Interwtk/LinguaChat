# F33 — Item exposure must not masquerade as independent transfer

**Status:** design-only acceptance fixture; UNSUPPORTED until executable assertions run against an exact engine HEAD. Not a reproduced defect or evidence of improved learning. Pre-A1 frozen; A1–C2 unavailable.

**Contract:** `docs/curriculum/longitudinal-instructional-adaptation.md`. Correctly recalling a previously revealed answer is not proof of transfer to a novel context. Distinguish unaided response process from novelty of assessment content. Preserve the same CEFR objective, mastery thresholds, reviews and skill coverage across methods.

## Setup

For one versioned CEFR can-do and supported skill, compare eligible teaching options A (concise explanation) and B (worked example) using an append-only deterministic synthetic event ledger. Include stable learner, session, method, exposure, assessment item-family, attempt and event IDs; event and upload timestamps; item and rubric versions; answer/hint/transcript/feedback exposures; first attempts, assistance, actual delay, intervening practice and unknown provenance. Declare a versioned policy for EXACT_KNOWN, NEAR_DUPLICATE, ANSWER_EXPOSED, SCAFFOLDED, VERIFIED_UNSEEN and UNKNOWN. Do not invent universal similarity thresholds or assume absent logs prove novelty.

## Six histories

A. **Rehearsed answer:** B reveals the exact probe answer; a delayed unaided repeat is correct. Preserve the observation but do not count it as unseen transfer or B efficacy.

B. **Paraphrased repeat:** B reveals a dialogue; the probe changes names and word order but retains the answer pattern. Use evidence-backed item-family linkage; lexical mismatch is not sufficient for novelty.

C. **Answer-bearing assistance:** A transcript, hint or reminder reveals the listening-probe answer before submission. Correctness does not prove independent listening retrieval.

D. **Clean generalization:** Both methods receive comparable independently authored, calibrated unfamiliar probes, with first-attempt unaided responses and actual delayed intervals. These can inform a provisional uncertainty-aware comparison.

E. **Reversal:** Rehearsed early scores favor B; later comparable clean delayed probes favor A with contradictory observations. Revise hypotheses without fixed learning-style labels and continue alternatives.

F. **Offline replay:** An offline answer exposure is uploaded after the probe, alongside duplicate hint events and uncertain item-family links. Event-time ordering and stable-ID deduplication must yield the same classifications regardless of arrival order; uncertain links remain unknown.

## Nine acceptance assertions

1. Report exposure lineage and eligible, exposed, assessed, contaminated, unknown and verified-unseen denominators per method.
2. Exact-answer repetitions never satisfy unseen-transfer evidence gates, even if completed without live assistance.
3. Documented semantic near-duplicates are not new solely because strings differ; ordinary CEFR objective overlap is not automatically contamination.
4. Hints, feedback, transcripts and answer-bearing reminders remain attributable across sessions and modalities.
5. Retain valid calibrated, genuinely unfamiliar, first-attempt unaided delayed probes with actual delay, sample sizes and uncertainty.
6. Permit skill-specific hypothesis reversal from later clean evidence; continue balanced coverage and alternative sampling.
7. Deduplicate stable event IDs and use occurrence time, not upload time; quarantine unknown links; replay is idempotent.
8. Preserve CEFR mastery gates, overdue reviews, productive skills and neutral/adjacent/unfamiliar topic rotation independently of soft interest weighting.
9. If novelty or exposure lineage is unverified, classify transfer/method efficacy as UNSUPPORTED while preserving other valid evidence; never claim durable independent improvement from rehearsed correctness.

## Release evidence

For each history provide exact engine HEAD, executable command, seed/clock, policy version, synthetic ledger, objective and skill, assessment family/rubric, exposure and assistance provenance, delays, clean versus contaminated denominators, uncertainty, coverage debt, and PASS/FAIL/UNSUPPORTED per assertion. A deterministic PASS only establishes an invariant, not improved learner outcomes. Longitudinal improvement requires separately reviewed evidence against a balanced baseline with clean delayed retrieval, unseen transfer, comparable opportunities and unchanged CEFR standards.

**Boundary:** documentation only; no application, infrastructure or production changes. Integration/watchdog owns owner-action aggregation.
