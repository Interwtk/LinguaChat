# A1 — the whole level, designed before the first episode

**Status: PLANNED.** Nothing in this document exists in the product. No episode, no arc, no vocabulary, no intent. A1 is unavailable to a learner and will stay unavailable until it is built, arc by arc.

- **Structure (source of truth for ids):** [a1-blueprint.json](a1-blueprint.json) — `a1.blueprint.v1`
- **Enforcement:** `npm run check:a1-blueprint` — validates the design; also proves no runtime module imports it
- **Baseline it was designed against:** Pre-A1 at `1f4dc1f`, [frozen](pre-a1-freeze.md)

> **Architecture note.** Supabase remains deferred until the functional product is complete. Nothing here plans a server, an account or a sync: A1 progress will live in the same local learner model as Pre-A1's.

This file explains the decisions. The blueprint holds the ids, counts and links, and the check keeps the two honest about each other.

---

## 1. What kind of level this is

Not a syllabus of topics. The question every arc answers is *what can this person do now that they could not do before*, and the answer has to be something they would actually do with another human being.

That rules out arcs named Food, Family or Present Simple. Food is a context; family is a context; the present simple is infrastructure. A1's seven arcs are named after situations because a situation is where a capability lives.

## 2. What Pre-A1 leaves us

Derived from the repo, not from memory. Sixteen capabilities, twelve of them required to have left the level:

`introduce_self` · `ask_name` · `full_greeting` · `ask_wellbeing` · `ask_origin` · `full_conversation` · `express_preferences` · `express_needs` · `make_plan` · `polite_request` · `respond_anything_else` · `cafe_order` · `ask_for_repair` · `close_an_encounter` · `identify_things` · `use_small_numbers`

The useful number is not how many exist but **how often each is still exercised** — the count of Pre-A1 episodes whose steps evaluate its intents:

| exercised in | capabilities |
|---|---|
| 7 episodes | `introduce_self` |
| 4 | `ask_for_repair` |
| 3 | `ask_wellbeing`, `express_preferences`, `express_needs`, `polite_request`, `respond_anything_else` |
| 2 | `ask_name`, `full_greeting`, `ask_origin`, `close_an_encounter`, `identify_things` |
| **1** | `full_conversation`, `make_plan`, `cafe_order`, `use_small_numbers` |

The four one-appearance rows are what A1 has to catch. Two of them (`full_conversation`, `cafe_order`) are composite conversation skills whose evidence never returns by design; two (`make_plan`, `use_small_numbers`) are single-use capabilities the freeze already declares as needing reuse. So A1's reuse plan is not decoration: **`make_plan` returns in the closing arc, `use_small_numbers` returns in the transactions arc, and the café shape is reused wholesale when the learner buys something.**

There is no review arc. A1 never opens with *"let's revise Pre-A1"*. Old capabilities come back because a new situation needs them — you greet the person you are about to introduce, you repair the answer you did not catch, you count the thing you are buying.

## 3. What A1 means, derived from the capabilities chosen

By the end of A1 a person can, in the present tense, in one situation at a time:

- **say what fills their days** — what they do, where they live, how their day goes, roughly when
- **ask the same of somebody else** and understand a short answer
- **say who the people with them are**, and one true thing about each
- **find their way**: ask where something is, understand a short answer, give one back
- **complete a small purchase**: choose, quantify, ask the price, catch the number, close
- **say what they can and cannot do**, and ask
- **arrange to meet**: a day, a time, a place, confirmed
- **keep going when the language runs out**: ask what a word means, ask how to say one

And cannot yet: talk about the past at all; plan beyond a present-tense arrangement; give or follow directions of more than one step; explain a reason with a clause; describe more than one attribute of anything; produce third-person `-s`; spell, handle dates, or give contact details; hold a conversation that changes topic twice.

The ceiling is deliberate: **one situation, one topic, ten to twelve meaningful turns, repair available.**

## 4. Scope decisions

