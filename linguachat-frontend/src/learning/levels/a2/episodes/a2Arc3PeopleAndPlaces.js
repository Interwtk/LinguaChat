/*
 * A2 arc 3 — "People and places" (`people_and_places`, episodes 45–48).
 *
 * Derived from docs/curriculum/blueprints/a2.json#arcs (order 3) and its four
 * episode entries (plannedNumber 45–48), not from memory. Nothing here invents a
 * capability, pattern, intent or vocabulary item the blueprint does not already
 * name; where a decision was this file's own (an example sentence, a step order
 * inside an episode), that is called out below.
 *
 * THE PROBLEM, IN THE BLUEPRINT'S OWN WORDS: "The learner can say what somebody
 * is (a student) but not what they or a place are LIKE, cannot choose between two
 * things by comparing them, and cannot justify a preference beyond stating it."
 * Three gaps, three can-dos, in a strict dependency chain: you cannot compare
 * things you cannot yet describe, and you cannot justify a choice you cannot yet
 * make. `compare_two_things` prerequires `describe_a_person_or_place`, and
 * `express_an_opinion_with_a_reason` prerequires `compare_two_things` — the arc's
 * four episodes ARE that chain, one link per episode, plus one integration.
 *
 * THE RISK, NAMED IN THE BLUEPRINT, AND HOW IT IS MITIGATED HERE: "Three new
 * structures competing for the same episodes." A2 answers it the way A1 answered
 * its own densest arc (arc 2, `daily_rhythm`): describe first, comparison built
 * directly on top of the SAME attribute vocabulary description already taught,
 * `because` saved for the episode where description and comparison are already
 * fluent enough to be worth justifying. So episode 46 does not teach a second set
 * of adjectives — it takes small/big/quiet/friendly/expensive/cheap, taught in 45,
 * and puts "-er than" on them. Episode 47 does not teach a second opinion frame —
 * it takes the comparison 46 just made and asks the learner to defend it.
 *
 * THE THIRD-PERSON -S MILESTONE. `a1Inheritance.resolvesA1Deferral` says it
 * outright: "third_person_s_productive: produced for the first time inside
 * describe_a_person_or_place". A1 taught "he/she is" (episode 25) but a Pre-A1/A1
 * learner has never had to put -s on an ordinary verb and say it themselves. That
 * is why episode 45 carries an explicit, dedicated `word_order` drill for
 * `third_person_s_pattern` rather than assuming the -s will fall out of the
 * multi-attribute sentences alone (which use "is", not a lexical verb).
 *
 * COMPARATIVES ONLY, NEVER SUPERLATIVES. `semanticTypes.explicitlyNotNeeded`
 * lists `superlative_quality` by name: "Superlatives are deferred to B1 with the
 * rest of three-or-more-way comparison." Episode 46 teaches "bigger than" and
 * "more expensive than" and stops there — no "the biggest", not even modelled for
 * recognition, because a receptive superlative here would be teaching a shape the
 * learner cannot yet productively use and the level does not own.
 *
 * TWO-CLAUSE EVALUATION. `describe_person_or_place` and `state_opinion_with_reason`
 * are both in `evaluationStrategy.hybrid` (`compare_things` stays
 * `deterministic_local` — a comparison is one clause, not two). Every canonical
 * target/suggestion sentence for those two evalKinds below actually contains the
 * taught connector ("and" for a multi-attribute description, "because" for an
 * opinion-with-reason) rather than a single clause, so the reference evaluator in
 * `levels/a2/evaluators.js` has a real two-clause example to score against.
 *
 * THE REFUSAL CASE THE EVALUATOR MUST ENFORCE. "I like it." is a complete,
 * correct A1 sentence — and it is NOT evidence for `express_an_opinion_with_a_reason`,
 * because it has no reason clause. Episode 47 makes this distinction visible to
 * the learner directly (a `choice` step asks them to spot which of two answers
 * gives a reason), not just to the evaluator, because the same standard that
 * grades the learner's production is worth teaching explicitly once.
 *
 * VOCABULARY BUDGET (arc-wide ceiling: 14 new productive, 8 new receptive, per
 * `a2.json#arcs[].vocabularyBudget`). This arc spends 9 of the 14 productive
 * slots and 6 of the 8 receptive slots — under budget on purpose, the same way
 * A1's reinforcement episodes left budget unspent rather than padding a garden
 * with words the situation does not need:
 *   - PRODUCTIVE (9): the six `quality` words `a2.json#semanticTypes.proposed`
 *     names by example — big, small, quiet, expensive, cheap, friendly — split
 *     3/3 across episodes 45 and 46 so comparison is visibly built on
 *     description's own words; two frequency adverbs, `always`/`never`, extending
 *     A1's `usually`/`sometimes` toward the full six-word set; and one opinion
 *     word, `convenient`, for episode 47's reason clause.
 *   - RECEPTIVE ONLY (6, never asked for production): `often`/`rarely` (the rest
 *     of the frequency full set), `modern` (the third attribute of episode 45's
 *     three-attribute receptive target), `better`/`worse` (the one irregular
 *     comparative pair the blueprint asks episode 46 to model receptively,
 *     specifically so the learner is not left thinking every comparative just
 *     adds "-er"), and `comfortable` (episode 47's "reason using an attribute not
 *     yet met").
 *   - PATTERNS are separate from this budget and are not vocabulary: the six new
 *     patterns (`multi_attribute_pattern`, `there_is_are_pattern`,
 *     `third_person_s_pattern`, `frequency_full_set_pattern`, `comparative_pattern`,
 *     `because_reason_pattern`) are `gardenItems` entries too, exactly as A1's
 *     `i_do_pattern`/`frequency_pattern`/etc. were, but they do not count against
 *     `newProductive`/`newReceptive`.
 *
 * PERSONALIZATION (arc 3 = themed, per `a2.json#personalization` and
 * `a2.md`§7; compatible slots: `place`, `person`, `quality`). Every scene/prompt
 * below that names a café, a neighbourhood or a friend is the NEUTRAL FALLBACK —
 * "a generic neutral café/neighbourhood pair, described and compared with the
 * same attribute vocabulary regardless of theme" — written literally, exactly as
 * a learner without a matching interest sees it today. Each such spot carries an
 * inline comment naming the slot a themed personalization engine would fill later
 * (e.g. café→gym, neighbourhood→campus, friend→teammate) WITHOUT touching the
 * canDoId, evidence requirement or difficulty — the personalization invariant.
 *
 * AUTONOMY. The arc's `autonomyTarget` is "mid: the suggestion is withheld on the
 * arc's integration episode" — episode 48 only. Episodes 45–47 each still offer a
 * `suggestionEn` on their FIRST open production (the frame is new) and withdraw it
 * on the second (which is where each episode's unaided evidence comes from,
 * exactly as A1's `and_you` (episode 19) explains it). Episode 48 offers no
 * suggestion on any `free_reply` step at all — every one of its open turns is the
 * arc's accumulated evidence that description, comparison and justified opinion
 * now survive with nothing on screen.
 *
 * MINI STORY (episode 48 only, `storyObjective: 'compare_two_places_story'`, a
 * new key this level proposes — the `STORIES` table entry itself is core-engine
 * work per `core-requirements.md`, not this file). The blueprint's own reason:
 * "Comparing two real, differently-described places... needs both descriptions
 * held in view at once, which a hosted story carries better than two separate
 * exchanges." Concretely, the story is what DOES the describing for both places at
 * once (episodes 45's own capability, already proved), which is why episode 48's
 * three open productions are compare / justify / respond-to-disagreement rather
 * than describe-describe-compare — `openProductions: 3` in the blueprint, not 5.
 *
 * WHAT THIS ARC DOES NOT DO. It does not exercise `ask_where_something_is` (only
 * `say_where_something_is` is in this arc's sanctioned `a1Reuse`) and it does not
 * invent a fourth new intent for "ask to compare" or "ask an opinion" — the
 * blueprint's `intentStrategy.explosionGuard` caps a new-intent-dense arc at
 * three, and this one spends its three exactly on `describe_person_or_place`,
 * `compare_things` and `state_opinion_with_reason`. The arc's
 * `conversationTarget` (10 meaningful turns, 4 learner-open turns, 1
 * learner-initiated question) is a session-level property of how these episodes
 * play as a live conversation — most concretely the multi-turn roleplay density
 * of episode 48 — rather than a single dedicated step type this file hard-codes.
 */

