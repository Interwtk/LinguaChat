# Knowing about the curriculum without downloading it

What travels in the first chunk, what waits until it is needed, and how that is held in place.

- **Source of truth:** `linguachat-frontend/src/learning/episodes/index.js` — the seventeen episodes, prose and all.
- **Generated shape:** `src/learning/curriculum/preA1Skeleton.generated.js` — written by `npm run build:skeleton`.
- **Enforcement:** `npm run check:curriculum-loading` · `check:bundle-boundaries`.

> **Architecture note.** Supabase integration is deferred until the functional product is complete. Nothing here fetches anything from a server: the split is between JavaScript chunks the browser already knows how to load on demand.

---

## The problem

Everything the product needs before a learner opens anything is structural: which episode comes next, what it teaches, which language is due, whether they are ready to leave the level. None of it is a word Lingua says.

But every one of those answers was derived by walking the episode definitions — the right design, since a question answerable from the episodes should be answered from the episodes — and the definitions are mostly prose. So asking "what should I do today?" loaded all seventeen episodes, every prompt, every scene, every model answer and both hosted stories, into the chunk a learner downloads before the first screen appears.

## The split

The structure is extracted at build time into a **skeleton**: step types, evaluation intents, language item ids, keys, prerequisites, garden grants, and the hosted stories' turns opened out. Everything a derivation reads; nothing a screen renders.

| reads the skeleton (eager) | reads the episodes (on demand) |
|---|---|
| `preA1Map.js` — every derived accessor | `EpisodeShell` — plays an episode |
| `readiness.js` | `SessionRunner` — plays a block |
| `scaffolding.js` | `ConversationRoom` — the practice screen |
| `session.js` (via callers) | |
| Home, the journey rail, completed episodes | |

Most of the eager side now reads the skeleton **through the level registry** rather than whole — `episodesOfLevel(PRE_A1)`, so a second level cannot leak into an answer about the first. Which modules, and the two that deliberately stay global, are in [a1-authoring-contract.md](a1-authoring-contract.md).

The episode definitions remain the single source of truth. The skeleton is generated from them and `check-curriculum-loading` regenerates it on every run and fails if the committed copy differs, so it cannot drift from the curriculum it describes.

One derivation genuinely reads the English: which parts of the learner an episode personalises, taken from the `{name}`-style placeholders in its own text. The generator extracts the placeholder **names** and leaves the sentences behind, so the answer is still derived from the episodes.

## Before and after

Measured on the real build (`npm run build`, sizes as `check-bundle-boundaries` reports them):

| | before | after |
|---|---|---|
| entry chunk | **403.4 kB** | **363.8 kB** |
| episode chunk (`ConversationRoom`) | 118.3 kB | 162.3 kB |
| chunks | 15 | 16 |
| total JS | 978.5 kB | 1002.2 kB |

The first download is 39.6 kB smaller; the total is slightly larger because the same code now travels in a chunk of its own. That is the trade being made deliberately: nobody pays for the level until they open it.

Three moves got there, and one did not:

- the curriculum content itself, via the skeleton (**−17 kB**)
- the seed vocabulary, which the app-wide context needed only in order to grant Garden items — the episode screen has the catalogue loaded anyway and now hands over what it granted (**−17 kB**)
- `getLocalizedMeaning`, a pure function that lived in the module owning the catalogue, so importing it from Home hoisted 22 kB of terms and translations into the entry (**−5 kB**)
- the declared audit judgements (`CAPABILITY_MAP`, `PATTERN_COVERAGE`) moved to `preA1Audit.js`, read only by checks and docs (**0 kB** — tree-shaking already dropped them; the split is module hygiene, not a saving)

### And after the level boundary was drawn

The A1 architecture readiness sprint added the registry and the content resolver, and the resolver's dynamic import moved the episode definitions out of the practice screen's chunk into one of their own. Measured the same way, on the same machine, `HEAD` (`9003fc5`) built in a separate worktree against the working tree:

| | before | after |
|---|---|---|
| entry chunk | 364.0 kB (107.8 gzip) | **365.6 kB** (108.3 gzip) |
| episode content | inside `ConversationRoom`, 159.6 kB | its own chunk, `preA1Content`, 35.4 kB |
| practice screen chunk | — | `ConversationRoom`, 124.3 kB |
| chunks | 16 | **17** |
| total JS | 1002.8 kB | **1004.6 kB** |

The entry grew by **1.6 kB** — the registry and the resolver, both of which the first screen genuinely uses. Opening practice costs 159.8 kB in two requests where it cost 159.6 kB in one: the same bytes, one more round trip, and each level's content now arrives separately, which is the point. Nothing moved into the entry: the leak probes still find no episode prose there.

What is left in the entry is what the first screen genuinely needs: React (128.6 kB), the English base dictionary (56.9 kB, the fallback for every locale), the learner model, the planner, and the skeleton.

The Vite warning threshold is untouched at its default 500 kB. `check-curriculum-loading` fails if `chunkSizeWarningLimit` ever appears in `vite.config.js` — a budget met by silencing the warning is not met.

## What the checks hold

- the committed skeleton is byte-identical to a fresh generation
- the skeleton contains no sentence that only exists in the episodes
- the registry's answers still come out right for all seventeen episodes
- no episode-only sentence appears in the entry chunk, and neither does the vocabulary catalogue
- the shape *is* in the entry — Home cannot plan the day without it
- the content is in a chunk that some other chunk fetches by name, that `index.html` does not preload, and that is not named like the entry — the entry is identified by reading `index.html`, not by a filename pattern, after a content chunk built from `episodes/index.js` was briefly mistaken for it
- the entry is under 400 kB with the warning limit at its default
- a chunk that fails to arrive is caught, reported in the learner's language, and retryable — the boundary loads modules itself rather than through `React.lazy`, which would memoise the failure for the rest of the page's life, and a second attempt reloads once (guarded) to clear a cached failure after a stale deploy