| area | decision | why |
|---|---|---|
| work / study | **REQUIRED** | The next thing every first conversation reaches, and the frame every later arc reuses |
| daily routine | **REQUIRED** | The largest everyday topic; turns a few verbs into a life |
| simple time (part of day, at + hour) | **REQUIRED**, distributed | A routine without time is a list; an arrangement is impossible without it |
| introducing another person | **REQUIRED** | Turns a pair into a group; the functional core of "family" without a word list |
| asking where something is | **REQUIRED** | The highest-value question a beginner can own in a real place |
| answering where something is | **REQUIRED** | Otherwise the learner only ever holds one side of the exchange |
| numbers above ten | **REQUIRED**, inside prices and clock times | Ten is not enough for a price; it is not a counting lesson |
| asking the price | **REQUIRED** | Pre-A1 can ask for a thing but not what it costs |
| buying something | **REQUIRED** | The level's whole transaction, reusing the café shape |
| can / can't | **REQUIRED** | One modal, no conjugation, enormous expressive return |
| arranging to meet | **REQUIRED** | The last required capability; it proves the rest |
| asking what a word means | **REQUIRED** | The first repair that *learns* rather than pauses |
| asking how to say something | **SHOULD** | Cheap and multiplies everything, but the level already has enough required question forms |
| asking about ability | **SHOULD** | A real production, but a second question form on top of `do you` |
| transport (bus / train / ticket) | **SHOULD** | Extends asking-where into moving; opens a context of its own, so it is the first trim candidate |
| age | **OPTIONAL** | Cheap to say, rarely needed to act, and carries privacy and cultural weight |
| describing someone | **OPTIONAL** (trimmed) | `He's a student` already carries the function; adjectives invite a catalogue |
| food, family, shopping as *topics* | **CONTEXT, not capability** | They are where capabilities happen |
| directions of several steps | **DEFER A2** | Asking-where is the autonomy; turn-by-turn is its own comprehension load |
| past events | **DEFER A2** — *first A2 capability* | A second tense doubles every pattern the level owns |
| `going to` | **DEFER A2** | Present tense plus a time word already arranges things |
| `because` | **DEFER A2** | Turns one clause into two for no A1 function |
| third-person `-s` (productive) | **DEFER A2**, receptive in A1 | The morphology costs more than it adds while `is` covers most needs |
| dates, months, birthdays | **DEFER A2** | Needs ordinals and a second number system |
| spelling aloud | **DEFER A2** | A system, not a phrase, and it pays off with data we do not collect |
| hotels, bookings, travel | **DEFER A2** | A new context when the transactional muscle is already exercised twice |
| comparatives, longer descriptions, narratives | **DEFER A2** | Structures with no A1 function |
| colours, profession lists, instruction verbs | **NOT TAKEN** | Vocabulary sets looking for a capability |
| contact details, addresses, financial data | **NEVER** | The curriculum does not train anyone to type real personal data |

## 5. The design questions, answered

- **Is `daily_routines` still the best entry point?** No — and the map moves it. The frozen capability map named it as the first A1 capability, but a routine needs a statement frame *and* time expressions *and* frequency at once. **Work and study goes first**: same statement frame, one thing to say, no time system. Routine is second and inherits the frame. The blueprint's `firstA1Capability` is therefore `talk_about_work_or_study`; Pre-A1's runtime constant is untouched, and the map document will be updated only when the first arc is actually built.
- **When does third person arrive?** With `is` in arc 3 (`He's a student`), productively. `-s` on verbs stays receptive for the whole level and is produced in A2.
- **When does time arrive?** Arc 2, because that is where a routine needs it. Part of the day and `at + hour` only; days of the week wait until arc 7, where an arrangement needs them.
- **When do numbers above ten arrive?** Arc 5, as prices and clock times. Never as a counting lesson.
- **Is age required?** No. Optional, receptive. Its communicative return is far below the other personal-information skills and it drags privacy and cultural assumptions with it.
- **Is family a capability or a context?** Both, split honestly: the capability is `introduce_someone_else` (this is X, X is Y); the family words are three neutral relations plus a fallback that needs none. No arc is named after relatives.
- **Directions: A1 or A2?** Split. Asking where something is and understanding a short answer is A1. Following or giving multi-step directions is A2.
- **Is can / can't required?** Yes, and it is the best value in the level. It also creates the level's one real architectural debt (see §9).
- **Are do / does questions required?** `Do you…?` yes, in arc 1. `Does he…?` no — it belongs with third-person `-s` in A2.
- **Does `going to` enter?** No.
- **Does `because` enter?** No.
- **Do prices enter?** Yes, with a neutral unit and no region.
- **Does transport enter?** As a should-have episode inside the place arc, not as an arc.
- **Do travel and hotels enter?** No.
- **What new repair enters?** Two frames: *What does ___ mean?* (required) and *How do you say ___?* (should). Both as new `repairKind` subtypes of the existing repair intent, not as new intents.
- **What is the last required A1 capability?** `arrange_to_meet`.
- **What would the first A2 capability be?** `talk_about_what_you_did`.

