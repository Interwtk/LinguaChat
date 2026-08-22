/*
 * A2 arc 7 — "Do you want to...?" (`lets_do_something`, episodes 58–61).
 *
 * Derived from docs/curriculum/blueprints/a2.json#arcs[order=7] and its own
 * words for the problem it solves: "The learner can agree to meet once
 * somebody else proposes it, but cannot open the exchange themselves, cannot
 * decline gracefully, and cannot keep a conversation going once the main
 * business is settled." Written against `docs/curriculum/implementation/a2/
 * authoring-conventions.md` (schema, step vocabulary, i18n and evalKind rules)
 * and modelled structurally on `episodes/a1Arc1.js` (the schema/quality bar)
 * and `episodes/a1Arc5.js` (A1's own closing arc — the same convergence role
 * this arc plays for A2).
 *
 * WHY THIS ARC CLOSES THE LEVEL. The blueprint places it last "because it
 * needs future plans, a reason clause and a sequencing connector all at once,
 * and it is A2's true convergence point — the same role A1's
 * making_arrangements arc played for A1." Concretely, it draws on THREE
 * earlier arcs at once: `making_plans` (arc 2, future intention —
 * `going_to_future_pattern`), `people_and_places` (arc 3, `because_reason_
 * pattern` — a decline without a reason reads as rude), and `everyday_
 * problems` (arc 6, `report_a_problem`, used narratively here as the
 * complication that makes episode 61's plan fall through, not taught again
 * as a new capability). Nothing before this arc asked the learner to open an
 * exchange nobody scripted for them, decline one they genuinely cannot do, or
 * keep talking past the first "no" — the ceiling A1 could not reach: A1's own
 * arrange_to_meet assumed both people already wanted to meet, and A1's
 * interaction ceiling topped out at 10–12 turns with no topic change and no
 * reason clause. This arc's conversationTarget is 16 meaningful turns
 * (14–18 range), the LONGEST in the whole level.
 *
 * TWO NEW INTENTS, NOT THREE. `a2.json#intentStrategy.newIntents` lists
 * exactly `invite_someone` and `respond_to_invitation` for this arc's family
 * — there is no third intent for `keep_a_longer_conversation_going`. That is
 * a deliberate design decision, not an omission: the capstone canDo reuses
 * `respond_to_invitation` with `clause_connector_pattern` layered on top (a
 * two-clause reply to the same kind of turn), exactly matching the
 * blueprint's own `explosionGuard` ("an arc needing more than three new
 * intents is teaching phrases, not a capability") and precisely how
 * `a1Arc5.js` justified spending `buy_something`'s hybrid label on a reused
 * frame rather than a new intent invented to justify it. Every `respond_to_
 * invitation` step below that is really doing `keep_a_longer_conversation_
 * going`'s job carries `clause_connector_pattern` in its `itemIds` and says
 * so in its comment.
 *
 * THE RISK, NAMED IN THE BLUEPRINT: "Could read as a second arrange_to_meet
 * with new vocabulary." Mitigated the way the blueprint itself prescribes:
 * episode 58 makes the learner open the exchange (nobody proposes first),
 * episode 59 makes a genuine decline-with-reason mandatory evidence (not
 * optional), episode 60 forces one real topic change bridged by a connector,
 * and episode 61 — the level's true exit — makes the learner's own first
 * idea fall through and requires them to decline/adapt AND repropose, with a
 * genuine branch: reproposing the original activity on a new day and
 * proposing a different activity outright are BOTH correct (flagged for
 * `levels/a2/evaluators.js`, own task, to accept either surface form under
 * the same `invite_someone` intent — see episode 61's `ep61ProposeInstruction`
 * step comment).
 *
 * AUTONOMY, ARC-WIDE: "late: unaided by default; support only after a wrong
 * answer; the closing story withholds the suggestion throughout." This is a
 * stricter posture than most earlier A2 arcs (which fade support across an
 * arc): here `suggestionEn` is withheld by default from the arc's very first
 * episode, matching each episode's own evidence target ("two unaided
 * invitations", "two unaided responses", "one unaided turn holding two
 * connected clauses"), not only its last. The few `suggestionEn` values that
 * do appear are on turns the blueprint's own per-episode evidence target does
 * NOT require to be unaided (episode 59's second insistence-handling turn,
 * beyond its two required unaided responses; episode 60's first, easier
 * open turn, beyond its one required unaided connector turn). Episode 61 has
 * NO `suggestionEn` anywhere, exactly as the blueprint demands.
 *
 * DELAYED RETRIEVAL, NAMED IN a2.md §16 AND §11: episode 61 must retrieve
 * `talk_about_what_you_did` (taught in episode 39, twenty-two episodes
 * earlier) and `express_an_opinion_with_a_reason` (taught in episode 47)
 * "arcs away from [their] home", inside the level's closing story. Episode
 * 61's opening `recall` step targets the former directly; its topic-shift
 * turn (`ep61ConnectInstruction`) carries `because_reason_pattern` in its
 * `itemIds` for the latter. Neither is a coincidental item choice.
 *
 * VOCABULARY BUDGET: newProductive 10, newReceptive 8
 * (`a2.json#arcs[].vocabularyBudget`). Spent as three PATTERN items
 * (`invitation_pattern`, `accept_decline_reason_pattern`,
 * `clause_connector_pattern` — one per new/extended pattern) and seven
 * vocabulary items across the four episodes: `go_to_the_cinema`, `have_
 * dinner` (58); `id_love_to`, `im_busy` (59); `last_time`, `really_good`
 * (60); `go_for_a_walk` (61) — 3 + 7 = 10 exactly, none left unspent and none
 * overspent.
 *
 * PERSONALIZATION (arc marked `themed` in the blueprint, compatible slot
 * `activity` — what is proposed): every activity noun below (`go_to_the_
 * cinema`, `have_dinner`, `go_for_a_walk`) is written as the NEUTRAL
 * fallback literally, per `a2.md`§7's table ("a generic activity — 'go to
 * the cinema'"), with an inline comment at first use marking the semantic
 * slot type (`activity`) the personalization engine would substitute once
 * wired in. No specific learner interest is hardcoded.
 *
 * SEMANTIC NEEDS (`activity`, `future_time`, `day`): `future_time` and `day`
 * are satisfied entirely through reuse — `future_time_expression_pattern`
 * from arc 2 (`making_plans`) and weekday vocabulary already carried by A1's
 * `say_when_something_happens` (this arc's own `a1Reuse` list) — so no new
 * vocabulary item is spent on either; only `activity` needed new productive
 * items, which is exactly what the budget above reflects.
 *
 * FACT CAPTURED: `preferred_activity` (`a2.json#arcs[].factsCaptured`). Per
 * `docs/curriculum/blueprints/a2.json#coreEngineRequirements`'s privacy note
 * on the neighbouring `spell_a_name_for_a_booking` capability, this file
 * does not implement fact capture (that is engine/core work); it only notes
 * that the activity the learner proposes across episodes 58 and 61 is the
 * kind of value that capability would be expected to remember.
 */

