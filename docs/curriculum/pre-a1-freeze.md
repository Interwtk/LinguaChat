# Freezing Pre-A1

The level is finished. This says what that means, what was verified and how, and what it does not claim.

- **Content:** `linguachat-frontend/src/learning/episodes/index.js` — six arcs, seventeen episodes, closed.
- **Enforcement:** `npm run check:pre-a1-freeze` · `check:pre-a1-journeys` · `check:graduation` · `check:curriculum-loading`.

> **Architecture note.** Supabase integration is deferred until the functional product is complete. `check-pre-a1-freeze` walks `src/` and `package.json` and fails on any Supabase or other cloud dependency, import, variable or file. Progress is local: `lc2-learner-model-v1` and the small UI keys beside it.

---

## What is frozen

| | |
|---|---|
| arcs | 6 — greetings, connect, choose, cafe, repair, things |
| episodes | 17, in a fixed order, each teaching a fixed capability |
| vocabulary catalogue | 72 entries: 30 words, 12 patterns, 30 phrases |
| granted by episodes | 59 of those 72 — see [pre-a1-map.md](pre-a1-map.md) for what the other 13 are for |
| capability map | 18 covered, 2 fragile, 2 needing reuse, 5 optional, 6 deferred to A1 |
| learner model | v7 |
| evidence version | `pre_a1.v1` |

Changing any of those numbers is a decision, not a refactor: the frozen shape is asserted item by item, so an eighteenth episode or a new word fails the check rather than arriving quietly.

**Frozen is not over.** A learner who has played everything is still offered somewhere to go — reviews, consolidation, conversation — in every session length. A level that ends in an empty screen has not been finished; it has been abandoned.

## Declared weaknesses, kept declared

Pre-A1 freezes with four capabilities the audit does not call covered, each with a reason recorded next to it:

- `say_what_you_dislike` — produced only in episode 7; *"I don't like…"* never returns
- `say_what_you_need` — produced only in episode 8; the café practises wanting, never needing
- `ask_what_a_thing_is` — episode 16 only; identifying comes back in 17, asking does not
- `small_numbers_and_quantity` — episode 17 only: taught, counted, requested, and never required again

None of them is required to leave the level. They are visible on purpose: a status quietly promoted to "covered" to make a level look finished is the same drift this project has had to dig out before. `check-pre-a1-freeze` fails if one loses its explanation or is upgraded.

## What was verified, and how

**Automated, end to end, from a fresh model with no fixtures** (`check-pre-a1-journeys`):

- a strong learner plays all seventeen episodes plus each day's reviews, earns every required capability, and graduates — 1000 XP, exactly seventeen rewarded runs, 59 tracked language items with receptive language never claimed as production
- an assisted learner finishes the curriculum, is **not** ready on the evidence, and recovers through the planner's own recommendations in nine sessions without replaying the level
- the support level moves with evidence and every high-support episode says why

**Automated, the rest of the product:** 41 check scripts at the freeze — the invocations listed in `check:all` in `package.json`, 43 as of the A1 architecture readiness sprint, which added `check:a1-blueprint` and `check:curriculum-authoring` — and 323 backend tests (`pytest`). These cover the episode engine and replay, session planning and recovery, hybrid evaluation and its fallbacks, semantic compatibility, the Memory Garden and learning states, learner facts, activity preferences, i18n across eight languages, structural/visual invariants, edge cases including corrupt storage, and the bundle boundaries.

**Manually, in a real browser** — the closure audit, on the dev server and on the served production build:

- the three graduation states on Home, in Spanish, Japanese and Arabic (RTL), at 390, 768 and 1440 px, with no horizontal overflow and no clipped controls
- the celebration shown once and not again after a full session and a reload, with the graduation and its date intact
- Quick, Standard and Deep sessions played turn by turn: the blocks the planner chose, the evidence each recorded, and clean boundaries between them — no inherited correction, input or hint
- a session after finishing the seventeen: consolidation rather than an eighteenth episode, and a blocked capability moving to `can_do` from one activity
- a session after graduating: reviews only, no second graduation, no repeated celebration, no door to A1
- two browser tabs saving in sequence: both learners' evidence survives the merge, one milestone, the timestamp unmoved
- the backend stopped: the deterministic path still evaluates and records; an answer that would escalate falls back conservatively and the screen stays usable
- a slow provider (`LINGUACHAT_FAKE_DELAY=6`) and a provider timeout (`LINGUACHAT_FAKE_PROVIDER=timeout`): one request per submission however many times the button is pressed, one verdict, no duplicated evidence, and the learner can try again
- interface Spanish with native Japanese: chrome in Spanish, meanings in Japanese, the English target untouched
- the curriculum chunk removed from the served build: a recoverable message in the learner's language, progress untouched, and the retry loading the episode — during a first entry and during a replay, with XP, runs and the milestone unchanged throughout

**What the manual pass found.** Three real defects, all invisible to the automated journeys because a harness answers the objective rather than reading the screen: the session runner inferred "used help" from the wording of the reply; both surfaces counted a sentence retyped from a correction as unaided production; and the sixth arc's three intents had no prompt or model answer in the session runner, so consolidating either of the capabilities it teaches showed a greeting and graded an identification. Each is fixed, each has a regression, and each was re-verified in the browser.

## The decision

**PRE-A1 STATUS: FROZEN / FUNCTIONAL BASELINE** — closure audit passed on 2026-08-05.

Frozen means the required content is closed and the baseline is validated: graduation is reachable by playing, consolidation is reachable for a learner who leans on help, and the architecture is settled enough to design A1 against. It does not mean bug-free for ever, it does not forbid fixing regressions, and it does not mean A1 exists — A1 is **not implemented**, and Supabase remains **deferred**.

No new episodes, arcs, capabilities, or vocabulary. Bugs in what exists are still bugs, and a real one may be fixed — three were found by the closure audit, and each is described where it was fixed.

The question the sprint set out to answer was whether a person can start from zero, walk Pre-A1, consolidate what they need, and graduate legitimately with real evidence — without impossible fixtures, without losing state, and without the browser downloading the whole curriculum before the first screen. All four now hold, and each is held by a check that fails if it stops holding.
