# LinguaChat level blueprint template

Use this template for A1, A2, B1, B2, C1 and C2. A level blueprint is a design artifact; it does not make a level available and must not be imported by runtime code.

## 1. Level identity

- Level:
- Blueprint version:
- Status: planned | partial | complete
- Prerequisite level:
- CEFR source references:
- Product availability: false until separate release gate

## 2. Exit promise

In plain language, what can a learner reliably do at the end of this level that they could not do at the beginning?

State explicit ceilings too: what remains deferred to the next level.

## 3. Required capability table

For every can-do declare:

| field | required content |
|---|---|
| `id` | stable internal id |
| learner can-do | concise learner-facing action |
| CEFR refs | relevant descriptors |
| priority | required / should / optional |
| prerequisites | capability ids from current/earlier level |
| semantic needs | required slot/types |
| new language infrastructure | patterns/forms needed |
| productive vocabulary | new items expected in production |
| receptive vocabulary | new items needed only for comprehension |
| first context | where it is taught |
| reuse contexts | where it returns |
| transfer contexts | genuinely novel contexts |
| independent evidence | what proves unaided ability |
| delayed retrieval | how later memory is tested |
| graduation relevance | whether exit depends on it |

## 4. Skill families and arc map

Group capabilities by communicative function, not grammar topic.

For each arc declare:

- arc id/name;
- real-world situation;
- capabilities introduced;
- capabilities reused;
- prerequisites;
- expected meaningful learner turns;
- dominant Four Strand contribution;
- personalization mode: none / light / themed;
- neutral fallback contexts;
- transfer target;
- delayed retrieval target.

## 5. Dependency graph

Provide a human-readable graph and machine-checkable ids.

Rules:

- no cycles;
- no missing prerequisite;
- no required capability without an evidence path;
- no hidden prerequisite that only exists in prose;
- cross-level prerequisites must exist in the previous curriculum.

## 6. Language infrastructure

### Patterns / grammar

For every new pattern group declare:

- communicative function it enables;
- prerequisite pattern(s);
- first appearance;
- guided-use target;
- independent-use target;
- later reuse.

Grammar cannot be introduced solely because a traditional syllabus says it belongs in the level.

### Vocabulary budget

Separate:

- productive items;
- receptive items;
- incidental scene language;
- multiword units tracked whole.

Avoid vocabulary catalogues detached from a communicative need.

## 7. Personalization plan

Personalization may change context only.

Declare:

- which arcs allow explicit interests;
- which accept related contexts;
- which require neutral real-life situations;
- compatible semantic slot types;
- neutral fallback for every personalized slot;
- recent-topic cooldown expectations;
- how QA will prove two themes preserve identical capability/evidence/difficulty.

No blueprint may personalize `canDoId`, evaluator intent, evidence threshold, prerequisite, reward or level difficulty.

## 8. Reuse / spacing matrix

Create a matrix from capability → arcs/sessions where it returns.

Mark each appearance as:

- `I` introduce;
- `G` guided reuse;
- `R` open retrieval;
- `T` transfer;
- `F` fluency;
- `D` delayed retrieval.

Required capabilities must not disappear after their home episode.

## 9. Evidence and mastery

Define:

- recognition evidence;
- guided production evidence;
- assisted open evidence;
- independent open evidence;
- transfer evidence;
- delayed retrieval evidence.

State the exact minimum for graduation and why it is appropriate. Never equate completion with mastery.

## 10. Scaffolding expectations

Describe likely support shape without overriding the shared engine.

Include:

- genuinely novel language;
- strong-prerequisite entry behaviour;
- expected support fade;
- known high-strain tasks;
- recovery after repeated failures;
- replay behaviour once capability is strong.

If the level needs a capability the shared engine does not support, declare a CORE requirement rather than implementing a private workaround.

## 11. Evaluation requirements

List every new evaluator intent or semantic distinction needed.

For each one define examples of:

- clearly correct;
- natural variant;
- near miss;
- wrong meaning;
- nonsense;
- correct meaning but insufficient target form, when form matters;
- pragmatically inappropriate answer, for advanced levels where relevant.

## 12. Four Strands audit

Estimate the level-wide balance of:

- meaning-focused input;
- meaning-focused output;
- language-focused learning;
- fluency development.

Do not force equal percentages per episode. Balance is a level/course property.

## 13. Interaction / discourse / mediation

Declare how the level develops:

- turn-taking and repair;
- conversation length/topic changes;
- discourse coherence;
- summarization/reformulation;
- mediation-like tasks;
- register/pragmatics as appropriate to level.

## 14. Explicit exclusions

List what the level deliberately does **not** teach yet. This prevents later workers from silently expanding scope and breaking progression.

## 15. Core-engine requirements discovered by blueprint

List each shared requirement with:

- problem;
- why current engine cannot express it;
- earliest level that needs it;
- proposed shared behaviour;
- regression risk;
- tests required.

These must be implemented through serialized CORE work before level content depends on them.

## 16. QA acceptance

At minimum require:

- structural blueprint validation;
- authoring contract;
- evaluator/refusal tests;
- personalization-invariant tests;
- prerequisite/reuse tests;
- at least 20 varied learner-shaped journeys per completed arc;
- assisted vs independent proof;
- transfer;
- delayed retrieval after interference;
- replay/idempotency;
- no false mastery;
- representative browser usability;
- two clean full cycles after final fix.

## 17. Cross-level acceptance

Before opening the level, prove:

- previous-level exit supplies required prerequisites;
- no unprepared language jump;
- no duplicated “new” capability already taught earlier;
- old required capabilities continue to receive useful reuse;
- complexity rises coherently;
- graduation evidence is attainable through real runtime paths.

## 18. Human-pilot questions

Record claims that automation cannot prove and should later be tested with real learners, such as:

- perceived difficulty;
- confidence;
- boredom/frustration;
- usefulness;
- delayed retention;
- spontaneous transfer;
- whether personalization feels relevant rather than repetitive.
