# Talking about what the learner cares about

Two people can practise the same English and have different conversations. This says how that is decided, what it is allowed to change, and what it must never touch.

- **Catalogue:** `linguachat-frontend/src/learning/engine/interests.js`
- **Selection:** `src/learning/engine/topicSelection.js`
- **Story contract:** `src/learning/engine/storyPersonalization.js`
- **Day memory:** `src/learning/engine/memoryContext.js`
- **Enforcement:** `npm run check:interest-personalization` · `check:semantic-slots` · `check:learner-facts` · `check:memory-and-story` · `check:personalized-home` · backend `pytest`

> **Architecture note.** Supabase is still out of scope. Interests are a local preference in `lc2-tutor-preferences`; the cooldown and today's dismissals live in `lc2-memory-context-v1`. Nothing is uploaded, and no analytics were added.

---

## The one thing this layer may change

> **Pedagogy decides what you practise. Interests decide what you talk about while practising it.**

`practise simple questions` + `roleplay` + `gaming` is a conversation about games. The same capability, the same evidence, the same threshold — a different subject. Everything below exists to keep that sentence true, because the moment a hobby changes what counts as mastery, personalisation has become a fairness bug.

Four signals are kept apart on purpose, and none is derived from another:

| signal | means | lives in |
|---|---|---|
| **explicit interest** | a box the learner ticked | `lc2-tutor-preferences.interests` |
| **learner fact** | something they told Lingua (`origin = Bogotá`) | the learner model's facts |
| **activity preference** | how they like to practise (`mini_story`) | the learner model |
| **recent topic** | what a recent conversation was about | `lc2-memory-context-v1` |

`origin = Bogotá` never becomes `interest = colombia`. One conversation about films never becomes `explicitInterest = movies`. Mentioning something is not choosing it, and the checks assert that the modules cannot even see each other's data.

## The catalogue

Twenty interests, each a stable id with a localized label in all eight interface languages. An id is never a label: `games` is stored, "Videojuegos" is displayed.

Each entry carries two different kinds of thing, and confusing them is how this project used to ship *"Two music."*:

- **target-language values** — `targetNoun`, `objects`, `activity`. These end up inside an English sentence the learner is graded on, so each is checked against `semanticContext`: a noun that cannot be liked cannot be in the catalogue.
- **conversation topics** — `facets.topics`. These are never graded. They are what free chat may talk *about*, so they can be a little richer: "game worlds", "how buildings are made", "simple experiments".

Plus a short, explicit `related` list (never a recommendation graph) and an optional `nugget`.

**Selection maximum: 20**, which is the whole catalogue — the cap is a bound on what storage and the UI have been tested with, not a limit anyone should feel. Choosing **nothing** is a legitimate answer that survives a reload.

### Declared imperfections

Kept visible rather than quietly tidied:

- `school`'s target noun is `books` and one of its objects is `science`, which overlaps `books`-like and `science` territory. The ids and their target-language values are **unchanged from frozen Pre-A1 behaviour**: re-facetting them would change the sentences a Pre-A1 episode produces for learners who already chose `school`, and Pre-A1 is frozen. So the overlap stays, described.
- `culture` produces the noun `art`. Same reason.
- Most interests have **no countable object**, so any slot needing a thing falls back. That is the correct answer, not a gap: "two histories" is not a sentence anyone needs.

## Choosing a topic

`selectTopic({ explicitInterests, recentTopics, dismissedTopics, acceptedSemanticTypes, strength, seed })` → one topic, always.

- **Deterministic.** No `Math.random()`, no `Date.now()` inside the engine. The same learner, day and context get the same topic, so a reload cannot change what a story is about. Every day-dependent test injects its clock.
- **Cooldown.** Recently used topics wait; with everything on cooldown the list comes back rather than starving.
- **Mix.** Mostly what they chose, sometimes something related, occasionally something new. The weights are `TOPIC_MIX = { explicit: 70, related: 20, exploration: 10 }` and are labelled **UNMEASURED PRODUCT CONSTANTS** in the source. Nothing has been tested; the checks assert the *shape* (all three happen, explicit dominates), never the numbers.
- **Compatibility.** A caller says which semantic types it can use. An interest that cannot supply one is skipped, not forced.
- **Neutral fallback.** With nothing suitable, an everyday context. A correct neutral conversation beats a wrong personalised one.

### Strength, by surface

| surface | strength | behaviour |
|---|---|---|
| free chat | **strong** | the full mix; may explore outside what was chosen |
| daily session, generic practice | **medium** | inside what they chose, rotated, dismissals respected, no exploring |
| curriculum stories | per template | only what the template declares (see below) |
| a story that must stay controlled | none | the situation is the lesson |