/*
 * 58 — "Do you want to...?"
 *
 * Blueprint: primary, canDo `invite_someone_to_do_something` (required),
 * situation "The learner proposes something nobody has agreed to yet",
 * novelty medium, budget 4, ONE new pattern (`invitation_pattern`), reuse
 * `going_to_future_pattern`/`express_preferences`, two open productions,
 * integrated reuse of `talk_about_future_plans`, prerequisites NONE (the
 * capability, not the episode number, gates it — same rule
 * `a1Arc1.js`'s WORK_01 states for itself), evidence "two unaided
 * invitations".
 *
 * BOTH open productions are unaided: the evidence target asks for two, not
 * one-guided-one-unaided the way several earlier A2 arcs are built, matching
 * this arc's arc-wide "late" autonomy target from its very first episode.
 * The guided step (the blueprint's own `guided_reply` format cue) is carried
 * by the `fill_blank` step instead, exactly as `a1Arc1.js` maps that cue.
 */
const LDS_01 = {
  id: 'do_you_want_to',
  arc: 'lets_do_something',
  level: 'A2',
  role: 'primary',
  titleKey: 'ep58Title',
  goalKey: 'ep58Goal',
  canDoId: 'invite_someone_to_do_something',
  canDoNameKey: 'ep58CanDoName',
  durationKey: 'ep58Duration',
  estimatedMinutes: 9,
  xp: 75,
  prerequisites: [],
  skillPrerequisites: ['talk_about_future_plans', 'arrange_to_meet'],
  gardenItems: ['invitation_pattern', 'go_to_the_cinema', 'have_dinner'],
  reuseSkills: ['talk_about_future_plans', 'express_preferences'],
  steps: [
    /* Remember: a plan you can already state, before this episode teaches you to open with one. */
    { type: 'recall', review: true, instructionKey: 'ep58RecallInstruction', evalKind: 'state_future_plan', itemIds: ['going_to_future_pattern'] },
    { type: 'scene', mood: 'curious', titleKey: 'ep58SceneTitle', bodyKey: 'ep58SceneBody', showGoal: true, ctaKey: 'ep58Start' },
    /*
     * Discover: the frame in both its exponents at once, exactly as the
     * pattern record states them — "Would you like to ___? Do you want to
     * ___?" — over two neutral activities. `go_to_the_cinema` / `have_
     * dinner` are the `activity` personalization slot's neutral fallback
     * (a2.md§7); a themed learner would see a different pair here once the
     * personalization engine is wired in.
     */
    { type: 'model', target: 'Would you like to go to the cinema? Do you want to have dinner on Saturday?',
      meaningItems: ['invitation_pattern', 'go_to_the_cinema', 'have_dinner'], explainKey: 'ep58ModelExplain' },
    { type: 'comprehension', instructionKey: 'ep58ComprehensionInstruction', target: 'Do you want to come with me on Saturday?', itemId: 'invitation_pattern',
      options: [{ key: 'ep58CompOptCorrect', correct: true }, { key: 'ep58CompOptWrong1' }, { key: 'ep58CompOptWrong2' }] },
    { type: 'word_order', instructionKey: 'ep58OrderInstruction', hintKey: 'ep1BuildHint',
      tokens: ['Would', 'you', 'like', 'to', 'go', 'to', 'the', 'cinema', '?'], itemId: 'invitation_pattern' },
    { type: 'fill_blank', instructionKey: 'ep58BlankInstruction', before: '', after: ' you like to have dinner on Saturday?',
      expects: 'Would', itemId: 'invitation_pattern', hintKey: 'ep58BlankHint' },
    /*
     * Open production 1 — UNAIDED. The evidence target is two unaided
     * invitations, not one guided and one unaided, so no suggestion is
     * offered even on the first one; the model/word_order/fill_blank steps
     * above already carried the guided support this new pattern needs.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'It’s the weekend, and you haven’t made a plan with me yet. Open the conversation — invite me to do something.', instructionKey: 'ep58OpenInstruction',
      evalKind: 'invite_someone', itemIds: ['invitation_pattern', 'go_to_the_cinema'] },
    /*
     * Receptive: the partner asks a clarifying question back — the
     * blueprint's own `receptiveTarget` for this episode.
     */
    { type: 'choice', instructionKey: 'ep58ListenInstruction', promptEn: 'You ask, “Do you want to have dinner on Saturday?” I say, “Saturday? What time?” What am I asking about?', itemId: 'invitation_pattern',
      options: [{ textEn: 'The time.', correct: true }, { textEn: 'The place.' }, { textEn: 'Whether you are free.' }] },
    /*
     * Open production 2 — UNAIDED, a different activity, integrated with
     * `talk_about_future_plans` (the blueprint's integrated-reuse entry):
     * inviting IS proposing a plan, just addressed to somebody else.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Ask me something else — invite me to do a different thing, on a different day.', instructionKey: 'ep58AgainInstruction',
      evalKind: 'invite_someone', itemIds: ['invitation_pattern', 'have_dinner'] },
    /* Remember: opening an exchange, unaided, with nothing on screen. */
    { type: 'recall', instructionKey: 'ep58FinalInstruction', evalKind: 'invite_someone', itemIds: ['invitation_pattern'] },
    { type: 'completion', canDoNameKey: 'ep58CanDoName', titleKey: 'ep58CloseTitle', bodyKey: 'ep58CloseBody', ctaKey: 'ep1CloseCta' },
  ],
}

