/*
 * A2 arc 2 — "What's next" (`making_plans`, episodes 43–44).
 *
 * Derived from docs/curriculum/blueprints/a2.json, arc `making_plans`, order 2.
 * The arc's own words for the problem it solves: "A1's arrangement needed
 * somebody to already be arranging something. The learner cannot volunteer a
 * plan of their own, or ask about somebody else's, outside that one frame."
 *
 *   43 im_going_to          talk_about_future_plans   the statement, contrasted
 *                                                      against yesterday's past
 *   44 are_you_going_to     ask_about_future_plans     the question
 *
 * WHY NOW, AND WHY SYMMETRIC. This arc sits directly after `what_happened`
 * (docs/curriculum/implementation/a2/authoring-conventions.md's arc-1 file,
 * episodes 39–42) on purpose: "same clause shape, opposite time direction."
 * `I worked yesterday` and `I'm going to work tomorrow` are the same
 * skeleton — subject, time word, verb — pointed the other way. That symmetry is
 * the whole arc's pedagogy, not an incidental resemblance.
 *
 * THE RISK, NAMED IN THE BLUEPRINT: "Confusing 'going to' with the level's own
 * past tense taught two episodes earlier. Mitigated by contrastive practice:
 * every episode 43 item pairs a past sentence (recap) with a future one (new)."
 * This file honours that literally, not just in a comment: episode 43 opens
 * with a `recall` of yesterday's capability (`evalKind: 'state_past_event'`)
 * before the future pattern is even modelled, the model step's own target
 * sentence contains BOTH a past clause and a future clause side by side, the
 * comprehension check is a distinguish-past-from-future judgement, and the
 * choice step hands the learner two people — one talking about last week, one
 * about next week — and asks which one is the plan. The two open productions
 * and the closing recall are future-only, because independent evidence for
 * `talk_about_future_plans` has to be the future frame alone, unaided; the
 * contrast is the scaffolding that gets the learner there, not a permanent
 * feature of every single turn.
 *
 * CROSS-ARC PREREQUISITE, HANDLED THE WAY THE CONVENTIONS DOC SAYS TO. Episode
 * 43's blueprint entry lists `prerequisites: [42]` (the last episode of
 * `what_happened`), but that file is being authored in parallel by another
 * agent and its stable episode-local id is not something this file should
 * guess at or hardcode. Per authoring-conventions.md §"Episode object schema":
 * "capability readiness comes from skillPrerequisites, not episode order,
 * exactly as a1Arc1.js's WORK_01 comment explains." So episode 43's
 * `prerequisites` is `[]`, exactly like an arc's first episode always is in
 * the A1 precedent, and the real dependency lives in `skillPrerequisites`
 * (`talk_about_what_you_did`, plus the two A1 canDos the new capability's own
 * blueprint entry lists) and in the canonical pattern id used for the recap
 * (`past_time_expression_pattern` — a blueprint-level id, not a literal
 * sentence borrowed from the other file).
 *
 * NO MINI STORY. `miniStory.use: false` — "Two episodes and a clean symmetric
 * structure; the value is in the learner's own plan, not a narrated one." No
 * `mini_story` step appears anywhere in this file.
 *
 * VOCABULARY BUDGET, DELIBERATELY UNDERSPENT. `newProductive: 6, newReceptive:
 * 4` across the whole arc, and the blueprint calls this "a small, deliberately
 * light arc": the two new patterns (`going_to_future_pattern`,
 * `future_time_expression_pattern`) already cover "tomorrow / next week / this
 * weekend" as realisations of ONE pattern — exactly as A1's
 * `part_of_day_pattern` covers morning/afternoon/evening without a separate
 * item per word — so this arc only spends its productive budget on activity
 * verbs: `relax` and `go_shopping` (episode 43), `visit` (episode 44). Three of
 * six productive items spent, on purpose: the frame is the point, not a list of
 * weekend activities the learner cannot use anywhere else, echoing arc 1's own
 * `i_do_pattern` risk note almost exactly.
 *
 * REUSE, NOT REVIEW. Episode 43 integrates `arrange_to_meet` (A1, designed-only
 * per CLAUDE.md — arcs 6–7 of A1 are frozen-designed and not yet built — so
 * this file reuses ONLY its canonical blueprint ids, `day_of_week_pattern` and
 * `arrange_pattern`, and its canonical evalKind, `arrange_meeting`, never
 * literal file text that does not exist yet). Episode 44 integrates
 * `talk_about_future_plans` back into the question turn, so the learner both
 * asks and is asked in the same episode. The arc's declared `a2Reuse`,
 * `narrate_a_sequence_of_past_events`, is honoured receptively inside episode
 * 43's own comprehension step (Lingua narrates a two-clause past sequence)
 * rather than asked of the learner — the arc's whole production budget is
 * already spoken for by the two new capabilities, and CLAUDE.md's QA table
 * warns against a pedagogical shortcut that rewards recognition as mastery, so
 * this reuse stays receptive rather than being counted as new evidence.
 *
 * All prose lives behind i18n keys (see levels/a2/i18n/en.js, a separate
 * authoring task) and every English target is literal, never translated,
 * exactly as CLAUDE.md's language-architecture section requires.
 */

