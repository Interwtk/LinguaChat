# B1 core-engine findings — b1.md section 15

Both open questions in `docs/curriculum/blueprints/b1.md` section 15 are read-only
investigations this task's write scope permits (`docs/curriculum/blueprints/b1.md` itself is out of
scope for `LC-CONT-B1`, so findings live here instead; nothing in this file edits the blueprint).
Neither required a shared-core code change to answer.

## 15.1 — Evaluation density shift toward hybrid: resolved, no core change needed

**Question:** 13 of B1's 14 new intents are `hybrid`. Does the existing local-evaluator shape (a few
taught-frame regexes, a few explicit reject patterns, one inconclusive catch-all) stay reliable at
that density, or does the local fallback need a richer heuristic layer first?

**Method:** `linguachat-frontend/scripts/foundry/b1/measure-hybrid-evaluation-density.mjs`
(read-only; imports the live `evaluateIntroducePerson`/`evaluateStatePersonFact`/`evaluateAskTransport`
from `engine/responseEvaluation.js` as black boxes, no engine edits):

1. Ran 9 sentences well outside those three evaluators' taught frames (natural unanticipated
   phrasing and genuine nonsense) through the **existing, live** hybrid evaluators. Result: **zero**
   false-conclusive rejects — every unmatched input, including outright nonsense, returns
   `conclusive: false` (an inconclusive escalation candidate), never a confident "you failed." This is
   what `hybridEvaluation.js`'s Level-3 fallback comment already promises ("never blocks the
   learner") and confirms it holds in the live code, not just in the comment.
2. Wrote draft evaluators for B1's two structurally hardest intents (`state_future_intent`,
   `negotiate_solution`) following the exact same authoring pattern, and ran all 13 of b1.md section
   11's own worked examples (correct/natural-variant/near-miss/wrong-meaning/nonsense/insufficient-form/
   pragmatically-inappropriate) through them. Result: **all 13 classify correctly with an explicit
   pattern**, 0 need to fall through to the inconclusive catch-all.

**Finding:** the local-evaluator *pattern itself* is not the risk; a hybrid-majority level trades more
runtime escalations (more genuinely novel phrasings the local pass can't recognize) for the *same*
zero-false-reject guarantee A1's minority-hybrid intents already have, because the guarantee comes from
the catch-all always being `conclusive: false`, not from the taught-frame coverage being large. **No
core-engine change is needed before B1 content authoring proceeds.** The one real, pre-existing
trade-off — under `LINGUACHAT_PROVIDER=local/fake` (mandatory for QA/CI), no remote is ever consulted,
so a hybrid intent's QA proof must rely on explicit accept/reject patterns, exactly as A1 already does —
is not new to B1; it is why `check-pedagogical-journeys.mjs`'s `VARIANTS`/`NEAR_MISS`/`NONSENSE` banks
exist. B1's evaluators must therefore explicitly encode every phrasing its own QA journeys need to pass,
not lean on hybrid escalation to cover them — a content-authoring discipline, not an engine gap.

The two draft evaluators in the measurement script are the starting point for
`linguachat-frontend/src/learning/levels/b1/evaluators.js`'s real `state_future_intent`/
`negotiate_solution` functions.

## 15.2 — Discourse-level evaluation for `sustain_topic_change` / `ask_follow_up_questions`: resolved, already supported

**Question:** does the runtime evaluator call already receive the immediately preceding partner turn
as context, or does arc 6 need a new engine capability?

**Method:** read (no edits) `components/session/SessionRunner.jsx:427`, `components/episode/EpisodeShell.jsx:414,519`,
`engine/hybridEvaluation.js:148,153,167-168`, `engine/responseEvaluation.js:1430`.

**Finding: already supported.** Every free-reply evaluation call already builds a `turnContext` object
(currently `{ linguaSaid }` — the partner's immediately-prior utterance) and threads it, unchanged,
through the entire pipeline:

- into the local evaluator's own `ctx` (`evaluateFree(kind, text, ctx)`, `ctx.turnContext.linguaSaid`
  available to any evaluator function that reads it — none currently do, but the field is there);
- into the remote/AI payload (`hybridEvaluation.js:148`, `turn_context: params.turnContext ?? null`).

This is exactly "judge this turn in relation to the last partner turn," which is what
`sustain_topic_change` (was this a natural change *from what the partner just said*) and
`ask_follow_up_questions` (is this a genuine follow-up *to what the partner just said*) both need for
a single-hop judgment. **No shared-core extension is required.** The one thing genuinely not
available is a *second* turn back (b1.md's "previous one or two turns" phrasing) — but neither arc 6
capability's own evidence description in `b1.json` requires two-turn history; both are single-hop
("in relation to what was just said"), so this is not a real gap. If a future capability needs deeper
history, that is a separate, later question, not a B1 blocker.

`linguachat-frontend/src/learning/levels/b1/evaluators.js`'s `sustain_topic_change`/
`ask_follow_up_questions` functions read `ctx.turnContext.linguaSaid` the same way every other B1
evaluator reads `ctx.targetNoun`/`ctx.place`/etc. — an ordinary parameter, not a new mechanism.

## A related, adjacent finding: B1 does not need the shared `registerAppropriateness` field

`docs/curriculum/core-engine-requirements.md` (LC-AUD-001 F8) scopes the shared
`registerAppropriateness`/`discourseCoherence` result fields to **B2's capstone arc onward** and C1;
B1 is not a stated consumer. b1.md section 11's `negotiate_solution` "pragmatically inappropriate" row
("Give me a replacement now.") does not need that shared field — it is handled as an ordinary
`completedObjective: false` reject with its own `errorType` inside `negotiate_solution`'s own local
pattern match, exactly the way `evaluatePoliteRequest`'s existing single hardcoded pragmatic special
case (`previous_structure`, cited in `core-engine-requirements.md` line 16) already works today. See
the draft `draftEvaluateNegotiateSolution`'s `pragmatically_inappropriate_demand` branch in the
measurement script. No conflict with the B2/C1 design record: B1 needs one taught pragmatic ceiling
inside one intent's own function, not a general scoring dimension.