/*
 * 59 — "I'd love to, but..."
 *
 * Blueprint: primary, canDo `accept_or_decline_with_a_reason` (required),
 * situation "Answering an invitation honestly, including a decline that
 * needs a reason", novelty medium, budget 3, ONE new pattern
 * (`accept_decline_reason_pattern`), reuse `because_reason_pattern`/
 * `invitation_pattern`, THREE open productions, integrated reuse of
 * `invite_someone_to_do_something` and `express_an_opinion_with_a_reason`,
 * prerequisites [58], evidence "two unaided responses, one acceptance and
 * one decline with a because-clause".
 *
 * The level's closing proof, stated in the canDo's own `why`: "a real
 * invitation needs a real answer; a decline without a reason reads as
 * rude." So `im_busy` — the reason — is not optional garnish; the decline
 * production below is graded on carrying it, not just on saying no.
 */
const LDS_02 = {
  id: 'id_love_to_but',
  arc: 'lets_do_something',
  level: 'A2',
  role: 'primary',
  titleKey: 'ep59Title',
  goalKey: 'ep59Goal',
  canDoId: 'accept_or_decline_with_a_reason',
  canDoNameKey: 'ep59CanDoName',
  durationKey: 'ep59Duration',
  estimatedMinutes: 10,
  xp: 80,
  prerequisites: ['do_you_want_to'],
  skillPrerequisites: ['invite_someone_to_do_something', 'express_an_opinion_with_a_reason'],
  gardenItems: ['accept_decline_reason_pattern', 'id_love_to', 'im_busy'],
  reuseSkills: ['invite_someone_to_do_something', 'express_an_opinion_with_a_reason'],
  steps: [
    /* Remember: yesterday's capability, because today answers it. */
    { type: 'recall', review: true, instructionKey: 'ep59RecallInstruction', evalKind: 'invite_someone', itemIds: ['invitation_pattern'] },
    { type: 'scene', mood: 'thinking', titleKey: 'ep59SceneTitle', bodyKey: 'ep59SceneBody', showGoal: true, ctaKey: 'ep59Start' },
    /* Discover: both directions of the frame at once — a genuine answer needs both. */
    { type: 'model', target: 'Yes, I’d like that! I’d love to, but I’m busy on Saturday.',
      meaningItems: ['accept_decline_reason_pattern', 'id_love_to', 'im_busy'], explainKey: 'ep59ModelExplain' },
    { type: 'comprehension', instructionKey: 'ep59ComprehensionInstruction', target: 'I’d love to, but I’m busy that day.', itemId: 'accept_decline_reason_pattern',
      options: [{ key: 'ep59CompOptCorrect', correct: true }, { key: 'ep59CompOptWrong1' }, { key: 'ep59CompOptWrong2' }] },
    /* The missing word is the reason itself, not the frame around it — the whole point of this episode. */
    { type: 'fill_blank', instructionKey: 'ep59BlankInstruction', before: 'I’d love to, but I’m ', after: ' on Saturday.',
      expects: 'busy', itemId: 'im_busy', hintKey: 'ep59BlankHint' },
    /* Receptive: telling an acceptance from a decline apart, before producing either. */
    { type: 'choice', instructionKey: 'ep59ChoiceInstruction', promptEn: 'Which one is a decline?', itemId: 'accept_decline_reason_pattern',
      options: [{ textEn: 'I’d love to, but I can’t.', correct: true }, { textEn: 'Yes, I’d like that!' }, { textEn: 'Sounds good, see you then.' }] },
    /* Open production 1 — ACCEPT, UNAIDED. Half of this episode's required evidence. */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Would you like to go to the cinema this weekend?', instructionKey: 'ep59AcceptInstruction',
      evalKind: 'respond_to_invitation', itemIds: ['accept_decline_reason_pattern'] },
    /*
     * Open production 2 — DECLINE WITH A REASON, UNAIDED. The other half of
     * this episode's required evidence, and the arc's closing proof: a
     * decline with no `because`/`im_busy` reason is a near miss, not a pass.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Do you want to have dinner on Saturday?', instructionKey: 'ep59DeclineInstruction',
      evalKind: 'respond_to_invitation', itemIds: ['accept_decline_reason_pattern', 'im_busy'] },
    /*
     * Open production 3 — beyond the two required-unaided turns above, so a
     * light suggestion is honest here rather than a shortcut: handling an
     * INSISTENCE a second time is the blueprint's own `receptiveTarget`, not
     * part of the two-response evidence count. `format: 'roleplay'` because
     * it continues the same exchange rather than opening a fresh one.
     */
    { type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: 'Oh, come on — are you sure? What about Sunday instead?', instructionKey: 'ep59InsistInstruction',
      evalKind: 'respond_to_invitation', suggestionEn: 'I’d love to, but I’m busy on Sunday too.', itemIds: ['accept_decline_reason_pattern'] },
    /* Remember: a decline with a reason, unaided, with nothing on screen. */
    { type: 'recall', instructionKey: 'ep59FinalInstruction', evalKind: 'respond_to_invitation', itemIds: ['accept_decline_reason_pattern', 'im_busy'] },
    { type: 'completion', canDoNameKey: 'ep59CanDoName', titleKey: 'ep59CloseTitle', bodyKey: 'ep59CloseBody', ctaKey: 'ep1CloseCta' },
  ],
}

