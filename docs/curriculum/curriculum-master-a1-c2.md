# LinguaChat Curriculum Master — A1 to C2

**Status:** architecture baseline for curriculum design and parallel authoring.

This document defines the shared contract that every LinguaChat level from A1 to C2 must obey. It does **not** replace the existing Pre-A1 freeze or the live A1 blueprint. Instead, it generalizes the strongest principles already proven in the product so that multiple levels can be authored in parallel without becoming six unrelated courses.

The north star is simple:

> A learner advances because they can **do more with language**, independently and in new situations — not because they completed more screens.

## 1. One curriculum, six levels

A1, A2, B1, B2, C1 and C2 are not separate products. They are six sections of one dependency graph.

Every level must declare:

- real-world communicative capabilities (`can-do`s), not topic buckets;
- prerequisite capabilities from earlier levels;
- what language forms and vocabulary are infrastructure for those capabilities;
- where older capabilities are deliberately reused;
- what counts as guided, assisted and independent evidence;
- how delayed retrieval and transfer are proved;
- how the learner exits the level;
- which features may be personalized without changing difficulty or assessment.

A level may be authored in parallel, but it may not invent its own definitions of mastery, scaffolding, personalization, review, evaluation or progression.

## 2. Pedagogical constitution

All levels inherit the research baseline in `docs/research/learning-science-foundation.md`.

The mandatory principles are:

1. **Action-oriented learning.** Every arc exists because the learner needs to do something meaningful with another person.
2. **Meaning-focused input.** Learners must regularly understand messages, not just decode isolated forms.
3. **Meaning-focused output.** Learners must regularly produce language to communicate meaning.
4. **Language-focused learning.** Form, vocabulary and grammar receive explicit attention when useful.
5. **Fluency development.** Known language returns under easier/faster conditions without adding unnecessary novelty.
6. **Retrieval practice.** Learners attempt recall before seeing the answer whenever appropriate.
7. **Spacing.** Important capabilities return after intervening material and in later sessions.
8. **Transfer.** Mastery cannot be proved only on the exact sentence or context used during teaching.
9. **Corrective feedback with repair.** Feedback should usually preserve a chance for the learner to try again.
10. **Scaffolding fades by evidence, not by episode number.**
11. **Recognition is not production.** Multiple choice cannot by itself prove that a learner can independently say or write something.
12. **No false mastery.** Completion, copied answers, model-visible answers and immediately repeated surface forms are not independent evidence.
13. **Healthy motivation.** Progress, competence, choice, curiosity and meaningful success are preferred over manipulative pressure.
14. **Age changes presentation, not intellectual respect.** The same learning goals may need different pacing, examples and interface support.

## 3. CEFR alignment without pretending the app is the CEFR

LinguaChat uses CEFR as an external reference for progression, not as a marketing label generator.

Each level blueprint must map its capabilities to relevant CEFR Companion Volume descriptors and then translate those descriptors into concrete LinguaChat behaviours that can actually be tested.

The product must never claim complete CEFR mastery from text-only evidence alone. Until listening/speaking/pronunciation are implemented and evaluated, A1–C2 refers to the **implemented textual/interactive curriculum aligned to CEFR progression**, not complete certification of every CEFR mode.

## 4. Progression by level

### A1 — basic autonomy in one familiar situation

The learner can handle short, predictable exchanges in the present, including personal information, routine, people around them, basic place questions, small transactions, ability and simple arrangements.

Constraints remain intentionally tight: one situation, one main topic, short turns, repair available, minimal clause complexity.

### A2 — connected everyday communication

The learner expands into past events, near-future plans, common travel and service situations, descriptions, comparison, simple reasons, invitations, everyday problems and longer exchanges.

A2 must begin to make the learner connect clauses rather than only produce isolated frames.

### B1 — independent everyday language use

The learner can narrate, explain, justify, compare options, handle unexpected but common problems, sustain conversations over topic changes and express opinions with reasons.

B1 must shift the learner from highly predictable exchanges toward flexible use of known language.

### B2 — sustained argument and spontaneous interaction

The learner can develop arguments, weigh advantages/disadvantages, explain complex positions, negotiate, hypothesize, manage register more deliberately and participate in longer spontaneous interaction.

B2 must substantially increase discourse-level demands: coherence across turns matters, not only sentence correctness.

### C1 — precision, flexibility and register control

The learner can synthesize, infer, reformulate, adapt register, communicate nuanced positions, handle abstract topics and produce extended structured language with purposeful style.

C1 must assess pragmatic appropriateness and discourse control in addition to grammatical form.

### C2 — very high-level comprehension, reformulation and nuance

