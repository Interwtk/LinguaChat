# What a level is, and what an episode has to declare to be one of its own

The boundaries A1 will be built against. This file is about **structure**, not content: the design of A1 lives in [`a1-map.md`](a1-map.md) and [`a1-blueprint.json`](a1-blueprint.json), and nothing in the product reads either of them.

- **Registry:** `linguachat-frontend/src/learning/curriculum/levels.js`
- **Resolver:** `src/learning/curriculum/episodeContent.js`
- **Enforcement:** `npm run check:curriculum-authoring` · `check:a1-blueprint` · `check:curriculum-loading`

> **Architecture note.** Supabase is still out of scope. Levels, content loading and progress are local: the registry is a module, and loading a level means fetching a JavaScript chunk the browser already knows how to fetch.

---

## The problem this closes

Until now "the curriculum" and "Pre-A1" were the same seventeen episodes, so every derivation could walk the whole thing and be right by accident. Readiness, Home's progress, the next episode, the replay list and the daily session all did exactly that.

That is correct for as long as one level exists, and silently wrong on the day a second one does — not by crashing, but by answering a Pre-A1 question with A1's episodes. A learner would have seen `17/38`, been offered an episode of a level they cannot open, and stopped graduating, because completion would have needed episodes nobody had written.

So the boundary is drawn now, while there is exactly one level and the answers can be compared before and after.

## The registry

A level is a row with five fields, and the honesty is in the last three:

| field | means |
|---|---|
| `id` | the internal id (`pre_a1`, `a1`) — also the key used by learner-model milestones |
| `order` | the sequence a learner moves through |
| `implemented` | there is runtime content for it |
| `available` | a learner may open it |
| `episodeLevel` | the string an episode of this level declares in its own `level` field |

Today: `pre_a1` is implemented and available; **`a1` is known, planned, and neither**. Those are different states on purpose. "Known" is what lets the product name the level in a check, map an episode to it, and refuse it for a stated reason. "Implemented" is a fact about content. "Available" is a decision about learners — an implemented level can still be closed while its first arc is being finished.

Three rules the registry keeps:

- **An unknown level is nobody's level.** `getLevel('a2')` is `null` and `episodesOfLevel('a2')` is `[]`. It never falls back to the level that happens to be available — a fallback would answer a question about a level that does not exist with another level's episodes, which is the bug class this whole file exists for.
- **`episodesOfLevel` is derived, never declared.** It filters the generated skeleton by `episodeLevel`. There is no hand-maintained list of which episodes belong to which level, so a level cannot claim an episode it does not contain.
- **A planned level has no content loader.** `hasContentLoader('a1')` is `false`, and every path that could load content refuses before importing anything.

`episodeLevel: 'A1'` in the registry is not A1 existing. It is the registry knowing what an A1 episode *would* call itself, which is how the filter will recognise A1 content on the day there is any. `check:a1-blueprint` asserts that exactly two files may name the level — the placement questions and the registry — and that the registry keeps A1 `implemented: false, available: false`.

## Who asks the registry

Every derivation that answers a question **about a level** now takes its episodes from the registry rather than from the curriculum:

| module | the question it answers |
|---|---|
| `curriculum/readiness.js` | is this level finished, is this capability taught |
| `curriculum/preA1Map.js` | Pre-A1's capabilities, items and coverage |
| `components/today/TodayView.jsx` | Home: progress, next episode, the completion card |
| `context/AppContext.jsx` | which episodes a session may draw on |
| `components/episode/CompletedEpisodes.jsx` | what may be replayed |

Two modules deliberately do not, and both are asserted so the exception stays deliberate:

- **`engine/scaffolding.js`** reads the whole curriculum, because it answers "how much help does this learner need for *this capability*", and a capability's home episode may belong to any level. Scoping it would stop transferring autonomy across the level boundary.
- **`engine/planner.js`** mentions no level at all. It is handed a list of episodes and plans within it, so the level lives at the call site.

## The contract an episode must satisfy

`check:curriculum-authoring` applies this to every runtime episode, and proves it rejects each violation using synthetic episodes that are never added to the registry. A future A1 episode must declare:

1. a unique `id`, and a `level` the registry knows
2. an `arc` that is a declared arc
3. a `canDoId` the curriculum map knows, with an intent mapped to it
4. `prerequisites` (if any) that resolve to episodes that exist
5. at least one step, and — unless it declares `reinforces: true` — a productive turn (`free_reply` or `recall`, or a story `reply`) whose `evalKind` is its own capability's intent
6. for **every** intent it uses: the evaluator must reject nonsense for it, and the daily session must have **both** a `PROMPT` and a `MODEL_ANSWER` entry for it
7. semantic slots that are types the engine knows
8. `gardenItems` that exist in the vocabulary catalogue, granted once each
9. receptive and incidental items that are real vocabulary
10. `titleKey`, `goalKey`, `canDoNameKey`, `durationKey`, each present in the base dictionary **and all seven other locales**
11. resolvability: the content resolver must be able to reach it

Rule 6 is there because of a defect that shipped. The sixth arc's three intents were missing from the session runner's tables, so a consolidation block for a required capability showed the greeting prompt and graded the answer as an identification. Nothing failed and no check noticed; the capability simply could not be consolidated.

## How content loads

`episodeContent.js` has two doors, and both fail closed.

- `episodeRequest({ levelId?, episodeId })` — **synchronous**, reads only the registry and the skeleton, never content. `startEpisode` calls it before switching screens: an id that cannot be resolved leaves the learner where they were instead of opening episode one, which is what it used to do.
- `loadEpisodeContent({ levelId?, episodeId })` — **async**, refuses *before* importing, then imports only the chunk for that level (and, when a level has more than one, that arc).

Refusal reasons are distinct so a log says what happened: `unknown_level`, `level_not_implemented`, `level_unavailable`, `unknown_episode`, `episode_not_in_level`, `no_content_loader`.

Each level's content is imported through a module named after the level (`episodes/preA1Content.js`), so the build output names what a chunk carries instead of emitting a second `index-*.js`. The loading check enforces that a content chunk is distinguishable from the entry by name.

**Describing an episode never loads it.** Home, the practice listing, the replay list and session planning read the skeleton; only `EpisodeShell` and `SessionRunner` import the content, and they are loaded when they mount, through the retryable boundary. `check:curriculum-loading` asserts the list of allowed importers, so an A1 arc that reaches for its content from a listing screen fails the check rather than quietly making the list heavy again.

## Interest personalization

A future A1 episode may let a topic change what its story is *about*. Opting in is a declaration, and the declaration is small:

| field | means |
|---|---|
| `personalizationMode` | `none` — the situation is the lesson; `light` — safe details may change; `themed` — the template declares a controlled variant per topic |
| `slots` | slot name → slot type: `object` (a countable thing from `semanticContext.THINGS`), `activity`, `topic` (conversational, never graded), `subject` (the noun in "I like ___") |
| `neutralFallback` | the value for each slot when the topic has none. Most interests have no countable object, so this is the normal path, not the error path |
| `themes` | `themed` only: the variant per interest id |

**The invariant, and it is the whole contract:**

> Personalisation may change what the story is ABOUT. It may never change what the learner has to DO.

`canDoId`, every step's `evalKind`, the expected patterns, the required evidence, the difficulty, the XP and which branch is correct are copied through untouched. A template that lists one of them as a slot is **refused**, not obeyed — a story that grades differently depending on the learner's hobbies is not personalisation, it is a broken assessment. `invariantDrift(storyA, storyB)` is how an author proves two personalisations still teach the same thing.

A slot the topic cannot fill uses the template's own neutral value; a template with no neutral for it stays neutral entirely, rather than shipping a sentence with a hole in it. Unknown compatibility always ends at neutral: a correct neutral story beats a wrong personalised one.

Nothing about this is retrofitted onto Pre-A1 — that level is frozen and its stories were not touched. The contract is proven with a synthetic template inside `check:interest-personalization`, which is never registered as an episode. The rest of the design (catalogue, selection, cooldown, provider boundary, privacy) is in [interests.md](../personalization/interests.md).

## Arc 1 is implemented — what that changed

The first arc (`work_and_study`, episodes 18–20) exists as runtime content. The
seven steps below were followed, and two of them behaved exactly as this document
predicted they would:

- **`implemented` became `contentStatus`.** A boolean could not tell "the level has
  content" from "the level is finished", and A1 is the first level where those
  differ: three episodes of twenty-one planned. The registry now carries
  `contentStatus: none | partial | complete`, `hasRuntimeContent()` answers the
  resolver's question and `isLevelComplete()` answers the product's.
