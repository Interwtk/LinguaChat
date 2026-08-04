# Pre-A1 — what it teaches, and what it still owes

This document explains the level. The code decides it.

- **Source of truth:** `linguachat-frontend/src/learning/episodes/index.js` — the fifteen episodes.
- **Audit metadata:** `linguachat-frontend/src/learning/curriculum/preA1Map.js` — judgements a program cannot make, plus derived accessors that read the episodes rather than copy them.
- **Enforcement:** `npm run check:curriculum-map` — every claim below that can be verified, is.

Nothing at runtime reads this file. If the markdown and the code disagree, the code is right and the markdown is stale.

> **Architecture note.** Supabase integration is deferred until the functional product is complete. All learner progress — XP, mastery, episode runs, Memory Garden, learner facts, daily sessions — remains local to the device.

---

## 1. The philosophy

LinguaChat teaches **capabilities**, not lessons. An episode exists because a learner cannot yet do something they will need to do, and it ends when they have done it. The unit of progress is a can-do that survives outside the screen it was learned on.

Three commitments follow, and the audit measured all three:

1. **A learner is never wrong for being correct.** "I want water." in a café is blunt, not broken, and the café arc says so.
2. **Understanding is learning.** Some language is only ever heard. Counting it as production would inflate the curriculum.
3. **Evidence beats completion.** Finishing every screen is not the same as being able to do something unaided.

---

## 2. What exists today

**15 episodes · 5 arcs · 26 intents · 14 can-dos · 51 Memory Garden items · 66 vocabulary entries · 870 XP.**

| Arc | Episodes | Capability |
|---|---|---|
| `greetings` | 1 Tu primer saludo · 2 ¿Cómo te llamas? · 3 Mucho gusto | greet, say your name, ask a name, close a greeting |
| `connect` | 4 ¿Cómo estás? · 5 ¿De dónde eres? · 6 Tu primera conversación | ask/answer wellbeing, ask/answer origin, hold the four together |
| `choose` | 7 Lo que te gusta · 8 Lo que quieres · 9 Hagamos un plan | like/dislike, ask a preference, want/need, accept/decline, agree a plan |
| `cafe` | 10 Un café, por favor · 11 ¿Algo más? · 12 Tu primer pedido | polite request, answer a follow-up, close an order, thank service |
| `repair` | 13 Cuando no entiendes · 14 Pide que lo repitan · 15 Seguir en la conversación | say you did not understand, ask for a repetition, ask for slower speech, close an encounter |

Prerequisites form a single line: ep1 → ep2 → … → ep15. One entry point, no cycles, every episode reachable.

Each arc is three episodes: **teach → extend → do it for real.** The third episode of every arc drops the exercises and becomes a conversation.

### The repair arc, and the decisions inside it

**Repair is one capability with three strategies, not three capabilities.** Saying you did not
understand, asking for a repetition and asking for slower speech are subtypes of a single
intent — `repair_request` with a `repairKind` — because a learner who has any of them has the
strategy, and because a flat list of intents becomes three hundred if every sentence gets its
own. The strategy travels with the step and with the remote payload, so a turn that asked for a
repetition is never graded against "I don't understand."

**Two episodes, one can-do.** Episode 14 declares `reinforces: true` and shares
`ask_for_repair` with episode 13. Inventing a second required capability for it would have put a
capability on the exit criteria that the audit never declared required. Coverage still has
exactly one answer for "where is this taught" — the episode that does *not* declare
`reinforces` — and `check-curriculum-map` enforces exactly one primary per can-do.

**A repair is never the end of a turn.** Every repair in the arc is followed by the conversation
carrying on: the learner rescues the question and then has to answer it. A repair that led
straight to a completion screen would teach the phrase and drop the skill, and the check fails
an episode where no repair leads back into the conversation.

**Episode 15 hosts the real `mini_story`.** The story lives in `miniStory.js` alongside the
session stories and declares `home: 'episode'`; the episode renders the same `MiniStory`
component a daily session renders, handing down its own support level and run mode. There is no
second story engine, and the planner may not offer an episode-homed story as a loose block. Its
two endings are two *strategies* — ask them to repeat, or ask them to slow down — rather than a
right and a wrong answer, which is why a story now declares its own `branches`.

**"I don't know." is not "I don't understand."** It is a real sentence that answers a question
instead of reporting that one was not understood, and it is named precisely rather than refused.
So are `What?` and `Sorry?`: understood, and not the polite sentence the arc teaches.

---

## 3. What a learner can do after episode 15

Verified against the real steps, not the titles:

- greet someone, give their name, ask for a name, and close the introduction politely;
- ask and answer how someone is, and bounce the question back;
- ask and say where they are from, using their own city;
- hold a seven-turn first conversation combining all of the above;
- say what they like and dislike, ask what someone else likes;
- say what they want or need, offer something, accept or decline;
- agree a small plan;
- order in a café: request politely, answer "Anything else?", close the order, say thank you;
- say they did not understand, ask for a repetition or for slower speech, and carry on with the
  question they just rescued;
