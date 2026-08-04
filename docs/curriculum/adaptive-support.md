# Adaptive support and learning states

How much help a learner is offered, on what grounds, and what the Memory Garden is allowed to claim.

- **Support engine:** `linguachat-frontend/src/learning/engine/scaffolding.js` — the only place the question is answered.
- **Learning states:** `linguachat-frontend/src/learning/engine/learnerModel.js` — four states per language item, model v6.
- **Enforcement:** `npm run check:adaptive-scaffolding` · `check:learning-states` · `check:autonomy-audit`.

> **Architecture note.** Supabase integration is deferred until the functional product is complete. All learner progress — XP, mastery, episode runs, Memory Garden, learner facts, daily sessions, and the support state described here — remains local to the device.

---

## 1. What was wrong

Support was one line: `scaffoldByEpisode[episodeId] || 'high'`. Two consequences nobody chose.

**Position outweighed evidence.** The level was keyed per episode and every episode started at maximum help, so a learner who had proved themselves eleven times began the twelfth at the same place as someone who had never opened the app. The three arc finales — the hardest episodes — offered the *most* support.

**The loop starved itself.** "Independent" was defined as `scaffold !== 'high'`. A learner at high support could not produce independent evidence no matter how well they answered; and without independent evidence, support never came down. Each half of the system withheld what the other needed.

---

## 2. What decides the level now

Four commitments, in the order they resolve conflicts:

1. **Evidence, not position.** Nothing in the engine reads an episode number, an index, or a completion count. Curricular position enters only through the prerequisites an episode declares, which are a pedagogical statement rather than an ordinal.
2. **New is still new.** Strong prerequisites earn `medium`, never `low`, for language the learner has not met. Confidence transfers; the language does not.
3. **Conservative.** Help is withdrawn slowly and restored quickly. Being wrong is cheap; being stranded is not.
4. **No oscillation.** One level at a time, and only when a counter clears a threshold — so a single good or bad turn cannot flip the experience back and forth.

### Initial derivation

Derived **once** per run or session block, from:

| input | where it comes from |
|---|---|
| target skill strength | `canDo` evidence plus how much of the skill's own language reached `can_use` |
| prerequisite strength | the episode's declared `prerequisites`, read the same way |
| novelty | a pattern the learner has never produced, or an intent never attempted |
| overdue review | any item this episode teaches that has fallen due |
| recent strain | assistance and retries in the last three completed runs, plus recurring errors |
| run mode | first run, resume, replay, review, branch replay |
| block type | a session's `targeted_retry` starts supported by definition |

Guardrails may only **add** help. A fragile skill with anything working against it returns to `high` regardless of what else looks good.

### Why strength reads item evidence

A can-do is credited once per completed episode, for that episode's own can-do. A skill practised across six episodes still shows a single attempt, and `can_do` status needs two — so a purely can-do-based rule would transfer nothing in ordinary sequential play, which is the bug this replaced.

Strength therefore leads with the evidence that is actually plentiful: the language the skill's own episode asks the learner to **produce**, and how far each piece has come. Reaching `can_use` already requires two unaided productions, so this is a higher bar than "finished the episode", not a lower one.

### Transitions

- **Less help** after `2` unaided, correct, *open* productions. Recognition and guided work hold the streak where it is — real evidence of other things, not of independence. The next level is earned from scratch.
- **More help** after `2` failures or retries, after leaning on the model twice, or immediately when the learner asks to practise another way. Pressure is spent when it fires, so support cannot creep up every turn.

### Reason codes

Every state carries short internal labels — `fresh_skill`, `strong_prerequisites`, `fragile_skill`, `review_due`, `new_complexity`, `recent_retries`, … They exist so a decision can be tested and explained rather than trusted. **They are never shown to the learner** and never leave the device: a check asserts the provider is handed none of them.

### Where it lives

On the **run**, not the episode. A resumed attempt restores exactly what it had — including the level — instead of re-deriving from a model that has moved on. Practising the same episode again derives its own reading. `scaffoldByEpisode` is still written for the planner, which only wants a rough sense of how supported the learner currently is.

Sessions and stories derive their own per block. Nothing hardcodes a level any more.

---

## 3. What each format can prove