/*
 * 43 — "I'm going to..."
 *
 * Blueprint: primary, canDo `talk_about_future_plans` (required), situation
 * "Lingua asks what the learner is going to do this weekend, contrasted
 * against yesterday", novelty high, new-language budget 4, TWO new patterns
 * (`going_to_future_pattern`, `future_time_expression_pattern`), reuse
 * `time_at_pattern` / "arrange_to_meet language", two open productions,
 * integrated reuse of `arrange_to_meet`, prerequisites [] (see the file header
 * on why — the blueprint's own [42] is a cross-arc dependency this file
 * resolves through skillPrerequisites instead), evidence "two unaided
 * future-plan statements, correctly contrasted with a past recap".
 */
const PLANS_01 = {
  id: 'im_going_to',
  arc: 'making_plans',
  level: 'A2',
  role: 'primary',
  titleKey: 'ep43Title',
  goalKey: 'ep43Goal',
  canDoId: 'talk_about_future_plans',
  canDoNameKey: 'ep43CanDoName',
  durationKey: 'ep43Duration',
  estimatedMinutes: 9,
  xp: 75,
  prerequisites: [],
  skillPrerequisites: ['arrange_to_meet', 'say_when_something_happens', 'talk_about_what_you_did'],
  gardenItems: ['going_to_future_pattern', 'future_time_expression_pattern', 'relax', 'go_shopping'],
  reuseSkills: ['talk_about_what_you_did', 'narrate_a_sequence_of_past_events', 'arrange_to_meet'],
  steps: [
    /*
     * Remember FIRST, before anything new is on screen: the past-tense
     * capability this whole episode is contrasted against. This is the risk
     * mitigation's opening move, not a generic warm-up recall.
     */
    { type: 'recall', review: true, instructionKey: 'ep43RecallInstruction', evalKind: 'state_past_event', itemIds: ['past_time_expression_pattern'] },
    { type: 'scene', mood: 'curious', titleKey: 'ep43SceneTitle', bodyKey: 'ep43SceneBody', showGoal: true, ctaKey: 'ep43Start' },
    /*
     * Discover: the new frame, modelled AS a contrast. Both clauses are the
     * literal target — past first, future second — so the pairing the risk
     * note asks for is in the very first thing the learner reads about
     * `going_to_future_pattern`, not just in a comment above it.
     */
    { type: 'model', target: 'Yesterday I worked. This weekend, I’m going to relax.', meaningItems: ['going_to_future_pattern', 'future_time_expression_pattern'], explainKey: 'ep43ModelExplain' },
    /*
     * Comprehend: distinguish a plan told back from a past account — the
     * blueprint's own `receptiveTarget`, word for word. This step also
     * receptively carries the arc's declared `a2Reuse`
     * (`narrate_a_sequence_of_past_events`): Lingua's own two-clause past
     * narration is the material being judged, never something the learner has
     * to produce here.
     */
    { type: 'comprehension', instructionKey: 'ep43ComprehensionInstruction', target: 'I’m going to visit my parents next week.', itemId: 'future_time_expression_pattern',
      options: [{ key: 'ep43CompOptCorrect', correct: true }, { key: 'ep43CompOptWrong1' }, { key: 'ep43CompOptWrong2' }] },
    /*
     * The explicit past/future pair the risk note asks for, as a decision
     * rather than a statement: two people, two time directions, one question.
     */
    { type: 'choice', instructionKey: 'ep43ChoiceInstruction', promptEn: 'Maya says, “I called my sister yesterday.” Leo says, “I’m going to call my sister tomorrow.” Who is talking about a plan?', itemId: 'going_to_future_pattern',
      options: [{ textEn: 'Leo.', correct: true }, { textEn: 'Maya.' }, { textEn: 'Neither of them.' }] },
    /* Build: the future frame, assembled before it has to be produced. */
    { type: 'word_order', instructionKey: 'ep43OrderInstruction', hintKey: 'ep1BuildHint',
      tokens: ['I’m', 'going', 'to', 'relax', 'this', 'weekend', '.'], itemId: 'going_to_future_pattern' },
    /* Guided: one word missing from the frame, the connector that makes it future. */
    { type: 'fill_blank', instructionKey: 'ep43BlankInstruction', before: 'I’m ', after: ' to relax this weekend.',
      expects: 'going', itemId: 'going_to_future_pattern', hintKey: 'ep43BlankHint' },
    /*
     * Open production 1. The model answer is on offer because the frame is
     * new — the arc's autonomy target, "early-to-mid: the contrast with the
     * just-taught past tense is the main support need, not the future form
     * itself" — so support here is for the CONTRAST, not withheld from the
     * form on principle.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'So, {name} — what are you going to do this weekend?', instructionKey: 'ep43OpenInstruction',
      // personalization slot: activity (neutral fallback below), future_time (neutral fallback "this weekend")
      evalKind: 'state_future_plan', suggestionEn: 'I’m going to relax this weekend.', itemIds: ['going_to_future_pattern', 'future_time_expression_pattern', 'relax'] },
    /*
     * REUSE, BECAUSE THE SITUATION NEEDS IT: a real plan invites a real
     * meeting. The blueprint lists `arrange_to_meet` as this episode's
     * integrated reuse, and this is where it earns its place — the learner's
     * own weekend plan turns into an actual arrangement, using ONLY the A1
     * capability's canonical patterns and evalKind (that A1 arc is
     * designed-only and not yet built, so nothing here borrows text from it).
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'That sounds nice. Maybe we could meet this weekend, too — what day is good for you?', instructionKey: 'ep43ArrangeInstruction',
      evalKind: 'arrange_meeting', suggestionEn: 'How about Saturday?', itemIds: ['day_of_week_pattern', 'arrange_pattern'] },
    /*
     * Open production 2, NO model, and prompted with the past once more so the
     * final unaided statement is still a contrast, not a bare drill. Second
     * independent use of `talk_about_future_plans`, in a different time frame
     * (tomorrow rather than this weekend) — the capability's own
     * `transfer: 1` evidence requirement.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'You told me about yesterday already. Now tell me — what are you going to do tomorrow?', instructionKey: 'ep43AgainInstruction',
      evalKind: 'state_future_plan', itemIds: ['going_to_future_pattern', 'future_time_expression_pattern', 'go_shopping'] },
    /* Remember: the future statement, unaided, with nothing on screen — the arc's delayed-retrieval evidence. */
    { type: 'recall', instructionKey: 'ep43FinalInstruction', evalKind: 'state_future_plan', itemIds: ['going_to_future_pattern', 'future_time_expression_pattern'] },
    { type: 'completion', canDoNameKey: 'ep43CanDoName', titleKey: 'ep43CloseTitle', bodyKey: 'ep43CloseBody', ctaKey: 'ep1CloseCta' },
  ],
}

