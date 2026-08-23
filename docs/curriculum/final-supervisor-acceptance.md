# LC-SUP-002 — final evidence-grounded supervisor acceptance (A1-C2)

Status: **PASS_WITH_CONDITIONS** (see §7). This report is the release gate
required by `docs/research/supervisor-evidence-contract.md` §10: "no level can
receive final pedagogical acceptance from these supervisors until both
evidence ledgers are READY ... and the cross-level audit passes." Both
preconditions are verified below.

## What this proves, and what it explicitly does not

This report certifies that the integrated A1-C2 curriculum design (six
blueprints plus the shared runtime engine that now implements all of them) is
internally consistent, evidence-grounded against the two READY primary-study
corpora, and free of any *design-time* violation of CLAUDE.md's curriculum
quality rules.

It does **not**:

- open any level to a real learner. A1/A2/B1/B2/C1/C2 all remain
  `available: false` in `linguachat-frontend/src/learning/curriculum/levels.js`
  after this document lands, and this task's write scope does not include that
  file. A1's own separate completion gate (`LC-PED-002`, plus the dedicated A1
  availability-flip task referenced in `CLAUDE.md`) is untouched by this
  report.
- certify real-learner efficacy. Every verdict below is a design/evidence
  consistency check against the corpora in
  `docs/research/supervisors/{pedagogical,psychology}-primary.json`, not a
  human-pilot result. `docs/research/learning-science-foundation.md` and this
  report both say the same thing: a cited source supports a design principle,
  it does not prove LinguaChat itself works for a real learner.
- claim CEFR listening/speaking/pronunciation coverage. All six blueprints
  explicitly scope themselves to text/interactive-only capabilities and
  exclude voice, consistent with `CLAUDE.md`'s "voice and media are out of
  scope" boundary. This report re-verifies that exclusion is honestly kept
  (§4), not weakened.

## 1. Preconditions (contract §10)

| Precondition | Status | Evidence |
|---|---|---|
| Pedagogical evidence ledger READY (>=100 unique primary studies, topic distribution) | **READY** | `node .github/scripts/check-supervisor-evidence.mjs` — 120/100 unique primary studies, 14 topics |
| Learning-psychology evidence ledger READY (>=100 unique primary studies, topic distribution) | **READY** | same run — 127/100 unique primary studies, 14 topics |
| Cross-level audit (`LC-AUD-001`) passes | **PASS** (one item deliberately deferred to human judgment, not silently broken — see §5) | direct re-read of current `docs/curriculum/blueprints/*.json` against every finding in `docs/curriculum/cross-level-audit.md`/`.json`, below |
| `LC-INT-001` integration complete, curriculum reaches the shared runtime engine | **complete** | `.ai/foundry/completed/LC-INT-001.json`; runtime spot-check in §3 |
| A1 remains unavailable; A2-C2 remain unavailable; Pre-A1 remains frozen | **confirmed** | `levels.js:61,67,72,77,84,91,101` (`available: false` for A1-C2, `true` only for Pre-A1); `node scripts/check-pre-a1-freeze.mjs` — OK, 7 freeze groups |

The evidence gate READY output was re-measured on this branch's head, not
copied from `LC-SUP-001`'s report; see `## Evidence` in the PR description for
the exact command output.

## 2. Cross-cutting design claims reviewed against the evidence corpora

These six claims are structural to the shared engine
(`linguachat-frontend/src/learning/engine/scaffolding.js`,
`responseEvaluation.js`, `learnerModel.js`) and therefore apply identically to
all six levels, not to one level at a time. Per contract §5, each verdict
states the claim, the evidence IDs reviewed, grade/confidence, populations
represented, limitations, and — where blocking or conditional — the concrete
required change.

### GC1 — Evidence-tiered mastery: recognition/guided evidence alone never satisfies a required capability