## 6. Skill families

Seven, by function, never by grammar: **your own life · the people around you · place and movement · small transactions · what you can do · arranging something · keeping the conversation alive**. The last one is deliberately not an arc — it is taught inside the arcs whose input gets heavier.

## 7. The skill graph

A1 is a **hybrid**: a recommended order the learner can simply follow, over a dependency graph that is genuinely branched. Curriculum order and skill prerequisite are different claims, and the blueprint records both — `prerequisiteArcs` for the walk, `prerequisites` per can-do for autonomy transfer.

```
Pre-A1: introduce_self ─┬─> talk_about_work_or_study ──> ask_about_work_or_study
        ask_origin ─────┘            │
                                     └─> talk_about_daily_routine ──> say_when_something_happens
Pre-A1: use_small_numbers ───────────────────────────────────────────┘        │
Pre-A1: ask_for_repair ──> ask_what_something_means ──> ask_how_to_say_something
Pre-A1: introduce_self, full_greeting ──> introduce_someone_else
Pre-A1: identify_things ──> ask_where_something_is ──> say_where_something_is
                                     └──> ask_about_getting_somewhere
Pre-A1: use_small_numbers ──> use_bigger_numbers ──> ask_the_price ──> buy_something
Pre-A1: cafe_order ─────────────────────────────────────────────────────┘
Pre-A1: express_preferences ──> say_what_you_can_do ──> ask_someone_about_ability
say_when_something_happens ─┬─> arrange_to_meet
say_where_something_is ─────┤
Pre-A1: make_plan ──────────┘
```

Three branches are independent of each other: **life** (arcs 1–2), **people** (arc 3) and **place** (arc 4) share only Pre-A1 prerequisites. Transactions (arc 5) needs place only for its situation, not for its language. The closing arc is the only true convergence, which is why it is last.

The recommended walk stays linear because Home, the planner and the session engine are simple by design and a learner who is offered a menu at A1 does not need one. Autonomy comes from evidence, not from choosing your own route.

## 8. Arcs and episodes

Seven arcs, twenty-one episodes, numbered 18–38 as a **plan only**. Details per arc and per episode are in the blueprint; the shape is:

| arc | episodes | new can-dos | new patterns | vocab (prod/recept) | mini-story |
|---|---|---|---|---|---|
| `work_and_study` | 18–20 | 2 | 2 | 6 / 6 | no |
| `daily_rhythm` | 21–23 | 3 | 4 | 8 / 6 | yes |
| `people_around_you` | 24–26 | 1 | 3 | 6 / 6 | no |
| `finding_your_way` | 27–29 | 3 | 2 | 8 / 8 | yes |
| `paying_and_choosing` | 30–33 | 3 | 3 | 10 / 8 | yes |
| `what_you_can_do` | 34–35 | 3 | 3 | 6 / 6 | no |
| `making_arrangements` | 36–38 | 1 | 2 | 6 / 6 | yes |

Arc size follows the content: two episodes where two capabilities share one frame, four where a number system and a transaction have to coexist. Not three by habit.

Each arc introduces, expands, then integrates — but the third episode is an integration *because the capability needs proving*, not because the template says so. `what_you_can_do` has no third episode for exactly that reason.

## 9. Language architecture