Medium is stricter for a reason: a session's subject is **promised on Home**. Telling somebody "today is about cars" when they never mentioned cars is personalisation they did not ask for, so a medium surface with no interests promises nothing at all.

## "Another topic"

The learner can always decline. Declining writes one id into a list that expires tonight and does nothing else: the interest stays selected, no score moves, no dislike is recorded, activity preferences are untouched. Tomorrow the topic can come back.

The cooldown window is the one thing that survives midnight — a cooldown that reset every night would let a daily learner meet the same interest every single morning.

## What free chat sends

One topic, and only with the opening message.

```
optional_context: { topic: "games", topic_facet: "game worlds" }
```

**Not sent:** the other nineteen interests, the recent-topic history, why this topic won, any weight or score, the learner model, the Garden, readiness, milestones, XP, activity preferences. The selection already happened on the device; the provider only needs its result.

The interest list used to travel in full on every message — twenty ids for a prompt that can use one — and is now stripped before the request is built.

After the first exchange no topic is sent at all: whatever the conversation became is what it is about. A learner who writes about their dog gets a conversation about their dog, and the provider is explicitly instructed never to steer back.

**Server side.** A topic must look like an id (`^[a-z][a-z0-9_]{0,31}$`) and a facet like a short plain phrase; anything else is dropped, with no error. The server deliberately does **not** own the catalogue — an id it has never heard of is harmless as context, while a sentence, a URL or an instruction is not, and that is what the shape check refuses. Since ids come from a controlled catalogue and free-text interests do not exist, there is no path from learner input into a prompt.

## Educational nuggets

Optional, short, and always second to English practice. The policy is the deliverable, not a fact database:

- high-confidence general knowledge that does not expire
- no numbers, dates, records, rankings or superlatives
- nothing medical, legal or financial
- nothing that claims Lingua has a life: no *"I play that too"*, no *"I went there last year"*
- **with nothing safe to say, just have the conversation**

A handful of catalogue entries carry one sentence each; most carry none, and the checks reject any nugget containing a digit or a superlative. Language complexity follows the learner, never the topic: an A1 learner interested in AI gets a simple question about it, not a sentence about attention mechanisms.

If richer factual content is ever wanted, the order is **curated content or retrieval first**, then generation — not free generation with a stern prompt. Nothing like that is implemented and nothing here needs it.

## Future stories

A future A1 story may declare `personalizationMode: none | light | themed`, the slots it accepts (`object`, `activity`, `topic`, `subject`) and a `neutralFallback` for each. The contract is in [a1-authoring-contract.md](../curriculum/a1-authoring-contract.md).

Personalisation may change safe nouns, background and framing. It may never change `canDoId`, the intent, the required evidence, the difficulty, the XP or which branch is correct — a template that tries is refused rather than obeyed. **No Pre-A1 story was touched**, and no A1 episode exists: the contract is proven with a synthetic template inside the check.

## Privacy

Interests are personal preferences, so they are treated as small and local: no cloud storage, no analytics, no new logging, no transcripts. The topic memory records an id and a day key — never a message, a reply or a prompt. Nothing here is used for notifications, engagement pressure or a paywall: thematic personalisation is core product, on every plan.

The onboarding catalogue contains no category that could profile politics, religion, health, sexuality, race or finances, and free-text interests are deliberately not supported yet — they would open semantic ambiguity, prompt injection, localisation and moderation all at once.

## What the checks hold

- the ids offered at onboarding are exactly the ids the engine understands, with one cap for both surfaces
- every catalogue noun can be liked; every object facet is a thing the semantic layer can count; every nugget is free of numbers and superlatives
- storage survives duplicates, unknown ids, wrong types and corrupt JSON without losing a valid choice
- an empty selection persists instead of springing back to a default
- selection is deterministic and uses neither the clock nor randomness
- the topic just used is not the next one; over thirty contexts most of a five-interest list is used; with twenty interests the first indices do not monopolise
- one interest still meets other subjects sometimes; related and exploration contexts both really occur
- a declined topic is not chosen again today, is not deselected, and may return tomorrow — while the cooldown survives the day boundary
- a slot needing a countable thing is never handed an abstraction
- the provider payload is exactly one topic and one phrase, travels only with the opening message, and never carries the reason
- the backend refuses any topic that is not an id, and any facet that is not a short plain phrase
- a synthetic story personalised two ways teaches identically; a template that tries to personalise the lesson is refused
- the learner model is still v7 with no interest fields; none of these modules can award XP, grant Garden items, or reach readiness
- A1 still has zero runtime episodes