- lose the thread of a conversation, get it back, and say goodbye.

**What they cannot do:** ask what something is, or use any number. Both are required, both are
still unbuilt, and that is why finishing episode 15 is not an exit from Pre-A1.

---

## 4. Findings

> **Update.** Findings 4.1 and 4.2 have since been addressed — see
> [adaptive-support.md](adaptive-support.md). The measurements below are kept as
> the record of what was wrong and why it mattered.

### 4.1 The Memory Garden granted language nothing taught

The Garden grows from each episode's `gardenItems` at a fixed mastery of 0.5. The review engine schedules from `languageItems`, which only fills when a step records an attempt. The two had drifted: after playing all twelve episodes the Garden showed **45 items** while the learner model tracked **32**, and the 13 missing ones **could never come up for review at any point in the future**.

Four grants had no teaching at all behind them and were fixed by pointing them at the step that already teaches them (`im_feeling_pattern`, `im_from_pattern`, `i_want_pattern`, and ep9's `no_thank_you`). Tracking went 32 → 35.

The remaining ten are now a stated decision rather than an accident:

- **Receptive** (`hello`, `here_you_are`, `anything_else`) — heard, understood, never asked for. Correct as Garden entries, wrong as production evidence.
- **Incidental** (`name`, `fine`, `tired`, `help`, `water`, `coffee`, `tea`, `juice`) — really said by the learner, but only inside a phrase that is tracked whole. Scheduling "coffee" as its own review would fight the arc's deliberately tiny catalogue.

The check now refuses any new Garden grant that is neither produced nor declared.

### 4.2 Autonomy does not increase across the level

Share of productive turns with **no model answer on screen**:

| | ep1 | ep2 | ep3 | ep4 | ep5 | **ep6** | ep7 | ep8 | **ep9** | ep10 | ep11 | **ep12** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| unaided | 33% | 67% | 50% | 40% | 40% | **13%** | 40% | 33% | **14%** | 40% | 40% | **20%** |

The three arc finales — the hardest episodes — offer the *most* support. **Episode 2 asks for more unaided production than episode 12.**

The runtime scaffold does adapt downward after two clean answers, but `scaffoldByEpisode` is keyed per episode and every new episode starts at `high`. A learner who has mastered eleven episodes begins the twelfth at maximum support. Demonstrated autonomy is never inherited.

*Not fixed here — it changes learner-model behaviour and deserves its own sprint.*

### 4.3 Conversation peaked in the middle

| | ep3 | **ep6** | **ep9** | **ep12** |
|---|---|---|---|---|
| longest exchange | 2 turns | **7** | 6 | **4** |
| distinct intents | 2 | **8** | 7 | **5** |

Episode 6 is the most demanding episode in Pre-A1. Arcs 3 and 4 are richer in *language* but shorter in *conversation*. Future arcs should exceed ep6, not sit below it.

### 4.4 The episode template is nearly rigid

Six episodes open with the identical five-step spine `recall → scene → model → comprehension → word_order`. Only the arc finales break it. LinguaLoop is a method, and it has hardened into a form. `mini_story` — a real format with a renderer and three stories — **never appears inside an episode**; it exists only in daily sessions.

### 4.5 Five of seven patterns never reach independent production

`I'm + feeling`, `I'm from + place`, `I like + noun`, `I want + noun`, `Can I have + item + please?` are only ever practised with the words supplied. The learner produces the *sentences* freely; the pattern itself is always scaffolded.

### 4.6 Three episode fields are inert — *resolved*

`targetItems`, `reviewItems` and `personalized` were declared on every episode and read by **nothing at runtime**. All three are now gone from the episode data and derived from the steps instead — `targetsOf()`, `reviewsOf()`, `personalisesOf()` — each with a real consumer and a check that fails if a look-alike field returns.

### 4.7 Intents are healthy — for now

24 intents, all dispatched, all used, none dead. Seven appear in a single episode, but three of those are arc finales by design. The genuine single-use ones are `express_dislike`, `yes_no_preference`, `express_need`, `decline_offer`.

The naming is drifting toward one intent per sentence (`respond_anything_else`, `finish_order`, `thank_service` are all "a short polite reply"). At twelve episodes this is not yet a problem. **The trigger to generalise** — into *communicative function + slot schema* rather than a flat list — is when a new arc needs more than two new intents, or when total intents pass ~35 with families that clearly overlap.

---

## 5. What Pre-A1 still owes

### Built since the audit

**Repair understanding** — `ask_for_repair` · episodes 13 and 14 · 3 phrases + 1 pattern
Three strategies under one intent, each one leading back into the conversation. `covered`.

**Close an encounter** — `close_an_encounter` · episode 15 · 2 phrases
Taught, and honestly **`needs_reuse`**: it is produced twice inside episode 15 and never asked
for again, because episode 15 is where the curriculum currently ends. The next arc has to *ask*
for a goodbye rather than teach one. Calling it `covered` would be the optimism this map exists
to prevent.

The arc also repaired three earlier judgements, by using the language rather than by editing the
table: answering a yes/no preference, declining an offer and bouncing a question back were all
single-episode skills and are now genuinely reused. Two remain fragile — saying what you dislike
and saying what you need — and the arc did not touch either.

### Still to build

**Name and ask about things** — `identify_things` · after `express_preferences` · ~8 words
"What's this?" / "It's a…" is the smallest engine for acquiring vocabulary from the world, and gives every later level a way to grow.

**Small numbers and quantity** — `use_small_numbers` · after `polite_request` · ~12 words
The café can ask for a coffee and cannot ask for two, or ask what it costs. One to ten plus "How much is it?" makes the transaction the learner can already start actually finishable.

### Optional

Age · introducing another person · "I work." / "I study." · here/there. Each is one useful sentence that nothing already taught depends on.

### Deferred to A1

Daily routines · the past · describing people and places · giving directions · "because" · telling the time. Each needs a grammar layer — a second tense, adjective order, prepositions of place — that Pre-A1 deliberately avoids.

**Last Pre-A1 capability:** small numbers and quantity.
**First A1 capability:** daily routines.

---

## 6. Proposed completion: 2 arcs, 5 episodes

Ordered by dependency, not by appeal.

### Arc 5 — Staying in the conversation (3 episodes) — **built**

Delivered as planned, with two deviations worth recording: the vocabulary came in at 6 items
rather than 9 (functional phrases, not their parts), and the provider is needed less often than
expected — the deterministic rules cover the taught sentences and their common near-misses, and
Lingua is consulted for the shapes they miss ("I did not follow what you said there.").

Solves: the learner cannot survive a turn they did not expect.
Can-dos: `ask_for_repair`, `close_an_encounter`, plus one episode that puts both inside a conversation that deliberately goes wrong.
Reuses: introduction, answer_wellbeing, answer_origin, polite_request — the repair has to happen *inside* language they already have.
New vocabulary: ≤ 9. New semantic types: none.
Formats: heavy roleplay and `mini_story` — the first episodes where a story belongs, because a misunderstanding is a plot.
Provider likely needed: **yes** — "I don't understand" arrives in many shapes.

### Arc 6 — Things and how many (2 episodes) — **not built, and not started**

Solves: the café cannot count, and the learner has no way to name an unknown object.
Can-dos: `identify_things`, `use_small_numbers`.
Reuses: polite_request, express_like, finish_order.
New vocabulary: ≤ 20 across both. New semantic types: possibly `number` — the first genuine addition since the café.
Formats: choice and word_order carry numbers well; one conversational finale in the café already built.
Provider likely needed: no — both are highly deterministic.

Two episodes is right for arc 6. Three would pad it.

**Estimate: Pre-A1 needs 1 more arc and 2 more episodes — 17 in total.** Arc 5 is built; the
section above is kept as written so the plan can be compared with what was delivered.

---

## 7. When is a learner ready for A1?

Not "finished every episode". The proposed criteria, encoded in `PRE_A1_EXIT_CRITERIA`:

- every **required can-do** earned — including `identify_things` and `use_small_numbers`, which
  do not exist yet;
- **two independent successes** each, with no model answer on screen (one is luck);
- **no required skill still `learning`**;
- **at most three overdue reviews** — a learner carrying a backlog is not ready to add a level;
- **the last long conversation finished unaided**.

The check already enforces the shape of this: because two required can-dos are unbuilt,
"completed all episodes" provably cannot mean "ready for A1" — and after arc 5 that is still
true, which `check-fifth-arc` asserts directly so a future arc cannot quietly change it.

---

## 8. Architecture recommendations

**Keep the linear chain for now.** Fifteen episodes in one line, one entry point, no cycles. A skill graph becomes necessary when two arcs can be taken in either order — likely at arc 6, since things-and-numbers does not depend on conversation repair. Model it then; the accessors (`prerequisiteChain`, `canDoCoverage`) are already graph-shaped.

**Split episode metadata from steps when a second level lands, not before.** Re-measured after
arc 5: the entry bundle moved 363.33 → 370.90 kB for three episodes, a hosted story and the
repair evaluator, still far under the 500 kB budget and still with no chunk warning. Home already pulls the full episode list through the planner; splitting today would be refactoring for a problem Pre-A1 does not have.

**Before the next arc:** nothing outstanding on metadata — the three inert fields are derived now. See [adaptive-support.md](adaptive-support.md) for what the support engine expects a new arc to declare.