- **Claim reviewed**: every level's blueprint (and `scaffolding.js`'s
  `evidenceKindForStep`/`isIndependentEvidence`, `responseEvaluation.js`'s
  `masteryEvidence: { independent, scaffoldUsed }`) treats
  recognition/multiple-choice and assisted/guided answers as insufficient for
  mastery; only `free_reply`/`roleplay`/`recall`/`mini_story`-style unaided
  production counts as independent evidence.
- **Evidence IDs**: PED-P03-004 (testing-effect benefit partially format-specific
  across training/test format — Grade B, 182 8th-grade EFL vocabulary
  learners); PSY-Y02-013 (recognition accuracy stayed near ceiling for ~35
  years while free recall declined much earlier — Grade B, but the population
  is episodic person-memory, not L2 production); PSY-Y01-014, PSY-Y03-022
  (feedback after multiple-choice testing improved a later cued-recall test —
  Grade A and B respectively).
- **Grade/confidence**: moderate. No record in either corpus directly tests
  "MC-trained recognition mastery vs. required free-production mastery" in an
  L2 setting; the supporting studies are the general testing-effect and
  recognition/recall-dissociation literature, applied by inference.
- **Populations**: student/undergraduate/secondary; general cognitive-science
  and L2-vocabulary populations, not a purpose-built L2 recognition-vs-
  production study.
- **Verdict**: **PASS_WITH_CONDITIONS**. The design choice (require
  independent production, never accept recognition alone) is evidence-
  consistent and the conservative, precaution-favoring reading of a real but
  indirect literature — it is not itself a fabricated certainty. Condition:
  neither this report nor any product copy may describe this design as
  "proven" that recognition cannot indicate mastery; it must be described as
  evidence-consistent and precaution-based, per contract §3's ban on
  overreach. Acceptance criterion: `check:hybrid-evaluation` and
  `check:repair-evaluation` continue to gate on independent evidence at every
  future PR, and no future PR is allowed to add a capability whose required
  evidence is recognition-only.

### GC2 — Spaced/delayed retrieval requirement in capstones

- **Claim reviewed**: every level requires at least one delayed-retrieval
  demonstration (A1 episode 38; A2's 15/18 canDos flagged `delayedRetrieval`;
  B1's capstone arc; B2 arc 6 (`the_long_conversation`, tagging every step
  `evidenceType: 'delayedRetrieval'`); C1's `sustained_interaction` arc; C2's
  `mediate_a_complex_disagreement_for_a_third_party` capstone).
- **Evidence IDs**: PSY-Y01-001, PSY-Y02-001, PSY-Y02-028 (9-month delayed
  classroom retention — Grade B); PED-P03-004 (L2-specific retrieval-vs-
  restudy corroboration, Grade B).
- **Grade/confidence**: high. Five independent studies across lab and real
  classroom settings converge in the same direction; this matches the
  already-logged `LC-SUP-001` benchmark item P1/Y1 (both PASS).
- **Populations**: adult and university L2 learners, 8th-grade EFL, secondary
  classroom — reasonable spread, no contradicting record in either corpus.
- **Verdict**: **PASS**. Direct, convergent, no contradicting primary study.

### GC3 — Corrective feedback with retry, not recasts-only

- **Claim reviewed**: `responseEvaluation.js`'s `retryRequired`/`retryPrompt`
  fields, consumed by `hybridEvaluation.js` to route a wrong answer back into
  a retry/repair prompt rather than silently marking it wrong and moving on
  (verified live in A2's `turn_left_then` planted-repair step and every
  sampled level in §3).
- **Evidence IDs**: PED-P01-005 (Grade 6 francophone ESL — prompts/self-repair
  outperformed recasts for a specific form, Grade B); PED-P03-010, PED-P03-011
  (focused/comprehensive corrective feedback outperformed no-feedback control,
  including on transfer to new writing, Grade B); PED-P04-020 (university EFL
  Japan, N=167, **Grade A** — CF groups improved both accuracy and fluency).
- **Grade/confidence**: moderate-high; one Grade A record, several Grade B,
  one weak point (grade skews B, only one A-grade record).