/*
 * 60 — "And then..."
 *
 * Blueprint: primary, canDo `keep_a_longer_conversation_going` (should),
 * situation "The invitation exchange continues past its first resolution: a
 * related topic comes up once, held together with and/but/so", novelty
 * medium, budget 3, ONE new pattern (`clause_connector_pattern`), reuse
 * `ask_what_something_means` (A1) / `narrate_a_sequence_of_past_events`, two
 * open productions, integrated reuse of `accept_or_decline_with_a_reason`,
 * prerequisites [59], evidence "one unaided turn holding two connected
 * clauses across a topic change".
 *
 * The topic shift is GENUINE, per the task's own constraint: from confirming
 * the plan to briefly mentioning something related (what happened last time
 * they did this activity), bridged back with and/but/so — not just a longer
 * sentence about the same single topic. `evalKind: 'respond_to_invitation'`
 * is used throughout, per this file's header note: `keep_a_longer_
 * conversation_going` was never given its own intent in the blueprint; it
 * reuses `respond_to_invitation` with `clause_connector_pattern` layered on.
 */
const LDS_03 = {
  id: 'and_then',
  arc: 'lets_do_something',
  level: 'A2',
  role: 'primary',
  titleKey: 'ep60Title',
  goalKey: 'ep60Goal',
  canDoId: 'keep_a_longer_conversation_going',
  canDoNameKey: 'ep60CanDoName',
  durationKey: 'ep60Duration',
  estimatedMinutes: 10,
  xp: 80,
  prerequisites: ['id_love_to_but'],
  skillPrerequisites: ['accept_or_decline_with_a_reason', 'ask_what_something_means'],
  gardenItems: ['clause_connector_pattern', 'last_time', 'really_good'],
  reuseSkills: ['accept_or_decline_with_a_reason', 'narrate_a_sequence_of_past_events', 'ask_what_something_means'],
  steps: [
    /* Remember: yesterday's decline-with-reason, because today's turn has to hold two clauses, not just one. */
    { type: 'recall', review: true, instructionKey: 'ep60RecallInstruction', evalKind: 'respond_to_invitation', itemIds: ['accept_decline_reason_pattern'] },
    { type: 'scene', mood: 'curious', titleKey: 'ep60SceneTitle', bodyKey: 'ep60SceneBody', showGoal: true, ctaKey: 'ep60Start' },
    /*
     * Discover: `and` bridging an acceptance to a related past mention, then
     * `but` bridging a preference to a decision — the connector's range, not
     * one worked example.
     */
    { type: 'model', target: 'Yes, let’s go to the cinema, and last time we went, the film was really good.',
      response: 'I don’t like horror films, but I’d like to see something else.',
      meaningItems: ['clause_connector_pattern', 'last_time', 'really_good'], explainKey: 'ep60ModelExplain' },
    { type: 'comprehension', instructionKey: 'ep60ComprehensionInstruction', target: 'That sounds good, but I need to check the time first.', itemId: 'clause_connector_pattern',
      options: [{ key: 'ep60CompOptCorrect', correct: true }, { key: 'ep60CompOptWrong1' }, { key: 'ep60CompOptWrong2' }] },
    /*
     * REUSE, RECEPTIVE ONLY: the blueprint lists `ask_what_something_means`
     * as reused language here, not as this episode's integrated-reuse
     * target — so it is exercised as comprehension of when the move applies,
     * not as a graded production, exactly matching the blueprint's own
     * distinction between `reusedLanguage` and `integratedReuse`.
     */
    { type: 'choice', instructionKey: 'ep60MeaningInstruction', promptEn: 'I say, “Let’s meet at the usual spot.” You don’t know “spot.” What do you ask?', itemId: 'ask_what_something_means',
      options: [{ textEn: 'What does “spot” mean?', correct: true }, { textEn: 'Where is the cinema?' }, { textEn: 'What time is it?' }] },
    { type: 'fill_blank', instructionKey: 'ep60BlankInstruction', before: 'Let’s go to the cinema, ', after: ' I need to check the time.',
      expects: 'but', itemId: 'clause_connector_pattern', hintKey: 'ep60BlankHint' },
    /*
     * Open production 1 — beyond the one required-unaided connector turn
     * below, so a light suggestion is honest here: a simple accept-plus-
     * bridge, easier than the genuine topic change still to come.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Do you want to go to the cinema this weekend?', instructionKey: 'ep60OpenInstruction',
      evalKind: 'respond_to_invitation', suggestionEn: 'Yes, I’d like that, and I haven’t been in a long time.', itemIds: ['accept_decline_reason_pattern', 'clause_connector_pattern'] },
    /*
     * Open production 2 — UNAIDED. The episode's whole evidence target: a
     * GENUINE topic shift (unrelated news about a new cinema), which the
     * learner has to bridge back to the plan with and/but/so rather than
     * just answering it as a new question. `format: 'roleplay'` because it
     * continues the same exchange the open turn above started.
     */
    { type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: 'Great — Saturday, then! Oh, by the way, did you hear? There’s a new cinema downtown with much cheaper tickets. Should we try that instead, or go to our usual one?', instructionKey: 'ep60ConnectInstruction',
      evalKind: 'respond_to_invitation', itemIds: ['clause_connector_pattern', 'accept_decline_reason_pattern'] },
    /* Remember: holding two clauses together across a shift, unaided, with nothing on screen. */
    { type: 'recall', instructionKey: 'ep60FinalInstruction', evalKind: 'respond_to_invitation', itemIds: ['clause_connector_pattern'] },
    { type: 'completion', canDoNameKey: 'ep60CanDoName', titleKey: 'ep60CloseTitle', bodyKey: 'ep60CloseBody', ctaKey: 'ep1CloseCta' },
  ],
}