/*
 * 44 — "Are you going to...?"
 *
 * Blueprint: primary, canDo `ask_about_future_plans` (should), situation "The
 * learner asks about somebody else's weekend plan", novelty low, new-language
 * budget 2, ONE new pattern (`going_to_question_pattern`), reuse
 * `going_to_future_pattern` / `do_you_question_pattern` (shipped as
 * `do_you_pattern` in a1Arc1.js — see note below), two open productions,
 * integrated reuse of `talk_about_future_plans`, prerequisites [43], evidence
 * "one unaided plan question plus comprehension of the reply".
 *
 * No `scene` step: the blueprint's own `likelyFormats` for this episode omits
 * it (unlike episode 43's), so this episode continues straight from episode
 * 43's scene rather than opening a new one — the low-novelty, single-pattern
 * shape the blueprint asks for.
 *
 * NAMING NOTE: a2.json's `reusedLanguage` for this episode says
 * `do_you_question_pattern`, matching the id in a1-blueprint.json's own
 * `patterns` table — but the live, shipped A1 code
 * (`episodes/a1Arc1.js`, episode 19) implements that exact pattern under the
 * id `do_you_pattern`. Per CLAUDE.md's sources-of-truth order ("the repo → the
 * tests → the curriculum contracts"), the shipped id wins, so `do_you_pattern`
 * is what this file would reference if it needed to cite that pattern
 * directly. In practice it does not: `going_to_question_pattern` fully carries
 * this episode's new question frame, and `do_you_pattern`'s relevance is
 * structural precedent (the same auxiliary-fronting shape, one level later),
 * not a pattern this episode drills again.
 */
