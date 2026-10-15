# Longitudinal instructional adaptation — deterministic fixture pack (design-only)

**Status:** acceptance fixtures, not an implementation or proof of improved learning.
**Companion contract:** `docs/curriculum/longitudinal-instructional-adaptation.md`.
**Scope:** A1–C2 design and cross-level engine expectations only. Pre-A1 is frozen; A1–C2 stay unavailable. Do not alter CEFR goals, mastery/evidence gates, Auth, cloud, persistence, infrastructure or production.

## Harness contract

- Resolve every `goal-1` placeholder to **one existing, versioned CEFR can-do** in a level fixture. Do not invent a released objective or lower its evaluator standard.
- Fix the random seed and injected clock. Use stable `eventId`, `runId`, `sessionId`, `goalId`, `instructionOption`, `contextFamily`, `firstAttempt`, `helpUsed`, `independent`, `transfer` and `observedAt`. Distinguish missing fields from false values.
- Keep topic/context selection separate from instructional-option selection. Both must leave the objective, evaluator, reward and graduation threshold unchanged.
- Test a learner's *later independent* retrieval/transfer, not the fraction of immediately correct responses after hints.
- Assertions below are **normative future acceptance requirements**. Do not mark a fixture passing without executing the actual implementation at an identified commit SHA. Where an interval, minimum evidence count or exploration budget is not yet specified, require a documented policy parameter rather than silently inventing a universal threshold.

## F01 — opposite instructional outcomes for the same objective

Use the same `goal-1`, assessment rubric and two available instructional options `concise` and `worked-example`. For learner A, seed repeated first attempts and delayed **independent transfer probes** favoring `concise`; for learner B, reverse those later independent outcomes while keeping overall task difficulty and context distribution matched. Each learner must have more than one observation per option and at least one genuinely unseen transfer context.

**Expected:** after the policy's declared evidence threshold, the two learners may receive different next instructional options for the same goal. Log the options considered and uncertainty. If evidence is insufficient, both fall back to balanced sampling. A difference in onboarding interest alone must not cause this instructional divergence.

## F02 — a learned hypothesis must be reversible

For one learner, provide an early sequence favoring `concise`, followed by repeated independent delayed outcomes favoring `worked-example`. Include one contradictory outlier in each phase.

**Expected:** confidence and selection probabilities respond to the later evidence; no permanent learner-type label, no one-shot hard switch on an outlier, and continued nonzero exploration of eligible alternatives.

## F03 — help cannot masquerade as mastery

At `2026-10-12T10:00:00Z`, first attempt is incorrect; the learner opens a hint and copies the model correctly. At `2026-10-13T10:00:00Z`, they independently produce a new answer to an equivalent prompt. Both events have distinct IDs.

**Expected:** the first is assisted repair; only the second supplies independent evidence. Neither the hint nor a repeated modeled sentence is counted as an independent first attempt or transfer. Do not infer a durable-retention gain from these two events alone.

## F04 — delayed retrieval requires a meaningful interval and provenance

Case A: independent practice `2026-10-12T23:59:59.999Z`; follow-up `2026-10-13T00:00:00.001Z` (2 ms later) with a different calendar-derived session ID. Case B: two **actual** learning sessions on `2026-10-12`, six hours apart, each with distinct session IDs and an independent answer. Case C: earlier attempt has no reliable session or timestamp.

**Expected:** A is never credited as delayed retrieval merely because the date changed. B is evaluated against an explicit pedagogical interval policy, not automatically rejected because the date did not change. C stays unverified; missing provenance is not filled in. Retention metrics must expose the interval definition.

## F05 — three concurrent independent signals

Three stale snapshots from the same baseline record distinct `free_reply` events `e-A`, `e-B`, `e-C`, one each, and save in A→B→C and C→B→A order.

**Expected:** the merged event set contains all three unique IDs and any derived event counts equal three, never one or six. A repeated save with the same ID is idempotent. If the current storage format cannot derive trustworthy counts from event IDs, mark the fixture **unsupported** rather than asserting the counters are correct.

## F06 — stale episode run must not erase completion evidence

A completed run `run-1` contains `completedAt`, `independentEvidence=true`, two formats, two assistance events, one retry, and a consumed pending-retrieval record. A stale snapshot of `run-1` has no completion and older empty evidence. Merge in both orders.

**Expected:** completed-run evidence and consumed retrieval state survive both orders. The same run is never double-rewarded. Any field that cannot be safely reconciled must be explicitly marked unresolved, not silently overwritten.

## F07 — bounded history uses actual chronology

Two snapshots each hold 12 runs with overlapping IDs; their union is 14 distinct runs, timestamped in increasing order `run-01` to `run-14`. Save in both orders with a retention limit of 12.

**Expected:** retain `run-03` through `run-14` in chronological order, independent of merge order. Equal timestamps need a stable deterministic tie-breaker; invalid/missing timestamps need a documented conservative fallback.

## F08 — do not claim cross-context transfer from repetition

Two successful attempts to the same `goal-1` happen in the same session and `cafe` context, one assisted and one independent. A later independent probe uses `clinic`.

