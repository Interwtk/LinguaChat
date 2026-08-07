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

## To implement episode 18, the author will

The migration path, concretely — this is what the next sprint does, and nothing in it is a change to Pre-A1:

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
