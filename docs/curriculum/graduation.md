# Graduating from Pre-A1

Two questions that look like one, kept apart on purpose.

- **Readiness (today):** `linguachat-frontend/src/learning/curriculum/readiness.js` — derived, never stored, allowed to change its mind.
- **Graduation (a fact):** `linguachat-frontend/src/learning/curriculum/graduation.js` — written once, monotonic, idempotent.
- **Enforcement:** `npm run check:graduation` · `check:pre-a1-journeys` · `check:pre-a1-readiness`.

> **Architecture note.** Supabase integration is deferred until the functional product is complete. The milestone described here is stored in the local learner model (`lc2-learner-model-v1`, model v7) alongside everything else, and holds metadata only — a timestamp, the criteria version, and which engine point noticed. No transcripts, no scores, nothing about the person.

---

## The two questions

| | Readiness | Graduation |
|---|---|---|
| asks | is this person ready **today**? | did this person **reach the bar**? |
| computed | on demand, from the model | once, when readiness first holds |
| may go back to false | yes | never |
| stored | no | `levelMilestones.pre_a1` |
| affected by a due review | yes | no |

A learner who graduated in July and has four phrases due in August has four phrases due. They have not become un-ready, and the product does not tell them they have.

## What is stored

```js
levelMilestones: {
  pre_a1: {
    graduatedAt: '2026-07-22T00:35:15.364Z',   // when it was NOTICED
    evidenceVersion: 'pre_a1.v1',              // which criteria produced it
    source: 'episode_run',                     // which engine point saw it
  },
}
```

`graduatedAt` is the moment of reconciliation, never the historical date on which the criteria were first met — nobody witnessed that, and no migration is entitled to assert it. `evidenceVersion` exists so a future change to the criteria can be told apart from a graduation earned under them; bump it when the rules change in a way that would change who passes, not for a refactor.

## Where it is decided

Reconciliation runs where evidence **changes**:

- `completeEpisodeRun()` — the end of an episode run
- `completeSession()` — the end of a daily session

Never where a screen renders. Graduating because somebody opened Home would make a pedagogical record a property of navigation, and `check-graduation` fails if any component imports `reconcileLevelMilestones`.

It is idempotent by construction: an existing milestone is returned untouched, so calling it after every save can neither move the date nor write a second one. It awards nothing — no XP, no Garden item, no run — because a milestone describes what happened rather than paying for it.

## What it survives

- **Reload:** stored with the model, read back by `preA1Milestone()`.
- **A month of silence:** readiness goes false, the milestone does not move.
- **Merging two devices:** `mergeLevelMilestones` keeps the **earlier** legitimate graduation — the learner graduated the first time they reached the bar — and a device that never noticed cannot delete one that did.
- **Migration from v6:** the older format had no such field, so the honest result is a learner who has not graduated *yet* and can earn it from the evidence they already have, dated when it is noticed. A migration never invents one and never backdates one.
- **Malformed data:** `sanitizeLevelMilestones` drops anything without a valid date, an over-long version string, or an unknown level.

## What the learner is told

Three states, one card on Home, from `preA1Status()`:

| state | when | what it says |
|---|---|---|
| `in_progress` | still walking the seventeen | the next episode |
| `consolidating` | curriculum finished, not ready | what is missing, concretely — the planner's own focus |
| `graduated` | milestone recorded | what they can do, the date, and that it stays theirs |

A graduate with reviews due gets one extra line: *some phrases are due to come back; that is practice, not a step backwards.*

There is no button to A1. A1 does not exist yet, and a door that opens onto nothing is worse than no door — `check-graduation` walks every component and fails on one.

The celebration is shown **once per browser** and is deliberately not part of the milestone: whether a learner has seen the confetti is a fact about a device, not about their English. It lives in `lc2-pre-a1-celebrated`, is claimed on the first render that finds a graduation with nothing recorded, and stays visible for the rest of that visit.

## Reaching it by playing

The criteria are only honest if the ordinary product can produce their evidence. Two learners are played end to end in `check-pre-a1-journeys`, from a fresh model, with no fixtures:

- **A strong learner** walks the seventeen episodes and the day's reviews, finishing on day seventeen with every capability proven and that morning's language still due. One ordinary catch-up session later they are ready, and the milestone is written by the run that finished.
- **An assisted learner** — one who takes the suggestion whenever the app offers it — finishes the curriculum and is **not** ready, blocked by real evidence: two fragile capabilities, a review backlog, and no conversation held unaided. Following the planner's own recommendations, they graduate in nine sessions without replaying the level.

Both of those failed when this sprint began, and fixing them meant fixing the product rather than the criteria: reviews that never earned a longer interval, a queue that ignored the level's core language, support that could never fade, and consolidation blocks that handed over the answer they were asking the learner to produce. Those are described in [adaptive-support.md](adaptive-support.md) and in the review-scheduling comments in `learnerModel.js`.