- **Verdict**: **PASS_WITH_CONDITIONS**. The retry/repair design (not a
  recasts-only standard) is exactly what `LC-SUP-001`'s own calibration
  benchmark (P2) already found the mixed evidence supports — recasts alone
  would have been the wrong mandatory rule; retry/self-repair as the default,
  recasts as one tool among several, is supported. Condition: no future PR
  may add a feedback path that standardizes on recasts as the sole/default
  corrective mechanism without new corroborating evidence, per the P2
  precedent already on record.

### GC4 — Interests/context personalization never changes the capability standard

- **Claim reviewed**: every blueprint's personalization-invariant clause (A1,
  A2, B1, B2, C2 quote it verbatim; C1 implements it structurally via
  `personalizationMode` = context-only without quoting the sentence — see §6
  finding F-C1) plus `check:interest-personalization` as the deterministic CI
  gate.
- **Evidence IDs**: PSY-Y01-007, PSY-Y02-004 (Grade B); PSY-Y01-008 (7th
  grade, **Grade A**); PSY-Y01-009 (UCLA undergrad, Grade B) — interleaving/
  desirable-difficulty benefit specifically when items must be discriminated
  from similar-looking alternatives.
- **Grade/confidence**: the interleaving literature itself is solid, but it
  supports a *scoped* claim ("interleave/vary when items are confusable"),
  not "varying interest context is always beneficial." Contract §7 already
  scopes this subfield as "where empirically supported."
- **Verdict**: **PASS_WITH_CONDITIONS**. The actual enforced invariant
  (interests vary context/examples, never the standard or threshold) is
  correct and is enforced by a deterministic test, which is the real
  safeguard — not the citation. Condition: keep
  `check:interest-personalization` in `check:all` permanently; it is load-
  bearing, not decorative.

### GC5 — Motivation/engagement design without dark patterns

- **Claim reviewed**: no level's runtime code contains variable-reward,
  loot-box, escalating-shame or punitive-loss mechanics (confirmed in §3: no
  `Math.random`-driven reward in the learning runtime; XP values are fixed
  per-episode constants).
- **Evidence IDs**: PSY-Y03-015 (Grade A, 4th/5th grade), PSY-Y03-016 (Grade
  A, 133 high schools) — autonomy support/choice/rationale increased
  intrinsic motivation and self-regulation; PSY-Y02-022 (Lally et al., adult
  volunteers, Grade B) — automaticity builds from repeated performance of the
  target behavior itself along an asymptotic curve, not from reminders or
  urgency.
- **Grade/confidence**: high; two Grade A records, convergent, good
  child-through-adult population spread.
- **Verdict**: **PASS**. This also cross-checks clean against a documented
  negative precedent: `LC-SUP-001`'s own calibration benchmark (Y3) already
  demonstrates the supervisors correctly **BLOCK** a claim that tries to
  smuggle an escalating loss-framed streak mechanic under this same
  habit-formation evidence. No such mechanic exists in the shipped or
  designed A1-C2 curriculum.

### GC6 — Age-sensitive scaffolding for older adults

- **Claim reviewed**: `CLAUDE.md`'s age-adaptation section requires "calm
  pacing ... confidence-preserving correction and evidence-based scaffolding"
  for older adults; the shared engine's fade/support ratchet
  (`updateScaffoldAfterTurn`, `HELPED_SUCCESSES_TO_FADE=4`,
  `INDEPENDENT_TO_RELAX=2`) is age-agnostic evidence-based pacing, not an
  age-specific L2 design.
- **Evidence IDs, pedagogical corpus**: the only "age" topic present
  (PED-P01-032/033, PED-P02-028, PED-P03-005/006, PED-P04-010/011/012) is
  entirely about age of L2 acquisition/critical-period effects in immigrants
  — **zero pedagogical records have an older-adult learner population.**
  Evidence IDs, psychology corpus: PSY-Y01-030 (16 young vs. 19 older adults,
  method-of-loci training, Grade B), PSY-Y03-026 (older adults 61-81, Grade
  B), PSY-Y04-028 (healthy older adults, working-memory training, **Grade
  A**) — general cognitive-aging evidence for scaffolded pacing benefits, but
  none are L2-language-learning studies.