/*
 * 45 — "It's a small, quiet place"
 *
 * Blueprint: primary, canDo `describe_a_person_or_place`, situation "Describing a
 * café or a neighbourhood with more than one attribute", novelty high, new
 * language budget 6, three new patterns (a fourth, `frequency_full_set_pattern`,
 * touched lightly here per the blueprint's own allowance), reuse
 * `he_she_is_pattern`/`its_location_pattern`, two open productions, integrated
 * reuse of `introduce_someone_else` and `say_where_something_is`, prerequisites
 * NONE (capability readiness, not episode order — the WORK_01 precedent),
 * evidence "two unaided multi-attribute descriptions, one of a person and one of
 * a place".
 *
 * A1 capped description at one attribute on purpose ("She's a student"). This
 * episode lifts the cap in three moves at once: hold two attributes in one
 * sentence with "and", introduce a place with "there is/are", and — for the
 * first time anywhere in the curriculum — put a productive -s on an ordinary verb.
 */
const PLACES_01 = {
  id: 'small_quiet_place',
  arc: 'people_and_places',
  level: 'A2',
  role: 'primary',
  titleKey: 'ep45Title',
  goalKey: 'ep45Goal',
  canDoId: 'describe_a_person_or_place',
  canDoNameKey: 'ep45CanDoName',
  durationKey: 'ep45Duration',
  estimatedMinutes: 10,
  xp: 85,
  prerequisites: [],
  skillPrerequisites: ['introduce_someone_else', 'say_where_something_is'],
  gardenItems: [
    'multi_attribute_pattern', 'there_is_are_pattern', 'third_person_s_pattern', 'frequency_full_set_pattern',
    'small', 'quiet', 'big', 'friendly', 'always', 'never',
  ],
  reuseSkills: ['introduce_someone_else', 'say_where_something_is'],
  steps: [
    /*
     * Remember: A1's one-attribute cap, in the learner's own words, because this
     * episode's whole point is lifting it.
     */
    { type: 'recall', review: true, instructionKey: 'ep45RecallInstruction', evalKind: 'state_person_fact', itemIds: ['he_she_is_pattern'] },
    { type: 'scene', mood: 'curious', titleKey: 'ep45SceneTitle', bodyKey: 'ep45SceneBody', showGoal: true, ctaKey: 'ep45Start' },
    /*
     * Discover: two attributes held in one sentence with "and", contrasted with a
     * second place so all four new quality words land in the same turn.
     * PERSONALIZATION SLOT: place (café) — neutral fallback; a themed variant
     * would swap café→gym, keeping "small and quiet" / "big and friendly" as-is.
     */
    { type: 'model', target: 'It’s small and quiet.', response: 'The other café is big and friendly.',
      meaningItems: ['multi_attribute_pattern', 'small', 'quiet', 'big', 'friendly'], explainKey: 'ep45ModelExplain' },
    /*
     * Comprehend a THIRD attribute the learner is not asked to produce — the
     * blueprint's receptiveTarget exactly: "a three-attribute description".
     * `modern` stays receptive, like A1's `early`/`late` in `what_does_it_mean`.
     */
    { type: 'comprehension', instructionKey: 'ep45ComprehensionInstruction', target: 'It’s a small, modern café, and it’s usually quiet.', itemId: 'modern',
      options: [{ key: 'ep45CompOptCorrect', correct: true }, { key: 'ep45CompOptWrong1' }, { key: 'ep45CompOptWrong2' }] },
    /* Build: "there is/are", which reaches only guided_production this arc — a place introduced, not yet an unaided evidence target on its own. */
    { type: 'word_order', instructionKey: 'ep45OrderInstruction', hintKey: 'ep1BuildHint',
      tokens: ['There', 'are', 'two', 'cafés', 'near', 'here', '.'], itemId: 'there_is_are_pattern' },
    /*
     * Build: the milestone itself. Every earlier verb the learner owns (work,
     * study, like, want) has only ever been "I work" — this is the first time
     * anywhere in the curriculum that -s is asked for productively.
     */
    { type: 'word_order', instructionKey: 'ep45VerbOrderInstruction', hintKey: 'ep1BuildHint',
      tokens: ['She', 'works', 'every', 'day', '.'], itemId: 'third_person_s_pattern' },
    /*
     * Guided: the frequency full set, lightly touched as the blueprint allows.
     * Both new adverbs appear; `never` is the gap being filled, `always` is given
     * for contrast. `often`/`rarely` stay receptive, met only in episode 46+.
     */
    { type: 'fill_blank', instructionKey: 'ep45BlankInstruction', before: 'It is', after: ' quiet in the morning, and it is always quiet at night.',
      expects: 'never', alternatives: ['rarely'], itemId: 'frequency_full_set_pattern', hintKey: 'ep45BlankHint' },
    /*
     * Open production 1 — a PERSON, guided. The model is on offer because the
     * frame is new, matching the arc's autonomy target (withdrawn only in 48).
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Tell me about a friend. What are they like?', instructionKey: 'ep45OpenInstruction',
      evalKind: 'describe_person_or_place', suggestionEn: 'She’s friendly and she’s quiet.', itemIds: ['multi_attribute_pattern', 'friendly', 'quiet'] },
    /*
     * Open production 2 — a PLACE, unaided, integrated with BOTH of this
     * episode's sanctioned A1 reuse: introducing someone (Sana) and saying where
     * something is (her neighbourhood). No suggestion: this is the first of the
     * two unaided descriptions the blueprint's evidence line asks for.
     * PERSONALIZATION SLOT: place (neighbourhood) + person (Sana) — neutral
     * fallback; a themed variant swaps neighbourhood→campus, same grammar.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'This is Sana. Sana says, “Hi, I’m Sana! Let me tell you about my neighbourhood.” What’s it like?', instructionKey: 'ep45IntegratedInstruction',
      evalKind: 'describe_person_or_place', itemIds: ['multi_attribute_pattern', 'there_is_are_pattern'] },
    /* Remember: the same capability, nothing on screen — the second unaided description, for delayed retrieval. */
    { type: 'recall', instructionKey: 'ep45FinalInstruction', evalKind: 'describe_person_or_place', itemIds: ['multi_attribute_pattern'] },
    { type: 'completion', canDoNameKey: 'ep45CanDoName', titleKey: 'ep45CloseTitle', bodyKey: 'ep45CloseBody', ctaKey: 'ep1CloseCta' },
  ],
}