- **`available` did not move.** A1 is closed. Every learner-facing request is
  refused with `level_unavailable`, and the one way past that gate is an explicit
  `forLearner: false` used by tooling and asserted to appear nowhere else.
- **`check:a1-blueprint` failed on purpose**, exactly as this document warned. Its
  rule "no A1 content exists" had done its job and became "runtime A1 is exactly
  the blueprint's arc 1, and the other six arcs are still impossible".
- **Two checks turned out to be global where they should have been level-scoped**,
  and were corrected rather than relaxed: the Pre-A1 freeze counted the whole
  vocabulary catalogue (it now counts Pre-A1's share, still seventy-two), and the
  authoring contract walked Pre-A1's episode list (it now walks every runtime
  episode, with no exemption for A1).

Arc 1's own contract lives in `check:a1-arc1`, which reads the blueprint and
compares it to the runtime: episode ids, order, roles, capabilities, prerequisites,
budgets, reuse actually exercised by a step, and both capabilities produced in an
open turn with no model on screen.

## `independent: 2` is a level target, not an arc exit

The blueprint carries two evidence fields with the same name and different scopes,
and confusing them makes a finished arc look broken.

- `canDos[].evidence.independent` is the **capability's lifetime target**. Its scope
  is set by `exitCriteria.readinessDimensionsForA2`, which lists "required
  capabilities produced unaided" over "the 13 required A1 can-dos" and says of the
  threshold: *the number is chosen when there is evidence from real journeys, not
  now*. It is read at A1 readiness, which does not exist yet.
- `episodes[].evidence` is a **sentence about one episode**. For episode 19 it reads
  "one unaided question plus comprehension of the reply" — one, not two.

The engine records a can-do once per episode **run**. So one pass of arc 1 gives
`talk_about_work_or_study` two unaided uses (episode 18 teaches it, episode 20
integrates it) and `ask_about_work_or_study` one, because episode 19 is its only
home in this arc. The second arrives from a later run: a replay, a daily session, or
the reuse `reuseMatrix` schedules in arcs 2 and 6, where the row reads `["I","R",
"-","-","-","R","-"]`. Arc 1 supplying one is the design.

`check:a1-arc1` now asserts all of it — both blueprint fields, both runtime numbers,
the two contexts the statement capability comes from, and that a second run of
episode 19 is what reaches the target. Nobody has to re-derive this from the number.

## The render contract

A step must supply the fields **EpisodeShell actually dereferences**, and until this
closure nothing checked that. Arc 1 passed twelve groups and played end to end in
the journey harness while carrying `target: 'I work at home.'` on a `word_order`
step, which the renderer reads as `step.tokens.map(...)` — a crash on the fifth step
the first time a browser rendered it — and `promptEn`/`answerEn` on a `fill_blank`,
whose renderer reads `before`/`after`/`expects` and therefore drew an empty sentence
that accepted anything. The journey harness evaluates answers; it does not render.

`check:a1-arc1` group 13 now walks all twenty runtime episodes and asserts, per step
type, the fields its renderer reads. Pre-A1's seventeen episodes define the rule: an
early draft demanded exactly one correct option and `how_are_you` said otherwise,
because three different replies to "How are you?" really are fine.

One engine change came out of the same session: `fill_blank` gained `alternatives`,
because "I ____ at home" is completed truthfully with either `work` or `study` and
marking one of them wrong teaches a learner that their own life is a mistake.
`expects` remains the answer shown in the hint and the correction.

## Personalisation is derived, never declared

`personalisesOf` reads the placeholders an episode's own sentences contain. Arc 1
first shipped with a hand-written `personalizes: [...]` on four steps and no
placeholder anywhere, so it declared personalisation that nothing performed — the
exact "boolean somebody remembered to set" that `preA1Map` warns against. The
declaration is gone; `{name}` is in the prose where addressing the learner is
natural, and `check:a1-arc1` refuses both the dead field and any placeholder without
a guaranteed value.

## One registry, and the player goes through it

For three sprints there were two registries. The resolver knew about levels, arcs
and lazy content and **had no consumer**; `EpisodeShell` and `SessionRunner` read
`getEpisode` straight out of `episodes/index.js`, which knows Pre-A1 and nothing
else. That is why A1 arc 1 could be rendered only by substituting that module: the
component was correct, and the product had no way to hand it an A1 episode.