**Patterns are infrastructure.** Nineteen new pattern groups across twenty-one episodes — one per episode, two only where an integration episode combines. Each exists because a function needs it, and the blueprint records for each: what it enables, its prerequisite, how far it is expected to travel (comprehension / guided / independent), where it first appears and where it comes back. No episode is named after a pattern.

**Vocabulary is budgeted, not listed.** Fifty new productive items and forty-six receptive across the level, against Pre-A1's fifty-nine granted. Productive means the learner is expected to say it; receptive means they will meet it and are not credited for it — the distinction Pre-A1 already enforces, carried forward.

**The Garden does not grow by token.** Days of the week are one item. Numbers 11–100 are one item, exactly as `numbers_1_10` already is. Functional phrases and productive patterns become items; scene words do not. The projection is roughly fifty new items, taking the catalogue from 72 entries to about 122 — with every one of them something a learner is meant to be able to use.

**`can` is the level's one real evaluator debt.** Pre-A1 already produces *"Can you repeat, please?"* as a request. A1 adds *"Can you swim?"* as a question about ability. Same words, different act. The ability arc must resolve this with a rule the evaluator can apply — most likely the semantic type of what follows the verb — and not by inventing a second intent that would let the same sentence be graded two ways.

## 10. Semantic types

Nine exist: `interest` `activity` `drink` `food` `consumable` `place` `feeling` `person` `generic_object`.

A1 proposes three, each because no existing type can carry it: **`time_point`** (an hour is not a place or an object), **`day`** (`on Monday` and `at seven` are different slots and collapsing them would let the engine build *on seven*), **`relation`** (`person` holds a name; a relation takes a possessive, so *"This is my Alex"* must be impossible). A fourth, **`transport_mode`**, arrives only with the should-have transport episode and leaves with it.

Explicitly not needed: `job` (a workplace is a `place`), `money` (a price is a number with a neutral unit), `month`, `colour`.

## 11. Intents and evaluation

Pre-A1 has twenty-nine intents, roughly one per phrase. Kept up, that rule would add about thirty for A1. The A1 rule instead is: **one intent per communicative function; variants travel as a subtype on the step**, the way `repairKind`, `quantityForm` and `thingId` already do.

That gives **fourteen new intents**, plus two new `repairKind` values for the new repair frames and a level-aware taught range on the existing quantity intent. If an arc's design needs more than three new intents, it is teaching phrases rather than a capability.

Evaluation keeps Pre-A1's shape: **the canonical frame is judged locally**, always; escalation is for replies that are genuinely inconclusive. Eleven of the fourteen functions are deterministic; three are hybrid (introducing a person, saying something about them, asking about transport) because their word order is freer. **No capability is designed to require the provider to be reachable** — cost and latency aside, a learner offline must still be able to finish an episode.

## 12. Autonomy

A1 starts where Pre-A1 ended: it does not reset everyone to maximum support. Design expectation by phase — early (arcs 1–2): model answer available while a frame is new, two or three open productions per episode, repair planted once per arc. Mid (arcs 3–5): the suggestion withheld on each arc's integrated episode, up to four open productions, repair required by design somewhere in every arc. Late (arcs 6–7): unaided by default, support returning after a wrong answer, five open productions in the closing story, and the learner expected to *ask* rather than only answer.

These are expectations for authors, not rules for the engine. The support engine keeps deciding from the learner's own evidence, exactly as it does today.

## 13. Reuse, and what would be forgotten

The blueprint carries a reuse matrix — thirty-two rows (sixteen Pre-A1 capabilities plus sixteen A1 ones) against seven arcs, marked introduced / reused / consolidated. Its purpose is to find the rows that go quiet.

Three do: `ask_about_getting_somewhere`, `ask_the_price`, `buy_something` — all in the transactions branch. The price and the purchase come back as receptive input in the closing arc and are otherwise carried by the review scheduler; the transport episode is a should-have and is the first thing to cut if the level needs trimming. Every other A1 capability appears in at least two arcs, and every Pre-A1 capability that entered A1 thin (`make_plan`, `use_small_numbers`, `cafe_order`, `full_conversation`) is consolidated at least once.