/*
 * 46 — "Bigger, quieter, cheaper"
 *
 * Blueprint: primary, canDo `compare_two_things`, situation "Choosing between two
 * places or two people using a comparison", novelty medium, new language budget
 * 4, one new pattern, reuse `multi_attribute_pattern` + "express_preferences
 * language", two open productions, integrated reuse of `describe_a_person_or_place`,
 * prerequisites [45], evidence "two unaided comparisons".
 *
 * Built directly on 45's own attribute words — no second adjective set. The
 * short-adjective "-er than" form is primary (cheaper, quieter); one longer
 * adjective, "expensive", carries the "more ... than" form, per the pattern's own
 * two forms; `better`/`worse` are met but never asked for, so the learner is not
 * left assuming every comparative regularly adds "-er".
 */
const PLACES_02 = {
  id: 'bigger_quieter_cheaper',
  arc: 'people_and_places',
  level: 'A2',
  role: 'primary',
  titleKey: 'ep46Title',
  goalKey: 'ep46Goal',
  canDoId: 'compare_two_things',
  canDoNameKey: 'ep46CanDoName',
  durationKey: 'ep46Duration',
  estimatedMinutes: 9,
  xp: 78,
  prerequisites: ['small_quiet_place'],
  skillPrerequisites: ['describe_a_person_or_place'],
  gardenItems: ['comparative_pattern', 'expensive', 'cheap'],
  reuseSkills: ['describe_a_person_or_place'],
  steps: [
    /* Remember: yesterday's whole capability, because today builds "-er than" straight onto it. */
    { type: 'recall', review: true, instructionKey: 'ep46RecallInstruction', evalKind: 'describe_person_or_place', itemIds: ['multi_attribute_pattern'] },
    { type: 'scene', mood: 'thinking', titleKey: 'ep46SceneTitle', bodyKey: 'ep46SceneBody', showGoal: true, ctaKey: 'ep46Start' },
    /*
     * Discover: the short-adjective "-er than" form first (the pattern's primary
     * form), then the "more + adjective + than" form for a longer adjective — both
     * forms the pattern names, neither one a superlative.
     */
    { type: 'model', target: 'This café is bigger than that one.', response: 'This neighbourhood is more expensive than that one.',
      meaningItems: ['comparative_pattern', 'expensive'], explainKey: 'ep46ModelExplain' },
    /*
     * Comprehend the ONE irregular pair the blueprint asks for receptively —
     * "better"/"worse" — so the learner meets the exception before assuming every
     * comparative is regular. Never asked for production.
     */
    { type: 'comprehension', instructionKey: 'ep46ComprehensionInstruction', target: 'This place is better than that one, but parking here is worse.', itemId: 'better',
      options: [{ key: 'ep46CompOptCorrect', correct: true }, { key: 'ep46CompOptWrong1' }, { key: 'ep46CompOptWrong2' }] },
    /*
     * A second, regular comparison right after the irregular one — "two
     * comparisons in a row", the blueprint's own receptiveTarget.
     */
    { type: 'choice', instructionKey: 'ep46ListenInstruction', promptEn: 'Café Sol is quiet. Café Luna is quieter. Which one is quieter?', itemId: 'comparative_pattern',
      options: [{ textEn: 'Café Luna.', correct: true }, { textEn: 'Café Sol.' }, { textEn: 'They are the same.' }] },
    /* Build: the short-adjective form. */
    { type: 'word_order', instructionKey: 'ep46OrderInstruction', hintKey: 'ep1BuildHint',
      tokens: ['This', 'café', 'is', 'cheaper', 'than', 'that', 'one', '.'], itemId: 'comparative_pattern' },
    /* Guided: the "more ... than" form, for the adjective too long to take "-er". */
    { type: 'fill_blank', instructionKey: 'ep46BlankInstruction', before: 'This neighbourhood is', after: ' than that one.',
      expects: 'more expensive', itemId: 'comparative_pattern', hintKey: 'ep46BlankHint' },
    /*
     * Open production 1, guided. The comparison, not yet unaided — this arc's
     * `productionTarget` is explicitly "one comparison, unaided BY THE END".
     * PERSONALIZATION SLOT: place (neighbourhood pair) — neutral fallback.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Two neighbourhoods: one is big and busy, one is small and quiet. Which is quieter?', instructionKey: 'ep46OpenInstruction',
      evalKind: 'compare_things', suggestionEn: 'The small one is quieter than the big one.', itemIds: ['comparative_pattern', 'quiet'] },
    /*
     * Open production 2, unaided, integrated reuse of `describe_a_person_or_place`
     * (the learner has to hold two descriptions in mind before comparing them).
     * The first of the two unaided comparisons the blueprint's evidence asks for.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Tell me about two cafés you know. Which one is cheaper?', instructionKey: 'ep46IntegratedInstruction',
      evalKind: 'compare_things', itemIds: ['comparative_pattern'] },
    /* Remember: unaided again — the second unaided comparison, for delayed retrieval. */
    { type: 'recall', instructionKey: 'ep46FinalInstruction', evalKind: 'compare_things', itemIds: ['comparative_pattern'] },
    { type: 'completion', canDoNameKey: 'ep46CanDoName', titleKey: 'ep46CloseTitle', bodyKey: 'ep46CloseBody', ctaKey: 'ep1CloseCta' },
  ],
}