| format | proves | can it be independent? |
|---|---|---|
| comprehension, choice | recognition | no |
| word order, fill blank, guided reply | guided production | no |
| free reply, roleplay, recall, mini-story reply | open production | yes, if no help was used |

A `choice` used to count as independent whenever support happened to be below `high`, which turned recognising a sentence into proof of producing one.

**Help shown is not help used.** A suggestion sitting on screen, untouched, does not make an answer assisted. It counts as assistance when the learner taps it, reveals a hint, accepts "practise another way", or is handed the answer by a step that shows the model by default.

---

## 4. Language item states

Model **v6**. Four states per item, monotonic:

| state | earned by |
|---|---|
| `seen` | granted by an episode, heard in a line, or carried inside a phrase tracked whole |
| `understood` | picked out correctly when it mattered |
| `practicing` | produced with the words supplied, or produced openly once |
| `can_use` | produced from nothing, unaided, **twice** |

The ladder never descends. Getting something wrong later does not unlearn it — that is what the review schedule is for, and **needing revision is a separate axis** from having learned. A mistake brings the review date closer and resets the streak; the state stays.

- **Receptive** items (`hello`, `here_you_are`, `anything_else`) stop at `understood`. Understanding them is real learning; asking the learner to produce what was never taught for production is not.
- **Incidental** items (`name`, `fine`, `tired`, `help`, `water`, `coffee`, `tea`, `juice`) are really said by the learner, but only inside a phrase tracked as a whole. They stay at `seen`, deliberately.

### Migration

`v1 … v5 → v6`, each with an explicit branch. Every item gets a state derived from evidence that already existed: two independent productions → `can_use`; any correct attempt → `practicing`; nothing → `seen`. Nothing is invented and nothing with real independent evidence is demoted. XP, episodes, mastery, can-dos, facts, interests, preferences, signal ids, runs, the active run and its scaffold all carry across untouched, and corrupt storage yields a usable empty model rather than a crash.

Items now merge **monotonically** between concurrent saves: counters take the higher value, the state takes the further-along one, the review date takes the sooner. Two copies of the model saving over each other previously lost whichever item the other had just recorded.

---

## 5. The Memory Garden

The Garden showed every granted item at a fixed mastery of `0.5`, so a sentence the learner had produced unaided looked exactly like a word they had once heard someone else say — and its own "mastered" count was permanently zero, because nothing ever moved the number.

It now reads the learner model and groups the four states into the three a person needs to tell apart:

| shown | states |
|---|---|
| **Met it** | `seen` + `understood` |
| **Practising** | `practicing` |
| **You can use it** | `can_use` |

`seen` and `understood` share a group on purpose: the difference matters to the review engine, not to the reader. Being granted an item records it at `seen` — nothing is removed, no XP changes, no item is lost, and nothing is granted to a new learner that they have not met.

Labels exist in all eight locales; verified in Japanese and in Arabic RTL at 390 and 768.

---

## 6. Episode metadata contract

`targetItems`, `reviewItems` and `personalized` were declared on every episode and read by nothing. Three hand-maintained lists describing content the steps already state outright is how a declared curriculum drifts from the executed one.

All three are gone from the episode data. Each is derived, and each has a consumer:

- `targetsOf(id)` — what this episode grants first; the support engine uses it to judge novelty.
- `reviewsOf(id)` — what it deliberately brings back, read from its own review steps.
- `personalisesOf(id)` — which slots it fills from the learner, read from its placeholders and captures. `semanticContext` still decides whether a value may fill a slot; this only reports which slots exist.

A check fails if a look-alike field reappears on an episode.

---

## 7. What a new arc must supply

Nothing new, which is the point — the engine reads what episodes already declare:

- **`prerequisites`** carry the transfer. An arc whose prerequisites are honest gets sensible starting support for free.
- **`canDoId`**, and an entry in `CAN_DO_INTENT` naming the intent that stands for it.
- **Open turns** for the can-do it claims: a skill that is never asked for in a free reply can never be shown as usable.
- **Patterns as items** where a pattern is taught, so novelty can be detected.

Two things to keep in mind when writing it: a conversational finale should exceed episode 6's seven turns rather than sit below it, and `mini_story` still appears in no episode at all — only in daily sessions.