/*
 * 61 — "Let's do something else"
 *
 * Blueprint: primary, canDo `accept_or_decline_with_a_reason` again
 * (closing/integrated), situation "The level's closing story: an invitation,
 * a decline with a reason, a complication (the first idea is unavailable,
 * echoing everyday_problems), a new plan, and a confirmation", novelty low,
 * budget 1, NO new patterns, SIX open productions, integrated reuse of
 * `invite_someone_to_do_something`, `accept_or_decline_with_a_reason`,
 * `keep_a_longer_conversation_going`, `talk_about_future_plans`,
 * `arrange_to_meet` and `report_a_problem`, prerequisites [60], evidence
 * "integrated: the level's exit conversation, held with support withheld,
 * including one decline-and-repropose branch".
 *
 * THIS IS THE A2 LEVEL'S FINAL EPISODE. NO `suggestionEn` anywhere in it, per
 * the arc's autonomy target ("the closing story withholds the suggestion
 * throughout"). The six open productions carry the whole arrangement:
 * invite -> the plan hits a complication (the cinema is unavailable,
 * `report_a_problem`'s shape reused narratively, not retaught) -> decline/
 * adapt with a reason -> propose an alternative (THE BRANCH — see
 * `ep61ProposeInstruction` below) -> one genuine topic shift, reusing
 * episode 60's connector work -> confirmation -> a warm close reusing
 * `close_an_encounter` (A1). Delayed retrieval of `talk_about_what_you_did`
 * and `express_an_opinion_with_a_reason`, required by `a2.md`§16, is carried
 * by the opening `recall` step and by `because_reason_pattern` in the
 * topic-shift turn's `itemIds` respectively — see this file's header note.
 */
