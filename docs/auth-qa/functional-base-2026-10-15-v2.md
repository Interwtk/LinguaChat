# Adaptive review V2 — functional acceptance

Problem: the prior runtime adapted format/explanation/channel, but the review
ladder still depended on immediate item streaks, and optional practice selected
the first stored capability regardless of later retention. This was a code-level
gap, not measured evidence of a human learning deficit.

The owner explicitly authorized review timing/order/frequency heuristics. The
research baseline is `docs/research/learning-science-foundation.md` §§3–4:
independent retrieval and distributed practice. These sources motivate the
principle; the numerical product heuristics are not scientifically validated.

## Runtime behavior

- One first valid independent, unassisted, non-retried later probe per capability
  and shared learning-day. Unknown outcomes and future observations are excluded.
- The existing `scheduleReview` and its 2/4/8/16/30-day ladder are reused. With
  longitudinal evidence, independent success widens the interval by distinct
  successful retrieval occasions; later failure returns within one day. Assisted
  repair cannot postpone the existing independent check. No mastery field is set
  by the policy, and evaluator/availability/exit thresholds remain unchanged.
- The due-date anchor is the independent probe, so twenty immediate reopens do
  not push the review into the future. Recent evidence can reverse the decision.
- Due core reviews retain precedence. Within a core/non-core group, weekly
  overdue bands protect aging items; equally overdue items prioritize later
  failure or a genuinely recent recurring error. Missing error timestamps are
  unknown, not fabricated recency.
- Required main episodes and prerequisites are preserved. Optional extra practice
  avoids a capability already in the plan, waits for its finite interval after
  successful retrieval, and remains available sooner after failure. A completed
  same-day review is not recreated by changing duration/replanning.
- Generic practice passes its actual capability to the scheduler. Frozen episode
  content is unchanged; callers without longitudinal evidence retain the existing
  scheduler. No second review store or cloud progress schema was introduced.

## Deterministic proof and falsification

`npm run check:teaching` runs real scheduler/planner fixtures: six independent
successful retrieval days yield 30 days; later failure plus assisted repair yields
one day; subsequent independent success reverses the failing policy; twenty
same-day responses cannot move the anchor. It checks fair ordering, finite return,
optional frequency, unknown/assisted exclusion and identical required main goals.

The design fails if same-day responses widen intervals, assistance defers an
independent check, old failure cannot recover, stable items disappear permanently,
or required goals change. Retention is measured by later independent responses,
not clicks, completion or a favorite activity. Human effectiveness remains unproven.

## Listening regression

A simulated device `speechSynthesis.cancel()` exception reproduced a cleanup
crash. Cancellation now fails closed without queuing overlapping audio, exposes
the transcript fallback, and can recover when the device can cancel again.
Physical speaker output requires device QA; deterministic events do not prove it.

Final exact-SHA CI, deployment, hosted HTTP and actual browser E2E boundaries are
recorded in PR #123 Evidence. No production, provider, schema, SMTP or release
permission was expanded.