/*
 * 47 — "I like it because..."
 *
 * Blueprint: primary, canDo `express_an_opinion_with_a_reason`, situation
 * "Justifying the choice the comparison just made", novelty medium, new language
 * budget 3, one new pattern, reuse `compare_two_things`/`express_preferences`,
 * two open productions, integrated reuse of `compare_two_things`, prerequisites
 * [46], evidence "two unaided opinions each with a because-clause".
 *
 * `because` turns one clause into two — the level's one required new grammar
 * function, saved deliberately for the arc's last-but-one episode, where a
 * comparison already exists to justify. `evalKind: 'state_opinion_with_reason'`
 * is HYBRID and judged as two clauses (opinion + because + reason); "I like it."
 * alone, with no reason, is a complete A1 sentence but is NOT this capability's
 * evidence, which is why a step below makes that distinction explicit.
 */
const PLACES_03 = {
  id: 'i_like_it_because',
  arc: 'people_and_places',
  level: 'A2',
  role: 'primary',
  titleKey: 'ep47Title',
  goalKey: 'ep47Goal',
  canDoId: 'express_an_opinion_with_a_reason',
  canDoNameKey: 'ep47CanDoName',
  durationKey: 'ep47Duration',
  estimatedMinutes: 9,
  xp: 78,
  prerequisites: ['bigger_quieter_cheaper'],
  skillPrerequisites: ['compare_two_things'],
  gardenItems: ['because_reason_pattern', 'convenient'],
  reuseSkills: ['compare_two_things'],
  steps: [
    /* Remember: yesterday's comparison, because today's opinion has to be about something already chosen. */
    { type: 'recall', review: true, instructionKey: 'ep47RecallInstruction', evalKind: 'compare_things', itemIds: ['comparative_pattern'] },
    { type: 'scene', mood: 'thinking', titleKey: 'ep47SceneTitle', bodyKey: 'ep47SceneBody', showGoal: true, ctaKey: 'ep47Start' },
    /*
     * Discover: the two-clause shape itself, positive and negative, so the
     * connector is clearly doing the joining work rather than a fixed phrase.
     */
    { type: 'model', target: 'I like it because it’s convenient.', response: 'I don’t like it because it’s expensive.',
      meaningItems: ['because_reason_pattern', 'convenient'], explainKey: 'ep47ModelExplain' },
    /*
     * Comprehend a reason built on an attribute the learner has never been taught
     * — the blueprint's own receptiveTarget: "a reason using an attribute not yet
     * met". `comfortable` stays receptive, never asked for production.
     */
    { type: 'comprehension', instructionKey: 'ep47ComprehensionInstruction', target: 'I like this café because the chairs are comfortable.', itemId: 'comfortable',
      options: [{ key: 'ep47CompOptCorrect', correct: true }, { key: 'ep47CompOptWrong1' }, { key: 'ep47CompOptWrong2' }] },
    /*
     * THE REFUSAL CASE, made visible to the learner directly, not only to the
     * evaluator: an opinion with no reason clause does not count as this
     * capability's evidence, and this is the distinction the two-clause hybrid
     * judgment has to enforce on every free production below.
     */
    { type: 'choice', instructionKey: 'ep47ListenInstruction', promptEn: 'Two answers to “Why do you like this café?” — A: “I like it.” B: “I like it because it’s quiet.” Which one gives a reason?', itemId: 'because_reason_pattern',
      options: [{ textEn: 'B.', correct: true }, { textEn: 'A.' }, { textEn: 'Neither.' }] },
    /* Build: the two clauses, in order, with the connector as its own token. */
    { type: 'word_order', instructionKey: 'ep47OrderInstruction', hintKey: 'ep1BuildHint',
      tokens: ['I', 'like', 'it', 'because', 'it', 'is', 'friendly', '.'], itemId: 'because_reason_pattern' },
    /*
     * Open production 1, guided. The frame is new, so the suggestion is still on
     * offer here — withdrawn for good starting with the next turn.
     * PERSONALIZATION SLOT: place (café pair) + quality (the reason attribute) —
     * neutral fallback.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Which café do you prefer, and why?', instructionKey: 'ep47OpenInstruction',
      evalKind: 'state_opinion_with_reason', suggestionEn: 'I like it because it’s quiet.', itemIds: ['because_reason_pattern'] },
    /*
     * Open production 2, unaided, integrated reuse of `compare_two_things` — the
     * opinion has to be ABOUT the comparison from episode 46. First of the two
     * unaided because-opinions the blueprint's evidence asks for.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'You compared two neighbourhoods earlier. Which one would you choose, and why?', instructionKey: 'ep47IntegratedInstruction',
      evalKind: 'state_opinion_with_reason', itemIds: ['because_reason_pattern', 'comparative_pattern'] },
    /* Remember: unaided again — the second unaided because-opinion, for delayed retrieval. */
    { type: 'recall', instructionKey: 'ep47FinalInstruction', evalKind: 'state_opinion_with_reason', itemIds: ['because_reason_pattern'] },
    { type: 'completion', canDoNameKey: 'ep47CanDoName', titleKey: 'ep47CloseTitle', bodyKey: 'ep47CloseBody', ctaKey: 'ep1CloseCta' },
  ],
}