## 14. Leaving A1

Three different statements, kept apart exactly as Pre-A1 keeps them apart:

- **curriculum complete** — the twenty-one episodes have been played
- **ready for A2** — derived, may change in both directions
- **graduated from A1** — a historical fact, written once, never withdrawn

Readiness dimensions (no thresholds yet — those need evidence from real journeys, which is how Pre-A1's numbers were chosen): required capabilities produced unaided; integrated conversations held unaided, including the closing one; review health across the union of A1 and Pre-A1 required-core language; no fragile required capability; and **breadth** — recent evidence from at least five of the seven families, so nobody leaves the level on a single branch.

Never criteria: every item at `can_use`, any 0–100 score, or episode completion standing in for mastery.

There is no A1 exam episode. The closing story *is* the integrated evidence, and graduation is derived from it afterwards.

`levelMilestones.a1` scales without a refactor: `MILESTONE_LEVELS` is a list and the sanitiser loops over it, so adding `'a1'` is one line — when phase 8 needs it, not now.

## 15. Building it

Nine phases: **phase 0 is architecture readiness**, then one arc per sprint, then a final phase for A1 readiness, graduation and full-level regression. One arc per sprint is the release size: implement, test in a browser, hunt bugs, fix, two clean cycles. Never the whole level in one go.

Every arc sprint must end green on: a new capability really produced in an open turn, declared reuse actually exercised, the evaluator, sessions, the Garden, scaffolding, replay, eight locales, semantic compatibility, the bundle, and two consecutive clean cycles.

## 16. What has to exist before episode 18

Four things, and only these:

1. **A level-aware curriculum registry** — episodes and arcs carrying a level, accessors answering per level. Today `ARC` is a flat Pre-A1 list and `episodesForLevel` only answers for `pre_a1`.
2. **Readiness and Home scoped to a level** — `curriculumComplete` currently asks whether *every* episode in the skeleton is done, and Home's progress runs over the whole skeleton. Both would silently break Pre-A1's meaning the moment an A1 episode exists.
3. **A per-arc content loading path** — the seventeen episodes live in one module. Adding twenty-one more to it would double the lazy chunk; A1 needs its arcs loadable one at a time, keeping the entry chunk exactly as it is.
4. **An authoring check** — the closure audit found the sixth arc's intents missing from the session runner's prompt and model-answer tables, which made a required capability impossible to consolidate. No arc should be able to ship with that hole again.

Everything else waits: the A1 milestone and readiness function are phase 8; new semantic types arrive with the arc that needs them; the Garden's level facet is optional.

**Decision: a small architecture sprint is needed before episode 18.** Not a refactor — four scoped changes, each with a check. The planner, the session engine, the learner model and the graduation architecture need nothing.

## 17. How this map was trimmed

The first pass had eight arcs, eighteen can-dos and twenty-three episodes. Two rounds of review changed it:

- **cut**: `describe_someone_simply` (the function is already carried by `He's a student`, and adjectives invite a catalogue), one episode from the ability arc, and a standalone transport arc — folded into one should-have episode inside the place arc.
- **checked for gaps** afterwards: ordering food (already Pre-A1), buying with a price (arc 5), asking where the station is (arc 4), saying what you do (arc 1), describing your day (arc 2), meeting someone at a time (arc 7), talking about the people with you (arc 3), saying you can't drive (arc 6), catching a number (arc 5), repairing when lost (Pre-A1 plus two new frames). Nothing fundamental was missing, so nothing was added back.
- **kept out on purpose** despite being tempting: spelling your name aloud, and `How was your day?` — both need a system A1 does not have.

Result: seven arcs, sixteen A1 capabilities (thirteen required), twenty-one episodes.

## 18. Risks

Recorded with mitigations in the blueprint: textbook drift, pattern overload, intent explosion, Garden explosion, the `can` ambiguity, the thin transactions branch, A1 arriving as a single chunk, and copy volume across eight locales. The two worth watching hardest are the `can` sense-collision, which is a genuine evaluator design problem, and per-arc chunking, which is cheap now and expensive later.