const LDS_04 = {
  id: 'lets_do_something_else',
  arc: 'lets_do_something',
  level: 'A2',
  role: 'primary',
  titleKey: 'ep61Title',
  goalKey: 'ep61Goal',
  canDoId: 'accept_or_decline_with_a_reason',
  canDoNameKey: 'ep61CanDoName',
  durationKey: 'ep61Duration',
  estimatedMinutes: 14,
  xp: 110,
  prerequisites: ['and_then'],
  skillPrerequisites: ['invite_someone_to_do_something', 'accept_or_decline_with_a_reason', 'keep_a_longer_conversation_going'],
  gardenItems: ['go_for_a_walk'],
  reuseSkills: ['invite_someone_to_do_something', 'accept_or_decline_with_a_reason', 'keep_a_longer_conversation_going', 'talk_about_future_plans', 'arrange_to_meet', 'report_a_problem'],
  steps: [
    /*
     * DELAYED RETRIEVAL: `talk_about_what_you_did`, taught in episode 39 —
     * twenty-two episodes and six arcs away — retrieved here unaided, with
     * nothing on screen, exactly as `a2.md`§16 requires of this episode.
     */
    { type: 'recall', review: true, instructionKey: 'ep61RecallInstruction', evalKind: 'state_past_event', itemIds: ['simple_past_regular_pattern'] },
    { type: 'scene', mood: 'welcoming', titleKey: 'ep61SceneTitle', bodyKey: 'ep61SceneBody', showGoal: true, ctaKey: 'ep61Start' },
    /*
     * Open production 1 — INVITE, UNAIDED. The exchange nobody scripted for
     * the learner, exactly as episode 58 first asked for it, now with no
     * scaffolding steps ahead of it at all.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'It’s Friday, and you haven’t made a plan for the weekend yet. Open the conversation.', instructionKey: 'ep61OpenInstruction',
      evalKind: 'invite_someone', itemIds: ['invitation_pattern', 'go_to_the_cinema'] },
    /*
     * Receptive: the complication, narrated in `report_a_problem`'s own
     * shape ("There's a problem with...") — reused, not retaught, exactly
     * as this arc's `a2Reuse` entry for `report_a_problem` specifies.
     */
    { type: 'comprehension', instructionKey: 'ep61ComprehensionInstruction', target: 'Oh no — I just heard the cinema is closed this weekend. There’s a problem with the building.', itemId: 'problem_report_pattern',
      options: [{ key: 'ep61CompOptCorrect', correct: true }, { key: 'ep61CompOptWrong1' }, { key: 'ep61CompOptWrong2' }] },
    /*
     * THE HOSTED STORY. The blueprint asks for it by name: "an invitation, a
     * decline with a reason, a complication..., a new plan, and a
     * confirmation, with a branch where accepting the original and
     * proposing a new plan are both correct." The actual `STORIES` table
     * entry (`storyObjective: 'closing_invitation_story'`) is core-engine
     * work, listed in `core-requirements.md`; this step is written anyway,
     * exactly as A1's closing arc wrote its own hosted-story step ahead of
     * that table existing.
     */
    { type: 'mini_story', storyObjective: 'closing_invitation_story', instructionKey: 'ep61StoryInstruction' },
    /*
     * Open production 2 — DECLINE/ADAPT WITH A REASON, UNAIDED. Not a
     * partner declining the learner's invitation, but the learner's own
     * first idea falling through: the same accept-or-decline shape,
     * pointed at a plan instead of a person, bridged with `but`.
     */
    { type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: 'The cinema is closed. What do you say?', instructionKey: 'ep61AdaptInstruction',
      evalKind: 'respond_to_invitation', itemIds: ['accept_decline_reason_pattern', 'clause_connector_pattern'] },
    /*
     * Open production 3 — PROPOSE AN ALTERNATIVE, UNAIDED. THE BRANCH the
     * blueprint names by id: re-proposing the ORIGINAL activity on a
     * different day (reusing `arrange_to_meet`/`talk_about_future_plans`)
     * and proposing a genuinely DIFFERENT activity (`go_for_a_walk`, this
     * episode's one new item) are both correct answers to the same turn.
     * Flagged for `levels/a2/evaluators.js` (own task): the reference
     * implementation for `invite_someone` must accept either surface
     * realization here, not just the one this file happens to list first
     * in `itemIds`.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'What do you say now? Suggest something.', instructionKey: 'ep61ProposeInstruction',
      evalKind: 'invite_someone', itemIds: ['invitation_pattern', 'go_for_a_walk', 'go_to_the_cinema'] },
    /*
     * Open production 4 — GENUINE TOPIC SHIFT, UNAIDED. Reuses episode 60's
     * `keep_a_longer_conversation_going` work by name (this episode's
     * integrated-reuse list). `because_reason_pattern` in `itemIds` is the
     * second required delayed retrieval: `express_an_opinion_with_a_reason`,
     * taught in episode 47, surfacing here unrehearsed.
     */
    { type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: 'Sounds good! Oh — did you hear the new bakery near the park just opened?', instructionKey: 'ep61ConnectInstruction',
      evalKind: 'respond_to_invitation', itemIds: ['clause_connector_pattern', 'because_reason_pattern', 'last_time'] },
    /* Open production 5 — CONFIRMATION, UNAIDED: the plan, settled. */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'So — same time on Saturday?', instructionKey: 'ep61ConfirmInstruction',
      evalKind: 'respond_to_invitation', itemIds: ['accept_decline_reason_pattern', 'going_to_future_pattern'] },
    /*
     * Open production 6 — THE WARM CLOSE, UNAIDED. Reuses `close_an_
     * encounter` (A1), the arc's own a1Reuse entry, exactly as the
     * blueprint's `productionTarget` asks for "the whole arrangement,
     * unaided" to end the way every A1 encounter already knew how to end.
     */
    { type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: 'Great, it’s a plan! I’ll see you Saturday.', instructionKey: 'ep61CloseInstruction',
      evalKind: 'close_encounter', itemIds: ['bye'] },
    /* Remember: the whole shape, unaided, with nothing on screen — the level's last word on this arc. */
    { type: 'recall', instructionKey: 'ep61FinalInstruction', evalKind: 'respond_to_invitation', itemIds: ['accept_decline_reason_pattern', 'clause_connector_pattern'] },
    { type: 'completion', canDoNameKey: 'ep61CanDoName', titleKey: 'ep61CloseTitle', bodyKey: 'ep61CloseBody', ctaKey: 'ep61CloseCta' },
  ],
}

export const A2_ARC7 = [LDS_01, LDS_02, LDS_03, LDS_04]
export const A2_ARC7_ID = 'lets_do_something'
export const getA2Arc7Episode = (id) => A2_ARC7.find(ep => ep.id === id) || null
