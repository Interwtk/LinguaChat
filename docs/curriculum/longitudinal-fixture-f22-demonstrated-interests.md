# F22 — Demonstrated interests adjust topic probabilities, never curriculum eligibility

**Status:** design-only acceptance fixture; **UNSUPPORTED** by the current `selectTopic()` input contract at integrated HEAD `af7ac4e64c626f01b788f5f1ae567fa2958c808d`. This is not a proven defect in a shipped learner experience, nor evidence of learning improvement. Pre-A1 remains frozen; A1–C2 remain unavailable.

**Contract:** `docs/curriculum/longitudinal-instructional-adaptation.md`, sections 1, 5–7. This fixture concerns the **soft topic layer**, not the longitudinal **instructional-choice** policy. Do not infer a learning-style label or change a CEFR objective because a learner likes a topic.

## Deterministic setup

Use one existing versioned `goal-1` can-do, one unchanged assessment rubric, identical instructional option, language burden, mastery threshold, reward and due-review obligation. Use a stable seeded topic sampler and a declared multi-day evaluation window (for example, 400 different daily seeds); log the actual seed, candidate contexts and selection source for each decision.

Both synthetic learners initially select `music` at onboarding. Both have identical independent-performance, assistance, error, latency and retrieval histories. The only difference is subsequent *demonstrated interest* evidence:

- **Learner A:** repeated distinct voluntary engagements with `games` conversations on several days, with valid event IDs, no duplicate clicks, no instructional-success interpretation and no claim that the learner explicitly changed onboarding preferences.
- **Learner B:** the same number of engagements, timestamps and opportunities, distributed among neutral or other unrelated contexts, with no positive `games` evidence.
- **Learner C (sparse/contradictory):** a single `games` engagement followed by repeated dismissals or ignored offers; this must not trigger a permanent strong preference.
- **Learner D (missing/legacy):** no reliable demonstrated-interest events; do not synthesize them from correctness, latency, language ability or sensitive profile data.

Keep the same eligible topic catalogue and semantic-slot constraints. Compare the resulting topic-source and topic-ID distributions under identical seed windows. Repeat after adding a later, credible reversal of interests and after a period without relevant evidence. The sampler may use documented decay/uncertainty, but no fixed universal percentages are mandated by this fixture.

## Acceptance assertions

1. **Evidence-responsive, not survey-only.** With sufficient credible positive `games` evidence, A has a higher *probability* of valid `games` contexts than B under otherwise identical conditions. An isolated interaction is weak evidence; C and D remain conservatively mixed.
2. **No topic prison.** Music, adjacent topics, neutral contexts and genuinely unfamiliar contexts remain reachable for A and B across the evaluation window. No interest, however strong, becomes an exclusive eligibility filter. Dismissed topics respect their bounded dismissal policy.
3. **Curriculum invariant.** All learners retain exactly the same `goal-1`, evaluator, required skill coverage, review obligations, rewards and graduation gates. An interest must not change instructional difficulty or masquerade as independent mastery.
4. **Revisable hypothesis.** Later contrary evidence can reduce or reverse A's `games` weighting. Stale, duplicate, missing or contradictory events cannot manufacture confidence. No fixed auditory/visual/kinesthetic type is inferred.
5. **Deterministic and explainable.** Given the same recorded evidence, seed, candidate catalogue and policy version, selection is repeatable. A test can distinguish `explicit-onboarding`, `demonstrated`, `related`, `exploration` and `neutral` contributions without sending a detailed learner profile to the provider.
6. **Accessibility and privacy.** Only permitted, minimal topic-engagement signals are used; no silent inference from protected attributes, no retention of unnecessary conversation text, and no penalization for missing telemetry.

## Current implementation boundary

At the pinned integrated HEAD, `linguachat-frontend/src/learning/engine/topicSelection.js` accepts `explicitInterests`, `recentTopics`, `dismissedTopics`, `acceptedSemanticTypes`, `strength` and `seed`. It already provides soft explicit/related/exploration/neutral rotation. It **does not receive a demonstrated-interest history or weights**, so the A-versus-B outcome above cannot yet be shown through that API. The fixture is therefore **UNSUPPORTED**, not PASS; do not fabricate an E2E result.

## Evidence gate

For any future implementation, record exact code HEAD, deterministic test command, seed range, input event provenance, per-topic counts and uncertainty, PASS/FAIL/UNSUPPORTED, plus invariant checks. Only a separately evaluated longitudinal learner study comparing delayed **independent** retrieval and unseen-context transfer against a balanced baseline can support a claim of improved learning. Topic preference matching alone cannot.