The player now resolves through `loadEpisodeContent`, which answers in order:

    episodeRequest      may this be opened? — synchronous, metadata only, and a
                        learner asking for a closed level is refused before any
                        import happens
    CONTENT_LOADERS     the arc's own chunk, imported on demand

`SessionRunner` asks `episodeRequest` for the same gate and lets the player fetch
the definition. Nothing in `src/` imports a content module any more — the only
import of content anywhere is the resolver's dynamic one, and `check:curriculum-
loading` asserts exactly that, in the source and again in the built chunks.

**Gating and content resolution are different responsibilities.** `forLearner`
defaults to true, so every product call site is gated; tooling passes false to run
an episode of a level that is built but not open. A1 stays `contentStatus: partial`,
`available: false`, and a learner reaching `what_you_do` gets "This episode cannot
be opened yet." — with no content fetched at all, because the gate runs first.

Measured on a fresh production build, Pre-A1 pays for the unification: the content
used to arrive in parallel with the player chunk, and now follows it. Click to
render, on localhost: `EpisodeShell` +4→18 ms, then `preA1Content` +24→31 ms. One
extra round trip, ~13 ms, covered by the boundary's loading state — in exchange for
one path instead of two and a level that can be added without touching the player.

## `work_or_study`, the fact arc 1 stores

`factsToCapture` marks it `store: true`, `semanticType: "place"`, source "learner
statement in arc 1", privacy "no employer names; a neutral category is enough", and
`personalization.safeSlots` lists it. Every one of those became a condition in
`captureStatedLifeFact`:

- **the value is the taught place** — `home`, `the office`, `university` — never the
  sentence and never the verb. "I work at Contoso" stores nothing, so the privacy
  note is enforced rather than trusted; "I study at University of Lima" stores
  `university`, which is the neutral category the note asks for;
- **only a `state_life_fact` turn the learner passed.** Recognising the frame in a
  closed step says nothing about their life;
- **only the learner's own words.** The model answer is authored content, identical
  for every learner, so copying it stores nothing — verified in the browser. Typing
  your own sentence stores it even with help on screen: the existing rule is "what
  the learner volunteered, never a corrected mistake", and volunteering is about
  authorship, not about scoring. A learner who used help still told us something
  true about themselves.

It is its own fact type, beside `place`, because `place` is where the learner is
FROM and handing a consumer an office when it asked for a hometown would be worse
than remembering nothing. No migration and no new model version: an older model
simply has no facts of the type.

**A fact is not mastery and not an interest.** Capturing one touches no can-do, no
item, no episode progress and never `tutorPreferences.interests`. Update policy is
the store's existing one, unchanged: the same value said again is believed a little
more, a different value is added beside it, and a replay cannot grow the list.

`check:a1-arc1` group 14 reads `arcs[].factsCaptured` rather than the id, so a future
arc that declares a fact with no capture path fails without anybody editing the
check — which is the gap this closure existed to fill: `work_or_study` was marked
`store: true` from the day the blueprint was written, and the runtime quietly did
not store it.

## Arc 2 is implemented — what it cost

`daily_rhythm`, episodes 21–23, was built on the pipeline arc 1 left behind. What it
needed was **one line in the loader map, one new content module, one new check** —
no architecture sprint, which was the question this arc existed to answer.

| | |
|---|---|
| 21 `my_day` | `talk_about_daily_routine` — actions, and how often |
| 22 `at_seven` | `say_when_something_happens` — the same actions, in time |
| 23 `what_does_it_mean` | `ask_what_something_means` — a word taken out, and the conversation kept |

**Eight productive items, which is the arc's whole budget, and four of them are
patterns.** The blueprint calls arc 2 "the level's densest moment" and answers its
own risk — "the verb budget is five actions and the frequency set is two adverbs" —
so the words are two actions (`get up`, `have breakfast`) and two adverbs
(`usually`, `sometimes`), and the routine is built out of arc 1's `work` and `study`
as well. Four actions inside a ceiling of five. Two receptive items, `early` and
`late`, exist because episode 23's story has to carry words nobody taught.

**One new intent, not three.** `state_routine` carries a `timeForm` subtype
(`null | part_of_day | clock`), which is the blueprint's rule applied rather than
worked around: *"One intent per communicative function. Variants travel as a subtype
on the step payload, the way Pre-A1 already carries repairKind, quantityForm and
thingId — not as a new intent."* That is also why `say_when_something_happens` has no
intent of its own: two can-dos map to `state_routine`, the step demands a time
through the subtype, and each capability is credited by the episode that teaches it.
Asking what a word means is `repair_request` with a fourth `repairKind`,
`ask_meaning` — prescribed by the can-do itself via `intentReuse`.

**One new semantic type.** `time_point`, because the blueprint says why: *"An hour is
neither a place nor an object; a slot that accepts it must reject 'Madrid' and
'water'."* `day`, `relation` and `transport_mode` are proposed for arcs that do not
exist and are deliberately unregistered — a type with no consumer makes coverage look
real. The hours stop at ten, because `time_at_pattern` declares `numbers_1_10` as its
prerequisite and eleven upwards arrives in arc 5.

**Reuse is a turn, not a list.** The blueprint's reuse matrix marks five older
capabilities `R` in this column, and `check:a1-arc2` reads that column and requires
each one to be **evaluated** by a step: `use_small_numbers` (the hour is a number),
`express_preferences` (what you like doing in the evening), `ask_for_repair` (a time
said too fast), `talk_about_work_or_study` and `ask_about_work_or_study` (arc 1's
frame is the routine's frame). There is no "review arc 1" unit; arc 1's language comes
back inside a situation that needs it, and playing both arcs in order takes its
statement capability past its evidence target for exactly that reason.

**`usual_time` is captured, not deferred.** The lesson arc 1 taught the hard way. The
blueprint marks it `store: true`, `semanticType: time_point`, privacy "harmless",
reused by `making_arrangements`, and `captureStatedUsualTime` turns each clause into a
condition: the value is the taught hour (`taughtHourIn` reads "at seven" and "at 7"
and refuses "at eleven"), only from a `state_routine` turn the learner passed, only
from their own words. A part of the day is not stored — "in the morning" cannot become
a meeting.

**Arc 2 does NOT consume the story personalisation contract, and that is a finding
rather than an omission.** The blueprint declares no `personalizationMode` anywhere,
and episode 23's story carries two words the learner must ask about: letting a topic
change them would change what the learner has to DO, which the contract refuses. What
arc 2 does personalise is what Pre-A1 already personalises — the `express_like` reuse
turn takes its subject from the existing interest/fact context — and `{name}` in the
prose. Both derived, never declared.

### Two arc-1 assertions that were really level assertions

Neither was relaxed; both were made precise. `check:a1-arc1` asserted
`A1_RUNTIME_ARCS` deepEqual `['work_and_study']` and measured the vocabulary budget
against `A1_INTRODUCED_ITEMS` — the *level's* share. Arc 2 arriving therefore read as
arc 1 regressing. Arc 1's check now asserts arc 1 is the FIRST runtime arc and
measures the budget on what arc 1's own episodes grant; "which arcs exist" belongs to
`check:a1-blueprint`, and each arc sprint moves exactly one id across a list that is
otherwise still closed.

### One real bug the arc exposed

A1's intents were never added to `OBJECTIVE_FORMATS`, and an **unlisted objective is
allowed every format**. So a practice block for `state_life_fact` could be planned as
a `mini_story`, and `getStory` answers an objective it does not know with the café
scene: the learner would have been shown a conversation about music and graded on
saying what they do. Arc 2's story made it visible, because a story hosted by an
episode must never be plannable as a loose block and the check that says so finally
had two of them to compare. All five A1 intents are now listed, with `mini_story`
absent from every one.

## Arc 3 is implemented — one capability, three episodes

`people_around_you`, episodes 24–26, built on the same pipeline for the third time:
**one line in the loader map, one content module, one check.** What made this arc
different is not the plumbing, it is the shape of the thing being taught.

| | |
|---|---|
| 24 `this_is` | `introduce_someone_else` — the frame, with or without a relation |
| 25 `shes_a_student` | the same capability, said about them: `he/she is` |
| 26 `three_of_us` | the same capability, held inside a whole conversation |

**One capability across three episodes, so the evidence target is reached INSIDE the
arc.** This is the exact inverse of arcs 1 and 2, and it settles the `independent: 2`
question from the other side. A can-do is credited once per episode RUN. Arcs 1 and 2
taught three capabilities in three episodes, so one pass gave each of them one unaided
use and the second had to come from a later run. Arc 3 teaches ONE capability in three
episodes, so a single pass produces three unaided uses and `introduce_someone_else`
reaches `can_do` before the arc ends — which is exactly what its evidence target
describes: *"two unaided introductions of a third person, one of them inside a greeting
sequence"*. Reaching a can-do target is still not readiness, graduation or a milestone;
A1's threshold stays deliberately unchosen.

**One capability, TWO intents.** Presenting somebody (`introduce_person`) and saying
something about them (`state_person_fact`) are different sentences, and both are this
capability's evidence. `A1_CAN_DO_INTENT` still maps one can-do to one intent, because
coverage, the planner and the authoring contract all read it that way; the second
intent lives in `A1_CAN_DO_EXTRA_INTENTS` and `a1IntentsOf(canDoId)` returns both.
Nothing that asked "which intent evidences this capability" silently started receiving
a list.

**The first `hybrid` capability in A1, in the blueprint's sense of the word.** Hybrid
does not mean "ask a provider": the canonical frames — `This is Ana.`, `This is my
friend Ana.`, `Ana, this is Ben.`, `She is a student.`, `He's a teacher.` — are judged
locally and settled. What escalates is the band the local evaluator does not claim to
know, returned as `conclusive: false`; with no provider reachable the conservative
local verdict stands and the learner keeps a hint and a retry. `Meet Ana.` and `She
works at the office.` pass as variants — the second is MORE than the turn asked for,
and the arc hears the third-person `-s` without ever requiring it.