const PLANS_02 = {
  id: 'are_you_going_to',
  arc: 'making_plans',
  level: 'A2',
  role: 'primary',
  titleKey: 'ep44Title',
  goalKey: 'ep44Goal',
  canDoId: 'ask_about_future_plans',
  canDoNameKey: 'ep44CanDoName',
  durationKey: 'ep44Duration',
  estimatedMinutes: 7,
  xp: 60,
  prerequisites: ['im_going_to'],
  skillPrerequisites: ['talk_about_future_plans'],
  gardenItems: ['going_to_question_pattern', 'visit'],
  reuseSkills: ['talk_about_future_plans'],
  steps: [
    /* Remember: yesterday's statement, because today's episode answers before it asks — the same shape a1Arc1.js's WORK_02 uses. */
    { type: 'recall', review: true, instructionKey: 'ep44RecallInstruction', evalKind: 'state_future_plan', itemIds: ['going_to_future_pattern'] },
    /* Discover: the question, as a two-turn model so the expected shape of a reply is visible too. */
    { type: 'model', target: 'Are you going to relax this weekend?', response: 'Yes, I am. I’m going to relax.', meaningItems: ['going_to_question_pattern'], explainKey: 'ep44ModelExplain' },
    /*
     * Comprehend a plan the learner did NOT expect — the blueprint's own
     * `receptiveTarget`. The question above primes "relax"; the reply
     * contradicts it, which is the whole point of the check.
     */
    { type: 'comprehension', instructionKey: 'ep44ComprehensionInstruction', target: 'No, I’m not. I’m going to work.', itemId: 'going_to_future_pattern',
      options: [{ key: 'ep44CompOptCorrect', correct: true }, { key: 'ep44CompOptWrong1' }, { key: 'ep44CompOptWrong2' }] },
    /* Guided: the missing auxiliary, which is the whole new pattern. */
    { type: 'fill_blank', instructionKey: 'ep44BlankInstruction', before: '', after: ' you going to visit your family this weekend?',
      expects: 'Are', itemId: 'going_to_question_pattern', hintKey: 'ep44BlankHint' },
    /* Open production 1: ask, with the model still available because the frame is new. */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'I have plans for the weekend too. Go on — ask me.', instructionKey: 'ep44OpenInstruction',
      evalKind: 'ask_future_plan', suggestionEn: 'Are you going to relax this weekend?', itemIds: ['going_to_question_pattern'] },
    /*
     * REUSE, INTEGRATED: the blueprint lists `talk_about_future_plans` as this
     * episode's integrated reuse, and this is the turn that honours it — once
     * the learner has asked, Lingua turns the question straight back, so the
     * statement capability is exercised inside the question episode rather
     * than left as a metadata claim nothing in the steps does.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'I’m going to visit my family. And you — what are you going to do?', instructionKey: 'ep44ReciprocalInstruction',
      evalKind: 'state_future_plan', itemIds: ['going_to_future_pattern', 'visit'] },
    /*
     * Open production 2, NO model: second person, unaided plan question — the
     * arc's own evidence target, "one unaided plan question".
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'This is Priya. She hasn’t told you her plans yet.', instructionKey: 'ep44AskAgainInstruction',
      evalKind: 'ask_future_plan', itemIds: ['going_to_question_pattern'] },
    /* Remember: the question, unaided, with nothing on screen. */
    { type: 'recall', instructionKey: 'ep44FinalInstruction', evalKind: 'ask_future_plan', itemIds: ['going_to_question_pattern'] },
    { type: 'completion', canDoNameKey: 'ep44CanDoName', titleKey: 'ep44CloseTitle', bodyKey: 'ep44CloseBody', ctaKey: 'ep1CloseCta' },
  ],
}

export const A2_ARC2 = [PLANS_01, PLANS_02]
export const A2_ARC2_ID = 'making_plans'
export const getA2Arc2Episode = (id) => A2_ARC2.find(ep => ep.id === id) || null