The learner can understand and reformulate dense material, distinguish fine shades of meaning, manage implication/irony/rhetorical choices, synthesize multiple viewpoints and adapt language with very high precision.

C2 may not be awarded from narrow prompt-response success. Evidence must include sustained, varied, unfamiliar and high-ambiguity tasks.

## 5. Capability graph, not lesson list

Every level blueprint must define a directed capability graph.

Each capability declares at minimum:

- `id`
- learner-facing can-do description
- CEFR reference(s)
- required/should/optional status
- prerequisites
- language infrastructure
- semantic types needed
- productive/receptive vocabulary budget
- first teaching context
- reuse contexts
- transfer contexts
- independent evidence target
- delayed retrieval target
- graduation relevance

A capability cannot depend on another capability that is absent from the current or earlier level.

A cross-level validation step must prove:

- no prerequisite cycles;
- no orphan required capabilities;
- no new capability whose prerequisites are never taught;
- no level exit requiring evidence the runtime cannot record;
- no later level silently redefining an earlier capability with incompatible semantics.

## 6. Topics are contexts, not curriculum

`music`, `gaming`, `films`, `art`, `travel`, `food`, `sports`, etc. are not levels and are normally not capabilities.

The curriculum teaches actions such as:

- narrate an event;
- compare two options;
- explain a preference;
- ask for clarification;
- negotiate a plan;
- summarize a text;
- defend a position.

Those actions can happen **through** music, games, films or neutral everyday contexts.

## 7. Personalization invariant

The existing LinguaChat rule becomes constitutional for A1–C2:

> Personalization may change what the conversation is **about**. It may never change what the learner has to **do**, what counts as correct evidence, or how difficult the capability is.

Therefore interests may influence:

- story subject;
- examples;
- names of fictional objects/activities where semantically safe;
- free-chat topic;
- optional practice contexts;
- neutral-vs-interest context rotation.

Interests may **not** change:

- `canDoId`;
- evaluation intent;
- mastery threshold;
- required evidence;
- prerequisite graph;
- XP/reward for equivalent work;
- whether a required capability can be skipped;
- the grammar/vocabulary burden expected for the level.

A learner who likes video games must not receive an easier or harder B1 than a learner who likes music.

## 8. Topic diversity policy

Personalization must feel personal without becoming repetitive.

Every level must support three context families:

1. **Explicit interests** — things the learner selected.
2. **Related contexts** — adjacent subjects that naturally connect.
3. **Neutral life contexts** — situations every learner should be able to handle regardless of hobbies.

No global fixed percentage is treated as scientifically optimal. The runtime may use weighted selection, cooldowns and deterministic seeds, but curriculum QA must verify the behavioural goals:

- explicit interests appear often enough to feel personal;
- the same interest does not dominate consecutive sessions;
- neutral real-life contexts remain present;
- unrelated exploration appears only where the surface allows it;
- a personalized value must be semantically valid for the slot;
- when no safe personalized value exists, neutral content wins.

## 9. Evidence model

The shared learner model remains the source of truth.

Evidence is categorized as:

- **recognition** — understands/chooses;
- **guided production** — produces with substantial supplied structure;
- **open assisted production** — produces freely but uses hint/model/support;
- **open independent production** — produces freely without using support;
- **transfer** — independently succeeds with a genuinely new lexical/contextual realization;
- **delayed retrieval** — independently retrieves after intervening material/time.

A level cannot graduate a learner using only recognition or guided production.

Required capabilities need independent evidence and transfer evidence. Exact thresholds are declared in each level blueprint and may be revised after real learner data, but the type of evidence cannot be weakened by an authoring agent.

## 10. Scaffolding contract

All levels use the shared adaptive support engine.

Principles:

- novelty may increase support;
- strong prerequisites may reduce initial support, but never erase novelty;
- repeated strain restores help quickly;
- help is removed conservatively;
- a single success/failure should not cause oscillation;
- support state is based on evidence and recent strain, not a hard-coded level index;
- C1/C2 can have less lexical/structural help by default only when prerequisite evidence supports it.

No level-specific implementation may bypass the central scaffolding logic simply to make authored content easier to pass.

## 11. Corrective feedback progression

Feedback must preserve communication while giving useful form information.

Typical escalation:

1. small error + meaning clear → light recast or narrow cue;
2. relevant error → prompt repair;
3. repeated error → more explicit explanation;
4. persistent error → short targeted practice;
5. successful repair → return to communication.

At higher levels, feedback increasingly distinguishes:

- grammatical accuracy;
- lexical precision;
- discourse coherence;
- pragmatic appropriateness;
- register;
- nuance.

