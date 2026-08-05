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
| language | 74 items: 32 words, 12 patterns, 30 phrases |
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

- a strong learner plays all seventeen episodes plus each day's reviews, earns every required capability, and graduates — 1000 XP, exactly seventeen rewarded runs, a Garden of 59 items with receptive language never claimed as production
- an assisted learner finishes the curriculum, is **not** ready on the evidence, and recovers through the planner's own recommendations in nine sessions without replaying the level
- the support level moves with evidence and every high-support episode says why

**Automated, the rest of the product:** 40 checks (`npm run check:all`), 323 backend tests (`pytest`). These cover the episode engine and replay, session planning and recovery, hybrid evaluation and its fallbacks, semantic compatibility, the Memory Garden and learning states, learner facts, activity preferences, i18n across eight languages, structural/visual invariants, edge cases including corrupt storage, and the bundle boundaries.

**Manually, in a real browser** (dev server and the served production build):

- the three graduation states on Home, in Spanish and in Arabic (RTL) at 390 px, with no horizontal overflow
- the celebration appearing once and not again on reload, with the graduation and its date intact
- a graduate with reviews due told about practice rather than about being un-ready
- the served build booting with the entry chunk alone, and fetching the curriculum chunk at the moment an episode starts

**Not done manually this sprint:** a turn-by-turn browser walk of all seventeen episodes, Quick/Standard/Deep sessions by hand, provider timeout and backend-down by hand, the 768 px and 1440 px viewports, Japanese, and mixed-locale checks. Those paths are covered by the automated checks above and were walked by hand in the sprints that built them; this sprint's manual coverage was aimed at what it changed.

## The decision

Pre-A1 is **frozen for content** and **open for correction**. No new episodes, arcs, capabilities, or vocabulary. Bugs in what exists are still bugs, and a real one may be fixed — three were in this sprint, and each is described where it was fixed.

The question the sprint set out to answer was whether a person can start from zero, walk Pre-A1, consolidate what they need, and graduate legitimately with real evidence — without impossible fixtures, without losing state, and without the browser downloading the whole curriculum before the first screen. All four now hold, and each is held by a check that fails if it stops holding.