/*
 * 48 — "Which one would you choose?"
 *
 * Blueprint: REINFORCEMENT, canDo `describe_a_person_or_place` (the arc's
 * integration episode: description + comparison + opinion all at once),
 * situation "A hosted story presenting two real options; the learner describes,
 * compares and justifies a choice with no model on screen", novelty low, new
 * language budget 1 (unspent — the arc's nine productive items are already
 * taught), no new patterns, three open productions, reuse of all three of the
 * arc's own patterns, integrated reuse of all three of the arc's own can-dos,
 * prerequisites [47], evidence "integrated: description, comparison and a
 * justified opinion held unaided in one exchange".
 *
 * The hosted story does the DESCRIBING of both places (episode 45's own
 * capability, already proved) so the learner's three open turns are exactly the
 * blueprint's `openProductions: 3` — compare, justify, and respond to a partner
 * who disagrees — rather than a fourth pass at description. No `suggestionEn`
 * appears anywhere in this episode: the arc's autonomy target withdraws it here
 * and nowhere else.
 */
const PLACES_04 = {
  id: 'which_one_would_you_choose',
  arc: 'people_and_places',
  level: 'A2',
  role: 'reinforcement',
  reinforces: true,
  titleKey: 'ep48Title',
  goalKey: 'ep48Goal',
  canDoId: 'describe_a_person_or_place',
  canDoNameKey: 'ep48CanDoName',
  durationKey: 'ep48Duration',
  estimatedMinutes: 11,
  xp: 90,
  prerequisites: ['i_like_it_because'],
  skillPrerequisites: ['describe_a_person_or_place', 'compare_two_things', 'express_an_opinion_with_a_reason'],
  gardenItems: [],
  reuseSkills: ['describe_a_person_or_place', 'compare_two_things', 'express_an_opinion_with_a_reason'],
  steps: [
    /* Remember: yesterday's justified choice, because today asks for the whole sequence at once. */
    { type: 'recall', review: true, instructionKey: 'ep48RecallInstruction', evalKind: 'state_opinion_with_reason', itemIds: ['because_reason_pattern'] },
    /* No suggestion appears again from here to the end of the episode — the arc's own autonomy target. */
    { type: 'scene', mood: 'welcoming', titleKey: 'ep48SceneTitle', bodyKey: 'ep48SceneBody', showGoal: true, ctaKey: 'ep48Start' },
    /*
     * THE STORY. Two real, differently-described options, held in view at once —
     * the blueprint's own reason for a hosted story here rather than two separate
     * exchanges. This is what does the describing; the learner's turns start below.
     * PERSONALIZATION SLOT: place (two cafés/neighbourhoods) — neutral fallback.
     */
    { type: 'mini_story', storyObjective: 'compare_two_places_story', instructionKey: 'ep48StoryInstruction' },
    /* Open production 1: compare the two places the story just held in view. Unaided. */
    { type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: 'So — one is small and quiet, the other is big and friendly. Which one is quieter? Which one is cheaper?', instructionKey: 'ep48CompareInstruction',
      evalKind: 'compare_things', itemIds: ['comparative_pattern'] },
    /* Open production 2: justify the choice the comparison just made. Unaided. */
    { type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: 'Which one would you choose, and why?', instructionKey: 'ep48ChooseInstruction',
      evalKind: 'state_opinion_with_reason', itemIds: ['because_reason_pattern'] },
    /*
     * Open production 3: a partner who disagrees and gives their own reason — the
     * blueprint's own receptiveTarget — answered unaided. Real disagreement, not a
     * wrong-answer trap: both choices are reasonable, which is the point.
     */
    { type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: 'Maya disagrees: “Really? I’d choose the other one — it’s friendlier.” What do you say?', instructionKey: 'ep48DisagreeInstruction',
      evalKind: 'state_opinion_with_reason', itemIds: ['because_reason_pattern'] },
    /*
     * Remember: the whole shape at once, nothing on screen — description,
     * comparison and a justified opinion, which is exactly the blueprint's
     * integrated evidence line.
     */
    { type: 'recall', instructionKey: 'ep48FinalInstruction', evalKind: 'describe_person_or_place', itemIds: ['multi_attribute_pattern', 'comparative_pattern', 'because_reason_pattern'] },
    { type: 'completion', canDoNameKey: 'ep48CanDoName', titleKey: 'ep48CloseTitle', bodyKey: 'ep48CloseBody', ctaKey: 'ep1CloseCta' },
  ],
}

export const A2_ARC3 = [PLACES_01, PLACES_02, PLACES_03, PLACES_04]
export const A2_ARC3_ID = 'people_and_places'
export const getA2Arc3Episode = (id) => A2_ARC3.find(ep => ep.id === id) || null