A C-level response may be grammatically correct and still fail the target if its register or pragmatic force is inappropriate.

## 12. Reuse, spacing and retrieval

Every required capability must have an explicit reuse matrix.

A strong level does not contain a generic “review unit” that repeats old screens. Older language should return because a new situation genuinely needs it.

Each level blueprint must show:

- where every important earlier capability reappears;
- which reuses are immediate integration;
- which occur after interference;
- which occur in later sessions;
- which require transfer to a new context;
- which are used for fluency rather than new learning.

## 13. Modal balance

The curriculum should be audited against Nation's Four Strands at the level and cross-level scale.

For the current text-first product, we can directly implement and test:

- reading/meaning-focused input;
- written meaning-focused output;
- interaction through chat/roleplay;
- form-focused learning;
- written fluency development;
- mediation-like tasks such as summarizing or simplifying text for another person.

Listening, speaking and pronunciation remain separate future capabilities until the product implements and tests them honestly.

## 14. Authoring architecture

Parallel workers may author **level-owned content** but may not independently modify shared learning-engine semantics.

Level-owned examples:

- `docs/curriculum/<level>/**`
- level blueprint/map
- level episode definitions/content
- level-specific checks
- level-specific pedagogy fixtures

Shared-core examples requiring a serialized core task:

- learner model semantics
- response evaluation semantics
- scaffolding
- shared session/planner behaviour
- semantic type system
- level registry architecture
- provider policy
- graduation framework
- persistence model

When a level worker discovers a shared-core need, it must raise the requirement instead of quietly implementing a private workaround.

## 15. Blueprint-before-content rule

No new level may begin runtime content until its blueprint passes structural review.

The blueprint phase must establish:

- complete level capability map;
- prerequisites from previous level;
- arc grouping;
- evidence requirements;
- vocabulary/pattern budgets;
- reuse matrix;
- personalization allowances;
- transfer plan;
- graduation criteria;
- evaluator/core requirements;
- CEFR references;
- known exclusions/deferred abilities.

This lets A2–C2 be designed in parallel while preventing content from locking in contradictory assumptions.

## 16. Level QA gate

Before a level can be marked `complete`, it must pass:

1. blueprint structural checks;
2. curriculum authoring contract;
3. level-specific checks;
4. evaluator refusal tests (nonsense, wrong intent, near miss);
5. assisted-vs-independent evidence tests;
6. personalization invariant tests;
7. prerequisite and reuse tests;
8. delayed retrieval tests;
9. novel-context transfer tests;
10. replay/idempotency tests;
11. browser usability checks for supported representative locales/viewports;
12. two consecutive full clean cycles after the last fix.

## 17. Cross-level QA gate

A level passing alone is not enough.

Before opening a later level, the integrated curriculum must prove:

- prior-level exit evidence really supplies its prerequisites;
- no required capability disappears for too long without reuse;
- complexity rises rather than randomly oscillates;
- vocabulary and patterns are not repeatedly reintroduced as if new;
- later levels do not silently weaken mastery thresholds;
- personalization remains content-only;
- longitudinal learner journeys can progress through the boundary without false mastery or dead ends.

## 18. Parallel-authoring rule

The fastest safe strategy is:

1. freeze this master contract;
2. design A1/A2/B1/B2/C1/C2 blueprints in parallel;
3. run a cross-level blueprint audit;
4. serialize any shared-core changes discovered by those blueprints;
5. author level-owned runtime content in parallel;
6. continuously run level QA plus a read-only pedagogical supervisor;
7. integrate levels one at a time through the global gate;
8. run longitudinal A1→C2 acceptance before claiming the curriculum complete.

Parallelism is allowed where files and concepts are independent. Shared semantics stay serialized.

## 19. Definition of “perfect enough to ship”

Software cannot prove the literal absence of every possible bug. LinguaChat's release standard is therefore evidence-based:

- zero known critical/high learner-impact bugs;
- all automated gates green;
- all required capabilities have valid independent evidence paths;
- no known false-mastery route;
- no known prerequisite/dependency hole;
- no known personalization drift;
- representative browser E2E clean;
- two consecutive full clean cycles after the final change.

Real-human learning efficacy is a separate claim and requires pilot evidence with pre-test, learning period, immediate post-test and delayed post-test using unfamiliar examples.

## 20. Immediate next artifacts

After this master is accepted, create one blueprint per level:

- `a1` — reconcile the existing live blueprint into the master contract;
- `a2` — new blueprint;
- `b1` — new blueprint;
- `b2` — new blueprint;
- `c1` — new blueprint;
- `c2` — new blueprint.

Each blueprint must use the shared template and must be cross-audited before its first runtime content PR.