- **Grade/confidence**: real, asymmetric gap. This exactly matches the
  limitation `LC-SUP-001`'s readiness report already logged: both corpora
  skew university/young-adult; pedagogical has zero explicit older-adult
  records.
- **Verdict**: **RESEARCH_NEEDED** for any claim that LinguaChat's older-adult
  scaffolding is *L2-pedagogy-evidence-based*. The current design (calm,
  evidence-driven fade, no artificial time pressure) is a reasonable,
  non-harmful default supported by *general* cognitive-aging psychology at
  moderate confidence, but per contract §3 ("evidence from [a population] is
  not automatically generalized ... nor vice versa") it must not be marketed
  or documented as an L2-specific, evidence-proven older-adult design.
  Required change before any such claim is made: either commission/find
  L2-specific older-adult primary studies, or explicitly scope product
  language to "general accessible-pacing design, L2-specific validation still
  open" — which is already what `CLAUDE.md` itself says ("Human efficacy
  requires later real-learner pilot evidence"), so this is a confirmation of
  an existing honest limitation, not a new defect.

## 3. Runtime fidelity spot-check (design claims vs. actual shipped code)

Sampled one representative episode/arc file per level (A2 `a2Arc4GettingAround.js`,
B1 `b1Arc1.js`, B2 `b2Arc6TheLongConversation.js`, C1 `c1Arc1AbstractArgument.js`,
C2 `c2Arc6DiscourseFlexibility.js`) plus the shared engine
(`scaffolding.js`, `responseEvaluation.js`, `learnerModel.js`).

- The recognition/guided/independent distinction is a real, load-bearing code
  path (`scaffolding.js:122-144`), not documentation-only: `choice`/
  `comprehension` steps are hard-coded to `RECOGNITION`/`GUIDED` and cannot
  register as independent evidence.
- Every sampled level pairs at least one unaided free-production step with
  every scored capability; no sampled episode uses multiple-choice alone as
  mastery evidence.
- Delayed retrieval is real and load-bearing: A2's `go_straight_then_turn_right`
  opens with a bare recall of a prior episode's capability with nothing on
  screen; B2 arc 6 explicitly tags `evidenceType: 'delayedRetrieval'` per
  step; C2 arc 6 pulls a capability taught in a different arc and retrieves
  it unaided mid-episode, with an explicit code comment confirming intent.
- C2's capstone specifically needed a new core-engine capability — logging
  delayed-retrieval evidence for *several* capabilities from one task
  completion — because `docs/curriculum/blueprints/c2.json:578-584`
  (`coreEngineRequirements[3]`, `multi_capability_delayed_retrieval_per_task`)
  states the engine could not do this yet. This is genuinely implemented:
  `learnerModel.js:677-686`'s `recordDelayedRetrievalEvidence(model,
  canDoIds, ...)` accepts an array and logs a `delayedRetrievalAt` timestamp
  per id, and it is wired into the real completion path in
  `EpisodeShell.jsx:677-679`, not dead code. **Finding (non-blocking,
  documentation-sync only)**: `c2.json`'s own `coreEngineRequirements[3]`
  entry is not annotated as resolved, unlike the parallel F8 entries in
  `b2.json`/`c1.json` which do carry a `"RESOLVED by LC-AUD-001 F8..."` note.
  Recommended follow-up (outside this task's write scope): the next task that
  touches `docs/curriculum/blueprints/c2.json` should add an equivalent
  resolved-by note pointing at `LC-INT-001`.
- No red flags found: no `Math.random`-driven reward code in the learning
  runtime; fixed per-episode XP constants; every sampled wrong-answer path
  retries/repairs rather than silently failing.
- One minor, non-blocking authoring-generation gap: B1's `b1Arc1.js` (an
  earlier-authored file) distinguishes independent/assisted evidence via
  `suggestionEn` presence/absence rather than the explicit `evidenceType`
  field A2/B2/C1/C2 use. Functionally sound, less uniform. Recommended for a
  future B1 content-alignment pass, not blocking since B1 stays unavailable.

This spot-check did not re-run the linguistic-accuracy fixtures (whether the
evaluators correctly grade open-ended learner English) — that is proven
separately by each level's own `scripts/foundry/*/check-*-evidence-paths.mjs`
suite, which already ran as part of `LC-INT-001`'s and each `LC-CONT-*`
task's own QA.

## 4. CEFR-honesty re-check

Re-verified directly against each blueprint (not merely trusted from
authoring-time claims): all six blueprints explicitly exclude listening,
speaking, and pronunciation from their CEFR claims (A1: "textual/interactive
only, no listening, speaking or pronunciation descriptor claimed"; A2/B1/B2
governed by the shared master clause; C1: explicit `cannotYet`/
`explicitExclusions`; C2: `cannotYet` lists "listening, speaking, live spoken
interaction or pronunciation of any kind — out of product scope, not a level
ceiling" and separately excludes real-time interpretation, specialist
professional registers, creative/literary composition and native-speaker
sociocultural intuition). No level claims complete CEFR coverage it cannot
back. **No violation found.**

## 5. Cross-level audit (`LC-AUD-001`) resolution re-check

Independently re-read every finding in `docs/curriculum/cross-level-audit.md`/
`.json` against the current blueprint files (not the `LC-FND-002` completion
marker's prose):

| Finding | Status | Where verified |
|---|---|---|
| F1 `report_a_problem` id collision (A2/B1) | RESOLVED | B1 renamed to `escalate_and_resolve_a_problem` (`b1.json:218`); A2 keeps `report_a_problem` (`a2.json:241`) |
| F2 `infer_implied_meaning` collision (B2/C1) | RESOLVED | C1 renamed to `infer_implied_meaning_in_unfamiliar_context` (`c1.json:406`), prerequisite `b2.infer_implied_meaning` |
| F3 `reformulate_for_a_different_audience` collision (C1/C2) | RESOLVED | C2 renamed to `reformulate_dense_source_for_a_new_audience` (`c2.json:91`); "first mediation task" claim rescoped |
| F4/F4b — 6 B1 broken cross-level prerequisites | RESOLVED | all 6 renamed (`b1.json:124,164,184,224,284,364`); bridging `prerequisiteRisk` note added for the should-scope gap |
| F5 — 6 C1 broken cross-level prerequisites | RESOLVED | all renamed to `b2.*` dot-notation (`c1.json:76,89,102,115,141,154`) |
| F6 — 7 C2 broken cross-level prerequisites | 6/7 RESOLVED, 1 deliberately deferred | 6 renamed (`c2.json:65,93,123,153,183,192`); the 7th (`sustain_coherence_across_topic_shifts`) still carries the literal placeholder plus an explicit `unresolvedPrerequisiteNote` (`c2.json:212-213`) — openly flagged, not silently broken |
| F7 — A2 CEFR-reference gap (0/19) | RESOLVED | 19/19 `cefrRefs` entries now present in `a2.json` |
| F8 — duplicate CORE-engine asks (B2/C1) | RESOLVED | `docs/curriculum/core-engine-requirements.md` documents one consolidated path; both `b2.json:1733,1745` and `c1.json:834,844` cross-reference the resolution |
| F9 — semantic-type fragmentation (`problem`/`problem_type`/`negotiated_item`) | RESOLVED | `docs/curriculum/semantic-types.md` records the is-a relationship; both blueprints cross-reference it |
| F10 — `because_reason_pattern` reuse ambiguity | RESOLVED | `b1.json:442` now marks `introducedAtLevel: "a2"`, `reuseMarker: "R"` |
| F11 — `hedging_pattern` reuse collision (B2/C2) | RESOLVED | C2 renamed to `academic_hedging_pattern` (`c2.json:294`) with an explicit rename note; B2's original untouched |
| Tooling: `check-cross-level-ids.mjs` wired into `check:all` | CONFIRMED | present, wired (`package.json`), run directly — OK, 3 registry groups, 7 levels checked |

**Verdict: the cross-level audit passes.** The one item left open
(`sustain_coherence_across_topic_shifts`'s exact C1 prerequisite mapping) is
exactly what `LC-AUD-001` itself asked to be left to explicit human judgment
rather than auto-resolved, it is visibly flagged in the blueprint rather than
silently broken, and it cannot cause a real-learner defect today because C2
is unreachable (`available: false`). It should be resolved before C2's own
future content-authoring task (equivalent to `LC-CONT-C1`/`LC-CONT-C2` but for
C2's still-unbuilt runtime episodes, if C2 content authoring resumes) begins
building against `sustain_coherence_across_topic_shifts`, but it does not
block this acceptance.

## 6. Per-level structural verdicts

| Level | Verdict | Basis |
|---|---|---|
| A1 | **PASS** | Frozen per `CLAUDE.md`; arcs 1-5 runtime-proven with a production-build browser walkthrough (per prior tasks); arcs 6-7 correctly fail closed (`unknown_episode`); `available: false`, `contentStatus: partial` |
| A2 | **PASS** | CEFR-reference gap (F7) closed; delayed retrieval and repair genuinely present in sampled runtime code (§3); `available: false` |
| B1 | **PASS_WITH_CONDITIONS** | Design and audit fully resolved; one non-blocking authoring-generation gap in `b1Arc1.js`'s evidence-tagging convention (§3), recommended for a future alignment pass, not blocking since unavailable |
| B2 | **PASS** | Capstone (arc 6) genuinely implements delayed retrieval for every required arc 1-5 capability; duplicate CORE-engine ask with C1 resolved |
| C1 | **PASS_WITH_CONDITIONS** | Functionally compliant with the personalization invariant via `personalizationMode` = context-only, but does not restate the invariant sentence verbatim the way A1/A2/B1/B2/C2 do — a documentation-parity gap, not a behavioral one. Recommended: a future task in C1's write scope should add the explicit sentence for parity and auditability |
| C2 | **PASS_WITH_CONDITIONS** | One deliberately-deferred cross-level prerequisite (§5, F6 remainder) needing human judgment before C2's own future content-authoring proceeds; one documentation-sync gap where `coreEngineRequirements[3]` is not marked resolved despite being genuinely implemented (§3). Neither is a functional defect and C2 remains fully unavailable |

## 7. Overall verdict

**PASS_WITH_CONDITIONS.**

Both preconditions required by contract §10 are met (evidence gate READY,
cross-level audit passes). No level's design or shipped runtime code violates
a CLAUDE.md curriculum-quality rule, a personalization invariant, a CEFR-
honesty rule, or the dark-pattern/motivation ban. The conditions recorded
above are: (1) two cross-cutting evidence claims (GC1: recognition-vs-
production, GC6: older-adult L2 scaffolding) must continue to be described
at the confidence level the corpora actually support, not overstated; (2)
three narrow, non-blocking documentation/authoring-parity gaps (B1's older
evidence-tagging convention, C1's unstated personalization sentence, C2's
un-annotated resolved core-engine requirement) should be picked up by a
future task with write access to those files; (3) C2's one deliberately-
deferred prerequisite mapping needs explicit human judgment before C2's own
runtime content is authored against it.

None of these conditions block `LC-RC-001` (release hardening) from
proceeding, and none of them changes any level's `available` state. This
report does not open A1 or any other level; A1's own separate completion gate
(`LC-PED-002` and the dedicated availability-flip task) is a distinct,
untouched decision.
