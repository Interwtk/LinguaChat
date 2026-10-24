# LinguaChat — longitudinal instructional adaptation contract

**Status:** design and acceptance contract only; not evidence of a shipped adaptive tutor.
**Scope:** shared pedagogy for A1–C2, without changing Pre-A1, level availability, CEFR objectives, mastery thresholds, authentication, persistence, or production.

## 1. Two different forms of personalization

**Instructional adaptation** changes *how a fixed language objective is taught and practised*. It may choose the mix and ordering of reading, listening, writing, speaking and free production **only when those modalities are actually implemented and evaluated**; explanation detail, examples, scaffold level, pace, review interval and practice order may also vary. It may never alter the required can-do, CEFR descriptor, evaluator meaning, independent evidence standard or level exit.

**Interest personalization** changes *what an example or conversation is about*. Explicit onboarding interests and later demonstrated interests are soft probability signals, not eligibility gates. Keep adjacent, neutral and unfamiliar contexts in rotation. A required can-do cannot be skipped because its topic is unpopular. These two policies must be independently testable: a topic change must not secretly change difficulty, and an instructional change must not silently change the objective.

The older “personalization changes context only” rule protects **interest personalization**, not the separate instructional-adaptation policy. This document does not authorize bypassing the shared curriculum and evaluator.

## 2. Learning hypotheses, never fixed learner types

The tutor maintains a **revisable, uncertain hypothesis** about which instructional choices improve this learner's *later independent performance on this capability and related transfer tasks*. It does not ask for, infer or permanently assign a visual/auditory/reading/kinesthetic “learning style”. A learner may benefit from different methods for different objectives and at different times.

Sparse, noisy or contradictory evidence means low confidence and a balanced default. A single fast correct answer, assisted success, preference survey or self-report is insufficient to declare a method superior. Confidence must decrease when later evidence conflicts.

## 3. Evidence and provenance

Each usable observation should retain, when supported by the product and appropriate privacy controls:

| Field | Interpretation |
| --- | --- |
| learner/capability and objective version | what was actually being learned, not just a screen id |
| activity/run/event id and timestamps | idempotency and chronological provenance; avoid double counting |
| instructional choice and context family | what the tutor tried; distinguish modality from topic |
| first-attempt correctness and semantic quality | strongest immediate evidence before repair/model exposure |
| optional hesitation/latency | weak, context-sensitive signal; never a timed mastery gate by itself |
| retries, hint/model/scaffold exposure | how much help the success required |
| error type and repair outcome | what changed after feedback |
| independent production and transfer | ability without hints in a genuinely new realization |
| delayed independent retrieval | ability after meaningful intervening material/time |
| observation quality/missingness | unknown is not failure; distinguish unmeasured from negative |

Use only evidence that was actually recorded. Do not invent latency for asynchronous interactions, count a model-assisted repeat as independent, or label an immediate next-day-boundary response “delayed” solely because its calendar day changed. Deduplicate concurrent writes by stable event identity and preserve completed-run evidence before deriving learning decisions.

## 4. Decision policy

1. Select a **fixed required objective** from the shared capability graph and due-review obligations.
2. Identify plausible instructional options for that objective, respecting modality availability, accessibility, age-appropriate content and prerequisite readiness.
3. Estimate the uncertainty and expected *future independent retention/transfer* for each option using longitudinal observations. Short-term assisted correctness is diagnostic, not the optimization target.
4. Prefer a supported option when evidence is strong enough, but deliberately sample reasonable alternatives so the policy can learn and does not overfit early outcomes.
5. Keep balanced exposure to receptive and productive skills, including unfamiliar contexts. Do not allow a high predicted score for recognition to crowd out required independent production.
6. Log the choice, available alternatives, reason/confidence and subsequent outcomes. Reassess after delayed retrieval, transfer or new contradictory evidence.
7. When data are insufficient, corrupted, contradictory or unavailable, fall back to the shared balanced curriculum and normal scaffolding rather than a fabricated personalized recommendation.

The policy may vary explanation style, scaffold fade/recovery, activity ordering, spacing and pace. It must not lower graduation requirements, hide challenging modalities indefinitely, repeatedly select only easy tasks or treat preferences as measured learning gains.

## 5. Interest rotation is a soft, separate layer

For the same can-do, a learner interested in music and another interested in games may receive different semantically valid contexts while facing **equivalent communicative and evidence demands**. Interest weights may increase after demonstrated engagement, but the sampler must retain adjacent, neutral and unfamiliar contexts and apply cooldowns. No fixed universal percentage is claimed to be optimal.

A valid context substitution preserves can-do id, intent, language burden, difficulty, reward, prerequisite, transfer requirement and assessment. If no safe substitution exists, use the neutral fallback. Topic variety must be auditable across multiple sessions, not inferred from one attractive example.

## 6. Longitudinal acceptance tests (not a one-session demo)

| Scenario | Required result |
| --- | --- |
| Learner A improves later unaided transfer after concise explanation, while B improves after worked examples | With sufficient repeated evidence, the next instructional choices diverge **for the same can-do and standard** |
| First attempt wrong, then correct after hint/model | Mark assistance; do not count the repaired response as independent mastery |
| Strong immediate success but weak delayed retrieval | Adapt review/spacing and support; do not report durable mastery |
| Early apparent preference reverses after later independent trials | Update the hypothesis and its confidence rather than freezing a learner label |
| Sparse or missing latency | Use other observed evidence; never invent a latency signal |
| Repeated practice of a favourite format | Sample suitable alternatives and preserve required productive/receptive coverage |
| Two learners with different interests | Contexts can differ while can-do, evaluator and evidence standards remain identical |
| Highly concentrated interest history | Neutral, adjacent and unfamiliar contexts still appear across sessions |
| Concurrent/stale progress snapshots | Unique events and completed evidence survive; counts are neither lost nor doubled |
| Unavailable listening/speaking capability | No phantom audio/oral success and no claim of complete CEFR-modal coverage |

Test across multiple episodes, days, contexts and independent probes; include deterministic fixtures with opposite outcome histories. Verify the policy **actually changes decisions in response to outcomes**, and compare later independent retrieval/transfer against a fixed balanced baseline. A passing code path or an adaptive-scaffolding check alone is not proof of improved learning.

## 7. Measurement and release gate

Report at minimum: objective coverage, first-attempt independent accuracy, assisted-to-independent conversion, delayed retrieval after defined intervals, independent transfer to unseen contexts, skill-family balance, exploration/diversity, context rotation, event provenance and confidence calibration. Stratify where sample sizes allow; do not optimize a single aggregate score while harming learners with sparse data.

Release claims require reproducible offline longitudinal tests **and** a later ethically reviewed learner pilot with sufficiently delayed, independent outcome measures. Until then, call the feature a design/prototype and record what is unimplemented. Existing A1–C2 availability gates stay closed; Pre-A1 remains frozen.

## 8. Ownership and non-goals

This is a curriculum acceptance contract, not authorization to change shared learner-model persistence, cloud/auth infrastructure, Supabase, production flags, billing, or automatic merges. Shared-engine implementation must be separately reviewed and serialized. No paid external model is required. Curriculum workers can author level-specific fixtures and requirements; the integration/watchdog remains the sole owner-action aggregator.