**Expected:** the first two do not count as evidence of transfer to a new context. If the goal's **existing** mastery rule requires multiple contexts, the rule must be enforced; if it does not, keep its current status semantics but never claim demonstrated transfer before the `clinic` probe.

## F09 — interests are probabilities, not gates

Two learners have opposite onboarding interests, `music` and `games`, and identical `goal-1` evidence. Run deterministic seeds over a declared, sufficiently broad window of sessions. Make related, neutral, adjacent and unfamiliar context families available and valid.

**Expected:** interest-related examples become more likely but are not exclusive. Every permitted context family has a reachable selection path; the required goal is never skipped; the objective and evaluator are invariant. Report observed rotation over the window, not an asserted universally optimal fixed percentage.

## F10 — modality availability and balanced skill coverage

Offer listening, reading, writing, speaking and free production in the specification, but mark audio capture/playback unavailable in the runtime fixture. Seed a history with strong recognition and weak independent production.

**Expected:** never record phantom listening/speaking successes. Prefer feasible productive practice where required; retain a plan for unmet modalities and do not claim complete CEFR coverage or graduation through unavailable assessments.

## F11 — missing latency and sparse data

Seed valid independent answers without timing measurements; then one unusually long observed latency in a different network condition. No repeated delayed probes yet exist.

**Expected:** unknown latency is not treated as slow performance or a failure. A single latency outlier cannot establish an instructional preference or lower mastery. Fall back to a balanced policy with explicitly low confidence.

## F12 — persistence and graduation invariants

A newer snapshot records a legitimate, dated level milestone; an older snapshot saves afterward. Also simulate migration of an old model that contains completed episodes but no legitimate milestone.

**Expected:** the saved milestone and the caller's in-memory milestone agree after merge; the stale snapshot cannot remove a real milestone. Migration alone cannot invent graduation. No A1–C2 milestone is issued while those levels are unavailable.

## F13 — concurrent can-do successes must not silently disappear

From the same initial learner snapshot, component A records a successful **independent** attempt for existing versioned `goal-1` in `cafe` at `2026-10-12T10:00:00Z` (event `can-A`, session `sA`). Component B independently records a successful **independent** attempt for the same goal in `clinic` at `2026-10-13T10:00:00Z` (event `can-B`, session `sB`). Neither component has observed the other's attempt. Save A→B and B→A, reload, and repeat the last save. Record the union of proven events separately from any derived mastery status.

**Expected:** both distinct independent events and their two context families remain attributable after either save order; neither can silently overwrite the other or be counted twice. If the current model stores only aggregate counters and cannot prove the union, mark the fixture **UNSUPPORTED / evidence conflict** and do not fabricate mastery. Once event-level provenance exists, derived independent-success and context counts must be order-invariant. Do not automatically promote to `can_do` unless the existing goal-specific mastery rule and evidence gate are met. This is different from F05 (activity-format signals) and F08 (same-session repetition): it protects concurrent evidence for the **same can-do objective**.

## F14 — bounded history must not silently erase transfer evidence

Use the original `teachingEstimates()` implementation on a fixed existing can-do and two instructional choices. Seed 79 chronologically distinct, independent and unassisted observations with stable IDs, actual sessions and verified contexts, including independent probes in previously unseen contexts. Add the 80th valid observation, preserving the same underlying transfer events; then add an 81st to exercise the bounded-window rollover. Compare estimates at 79, 80 and 81 events, with an injected clock and stable deterministic inputs.

**Reproduced at integration HEAD `09879ee4037841ee61187200db97b1f0b7fdf66f`:** `teachingEstimates()` calculates `transfer` using `history.length < 80 && ...`. With 79 distinct events, the worked-example candidate reported 12 positive transfer observations; with 80, it reported 0 despite preserving those same events. This is an estimate/reporting discontinuity, not evidence that learning or transfer disappeared. Reproduction evaluated the original fetched module with its import/export syntax adapted for an isolated JS harness; no browser E2E or longitudinal learner trial was performed.

**Expected:** a bounded history may limit certainty about *lifetime* context novelty, but reaching a storage cap must not silently reclassify already verified transfer evidence as zero failures/successes. Keep independently verified transfer evidence attributable across the boundary; when novelty cannot be proven after truncation, expose **unknown/unverified**, not a fabricated zero. Never claim novel transfer from a context merely absent from the retained window. Preserve deduplication, chronology, shared CEFR standards and alternative sampling. Add an executable 79→80→81 regression before claiming this fixture PASS.

## Release evidence gate

For each implemented fixture, record: code commit SHA, test command, deterministic seed, observed output, expected output, PASS/FAIL/UNSUPPORTED, and whether the test is unit, integration or end-to-end. A passing fixture only proves its local invariant. The adaptive-tutor claim additionally requires longitudinal comparison against a balanced baseline on **later independent retrieval and unseen-context transfer**, skill-family coverage, uncertainty calibration, and a separately reviewed learner pilot. No claim of proven improvement follows from adaptive scaffolding or topic sampling alone.