**One new semantic type, and it refuses more than it accepts.** `relation`, because the
blueprint declares it `requiredBy: introduce_someone_else`. Three neutral values —
`friend`, `colleague`, `classmate` — and the slot refuses a place, an object, a feeling
and a name, so "This is my the office." cannot be built. The arc's risk note is a rule
here, not a caveat: no family vocabulary, no assumed family structure, and `This is
Ana.` with no relation at all is a complete introduction.

**Arc 3 captures NO fact, and hosts NO story.** Both are the design's decisions, and
both are asserted rather than omitted. `factsCaptured: []` — the person in this arc is
one the EPISODE named, not somebody in the learner's life, and the fact it could have
stored is named and refused by the blueprint itself: `relation_names`, `store: false`,
*"Naming a learner's family is personal data with no reuse the curriculum needs; the
arc works with a neutral partner."* `FACT_TYPES` cannot hold it. And `miniStory.use:
false` — *"Three-way introductions are better felt as a roleplay with a named partner
than as a narrated scene"* — so arc 3 does not become the first consumer of the story
personalisation contract either. What "no fact" means precisely is **no new fact**:
capture is an engine rule, so a learner who states what they do during arc 3's reused
`state_life_fact` turn still stores arc 1's fact, from arc 3's episode.

**Eight capabilities return, one of them consolidated.** The reuse matrix marks seven
`R` and one `C` in this column, and the legend distinguishes them: `R` is a promise
about the arc, `C` — "consolidated in an integrated conversation" — is a promise about
one episode. So episode 26 holds the whole exchange in a single roleplay chain:
greeting → introduce the third person → ask how somebody is → ask what a word means →
say what you do → say what they do → say goodbye, with the suggestion withheld, and a
recall turn afterwards as a coda.

### The systemic bug this arc had to fix first

Arc 2 exposed it and patched the symptom; arc 3 could not be built on top of it. An
objective the format table did not list was allowed **every** format, and `getStory`
answered an objective it did not know with the café scene. So a block for an unknown
objective could be planned as a `mini_story`, and the learner would be shown a
conversation about music and graded on something else. Fixing it by adding arc 3's
intents to `OBJECTIVE_FORMATS` would have protected the two new cases and kept the bug.
The fix is general and fails closed: an unlisted objective may take any format EXCEPT
the ones that need authored content, `getStory` returns `null` rather than somebody
else's story, and `MiniStory` skips the block instead of rendering a scene that belongs
to another objective. `check:memory-and-story` holds it permanently against a list of
strangers, including an empty string and `null`.

### The subtype that had to travel

`partner_name` — WHO the turn is about. It is a property of the TASK: the episode chose
the name, the shell derives it deterministically per learner, and it is never a person
from the learner's life. It now travels step → runner → router → local evaluator →
provider payload, because without it the model answer said "This is Ana." to a learner
whose partner on screen was somebody else. The provider allow-list in
`test_the_provider_only_receives_linguistic_context` was extended deliberately, with
that reason written next to it.

### One arc-2 assertion that was really a level assertion

The third instance of the same pattern, and again made precise rather than relaxed.
`check:a1-arc2` hardcoded "five arcs remain planned after this one" and required the
level to hold exactly two arcs, so arc 3 arriving read as arc 2 regressing. Both are
now derived from `A1_RUNTIME_ARCS`, and arc 2's check asserts what belongs to arc 2:
its own episodes are still in the level, and every capability THESE arcs teach has
evidence. Its premature-semantic-type list is derived from the blueprint's `requiredBy`
too — `relation` stopped being premature the moment its consumer existed.

### The entry-chunk budget, restated

`check:curriculum-loading` capped the entry chunk at 400 kB. Arc 3 crossed it without
one word of episode prose entering the entry: what grows is the generated skeleton and
the base dictionary, both curriculum DATA the entry legitimately carries and both
growing a few kB per authored arc by design. A single number conflated that with the
app's own code, so the budget now measures them separately — the app's share capped
hard, the data's share capped per episode — and a content leak, being an order of
magnitude denser, still lands in the app's share and trips the same wire.

## To implement episode 18, the author will

The migration path, concretely — this is what the arc-1 sprint did, and nothing in it is a change to Pre-A1:

1. **Write the content.** `src/learning/episodes/a1Arc1.js` — episode 18 declaring `level: 'A1'`, `arc: 'work_and_study'`, its can-do, its steps. The blueprint says what; the eleven rules above say in what shape.
2. **Name its chunk.** `src/learning/episodes/a1Arc1Content.js`, re-exporting arc 1 the way `preA1Content.js` re-exports Pre-A1.
3. **Register the loader.** One entry in `CONTENT_LOADERS`: `[A1]: { work_and_study: () => import('../episodes/a1Arc1Content.js') }`. Until that entry exists, every attempt to open an A1 episode refuses with `no_content_loader`.
4. **Teach the map its capability.** `CAN_DO_INTENT` needs `talk_about_work_or_study`, and the new intent needs an evaluator branch, a `PROMPT` and a `MODEL_ANSWER` in `SessionRunner`, and semantic slots if it takes any.
5. **Translate its keys** in the base dictionary and all seven locales.
6. **Open the level, when the arc is playable:** flip `implemented` and then `available` on the A1 row. These are two separate decisions and can be taken in two separate sprints — an implemented, unavailable level is a legal, tested state.
7. **Run `npm run build:skeleton`.** The generated skeleton is what every derivation reads; `check:curriculum-loading` fails if the committed copy differs from a fresh generation.

What the author will **not** have to do: touch readiness, Home, the planner, the replay list, or the session builder. They ask the registry, and the registry will already know.

Two things the checks will start requiring at that point, by design:

- `check:a1-blueprint` currently asserts A1 is `implemented: false, available: false`. Step 6 makes that assertion fail — deliberately. It is the point at which the sprint doing it must update the check to say the level is open, which is a visible decision rather than a quiet drift.
- Pre-A1 graduation and the A1 milestone are separate: `MILESTONE_LEVELS` is `['pre_a1']` and no A1 readiness function exists. Adding one is A1's own work, not part of opening the level.

## What the checks hold

- the registry knows Pre-A1 and A1 in order, with A1 unimplemented and unavailable
- an unknown level resolves to nothing and inherits nobody's episodes
- Pre-A1 is seventeen episodes; A1 is zero while it is planned
- all seventeen runtime episodes satisfy the authoring contract
- twelve synthetic violations of it are refused, each for the right reason
- content resolution refuses five bad requests synchronously **and** asynchronously, with matching reasons
- every Pre-A1 arc has a loader; A1 has none
- with a synthetic foreign level present, Pre-A1's episode list, capability count and required-core count are unchanged, and the foreign episodes are recognised as A1 and cannot be opened
- the five level-scoped modules really call `episodesOfLevel(PRE_A1)` and no longer walk the whole skeleton; the two exceptions say why they are exceptions
- `startEpisode` refuses an unresolvable id instead of substituting `first_greeting`
